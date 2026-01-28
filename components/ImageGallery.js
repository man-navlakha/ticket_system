'use client';

import { useState } from 'react';

export default function ImageGallery({ attachments }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [zoom, setZoom] = useState(1);

    if (!attachments || attachments.length === 0) return null;

    const openLightbox = (index) => {
        setSelectedIndex(index);
        setZoom(1);
    };

    const closeLightbox = () => {
        setSelectedIndex(null);
        setZoom(1);
    };

    const handleImageClick = (e) => {
        e.stopPropagation();
        // Toggle Zoom: 1 -> 2 -> 3 -> 1
        setZoom(prev => prev >= 3 ? 1 : prev + 1);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : attachments.length - 1));
        setZoom(1);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setSelectedIndex(prev => (prev < attachments.length - 1 ? prev + 1 : 0));
        setZoom(1);
    };

    const currentUrl = selectedIndex !== null ? attachments[selectedIndex] : '';
    const isPdf = currentUrl.toLowerCase().endsWith('.pdf');

    return (
        <>
            {/* Thumbnails Grid */}
            <div className="flex flex-wrap gap-3 mt-4">
                {attachments.map((url, idx) => {
                    const isPdfFile = url.toLowerCase().endsWith('.pdf');
                    return (
                        <div
                            key={idx}
                            onClick={() => openLightbox(idx)}
                            className="relative w-[100px] h-[100px] border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/40 hover:opacity-80 transition-all bg-black/20 group"
                        >
                            {isPdfFile ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                                    <span className="text-2xl">📄</span>
                                    <span className="text-[10px] uppercase font-bold mt-1">PDF</span>
                                </div>
                            ) : (
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    );
                })}
            </div>

            {/* Lightbox / Modal */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Controls */}
                    <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-[60]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {attachments.length > 1 && (
                        <>
                            <button onClick={handlePrev} className="absolute left-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={handleNext} className="absolute right-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}

                    {/* Content */}
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4 md:p-10 overflow-hidden"
                        onClick={isPdf ? undefined : handleImageClick} // Only click-to-zoom for images
                    >
                        {isPdf ? (
                            <iframe
                                src={currentUrl}
                                className="w-full h-full max-w-5xl rounded-lg bg-white"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div
                                className="relative transition-transform duration-300 ease-out cursor-zoom-in"
                                style={{ transform: `scale(${zoom})` }}
                            >
                                <img
                                    src={currentUrl}
                                    alt="Enlarged view"
                                    className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm"
                                />
                            </div>
                        )}
                    </div>

                    {!isPdf && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-black/50 backdrop-blur rounded-full border border-white/10 text-sm font-medium text-gray-300">
                            <button onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(1, prev - 1)); }} className="hover:text-white p-1">➖</button>
                            <span>{Math.round(zoom * 100)}%</span>
                            <button onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(5, prev + 1)); }} className="hover:text-white p-1">➕</button>
                            <span className="w-px h-4 bg-white/20 mx-2"></span>
                            <a href={currentUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-blue-400 flex items-center gap-1">
                                Download
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
