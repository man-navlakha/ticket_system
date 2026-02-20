'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const rulesByPage = [
    {
        title: "Dashboard & General Access",
        rules: "Access to the dashboard is strictly limited to authorized personnel. Sharing login credentials or session tokens is strictly prohibited. All activities are logged and monitored for compliance."
    },
    {
        title: "Ticket System Usage",
        rules: "When submitting support tickets, users are required to provide complete and accurate information. The 'High' priority tag should only be used for system-critical issues that block overall productivity. Misuse of priority tags may result in administrative action."
    },
    {
        title: "Inventory & Assets",
        rules: "Hardware assets assigned to employees remain the property of the enterprise. Employees must report any loss, damage, or malfunction immediately. Upon leaving the company, all hardware must be returned in the condition it was assigned."
    },
    {
        title: "Knowledge Base Content",
        rules: "Internal knowledge base documentation must not be shared outside of the organization. Contributions to the KB must follow company formatting standards. Plagiarism or the posting of confidential intellectual property is prohibited."
    },
    {
        title: "Proposals & Approvals",
        rules: "All formal requests or asset requests must go through the standard proposal workflow. Submitting fraudulent claims, bypassing approval chains, or misrepresenting expenses is a violation of enterprise policy."
    }
];

export default function TermsPage() {
    const [openRule, setOpenRule] = useState(null);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8 selection:bg-primary/20 transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-12 py-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 border border-border px-4 py-2 rounded-full bg-muted/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Terms & Conditions</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        According to our system, each module has its own distinct operational rules. Please review the specific terms and policies for each section below.
                    </p>
                </div>

                {/* Rules Accordion */}
                <div className="space-y-4">
                    {rulesByPage.map((rule, i) => (
                        <div key={i} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <button
                                onClick={() => setOpenRule(openRule === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                            >
                                <span className="font-medium text-lg text-foreground">{rule.title}</span>
                                <div className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${openRule === i ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                                    <svg className={`w-5 h-5 transition-transform duration-300 ${openRule === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            <AnimatePresence>
                                {openRule === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border mt-2">
                                            {rule.rules}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Footer Section */}
                <div className="text-center pt-10 border-t border-border mt-12">
                    <p className="text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        By continuing to use the system, you agree to these distinct rules. Violations may result in restricted access.
                    </p>
                </div>
            </div>
        </div>
    );
}
