'use client';

import { useState } from 'react';

export default function InventoryInfoModal({ item }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!item) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 underline ml-2"
            >
                View Details
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold mb-1">Device Details</h2>
                        <p className="text-gray-400 text-sm mb-6">Full specifications for this asset.</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">PID</span>
                                    <span className="font-mono text-white select-all">{item.pid}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Type</span>
                                    <span className="text-white">{item.type}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Brand</span>
                                    <span className="text-white">{item.brand || '-'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Model</span>
                                    <span className="text-white">{item.model || '-'}</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Ownership</span>
                                <span className="text-white">{item.ownership}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Warranty Exp.</span>
                                    <span className={item.warrantyDate && new Date(item.warrantyDate) < new Date() ? "text-red-400" : "text-gray-300"}>
                                        {item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Return Date</span>
                                    <span className="text-gray-300">
                                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {item.components && item.components.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Components</span>
                                    <div className="flex flex-wrap gap-2">
                                        {item.components.map((comp, i) => (
                                            <span key={i} className="px-2 py-1 rounded bg-black border border-white/10 text-xs text-gray-300">
                                                {comp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 text-right">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
