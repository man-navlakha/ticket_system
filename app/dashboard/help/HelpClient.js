'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "How do I reset my password?",
        answer: "Go to the login page and click 'Forgot Password'. Follow the instructions sent to your email."
    },
    {
        question: "How do I create a new ticket?",
        answer: "Navigate to the 'Tickets' section in the sidebar and click the 'Create Ticket' button."
    },
    {
        question: "Can I change my assigned hardware?",
        answer: "You cannot change it directly. Please request an asset change via a new ticket."
    },
    {
        question: "Who should I contact for urgent issues?",
        answer: "For urgent matters, please contact your department head or the IT admin directly via email or phone."
    }
];

const quickLinks = [
    {
        title: "Create Ticket",
        description: "Report an issue or request a service.",
        href: "/dashboard/create",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
        )
    },
    {
        title: "My Tickets",
        description: "View the status of your reported issues.",
        href: "/dashboard/tickets",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        )
    },
    {
        title: "Profile Settings",
        description: "Update your personal information.",
        href: "/dashboard/profile",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )
    },
];

export default function HelpClient({ supportStaff }) {
    const [search, setSearch] = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    const filteredFaqs = faqs.filter(f =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4 py-10">
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">How can we help?</h1>
                    <div className="max-w-xl mx-auto relative">
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full bg-input/50 border border-input rounded-full py-4 px-6 pl-12 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-0 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-muted-foreground absolute left-4 top-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Quick Links */}
                {!search && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {quickLinks.map((link, i) => (
                            <Link key={i} href={link.href} className="group p-6 rounded-2xl border border-border bg-card hover:bg-muted/30 hover:border-border/80 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform">
                                    {link.icon}
                                </div>
                                <h3 className="font-semibold text-lg mb-2 text-foreground">{link.title}</h3>
                                <p className="text-sm text-muted-foreground">{link.description}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* FAQs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {filteredFaqs.length === 0 ? (
                                <p className="text-muted-foreground">No results found for "{search}".</p>
                            ) : (
                                filteredFaqs.map((faq, i) => (
                                    <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                                        >
                                            <span className="font-medium text-lg text-foreground">{faq.question}</span>
                                            <svg className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Support Staff Side Panel */}
                    <div className="space-y-6">
                        <div className="p-6 border border-border rounded-2xl bg-card">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Support Team</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {supportStaff.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No active support staff.</p>
                                ) : (
                                    supportStaff.map((staff, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted/50 to-transparent border border-border flex items-center justify-center text-xs font-bold font-mono text-foreground">
                                                {staff.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-foreground">{staff.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                                            </div>
                                            <a href={`mailto:${staff.email}`} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-all" title="Email">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-border">
                                <a
                                    href="mailto:support@example.com"
                                    className="block w-full text-center py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-colors shadow-lg"
                                >
                                    Contact General Support
                                </a>
                            </div>
                        </div>

                        <div className="p-6 border border-blue-500/20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent">
                            <h4 className="text-blue-500 font-medium mb-2">Need immediate assistance?</h4>
                            <p className="text-sm text-blue-500/80 mb-4">For system outages or critical blockers, contact the emergency hotline.</p>
                            <a href="tel:5551234567" className="text-sm font-bold text-blue-500 hover:underline">
                                Call +1 (555) 123-4567
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
