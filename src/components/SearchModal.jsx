import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { products } from '../data/products';

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const inputRef = useRef(null);

    // Recent searches (mock data - would come from localStorage in production)
    const recentSearches = ['Headphones', 'Keyboard', 'Charger'];
    const popularCategories = ['Audio', 'Tech', 'Wearable', 'Accessories'];

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Filter products based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = products.filter(product =>
                product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5); // Limit to 5 results
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [searchQuery]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 md:pt-32">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search Modal */}
            <div className="relative w-full max-w-3xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Search Input */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <Search className="w-6 h-6 text-slate-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for products..."
                            className="flex-1 text-lg outline-none text-slate-900 placeholder-slate-400"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Search Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {searchQuery.trim() ? (
                        // Show search results
                        filteredProducts.length > 0 ? (
                            <div className="p-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                                    Products
                                </h3>
                                {filteredProducts.map((product) => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 truncate group-hover:text-[#1B4F9C] transition-colors">
                                                {product.title}
                                            </h4>
                                            <p className="text-sm text-slate-500">{product.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                                ₹{product.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
                                <p className="text-slate-500">Try searching for something else</p>
                            </div>
                        )
                    ) : (
                        // Show suggestions when search is empty
                        <div className="p-6 space-y-6">
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        <Clock className="w-4 h-4" />
                                        Recent Searches
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((search, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSearchQuery(search)}
                                                className="px-4 py-2 bg-gray-100 text-slate-700 rounded-full text-sm font-medium hover:bg-[#1B4F9C] hover:text-white transition-colors"
                                            >
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular Categories */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    <TrendingUp className="w-4 h-4" />
                                    Popular Categories
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {popularCategories.map((category, index) => (
                                        <Link
                                            key={index}
                                            to={`/category/${category}`}
                                            onClick={onClose}
                                            className="p-4 bg-gray-50 rounded-xl hover:bg-[#1B4F9C] hover:text-white transition-colors text-center font-bold text-slate-900 hover:shadow-lg group"
                                        >
                                            {category}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <Link
                                        to="/shop"
                                        onClick={onClose}
                                        className="text-slate-500 hover:text-[#1B4F9C] font-medium transition-colors"
                                    >
                                        View All Products
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <Link
                                        to="/shop"
                                        onClick={onClose}
                                        className="text-slate-500 hover:text-[#1B4F9C] font-medium transition-colors"
                                    >
                                        New Arrivals
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;

