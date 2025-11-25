'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface ProfileFormProps {
    user: {
        name: string;
        email: string;
    };
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setLoading(false);
                setError(data.message || 'Failed to update profile');
                return;
            }

            // Success
            setSuccess('Profile updated successfully!');
            setLoading(false);

            // If email changed, sign out and redirect to sign in
            if (formData.email !== user.email) {
                setTimeout(() => {
                    signOut({ callbackUrl: '/auth/signin' });
                }, 1500);
            } else {
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-dark-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-dark-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    required
                />
                {formData.email !== user.email && (
                    <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Changing your email will require you to sign in again
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
                {loading ? 'Updating...' : 'Update Profile'}
            </button>
        </form>
    );
}
