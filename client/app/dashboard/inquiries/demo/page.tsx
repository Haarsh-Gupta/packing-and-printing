"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { InquiryCard, InquiryListRow } from "@/components/dashboard/InquiryComponents";
import { FileText } from "lucide-react";
import { MOCK_INQUIRIES } from "@/lib/mockData";
import { Inquiry } from "@/types/dashboard";
import { useAlert } from "@/components/CustomAlert";

const mockInquiries: Inquiry[] = MOCK_INQUIRIES.map((m) => ({
    id: m.id,
    template_id: m.template_id,
    service_id: null,
    variant_id: null,
    quantity: m.quantity,
    selected_options: m.selected_options,
    notes: m.notes,
    status: m.status as Inquiry["status"],
    quoted_price: m.quoted_price,
    admin_notes: m.admin_notes,
    template_name: m.template_id === 1 ? "Premium Hardcover Book" : "Spiral Notebook",
    service_name: undefined,
    variant_name: undefined,
    images: [],
    created_at: m.created_at,
}));

export default function InquiriesDemoPage() {
    const { showAlert } = useAlert();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [inquiries, setInquiries] = useState(mockInquiries);

    const filteredInquiries = inquiries.filter((inq) => {
        const q = searchQuery.toLowerCase();
        return (
            inq.id.toString().includes(q) ||
            inq.status.toLowerCase().includes(q) ||
            (inq.notes && inq.notes.toLowerCase().includes(q))
        );
    });

    const handleStatusUpdate = async (id: number, status: "ACCEPTED" | "REJECTED") => {
        setActionLoading(id);
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 600));
        setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
        showAlert(`Inquiry #${id} ${status.toLowerCase()}.`, "success");
        setActionLoading(null);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Demo Banner */}
            <div className="bg-[#fdf567] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <p className="font-black uppercase tracking-tight text-sm">
                    🎭 DEMO MODE — Mock data. Real page: <code className="bg-black text-[#fdf567] px-2 py-0.5">/dashboard/inquiries</code>
                </p>
                <Link href="/dashboard" className="font-black text-sm underline">Exit Demo</Link>
            </div>

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
