import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import VendorManager from "@/components/VendorManager";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Vendor Management",
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

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Workspace</Link>
                    <span>/</span>
                    <span className="text-foreground">Vendors</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Vendors & Suppliers</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                            Maintain your relationships, contacts, and billing profiles for third-party services.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Vendors" value={vendors.length.toString()} color="text-foreground" />
                <StatCard 
                    label="Active Partners" 
                    value={vendors.filter(v => v.status === 'ACTIVE').length.toString()} 
                    color="text-green-500" 
                />
                <StatCard 
                    label="Inactive / Pending" 
                    value={vendors.filter(v => v.status === 'INACTIVE').length.toString()} 
                    color="text-amber-500" 
                />
            </div>

            {/* Main Manager Component */}
            <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                <VendorManager initialVendors={serializedVendors} userRole={user.role} />
            </div>
            
            <div className="pt-8 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                    Need additional vendor vetting processes? <Link href="/dashboard/help" className="text-foreground hover:underline font-medium">Contact Procurement</Link>.
                </p>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="group p-6 rounded-[2rem] border border-border bg-card hover:bg-muted/30 transition-all relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-foreground/5 to-transparent -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
            <h3 className={`text-3xl font-bold tracking-tighter ${color}`}>{value}</h3>
        </div>
    );
}
