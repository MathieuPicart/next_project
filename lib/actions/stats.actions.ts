'use server';

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import User from "@/database/user.model";

export async function getOverviewStats() {
    try {
        await connectDB();

        const [totalEvents, totalBookings, totalUsers] = await Promise.all([
            Event.countDocuments(),
            Booking.countDocuments(),
            User.countDocuments(),
        ]);

        return {
            totalEvents,
            totalBookings,
            totalUsers,
        };
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        return {
            totalEvents: 0,
            totalBookings: 0,
            totalUsers: 0,
        };
    }
}

export async function getPopularEvents(limit: number = 5) {
    try {
        await connectDB();

        // Get all events with their booking counts
        const events = await Event.find().lean();

        const eventsWithBookings = await Promise.all(
            events.map(async (event) => {
                const bookingCount = await Booking.countDocuments({ eventId: event._id });
                return {
                    id: event._id.toString(),
                    title: event.title,
                    slug: event.slug,
                    date: event.date,
                    location: event.location,
                    bookingCount,
                };
            })
        );

        // Sort by booking count and return top N
        return eventsWithBookings
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, limit);
    } catch (error) {
        console.error('Error fetching popular events:', error);
        return [];
    }
}

export async function getUpcomingEvents(limit: number = 5) {
    try {
        await connectDB();

        const today = new Date().toISOString().split('T')[0];

        const upcomingEvents = await Event.find({
            date: { $gte: today }
        })
            .sort({ date: 1 })
            .limit(limit)
            .lean();

        return upcomingEvents.map(event => ({
            id: event._id.toString(),
            title: event.title,
            slug: event.slug,
            date: event.date,
            time: event.time,
            location: event.location,
        }));
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        return [];
    }
}

export async function getRecentBookings(limit: number = 10) {
    try {
        await connectDB();

        const bookings = await Booking.find()
            .populate('eventId', 'title slug')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return bookings.map(booking => ({
            id: booking._id.toString(),
            email: booking.email,
            createdAt: new Date(booking.createdAt).toISOString(),
            event: booking.eventId ? {
                title: (booking.eventId as any).title,
                slug: (booking.eventId as any).slug,
            } : null,
            user: booking.userId ? {
                name: (booking.userId as any).name,
                email: (booking.userId as any).email,
            } : null,
        }));
    } catch (error) {
        console.error('Error fetching recent bookings:', error);
        return [];
    }
}

export async function getGrowthStats() {
    try {
        await connectDB();

        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [weeklyBookings, monthlyBookings, weeklyUsers, monthlyUsers] = await Promise.all([
            Booking.countDocuments({ createdAt: { $gte: lastWeek } }),
            Booking.countDocuments({ createdAt: { $gte: lastMonth } }),
            User.countDocuments({ createdAt: { $gte: lastWeek } }),
            User.countDocuments({ createdAt: { $gte: lastMonth } }),
        ]);

        return {
            bookings: {
                weekly: weeklyBookings,
                monthly: monthlyBookings,
            },
            users: {
                weekly: weeklyUsers,
                monthly: monthlyUsers,
            },
        };
    } catch (error) {
        console.error('Error fetching growth stats:', error);
        return {
            bookings: { weekly: 0, monthly: 0 },
            users: { weekly: 0, monthly: 0 },
        };
    }
}

export async function getEventStats() {
    try {
        await connectDB();

        const today = new Date().toISOString().split('T')[0];

        const [upcomingCount, pastCount, onlineCount, offlineCount, hybridCount] = await Promise.all([
            Event.countDocuments({ date: { $gte: today } }),
            Event.countDocuments({ date: { $lt: today } }),
            Event.countDocuments({ mode: 'online' }),
            Event.countDocuments({ mode: 'offline' }),
            Event.countDocuments({ mode: 'hybrid' }),
        ]);

        return {
            upcoming: upcomingCount,
            past: pastCount,
            byMode: {
                online: onlineCount,
                offline: offlineCount,
                hybrid: hybridCount,
            },
        };
    } catch (error) {
        console.error('Error fetching event stats:', error);
        return {
            upcoming: 0,
            past: 0,
            byMode: { online: 0, offline: 0, hybrid: 0 },
        };
    }
}
