import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import VendorManager from "@/components/VendorManager";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Vendors & Suppliers",
    description: "Manage enterprise vendors, suppliers, and service providers.",
};

export default async function VendorsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (user.role === 'USER') redirect("/dashboard");

    const vendors = await prisma.vendor.findMany({
        orderBy: { name: 'asc' }
    });

    const serializedVendors = vendors.map(v => ({
        ...v,
        createdAt: v.createdAt?.toISOString(),
        updatedAt: v.updatedAt?.toISOString()
    }));

    const activeCount = vendors.filter(v => v.status === 'ACTIVE').length;

    return (
        <div className="min-h-screen animate-in fade-in duration-500">

            {/* ── Page header ──────────────────────────────────── */}
            <div className="mb-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-5">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-foreground">Vendors &amp; Suppliers</span>
                </div>

                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Procurement
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Vendors &amp; Suppliers
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-lg">
                            Centralise your supplier relationships, billing contacts, and service provider records.
                        </p>
                    </div>

                    {/* Header stats */}
                    <div className="flex items-center gap-5 shrink-0">
                        <MiniStat label="Total" value={vendors.length} />
                        <div className="w-px h-8 bg-border" />
                        <MiniStat label="Active" value={activeCount} accent />
                        <div className="w-px h-8 bg-border" />
                        <MiniStat label="Inactive" value={vendors.length - activeCount} />
                    </div>
                </div>
            </div>

            {/* ── Main card ────────────────────────────────────── */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <VendorManager initialVendors={serializedVendors} userRole={user.role} />
            </div>

            {/* ── Footer note ──────────────────────────────────── */}
            <p className="mt-6 text-center text-xs text-muted-foreground/60">
                Need vetting or onboarding help?{' '}
                <Link href="/dashboard/help" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    Contact Procurement
                </Link>
            </p>
        </div>
    );
}

function MiniStat({ label, value, accent }) {
    return (
        <div className="flex flex-col items-end">
            <span className={`text-xl font-bold tracking-tighter tabular-nums ${accent ? 'text-emerald-500' : 'text-foreground'}`}>
                {value}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}
