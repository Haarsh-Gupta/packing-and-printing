export default function AboutPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">About BookBind</h1>
                <p className="text-xl text-zinc-500 font-bold max-w-2xl mx-auto">
                    We&apos;re a modern printing &amp; packaging company turning digital designs into premium physical products.
                </p>
            </div>

            <div className="border-4 border-black p-8 bg-[#fdf567] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight">Our Mission</h2>
                <p className="text-lg font-bold text-zinc-800 leading-relaxed">
                    BookBind was founded with a simple goal: make professional printing and packaging accessible to everyone —
                    from solo entrepreneurs designing their first product box to established brands needing bulk corporate
                    stationery. We combine cutting-edge digital tools with traditional craftsmanship to deliver exceptional quality.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { stat: "5,000+", label: "Orders Fulfilled", color: "bg-[#4be794]" },
                    { stat: "500+", label: "Happy Clients", color: "bg-[#90e8ff]" },
                    { stat: "24hr", label: "Avg Response Time", color: "bg-[#ff90e8]" },
                ].map((item) => (
                    <div key={item.label} className={`${item.color} border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                        <div className="text-4xl font-black">{item.stat}</div>
                        <div className="text-sm font-black uppercase tracking-widest mt-2">{item.label}</div>
                    </div>
                ))}
            </div>

            <div className="border-4 border-black p-8 bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight">What We Offer</h2>
                <ul className="space-y-3 text-lg font-bold text-zinc-700">
                    <li className="flex items-start gap-3"><span className="text-black">■</span> Custom book printing — hardcover, softcover, spiral, and more</li>
                    <li className="flex items-start gap-3"><span className="text-black">■</span> Premium packaging solutions for products of all sizes</li>
                    <li className="flex items-start gap-3"><span className="text-black">■</span> Corporate stationery — letterheads, business cards, envelopes</li>
                    <li className="flex items-start gap-3"><span className="text-black">■</span> Pre-press services — design, proofing, and quality assurance</li>
                    <li className="flex items-start gap-3"><span className="text-black">■</span> Flexible pricing with instant online quotes</li>
                </ul>
            </div>
        </main>
    );
}
