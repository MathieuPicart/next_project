import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import User from "@/database/user.model";

export const dynamic = 'force-dynamic';

async function getAdminStats() {
    await connectDB();

    const [totalEvents, totalBookings, totalUsers, recentBookings] = await Promise.all([
        Event.countDocuments(),
        Booking.countDocuments(),
        User.countDocuments(),
        Booking.find()
            .populate('eventId', 'title slug')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
    ]);

    return {
        totalEvents,
        totalBookings,
        totalUsers,
        recentBookings,
    };
}

export default async function AdminDashboard() {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-light-200 mt-2">Welcome back, {session.user.name}!</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Events"
                    value={stats.totalEvents}
                    icon="🎫"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon="📅"
                />
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="👥"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/admin/events/create"
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        ➕ Create New Event
                    </Link>
                    <Link
                        href="/admin/events"
                        className="bg-dark-200 hover:bg-dark-100 px-6 py-3 rounded-lg transition-colors"
                    >
                        📋 Manage Events
                    </Link>
                    <Link
                        href="/admin/bookings"
                        className="bg-dark-200 hover:bg-dark-100 px-6 py-3 rounded-lg transition-colors"
                    >
                        📊 View Bookings
                    </Link>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Recent Bookings</h2>
                {stats.recentBookings.length === 0 ? (
                    <p className="text-light-200">No bookings yet.</p>
                ) : (
                    <div className="space-y-3">
                        {stats.recentBookings.map((booking: any) => (
                            <div
                                key={booking._id.toString()}
                                className="flex items-center justify-between p-4 bg-dark-200 rounded-lg"
                            >
                                <div>
                                    <p className="font-semibold">{booking.eventId?.title || 'Unknown Event'}</p>
                                    <p className="text-sm text-light-200">
                                        {booking.userId?.name || booking.email} • {new Date(booking.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {booking.eventId?.slug && (
                                    <Link
                                        href={`/events/${booking.eventId.slug}`}
                                        className="text-primary hover:underline text-sm"
                                    >
                                        View Event →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
