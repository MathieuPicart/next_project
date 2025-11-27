import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const { name, email } = await req.json();

        // Sanitize input
        const trimmedName = name?.trim();
        const trimmedEmail = email?.trim().toLowerCase();

        // Validate input
        if (!trimmedName || !trimmedEmail) {
            return NextResponse.json(
                { message: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email: trimmedEmail, _id: { $ne: session.user.id } });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email is already in use' },
                { status: 400 }
            );
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            session.user.id,
            { name: trimmedName, email: trimmedEmail },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({
            message: 'Profile update failed',
        }, { status: 500 });
    }
}
