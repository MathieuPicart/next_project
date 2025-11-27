import connectDB from "@/lib/mongodb";
import Booking from "@/database/booking.model";
import BookingsTable from "@/components/BookingsTable";
import { Types } from "mongoose";

export const dynamic = 'force-dynamic';

// Type definition for lean booking with populated fields
type PopulatedBooking = {
    _id: Types.ObjectId;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    eventId: {
        title: string;
        slug: string;
        date: string;
        time: string;
        location: string;
    };
    userId?: {
        name: string;
        email: string;
    };
};

export default async function AdminBookingsPage() {
    await connectDB();

    // Fetch all bookings with populated event and user data
    const bookings = await Booking.find()
        .populate('eventId', 'title slug date time location')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .lean() as unknown as PopulatedBooking[];

    // Convert to plain objects
    const bookingsData = bookings.map(booking => ({
        _id: booking._id.toString(),
        email: booking.email,
        createdAt: new Date(booking.createdAt).toISOString(),
        event: booking.eventId ? {
            title: booking.eventId.title,
            slug: booking.eventId.slug,
            date: booking.eventId.date,
            time: booking.eventId.time,
            location: booking.eventId.location,
        } : null,
        user: booking.userId ? {
            name: booking.userId.name,
            email: booking.userId.email,
        } : null,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bookings Management</h1>
                    <p className="text-light-200 mt-1">View and manage all event bookings</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{bookingsData.length}</p>
                    <p className="text-sm text-light-200">Total Bookings</p>
                </div>
            </div>

            <BookingsTable bookings={bookingsData} />
        </div>
    );
}
