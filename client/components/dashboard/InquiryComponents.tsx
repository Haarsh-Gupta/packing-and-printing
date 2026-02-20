"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, IndianRupee, MessageSquare, Loader2, Clock, Box, Layers } from "lucide-react";
import { Inquiry } from "@/types/dashboard";
import { InquiryStatusBadge } from "./InquiryStatusBadge";
import Link from "next/link";

interface InquiryActionProps {
    inquiry: Inquiry;
    actionLoading: number | null;
    handleStatusUpdate: (id: number, status: "ACCEPTED" | "REJECTED") => void;
}

export function InquiryCard({ inquiry, actionLoading, handleStatusUpdate }: InquiryActionProps) {
    return (
        <Card key={inquiry.id} className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b-2 border-black pb-4 flex flex-row items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {inquiry.service_id ? (
                            <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                <Layers className="w-3 h-3" /> Service
                            </Badge>
                        ) : (
                            <Badge className="bg-[#90e8ff] text-black border-2 border-black rounded-none flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                <Box className="w-3 h-3" /> Product
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                        {inquiry.service_id ? inquiry.service_name : inquiry.template_name}
                    </CardTitle>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        ID #{inquiry.id} • {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                </div>
                <InquiryStatusBadge status={inquiry.status} />
            </CardHeader>

            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-lg uppercase border-b-2 border-black inline-block">Your Request</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-zinc-500 font-medium">Quantity:</span>
                        <span className="font-bold">{inquiry.quantity} Units</span>
                        {inquiry.variant_name && (
                            <div className="contents">
                                <span className="text-zinc-500 font-medium">Variant:</span>
                                <span className="font-bold">{inquiry.variant_name}</span>
                            </div>
                        )}
                        {Object.entries(inquiry.selected_options || {}).map(([key, value]) => {
                            // Don't repeat the variant name if it's already in selected_options
                            if (key === 'variant_name') return null;
                            return (
                                <div key={key} className="contents">
                                    <span className="text-zinc-500 font-medium capitalize">{key.replace("_", " ")}:</span>
                                    <span className="font-bold capitalize">{String(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                    {inquiry.notes && (
                        <div className="bg-zinc-100 p-3 border border-black text-sm italic">
                            "{inquiry.notes}"
                        </div>
                    )}
                </div>

                <div className="space-y-4 border-l-2 border-dashed border-zinc-300 pl-8">
                    <h4 className="font-bold text-lg uppercase border-b-2 border-black inline-block">Official Quote</h4>
                    {inquiry.status === "PENDING" ? (
                        <div className="text-zinc-500 flex items-center h-full pb-8">
                            <Clock className="w-5 h-5 mr-2 animate-spin-slow" />
                            Our team is calculating the best price for your requirements.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-4xl font-black text-black flex items-center">
                                <IndianRupee className="w-8 h-8 mr-1" />
                                {inquiry.quoted_price?.toLocaleString()}
                            </div>
                            <p className="text-sm text-zinc-600 font-medium">Total estimated cost</p>
                            {inquiry.admin_notes && (
                                <div className="bg-blue-50 text-blue-900 p-3 border-2 border-blue-200 text-sm">
                                    <strong>Admin Note:</strong> {inquiry.admin_notes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="bg-zinc-100 border-t-2 border-black p-4 flex gap-4 justify-between items-center">
                <Button variant="ghost" className="text-black hover:text-black hover:bg-[#fdf567] bg-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px border-2 border-black transition-all px-6 py-2 font-bold h-12 gap-2" asChild>
                    <Link href={`/dashboard/inquiries/${inquiry.id}`}>
                        <MessageSquare className="w-4 h-4" /> View Details & Chat
                    </Link>
                </Button>

                {inquiry.status === "QUOTED" && (
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-black font-bold h-12 px-6 hover:bg-red-50 hover:text-red-600"
                            disabled={actionLoading === inquiry.id}
                            onClick={() => handleStatusUpdate(inquiry.id, "REJECTED")}
                        >
                            {actionLoading === inquiry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decline"}
                        </Button>
                        <Button
                            className="bg-[#4be794] hover:bg-[#3cd083] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8"
                            disabled={actionLoading === inquiry.id}
                            onClick={() => handleStatusUpdate(inquiry.id, "ACCEPTED")}
                        >
                            {actionLoading === inquiry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

export function InquiryListRow({ inquiry, actionLoading, handleStatusUpdate }: InquiryActionProps) {
    return (
        <div className="bg-white border-2 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-zinc-100 border border-black flex items-center justify-center shrink-0">
                    {inquiry.service_id ? (
                        <Layers className="w-6 h-6 text-[#ff90e8]" />
                    ) : (
                        <Box className="w-6 h-6 text-[#90e8ff]" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg uppercase tracking-tight">
                            {inquiry.service_id ? inquiry.service_name : inquiry.template_name}
                        </h4>
                        <span className="text-[10px] font-black bg-zinc-100 border border-black px-1.5 uppercase">ID #{inquiry.id}</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                        {inquiry.quantity} Units • {inquiry.variant_name || 'Standard'} • {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Quote</p>
                    <p className="font-bold">{inquiry.quoted_price ? `₹${inquiry.quoted_price.toLocaleString()}` : "Pending"}</p>
                </div>

                <div className="shrink-0">
                    <InquiryStatusBadge status={inquiry.status} />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="text-black hover:bg-[#fdf567] bg-zinc-100 border-2 border-black transition-all px-4 font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-px" asChild>
                        <Link href={`/dashboard/inquiries/${inquiry.id}`}>View</Link>
                    </Button>

                    {inquiry.status === "QUOTED" && (
                        <Button
                            className="bg-[#4be794] text-black border-2 border-black font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-px"
                            disabled={actionLoading === inquiry.id}
                            onClick={() => handleStatusUpdate(inquiry.id, "ACCEPTED")}
                        >
                            {actionLoading === inquiry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
