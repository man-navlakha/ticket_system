import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Help & Support" };

export default async function HelpPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");

    // Fetch Agents and Admins
    const supportStaff = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'AGENT'] }
        },
        select: {
            username: true,
            email: true,
            phoneNumber: true,
            role: true
        }
    });

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
            <p className="text-gray-400 mb-8">Contact your support team directly.</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </span>
                    Support Contacts
                </h2>

                <div className="space-y-6">
                    {supportStaff.length === 0 ? (
                        <p className="text-gray-500">No support staff found.</p>
                    ) : (
                        supportStaff.map((staff, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black/50 border border-white/10">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border border-white/10 ${staff.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {staff.username?.[0]?.toUpperCase() || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-white truncate">{staff.username}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${staff.role === 'ADMIN' ? 'border-red-500/20 text-red-400 bg-red-500/10' : 'border-blue-500/20 text-blue-400 bg-blue-500/10'}`}>
                                            {staff.role}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <a href={`mailto:${staff.email}`} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{staff.email}</span>
                                        </a>
                                        {staff.phoneNumber && (
                                            <a href={`tel:${staff.phoneNumber}`} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{staff.phoneNumber}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        Stuck? You can also email us directly.
                    </p>
                    <a href="mailto:support@example.com" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-gray-200">
                        Email Support
                    </a>
                </div>
            </div>
        </div>
    );
}
