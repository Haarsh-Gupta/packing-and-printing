"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageCarouselProps {
    images: string[];
    productName: string;
}

export default function ProductImageCarousel({ images, productName }: ProductImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const fallbackImage = "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop";
    const displayImages = images && images.length > 0 ? images : [fallbackImage];

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    return (
        <>
            <div className="relative aspect-square max-h-[500px] w-full mx-auto border-3 border-border-black shadow-neubrutalism-lg bg-zinc-50 overflow-hidden rounded-2xl group">
                <img
                    src={displayImages[currentIndex]}
                    alt={`${productName} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Carousel Controls */}
                {displayImages.length > 1 && (
                    <>
                        <Button
                            onClick={prevImage}
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 border-2 border-black hover:bg-white hover:-translate-x-1 transition-all rounded-full h-10 w-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-6 w-6 text-black" />
                        </Button>
                        <Button
                            onClick={nextImage}
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 border-2 border-black hover:bg-white hover:translate-x-1 transition-all rounded-full h-10 w-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                            <ChevronRight className="h-6 w-6 text-black" />
                        </Button>

                        {/* Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/80 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {displayImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2.5 h-2.5 rounded-full border border-black transition-all ${idx === currentIndex ? "bg-primary scale-125" : "bg-black/20 hover:bg-black/50"
                                        }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnails Array */}
            {displayImages.length > 1 && (
                <div className="flex gap-4 mt-8 py-4 px-2 -mx-2 overflow-x-auto no-scrollbar">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`
                                relative w-20 h-20 flex-shrink-0 border-2 transition-all rounded-xl overflow-hidden
                                ${idx === currentIndex 
                                    ? "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1.5" 
                                    : "border-black/10 hover:border-black/30 bg-white shadow-sm"
                                }
                            `}
                        >
                            <img 
                                src={img} 
                                alt={`Thumbnail ${idx + 1}`} 
                                className={`w-full h-full object-cover transition-opacity ${idx === currentIndex ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
