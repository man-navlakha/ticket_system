'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ ticketId }) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!res.ok) throw new Error('Failed to post comment');

            setContent('');
            router.refresh();
        } catch (e) {
            console.error(e);
            alert('Failed to post comment');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="mt-6 mb-12">
            <div className="relative">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add a reply..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition outline-none resize-none"
                    rows={4}
                />
                <div className="absolute bottom-3 right-3">
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Posting...' : 'Reply'}
                    </button>
                </div>
            </div>
        </form>
    )
}
