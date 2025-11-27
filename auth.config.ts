import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    trustHost: true,
    callbacks: {
        async jwt({ token, user }) {
            // Add user info to JWT token on sign in
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user info to session from JWT token
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'user' | 'admin';
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
