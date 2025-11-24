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

        const bookingData: any = { eventId, slug, email };

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
                bookingId: existingBooking._id.toString()
            };
        }

        return { hasBooked: false };
    } catch (e) {
        console.error('check booking failed', e);
        return { hasBooked: false };
    }
}

export const cancelUserBooking = async (bookingId: string) => {
    try {
        await connectDB();

        await Booking.findByIdAndDelete(bookingId);

        return { success: true };
    } catch (e) {
        console.error('cancel booking failed', e);
        return { success: false };
    }
}