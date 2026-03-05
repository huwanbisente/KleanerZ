import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from "@/context/ThemeContext";
import api from '@/utils/api';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // In a real app, this would be a real auth check. 
    // Checking for token to pretend we are logged in if one exists.
    const [isLoggedIn, setIsLoggedIn] = useState(typeof window !== 'undefined' ? !!localStorage.getItem('token') : false);

    useEffect(() => {
        if (isLoggedIn) {
            api.get("/auth/me")
                .then(res => setUser(res.data))
                .catch(() => setIsLoggedIn(false));
        }
    }, [isLoggedIn]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 0', background: 'var(--color-bg-main)', position: 'sticky', top: 0, zIndex: 1000 }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Slick Gen-Z Logo & Branding */}
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>

                    {/* The "K" Icon - Glassmorphic / Cyberpunk Emerald */}
                    <div style={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '1.4rem',
                        boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative'
                    }}>
                        K
                        {/* The "Shine" - pulsing dot */}
                        <div style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            width: 10,
                            height: 10,
                            background: '#fff',
                            borderRadius: '50%',
                            border: '2px solid var(--color-bg-main)',
                            boxShadow: '0 0 10px #fff'
                        }}></div>
                    </div>

                    {/* Typography - KLeanerZ (Technical Pro Style) */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            fontSize: '1.6rem',
                            fontWeight: '900',
                            color: 'var(--color-text-main)',
                            letterSpacing: '-0.05em',
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'baseline'
                        }}>
                            <span style={{ color: 'var(--color-primary)' }}>KL</span>
                            <span style={{ fontWeight: '700' }}>eaner</span>
                            <span style={{
                                color: 'var(--color-primary)',
                                position: 'relative',
                                paddingRight: '4px'
                            }}>
                                Z
                                {/* Subtlest indicator of speed/sparkle */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    width: '4px',
                                    height: '4px',
                                    background: 'var(--color-primary)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 8px var(--color-primary)'
                                }}></div>
                            </span>
                        </div>
                        <span style={{
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em',
                            color: 'var(--color-text-secondary)',
                            marginTop: '4px',
                            opacity: 0.6
                        }}>
                            MODERN CLEANING CULTURE
                        </span>
                    </div>
                </Link>

                {/* Modern Global Search */}
                <div style={{
                    display: 'flex',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '100px',
                    padding: '4px 4px 4px 20px',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '400px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'}>
                    <svg viewBox="0 0 32 32" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: '#9ca3af', strokeWidth: 4, overflow: 'visible' }}><path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path></svg>
                    <input
                        placeholder='Search "Sofa Shampooing" or "Deep Clean"...'
                        style={{
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: '0.9rem',
                            flex: 1,
                            fontWeight: '500',
                            color: 'var(--color-text-main)'
                        }}
                    />
                    <div style={{
                        background: 'var(--color-primary)',
                        padding: '8px 20px',
                        borderRadius: '100px',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#064e3b',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                        Search
                    </div>
                </div>

                {/* Right Links */}
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600' }}>

                    <Link href="#" style={{ color: 'var(--color-text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-primary-dark)'} onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Blogs</Link>
                    <Link href="#" style={{ color: 'var(--color-text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-primary-dark)'} onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Guides</Link>
                    <Link href="#" style={{ color: 'var(--color-text-secondary)', transition: 'color 0.2s' }} onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-primary-dark)'} onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Insurance</Link>
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <div
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                border: '1px solid var(--color-border)',
                                padding: '8px 14px',
                                borderRadius: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isMenuOpen ? 'var(--color-bg-secondary)' : 'var(--color-bg-main)'
                            }}
                            onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                            onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <svg viewBox="0 0 32 32" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'var(--color-text-secondary)', strokeWidth: 3 }}><g fill="none"><path d="M2 16h28M2 24h28M2 8h28"></path></g></svg>
                            <div style={{ width: '28px', height: '28px', background: '#9ca3af', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <svg viewBox="0 0 32 32" style={{ display: 'block', fill: 'currentColor', height: '18px', width: '18px' }}><path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.5 6.5 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4c-2.33 2.93-5.91 4.81-9.93 4.81z"></path></svg>
                                )}
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 12px)',
                                right: 0,
                                background: 'var(--color-bg-main)',
                                borderRadius: '16px',
                                boxShadow: 'var(--shadow-card)',
                                border: '1px solid var(--color-border)',
                                width: '240px',
                                padding: '8px 0',
                                zIndex: 1001,
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                {isLoggedIn ? (
                                    <Link href={user?.role === 'cleaner' ? "/dashboard/cleaner" : "/dashboard/client"} style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-main)', fontWeight: '700' }}>My Dashboard</Link>
                                ) : (
                                    <>
                                        <Link href="/login" style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-main)', fontWeight: '700' }}>Log in</Link>
                                        <Link href="/login" style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-secondary)' }}>Sign up</Link>
                                    </>
                                )}
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }}></div>
                                <div
                                    onClick={toggleTheme}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 20px',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>Dark Theme</span>
                                    <div style={{
                                        width: '40px',
                                        height: '20px',
                                        background: theme === 'dark' ? 'var(--color-primary)' : '#e5e7eb',
                                        borderRadius: '20px',
                                        position: 'relative',
                                        transition: 'all 0.3s'
                                    }}>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '2px',
                                            left: theme === 'dark' ? '22px' : '2px',
                                            transition: 'all 0.3s'
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }}></div>
                                <Link href="#" style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-secondary)' }}>KleanerZ Blog</Link>
                                <Link href="/login?role=cleaner" style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-secondary)' }}>Earn with KleanerZ</Link>
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }}></div>
                                <Link href="#" style={{ display: 'block', padding: '12px 20px', color: 'var(--color-text-secondary)' }}>Help Center</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
