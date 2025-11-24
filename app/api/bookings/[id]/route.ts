import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/database/booking.model";

// DELETE - Cancel a booking by ID
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        // Check if booking exists
        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { message: 'Booking not found' },
                { status: 404 }
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
