import Link from "next/link";
import EventsTable from "@/components/EventsTable";
import { getAllEvents } from "@/lib/actions/event.action";

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
    const events = await getAllEvents();

    // Extract only the fields needed for the table
    const eventsData = events.map(event => ({
        _id: event._id,
        title: event.title,
        slug: event.slug,
        date: event.date,
        mode: event.mode,
        location: event.location,
    }));

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

            <EventsTable events={eventsData} />
        </div>
    );
}
