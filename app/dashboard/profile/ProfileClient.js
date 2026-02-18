'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function ProfileClient({ user }) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen rounded-xl bg-[#0B0E14] text-white p-6 md:p-12 font-sans mb-20 md:mb-0">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Profile Card */}
                <div className="bg-[#141820] border border-transparent hover:border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
                    <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12">
                        <div className="w-32 h-32 rounded-full border-4 border-[#141820] shadow-2xl bg-[#0B0E14] flex items-center justify-center relative overflow-hidden">
                            {user.image ? (
                                <Image src={user.image} alt={user.username} fill className="object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400">{user.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left mb-2">
                            <h1 className="text-3xl md:text-5xl font-light text-white mb-2">{user.username}</h1>
                            <p className="text-gray-400 text-lg">{user.email}</p>
                            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border 
                                    ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        user.role === 'AGENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border 
                                    ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[140px]">
                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-all">
                                Edit Profile
                            </button>
                            <div className="md:hidden w-full">
                                <LogoutButton className="w-full justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Hardware */}
                    <div className="space-y-8">
                        {/* Quick Stats */}
                        <div className="bg-[#141820] rounded-2xl p-6 border border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Experience</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 rounded-xl text-center">
                                    <div className="text-2xl font-light text-white mb-1">{user.tickets.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Total Tickets</div>
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl text-center">
                                    <div className="text-2xl font-light text-white mb-1">{user.inventory.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Assigned Assets</div>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Hardware */}
                        <div className="bg-[#141820] rounded-2xl p-6 border border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">My Hardware</h3>
                            {user.inventory.length > 0 ? (
                                <div className="space-y-4">
                                    {user.inventory.map((item) => (
                                        <div key={item.id} className="p-4 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.brand} {item.model}</span>
                                                <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">{item.pid}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                {item.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No hardware assigned.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#141820] rounded-2xl p-8 border border-white/5 h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recent Activity</h3>
                                <Link href="/dashboard" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">View All Tickets →</Link>
                            </div>

                            {user.tickets.length > 0 ? (
                                <div className="space-y-4">
                                    {user.tickets.map((ticket) => (
                                        <Link href={`/dashboard/${ticket.id}`} key={ticket.id} className="block group">
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                                    ${ticket.status === 'RESOLVED' ? 'bg-blue-500/10 text-blue-400' :
                                                        ticket.status === 'OPEN' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {ticket.status === 'RESOLVED' ? '✓' : ticket.priority === 'HIGH' ? '!' : '•'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">{ticket.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Created {new Date(ticket.createdAt).toLocaleDateString()} • {ticket.category}
                                                    </p>
                                                </div>
                                                <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border
                                                    ${ticket.status === 'RESOLVED' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                                                        'bg-green-500/5 text-green-400 border-green-500/20'}`}>
                                                    {ticket.status}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="text-4xl mb-4 opacity-20">🎫</div>
                                    <h3 className="text-lg font-medium text-white mb-2">No Recent Activity</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">You haven&apos;t created any tickets yet. Need help with something?</p>
                                    <Link href="/dashboard/create" className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">
                                        Create First Ticket
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
