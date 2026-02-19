'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function ProfileClient({ user }) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full border border-white/10 bg-gradient-to-tr from-gray-800 to-black overflow-hidden flex items-center justify-center">
                            {user.image ? (
                                <Image src={user.image} alt={user.username} fill className="object-cover" />
                            ) : (
                                <span className="text-3xl font-medium text-white">{user.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">{user.username}</h1>
                            <p className="text-gray-400 font-mono text-sm">{user.email}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10 bg-white/5 text-gray-300 uppercase tracking-wider">
                                    {user.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${user.status === 'ACTIVE'
                                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                        : 'border-red-500/20 bg-red-500/10 text-red-400'
                                    }`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                            Edit Profile
                        </button>
                        <LogoutButton className="px-4 py-2 border border-white/10 text-white text-sm font-medium rounded hover:bg-white/5 transition-colors" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-white/10 text-sm">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`pb-4 transition-colors ${activeTab === 'security' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Security
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-4 transition-colors ${activeTab === 'settings' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Settings
                    </button>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Recent Activity */}
                        <section>
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                Recent Tickets
                            </h2>
                            {user.tickets.length > 0 ? (
                                <div className="space-y-4">
                                    {user.tickets.map((ticket) => (
                                        <Link href={`/dashboard/${ticket.id}`} key={ticket.id} className="block group">
                                            <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black hover:border-white/30 transition-all duration-200">
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 w-2 h-2 rounded-full ${ticket.status === 'RESOLVED' ? 'bg-blue-500' :
                                                            ticket.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-500'
                                                        }`} />
                                                    <div>
                                                        <h4 className="text-sm font-medium text-white group-hover:underline decoration-white/30 underline-offset-4">{ticket.title}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-gray-600 group-hover:text-gray-400">
                                                    {ticket.status}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-white/10 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">No recent activity found.</p>
                                    <Link href="/dashboard/create" className="text-blue-500 hover:text-blue-400 text-sm mt-2 inline-block">
                                        Create a ticket &rarr;
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-8">
                        <section className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Assigned Assets</h3>
                            {user.inventory.length > 0 ? (
                                <ul className="space-y-4">
                                    {user.inventory.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs text-gray-400">
                                                    💻
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.brand}</p>
                                                    <p className="text-xs text-gray-500">{item.model}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">
                                                {item.type}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">No assets assigned.</p>
                            )}
                        </section>

                        <section className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Account Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-bold text-white">{user.tickets.length}</div>
                                    <div className="text-xs text-gray-500">Total Tickets</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{user.inventory.length}</div>
                                    <div className="text-xs text-gray-500">Assets</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
