import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/database/booking.model";
import { auth } from "@/auth";

// DELETE - Cancel a booking by ID
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Add authentication check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        await connectDB();

        // Check if booking exists
        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { message: 'Booking not found' },
                { status: 404 }
            );
        }

        // Check if user owns this booking or is an admin
        const isOwner = booking.userId.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { message: 'Forbidden - You can only cancel your own bookings' },
                { status: 403 }
            );
        }

        // Delete the booking
        await Booking.findByIdAndDelete(id);

        return NextResponse.json({
            message: 'Booking cancelled successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Booking cancellation error:', error);
        return NextResponse.json({
            message: 'Booking cancellation failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
