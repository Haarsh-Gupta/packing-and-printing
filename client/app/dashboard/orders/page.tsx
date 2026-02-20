"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types/dashboard";
import { OrderSkeleton } from "./OrderSkeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { OrderCard, OrderListRow } from "@/components/dashboard/OrderComponents";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                router.replace("/auth/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                setFilteredOrders(data);
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
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
        const filtered = orders.filter(order =>
            order.product_name?.toLowerCase().includes(query) ||
            order.id.toString().includes(query) ||
            order.status.toLowerCase().includes(query)
        );
        setFilteredOrders(filtered);
    }, [searchQuery, orders]);

    if (isLoading) return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <DashboardHeader title="Orders" description="Loading your orders..." />
            <OrderSkeleton />
        </div>
    );

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <DashboardHeader
                title="Orders"
                description="Manage your purchases and track shipments."
            />

            <DashboardSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                placeholder="Search orders by ID, product, or status..."
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
                    <Button size="lg" className="bg-[#4be794] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8 text-lg" asChild>
                        <Link href="/products">Browse Catalog</Link>
                    </Button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <OrderListRow key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}