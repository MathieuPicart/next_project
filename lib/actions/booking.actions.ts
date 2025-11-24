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