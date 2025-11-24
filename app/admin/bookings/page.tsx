import connectDB from "@/lib/mongodb";
import Booking from "@/database/booking.model";
import BookingsTable from "@/components/BookingsTable";

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
    await connectDB();

    // Fetch all bookings with populated event and user data
    const bookings = await Booking.find()
        .populate('eventId', 'title slug date time location')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    // Convert to plain objects
    const bookingsData = bookings.map(booking => ({
        _id: booking._id.toString(),
        email: booking.email,
        createdAt: new Date(booking.createdAt).toISOString(),
        event: booking.eventId ? {
            title: (booking.eventId as any).title,
            slug: (booking.eventId as any).slug,
            date: (booking.eventId as any).date,
            time: (booking.eventId as any).time,
            location: (booking.eventId as any).location,
        } : null,
        user: booking.userId ? {
            name: (booking.userId as any).name,
            email: (booking.userId as any).email,
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
