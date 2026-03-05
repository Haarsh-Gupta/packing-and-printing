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
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative aspect-auto sm:aspect-4/3 border-4 border-black bg-zinc-50 overflow-hidden rounded-3xl group">
                <img
                    src={displayImages[currentIndex]}
                    alt={`${productName} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700"
                    onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                    }}
                />

                {/* Carousel Controls */}
                {displayImages.length > 1 && (
                    <>
                        <Button
                            onClick={prevImage}
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 border-2 border-black hover:bg-white transition-all rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-6 w-6 text-black" />
                        </Button>
                        <Button
                            onClick={nextImage}
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 border-2 border-black hover:bg-white transition-all rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                            <ChevronRight className="h-6 w-6 text-black" />
                        </Button>

                        {/* Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-white/80 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity">
                            {displayImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2.5 h-2.5 rounded-full border border-black transition-all ${idx === currentIndex ? "bg-black scale-125" : "bg-black/20 hover:bg-black/50"
                                        }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative aspect-square border-2 ${idx === currentIndex ? "border-black" : "border-black/20 hover:border-black/50"
                                } bg-zinc-50 overflow-hidden transition-all`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = fallbackImage;
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
