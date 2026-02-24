"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inquiry } from "@/types/dashboard";
import { MOCK_INQUIRIES } from "../../../lib/mockData";
import { InquirySkeleton } from "./InquirySkeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { InquiryCard, InquiryListRow } from "@/components/dashboard/InquiryComponents";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/CustomAlert";

export default function MyInquiriesPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setInquiries(data);
                setFilteredInquiries(data);
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/auth/login");
            } else {
                console.error("Failed to fetch inquiries");
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = inquiries.filter(inquiry =>
            inquiry.id.toString().includes(query) ||
            inquiry.status.toLowerCase().includes(query) ||
            (inquiry.admin_notes && inquiry.admin_notes.toLowerCase().includes(query)) ||
            (inquiry.items && inquiry.items.some(item =>
                item.notes?.toLowerCase().includes(query) ||
                item.template_name?.toLowerCase().includes(query) ||
                item.service_name?.toLowerCase().includes(query)
            ))
        );
        setFilteredInquiries(filtered);
    }, [searchQuery, inquiries]);

    const handleStatusUpdate = async (id: string, status: "ACCEPTED" | "REJECTED") => {
        setActionLoading(id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${id}/respond`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));

                if (status === "ACCEPTED") {
                    try {
                        const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("access_token")}`
                            },
                            body: JSON.stringify({ inquiry_id: id })
                        });
                        if (orderRes.ok) {
                            showAlert("Inquiry accepted and order placed successfully!", "success");
                            setTimeout(() => router.push("/dashboard/orders"), 1500);
                        } else {
                            showAlert("Inquiry accepted, but failed to create order.", "error");
                        }
                    } catch (e) {
                        console.error("Order creation error:", e);
                        showAlert("Failed to create order.", "error");
                    }
                } else {
                    showAlert("Inquiry declined.", "success");
                }
            } else {
                showAlert("Failed to update status.", "error");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                <DashboardHeader title="My Inquiries" description="Loading your inquiries..." />
                <InquirySkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <DashboardHeader
                title="My Inquiries"
                description="Request custom quotes and manage specifications."
            />

            <DashboardSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                placeholder="Search inquiries by ID, status, or notes..."
            />

            {filteredInquiries.length === 0 ? (
                <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
                    <FileText className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
                    <h3 className="text-xl font-bold">No inquiries found</h3>
                    <p className="text-zinc-500 mb-6">Try adjusting your search or browse products.</p>
                    <Button
                        className="bg-[#4be794] hover:bg-[#3cd083] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8 text-lg"
                        onClick={() => window.location.href = '/products'}
                    >
                        Browse Products
                    </Button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6">
                    {filteredInquiries.map((inquiry) => (
                        <InquiryCard
                            key={inquiry.id}
                            inquiry={inquiry}
                            actionLoading={actionLoading}
                            handleStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInquiries.map((inquiry) => (
                        <InquiryListRow
                            key={inquiry.id}
                            inquiry={inquiry}
                            actionLoading={actionLoading}
                            handleStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}