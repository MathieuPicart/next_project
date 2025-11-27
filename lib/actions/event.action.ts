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

export const getEventBySlug = async (slug: string) => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean();

        if (!event) {
            return null;
        }

        // Transform to plain object with string ID
        return {
            _id: ((event as any)._id).toString(),
            title: (event as any).title,
            description: (event as any).description,
            overview: (event as any).overview,
            image: (event as any).image,
            venue: (event as any).venue,
            location: (event as any).location,
            date: (event as any).date,
            time: (event as any).time,
            mode: (event as any).mode,
            audience: (event as any).audience,
            organizer: (event as any).organizer,
            tags: (event as any).tags || [],
            agenda: (event as any).agenda || [],
            slug: (event as any).slug,
            createdAt: (event as any).createdAt?.toISOString(),
            updatedAt: (event as any).updatedAt?.toISOString(),
        };
    } catch (e) {
        console.error('get event by slug failed', e);
        return null;
    }
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean();
        if (!event || !Array.isArray((event as any).tags) || (event as any).tags.length === 0) {
            return [];
        }
        const similarEvents = await Event.find({
            _id: { $ne: (event as any)._id },
            tags: { $in: (event as any).tags },
        }).lean();

        // Transform to plain objects with string IDs
        return similarEvents.map((event: any) => ({
            ...event,
            _id: event._id.toString(),
            createdAt: event.createdAt?.toISOString(),
            updatedAt: event.updatedAt?.toISOString(),
        }));
    } catch (e) {
        return [];
    }
}