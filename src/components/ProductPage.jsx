import React, { useState } from 'react';
import { Star, Minus, Plus, Share2, Heart } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

// Standalone template for now, would typically be routed
const ProductPage = () => {
    const [qty, setQty] = useState(1);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <Navbar />

            <div className="container py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* Gallery Section */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-sm relative overflow-hidden group">
                            {/* Main Image Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-300 font-bold text-6xl">
                                MAIN IMG
                            </div>
                            <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
                                <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 hover:fill-red-500" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-100 rounded-sm cursor-pointer border border-transparent hover:border-black transition-colors"></div>
                            ))}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium">
                                <div className="flex"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /></div>
                                <span className="text-gray-400">(128 Reviews)</span>
                            </div>
                            <h1 className="t-heading text-4xl md:text-5xl">Minimal Tech Pack</h1>
                            <div className="text-2xl font-medium text-[var(--color-accent)] bg-black inline-block px-3 py-1 text-white">
                                ₹12,490.00
                            </div>
                        </div>

                        <p className="text-[var(--color-text-muted)] leading-relaxed">
                            Engineered for the modern workflow. The Minimal Tech Pack includes everything you need to stay productive on the go. Premium materials, durable construction, and a sleek aesthetic that fits any environment.
                        </p>

                        {/* Variants / Options would go here */}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[var(--color-border)]">
                            <div className="flex items-center border border-[var(--color-border)] w-fit">
                                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-4 hover:bg-gray-100 transition-colors">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-bold">{qty}</span>
                                <button onClick={() => setQty(qty + 1)} className="p-4 hover:bg-gray-100 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <button className="btn-primary flex-1">
                                Add to Cart - ₹{(12490 * qty).toLocaleString('en-IN')}
                            </button>
                            <button className="p-4 border border-[var(--color-border)] hover:bg-black hover:text-white transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                            {['Water Resistant', '5-Year Warranty', 'Eco-Friendly Materials', 'Priority Support'].map(feat => (
                                <div key={feat} className="flex items-center gap-2 text-sm font-medium">
                                    <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full"></span>
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Add to Cart */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50 flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold">₹{(12490 * qty).toLocaleString('en-IN')}</p>
                </div>
                <button className="btn-primary py-3 px-8 text-xs">Add to Cart</button>
            </div>
        </div>
    );
};

export default ProductPage;

