export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse" role="status" aria-label="Loading dashboard">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-3">
                        <div className="h-4 w-32 rounded-full bg-muted" />
                        <div className="h-10 w-72 max-w-full rounded-lg bg-muted" />
                        <div className="h-4 w-96 max-w-full rounded-full bg-muted" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-28 rounded-full bg-muted" />
                        <div className="h-10 w-28 rounded-full bg-muted" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-24 rounded-full bg-muted" />
                            <div className="h-4 w-4 rounded-full bg-muted" />
                        </div>
                        <div className="mt-5 h-8 w-20 rounded-lg bg-muted" />
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <div className="h-5 w-48 rounded-full bg-muted" />
                </div>
                <div className="divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
                            <div className="space-y-2">
                                <div className="h-4 w-64 max-w-full rounded-full bg-muted" />
                                <div className="h-3 w-40 max-w-full rounded-full bg-muted" />
                            </div>
                            <div className="h-4 w-32 rounded-full bg-muted" />
                            <div className="h-4 w-24 rounded-full bg-muted" />
                            <div className="h-9 w-24 rounded-full bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
