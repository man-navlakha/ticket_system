'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConvertToKBButton({ ticketId, ticketStatus, userRole }) {
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [article, setArticle] = useState(null);
    const router = useRouter();

    // Only show for ADMIN and AGENT on resolved tickets
    const canConvert =
        (userRole === 'ADMIN' || userRole === 'AGENT') &&
        (ticketStatus === 'RESOLVED' || ticketStatus === 'CLOSED');

    if (!canConvert) {
        return null;
    }

    const handleConvert = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/kb/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId }),
            });

            if (res.ok) {
                const data = await res.json();
                setArticle(data.article);
                setShowPreview(true);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to convert ticket to article');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Failed to convert ticket to article');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!article) return;

        try {
            const res = await fetch(`/api/kb/${article.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: true }),
            });

            if (res.ok) {
                alert('Article published successfully!');
                setShowPreview(false);
                router.push('/dashboard/knowledge-base');
            } else {
                alert('Failed to publish article');
            }
        } catch (error) {
            console.error('Publish error:', error);
            alert('Failed to publish article');
        }
    };

    return (
        <>
            <button
                onClick={handleConvert}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Converting...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Convert to KB Article
                    </>
                )}
            </button>

            {showPreview && article && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl max-w-3xl w-full my-8">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">Knowledge Base Article Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
                                {article.summary && (
                                    <p className="text-gray-400 text-sm">{article.summary}</p>
                                )}
                            </div>

                            {article.category && (
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        {article.category.icon} {article.category.name}
                                    </span>
                                </div>
                            )}

                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {article.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10"
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="prose prose-invert max-w-none">
                                <div
                                    className="text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: article.content
                                            .replace(/^# /gm, '<h1 class="text-xl font-bold mt-6 mb-3">')
                                            .replace(/\n/g, '</h1>')
                                            .replace(/^## /gm, '<h2 class="text-lg font-bold mt-4 mb-2">')
                                            .replace(/^### /gm, '<h3 class="text-base font-bold mt-3 mb-1.5">')
                                            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
                                            .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                                            .replace(/^- /gm, '<li class="ml-4">')
                                            .replace(/\n\n/g, '</p><p class="mb-3">')
                                            .replace(/^(?!<[hl]|<li)/gm, '<p class="mb-3">'),
                                    }}
                                />
                            </div>

                            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-400">
                                    ⚠️ Please review the content carefully. AI has removed personal information, but verify before
                                    publishing.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-white/10">
                            <button
                                onClick={handlePublish}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all text-sm font-bold"
                            >
                                Publish Article
                            </button>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all text-sm font-bold"
                            >
                                Edit Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
