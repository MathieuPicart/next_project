'use client';

import { createBooking } from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import { useState } from "react";

const BookEvent = ({ eventId, slug } : { eventId: string, slug: string; }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { success } = await createBooking({ eventId, slug, email });
            if(success) {
                setSubmitted(true);
                posthog.capture('event_booked', { eventId, slug, email})
            } else {
                posthog.captureException('Booking creation failed');
            }
        } catch {
            setError('Failed to submit booking. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
    <div id="book-event">
        { submitted ? (
            <p className="text-sm">Thank you for signing up!</p>
        ) : (
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        disabled={loading}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <button type="submit" className="button-submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        )}
    </div>
  )
}

export default BookEvent