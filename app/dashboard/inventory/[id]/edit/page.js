import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isTransientPrismaConnectionError, withPrismaRetry } from "@/lib/prisma-retry";
import { notFound, redirect } from "next/navigation";
import EditInventoryForm from "@/components/EditInventoryForm";
import Link from "next/link";

export default async function EditInventoryPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) redirect("/auth/login");
    if (user.role !== "ADMIN" && user.role !== "AGENT") {
        redirect("/dashboard/inventory");
    }

    let item;
    let users;

    try {
        [item, users] = await Promise.all([
            withPrismaRetry(() => prisma.inventoryItem.findUnique({
                where: { id },
                include: {
                    user: true,
                },
            })),
            withPrismaRetry(() => prisma.user.findMany({
                select: { id: true, username: true, email: true },
                orderBy: { username: "asc" },
            })),
        ]);
    } catch (error) {
        if (isTransientPrismaConnectionError(error)) {
            return <DatabaseUnavailableState assetId={id} />;
        }

        throw error;
    }

    if (!item) notFound();

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-8 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard/inventory" className="transition-colors hover:text-foreground">Inventory</Link>
                        <span>/</span>
                        <Link href={`/dashboard/inventory/${id}`} className="font-mono transition-colors hover:text-foreground">{item.pid}</Link>
                        <span>/</span>
                        <span className="text-foreground">Edit</span>
                    </div>

                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    Asset Editor
                                </span>
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    {item.status?.replace("_", " ")}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Edit Asset Record</h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    Update lifecycle status, assignment, procurement details, and technical metadata for {item.pid}.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <HeroChip label="Asset ID" value={item.pid} />
                                <HeroChip label="Linked User" value={item.user?.username || item.assignedUser || "Unassigned"} />
                                <HeroChip label="Hardware" value={`${item.brand || "Unknown"} ${item.model || ""}`.trim()} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/dashboard/inventory/${item.id}`}
                                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                            >
                                View Asset
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <EditInventoryForm item={item} users={users} />
        </div>
    );
}

function DatabaseUnavailableState({ assetId }) {
    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    <Link href="/dashboard/inventory" className="transition-colors hover:text-foreground">Inventory</Link>
                    <span>/</span>
                    <span className="font-mono text-foreground">{assetId}</span>
                    <span>/</span>
                    <span className="text-foreground">Edit</span>
                </div>
            </div>

            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-8 shadow-sm">
                <div className="max-w-2xl space-y-4">
                    <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        Database Connection Issue
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">The asset editor could not reach the database.</h1>
                    <p className="text-base leading-relaxed text-muted-foreground">
                        This usually happens when the hosted database is waking up or the network briefly drops. Wait a few seconds and try again.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href={`/dashboard/inventory/${assetId}/edit`}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background transition hover:opacity-90"
                        >
                            Retry Editor
                        </Link>
                        <Link
                            href={`/dashboard/inventory/${assetId}`}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold text-foreground transition hover:bg-muted/50"
                        >
                            Open Asset Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroChip({ label, value }) {
    return (
        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{value || "-"}</p>
        </div>
    );
}
