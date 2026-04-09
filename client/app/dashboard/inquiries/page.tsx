"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inquiry } from "@/types/dashboard";
import { InquirySkeleton } from "./InquirySkeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { InquiryCard, InquiryListRow } from "@/components/dashboard/InquiryComponents";
import { FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/CustomAlert";
import { useConfirm } from "@/components/ConfirmDialog";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function MyInquiriesPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { confirm } = useConfirm();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my`, {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                setInquiries(data);
                setFilteredInquiries(data);
            } else if (res.status === 401) {
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
        const filtered = inquiries.filter(inquiry => {
            const matchesSearch = inquiry.id.toString().includes(query) ||
                inquiry.status.toLowerCase().includes(query) ||
                (inquiry.admin_notes && inquiry.admin_notes.toLowerCase().includes(query)) ||
                (inquiry.items && inquiry.items.some(item =>
                    item.notes?.toLowerCase().includes(query) ||
                    item.template_name?.toLowerCase().includes(query) ||
                    item.service_name?.toLowerCase().includes(query)
                ));
            const matchesFilter = filterStatus === "ALL" || inquiry.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
        setFilteredInquiries(filtered);
        setCurrentPage(1);
    }, [searchQuery, filterStatus, inquiries]);

    const paginatedInquiries = filteredInquiries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

    const filterOptions = [
        { label: "All Statuses", value: "ALL" },
        { label: "Pending", value: "PENDING" },
        { label: "Quoted", value: "QUOTED" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "Rejected", value: "REJECTED" }
    ];

    const handleStatusUpdate = async (id: string, status: "ACCEPTED" | "REJECTED") => {
        setActionLoading(id);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));

                if (status === "ACCEPTED") {
                    showAlert("Inquiry accepted and order placed successfully!", "success");
                    setTimeout(() => router.push("/dashboard/orders"), 1500);
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

    const handleReorder = async (id: string) => {
        const confirmed = await confirm({
            title: "Reorder Inquiry?",
            message: "This will create a new draft inquiry with the same items and specifications. You can review and edit it before submitting.",
            confirmText: "Yes, Reorder",
            cancelText: "Cancel",
        });
        if (!confirmed) return;

        setActionLoading(id);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${id}/reorder`, {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                const newInquiry = await res.json();
                showAlert("Inquiry cloned as a new draft! Redirecting...", "success");
                setTimeout(() => router.push(`/dashboard/inquiries/${newInquiry.id}`), 1200);
            } else {
                showAlert("Failed to reorder inquiry.", "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Network error while reordering.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportCSV = () => {
        if (!filteredInquiries.length) return;
        const headers = ["ID", "Status", "Total Estimate", "Created Date"];
        const rows = filteredInquiries.map(inq => [
            inq.display_id || inq.id,
            inq.status,
            inq.active_quote?.total_price || 0,
            new Date(inq.created_at).toLocaleDateString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inquiries_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                <DashboardHeader title="My Inquiries" description="Loading your inquiries..." badge="Inquiries" icon={<FileText className="w-6 h-6" />} accent="#90e8ff" />
                <InquirySkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <DashboardHeader
                title="My Inquiries"
                description="Request custom quotes, manage specifications, and track progress."
                badge="Inquiries"
                icon={<FileText className="w-6 h-6" />}
                accent="#90e8ff"
            >
                <Button 
                    onClick={handleExportCSV} 
                    className="bg-black text-white hover:bg-zinc-800 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all uppercase font-black h-10 px-5"
                    disabled={filteredInquiries.length === 0}
                >
                    Export CSV
                </Button>
            </DashboardHeader>

            <DashboardSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                placeholder="Search inquiries by ID, status, or notes..."
                filterValue={filterStatus}
                setFilterValue={setFilterStatus}
                filterOptions={filterOptions}
            />

            {filteredInquiries.length === 0 ? (
                <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
                    <FileText className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
                    <h3 className="text-xl font-bold">No inquiries found</h3>
                    <p className="text-zinc-500 mb-6">Try adjusting your search or browse products.</p>
                    <Button
                        className="bg-accent-green hover:bg-[#3cd083] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8 text-lg"
                        onClick={() => window.location.href = '/products'}
                    >
                        Browse Products
                    </Button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6">
                    {paginatedInquiries.map((inquiry) => (
                        <InquiryCard
                            key={inquiry.id}
                            inquiry={inquiry}
                            actionLoading={actionLoading}
                            handleStatusUpdate={handleStatusUpdate}
                            handleReorder={handleReorder}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedInquiries.map((inquiry) => (
                        <InquiryListRow
                            key={inquiry.id}
                            inquiry={inquiry}
                            actionLoading={actionLoading}
                            handleStatusUpdate={handleStatusUpdate}
                            handleReorder={handleReorder}
                        />
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