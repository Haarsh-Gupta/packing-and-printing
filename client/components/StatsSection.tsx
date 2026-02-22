"use client";

import { useState, useEffect, useRef } from "react";

function AnimatedCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const duration = 2000;
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            setCount(target);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-6xl font-black tracking-tighter text-black leading-none">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm md:text-base font-bold uppercase tracking-wider text-black/50 mt-2">
                {label}
            </div>
        </div>
    );
}

export default function StatsSection() {
    return (
        <section className="py-14 px-6 bg-white border-b-4 border-black">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    <AnimatedCounter target={500} suffix="+" label="Happy Clients" />
                    <AnimatedCounter target={1000000} suffix="" label="Prints Delivered" />
                    <AnimatedCounter target={10} suffix="+" label="Years Experience" />
                    <AnimatedCounter target={99} suffix="%" label="Satisfaction Rate" />
                </div>
            </div>
        </section>
    );
}
