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
    const [imageSize, setImageSize] = useState('512'); // Default 512px

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

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            setError('Image size must be less than 5MB');
            return;
        }

        setUploadingImage(true);
        setError('');

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                const imageUrl = data.url;

                // Create markdown with HTML img tag for size control
                let markdownImage;
                if (imageSize === 'full') {
                    markdownImage = `![Image](${imageUrl})`;
                } else {
                    markdownImage = `<img src="${imageUrl}" alt="Image" width="${imageSize}px" />`;
                }

                setFormData(prev => ({
                    ...prev,
                    content: prev.content + '\n' + markdownImage + '\n'
                }));
            } else {
                setError('Failed to upload image');
            }
        } catch (error) {
            setError('Image upload failed');
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
            case 'h1':
                newText = `# ${selectedText || 'Heading 1'}`;
                break;
            case 'h2':
                newText = `## ${selectedText || 'Heading 2'}`;
                break;
            case 'h3':
                newText = `### ${selectedText || 'Heading 3'}`;
                break;
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                break;
            case 'code':
                newText = `\`${selectedText || 'code'}\``;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                break;
            case 'ul':
                newText = `\n- ${selectedText || 'List item'}\n- Item 2\n- Item 3`;
                break;
            case 'ol':
                newText = `\n1. ${selectedText || 'First item'}\n2. Second item\n3. Third item`;
                break;
            case 'quote':
                newText = `> ${selectedText || 'Quote'}`;
                break;
            case 'youtube':
                newText = `[![YouTube](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)`;
                break;
            default:
                return;
        }

        const newContent =
            formData.content.substring(0, start) +
            newText +
            formData.content.substring(end);

        setFormData({ ...formData, content: newContent });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + newText.length, start + newText.length);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

            const res = await fetch('/api/kb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: tagsArray
                })
            });

            if (res.ok) {
                router.push('/dashboard/knowledge-base');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create article');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href="/dashboard/knowledge-base"
                className="text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2 transition-colors"
            >
                <span>←</span> Back to Knowledge Base
            </Link>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-6">Create Knowledge Base Article</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none"
                            placeholder="e.g., How to fix printer jamming"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                            <select
                                value={formData.categoryName}
                                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none"
                            >
                                <option value="Hardware">Hardware</option>
                                <option value="Software">Software</option>
                                <option value="Network">Network</option>
                                <option value="Access & Security">Access & Security</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none"
                                placeholder="e.g., printer, jam, paper"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Summary</label>
                        <textarea
                            required
                            rows="2"
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none resize-none"
                            placeholder="Brief description of the solution..."
                        />
                    </div>

                    {/* Content Editor */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-400">Content</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('write')}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeTab === 'write'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${activeTab === 'preview'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>

                        {/* Markdown Toolbar */}
                        {activeTab === 'write' && (
                            <div className="flex flex-wrap gap-1 mb-2 p-2 bg-black/30 border border-white/10 rounded-lg">
                                <button type="button" onClick={() => insertMarkdown('h1')} className="px-2 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Heading 1">H1</button>
                                <button type="button" onClick={() => insertMarkdown('h2')} className="px-2 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Heading 2">H2</button>
                                <button type="button" onClick={() => insertMarkdown('h3')} className="px-2 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Heading 3">H3</button>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button type="button" onClick={() => insertMarkdown('bold')} className="px-2 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Bold"><strong>B</strong></button>
                                <button type="button" onClick={() => insertMarkdown('italic')} className="px-2 py-1 text-xs italic bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Italic">I</button>
                                <button type="button" onClick={() => insertMarkdown('code')} className="px-2 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Inline Code">{'</>'}</button>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button type="button" onClick={() => insertMarkdown('ul')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Bullet List">• List</button>
                                <button type="button" onClick={() => insertMarkdown('ol')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Numbered List">1. List</button>
                                <button type="button" onClick={() => insertMarkdown('quote')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Quote">" Quote</button>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button type="button" onClick={() => insertMarkdown('link')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="Link">🔗 Link</button>
                                <select
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value)}
                                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors border border-white/10 outline-none"
                                    title="Image Size"
                                >
                                    <option value="100" className="bg-gray-900">100px</option>
                                    <option value="256" className="bg-gray-900">256px</option>
                                    <option value="512" className="bg-gray-900">512px</option>
                                    <option value="full" className="bg-gray-900">Full Width</option>
                                </select>
                                <label className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors cursor-pointer flex items-center gap-1">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                                    {uploadingImage ? (<><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />Uploading...</>) : (<>🖼️ Image</>)}
                                </label>
                                <button type="button" onClick={() => insertMarkdown('youtube')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors" title="YouTube Embed">▶️ YouTube</button>
                            </div>
                        )}

                        {activeTab === 'write' ? (
                            <textarea
                                id="content-editor"
                                required
                                rows="15"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white transition-all outline-none font-mono text-sm leading-relaxed"
                                placeholder="# Problem..."
                            />
                        ) : (
                            <div className="w-full min-h-[400px] bg-black/50 border border-white/10 rounded-xl p-6 overflow-y-auto">
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 border-b border-white/10 pb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-gray-200 mt-4 mb-2" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1" {...props} />,
                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                            img: ({ node, ...props }) => <img className="rounded-lg my-4 max-w-full" {...props} />,
                                            code: ({ node, ...props }) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-purple-300" {...props} />,
                                        }}
                                    >
                                        {formData.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2 text-right">Markdown supported • Click toolbar buttons for shortcuts</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Link
                            href="/dashboard/knowledge-base"
                            className="px-6 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Article'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
