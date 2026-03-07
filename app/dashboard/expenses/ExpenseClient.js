'use client';

import { useState } from 'react';
import { Plus, ListFilter, IndianRupee, Laptop, Package, Trash2, Edit2, Download, ChevronDown, Check } from 'lucide-react';

export default function ExpenseClient({ initialExpenses, initialRentedLaptops, user, availableVendors }) {
    // ---- Expenses State ----
    const [expenses, setExpenses] = useState(initialExpenses);
    const [isAdding, setIsAdding] = useState(false);
    const [isCustomVendor, setIsCustomVendor] = useState(false);

    const [product, setProduct] = useState('');
    const [price, setPrice] = useState('');
    const [vendor, setVendor] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');

    // ---- Rented Laptops State ----
    const [rentedLaptops, setRentedLaptops] = useState(initialRentedLaptops || []);
    const [isAddingLaptop, setIsAddingLaptop] = useState(false);

    // Default selected year for payments
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // New laptop form
    const [rlPid, setRlPid] = useState('');
    const [rlBrand, setRlBrand] = useState('');
    const [rlModel, setRlModel] = useState('');
    const [rlPrice, setRlPrice] = useState('');
    const [rlVendor, setRlVendor] = useState('');
    const [rlUser, setRlUser] = useState('');

    // Edit modal state
    const [editingLaptop, setEditingLaptop] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [editVendor, setEditVendor] = useState('');
    const [isEditCustomVendor, setIsEditCustomVendor] = useState(false);

    // --- EXPENSES Actions ---
    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product,
                    price: parseFloat(price),
                    vendor,
                    purchaseDate
                })
            });

            if (res.ok) {
                const newExpense = await res.json();
                setExpenses([newExpense, ...expenses]);
                setIsAdding(false);
                setIsCustomVendor(false);
                setProduct('');
                setPrice('');
                setVendor('');
                setPurchaseDate('');
            } else {
                alert('Failed to add expense');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to add expense');
        }
    };

    const handleRemoveExpense = async (id) => {
        if (!confirm('Are you sure you want to remove this expense from the system?')) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setExpenses(expenses.filter(e => e.id !== id));
            } else {
                alert('Failed to remove expense');
            }
        } catch {
            alert('Failed to remove expense');
        }
    };

    // --- RENTED LAPTOP Actions ---
    const handleAddRentedLaptop = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/rented-laptops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pid: rlPid,
                    brand: rlBrand,
                    model: rlModel,
                    price: rlPrice,
                    vendorInvoice: rlVendor,
                    assignedUser: rlUser
                })
            });
            if (res.ok) {
                const newLaptop = await res.json();
                setRentedLaptops([newLaptop, ...rentedLaptops]);
                setIsAddingLaptop(false);
                setRlPid(''); setRlBrand(''); setRlModel(''); setRlPrice(''); setRlVendor(''); setRlUser('');
            } else {
                alert('Failed to add laptop');
            }
        } catch {
            alert('Failed to add laptop');
        }
    };

    const handleRemoveLaptop = async (id) => {
        if (!confirm('Are you sure you want to remove this rented laptop from the system?')) return;
        try {
            const res = await fetch(`/api/rented-laptops/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRentedLaptops(rentedLaptops.filter(l => l.id !== id));
            }
        } catch {
            alert('Failed to remove laptop');
        }
    };

    const handleToggleStatus = async (laptop) => {
        const currentFaults = laptop.systemSpecs?.faulty || false;
        const note = currentFaults ? 'Marked as fixed' : prompt(`Enter details of the issue for ${laptop.pid || 'this laptop'}:`);

        if (!currentFaults && note === null) return;

        // Merge properties into systemSpecs json
        const updatedSpecs = {
            ...(laptop.systemSpecs || {}),
            faulty: !currentFaults,
            faultNote: !currentFaults ? note : null
        };

        try {
            const res = await fetch(`/api/rented-laptops/${laptop.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemSpecs: updatedSpecs })
            });
            if (res.ok) {
                const updated = await res.json();
                setRentedLaptops(rentedLaptops.map(l => l.id === updated.id ? updated : l));
            }
        } catch {
            alert('Failed to update status');
        }
    };

    const handleMarkMissing = async (laptop) => {
        const isMissing = laptop.systemSpecs?.missing || false;

        if (isMissing) {
            if (!confirm(`Mark ${laptop.pid} as found and active again?`)) return;

            const updatedSpecs = { ... (laptop.systemSpecs || {}) };
            delete updatedSpecs.missing;
            delete updatedSpecs.missingPenalty; // Also remove penalty when found

            try {
                const res = await fetch(`/api/rented-laptops/${laptop.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ systemSpecs: updatedSpecs, status: 'ACTIVE' })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setRentedLaptops(rentedLaptops.map(l => l.id === updated.id ? updated : l));
                }
            } catch { alert('Failed to update status'); }
        } else {
            const penalty = prompt(`Laptop ${laptop.pid} is missing. Enter the settlement/penalty price to pay vendor (₹):`, laptop.price || 0);
            if (penalty === null) return;

            const updatedSpecs = {
                ...(laptop.systemSpecs || {}),
                missing: true,
                missingPenalty: parseFloat(penalty) || 0
            };

            try {
                const res = await fetch(`/api/rented-laptops/${laptop.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ systemSpecs: updatedSpecs, status: 'LOST' })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setRentedLaptops(rentedLaptops.map(l => l.id === updated.id ? updated : l));
                }
            } catch { alert('Failed to update status'); }
        }
    };

    const handleSaveEditLaptop = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/rented-laptops/${editingLaptop.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: parseFloat(editPrice) || 0, vendorInvoice: editVendor })
            });
            if (res.ok) {
                const updated = await res.json();
                setRentedLaptops(rentedLaptops.map(l => l.id === updated.id ? updated : l));
                setEditingLaptop(null);
            }
        } catch {
            alert('Failed to save changes');
        }
    };

    const togglePayment = async (laptop, monthIndex) => {
        // monthIndex is 0..11, DB expects 1..12
        const monthNum = monthIndex + 1;
        const payments = laptop.rentalPayments || [];
        const isPaid = payments.some(p => p.month === monthNum && p.year === selectedYear);
        const action = isPaid ? 'UNPAY' : 'PAY';

        let amountPaid = laptop.price || 0;
        if (action === 'PAY') {
            const result = prompt(`Enter rent amount paid for ${monthLabels[monthIndex]} ${selectedYear}:`, amountPaid);
            if (result === null) return; // User cancelled
            amountPaid = parseFloat(result) || 0;
        }

        try {
            const res = await fetch(`/api/rented-laptops/${laptop.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: monthNum,
                    year: selectedYear,
                    amount: amountPaid,
                    action
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setRentedLaptops(rentedLaptops.map(l => l.id === updated.id ? updated : l));
            }
        } catch {
            alert('Failed to toggle payment');
        }
    };

    const downloadExpensesCsv = () => {
        const headers = ["No.", "Product", "Price", "From", "When"];

        const rows = expenses.map((exp, index) => {
            const rowData = [
                index + 1,
                exp.product || '',
                exp.price || 0,
                exp.vendor || '',
                exp.purchaseDate ? new Date(exp.purchaseDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''
            ];
            return rowData.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Expenses_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadCsv = () => {
        const headers = ["Tag Number", "Brand", "Model", "Monthly Price", "From (Vendor)", "Assigned User", "Date Added"];

        // Let's add columns for J,F,M,A,M,J,J,A,S,O,N,D for the selected year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        headers.push(...months.map(m => `${m} ${selectedYear}`));

        const rows = rentedLaptops.map(l => {
            const baseData = [
                l.pid || '',
                l.brand || '',
                l.model || '',
                l.price || 0,
                l.vendorInvoice || '',
                l.assignedUser || '',
                new Date(l.createdAt).toLocaleDateString('en-GB')
            ];

            const pms = l.rentalPayments || [];
            const monthStatus = Array.from({ length: 12 }).map((_, i) => {
                const paid = pms.some(p => p.month === i + 1 && p.year === selectedYear);
                return paid ? 'Paid' : 'Unpaid';
            });

            return [...baseData, ...monthStatus].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rented_Laptops_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 no-scrollbar transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col flex-wrap md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{user?.role} Workspace</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">Expenses & Procurement</h1>
                    </div>
                </div>

                <div className="space-y-10">

                    {/* ======================= EXPENSES SECTION ======================= */}
                    <div className="p-6 md:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                                    <Package size={24} />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Purchases</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button onClick={downloadExpensesCsv} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-bold hover:bg-muted/50 active:scale-95 transition-all">
                                    <Download size={16} /> Export CSV
                                </button>
                                <button
                                    onClick={() => setIsAdding(!isAdding)}
                                    className="flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                                >
                                    <Plus size={16} />
                                    {isAdding ? 'Cancel' : 'Add Expense'}
                                </button>
                            </div>
                        </div>

                        {/* Add Expense Form */}
                        {isAdding && (
                            <div className="p-6 rounded-2xl bg-muted/30 border border-border mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Product</label>
                                        <input type="text" required value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Pendrive 8GB" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                                        <input type="number" required min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                                            <span>From (Vendor)</span>
                                            {isCustomVendor && (
                                                <button type="button" onClick={() => { setIsCustomVendor(false); setVendor(''); }} className="text-primary hover:underline">
                                                    View List
                                                </button>
                                            )}
                                        </label>
                                        {!isCustomVendor ? (
                                            <select value={vendor} onChange={(e) => {
                                                if (e.target.value === '___CUSTOM___') { setIsCustomVendor(true); setVendor(''); }
                                                else { setVendor(e.target.value); }
                                            }}
                                                className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">-- Select --</option>
                                                {availableVendors?.map(v => <option key={v} value={v}>{v}</option>)}
                                                <option value="___CUSTOM___" className="font-bold text-primary">+ Add Custom Vendor</option>
                                            </select>
                                        ) : (
                                            <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Enter new vendor..." className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" autoFocus />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">When</label>
                                        <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all dark:[color-scheme:dark]" />
                                    </div>
                                    <div className="lg:col-span-1 flex items-end">
                                        <button type="submit" className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-border bg-background">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">No.</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Product</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Price</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">From</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">When</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr><td colSpan="6" className="px-5 py-8 text-center text-muted-foreground">No expenses recorded yet.</td></tr>
                                    ) : (
                                        expenses.map((exp, index) => (
                                            <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-4 font-medium">{index + 1}</td>
                                                <td className="px-5 py-4 text-foreground font-medium">{exp.product}</td>
                                                <td className="px-5 py-4">₹{exp.price?.toFixed(2)}</td>
                                                <td className="px-5 py-4 text-muted-foreground">{exp.vendor || '-'}</td>
                                                <td className="px-5 py-4">{exp.purchaseDate ? new Date(exp.purchaseDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveExpense(exp.id)}
                                                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Remove Expense"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ======================= RENTED LAPTOPS SECTION ======================= */}
                    <div className="p-6 md:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                    <Laptop size={24} />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground">Rental Procurement</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Year Selector for Payments */}
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="h-10 px-4 py-2 text-sm font-bold bg-muted/50 border border-border rounded-xl focus:outline-none transition-all cursor-pointer"
                                >
                                    {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>

                                <button onClick={downloadCsv} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-bold hover:bg-muted/50 active:scale-95 transition-all">
                                    <Download size={16} /> Export CSV
                                </button>

                                <button onClick={() => setIsAddingLaptop(!isAddingLaptop)} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                                    <Plus size={16} /> {isAddingLaptop ? 'Cancel' : 'Add Rented Laptop'}
                                </button>
                            </div>
                        </div>

                        {/* Add Rented Laptop Form */}
                        {isAddingLaptop && (
                            <div className="p-6 rounded-2xl bg-muted/30 border border-border mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                <form onSubmit={handleAddRentedLaptop} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tag No.</label>
                                        <input type="text" value={rlPid} onChange={(e) => setRlPid(e.target.value)} placeholder="Auto-gen if empty" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Brand</label>
                                        <input type="text" required value={rlBrand} onChange={(e) => setRlBrand(e.target.value)} placeholder="Dell, Lenovo..." className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Model</label>
                                        <input type="text" value={rlModel} onChange={(e) => setRlModel(e.target.value)} placeholder="XPS 15" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5 border-l border-border pl-4">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Mo. Price (₹)</label>
                                        <input type="number" required min="0" step="1" value={rlPrice} onChange={(e) => setRlPrice(e.target.value)} placeholder="2000" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">From (Vendor)</label>
                                        <input type="text" value={rlVendor} onChange={(e) => setRlVendor(e.target.value)} placeholder="RentCo Ltd" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Assignee</label>
                                        <input type="text" value={rlUser} onChange={(e) => setRlUser(e.target.value)} placeholder="John Doe" className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none" />
                                    </div>
                                    <div className="lg:col-span-6 flex justify-end mt-2 border-t border-border pt-4">
                                        <button type="submit" className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
                                            Save Laptop to Inventory
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-border bg-background">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Laptop Details</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Monthly Price</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Payments Tracker ({selectedYear})</th>
                                        <th className="px-5 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rentedLaptops.length === 0 ? (
                                        <tr><td colSpan="4" className="px-5 py-12 text-center text-muted-foreground">No rented laptops found. Add one above.</td></tr>
                                    ) : (
                                        rentedLaptops.map((laptop) => {
                                            const pms = laptop.rentalPayments || [];
                                            return (
                                                <tr key={laptop.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">

                                                    {/* Laptop Meta */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                                                                <Laptop size={14} className="text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-foreground">{laptop.brand || 'Unknown'} {laptop.model}</span>
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{laptop.pid}</span>
                                                                    {laptop.systemSpecs?.faulty && (
                                                                        <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">
                                                                            Needs Repair
                                                                        </span>
                                                                    )}
                                                                    {laptop.systemSpecs?.missing && (
                                                                        <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">
                                                                            MISSING
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                                                    <span>To: {laptop.assignedUser || '-'}</span>
                                                                    <span>&bull;</span>
                                                                    <span>From: {laptop.vendorInvoice || '-'}</span>
                                                                </div>
                                                                {laptop.systemSpecs?.faulty && laptop.systemSpecs?.faultNote && (
                                                                    <div className="text-[11px] text-red-500/80 mt-1 font-medium bg-red-500/5 px-2 py-1 rounded inline-block">
                                                                        Issue: {laptop.systemSpecs.faultNote}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-lg">₹{laptop.price?.toFixed(2) || '0.00'}</div>
                                                        {laptop.systemSpecs?.missing && (
                                                            <div className="text-[10px] text-orange-500 mt-1 uppercase tracking-wider font-bold bg-orange-500/10 px-1.5 py-0.5 rounded inline-block">
                                                                Settlement: ₹{laptop.systemSpecs.missingPenalty?.toFixed(2) || '0.00'}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* 12-Month Payment Tracker */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {monthLabels.map((m, idx) => {
                                                                const payment = pms.find(p => p.month === idx + 1 && p.year === selectedYear);
                                                                const paid = !!payment;

                                                                // Hide unpaid months if the laptop is marked as missing
                                                                if (laptop.systemSpecs?.missing && !paid) return null;

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        title={`${m} ${selectedYear} - ${paid ? 'Paid ₹' + payment.amount : 'Unpaid'}`}
                                                                        onClick={() => togglePayment(laptop, idx)}
                                                                        className={`h-7 rounded-md font-bold text-[10px] flex flex-col items-center justify-center transition-all border whitespace-nowrap overflow-hidden
                                                                            ${paid
                                                                                ? 'bg-green-500 text-white border-green-600 shadow-inner px-2 min-w-[3rem]'
                                                                                : 'bg-muted/50 text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted w-7'}`}
                                                                    >
                                                                        {paid ? `₹${payment.amount}` : m}
                                                                    </button>
                                                                );
                                                            })}

                                                            {laptop.systemSpecs?.missing && (
                                                                <div className="h-7 px-3 flex items-center justify-center rounded-md font-bold text-[10px] bg-orange-500 text-white border border-orange-600 shadow-inner uppercase tracking-wider ml-1">
                                                                    Settlement: ₹{laptop.systemSpecs.missingPenalty?.toFixed(2) || '0.00'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleToggleStatus(laptop)}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm
                                                                    ${laptop.systemSpecs?.faulty
                                                                        ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                                                        : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}
                                                                title={laptop.systemSpecs?.faulty ? "Mark as Fixed" : "Report Issue"}
                                                            >
                                                                {laptop.systemSpecs?.faulty ? "Mark Fixed" : "Report Issue"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkMissing(laptop)}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm
                                                                    ${laptop.systemSpecs?.missing
                                                                        ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                                                                        : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'}`}
                                                                title={laptop.systemSpecs?.missing ? "Mark as Found" : "Report Missing"}
                                                            >
                                                                {laptop.systemSpecs?.missing ? "Found It" : "Report Missing"}
                                                            </button>
                                                            <div className="w-px h-6 bg-border mx-1"></div>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLaptop(laptop);
                                                                    setEditPrice(laptop.price?.toString() || '');
                                                                    setEditVendor(laptop.vendorInvoice || '');
                                                                    setIsEditCustomVendor(
                                                                        laptop.vendorInvoice && availableVendors && !availableVendors.includes(laptop.vendorInvoice)
                                                                    );
                                                                }}
                                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                                                                title="Edit Laptop"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveLaptop(laptop.id)}
                                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                                title="Remove Laptop"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>

                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Edit Laptop Modal */}
            {editingLaptop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm p-6 bg-card border border-border rounded-2xl shadow-xl zoom-in-95 animate-in duration-200">
                        <h3 className="text-xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
                            <Edit2 size={18} /> Edit Rented Laptop
                        </h3>
                        <form onSubmit={handleSaveEditLaptop} className="space-y-4">
                            <div className="space-y-1.5 text-sm text-muted-foreground mb-2">
                                Editing settings for <strong>{editingLaptop.pid}</strong> ({editingLaptop.brand})
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Price (₹)</label>
                                <input type="number" min="0" step="1" required value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-semibold" />
                            </div>
                            <div className="space-y-1.5 min-w-0">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                                    <span>From (Vendor)</span>
                                    {isEditCustomVendor && (
                                        <button type="button" onClick={() => { setIsEditCustomVendor(false); setEditVendor(''); }} className="text-primary hover:underline font-normal text-xs normal-case tracking-normal">
                                            View List
                                        </button>
                                    )}
                                </label>
                                {!isEditCustomVendor ? (
                                    <select value={editVendor} onChange={(e) => {
                                        if (e.target.value === '___CUSTOM___') { setIsEditCustomVendor(true); setEditVendor(''); }
                                        else { setEditVendor(e.target.value); }
                                    }}
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="">-- Select --</option>
                                        {availableVendors?.map(v => <option key={v} value={v}>{v}</option>)}
                                        <option value="___CUSTOM___" className="font-bold text-primary">+ Add Custom Vendor</option>
                                    </select>
                                ) : (
                                    <input type="text" value={editVendor} onChange={(e) => setEditVendor(e.target.value)} placeholder="Enter new vendor..." className="w-full h-10 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all" autoFocus />
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                                <button type="button" onClick={() => setEditingLaptop(null)} className="h-10 px-4 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="h-10 px-4 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
