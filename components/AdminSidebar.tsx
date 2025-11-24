'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Events', href: '/admin/events', icon: '🎫' },
    { name: 'Bookings', href: '/admin/bookings', icon: '📅' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-dark-100 border-r border-dark-200 min-h-screen p-6">
            <div className="mb-8">
                <Link href="/admin" className="flex items-center gap-2">
                    <Image src="/icons/logo.png" alt="logo" width={24} height={24} />
                    <h2 className="text-xl font-bold">Admin Panel</h2>
                </Link>
            </div>

            <nav className="space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-black font-semibold'
                                    : 'text-light-200 hover:bg-dark-200 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-dark-200">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-light-200 hover:bg-dark-200 hover:text-white transition-colors"
                >
                    <span className="text-xl">🏠</span>
                    <span>Back to Site</span>
                </Link>
            </div>
        </aside>
    );
}
