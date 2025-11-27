'use client';

import Link from "next/link";
import Image from "next/image";

interface Booking {
    _id: string;
    event?: {
        title: string;
        slug: string;
        date: string;
        time: string;
        location: string;
    };
    createdAt: string;
}

export default function BookingsList({ bookings }: { bookings: Booking[] }) {
    const handleCancelBooking = (bookingId: string) => {
        // TODO: Implement cancel booking
        alert('Cancel booking functionality coming soon!');
    };

    if (bookings.length === 0) {
        return (
            <div className="bg-dark-100 border-dark-200 rounded-[10px] border px-6 py-12 text-center">
                <p className="text-light-200 mb-4">You haven't booked any events yet.</p>
                <Link
                    href="/"
                    className="inline-block bg-primary hover:bg-primary/90 rounded-[6px] px-6 py-3 font-semibold text-black transition-colors"
                >
                    Browse Events
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map((booking) => (
                <div
                    key={booking._id}
                    className="bg-dark-100 border-dark-200 card-shadow rounded-[10px] border px-6 py-4 flex items-center justify-between"
                >
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{booking.event?.title || 'Event'}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-light-200">
                            <div className="flex items-center gap-2">
                                <Image src="/icons/calendar.svg" alt="date" width={14} height={14} />
                                <span>{booking.event?.date || 'Date TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Image src="/icons/clock.svg" alt="time" width={14} height={14} />
                                <span>{booking.event?.time || 'Time TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
                                <span>{booking.event?.location || 'Location TBD'}</span>
                            </div>
                        </div>
                        <p className="text-xs text-light-200 mt-2">
                            Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {booking.event?.slug && (
                            <Link
                                href={`/events/${booking.event.slug}`}
                                className="bg-dark-200 hover:bg-dark-100 rounded-[6px] px-4 py-2 text-sm transition-colors"
                            >
                                View Event
                            </Link>
                        )}
                        <button
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[6px] px-4 py-2 text-sm transition-colors"
                            onClick={() => handleCancelBooking(booking._id)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
