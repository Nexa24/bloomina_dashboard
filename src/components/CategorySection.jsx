import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const CategorySection = () => {
    const [showAll, setShowAll] = useState(false);

    const categories = [
        {
            id: 1,
            name: 'Apparel',
            slug: 'apparel',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771678373921_3d-casual-life-t-shirt-on-hanger-mockup.png',
            bgColor: 'bg-[#F0F4FC]',
            badge: '- 30%'
        },
        {
            id: 2,
            name: 'Footwear',
            slug: 'footwear',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771678380822_props-sneaker-shoe.png',
            bgColor: 'bg-[#FBF5F0]',
            badge: 'Trending'
        },
        {
            id: 3,
            name: 'Accessories',
            slug: 'accessories',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1770294357649_1a183abde3d12d95e5886ae7903cfed7-removebg-preview.png',
            bgColor: 'bg-[#F5F5F5]',
            badge: null
        },
        {
            id: 5,
            name: 'New Arrivals',
            slug: 'new-arrivals',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771744138942_3d-fluency-new.png',
            bgColor: 'bg-[#E8F5E9]',
            badge: 'Fresh'
        },
        {
            id: 6,
            name: 'Best Sellers',
            slug: 'best-sellers',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771743985961_3d-fluency-best-seller.png',
            bgColor: 'bg-[#FFF3E0]',
            badge: 'Top'
        },
        {
            id: 7,
            name: 'Recently Viewed',
            slug: 'recently-viewed',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771743890585_recent.png',
            bgColor: 'bg-[#F3E5F5]',
            badge: null
        },
        {
            id: 8,
            name: 'Audio',
            slug: 'audio',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771744138942_3d-fluency-new.png', // Reusing placeholder styling
            bgColor: 'bg-[#FFF0F0]',
            badge: null
        },
        {
            id: 9,
            name: 'Tech',
            slug: 'tech',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771743985961_3d-fluency-best-seller.png', // Reusing placeholder styling
            bgColor: 'bg-[#F0F8FF]',
            badge: null
        },
        {
            id: 10,
            name: 'Wearable',
            slug: 'wearable',
            image: 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771743890585_recent.png', // Reusing placeholder styling
            bgColor: 'bg-[#FFF8DC]',
            badge: null
        }
    ];

    const displayedCategories = showAll ? categories : categories.slice(0, 6);

    return (
        <section className="py-12 md:py-20 bg-white">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Explore popular categories</h2>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors bg-white border border-slate-200 hover:border-slate-300 py-1.5 px-3 md:py-2 md:px-4 rounded-full"
                    >
                        {showAll ? (
                            <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                            <>View more <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                    </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {displayedCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            className={`block relative group transition-all duration-300 transform hover:-translate-y-1.5 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 ${cat.bgColor} hover:shadow-lg`}
                        >
                            {/* Optional Badge */}
                            {cat.badge && (
                                <span className="absolute top-4 left-4 md:top-6 md:left-6 bg-slate-500 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full tracking-wider z-10 shadow-sm">
                                    {cat.badge}
                                </span>
                            )}

                            {/* Image Container */}
                            <div className="aspect-square flex items-center justify-center mb-2 md:mb-6 mt-6 md:mt-2">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-[85%] h-[85%] object-contain group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-md"
                                />
                            </div>

                            {/* Text */}
                            <h3 className="text-center text-xs md:text-sm font-bold text-slate-800 tracking-wide">
                                {cat.name}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;

