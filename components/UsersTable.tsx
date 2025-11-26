'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    bookingCount: number;
}

interface UsersTableProps {
    users: User[];
    currentUserId: string;
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        setLoading(userId);
        setError('');

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            const data = await response.json();

            if (!response.ok) {
                setLoading(null);
                setError(data.message || 'Failed to update user role');
                return;
            }

            // Success - refresh
            setLoading(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setLoading(null);
        }
    };

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <>
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Search and Filter */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg p-4 mb-4">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-dark-200 flex-1 rounded-lg px-4 py-3 outline-none"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
                        className="bg-dark-200 rounded-lg px-4 py-3 outline-none focus:ring-primary"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-dark-100 border border-dark-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-dark-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Bookings</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-200">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-light-200">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const isSelf = user._id === currentUserId;
                                const canDemote = user.role === 'admin' && !isSelf;

                                return (
                                    <tr key={user._id} className="hover:bg-dark-200/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold">
                                                    {user.name}
                                                    {isSelf && (
                                                        <span className="ml-2 text-xs text-primary">(You)</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-light-200">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`pill ${user.role === 'admin' ? 'bg-primary/20 text-primary' : ''}`}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{user.bookingCount}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.role === 'user' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(user._id, 'admin')}
                                                        disabled={loading === user._id}
                                                        className="text-primary hover:underline text-sm disabled:opacity-50"
                                                    >
                                                        {loading === user._id ? 'Promoting...' : 'Promote to Admin'}
                                                    </button>
                                                ) : user._id === currentUserId ? (
                                                    <span className="text-light-200 text-sm">Cannot demote yourself</span>
                                                ) : (
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => handleRoleChange(user._id, 'user')}
                                                            disabled={loading === user._id || !canDemote}
                                                            className="text-blue-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={!canDemote ? 'You cannot demote yourself' : ''}
                                                        >
                                                            {loading === user._id ? 'Demoting...' : 'Demote to User'}
                                                        </button>
                                                        {!canDemote && (
                                                            <span className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-64 bg-dark-300 text-light-200 text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                                                                You cannot demote yourself. Ask another admin to change your role.
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results count */}
            {searchQuery || roleFilter !== 'all' ? (
                <p className="text-sm text-light-200 mt-2">
                    Showing {filteredUsers.length} of {users.length} users
                </p>
            ) : null}
        </>
    );
}
