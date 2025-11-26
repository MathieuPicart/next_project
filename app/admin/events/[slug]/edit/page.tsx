import EventForm from "@/components/EventForm";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
        redirect('/');
    }

    const { slug } = await params;

    await connectDB();

    const event = await Event.findOne({ slug }).lean();

    if (!event) {
        notFound();
    }

    // Convert MongoDB document to plain object and format for the form
    const eventData = {
        title: event.title,
        description: event.description,
        overview: event.overview,
        image: event.image,
        venue: event.venue,
        location: event.location,
        date: event.date,
        time: event.time,
        mode: event.mode,
        audience: event.audience,
        organizer: event.organizer,
        tags: event.tags || [],
        agenda: event.agenda || [],
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Edit Event</h1>
                <p className="text-light-200 mt-1">Update event details for "{event.title}"</p>
            </div>

            <EventForm initialData={eventData} isEditing={true} eventSlug={slug} />
        </div>
    );
}
