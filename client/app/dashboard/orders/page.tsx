"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types/dashboard";
import { OrderSkeleton } from "./OrderSkeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { OrderCard, OrderListRow } from "@/components/dashboard/OrderComponents";
import { Box, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my`, {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                setFilteredOrders(data);
            } else if (res.status === 401) {
                router.replace("/auth/login");
            } else {
                console.error("Failed to fetch orders");
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = orders.filter(order => {
            const matchesSearch = order.product_name?.toLowerCase().includes(query) ||
                order.id.toString().includes(query) ||
                order.status.toLowerCase().includes(query);
            const matchesFilter = filterStatus === "ALL" || order.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
        setFilteredOrders(filtered);
        setCurrentPage(1);
    }, [searchQuery, filterStatus, orders]);

    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const filterOptions = [
        { label: "All Statuses", value: "ALL" },
        { label: "Pending Payment", value: "PENDING_PAYMENT" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Cancelled", value: "CANCELLED" }
    ];

    const handleExportCSV = () => {
        if (!filteredOrders.length) return;
        const headers = ["ID", "Status", "Product", "Total Amount", "Amount Paid", "Created Date"];
        const rows = filteredOrders.map(o => [
            o.order_number || o.id,
            o.status,
            o.product_name ? `"${o.product_name.replace(/"/g, '""')}"` : "N/A",
            o.total_amount,
            o.amount_paid,
            new Date(o.created_at).toLocaleDateString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <DashboardHeader title="My Orders" description="Loading your orders..." badge="Orders" icon={<Package className="w-6 h-6" />} accent="#ff90e8" />
            <OrderSkeleton />
        </div>
    );

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <DashboardHeader
                title="My Orders"
                description="Track your purchases, manage payments, and monitor shipments."
                badge="Orders"
                icon={<Package className="w-6 h-6" />}
                accent="#ff90e8"
            >
                <Button 
                    onClick={handleExportCSV} 
                    className="bg-black text-white hover:bg-zinc-800 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all uppercase font-black h-10 px-5"
                    disabled={filteredOrders.length === 0}
                >
                    Export CSV
                </Button>
            </DashboardHeader>

            <DashboardSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                placeholder="Search orders by ID, product, or status..."
                filterValue={filterStatus}
                setFilterValue={setFilterStatus}
                filterOptions={filterOptions}
            />

            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50/50">
                    <div className="w-20 h-20 bg-zinc-200 rounded-full flex items-center justify-center mb-6">
                        <Box className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">No orders found</h3>
                    <p className="text-zinc-500 mb-8 max-w-sm text-center mt-2">
                        Try adjusting your search or browse the catalog.
                    </p>
                    <Button size="lg" className="bg-accent-green text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8 text-lg" asChild>
                        <Link href="/products">Browse Catalog</Link>
                    </Button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {paginatedOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedOrders.map((order) => (
                        <OrderListRow key={order.id} order={order} />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-none bg-white border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <span className="text-[11px] font-black tracking-widest uppercase mx-2 text-black/60 bg-white border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        Page <span className="text-black">{currentPage}</span> of <span className="text-black">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-none bg-white border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
}