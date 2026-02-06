'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function BulkInventoryUpload() {
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/inventory/bulk', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setResult(data);
            if (res.ok && data.success > 0) {
                router.refresh();
            }
        } catch (error) {
            setResult({ errors: ['Network or server error during upload.'] });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white/10 text-white border border-white/20 text-sm font-bold hover:bg-white/20 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
                Bulk Upload
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Bulk Inventory Upload</h2>
                                <p className="text-sm text-gray-400 mt-1">Upload an Excel (.xlsx) file to add multiple items.</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">

                            {/* Tips */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 space-y-2">
                                <p className="font-bold flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    Column format instructions
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-blue-200/80">
                                    <li>Required: <b>PID</b> (Unique ID)</li>
                                    <li>Optional: Type (Computer, Laptop), Status, Ownership, Brand, Model, Price</li>
                                    <li>Dates: Purchased Date, Warranty Date, Assigned Date (Format: YYYY-MM-DD)</li>
                                    <li>Assign User: <b>Assigned To User Email</b> (Must match system email)</li>
                                </ul>
                            </div>

                            {/* Upload Area */}
                            {!uploading && !result && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all group"
                                >
                                    <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-300 font-medium">Click to select Excel file</p>
                                    <p className="text-gray-500 text-sm mt-1">.xlsx or .xls files only</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleUpload}
                                    />
                                </div>
                            )}

                            {/* Loading State */}
                            {uploading && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">Processing File...</h3>
                                        <p className="text-gray-400 text-sm">Parsing rows and updating database.</p>
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {result && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                                            <p className="text-green-400 text-xs font-bold uppercase tracking-wider">Success</p>
                                            <p className="text-3xl font-bold text-white mt-1">{result.success || 0}</p>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                                            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Failed</p>
                                            <p className="text-3xl font-bold text-white mt-1">{result.failed || 0}</p>
                                        </div>
                                    </div>

                                    {result.errors && result.errors.length > 0 && (
                                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 font-bold text-red-400 text-sm">
                                                Error Log
                                            </div>
                                            <div className="p-4 max-h-48 overflow-y-auto text-sm text-red-200/80 font-mono space-y-1">
                                                {result.errors.map((err, i) => (
                                                    <div key={i}>{err}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={() => {
                                                if (result.success > 0) setIsOpen(false);
                                                setResult(null);
                                            }}
                                            className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            {result.success > 0 ? 'Done' : 'Try Again'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
