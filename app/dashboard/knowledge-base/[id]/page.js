'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchArticle();
        fetchUser();
    }, [params.id]);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchArticle = async () => {
        try {
            const res = await fetch(`/api/kb/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setArticle(data.article);
            } else {
                router.push('/dashboard/knowledge-base');
            }
        } catch (error) {
            console.error('Failed to fetch article:', error);
            router.push('/dashboard/knowledge-base');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure?')) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/kb/${params.id}`, { method: 'DELETE' });
            if (res.ok) router.push('/dashboard/knowledge-base');
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-4 w-48 bg-muted/20 rounded" />
            <div className="h-12 w-3/4 bg-muted/20 rounded" />
            <div className="h-6 w-1/2 bg-muted/20 rounded" />
            <div className="space-y-4 pt-8">
                <div className="h-4 w-full bg-muted/20 rounded" />
                <div className="h-4 w-full bg-muted/20 rounded" />
                <div className="h-4 w-5/6 bg-muted/20 rounded" />
            </div>
        </div>
    );

    if (!article) return null;

    return (
        <div className="flex gap-12 animate-in fade-in duration-500">
            {/* Main Content */}
            <article className="flex-1 max-w-3xl min-w-0">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8">
                    <Link href="/dashboard/knowledge-base" className="hover:text-foreground transition-colors">KB</Link>
                    <span>/</span>
                    <span className="text-muted-foreground/70 truncate max-w-[150px]">{article.category?.name || 'General'}</span>
                    <span>/</span>
                    <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
                </div>

                {/* Header */}
                <header className="space-y-4 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                        {article.title}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                        {article.summary}
                    </p>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-foreground">
                                {article.createdBy?.username?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground">{article.createdBy?.username || 'Team'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Article Author</span>
                            </div>
                        </div>
                        <span className="text-muted-foreground">|</span>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Updated {new Date(article.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="prose prose-neutral dark:prose-invert max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:leading-relaxed prose-p:text-lg
                    prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl
                    prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-li:text-lg
                    prose-hr:border-border
                    ">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl mt-12 mb-6" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl mt-10 mb-5" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl mt-8 mb-4" {...props} />,
                        }}
                    >
                        {article.content}
                    </ReactMarkdown>
                </div>

                {/* Footer Actions */}
                <footer className="mt-20 pt-10 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {user?.role === 'ADMIN' && (
                            <button
                                onClick={handleDelete}
                                className="text-xs font-bold uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Article'}
                            </button>
                        )}
                    </div>
                    <Link href="/dashboard/knowledge-base" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                        <span>←</span> Back to Base
                    </Link>
                </footer>
            </article>

            {/* Right Sidebar (Table of Contents / Info) */}
            <aside className="w-64 flex-shrink-0 hidden xl:block sticky top-8 h-fit space-y-8">
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">On this page</h4>
                    <nav className="space-y-1">
                        {/* Placeholder for real TOC generation if needed */}
                        <p className="text-xs text-muted-foreground/80 px-3 py-2 italic">Auto-generated based on heading patterns.</p>
                    </nav>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 rounded bg-muted/50">
                            <div className="text-lg font-bold text-foreground">{article.views || 0}</div>
                            <div className="text-[8px] text-muted-foreground uppercase font-black">Views</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/50">
                            <div className="text-lg font-bold text-foreground">{article.upvotes || 0}</div>
                            <div className="text-[8px] text-muted-foreground uppercase font-black">Upvotes</div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 px-2">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Found a mistake? Help us improve our documentation.
                    </p>
                    <Link href={`/dashboard/tickets/create?topic=KB:${article.id}`} className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">
                        Report an issue →
                    </Link>
                </div>
            </aside>
        </div>
    );
}
