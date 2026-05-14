import React from 'react';
import { Truck, Shield, Award, Headphones } from 'lucide-react';

const TrustItem = ({ icon: Icon, title, text }) => {
    return (
        <div className="text-center">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    <Icon className="w-10 h-10 md:w-12 md:h-12 text-slate-900" strokeWidth={1.5} />
                </div>
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">
                {title}
            </h3>
            <p className="text-sm md:text-base text-slate-500 font-medium">
                {text}
            </p>
        </div>
    );
};

const TrustBar = () => {
    const trustItems = [
        {
            icon: Truck,
            title: 'Fast Shipping',
            text: 'Free delivery on orders over ₹4,000'
        },
        {
            icon: Shield,
            title: 'Secure Payment',
            text: '100% payment protection'
        },
        {
            icon: Award,
            title: 'Premium Quality',
            text: 'Top-notch products guaranteed'
        },
        {
            icon: Headphones,
            title: '24/7 Support',
            text: 'Dedicated customer service'
        }
    ];

    return (
        <section className="py-16 md:py-20 bg-gray-50">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {trustItems.map((item, index) => (
                        <TrustItem key={index} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;

