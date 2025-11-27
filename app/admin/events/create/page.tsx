import EventForm from "@/components/EventForm";

export default function CreateEventPage() {
    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Create New Event</h1>
                <p className="text-light-200 mt-1">Fill in the details to create a new event</p>
            </div>

            <EventForm />
        </div>
    );
}
