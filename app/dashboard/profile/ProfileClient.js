'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function ProfileClient({ user }) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Minimal Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                <span>/</span>
                <span className="text-foreground">Account Profile</span>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-10 border-b border-border">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                        <div className="relative w-32 h-32 rounded-full border-2 border-border bg-background flex items-center justify-center overflow-hidden">
                            {user.image ? (
                                <Image src={user.image} alt={user.username} fill className="object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-foreground tracking-tighter">
                                    {user.username?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{user.username}</h1>
                            <p className="text-lg text-muted-foreground font-mono tracking-tight">{user.email}</p>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <Badge text={user.role} />
                            <Badge text={user.status} color={user.status === 'ACTIVE' ? 'green' : 'red'} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="h-11 px-8 bg-foreground text-background text-sm font-bold rounded-full hover:opacity-90 transition-all flex items-center gap-2">
                        Settings
                    </button>
                    <LogoutButton className="h-11 px-6 bg-muted border border-border text-foreground text-sm font-bold rounded-full hover:bg-muted/80 transition-all flex items-center justify-center" />
                </div>
            </div>

            {/* Content Tabs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Side: Activity Feed */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational Stream</h3>
                            <Link href="/dashboard/create" className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors">Generate Ticket →</Link>
                        </div>

                        {user.tickets.length > 0 ? (
                            <div className="space-y-4">
                                {user.tickets.map((ticket) => (
                                    <Link key={ticket.id} href={`/dashboard/${ticket.id}`} className="group block">
                                        <div className="p-5 rounded-2xl bg-card border border-border hover:bg-muted/30 hover:border-border/80 transition-all shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'RESOLVED' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ticket.status === 'OPEN' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{ticket.title}</h4>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()} • {ticket.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-[0.2em]">{ticket.status}</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-center">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Recent Activity</p>
                                <Link href="/dashboard/create" className="text-xs text-primary hover:underline">Start a new request</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Identity & Fleet */}
                <div className="space-y-10">
                    {/* Identity Details */}
                    <Section title="Account Identity">
                        <div className="space-y-4">
                            <InfoRow label="Employee ID" value={user.id.slice(0, 12)} isMono />
                            <InfoRow label="Authorized Role" value={user.role} />
                            <InfoRow label="Security Status" value={user.status} color={user.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'} />
                        </div>
                    </Section>

                    {/* Hardware Fleet */}
                    <Section title="Assigned Fleet">
                        {user.inventory.length > 0 ? (
                            <div className="space-y-4">
                                {user.inventory.map((item) => (
                                    <Link key={item.id} href={`/dashboard/inventory/${item.id}`} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                                {item.type === 'COMPUTER' || item.type === 'LAPTOP' ? '💻' : '📦'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.brand}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{item.pid}</p>
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-[0.2em]">View</div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No Assets Linked</p>
                        )}
                    </Section>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatBox label="History" value={user.tickets.length} />
                        <StatBox label="Lifecycle" value={user.inventory.length} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] border-b border-border pb-4">{title}</h3>
            {children}
        </div>
    );
}

function Badge({ text, color = 'gray' }) {
    const colors = {
        green: 'bg-green-500/10 text-green-500 border-green-500/20',
        red: 'bg-red-500/10 text-red-500 border-red-500/20',
        gray: 'bg-muted text-muted-foreground border-border'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[color]}`}>
            {text}
        </span>
    );
}

function InfoRow({ label, value, isMono = false, color = 'text-foreground' }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</span>
            <span className={`text-xs font-medium tracking-tight ${color} ${isMono ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}

function StatBox({ label, value }) {
    return (
        <div className="bg-card border border-border rounded-[2rem] p-6 text-center group hover:bg-muted/40 transition-all">
            <div className="text-2xl font-bold text-foreground tracking-tighter mb-1 group-hover:scale-110 transition-transform">{value}</div>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
        </div>
    );
}
