'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { cancelUserBooking } from "@/lib/actions/booking.actions";
import { useSession } from "next-auth/react";

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
        image: string;
    } | null;
}

export default function UserBookingsTable({ bookings }: { bookings: Booking[] }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
        isOpen: false,
        booking: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        if (!booking.event) return filter === 'all';

        if (filter === 'upcoming') {
            return booking.event.date >= today;
        } else if (filter === 'past') {
            return booking.event.date < today;
        }
        return true;
    });

    const handleCancelClick = (booking: Booking) => {
        setCancelModal({ isOpen: true, booking });
        setError('');
    };

    const handleCancelConfirm = async () => {
        if (!cancelModal.booking || !session?.user?.id) return;

        setLoading(true);
        setError('');

        try {
            const { success } = await cancelUserBooking(cancelModal.booking._id, session?.user.id);

            if (!success) {
                setLoading(false);
                setCancelModal({ isOpen: false, booking: null });
                setError('Failed to cancel booking');
                return;
            }

            // Success
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

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary text-black' : 'bg-dark-200 hover:bg-dark-100'
                        }`}
                >
                    All ({bookings.length})
                </button>
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'upcoming' ? 'bg-primary text-black' : 'bg-dark-200 hover:bg-dark-100'
                        }`}
                >
                    Upcoming ({bookings.filter(b => b.event && b.event.date >= today).length})
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'past' ? 'bg-primary text-black' : 'bg-dark-200 hover:bg-dark-100'
                        }`}
                >
                    Past ({bookings.filter(b => b.event && b.event.date < today).length})
                </button>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="bg-dark-100 border border-dark-200 rounded-lg p-12 text-center">
                    <p className="text-light-200 mb-4">
                        {filter === 'all' && "You don't have any bookings yet"}
                        {filter === 'upcoming' && "You don't have any upcoming bookings"}
                        {filter === 'past' && "You don't have any past bookings"}
                    </p>
                    {filter === 'all' && (
                        <Link
                            href="/"
                            className="inline-block bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                        >
                            Browse Events
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                        <div
                            key={booking._id}
                            className="bg-dark-100 border border-dark-200 rounded-lg p-6"
                        >
                            {booking.event ? (
                                <div className="flex items-start gap-4">
                                    <Image
                                        src={booking.event.image}
                                        alt={booking.event.title}
                                        width={120}
                                        height={120}
                                        className="rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                        <Link
                                            href={`/events/${booking.event.slug}`}
                                            className="text-xl font-bold hover:text-primary transition-colors"
                                        >
                                            {booking.event.title}
                                        </Link>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-light-200">
                                            <span>📅 {booking.event.date}</span>
                                            <span>🕐 {booking.event.time}</span>
                                            <span>📍 {booking.event.location}</span>
                                        </div>
                                        <p className="text-xs text-light-200 mt-3">
                                            Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={`/events/${booking.event.slug}`}
                                            className="text-primary hover:underline text-sm"
                                            target="_blank"
                                        >
                                            View Event
                                        </Link>
                                        {booking.event.date >= today && (
                                            <button
                                                onClick={() => handleCancelClick(booking)}
                                                className="text-red-400 hover:underline text-sm"
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-light-200">
                                    <p>Event has been deleted</p>
                                    <p className="text-xs mt-2">
                                        Booked on {new Date(booking.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <DeleteConfirmModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, booking: null })}
                onConfirm={handleCancelConfirm}
                title="Cancel Booking"
                message={`Are you sure you want to cancel your booking for "${cancelModal.booking?.event?.title}"? This action cannot be undone.`}
                loading={loading}
            />
        </>
    );
}
