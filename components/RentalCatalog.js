'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Monitor, Mouse, Keyboard, Headset, HardDrive, Tablet, 
    Phone, Printer, Search, Calendar, Package, Info, 
    CheckCircle2, AlertCircle, X, ArrowRight, Laptop
} from 'lucide-react';
import { toast } from 'sonner';

export default function RentalCatalog({ items: initialItems }) {
    const [items, setItems] = useState(initialItems);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [bookingItem, setBookingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [returnDate, setReturnDate] = useState('');

    const types = ['ALL', ...new Set(initialItems.map(item => item.type))];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.model?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.pid?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'ALL' || item.type === selectedType;
        return matchesSearch && matchesType;
    });

    const handleRequestRental = async (e) => {
        e.preventDefault();
        if (!returnDate) return toast.error('Please select a return date');
        
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/inventory/${bookingItem.id}/request-rental`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnDate }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to request rental');

            toast.success('Rental request submitted successfully!');
            // Update local state to reflect the item is now "Requested" or "Active"
            setItems(prev => prev.filter(i => i.id !== bookingItem.id));
            setBookingItem(null);
            setReturnDate('');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'PRINTER': return <Printer className="w-5 h-5" />;
            case 'MOBILE': return <Phone className="w-5 h-5" />;
            case 'TABLET': return <Tablet className="w-5 h-5" />;
            case 'LAPTOP': return <Laptop className="w-5 h-5" />;
            case 'MONITOR':
            case 'DESKTOP': 
            case 'COMPUTER': return <Monitor className="w-5 h-5" />;
            case 'MOUSE': return <Mouse className="w-5 h-5" />;
            case 'KEYBOARD': return <Keyboard className="w-5 h-5" />;
            case 'HEADSET': return <Headset className="w-5 h-5" />;
            case 'PERIPHERAL': return <Mouse className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-card/50 backdrop-blur-sm p-6 rounded-3xl border border-border shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search peripherals..."
                        className="w-full h-12 pl-11 pr-4 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto">
                    {types.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                                selectedType === type 
                                ? 'bg-foreground text-background border-foreground shadow-lg active:scale-95' 
                                : 'bg-background text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                            }`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filteredItems.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-muted/20 rounded-[2.5rem] border border-dashed border-border">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">No peripherals available</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <motion.div
                            layoutId={item.id}
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* Card Content */}
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:scale-110 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500">
                                        {getIcon(item.type)}
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                        Ready
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.brand} {item.model}</h3>
                                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                        <span className="px-1.5 py-0.5 rounded bg-muted border border-border">{item.pid}</span>
                                        <span>•</span>
                                        <span className="uppercase">{item.type.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 font-medium italic">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>Standard enterprise issue</span>
                                    </div>
                                    
                                    <button
                                        onClick={() => setBookingItem(item)}
                                        className="w-full h-11 bg-foreground text-background rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn shadow-lg shadow-black/5"
                                    >
                                        Request Now
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Hover Badge */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="px-2 py-1 bg-background/80 backdrop-blur rounded-lg border border-border text-[9px] font-bold text-muted-foreground uppercase shadow-sm">
                                    In Storage
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Booking Modal */}
            <AnimatePresence>
                {bookingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setBookingItem(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            {getIcon(bookingItem.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-3xl font-black tracking-tighter">Rent {bookingItem.brand}</h2>
                                            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">{bookingItem.model} • {bookingItem.pid}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setBookingItem(null)}
                                        className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-95"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleRequestRental} className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Planned Return Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input 
                                                type="date"
                                                required
                                                className="w-full h-14 pl-12 pr-4 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:border-primary transition-all shadow-sm cursor-pointer appearance-none"
                                                value={returnDate}
                                                onChange={(e) => setReturnDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Required for auto-checkout
                                        </p>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-muted/30 border border-border space-y-4">
                                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                            <Info className="w-4 h-4 text-primary" />
                                            Rental Terms
                                        </h4>
                                        <ul className="text-xs text-muted-foreground space-y-3 font-medium">
                                            <li className="flex gap-3">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/10">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                Item must be returned in current condition.
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/10">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                Extension requests must be made 24h prior to expiration.
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-foreground text-background rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-black/10 group/submit"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Confirm Rental
                                                <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
