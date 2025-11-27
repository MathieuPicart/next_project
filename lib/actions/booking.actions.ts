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

export const getUserBookings = async (userId: string) => {
    try {
        await connectDB();

        const bookings = await Booking.find({ userId })
            .populate('eventId', 'title slug date time location image')
            .sort({ createdAt: -1 })
            .lean();

        return bookings.map((booking: any) => ({
            _id: booking._id.toString(),
            email: booking.email,
            createdAt: new Date(booking.createdAt).toISOString(),
            event: booking.eventId ? {
                title: (booking.eventId as any).title,
                slug: (booking.eventId as any).slug,
                date: (booking.eventId as any).date,
                time: (booking.eventId as any).time,
                location: (booking.eventId as any).location,
                image: (booking.eventId as any).image,
            } : null,
        }));
    } catch (e) {
        console.error('get user bookings failed', e);
        return [];
    }
}

export const getUserBookingStats = async (userId: string) => {
    try {
        await connectDB();

        const today = new Date().toISOString().split('T')[0];

        const [totalBookings, upcomingBookings] = await Promise.all([
            Booking.countDocuments({ userId }),
            Booking.find({ userId })
                .populate('eventId', 'date')
                .lean()
                .then(bookings =>
                    bookings.filter(b =>
                        b.eventId && (b.eventId as any).date >= today
                    ).length
                ),
        ]);

        const pastBookings = totalBookings - upcomingBookings;

        return {
            total: totalBookings,
            upcoming: upcomingBookings,
            past: pastBookings,
        };
    } catch (e) {
        console.error('get user booking stats failed', e);
        return {
            total: 0,
            upcoming: 0,
            past: 0,
        };
    }
}