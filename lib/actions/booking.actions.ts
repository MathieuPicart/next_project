'use server';

import Booking from '@/database/booking.model';
import connectDB from "@/lib/mongodb";

export const createBooking = async ({
    eventId,
    slug,
    email,
    userId
}: {
    eventId: string;
    slug: string;
    email: string;
    userId?: string;
}) => {
    try {
        await connectDB();

        const bookingData: { eventId: string; slug: string; email: string; userId?: string } = { eventId, slug, email };

        // Add userId if provided (authenticated user)
        if (userId) {
            bookingData.userId = userId;
        }

        await Booking.create(bookingData);

        return { success: true };
    } catch (e) {
        console.error('create booking failed', e);
        return { success: false };
    }
}

export const checkUserBooking = async ({
    eventId,
    userId
}: {
    eventId: string;
    userId: string;
}) => {
    try {
        await connectDB();

        const existingBooking = await Booking.findOne({ eventId, userId }).lean();

        if (existingBooking) {
            return {
                hasBooked: true,
                bookingId: ((existingBooking as any)._id).toString()
            };
        }

        return { hasBooked: false };
    } catch (e) {
        console.error('check booking failed', e);
        return { hasBooked: false };
    }
}

export const cancelUserBooking = async (bookingId: string, userId: string) => {
    try {
        await connectDB();

        const booking = await Booking.findById(bookingId);

        if (!booking || booking.userId?.toString() !== userId) {
            return { success: false, error: 'Booking not found or unauthorized' };
        }

        await Booking.findByIdAndDelete(bookingId);

        return { success: true };
    } catch (e) {
        console.error('cancel booking failed', e);
        return { success: false };
    }
}

export const getEventBookingCount = async (eventId: string) => {
    try {
        await connectDB();
        return await Booking.countDocuments({ eventId });
    } catch (e) {
        console.error('get booking count failed', e);
        return 0;
    }
}

export const getUserBookingsWithEvents = async (userId: string) => {
    try {
        await connectDB();

        // Find all bookings for this user
        const bookings = await Booking.find({ userId })
            .sort({ createdAt: -1 })
            .populate('eventId', 'title slug date time location')
            .lean();

        // Transform the data to match the expected format
        return bookings.map((booking: any) => ({
            _id: booking._id.toString(),
            event: booking.eventId ? {
                title: booking.eventId.title,
                slug: booking.eventId.slug,
                date: booking.eventId.date,
                time: booking.eventId.time,
                location: booking.eventId.location,
            } : undefined,
            createdAt: booking.createdAt.toISOString(),
        }));
    } catch (e) {
        console.error('get user bookings failed', e);
        return [];
    }
}