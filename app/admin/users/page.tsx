import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import Booking from "@/database/booking.model";
import UsersTable from "@/components/UsersTable";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    await connectDB();

    // Fetch all users
    const users = await User.find().sort({ createdAt: -1 }).lean();

    // Use aggregation to fetch users with booking counts in a single query
    const usersWithBookings = await User.aggregate([
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'userId',
                as: 'bookings'
            }
        },
        {
            $project: {
                _id: { $toString: '$_id' },
                name: 1,
                email: 1,
                role: 1,
                createdAt: { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
                bookingCount: { $size: '$bookings' }
            }
        }
    ]);

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

            <UsersTable users={usersWithBookings} currentUserId={session.user.id} />
        </div>
    );
}
