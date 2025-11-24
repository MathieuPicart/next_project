'use client';

import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

const AuthButtons = () => {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="text-sm">Loading...</div>;
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm text-light-200">
                    Hello, {session.user.name}
                </span>
                <button
                    onClick={() => signOut()}
                    className="bg-dark-200 hover:bg-dark-100 rounded-[6px] px-4 py-2 text-sm transition-colors"
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
