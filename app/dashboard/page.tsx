import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import BookingsList from "@/components/BookingsList";
import { getUserBookingsWithEvents } from "@/lib/actions/booking.actions";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const DashboardPage = async () => {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    const bookings = await getUserBookingsWithEvents(session.user.id);

    return (
        <section className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <p className="text-light-200 mt-2">Welcome back, {session.user.name}!</p>
            </div>

            {/* User Info Card */}
            <div className="bg-dark-100 border-dark-200 card-shadow rounded-[10px] border px-6 py-6">
                <h2 className="text-2xl font-bold mb-4">Account Information</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        {session.user.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                                {session.user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold">{session.user.name}</p>
                            <p className="text-sm text-light-200">{session.user.email}</p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-dark-200">
                        <p className="text-sm text-light-200">
                            Role: <span className="text-primary font-medium capitalize">{session.user.role}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Bookings Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4">My Bookings ({bookings.length})</h2>
                <BookingsList bookings={bookings} />
            </div>
        </section>
    );
}

export default DashboardPage;
