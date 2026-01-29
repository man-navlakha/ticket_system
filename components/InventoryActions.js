'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCodeModal from '@/components/QRCodeModal';

export default function InventoryActions({ item }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/inventory/${item.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete item');
            }

            router.refresh();
        } catch (error) {
            alert('Error deleting item');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <QRCodeModal
                inventoryId={item.id}
                itemInfo={{
                    pid: item.pid,
                    type: item.type,
                    brand: item.brand,
                    model: item.model
                }}
            />
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Delete Item"
            >
                {isDeleting ? (
                    <span className="loading loading-spinner loading-xs">...</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                )}
            </button>
        </div>
    );
}
