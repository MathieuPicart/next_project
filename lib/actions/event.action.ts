'use server';

import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";

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
    } catch(e) {
        return [];
    }
}