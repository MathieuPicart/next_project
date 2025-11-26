import connectDB from "@/lib/mongodb";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import {
    getOverviewStats,
    getPopularEvents,
    getUpcomingEvents,
    getRecentBookings,
    getGrowthStats,
    getEventStats,
} from "@/lib/actions/stats.actions";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    await connectDB();

    // Fetch all stats
    const [overview, popular, upcoming, recent, growth, eventStats] = await Promise.all([
        getOverviewStats(),
        getPopularEvents(5),
        getUpcomingEvents(5),
        getRecentBookings(10),
        getGrowthStats(),
        getEventStats(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                <p className="text-light-200 mt-1">Welcome back! Here's what's happening with your platform.</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Events"
                    value={overview.totalEvents}
                    icon="📅"
                    trend={eventStats.upcoming > 0 ? { value: `${eventStats.upcoming} upcoming`, isPositive: true } : undefined}
                />
                <StatCard
                    title="Total Bookings"
                    value={overview.totalBookings}
                    icon="🎟️"
                    trend={growth.bookings.weekly > 0 ? { value: `+${growth.bookings.weekly} this week`, isPositive: true } : undefined}
                />
                <StatCard
                    title="Total Users"
                    value={overview.totalUsers}
                    icon="👥"
                    trend={growth.users.weekly > 0 ? { value: `+${growth.users.weekly} this week`, isPositive: true } : undefined}
                />
            </div>

            {/* Growth Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">📈 Growth Metrics</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-light-200">Bookings (Last 7 days)</p>
                            <p className="text-2xl font-bold text-primary">{growth.bookings.weekly}</p>
                        </div>
                        <div>
                            <p className="text-sm text-light-200">Bookings (Last 30 days)</p>
                            <p className="text-2xl font-bold">{growth.bookings.monthly}</p>
                        </div>
                        <div className="pt-2 border-t border-dark-200">
                            <p className="text-sm text-light-200">New Users (Last 7 days)</p>
                            <p className="text-2xl font-bold text-primary">{growth.users.weekly}</p>
                        </div>
                        <div>
                            <p className="text-sm text-light-200">New Users (Last 30 days)</p>
                            <p className="text-2xl font-bold">{growth.users.monthly}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">📊 Event Breakdown</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-light-200">Upcoming Events</p>
                            <p className="text-2xl font-bold text-green-400">{eventStats.upcoming}</p>
                        </div>
                        <div>
                            <p className="text-sm text-light-200">Past Events</p>
                            <p className="text-2xl font-bold">{eventStats.past}</p>
                        </div>
                        <div className="pt-2 border-t border-dark-200">
                            <p className="text-sm text-light-200 mb-2">By Mode</p>
                            <div className="flex gap-4">
                                <div>
                                    <span className="pill">online</span>
                                    <p className="text-sm font-semibold mt-1">{eventStats.byMode.online}</p>
                                </div>
                                <div>
                                    <span className="pill">offline</span>
                                    <p className="text-sm font-semibold mt-1">{eventStats.byMode.offline}</p>
                                </div>
                                <div>
                                    <span className="pill">hybrid</span>
                                    <p className="text-sm font-semibold mt-1">{eventStats.byMode.hybrid}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Events & Upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">🔥 Popular Events</h2>
                        <Link href="/admin/events" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    {popular.length === 0 ? (
                        <p className="text-light-200 text-sm">No events yet</p>
                    ) : (
                        <div className="space-y-3">
                            {popular.map((event, index) => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-light-200">#{index + 1}</span>
                                        <div>
                                            <Link href={`/events/${event.slug}`} className="font-semibold hover:text-primary" target="_blank">
                                                {event.title}
                                            </Link>
                                            <p className="text-xs text-light-200">{event.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary">{event.bookingCount}</p>
                                        <p className="text-xs text-light-200">bookings</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">📅 Upcoming Events</h2>
                        <Link href="/admin/events" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    {upcoming.length === 0 ? (
                        <p className="text-light-200 text-sm">No upcoming events</p>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((event) => (
                                <div key={event.id} className="p-3 bg-dark-200 rounded-lg">
                                    <Link href={`/events/${event.slug}`} className="font-semibold hover:text-primary block" target="_blank">
                                        {event.title}
                                    </Link>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-light-200">
                                        <span>📍 {event.location}</span>
                                        <span>🗓️ {event.date}</span>
                                        <span>🕐 {event.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">🎟️ Recent Bookings</h2>
                    <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
                        View All
                    </Link>
                </div>
                {recent.length === 0 ? (
                    <p className="text-light-200 text-sm">No bookings yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Event</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Booked At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-200">
                                {recent.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-dark-200/50">
                                        <td className="px-4 py-3 text-sm">
                                            {booking.user ? booking.user.name : 'Guest User'}
                                            <p className="text-xs text-light-200">{booking.user?.email || booking.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {booking.event ? (
                                                <Link href={`/events/${booking.event.slug}`} className="hover:text-primary" target="_blank">
                                                    {booking.event.title}
                                                </Link>
                                            ) : (
                                                'Event deleted'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-light-200">
                                            {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/admin/events/create"
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        ➕ Create Event
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
                        🎟️ View Bookings
                    </Link>
                    <Link
                        href="/admin/users"
                        className="bg-dark-200 hover:bg-dark-100 px-6 py-3 rounded-lg transition-colors"
                    >
                        👥 Manage Users
                    </Link>
                </div>
            </div>
        </div>
    );
}
