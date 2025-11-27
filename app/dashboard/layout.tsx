import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    const user = session.user;

    return (
        <div className="min-h-screen bg-dark-300">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-dark-100 border-r border-dark-200 min-h-screen p-6">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold">My Dashboard</h2>
                        <p className="text-sm text-light-200 mt-1">{user.name}</p>
                        <p className="text-xs text-light-200">{user.email}</p>
                    </div>

                    <nav className="space-y-2">
                        <Link
                            href="/dashboard"
                            className="block px-4 py-2 rounded-lg hover:bg-dark-200 transition-colors"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            href="/dashboard/bookings"
                            className="block px-4 py-2 rounded-lg hover:bg-dark-200 transition-colors"
                        >
                            🎟️ My Bookings
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            className="block px-4 py-2 rounded-lg hover:bg-dark-200 transition-colors"
                        >
                            👤 Profile
                        </Link>
                        <div className="pt-4 mt-4 border-t border-dark-200">
                            <Link
                                href="/"
                                className="block px-4 py-2 rounded-lg hover:bg-dark-200 transition-colors text-light-200"
                            >
                                ← Back to Events
                            </Link>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
