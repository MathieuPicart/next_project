'use client';

import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BookEvent = ({ eventId, slug }: { eventId: string, slug: string; }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill email if user is authenticated
    const userEmail = session?.user?.email || email;

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

    // Show loading state while checking authentication
    if (status === 'loading') {
        return <div id="book-event"><p className="text-sm">Loading...</p></div>;
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