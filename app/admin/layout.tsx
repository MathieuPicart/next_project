import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Redirect if not authenticated
    if (!session) {
        redirect('/auth/signin?callbackUrl=/admin');
    }

    // Redirect if not admin
    if (session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
