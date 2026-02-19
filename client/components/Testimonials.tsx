import { Quote } from "lucide-react";

// The testimonial data
const testimonials = [
    {
        name: "Arjun Mehta",
        role: "Founder, QuickBite Foods",
        content: "BookBind completely transformed our packaging. The custom corrugated boxes are incredibly sturdy, and the print quality is flawless. It gave our brand the premium feel we desperately needed.",
        avatarSeed: "ArjunM"
    },
    {
        name: "Priya Sharma",
        role: "Operations Manager, TechNova",
        content: "Getting custom invoice books printed used to be a massive headache. With BookBind, I just uploaded our logo, configured the triplicate pages, and they arrived perfectly bound in 3 days. Phenomenal service.",
        avatarSeed: "PriyaS"
    },
    {
        name: "Rohan Desai",
        role: "Marketing Director, Bloom Cafe",
        content: "The premium business cards with gold-foil embossing were an absolute hit at our last networking event. The interface to configure the print job was so intuitive. We won't go anywhere else.",
        avatarSeed: "RohanD"
    },
    {
        name: "Anjali Gupta",
        role: "Creative Lead, DesignStudio",
        content: "I appreciate the attention to detail. The color reproduction on our catalogs was 100% accurate to the digital proofs. Highly recommended for professionals who care about quality.",
        avatarSeed: "AnjaliG"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 px-4 bg-[#d2d9f7] border-t-2 border-black">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Section Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black">
                        Trusted by businesses across India.
                    </h2>
                    <p className="text-xl text-zinc-600 font-medium">
                        From startups to enterprises, we handle printing for everyone.
                    </p>
                </div>

                {/* Testimonials Grid - Gumroad Style */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                    {testimonials.map((testimonial, idx) => (
                        <div key={idx} className="flex flex-col space-y-6">

                            {/* The Quote Card */}
                            <div className="bg-white border-2 border-black rounded-3xl p-8 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <Quote className="h-10 w-10 text-black mb-4 fill-black" />
                                <p className="text-lg md:text-xl font-medium text-zinc-800 leading-relaxed font-serif">
                                    {testimonial.content}
                                </p>
                            </div>

                            {/* The Author Info (Outside the card) */}
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-14 w-14 rounded-full border-2 border-black overflow-hidden bg-white shrink-0 shadow-sm">
                                    <img
                                        src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${testimonial.avatarSeed}&backgroundColor=ffdfbf`}
                                        alt={testimonial.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg leading-tight text-black">{testimonial.name}</h4>
                                    <p className="text-sm text-zinc-600 font-medium">{testimonial.role}</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}