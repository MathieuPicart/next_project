import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { getUserBookingStats } from "@/lib/actions/booking.actions";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    const stats = await getUserBookingStats(session.user.id);

    if (!user) {
        redirect("/auth/signin");
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-light-200 mt-1">Manage your account information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Form */}
                <div className="md:col-span-2 bg-dark-100 border border-dark-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                    <ProfileForm user={{ name: user.name, email: user.email }} />
                </div>

                {/* User Stats */}
                <div className="space-y-6">
                    <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Account Stats</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-light-200">Member Since</p>
                                <p className="font-semibold">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-dark-200">
                                <p className="text-sm text-light-200">Total Bookings</p>
                                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                            </div>
                            <div>
                                <p className="text-sm text-light-200">Upcoming Events</p>
                                <p className="text-xl font-semibold">{stats.upcoming}</p>
                            </div>
                            <div>
                                <p className="text-sm text-light-200">Past Events</p>
                                <p className="text-xl font-semibold">{stats.past}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-100 border border-dark-200 rounded-lg p-6">
                        <h3 className="font-semibold mb-2">Account Role</h3>
                        <span className="pill bg-primary/20 text-primary capitalize">
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
