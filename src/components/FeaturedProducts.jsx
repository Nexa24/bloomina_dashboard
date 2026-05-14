import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { products } from '../data/products';

const FeaturedProducts = () => {

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="text-slate-400 font-bold tracking-widest text-xs uppercase mb-2 block">
                            Viral Hits
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">Trending Gadgets</h2>
                    </div>
                    <Link to="/shop" className="hidden md:flex items-center gap-2 font-bold text-slate-500 hover:text-[#1B4F9C] transition-colors pb-1">
                        View All Products
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {products.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Link to="/shop" className="inline-block bg-white border border-slate-200 text-slate-900 font-bold py-3 px-8 rounded-full shadow-sm hover:bg-gray-50 transition-colors w-full">
                        View All Products
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;

