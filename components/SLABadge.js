'use client';

import { calculateSLAStatus, getSLABadgeClass, formatHours } from '@/lib/sla';

export default function SLABadge({ ticket, compact = false }) {
    const sla = calculateSLAStatus(ticket);

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${getSLABadgeClass(sla.statusColor)}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${sla.statusColor === 'green' ? 'bg-green-500' : sla.statusColor === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                {sla.statusLabel}
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-lg border ${getSLABadgeClass(sla.statusColor)}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    SLA Status
                </span>
                <div className={`w-2 h-2 rounded-full ${sla.statusColor === 'green' ? 'bg-green-500' : sla.statusColor === 'amber' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
            </div>

            <div className="space-y-1">
                <p className="text-sm font-bold">{sla.statusLabel}</p>
                <p className="text-xs opacity-70">
                    {sla.isResolved ? 'Resolved' : 'Open'} for {formatHours(sla.hoursElapsed)}
                </p>

                {!sla.isResolved && (
                    <div className="mt-2 pt-2 border-t border-current/10">
                        <div className="text-[10px] space-y-0.5">
                            <div className="flex justify-between">
                                <span>First Response:</span>
                                <span className="font-bold">
                                    {sla.thresholds.FIRST_RESPONSE}h target
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Resolution:</span>
                                <span className="font-bold">
                                    {sla.thresholds.RESOLUTION}h target
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
