import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isTransientPrismaConnectionError, withPrismaRetry } from "@/lib/prisma-retry";
import Link from "next/link";
import { redirect } from "next/navigation";
import UserInventoryLink from "@/components/UserInventoryLink";
import InventorySearch from "@/components/InventorySearch";
import BulkInventoryUpload from "@/components/BulkInventoryUpload";
import InventoryIntelligenceSection from "@/components/InventoryIntelligenceSection";

export const dynamic = "force-dynamic";
export const metadata = {
    title: "Hardware Inventory & Asset Management",
    description: "Track and manage enterprise hardware assets. Real-time visibility into laptop assignments, warranty status, and lifecycle management.",
    openGraph: {
        title: "Hardware Inventory | Man's Support Desk",
        description: "Enterprise-grade asset management for modern IT teams.",
    },
};

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const where = user.role === "USER" ? { userId: user.id } : {};

    let items;
    let users;

    try {
        [items, users] = await Promise.all([
            withPrismaRetry(() => prisma.inventoryItem.findMany({
                where,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { username: true, email: true } },
                },
            })),
            user.role === "ADMIN" || user.role === "AGENT"
                ? withPrismaRetry(() => prisma.user.findMany({
                    select: { id: true, username: true, email: true },
                    orderBy: { username: "asc" },
                }))
                : Promise.resolve([]),
        ]);
    } catch (error) {
        if (isTransientPrismaConnectionError(error)) {
            return <DatabaseUnavailableState />;
        }

        throw error;
    }

    const serializedItems = items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
        assignedDate: item.assignedDate?.toISOString() || null,
        returnDate: item.returnDate?.toISOString() || null,
        maintenanceDate: item.maintenanceDate?.toISOString() || null,
        purchasedDate: item.purchasedDate?.toISOString() || null,
        warrantyDate: item.warrantyDate?.toISOString() || null,
    }));

    const totalAssets = items.length;
    const assignedAssets = items.filter((item) => item.userId || item.assignedUser).length;
    const maintenanceAssets = items.filter((item) => item.status === "MAINTENANCE").length;
    const portfolioValue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(items.reduce((acc, curr) => acc + (curr.price || 0), 0));

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <section data-tour="inventory-hero" className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-8 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <span className="text-foreground">Inventory</span>
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                                Asset Operations Hub
                            </span>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Hardware Assets</h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    Track assignments, maintenance posture, and portfolio value from one inventory command surface.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <HeroChip label="Active Registry" value={`${totalAssets} assets`} />
                                <HeroChip label="Assigned" value={`${assignedAssets} linked`} />
                                <HeroChip label="In Maintenance" value={`${maintenanceAssets} flagged`} />
                            </div>
                        </div>

                        {(user.role === "ADMIN" || user.role === "AGENT") && (
                            <div className="flex flex-wrap items-center gap-3">
                                <BulkInventoryUpload />
                                <Link
                                    href="/dashboard/inventory/create"
                                    className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background shadow-lg transition hover:opacity-90 active:scale-[0.98]"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Asset
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Assets" value={totalAssets.toString()} color="text-foreground" />
                <StatCard
                    label="Assigned"
                    value={assignedAssets.toString()}
                    percentage={`${totalAssets > 0 ? ((assignedAssets / totalAssets) * 100).toFixed(0) : 0}%`}
                    color="text-blue-500"
                />
                <StatCard label="Maintenance" value={maintenanceAssets.toString()} color="text-amber-500" />
                <StatCard label="Portfolio Value" value={portfolioValue} color="text-green-500" />
            </div>

            {user.role === "USER" && <UserInventoryLink />}

            {(user.role === "ADMIN" || user.role === "AGENT") && (
                <InventoryIntelligenceSection items={serializedItems} />
            )}

            <section data-tour="inventory-register" className="space-y-5">
                <SectionHeading
                    eyebrow="Registry"
                    title="Asset register"
                    description="Search, filter, bulk-manage, and inspect every tracked asset from a single workspace."
                />
                <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                    <InventorySearch
                        items={serializedItems}
                        users={users}
                        userRole={user.role}
                    />
                </div>
            </section>

            <div className="border-t border-border pt-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Need to audit a specific rack or department? <Link href="/dashboard/help" className="font-medium text-foreground hover:underline">Contact Asset Management</Link>.
                </p>
            </div>
        </div>
    );
}

function HeroChip({ label, value }) {
    return (
        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
        </div>
    );
}

function StatCard({ label, value, percentage, color }) {
    return (
        <div className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 shadow-sm transition-all hover:bg-muted/30">
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-gradient-to-br from-foreground/5 to-transparent transition-transform duration-700 group-hover:scale-150" />
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className={`text-3xl font-bold tracking-tighter ${color}`}>{value}</h3>
                {percentage && <span className="text-xs font-medium text-muted-foreground">({percentage})</span>}
            </div>
        </div>
    );
}

function SectionHeading({ eyebrow, title, description }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function DatabaseUnavailableState() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                <span>/</span>
                <span className="text-foreground">Inventory</span>
            </div>

            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-8 shadow-sm">
                <div className="max-w-2xl space-y-4">
                    <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        Database Connection Issue
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">The inventory workspace could not reach the database.</h1>
                    <p className="text-base leading-relaxed text-muted-foreground">
                        This usually means the hosted database is waking up, temporarily paused, or the network dropped for a moment. Wait a few seconds and retry the page.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href="/dashboard/inventory"
                            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background transition hover:opacity-90"
                        >
                            Retry Inventory
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold text-foreground transition hover:bg-muted/50"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
