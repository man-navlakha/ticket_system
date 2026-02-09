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
        if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/kb/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/dashboard/knowledge-base');
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete article');
            }
        } catch (error) {
            console.error('Failed to delete article:', error);
            alert('An error occurred while deleting the article');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading article...</p>
            </div>
        );
    }

    if (!article) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/dashboard/knowledge-base"
                    className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-2 transition-colors"
                >
                    <span>←</span> Back to Knowledge Base
                </Link>

                {user?.role === 'ADMIN' && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                🗑️ Delete Article
                            </>
                        )}
                    </button>
                )}
            </div>

            <article className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
                {/* Category Badge */}
                {article.category && (
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {article.category.icon} {article.category.name}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-white mb-4">
                    {article.title}
                </h1>

                {/* Summary */}
                {article.summary && (
                    <p className="text-xl text-gray-400 mb-6 leading-relaxed">
                        {article.summary}
                    </p>
                )}

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {article.tags.map(({ tag }) => (
                            <span
                                key={tag.id}
                                className="px-2 py-1 rounded-md text-xs font-bold bg-white/5 text-gray-400 border border-white/10"
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 mb-8 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                            {article.createdBy?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <span>{article.createdBy?.username || article.createdBy?.email || 'Support Team'}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>👁️ {article.views || 0} views</span>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-gray-200 mt-6 mb-3" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 text-gray-300 space-y-2" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-white/5 italic text-gray-300" {...props} />,
                            code: ({ node, ...props }) => <code className="bg-black/50 px-1.5 py-0.5 rounded text-sm font-mono text-purple-300" {...props} />,
                        }}
                    >
                        {article.content}
                    </ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-white/10">
                    <p className="text-sm text-gray-500">
                        Was this article helpful? Let us know by{' '}
                        <Link href="/dashboard/create" className="text-blue-400 hover:underline">
                            creating a ticket
                        </Link>
                        {' '}if you need more assistance.
                    </p>
                </div>
            </article>

            {/* Related Ticket (if applicable) */}
            {article.sourceTicketId && (
                <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-400">
                        💡 This article was generated from{' '}
                        <Link
                            href={`/dashboard/${article.sourceTicketId}`}
                            className="font-bold hover:underline"
                        >
                            a resolved support ticket
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}
