/**
 * useRazorpay
 * A reusable hook that handles the full Razorpay checkout flow:
 * 1. POST /payments/create-order → get gateway_order_id + key
 * 2. Load Razorpay checkout.js if not already loaded
 * 3. Open modal
 * 4. On success → POST /payments/verify
 * 5. Call onSuccess callback with updated order data
 */

import { useState } from "react";

interface RazorpayOptions {
    orderId: number;
    balanceDue: number;
    productName?: string;
    userContact?: string;
    userEmail?: string;
    onSuccess?: (data: { status: string; amount_paid: number }) => void;
    onError?: (message: string) => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (document.getElementById("razorpay-script")) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function useRazorpay() {
    const [isProcessing, setIsProcessing] = useState(false);

    const initiatePayment = async ({
        orderId,
        balanceDue,
        productName = "BookBind Order",
        userContact,
        userEmail,
        onSuccess,
        onError,
    }: RazorpayOptions) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            onError?.("Please log in to make a payment.");
            return;
        }

        setIsProcessing(true);

        try {
            // Step 1: Load Razorpay SDK
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                onError?.("Failed to load payment gateway. Please check your connection.");
                setIsProcessing(false);
                return;
            }

            // Step 2: Create gateway order
            const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ order_id: orderId }),
            });

            if (!createRes.ok) {
                const err = await createRes.json();
                onError?.(err.detail || "Failed to initiate payment.");
                setIsProcessing(false);
                return;
            }

            const { gateway_order_id, amount, currency, razorpay_key_id } = await createRes.json();

            // Step 3: Open Razorpay modal
            const options = {
                key: razorpay_key_id,
                amount,
                currency,
                name: "BookBind",
                description: productName,
                order_id: gateway_order_id,
                prefill: {
                    email: userEmail || "",
                    contact: userContact || "",
                },
                theme: {
                    color: "#000000",
                    backdrop_color: "#fdf567",
                },
                handler: async (response: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) => {
                    // Step 4: Verify payment with backend
                    try {
                        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                order_id: orderId,
                                gateway_order_id: response.razorpay_order_id,
                                gateway_payment_id: response.razorpay_payment_id,
                                gateway_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            const data = await verifyRes.json();
                            onSuccess?.(data);
                        } else {
                            const err = await verifyRes.json();
                            onError?.(err.detail || "Payment verification failed.");
                        }
                    } catch {
                        onError?.("Network error during payment verification.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response: any) => {
                onError?.(response.error?.description || "Payment failed.");
                setIsProcessing(false);
            });
            rzp.open();
        } catch (e: any) {
            onError?.(e.message || "An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    return { initiatePayment, isProcessing };
}
