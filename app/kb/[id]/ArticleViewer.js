'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useState } from 'react';

export default function ArticleViewer({ article }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <article className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-8 uppercase tracking-widest">
                <Link
                    href="/kb"
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Knowledge Base
                </Link>
                <span>/</span>
                <span className="text-foreground">Article</span>
            </nav>

            {/* Header */}
            <header className="mb-12 border-b border-border pb-8">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                        {article.category?.name || 'General'}
                    </span>
                    <span className="text-sm text-muted-foreground font-mono">
                        Last updated: {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-[1.2]">
                    {article.title}
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                    {article.summary}
                </p>

                {/* Meta / Sharing */}
                <div className="flex items-center justify-between mt-8 pt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center text-xs font-bold ring-2 ring-background">
                                {article.createdBy?.username?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="text-sm">
                                <span className="block text-foreground font-medium">{article.createdBy?.username || 'System Admin'}</span>
                                <span className="block text-xs text-muted-foreground">Author</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-secondary-foreground transition-colors"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Share
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="prose prose-lg max-w-none 
          text-foreground
          prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-strong:text-foreground prose-strong:font-bold
          prose-a:text-blue-500 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
          prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-li:text-muted-foreground
          prose-hr:border-border">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-12 mb-6 text-foreground border-b border-border pb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-10 mb-5 text-foreground" {...props} />,
                        img: ({ node, ...props }) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <div className="my-8 rounded-xl overflow-hidden border border-border bg-muted">
                                <img className="w-full h-auto" {...props} alt={props.alt || 'Article Image'} />
                            </div>
                        ),
                        table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-8 border border-border rounded-lg">
                                <table className="w-full text-left text-sm" {...props} />
                            </div>
                        ),
                        th: ({ node, ...props }) => <th className="bg-muted p-3 font-semibold text-foreground border-b border-border" {...props} />,
                        td: ({ node, ...props }) => <td className="p-3 border-b border-border text-muted-foreground" {...props} />,
                        blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-blue-500/50 pl-4 py-1 my-6 bg-blue-500/5 rounded-r italic text-muted-foreground" {...props} />
                        ),
                    }}
                >
                    {article.content}
                </ReactMarkdown>
            </div>

            {/* Helpful / Footer */}
            <footer className="mt-20 pt-10 border-t border-border">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 rounded-2xl bg-card border border-border">
                    <div>
                        <h3 className="font-bold text-foreground mb-1">Was this article helpful?</h3>
                        <p className="text-sm text-muted-foreground">Your feedback helps us improve our documentation.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors">Yes, thanks</button>
                        <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors">Not really</button>
                    </div>
                </div>
            </footer>
        </article>
    );
}
