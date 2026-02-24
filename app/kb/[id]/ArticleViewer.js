'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useState } from 'react';
import FloatingLines from '@/components/FloatingLines';

export default function ArticleViewer({ article }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative animate-in fade-in duration-500">

            {/* Background Gradient Spot */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full pointer-events-none -z-10" />

            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 pb-16 md:pb-24 relative z-10">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground mb-8 md:mb-10 uppercase tracking-widest flex-wrap">
                    <Link
                        href="/kb"
                        className="hover:text-[#C5A059] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Knowledge Base
                    </Link>
                    <span className="text-border">/</span>
                    <span className="text-[#C5A059] dark:text-[#D4AF37] font-semibold truncate max-w-[180px] sm:max-w-none">{article.category?.name || 'Article'}</span>
                </nav>

                {/* Header */}
                <header className="mb-8 md:mb-12 pb-8 md:pb-10 border-b border-border">
                    {/* Status badge row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 md:mb-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Published
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-[#C5A059]/20 dark:border-[#D4AF37]/20">
                            {article.category?.name || 'General'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-mono sm:ml-auto w-full sm:w-auto">
                            Updated {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4 md:mb-6 leading-[1.15] drop-shadow-sm">
                        {article.title}
                    </h1>

                    {article.summary && (
                        <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-light">
                            {article.summary}
                        </p>
                    )}

                    {/* Meta / Sharing */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 dark:bg-[#D4AF37]/20 text-[#C5A059] dark:text-[#D4AF37] flex items-center justify-center text-sm font-bold ring-2 ring-background shadow-sm">
                                {article.createdBy?.username?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="text-sm">
                                <span className="block text-foreground font-medium">{article.createdBy?.username || 'System Admin'}</span>
                                <span className="block text-xs text-muted-foreground">Author</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyLink}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${copied
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-border bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    Share
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Tags */}
                {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                        {article.tags.map((t) => (
                            <span
                                key={t.tag.id}
                                className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-full bg-muted border border-border shadow-sm"
                            >
                                #{t.tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-bold prose-a:text-[#C5A059] dark:prose-a:text-[#D4AF37] prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:overflow-x-auto prose-code:text-[#C5A059] dark:prose-code:text-[#D4AF37] prose-code:bg-[#C5A059]/10 dark:prose-code:bg-[#D4AF37]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:break-words prose-li:text-muted-foreground prose-hr:border-border prose-img:rounded-2xl">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-12 mb-6 text-foreground border-b border-border pb-3" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold mt-10 mb-5 text-foreground" {...props} />,
                            img: ({ node, ...props }) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <div className="my-8 rounded-3xl overflow-hidden border border-border bg-muted shadow-lg">
                                    <img className="w-full h-auto" {...props} alt={props.alt || 'Article Image'} />
                                </div>
                            ),
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-8 border border-border rounded-2xl shadow-sm">
                                    <table className="w-full text-left text-sm" {...props} />
                                </div>
                            ),
                            th: ({ node, ...props }) => <th className="bg-muted p-3 font-semibold text-foreground border-b border-border" {...props} />,
                            td: ({ node, ...props }) => <td className="p-3 border-b border-border text-muted-foreground" {...props} />,
                            blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-4 border-[#C5A059]/50 dark:border-[#D4AF37]/50 pl-4 py-1 my-6 bg-[#C5A059]/5 dark:bg-[#D4AF37]/5 rounded-r italic text-muted-foreground" {...props} />
                            ),
                        }}
                    >
                        {article.content}
                    </ReactMarkdown>
                </div>

                {/* CTA Footer */}
                <footer className="mt-12 md:mt-20 pt-0">
                    <div className="p-8 md:p-12 rounded-3xl bg-card border border-border text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 dark:bg-[#D4AF37]/10 blur-[100px] rounded-full group-hover:bg-[#C5A059]/20 dark:group-hover:bg-[#D4AF37]/20 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.05] pointer-events-none" />
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Was this article helpful?</h3>
                            <p className="text-muted-foreground font-light">Your feedback helps us improve our documentation.</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                                <button className="px-6 py-2.5 rounded-full bg-[#C5A059] dark:bg-[#D4AF37] text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-sm shadow-[#C5A059]/30 dark:shadow-[#D4AF37]/30">
                                    👍 Yes, thanks
                                </button>
                                <button className="px-6 py-2.5 rounded-full border border-border bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-all">
                                    Not really
                                </button>
                            </div>
                            <div className="pt-4">
                                <Link
                                    href="/dashboard/tickets/create"
                                    className="text-sm text-muted-foreground hover:text-[#C5A059] dark:hover:text-[#D4AF37] transition-colors underline underline-offset-4"
                                >
                                    Still need help? Open a support ticket →
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </article>
        </div>
    );
}
