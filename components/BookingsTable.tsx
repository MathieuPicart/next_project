'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Booking {
    _id: string;
    email: string;
    createdAt: string;
    event: {
        title: string;
        slug: string;
        date: string;
        time: string;
        location: string;
    } | null;
    user: {
        name: string;
        email: string;
    } | null;
}

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
    const router = useRouter();
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
        isOpen: false,
        booking: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCancelClick = (booking: Booking) => {
        setCancelModal({ isOpen: true, booking });
        setError('');
    };

    const handleCancelConfirm = async () => {
        if (!cancelModal.booking) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/bookings/${cancelModal.booking._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                setCancelModal({ isOpen: false, booking: null });
                setLoading(false);
                setError(data.message || 'Failed to cancel booking');
                return;
            }

            // Success - reset loading, close modal and refresh
            setLoading(false);
            setCancelModal({ isOpen: false, booking: null });
            router.refresh();
        } catch (err: any) {
            setCancelModal({ isOpen: false, booking: null });
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
                            <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Event Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Booked On</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-200">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-light-200">
                                    No bookings yet.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-dark-200/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold">{booking.user?.name || 'Guest User'}</p>
                                            <p className="text-sm text-light-200">{booking.user?.email || booking.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.event ? (
                                            <div>
                                                <p className="font-semibold">{booking.event.title}</p>
                                                <p className="text-sm text-light-200">{booking.event.location}</p>
                                            </div>
                                        ) : (
                                            <p className="text-light-200">Event deleted</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {booking.event ? (
                                            <div>
                                                <p>{booking.event.date}</p>
                                                <p className="text-light-200">{booking.event.time}</p>
                                            </div>
                                        ) : (
                                            <p className="text-light-200">-</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {booking.event && (
                                                <Link
                                                    href={`/events/${booking.event.slug}`}
                                                    className="text-primary hover:underline text-sm"
                                                    target="_blank"
                                                >
                                                    View Event
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => handleCancelClick(booking)}
                                                className="text-red-400 hover:underline text-sm"
                                            >
                                                Cancel
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
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, booking: null })}
                onConfirm={handleCancelConfirm}
                title="Cancel Booking"
                message={`Are you sure you want to cancel this booking for "${cancelModal.booking?.event?.title || 'this event'}"? This action cannot be undone.`}
                loading={loading}
            />
        </>
    );
}
