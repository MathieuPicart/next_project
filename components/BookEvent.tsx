'use client';

import { createBooking, checkUserBooking, cancelUserBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BookEvent = ({ eventId, slug }: { eventId: string, slug: string; }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasBooked, setHasBooked] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [checkingBooking, setCheckingBooking] = useState(true);

    // Check if user has already booked this event
    useEffect(() => {
        const checkBooking = async () => {
            if (session?.user?.id) {
                setCheckingBooking(true);
                const result = await checkUserBooking({
                    eventId,
                    userId: session.user.id
                });
                setHasBooked(result.hasBooked);
                if (result.bookingId) {
                    setBookingId(result.bookingId);
                }
                setCheckingBooking(false);
            } else {
                setCheckingBooking(false);
            }
        };

        checkBooking();
    }, [session, eventId]);

    const handleCancelBooking = async () => {
        if (!bookingId) return;

        setLoading(true);
        setError(null);

        try {
            const { success } = await cancelUserBooking(bookingId);
            if (success) {
                setHasBooked(false);
                setBookingId(null);
                posthog.capture('booking_cancelled', { eventId, slug });
            } else {
                setError('Failed to cancel booking. Please try again.');
            }
        } catch {
            setError('Failed to cancel booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Redirect to sign in if not authenticated
        if (!session) {
            router.push(`/auth/signin?callbackUrl=/events/${slug}`);
            return;
        }

        const emailToUse = session.user.email || email;

        if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { success } = await createBooking({
                eventId,
                slug,
                email: emailToUse,
                userId: session.user.id
            });
            if (success) {
                setSubmitted(true);
                setHasBooked(true);
                posthog.capture('event_booked', { eventId, slug, email: emailToUse })
            } else {
                setError('Failed to create booking. You may have already booked this event.');
                posthog.captureException('Booking creation failed');
            }
        } catch {
            setError('Failed to submit booking. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Show loading state while checking authentication or booking status
    if (status === 'loading' || checkingBooking) {
        return <div id="book-event"><p className="text-sm">Loading...</p></div>;
    }

    // If user already booked this event
    if (hasBooked) {
        return (
            <div id="book-event">
                <div className="bg-green-500/10 border border-green-500 text-green-300 px-4 py-3 rounded-[6px] text-sm">
                    ✓ You've already booked this event!
                </div>
                <button
                    type="button"
                    id="cancel-booking"
                    onClick={handleCancelBooking}
                    disabled={loading}
                    className="button-submit bg-red-500 hover:bg-red-500/80 rounded-[6px] px-5 py-2"
                >
                    {loading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
        );
    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    {!session && (
                        <div className="mb-4 bg-blue-500/10 border border-blue-500 text-blue-300 px-4 py-3 rounded-[6px] text-sm">
                            Please sign in to book this event
                        </div>
                    )}
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={session?.user?.email || email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                            disabled={loading || !!session?.user?.email}
                            readOnly={!!session?.user?.email}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    <button type="submit" className="button-submit" disabled={loading}>
                        {!session ? 'Sign In to Book' : loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default BookEvent