"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CreditCard, Download, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Order {
  id: number;
  inquiry_id: number;
  total_amount: number;
  amount_paid: number;
  status: "WAITING_PAYMENT" | "PARTIALLY_PAID" | "PAID" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mocking the fetch - replace with your actual API call
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING_PAYMENT": return <Badge className="bg-red-100 text-red-800 border-2 border-red-800 rounded-none"><AlertCircle className="w-3 h-3 mr-1"/> Unpaid</Badge>;
      case "PARTIALLY_PAID": return <Badge className="bg-yellow-100 text-yellow-800 border-2 border-yellow-800 rounded-none"><Clock className="w-3 h-3 mr-1"/> Partial Payment</Badge>;
      case "PAID": return <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-800 rounded-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Paid in Full</Badge>;
      case "PROCESSING": return <Badge className="bg-purple-100 text-purple-800 border-2 border-purple-800 rounded-none"><Package className="w-3 h-3 mr-1"/> In Production</Badge>;
      case "COMPLETED": return <Badge className="bg-green-100 text-green-800 border-2 border-green-800 rounded-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Delivered</Badge>;
      default: return <Badge className="rounded-none border-2 border-black">{status}</Badge>;
    }
  };

  const handlePayment = (orderId: number) => {
    // This will trigger Razorpay integration
    alert(`Initiating Razorpay for Order #${orderId}`);
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">My Orders</h1>
        <p className="text-zinc-600 mt-2">Track production status, make payments, and download invoices.</p>
      </div>

      {orders.length === 0 ? (
        <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
          <Package className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-xl font-bold">No active orders</h3>
          <p className="text-zinc-500 mb-6">Accept a quoted inquiry to start an order.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const balanceDue = order.total_amount - order.amount_paid;
            const progress = (order.amount_paid / order.total_amount) * 100;

            return (
              <Card key={order.id} className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <CardHeader className="bg-zinc-50 border-b-2 border-black flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Order #{order.id}</CardTitle>
                    <p className="text-sm text-zinc-500 mt-1">From Inquiry #{order.inquiry_id} • {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </CardHeader>
                
                <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold uppercase border-b-2 border-black inline-block">Payment Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Total Amount:</span>
                        <span className="font-bold">₹{order.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Amount Paid:</span>
                        <span className="font-bold text-green-600">₹{order.amount_paid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t-2 border-black pt-2">
                        <span className="text-zinc-500 font-bold">Balance Due:</span>
                        <span className="font-black text-red-600 text-lg">₹{balanceDue.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Brutalist Progress Bar */}
                    <div className="h-4 w-full border-2 border-black bg-zinc-100 mt-2">
                      <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-zinc-100 border-t-2 border-black p-4 flex gap-4 justify-end">
                  <Button variant="outline" className="border-2 border-black rounded-none bg-white hover:bg-zinc-100">
                    <Download className="w-4 h-4 mr-2" /> Invoice
                  </Button>
                  
                  {balanceDue > 0 && (
                    <Button 
                      className="bg-black text-white rounded-none border-2 border-black hover:bg-zinc-800"
                      onClick={() => handlePayment(order.id)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" /> Pay Balance (₹{balanceDue})
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}