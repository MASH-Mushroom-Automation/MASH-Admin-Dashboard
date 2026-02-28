"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Slide {
    id: number;
    tag: string;
    title: string;
    subtitle?: string;
    description?: string;
    bgClass?: string;
}

interface PromoCarouselProps {
    className?: string;
}

const SLIDES: Slide[] = [
    {
        id: 1,
        tag: "DASHBOARD",
        title: "System Overview",
        description:
            "View the total number of registered mushroom chambers and overall platform health from the admin dashboard.",
        bgClass: "bg-primary",
    },
    {
        id: 2,
        tag: "USER MANAGEMENT",
        title: "Grower, Seller & Buyer Administration",
        description:
            "Manage user registrations, view role distribution (Growers, Sellers, Buyers), and monitor recent users.",
        bgClass: "bg-[#263238]",
    },
    {
        id: 3,
        tag: "SELLER VERIFICATION",
        title: "Seller Application & Approval Workflow",
        description:
            "Review pending seller applications, verify store details, or reject invalid ones.",
        bgClass: "bg-[#3e4f3a]",
    },
]

export default function PromoCarousel({ className = "" }: PromoCarouselProps) {
    const [index, setIndex] = useState(0);
    const timer = useRef<number | null>(null);
    const hoverRef = useRef(false);

    useEffect(() => {
        startAuto();
        return stopAuto;
    }, [index]);

    function startAuto() {
        stopAuto();
        timer.current = window.setInterval(() => {
            if (!hoverRef.current) setIndex((i) => (i + 1) % SLIDES.length);
        }, 5000);
    }

    function stopAuto() {
        if (timer.current) {
            window.clearInterval(timer.current);
            timer.current = null;
        }
    }

    function prev() {
        setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
    }

    function next() {
        setIndex((i) => (i + 1) % SLIDES.length);
    }

    return (
        <div
            className={`flex ${className}`}
            onMouseEnter={() => (hoverRef.current = true)}
            onMouseLeave={() => (hoverRef.current = false)}
        >
            <div className="relative overflow-hidden rounded-xl border border-primary/30">
                {/* Sliding track for simple slide transition */}
                <div className="relative h-44 sm:h-52 md:h-44 lg:h-56 w-full overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                        {SLIDES.map((s) => (
                            <div
                                key={s.id}
                                className={`min-w-full flex items-end p-6 ${s.bgClass || "bg-linear-to-b from-black/60 to-black/30"}`}
                            >
                                <div className="w-full text-left text-white">
                                    <p className="text-xs font-semibold text-emerald-400 mb-1">
                                        {s.tag}
                                    </p>
                                    <h3 className="text-lg sm:text-xl font-bold leading-tight">
                                        {s.title}
                                    </h3>
                                    {s.description && (
                                        <p className="text-sm text-white/80 mt-1 hidden sm:block">
                                            {s.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls - compact chevrons in top-right */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <button
                        aria-label="Previous"
                        onClick={prev}
                        className="rounded-full p-1.5 text-white/90 hover:text-white bg-transparent border border-white/10 hover:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                        aria-label="Next"
                        onClick={next}
                        className="rounded-full p-1.5 text-white/90 hover:text-white bg-transparent border border-white/10 hover:bg-white/5"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                {/* Slide indicator - centered dark pill with small dots */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10">
                    <div className="flex items-center justify-center">
                        <div className="px-3 flex items-center gap-3">
                            {SLIDES.map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => setIndex(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className="p-0.5"
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: i === index ? 28 : 6,
                                            height: i === index ? 8 : 6,
                                            borderRadius: 9999,
                                            background: i === index ? "#2e7d32" : "rgba(46,125,50,0.28)",
                                            border: i === index ? "none" : "1px solid rgba(255,255,255,0.06)",
                                            transition: "width 220ms cubic-bezier(.2,.8,.2,1), height 220ms cubic-bezier(.2,.8,.2,1), background 180ms",
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
