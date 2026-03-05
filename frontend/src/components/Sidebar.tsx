import Link from 'next/link';
import { Home, List, Calendar, MessageSquare, TrendingUp, Settings, Search, Briefcase, DollarSign, Award, User, LogOut } from 'lucide-react';
import { useCurrency } from "@/context/CurrencyContext";

interface SidebarProps {
    role: 'client' | 'cleaner';
    activeTab: string;
    setActiveTab: (tab: string) => void;
    walletBalance?: number;
    userName?: string;
    userAvatar?: string;
}

export default function Sidebar({ role, activeTab, setActiveTab, walletBalance = 0, userName, userAvatar }: SidebarProps) {
    const { formatPrice } = useCurrency();

    // Common Styles
    const navButtonStyle = (tabName: string) => ({
        textAlign: 'left' as const,
        padding: '12px 16px',
        borderRadius: '12px',
        background: activeTab === tabName ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
        color: activeTab === tabName ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        border: 'none',
        fontWeight: activeTab === tabName ? '800' : '600',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '0.95rem',
        width: '100%',
        transition: 'all 0.2s'
    });

    return (
        <aside style={{ width: '280px', borderRight: '1px solid var(--color-border)', padding: '32px 24px', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', height: '100%', position: 'sticky', top: 80 }}>

            {/* 1. Profile Section (Identical Layout) */}
            <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eee', margin: '0 auto 16px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img src={userAvatar || (role === 'client' ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200" : "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=200")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '4px' }}>
                    {userName || (role === 'client' ? 'Host Admin' : 'Alex Cleaner')}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#777', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {role === 'client' ? <span style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '100px', color: '#166534', fontWeight: 'bold' }}>Superhost</span> : <span style={{ background: '#ecfdf5', padding: '4px 10px', borderRadius: '100px', color: '#166534', fontWeight: 'bold' }}>Top Rated</span>}
                </div>
            </div>

            {/* 2. Navigation (Role Specific) */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

                {role === 'client' ? (
                    /* Client / Host Links */
                    <>
                        <button onClick={() => setActiveTab('overview')} style={navButtonStyle('overview')}>
                            <Home size={20} /> Dashboards
                        </button>
                        <button onClick={() => setActiveTab('listings')} style={navButtonStyle('listings')}>
                            <List size={20} /> My Active Listings
                        </button>
                        <button onClick={() => setActiveTab('gigs_list')} style={navButtonStyle('gigs_list')}>
                            <Briefcase size={20} /> Gigs List
                        </button>
                        <button onClick={() => setActiveTab('calendar')} style={navButtonStyle('calendar')}>
                            <Calendar size={20} /> Schedule
                        </button>
                        <button onClick={() => setActiveTab('history')} style={navButtonStyle('history')}>
                            <TrendingUp size={20} /> History
                        </button>
                        <button onClick={() => setActiveTab('messages')} style={navButtonStyle('messages')}>
                            <MessageSquare size={20} /> Messages
                        </button>
                        <button onClick={() => setActiveTab('cleaners')} style={navButtonStyle('cleaners')}>
                            <Award size={20} /> KleanerZ List
                        </button>
                        <button onClick={() => setActiveTab('profile')} style={navButtonStyle('profile')}>
                            <User size={20} /> My Profile
                        </button>
                    </>
                ) : (
                    /* Cleaner / Provider Links */
                    <>
                        <button onClick={() => setActiveTab('overview')} style={navButtonStyle('overview')}>
                            <Home size={20} /> Dashboard
                        </button>
                        <button onClick={() => setActiveTab('my_jobs')} style={navButtonStyle('my_jobs')}>
                            <Briefcase size={20} /> My Jobs
                        </button>
                        <button onClick={() => setActiveTab('find_work')} style={navButtonStyle('find_work')}>
                            <List size={20} /> Gigs List
                        </button>
                        <button onClick={() => setActiveTab('calendar')} style={navButtonStyle('calendar')}>
                            <Calendar size={20} /> Schedule
                        </button>
                        <button onClick={() => setActiveTab('history')} style={navButtonStyle('history')}>
                            <TrendingUp size={20} /> History
                        </button>
                        <button onClick={() => setActiveTab('messages')} style={navButtonStyle('messages')}>
                            <MessageSquare size={20} /> Messages
                        </button>
                        <button onClick={() => setActiveTab('clients')} style={navButtonStyle('clients')}>
                            <Award size={20} /> ClientZ List
                        </button>
                        <button onClick={() => setActiveTab('profile')} style={navButtonStyle('profile')}>
                            <User size={20} /> My Profile
                        </button>
                    </>
                )}

                {/* Common Settings Link (Separator) */}
                <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0' }}></div>
                <button onClick={() => setActiveTab('settings')} style={navButtonStyle('settings')}>
                    <Settings size={20} /> Settings
                </button>
            </nav>

            {/* 3. Bottom Widget (Role Distinction) */}
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                {role === 'cleaner' ? (
                    // Role: Cleaner (Wallet Dark Mode)
                    <div style={{ background: '#0a3d2e', padding: '24px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: '#4ade80', borderRadius: '50%', opacity: 0.1 }}></div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>Available for Payout</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{formatPrice(walletBalance)}</div>
                        <button style={{ width: '100%', padding: '12px', marginTop: '16px', background: '#4ade80', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', color: '#064e3b' }}>Withdraw</button>
                    </div>
                ) : (
                    // Role: Client (Support / Plan Info)
                    <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: '800', marginBottom: '4px', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Pro Plan Active</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Your listings are boosted.</div>
                        <button style={{ width: '100%', padding: '10px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-text-main)' }}>Manage Plan</button>
                    </div>
                )}

                <div
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#999', fontSize: '0.9rem', padding: '16px 8px', marginTop: '8px', cursor: 'pointer' }}
                >
                    <LogOut size={16} /> Sign Out
                </div>
            </div>
        </aside>
    );
}
