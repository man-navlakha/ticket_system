'use client';

import { useState } from 'react';

export default function QRCodeModal({ inventoryId, itemInfo }) {
    const [isOpen, setIsOpen] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateQR = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/${inventoryId}/qr`);
            if (res.ok) {
                const data = await res.json();
                setQrData(data);
                setIsOpen(true);
            } else {
                alert('Failed to generate QR code');
            }
        } catch (error) {
            console.error('QR generation error:', error);
            alert('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!qrData) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qrData.item.pid}</title>
          <style>
            @page {
              size: A5;
              margin: 10mm;
            }
            body {
              font-family: 'Inter', -apple-system, system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 10px;
            }
            .qr-code {
              width: 300px;
              height: 300px;
              margin: 20px auto;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 10px;
              font-weight: bold;
            }
            .item-info {
              margin: 15px 0;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Man's Support Desk</h1>
            <img src="${qrData.qrCode}" alt="QR Code" class="qr-code" />
            <div class="item-info">
              <div><span class="label">PID:</span> ${qrData.item.pid}</div>
              <div><span class="label">Type:</span> ${qrData.item.type}</div>
              ${qrData.item.brand ? `<div><span class="label">Brand:</span> ${qrData.item.brand}</div>` : ''}
              ${qrData.item.model ? `<div><span class="label">Model:</span> ${qrData.item.model}</div>` : ''}
            </div>
            <div class="instructions">
              Scan this QR code to report an issue with this device
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    const downloadQR = () => {
        if (!qrData) return;

        const link = document.createElement('a');
        link.href = qrData.qrCode;
        link.download = `qr-${qrData.item.pid}.png`;
        link.click();
    };

    return (
        <>
            <button
                onClick={generateQR}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </>
                )}
            </button>

            {isOpen && qrData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">QR Code Label</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-lg mb-4">
                            <img src={qrData.qrCode} alt="QR Code" className="w-full" />
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 mb-4 text-sm">
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">PID:</span>
                                    <span className="font-bold">{qrData.item.pid}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Type:</span>
                                    <span className="font-bold">{qrData.item.type}</span>
                                </div>
                                {qrData.item.brand && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Brand:</span>
                                        <span className="font-bold">{qrData.item.brand}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-bold"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Label
                            </button>
                            <button
                                onClick={downloadQR}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all text-sm font-bold"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
