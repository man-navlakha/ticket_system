import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InventoryActions from "@/components/InventoryActions";
import { getInventoryStatusBadgeClass, getInventoryStatusLabel } from "@/lib/inventory-status";

export const dynamic = "force-dynamic";

export default async function InventoryItemPage({ params }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true, email: true } },
            tickets: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                    componentName: true,
                },
            },
            maintenanceRecords: {
                orderBy: { startDate: "desc" },
            },
        },
    });

    if (!item) notFound();

    if (user.role === "USER" && item.userId !== user.id) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="max-w-lg rounded-[2rem] border border-destructive/15 bg-card p-10 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
                        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Restricted Asset</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Access Restricted</h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        This hardware asset is not currently assigned to your account, so the full record cannot be opened from your session.
                    </p>
                    <Link
                        href="/dashboard/inventory"
                        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background transition hover:opacity-90"
                    >
                        Return to Inventory
                    </Link>
                </div>
            </div>
        );
    }

    const isAdmin = user.role === "ADMIN" || user.role === "AGENT";
    const linkedAssignee = item.user?.username || item.assignedUser || "Unassigned";
    const ticketCount = item.tickets.length;
    const maintenanceCount = item.maintenanceRecords.length;
    const assetValue = formatCurrency(item.price);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-8 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard/inventory" className="transition-colors hover:text-foreground">Inventory</Link>
                        <span>/</span>
                        <span className="font-mono text-foreground">{item.pid}</span>
                    </div>

                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <StatusBadge status={item.status} />
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                    {item.ownership || "Company"} Portfolio
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{item.pid}</h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    A complete lifecycle record for {item.brand || "this device"} {item.model || ""}, including assignment, support history, and service events.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <HeroChip label="Hardware" value={`${item.brand || "Unknown brand"} ${item.model || ""}`.trim()} />
                                <HeroChip label="Assigned To" value={linkedAssignee} />
                                <HeroChip label="Last Warranty Date" value={formatDate(item.warrantyDate)} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/dashboard/system-reports/${item.pid}`}
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                System Reports
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link
                                        href={`/dashboard/inventory/${item.id}/edit`}
                                        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Details
                                    </Link>
                                    <div className="rounded-full border border-border bg-background px-2 py-1 shadow-sm">
                                        <InventoryActions item={item} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Assigned Holder" value={linkedAssignee} accent="text-foreground" />
                <MetricCard label="Asset Value" value={assetValue} accent="text-green-600" />
                <MetricCard label="Support Incidents" value={`${ticketCount}`} accent="text-blue-500" />
                <MetricCard label="Maintenance Events" value={`${maintenanceCount}`} accent="text-amber-500" />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <InfoCard title="Fleet Deployment" subtitle="Who holds this asset and where it lives operationally.">
                    <div className="space-y-4">
                        <DetailRow label="Primary Asset Holder" value={item.user ? (
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-mono text-muted-foreground">
                                    {item.user.username?.[0]}
                                </div>
                                <span className="font-bold text-foreground">{item.user.username}</span>
                            </div>
                        ) : (item.assignedUser ? <span className="font-bold text-amber-600">{item.assignedUser}</span> : "Unassigned")} />
                        <DetailRow label="Department Unit" value={item.department} />
                        <DetailRow label="Physical Station" value={item.location} />
                        <DetailRow label="Condition Grade" value={item.condition} isMono />
                        <DetailRow label="Deployed Date" value={formatDate(item.assignedDate)} />
                        <DetailRow label="Return Due" value={formatDate(item.returnDate)} />
                    </div>
                </InfoCard>

                <InfoCard title="Hardware Architecture" subtitle="Core specifications and attached accessories.">
                    <div className="space-y-4">
                        <DetailRow label="Core Processor" value={item.processor} />
                        <DetailRow label="System Memory" value={item.ram} />
                        <DetailRow label="Primary Storage" value={item.storage} />
                        <DetailRow label="Operating System" value={item.os} />
                        <DetailRow label="Graphics Unit" value={item.graphicsCard} />
                        <div className="flex flex-wrap gap-3 border-t border-border pt-3">
                            <AccessoryPill label="Charger" active={item.hasCharger} />
                            <AccessoryPill label="Mouse" active={item.hasMouse} />
                        </div>
                    </div>
                </InfoCard>

                <InfoCard title="Lifecycle & Security" subtitle="Procurement, warranty, and internal reference fields.">
                    <div className="space-y-4">
                        <DetailRow label="Serial Number" value={item.serialNumber} isMono />
                        <DetailRow label="Acquisition Value" value={assetValue} accent="text-green-600" />
                        <DetailRow label="Internal Password" value={item.password ? "********" : "None set"} isFaded />
                        <DetailRow label="Warranty Expiry" value={formatDate(item.warrantyDate)} />
                        <DetailRow label="Warranty Type" value={item.warrantyType} />
                        <DetailRow label="Invoice Ref" value={item.vendorInvoice} />
                    </div>
                </InfoCard>
            </div>

            {item.systemSpecs && typeof item.systemSpecs === "object" && Object.keys(item.systemSpecs).length > 0 && (
                <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                    <SectionHeader
                        eyebrow="Extended telemetry"
                        title="System metadata"
                        description="Additional machine-level fields captured outside the primary inventory schema."
                    />
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                        {Object.entries(item.systemSpecs).map(([key, value]) => (
                            <div key={key} className="rounded-2xl border border-border bg-muted/20 p-4">
                                <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{key}</div>
                                <div className="break-words font-mono text-sm text-foreground">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {item.note && (
                <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600">Administrative Observation</p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">{item.note}</p>
                </section>
            )}

            <div className="grid grid-cols-1 gap-12">
                <section className="space-y-5">
                    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <SectionHeader
                            eyebrow="Support history"
                            title="Operational incidents"
                            description="Tickets and interventions associated with this hardware record."
                        />
                        <Link
                            href={`/dashboard/create?inventoryId=${item.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition hover:bg-muted/50"
                        >
                            Create Ticket
                        </Link>
                    </div>

                    <TableShell>
                        <table className="w-full text-left text-[13px]">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incident</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {item.tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                            No documented repairs
                                        </td>
                                    </tr>
                                ) : (
                                    item.tickets.map((ticket) => (
                                        <tr key={ticket.id} className="group transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">{ticket.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">{ticket.componentName || "General system"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${ticket.status === "RESOLVED" ? "border-blue-500/20 bg-blue-500/10 text-blue-500" : "border-green-500/20 bg-green-500/10 text-green-500"}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                                                {formatDate(ticket.createdAt)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href={`/dashboard/${ticket.id}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:text-foreground">
                                                    Inspect
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </TableShell>
                </section>

                {item.maintenanceRecords.length > 0 && (
                    <section className="space-y-5">
                        <SectionHeader
                            eyebrow="Lifecycle service"
                            title="Maintenance ledger"
                            description="Recorded service work, technicians, and cost events for this asset."
                        />
                        <TableShell>
                            <table className="w-full text-left text-[13px]">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Objective</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fleet Engineer</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cost Center</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Schedule</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {item.maintenanceRecords.map((record) => (
                                        <tr key={record.id} className="transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5 text-foreground">{record.description || "-"}</td>
                                            <td className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{record.technician || "External"}</td>
                                            <td className="px-6 py-5 font-mono text-green-600">{formatCurrency(record.cost)}</td>
                                            <td className="px-6 py-5 text-right font-mono text-xs text-muted-foreground">{formatDate(record.startDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TableShell>
                    </section>
                )}
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

function MetricCard({ label, value, accent }) {
    return (
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
            <p className={`mt-3 text-2xl font-bold tracking-tight ${accent}`}>{value || "-"}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getInventoryStatusBadgeClass(status)}`}>
            {getInventoryStatusLabel(status)}
        </span>
    );
}

function InfoCard({ title, subtitle, children }) {
    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-foreground/5 to-transparent transition-transform duration-700 group-hover:scale-125" />
            <div className="relative space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, isMono = false, isFaded = false, accent = "" }) {
    return (
        <div className={`flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0 ${isFaded ? "opacity-60" : ""}`}>
            <span className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">{label}</span>
            <span className={`text-right text-[13px] font-medium tracking-tight text-foreground ${isMono ? "font-mono" : ""} ${accent}`}>
                {value || "-"}
            </span>
        </div>
    );
}

function AccessoryPill({ label, active }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
            {label}: {active ? "included" : "missing"}
        </span>
    );
}

function SectionHeader({ eyebrow, title, description }) {
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

function TableShell({ children }) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">{children}</div>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatCurrency(value) {
    if (value === null || value === undefined) return "-";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}
