"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import { ArrowRight, Package } from "lucide-react";

interface ProductCardProps {
    product: Product;
    index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
    const variantCountText = product.sub_products?.length > 0
        ? `${product.sub_products.length} VARIATIONS`
        : "0 VARIATIONS";

    const coverImage = product.cover_image || null;

    return (
        <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* ── IMAGE AREA ── */}
                <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: 'var(--black)',
                    borderBottom: 'var(--border-thick)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {coverImage ? (
                        <img
                            src={coverImage}
                            alt={product.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)' }}>
                            <Package size={48} color="var(--black)" opacity={0.2} />
                        </div>
                    )}

                    {/* Badge Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'var(--yellow)',
                        border: '2px solid var(--black)',
                        padding: '4px 8px',
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--black)'
                    }}>
                        {variantCountText}
                    </div>
                </div>

                {/* ── META AREA ── */}
                <div style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    flex: 1,
                    background: 'var(--white)'
                }}>
                    <h3 className="display" style={{
                        fontSize: 22,
                        textTransform: 'uppercase',
                        color: 'var(--black)',
                        lineHeight: 1.1,
                        margin: 0
                    }}>
                        {product.name}
                    </h3>

                    <p style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'rgba(10,10,10,0.6)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {product.description || "Premium printing and packaging options."}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--red)'
                        }}>
                            EXPLORE <ArrowRight size={14} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}