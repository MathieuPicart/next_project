'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Event {
    _id: string;
    title: string;
    slug: string;
    date: string;
    mode: string;
    location: string;
}

export default function EventsTable({ events }: { events: Event[] }) {
    const router = useRouter();
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; event: Event | null }>({
        isOpen: false,
        event: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDeleteClick = (event: Event) => {
        setDeleteModal({ isOpen: true, event });
        setError(''); // Clear any previous errors
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.event) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/events/${deleteModal.event.slug}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                // Close modal first, then show error
                setDeleteModal({ isOpen: false, event: null });
                setLoading(false);
                setError(data.message || 'Failed to delete event');
                return;
            }

            // Success - close modal and refresh
            setDeleteModal({ isOpen: false, event: null });
            router.refresh();
        } catch (err: any) {
            // Close modal on error too
            setDeleteModal({ isOpen: false, event: null });
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <>
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

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
                            events.map((event) => (
                                <tr key={event._id} className="hover:bg-dark-200/50 transition-colors">
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
                                            <button
                                                onClick={() => handleDeleteClick(event)}
                                                className="text-red-400 hover:underline text-sm"
                                            >
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

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, event: null })}
                onConfirm={handleDeleteConfirm}
                title="Delete Event"
                message={`Are you sure you want to delete "${deleteModal.event?.title}"? This action cannot be undone.`}
                loading={loading}
            />
        </>
    );
}
