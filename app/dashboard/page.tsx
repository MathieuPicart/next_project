import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserBookings, getUserBookingStats } from "@/lib/actions/booking.actions";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    const userId = session.user.id;
    const [bookings, stats] = await Promise.all([
        getUserBookings(userId),
        getUserBookingStats(userId),
    ]);

    // Get next 3 upcoming events
    const today = new Date().toISOString().split('T')[0];
    const upcomingBookings = bookings
        .filter(b => b.event && b.event.date >= today)
        .slice(0, 3);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {session.user.name}! 👋</h1>
                <p className="text-light-200 mt-1">Here's an overview of your event bookings</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-light-200">Total Bookings</p>
                            <p className="text-3xl font-bold mt-2">{stats.total}</p>
                        </div>
                        <div className="text-4xl">🎟️</div>
                    </div>
                </div>

                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-light-200">Upcoming Events</p>
                            <p className="text-3xl font-bold mt-2 text-primary">{stats.upcoming}</p>
                        </div>
                        <div className="text-4xl">📅</div>
                    </div>
                </div>

                <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-light-200">Past Events</p>
                            <p className="text-3xl font-bold mt-2">{stats.past}</p>
                        </div>
                        <div className="text-4xl">✅</div>
                    </div>
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Your Upcoming Events</h2>
                    <Link href="/dashboard/bookings" className="text-sm text-primary hover:underline">
                        View All →
                    </Link>
                </div>

                {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-light-200 mb-4">You don't have any upcoming events</p>
                        <Link
                            href="/"
                            className="inline-block bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                        >
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                            <Link
                                key={booking._id}
                                href={`/events/${booking.event?.slug}`}
                                className="flex items-center gap-4 p-4 bg-dark-200 rounded-lg hover:bg-dark-200/70 transition-colors"
                            >
                                {booking.event?.image && (
                                    <Image
                                        src={booking.event.image}
                                        alt={booking.event.title}
                                        width={80}
                                        height={80}
                                        className="rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-semibold">{booking.event?.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-light-200">
                                        <span>📅 {booking.event?.date}</span>
                                        <span>🕐 {booking.event?.time}</span>
                                        <span>📍 {booking.event?.location}</span>
                                    </div>
                                </div>
                                <div className="text-primary">→</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                        🔍 Browse Events
                    </Link>
                    <Link
                        href="/dashboard/bookings"
                        className="bg-dark-200 hover:bg-dark-100 px-6 py-3 rounded-lg transition-colors"
                    >
                        🎟️ View My Bookings
                    </Link>
                    <Link
                        href="/dashboard/profile"
                        className="bg-dark-200 hover:bg-dark-100 px-6 py-3 rounded-lg transition-colors"
                    >
                        ⚙️ Edit Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
