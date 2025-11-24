import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/database/booking.model';
import Event from '@/database/event.model';

type RouteParams = {
    params: Promise<{
        userId: string;
    }>;
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await connectDB();

        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Find all bookings for this user and populate event details
        const bookings = await Booking.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        // Fetch event details for each booking
        const bookingsWithEvents = await Promise.all(
            bookings.map(async (booking) => {
                const event = await Event.findById(booking.eventId).lean();
                return {
                    ...booking,
                    event,
                };
            })
        );

        return NextResponse.json(
            {
                message: 'Bookings fetched successfully',
                bookings: bookingsWithEvents,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return NextResponse.json(
            { message: 'Failed to fetch bookings', error: 'Internal server error' },
            { status: 500 }
        );
    }
}
