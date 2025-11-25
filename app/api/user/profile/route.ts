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

        // Validate input
        if (!name || !email) {
            return NextResponse.json(
                { message: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email, _id: { $ne: session.user.id } });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email is already in use' },
                { status: 400 }
            );
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            session.user.id,
            { name, email },
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
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
