'use server';

import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";

export const getAllEvents = async () => {
    try {
        await connectDB();

        const events = await Event.find()
            .sort({ createdAt: -1 })
            .lean();

        // Transform to plain objects with string IDs
        return events.map((event: any) => ({
            ...event,
            _id: event._id.toString(),
            createdAt: event.createdAt?.toISOString(),
            updatedAt: event.updatedAt?.toISOString(),
        }));
    } catch (e) {
        console.error('get all events failed', e);
        return [];
    }
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();
        const event = await Event.findOne<Event>({ slug }).lean();
        if (!event || !Array.isArray(event.tags) || event.tags.length === 0) {
            return [];
        }
        return await Event.find({
            _id: { $ne: event._id },
            tags: { $in: event.tags },
        }).lean();
    } catch (e) {
        return [];
    }
}