"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle2, XCircle, FileText, IndianRupee, AlertCircle } from "lucide-react";

// Types based on your FastAPI schemas
interface Inquiry {
  id: number;
  template_id: number;
  quantity: int;
  selected_options: Record<string, any>;
  notes: string | null;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED";
  quoted_price: number | null;
  admin_notes: string | null;
  created_at: string;
}

export default function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Fetch inquiries on load
  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      // Replace with your actual GET route for user's inquiries
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Accept/Reject using your InquiryStatusUpdate schema
  const handleStatusUpdate = async (id: number, status: "ACCEPTED" | "REJECTED") => {
    setActionLoading(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // Update local state to reflect the change immediately
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper function to render the correct badge style based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 border-2 border-yellow-800 rounded-none"><Clock className="w-3 h-3 mr-1"/> Pending Review</Badge>;
      case "QUOTED":
        return <Badge className="bg-blue-100 text-blue-800 border-2 border-blue-800 rounded-none animate-pulse"><AlertCircle className="w-3 h-3 mr-1"/> Action Required</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-green-100 text-green-800 border-2 border-green-800 rounded-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Accepted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 border-2 border-red-800 rounded-none"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">My Inquiries</h1>
        <p className="text-zinc-600 mt-2">Track your custom printing requests and review official quotes.</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
          <FileText className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-xl font-bold">No inquiries yet</h3>
          <p className="text-zinc-500 mb-6">You haven't requested any custom quotes.</p>
          <Button className="bg-black text-white rounded-none border-2 border-black" onClick={() => window.location.href = '/products'}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
              <CardHeader className="bg-zinc-50 border-b-2 border-black pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Inquiry #{inquiry.id}
                  </CardTitle>
                  <p className="text-sm text-zinc-500 mt-1">
                    Requested on {new Date(inquiry.created_at).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(inquiry.status)}
              </CardHeader>
              
              <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                {/* Left Side: User's Request Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg uppercase border-b-2 border-black inline-block">Your Request</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-zinc-500 font-medium">Quantity:</span>
                    <span className="font-bold">{inquiry.quantity} Units</span>
                    
                    {/* Render dynamic options securely */}
                    {Object.entries(inquiry.selected_options || {}).map(([key, value]) => (
                      <div key={key} className="contents">
                        <span className="text-zinc-500 font-medium capitalize">{key.replace("_", " ")}:</span>
                        <span className="font-bold capitalize">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {inquiry.notes && (
                    <div className="bg-zinc-100 p-3 border border-black text-sm italic">
                      "{inquiry.notes}"
                    </div>
                  )}
                </div>

                {/* Right Side: Admin's Quote Details */}
                <div className="space-y-4 border-l-2 border-dashed border-zinc-300 pl-8">
                  <h4 className="font-bold text-lg uppercase border-b-2 border-black inline-block">Official Quote</h4>
                  
                  {inquiry.status === "PENDING" ? (
                    <div className="text-zinc-500 flex items-center h-full pb-8">
                      <Clock className="w-5 h-5 mr-2 animate-spin-slow" />
                      Our team is calculating the best price for your requirements. Please check back soon.
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

              {/* Action Buttons ONLY show if status is QUOTED */}
              {inquiry.status === "QUOTED" && (
                <CardFooter className="bg-zinc-100 border-t-2 border-black p-4 flex gap-4 justify-end">
                  <Button 
                    variant="outline" 
                    className="border-2 border-black rounded-none hover:bg-red-50 hover:text-red-600"
                    disabled={actionLoading === inquiry.id}
                    onClick={() => handleStatusUpdate(inquiry.id, "REJECTED")}
                  >
                    {actionLoading === inquiry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decline Quote"}
                  </Button>
                  <Button 
                    className="bg-black text-white rounded-none border-2 border-black hover:bg-green-600"
                    disabled={actionLoading === inquiry.id}
                    onClick={() => handleStatusUpdate(inquiry.id, "ACCEPTED")}
                  >
                    {actionLoading === inquiry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept & Proceed to Order"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}