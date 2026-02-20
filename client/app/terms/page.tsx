export default function TermsPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
            <div className="text-center space-y-4 border-b-4 border-black pb-8">
                <h1 className="text-5xl font-black uppercase tracking-tighter">Terms of Service</h1>
                <p className="text-zinc-500 font-bold">Last updated: February 2026</p>
            </div>

            {[
                { title: "1. Acceptance of Terms", body: "By accessing and using BookBind's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services." },
                { title: "2. Services", body: "BookBind provides custom printing and packaging services. All orders are subject to availability, pricing confirmation, and production capacity. We reserve the right to decline orders that do not meet our quality or content guidelines." },
                { title: "3. Orders & Payments", body: "Once a quote is accepted, an order is created. Payment can be made in full or in instalments via our secure Razorpay gateway. Orders are processed upon receiving at least the minimum required payment. All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise." },
                { title: "4. Cancellations & Refunds", body: "Orders may be cancelled before they enter production. Once production has started, cancellation may incur a fee proportional to the work completed. Refunds, if applicable, will be processed within 7–10 business days." },
                { title: "5. Delivery", body: "Estimated delivery times are provided at the time of order confirmation. While we strive to meet these timelines, delays may occur due to unforeseen circumstances. BookBind is not responsible for delays caused by third-party logistics providers." },
                { title: "6. Intellectual Property", body: "You retain ownership of all designs and content you submit. By uploading files, you confirm that you have the legal right to reproduce the content. BookBind is not liable for any copyright or trademark infringement arising from user-submitted content." },
                { title: "7. Limitation of Liability", body: "BookBind's total liability shall not exceed the total amount paid for the specific order in question. We are not liable for indirect, incidental, or consequential damages." },
                { title: "8. Contact", body: "For any questions regarding these terms, please contact us at hello@bookbind.com or through our support ticket system." },
            ].map((section) => (
                <div key={section.title} className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tight">{section.title}</h2>
                    <p className="text-zinc-600 font-medium leading-relaxed">{section.body}</p>
                </div>
            ))}
        </main>
    );
}
