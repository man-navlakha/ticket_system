import Link from 'next/link';
import { ClipboardList, FolderSearch, MonitorSmartphone } from 'lucide-react';

const navItems = [
    {
        id: 'devices',
        label: 'Devices',
        href: '/dashboard/laptop-data/devices',
        icon: MonitorSmartphone,
    },
    {
        id: 'files',
        label: 'File Search',
        href: '/dashboard/laptop-data/files',
        icon: FolderSearch,
    },
    {
        id: 'requests',
        label: 'File Requests',
        href: '/dashboard/laptop-data/file-requests',
        icon: ClipboardList,
    },
];

export default function LaptopDataShell({ active, title, description, user, actions, children }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-foreground/[0.04] to-transparent" />
                <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-foreground/[0.05] blur-3xl" />

                <div className="relative space-y-6">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                        <span>/</span>
                        <span className="text-foreground">Laptop Data</span>
                    </div>

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    Agent Control
                                </span>
                                <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    {user.role}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{title}</h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
                            </div>
                        </div>

                        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.id === active;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${isActive
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {children}
        </div>
    );
}
