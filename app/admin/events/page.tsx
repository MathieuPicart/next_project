import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
    await connectDB();

    const events = await Event.find()
        .sort({ createdAt: -1 })
        .lean();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Events Management</h1>
                    <p className="text-light-200 mt-1">Manage all events on the platform</p>
                </div>
                <Link
                    href="/admin/events/create"
                    className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    ➕ Create Event
                </Link>
            </div>

            {/* Events Table */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-dark-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Mode</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-200">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-light-200">
                                    No events found. Create your first event!
                                </td>
                            </tr>
                        ) : (
                            events.map((event: any) => (
                                <tr key={event._id.toString()} className="hover:bg-dark-200/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-sm text-light-200">{event.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{event.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="pill">{event.mode}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{event.location}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/events/${event.slug}`}
                                                className="text-primary hover:underline text-sm"
                                                target="_blank"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={`/admin/events/${event.slug}/edit`}
                                                className="text-blue-400 hover:underline text-sm"
                                            >
                                                Edit
                                            </Link>
                                            <button className="text-red-400 hover:underline text-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
