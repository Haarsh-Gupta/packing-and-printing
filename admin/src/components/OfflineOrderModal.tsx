import { useState, useEffect } from "react";
import { User, AdminOfflineOrderCreateRequest } from "@/types";
import { api } from "@/lib/api";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

export default function OfflineOrderModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [userId, setUserId] = useState("");
    const [items, setItems] = useState<any[]>([{ type: "custom", product_id: null, sub_product_id: null, service_id: null, sub_service_id: null, name: "", quantity: 1, unit_price: 0 }]);
    const [taxAmount, setTaxAmount] = useState(0);
    const [shippingAmount, setShippingAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [splitType, setSplitType] = useState<"FULL" | "HALF">("HALF");

    useEffect(() => {
        if (isOpen && users.length === 0) {
            setLoadingUsers(true);
            api<{users: User[]}>("/admin/users/all?limit=1000")
                .then(res => setUsers(res.users || []))
                .catch(console.error)
                .finally(() => setLoadingUsers(false));
                
            api<any>("/products").then(res => setProducts(Array.isArray(res) ? res : res.products || [])).catch(console.error);
            api<any>("/services").then(res => setServices(Array.isArray(res) ? res : res.services || [])).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddItem = () => setItems([...items, { type: "custom", product_id: null, sub_product_id: null, service_id: null, sub_service_id: null, name: "", quantity: 1, unit_price: 0 }]);
    const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        // Auto-fill names and prices based on selection
        if (field === "sub_product_id" && value) {
            const prod = products.find(p => p.id === newItems[index].product_id);
            const sub = prod?.sub_products?.find((s:any) => s.id === Number(value));
            if (prod && sub) {
                newItems[index].name = `${prod.name} - ${sub.name}`;
                newItems[index].unit_price = sub.base_price || 0;
            }
        }
        if (field === "sub_service_id" && value) {
            const srv = services.find(s => s.id === newItems[index].service_id);
            const sub = srv?.sub_services?.find((s:any) => s.id === Number(value));
            if (srv && sub) {
                newItems[index].name = `${srv.name} - ${sub.name}`;
                newItems[index].unit_price = sub.price_per_unit || 0;
            }
        }
        if (field === "type") {
            newItems[index].product_id = null;
            newItems[index].sub_product_id = null;
            newItems[index].service_id = null;
            newItems[index].sub_service_id = null;
        }

        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!userId) return setError("Please select a customer.");
        if (items.some(i => !i.name || i.quantity <= 0 || i.unit_price < 0)) {
            return setError("Please ensure all items have a valid name, quantity, and price.");
        }

        setSubmitting(true);
        const payload: AdminOfflineOrderCreateRequest = {
            user_id: userId,
            items: items.map(i => ({ 
                product_id: i.product_id ? Number(i.product_id) : undefined,
                sub_product_id: i.sub_product_id ? Number(i.sub_product_id) : undefined,
                service_id: i.service_id ? Number(i.service_id) : undefined,
                sub_service_id: i.sub_service_id ? Number(i.sub_service_id) : undefined,
                name: i.name || "Custom Item", 
                quantity: Number(i.quantity), 
                unit_price: Number(i.unit_price) 
            })),
            tax_amount: Number(taxAmount),
            shipping_amount: Number(shippingAmount),
            discount_amount: Number(discountAmount),
            split_type: splitType,
        };

        try {
            await api("/admin/orders/offline", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create order.");
        } finally {
            setSubmitting(false);
        }
    };

    const subtotal = items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unit_price)), 0);
    const grandTotal = subtotal + Number(taxAmount) + Number(shippingAmount) - Number(discountAmount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#131b2e] border border-[#434655] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-[#434655]/50 flex justify-between items-center sticky top-0 bg-white dark:bg-[#131b2e] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Create Offline Order</h2>
                        <p className="text-xs text-slate-500 dark:text-[#8d90a1] mt-1">Manually generate an order for a walk-in or offline customer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 dark:text-[#8d90a1] hover:text-white hover:bg-slate-50 dark:hover:bg-[#171f33] rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-[#c3c5d8]">Customer</label>
                        <select 
                            value={userId} 
                            onChange={e => setUserId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/60 text-white rounded-lg px-4 py-2.5 outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors"
                        >
                            <option value="">Select a customer...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || 'Unnamed'} ({u.email})</option>
                            ))}
                        </select>
                        {loadingUsers && <p className="text-xs text-slate-500 dark:text-[#8d90a1] flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading customers...</p>}
                    </div>

                    {/* Line Items */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-slate-600 dark:text-[#c3c5d8]">Line Items</label>
                            <button type="button" onClick={handleAddItem} className="text-xs font-bold text-blue-600 dark:text-[#adc6ff] hover:bg-[#adc6ff]/10 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                <Plus size={14} /> Add Item
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-start bg-slate-50 dark:bg-[#0b1326]/50 p-3 rounded-xl border border-slate-200 dark:border-[#434655]/30 flex-col">
                                    <div className="flex w-full gap-3">
                                        <select 
                                            value={item.type} onChange={e => handleItemChange(idx, 'type', e.target.value)}
                                            className="w-1/4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                        >
                                            <option value="custom">Custom Text</option>
                                            <option value="product">Product Catalog</option>
                                            <option value="service">Service Catalog</option>
                                        </select>

                                        {item.type === "product" && (
                                            <>
                                                <select 
                                                    value={item.product_id || ""} onChange={e => handleItemChange(idx, 'product_id', Number(e.target.value))}
                                                    className="w-1/3 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                                >
                                                    <option value="">Select Product...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <select 
                                                    value={item.sub_product_id || ""} onChange={e => handleItemChange(idx, 'sub_product_id', Number(e.target.value))}
                                                    className="flex-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                                >
                                                    <option value="">Select Sub-Product...</option>
                                                    {products.find(p => p.id === item.product_id)?.sub_products?.map((sp:any) => (
                                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                                    ))}
                                                </select>
                                            </>
                                        )}

                                        {item.type === "service" && (
                                            <>
                                                <select 
                                                    value={item.service_id || ""} onChange={e => handleItemChange(idx, 'service_id', Number(e.target.value))}
                                                    className="w-1/3 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                                >
                                                    <option value="">Select Service...</option>
                                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <select 
                                                    value={item.sub_service_id || ""} onChange={e => handleItemChange(idx, 'sub_service_id', Number(e.target.value))}
                                                    className="flex-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                                >
                                                    <option value="">Select Sub-Service...</option>
                                                    {services.find(s => s.id === item.service_id)?.sub_services?.map((ss:any) => (
                                                        <option key={ss.id} value={ss.id}>{ss.name}</option>
                                                    ))}
                                                </select>
                                            </>
                                        )}

                                        {item.type === "custom" && (
                                            <input 
                                                type="text" placeholder="Item Name / Description" required
                                                value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                                className="flex-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                            />
                                        )}

                                        {items.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-500 dark:text-[#8d90a1] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-500 dark:text-[#8d90a1] uppercase font-bold tracking-wider ml-1">Manual Name (Override)</label>
                                            <input 
                                                type="text" placeholder={item.type === 'custom' ? "Already set above" : "Optional override for receipt"}
                                                value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                                className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] text-slate-500 dark:text-[#8d90a1] uppercase font-bold tracking-wider ml-1">Quantity</label>
                                            <input 
                                                type="number" min="1" required
                                                value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                                className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[10px] text-slate-500 dark:text-[#8d90a1] uppercase font-bold tracking-wider ml-1">Unit Price (₹)</label>
                                            <input 
                                                type="number" min="0" step="0.01" required
                                                value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                                className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financials & Payment Settings */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-[#434655]/30">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#8d90a1] ml-1">Tax Amount (₹)</label>
                                <input 
                                    type="number" min="0" step="0.01"
                                    value={taxAmount} onChange={e => setTaxAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#8d90a1] ml-1">Shipping Amount (₹)</label>
                                <input 
                                    type="number" min="0" step="0.01"
                                    value={shippingAmount} onChange={e => setShippingAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#8d90a1] ml-1">Discount Amount (₹)</label>
                                <input 
                                    type="number" min="0" step="0.01"
                                    value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#0b1326] rounded-xl p-5 border border-slate-200 dark:border-[#434655]/30 flex flex-col justify-between">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#8d90a1]">Payment Schedule</label>
                                <select 
                                    value={splitType} onChange={e => setSplitType(e.target.value as any)}
                                    className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/60 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400 dark:border-[#adc6ff]"
                                >
                                    <option value="HALF">Half Advance (50/50)</option>
                                    <option value="FULL">Full Advance (100%)</option>
                                </select>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#434655]/30 space-y-1">
                                <div className="flex justify-between text-xs text-slate-500 dark:text-[#8d90a1]"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-200 dark:border-[#434655]/30 mt-2">
                                    <span>Grand Total</span>
                                    <span className="text-blue-600 dark:text-[#adc6ff]">₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#434655]/50">
                        <button type="button" onClick={onClose} disabled={submitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-[#c3c5d8] hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="bg-linear-to-br from-[#1f70e3] to-[#004395] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-[#1f70e3]/20 hover:opacity-90 transition-opacity flex items-center gap-2">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : "Generate Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
