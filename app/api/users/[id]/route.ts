import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";

// PATCH - Update user role
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
