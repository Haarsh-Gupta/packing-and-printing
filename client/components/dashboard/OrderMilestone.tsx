"use client";

import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { updateMilestoneStatus } from "@/lib/store/orderSlice";
import { CheckCircle2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderMilestone({ orderId }: { orderId: string }) {
    const dispatch = useAppDispatch();
    const order = useAppSelector((state) =>
        state.order.orders.find((o) => o.id === orderId)
    );

    // If order details are empty for Redux, use dummy milestones. Just for demo purposes.
    const displayMilestones = order?.milestones?.length ? order.milestones : [
        { id: "m1", name: "30% Advance Payment", amount_due: 1500, is_paid: true },
        { id: "m2", name: "40% Before Printing", amount_due: 2000, is_paid: false },
        { id: "m3", name: "30% Before Dispatch", amount_due: 1500, is_paid: false },
    ];

    const handlePay = (milestoneId: string) => {
        // In reality, this would open Razorpay, then on success update Redux:
        dispatch(updateMilestoneStatus({ orderId: orderId, milestoneId }));
        alert(`Payment successful for milestone ${milestoneId}`);
    };

    return (
        <div className="bg-white p-6 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
            <h3 className="text-xl font-black uppercase tracking-widest border-b-2 border-black pb-4">Payment Milestones</h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-1 before:bg-black/10 before:-z-10">
                {displayMilestones.map((milestone, index) => {
                    const isPreviousPaid = index === 0 || displayMilestones[index - 1].is_paid;
                    const isLocked = !isPreviousPaid && !milestone.is_paid;

                    return (
                        <div
                            key={milestone.id}
                            className={`flex items-start gap-4 p-4 border-2 transition-all ${milestone.is_paid ? "border-[#4be794] bg-[#4be794]/10" :
                                    isLocked ? "border-zinc-200 bg-zinc-50 opacity-60" : "border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                }`}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {milestone.is_paid ? (
                                    <CheckCircle2 className="w-8 h-8 text-[#4be794]" />
                                ) : isLocked ? (
                                    <Lock className="w-8 h-8 text-zinc-400" />
                                ) : (
                                    <Unlock className="w-8 h-8 text-black" />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <h4 className={`text-lg font-bold uppercase tracking-wide ${milestone.is_paid ? "text-green-700" : "text-black"}`}>
                                    {milestone.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black tracking-tighter">₹{milestone.amount_due.toLocaleString()}</span>
                                </div>
                            </div>

                            {!milestone.is_paid && !isLocked && (
                                <Button
                                    onClick={() => handlePay(milestone.id)}
                                    className="h-10 px-8 bg-[#4be794] text-black font-black uppercase rounded-none border-2 border-black hover:bg-[#3cd083]"
                                >
                                    PAY NOW
                                </Button>
                            )}
                            {!milestone.is_paid && isLocked && (
                                <Button
                                    disabled
                                    variant="outline"
                                    className="h-10 px-8 bg-zinc-100 text-zinc-400 font-bold uppercase rounded-none border-2 border-zinc-200"
                                >
                                    LOCKED
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
