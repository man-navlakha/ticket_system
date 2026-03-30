
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import RentalCatalog from "@/components/RentalCatalog";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Request Hardware | EquipHub",
    description: "Company peripheral and hardware rental portal for employees.",
};

export default async function RentalPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
            ownership: 'COMPANY',
            status: 'IN_STORAGE'
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const serializedItems = inventoryItems.map(item => ({
        ...item,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
    }));

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Minimal Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                    <span>/</span>
                    <span className="text-foreground tracking-tighter">EquipHub</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">EquipHub</h1>
                            <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ml-2 shadow-sm shadow-primary/5">Beta</div>
                        </div>
                        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
                            Self-service hardware booking. Need a second monitor or a better keyboard? request it here.
                        </p>
                    </div>

                    <div className="p-4 bg-muted/40 border border-border rounded-3xl flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-110 transition-transform">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground">Usage Policy</p>
                            <p className="text-[11px] text-muted-foreground leading-snug max-w-[200px]">Items must be returned to Building 4 reception upon checkout expiry.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rental Catalog UI */}
            <RentalCatalog items={serializedItems} />

            {/* Bottom Support Callout */}
            <div className="p-8 border-t border-border bg-gradient-to-br from-background to-muted/20 rounded-[3rem] text-center space-y-4">
                <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto text-muted-foreground shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <p className="text-base font-bold text-foreground">Cant find what you need?</p>
                    <p className="text-sm text-muted-foreground">Special hardware requests (e.g., Drawing Tablets, VR Headsets) require a manager-approved ticket.</p>
                </div>
                <Link href="/dashboard/create" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                    Create Hardware request →
                </Link>
            </div>
        </div>
    );
}
