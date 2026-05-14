import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
    const [compareItems, setCompareItems] = useState(() => {
        try {
            const stored = localStorage.getItem('Bloomina_compare');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading compare items:', error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('Bloomina_compare', JSON.stringify(compareItems));
    }, [compareItems]);

    const addToCompare = (product) => {
        setCompareItems(prev => {
            if (prev.find(item => item.id === product.id)) return prev;
            if (prev.length >= 4) {
                // Max 4 items, replace the oldest one or just remove it
                return [...prev.slice(1), product];
            }
            return [...prev, product];
        });
    };

    const removeFromCompare = (productId) => {
        setCompareItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearCompare = () => {
        setCompareItems([]);
    };

    const isInCompare = (productId) => {
        return compareItems.some(item => item.id === productId);
    };

    return (
        <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
            {children}
        </CompareContext.Provider>
    );
};

export const useCompare = () => useContext(CompareContext);

