import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import { auth } from "@/auth";

// PATCH - Update user role
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Ensure only authenticated admins can update roles
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        await connectDB();

        const { role } = await req.json();

        // Validate role
        if (!role || !['user', 'admin'].includes(role)) {
            return NextResponse.json(
                { message: 'Invalid role. Must be "user" or "admin"' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent admin from demoting themselves
        if (id === session.user.id && role === 'user' && user.role === 'admin') {
            return NextResponse.json(
                { message: 'You cannot demote yourself. Ask another admin to change your role.' },
                { status: 403 }
            );
        }

        // If demoting an admin to user, check if they're the last admin
        if (role === 'user' && user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });

            if (adminCount <= 1) {
                return NextResponse.json(
                    { message: 'Cannot demote the last admin. Promote another user to admin first.' },
                    { status: 400 }
                );
            }
        }

        // Update user role
        user.role = role;
        await user.save();

        return NextResponse.json({
            message: `User role updated to ${role} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('User role update error:', error);
        return NextResponse.json({
            message: 'User role update failed',
        }, { status: 500 });
    }
}
