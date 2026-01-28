'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ ticketId }) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const [files, setFiles] = useState([]);

    async function onSubmit(e) {
        e.preventDefault();
        if (!content.trim() && files.length === 0) return;

        setLoading(true);
        try {
            let attachmentUrls = [];
            if (files.length > 0) {
                const uploadPromises = Array.from(files).map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
                    if (!uploadRes.ok) throw new Error('Upload failed');
                    const uploadJson = await uploadRes.json();
                    return uploadJson.url;
                });
                attachmentUrls = await Promise.all(uploadPromises);
            }

            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, attachmentUrls })
            });

            if (!res.ok) throw new Error('Failed to post comment');

            setContent('');
            setFiles([]);
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
            <div className="relative bg-white/5 border border-white/10 rounded-xl p-2 transition focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add a reply..."
                    className="w-full bg-transparent text-white placeholder-gray-500 border-none focus:ring-0 outline-none resize-none p-2 min-h-[100px]"
                    rows={3}
                />

                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 mx-2 mb-2">
                        {Array.from(files).map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-white/10 rounded-lg px-2 py-1 text-blue-300">
                                <span>📎 {file.name}</span>
                                <button type="button" onClick={() => setFiles(prev => {
                                    const newFiles = [...prev];
                                    newFiles.splice(idx, 1);
                                    return newFiles;
                                })} className="hover:text-white">✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center px-2 pb-1">
                    <label className="cursor-pointer text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/5 transition">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={e => {
                                if (e.target.files) {
                                    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
                                }
                            }}
                        />
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </label>

                    <button
                        type="submit"
                        disabled={loading || (!content.trim() && files.length === 0)}
                        className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Posting...' : 'Reply'}
                    </button>
                </div>
            </div>
        </form>
    )
}
