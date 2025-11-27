import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!session) {
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(signInUrl);
        }
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
        if (!session) {
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(signInUrl);
        }

        if (session.user.role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) {
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
