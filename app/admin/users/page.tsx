import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import Booking from "@/database/booking.model";
import UsersTable from "@/components/UsersTable";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    await connectDB();

    // Fetch all users
    const users = await User.find().sort({ createdAt: -1 }).lean();

    // Get booking counts for each user
    const usersWithBookings = await Promise.all(
        users.map(async (user) => {
            const bookingCount = await Booking.countDocuments({ userId: user._id });
            return {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: new Date(user.createdAt).toISOString(),
                bookingCount,
            };
        })
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-light-200 mt-1">View and manage all platform users</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{usersWithBookings.length}</p>
                    <p className="text-sm text-light-200">Total Users</p>
                </div>
            </div>

            <UsersTable users={usersWithBookings} />
        </div>
    );
}
