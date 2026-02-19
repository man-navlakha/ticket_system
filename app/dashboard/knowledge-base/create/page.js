'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CreateArticlePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('write');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageSize, setImageSize] = useState('512');

    const [formData, setFormData] = useState({
        title: '',
        categoryName: 'Hardware',
        tags: '',
        summary: '',
        content: '# Problem\n\nDescribe the issue...\n\n# Solution\n\n1. Step 1\n2. Step 2\n\n# Prevention\n\nTips to avoid recurrence...',
        published: true
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
            if (res.ok) {
                const data = await res.json();
                const markdownImage = imageSize === 'full' ? `![Image](${data.url})` : `<img src="${data.url}" width="${imageSize}px" />`;
                setFormData(prev => ({ ...prev, content: prev.content + '\n' + markdownImage + '\n' }));
            }
        } catch (error) {
            setError('Upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById('content-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.content.substring(start, end);
        let newText = '';
        switch (syntax) {
            case 'h1': newText = `# ${selectedText || 'Heading 1'}`; break;
            case 'h2': newText = `## ${selectedText || 'Heading 2'}`; break;
            case 'bold': newText = `**${selectedText || 'bold'}**`; break;
            case 'code': newText = `\`${selectedText || 'code'}\``; break;
            case 'ul': newText = `\n- ${selectedText || 'Item'}`; break;
            default: return;
        }
        setFormData({ ...formData, content: formData.content.substring(0, start) + newText + formData.content.substring(end) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/kb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) })
            });
            if (res.ok) router.push('/dashboard/knowledge-base');
        } catch (error) {
            setError('Failed to create');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Article</h1>
                    <p className="text-gray-500 text-sm">Draft a new guide for the knowledge base.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'write' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-700 focus:border-white/30 transition-all outline-none [color-scheme:dark]"
                            placeholder="e.g., VPN Setup Guide"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</label>
                        <select
                            value={formData.categoryName}
                            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-white/30 transition-all outline-none [color-scheme:dark]"
                        >
                            <option>Hardware</option>
                            <option>Software</option>
                            <option>Network</option>
                            <option>Security</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Summary</label>
                    <textarea
                        rows="2"
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-700 focus:border-white/30 transition-all outline-none resize-none [color-scheme:dark]"
                        placeholder="A short overview of the article..."
                    />
                </div>

                {activeTab === 'write' ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 p-2 bg-[#0A0A0A] border border-white/5 rounded-xl">
                            <button type="button" onClick={() => insertMarkdown('h1')} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-white transition-colors">H1</button>
                            <button type="button" onClick={() => insertMarkdown('h2')} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-white transition-colors">H2</button>
                            <button type="button" onClick={() => insertMarkdown('bold')} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-white transition-colors">B</button>
                            <button type="button" onClick={() => insertMarkdown('code')} className="px-3 py-1 text-xs font-mono text-gray-500 hover:text-white transition-colors">{"</>"}</button>
                            <div className="flex-1" />
                            <label className="px-3 py-1 text-[10px] font-bold uppercase tracking-tighter bg-white/5 text-gray-400 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                                <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                {uploadingImage ? 'Uploading...' : 'Add Image'}
                            </label>
                        </div>
                        <textarea
                            id="content-editor"
                            required
                            rows="15"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-6 py-6 text-white placeholder:text-gray-800 focus:border-white/20 transition-all outline-none font-mono text-sm leading-relaxed no-scrollbar [color-scheme:dark]"
                            placeholder="# Write your article here..."
                        />
                    </div>
                ) : (
                    <div className="w-full min-h-[400px] bg-[#0A0A0A] border border-white/10 rounded-xl p-8 prose prose-invert prose-blue max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.content}</ReactMarkdown>
                    </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <p className="text-xs text-gray-500">Markdown syntax is supported.</p>
                    <div className="flex gap-4">
                        <Link href="/dashboard/knowledge-base" className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-white transition-colors">Cancel</Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-white/5"
                        >
                            {loading ? 'Creating...' : 'Create Article'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
