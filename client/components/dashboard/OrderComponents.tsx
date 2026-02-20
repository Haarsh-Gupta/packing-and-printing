"use client";

import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, CreditCard, Download, ChevronRight, Loader2 } from "lucide-react";
import { Order } from "@/types/dashboard";
import { getOrderStatusColor, getOrderStatusStep } from "@/lib/dashboardUtils";
import Link from "next/link";
import { useAlert } from "@/components/CustomAlert";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useState } from "react";
export function OrderCard({ order }: { order: Order }) {
    const { showAlert } = useAlert();
    const { initiatePayment, isProcessing } = useRazorpay();
    const [paidAmount, setPaidAmount] = useState(order.amount_paid);
    const [orderStatus, setOrderStatus] = useState<Order["status"]>(order.status);
    const balanceDue = order.total_amount - paidAmount;
    const currentStep = getOrderStatusStep(orderStatus);
    const productName = order.product_name || `Custom Order #${order.id}`;
    const quantity = order.quantity || 100;

    return (
        <Card className="overflow-hidden border-2 border-black shadow-none hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 sm:h-auto bg-zinc-100 relative shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                        <Package className="w-12 h-12 text-zinc-300 sm:w-16 sm:h-16" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className={`${getOrderStatusColor(order.status)} border-0 font-bold px-3 py-1`}>
                                {order.status.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-zinc-400 font-mono">#{order.id}</span>
                        </div>

                        <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-1">{productName}</h3>
                        <p className="text-sm text-zinc-500 mb-4">{quantity.toLocaleString()} Units • Inquiry #{order.inquiry_id}</p>

                        <div className="bg-zinc-50 p-3 rounded-lg flex flex-wrap gap-4 justify-between items-center border border-zinc-100">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total</p>
                                <p className="font-bold text-zinc-900">₹{order.total_amount.toLocaleString()}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 hidden sm:block" />
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Paid</p>
                                <p className="font-medium text-green-600">₹{order.amount_paid.toLocaleString()}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 hidden sm:block" />
                            <div className="text-right">
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Balance</p>
                                <p className={`font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-zinc-900'}`}>₹{balanceDue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 pt-2">
                <div className="relative mt-2">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-100">
                        <div style={{ width: `${(currentStep / 5) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black transition-all duration-1000"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
                        <span className={currentStep >= 1 ? "text-black" : ""}>Ordered</span>
                        <span className={currentStep >= 3 ? "text-black" : ""}>Processing</span>
                        <span className={currentStep >= 5 ? "text-black" : ""}>Delivered</span>
                    </div>
                </div>
            </div>

            <Separator />

            <CardFooter className="p-4 bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Button variant="ghost" className="text-black hover:text-black hover:bg-[#fdf567] bg-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px border-2 border-black transition-all px-4 py-2 font-bold h-10 w-full md:w-auto flex justify-between md:justify-center" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>View Details <ChevronRight className="w-4 h-4 ml-1" /></Link>
                </Button>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-initial bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-black font-bold h-10 px-4" asChild>
                        <Link href={`/dashboard/inquiries/${order.inquiry_id}`}>
                            Inquiry
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-initial bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-black font-bold h-10 px-4">
                        <Download className="w-4 h-4 mr-2" /> Invoice
                    </Button>
                    {balanceDue > 0 && (
                        <Button
                            className="w-full md:w-auto bg-[#4be794] hover:bg-[#3cd083] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-10 px-6 text-sm disabled:opacity-70"
                            disabled={isProcessing}
                            onClick={() => initiatePayment({
                                orderId: order.id,
                                balanceDue,
                                productName,
                                onSuccess: (data) => {
                                    showAlert(`Payment of ₹${balanceDue.toLocaleString()} successful!`, "success");
                                    setPaidAmount(data.amount_paid);
                                    setOrderStatus(data.status as Order["status"]);
                                },
                                onError: (msg) => showAlert(msg, "error"),
                            })}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4 mr-2" /> Pay Now</>}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

export function OrderListRow({ order }: { order: Order }) {
    const { showAlert } = useAlert();
    const balanceDue = order.total_amount - order.amount_paid;
    const productName = order.product_name || `Order #${order.id}`;

    return (
        <div className="bg-white border-2 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-zinc-100 border border-black flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{productName}</h4>
                        <span className="text-xs font-mono text-zinc-400">#{order.id}</span>
                    </div>
                    <p className="text-sm text-zinc-500">Inquiry #{order.inquiry_id} • {order.quantity} Units</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Amount</p>
                    <p className="font-bold">₹{order.total_amount.toLocaleString()}</p>
                </div>

                <Badge variant="outline" className={`${getOrderStatusColor(order.status)} border-0 font-bold px-3 py-1 text-xs shrink-0`}>
                    {order.status.replace("_", " ")}
                </Badge>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-2 border-black font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all" asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>Details</Link>
                    </Button>
                    {balanceDue > 0 && (
                        <Button size="sm" className="bg-[#4be794] text-black border-2 border-black font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all" onClick={() => showAlert(`Processing payment for Order #${order.id}...`, "info")}>
                            Pay
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
