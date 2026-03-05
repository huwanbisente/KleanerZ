import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Exchange Rates (Mock)
const RATES: Record<string, number> = {
    PHP: 1,
    USD: 0.017, // 1 PHP ~ 0.017 USD
    AUD: 0.026,
    CNY: 0.12,
    EUR: 0.016,
    GBP: 0.014
};

const SYMBOLS: Record<string, string> = {
    PHP: '₱',
    USD: '$',
    AUD: 'A$',
    CNY: '¥',
    EUR: '€',
    GBP: '£'
};

interface CurrencyContextType {
    currency: string;
    setCurrency: (c: string) => void;
    formatPrice: (amountInPhp: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState('PHP');

    // Persist preference
    useEffect(() => {
        const saved = localStorage.getItem('kleanerz_currency');
        if (saved && RATES[saved]) setCurrency(saved);
    }, []);

    const updateCurrency = (c: string) => {
        setCurrency(c);
        localStorage.setItem('kleanerz_currency', c);
    };

    const formatPrice = (amountInPhp: number) => {
        const rate = RATES[currency] || 1;
        const converted = amountInPhp * rate;

        // Formatting logic
        // If it's a whole number, don't show decimals, unless small
        const maximumFractionDigits = currency === 'PHP' ? 0 : 2;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: maximumFractionDigits
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
    return context;
};
