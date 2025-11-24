'use client';

import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const AuthButtons = () => {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="text-sm">Loading...</div>;
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm">Hello, {session.user.name}</span>

                {session.user.role === 'admin' && (
                    <Link
                        href="/admin"
                        className="text-sm text-primary hover:underline"
                    >
                        Admin Panel
                    </Link>
                )}

                <Link
                    href="/dashboard"
                    className="text-sm hover:underline"
                >
                    Dashboard
                </Link>

                <button
                    onClick={() => signOut()}
                    className="text-sm hover:underline"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={() => signIn()}
                className="bg-dark-200 hover:bg-dark-100 rounded-[6px] px-4 py-2 text-sm transition-colors"
            >
                Sign In
            </button>
            <button
                onClick={() => (window.location.href = '/auth/signup')}
                className="bg-primary hover:bg-primary/90 rounded-[6px] px-4 py-2 text-sm font-semibold text-black transition-colors"
            >
                Sign Up
            </button>
        </div>
    );
};

export default AuthButtons;
