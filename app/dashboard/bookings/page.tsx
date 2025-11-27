import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserBookings } from "@/lib/actions/booking.actions";
import UserBookingsTable from "@/components/UserBookingsTable";

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    const bookings = await getUserBookings(session.user.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Bookings</h1>
                <p className="text-light-200 mt-1">Manage all your event bookings</p>
            </div>

            <UserBookingsTable bookings={bookings} />
        </div>
    );
}
