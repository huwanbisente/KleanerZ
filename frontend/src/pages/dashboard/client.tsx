import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic';
import api from "@/utils/api";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";
import { TrendingUp, MessageSquare, Settings, User, MapPin, Star, Mail, Phone, Calendar, Plus, Award } from "lucide-react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MapPreview = dynamic(() => import('@/components/MapPreview'), {
    ssr: false,
    loading: () => <div style={{ height: '250px', background: '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
});

export default function ClientDashboard() {
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [showPostModal, setShowPostModal] = useState(false);

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewQuest, setReviewQuest] = useState<{ id: number, title: string } | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

    const [myListings, setMyListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState<any>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: "",
        phone: "",
        bio: "",
        avatar_url: ""
    });

    // Messaging State
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentChat, setCurrentChat] = useState<any>(null); // Contains user info: { id, full_name }
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Directory State
    const [directoryResults, setDirectoryResults] = useState<any[]>([]);
    const [directoryQuery, setDirectoryQuery] = useState("");
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [allQuests, setAllQuests] = useState<any[]>([]);
    const [gigsSearch, setGigsSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put("/auth/me", profileData);
            setUser(res.data);
            setIsEditingProfile(false);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile");
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get("/auth/me");
            const userData = res.data;
            setUser(userData);
            setProfileData({
                full_name: userData.full_name || "",
                phone: userData.phone || "",
                bio: userData.bio || "",
                avatar_url: userData.avatar_url || ""
            });

            // Role Guard: If logged in as cleaner, send to cleaner dashboard
            if (userData.role === 'cleaner') {
                router.push("/dashboard/cleaner");
            }
        } catch (err) {
            // If not logged in, send to login
            router.push("/login?role=client");
        }
    };

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 2000,
        address_masked: "",
        address_exact: "123 Your St",
        latitude: 14.5995,
        longitude: 120.9842,
        scheduled_at: ""
    });

    const fetchListings = async () => {
        try {
            const res = await api.get("/quests/my-missions");
            setMyListings(res.data);
        } catch (err) {
            console.error("Failed to fetch listings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchListings();
    }, []);

    // Fetch conversations when tab is active
    useEffect(() => {
        if (activeTab === 'messages') {
            fetchConversations();
        }
        if (activeTab === 'cleaners') {
            fetchDirectory();
        }
        if (activeTab === 'gigs_list') {
            fetchAllQuests();
        }
    }, [activeTab]);

    const fetchAllQuests = async () => {
        try {
            const res = await api.get("/quests/");
            setAllQuests(res.data);
        } catch (err) {
            console.error("Failed to fetch all quests");
        }
    };

    const fetchDirectory = async (q = "") => {
        setDirectoryLoading(true);
        try {
            const res = await api.get(`/users/search?role=cleaner&query=${q || directoryQuery}`);
            setDirectoryResults(res.data);
        } catch (err) {
            console.error("Failed to fetch cleaners directory");
        } finally {
            setDirectoryLoading(false);
        }
    };

    // Fetch messages when chat is selected
    useEffect(() => {
        if (currentChat) {
            fetchMessages(currentChat.other_user_id || currentChat.id);
            // Poll for new messages every 3 seconds
            const interval = setInterval(() => {
                fetchMessages(currentChat.other_user_id || currentChat.id, true);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [currentChat]);

    const handleViewUserProfile = async (userId: number) => {
        try {
            const res = await api.get(`/users/${userId}`);
            setViewingUser(res.data);
            setIsProfileModalOpen(true);
        } catch (err) {
            console.error("Error fetching user profile:", err);
            alert("Failed to load user profile");
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get("/messages/inbox/conversations");
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        }
    };

    const fetchMessages = async (userId: number, background = false) => {
        try {
            const res = await api.get(`/messages/${userId}`);
            // If background, only update if length changed (simple check) or just update
            setMessages(res.data);
        } catch (err) {
            if (!background) console.error("Failed to fetch messages", err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessageText.trim() || !currentChat) return;
        try {
            await api.post("/messages/", {
                recipient_id: currentChat.other_user_id || currentChat.id,
                content: newMessageText
            });
            setNewMessageText("");
            fetchMessages(currentChat.other_user_id || currentChat.id);
            fetchConversations(); // Update list order/snippet
        } catch (err) {
            alert("Failed to send message");
        }
    };

    const handleSearchUsers = async () => {
        if (!searchQuery) return;
        try {
            const res = await api.get(`/users/search?role=cleaner&query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectCleaner = async (questId: number, cleanerId: number) => {
        try {
            await api.post(`/quests/${questId}/select/${cleanerId}`);
            alert("Cleaner Selected!");
            fetchListings();
        } catch (err) {
            console.error("Error selecting cleaner:", err);
            alert("Failed to select cleaner");
        }
    };

    const handleVerifyAddress = async () => {
        if (!formData.address_masked) {
            alert("Please type an address first");
            return;
        }
        setIsGeocoding(true);
        try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address_masked)}&limit=1`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
                const first = geoData[0];
                setFormData({
                    ...formData,
                    latitude: parseFloat(first.lat),
                    longitude: parseFloat(first.lon)
                });
            } else {
                alert("Address not found. Please be more specific.");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handlePostQuest = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.title || !formData.description || !formData.address_masked) {
            alert("Please fill in all required fields (Title, Description, Location)");
            return;
        }

        setIsGeocoding(true);
        try {
            // --- 1. Geocode the address using Nominatim (OSM) ---
            console.log("Geocoding address:", formData.address_masked);
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address_masked)}&limit=1`);
            const geoData = await geoRes.json();

            let finalFormData = { ...formData };

            if (geoData && geoData.length > 0) {
                const first = geoData[0];
                console.log("Geocode success:", first);
                finalFormData.latitude = parseFloat(first.lat);
                finalFormData.longitude = parseFloat(first.lon);
                // Optionally update address_masked to the clean OSM version
                // finalFormData.address_masked = first.display_name;
            } else {
                console.warn("Geocoding failed, using default coordinates");
                // We keep defaults but notify user
            }

            // --- 2. Post the job ---
            const payload = { ...finalFormData };
            if (!payload.scheduled_at) {
                // @ts-ignore
                payload.scheduled_at = null;
            }
            await api.post("/quests/", payload);
            alert("Job Listed Successfully!");
            setShowPostModal(false);

            // Reset form data
            setFormData({
                title: "",
                description: "",
                price: 2000,
                address_masked: "",
                address_exact: "123 Your St",
                latitude: 14.5995,
                longitude: 120.9842,
                scheduled_at: ""
            });
            fetchListings();
        } catch (err: any) {
            console.error("Error posting job:", err);
            const errorMessage = err.response?.data?.detail || err.message || "Unknown error";
            alert(`Failed to post job: ${errorMessage}`);
        } finally {
            setIsGeocoding(false);
        }
    };

    const pendingCount = myListings.filter(l => l.status === 'pending').length;
    const activeCount = myListings.filter(l => l.status === 'claimed' || l.status === 'in_progress').length;
    const completedCount = myListings.filter(l => l.status === 'completed').length;
    const totalSpent = myListings.filter(l => l.status === 'completed' || l.status === 'paid').reduce((acc, curr) => acc + curr.price, 0);

    const chartData = {
        labels: ['Pending', 'Active', 'Completed'],
        datasets: [
            {
                data: [pendingCount, activeCount, completedCount],
                backgroundColor: ['#fbbf24', '#3b82f6', '#4ade80'],
                borderWidth: 0,
                hoverOffset: 10
            },
        ],
    };

    return (
        <>
            <Head>
                <title>Host Dashboard | KleanerZ</title>
            </Head>
            <div className={`page`}>
                <Navbar />

                <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>

                    <Sidebar
                        role="client"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        userName={user?.full_name || (user?.email ? user.email.split('@')[0].split('.')[0].toUpperCase() : undefined)}
                        userAvatar={user?.avatar_url}
                    />

                    {/* Main Content Area */}
                    <main style={{ flex: 1, padding: '40px', background: 'var(--color-bg-secondary)', overflowY: 'auto' }}>

                        {activeTab === 'overview' && (
                            <>
                                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Dashboard Overview</h1>
                                        <p style={{ color: 'var(--color-text-secondary)' }}>Here's what's happening with your properties today.</p>
                                    </div>
                                    <button type="button" className="btn-primary" style={{ padding: '16px 32px' }} onClick={() => { console.log("Clicked Post Request"); setShowPostModal(true); }}>Post New Request</button>
                                </div>

                                {/* Top Operational Metrics Row */}
                                {/* Top Operational Metrics Row (Aligned with Layout) */}
                                {/* Main Layout Grid: 2 Columns */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>

                                    {/* Left Column: Operations Feed */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                        {/* Top Operational Metrics Row (Now inside Left Column) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                            <div className="card" style={{ padding: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', borderRadius: '24px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Total Invested <TrendingUp size={14} style={{ color: 'var(--color-success)' }} /></div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{formatPrice(totalSpent)}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: '600' }}>↑ 12% vs last month</div>
                                            </div>
                                            <div className="card" style={{ padding: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', borderRadius: '24px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Active Turnovers</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-secondary)' }}>{activeCount}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{pendingCount} waiting for pros</div>
                                            </div>
                                            <div className="card" style={{ padding: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', borderRadius: '24px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Quality Index</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-warning)' }}>4.92<span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>/5</span></div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Based on {completedCount} sessions</div>
                                            </div>
                                            <div className="card" style={{ padding: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', borderRadius: '24px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Response Time</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>14<span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>m</span></div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '4px', fontWeight: '600' }}>Faster than 85% of hosts</div>
                                            </div>
                                        </div>

                                        {/* Row: Operational Radar */}
                                        <div className="card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Operational Radar</h3>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <span style={{ padding: '4px 12px', background: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-success)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>TURNED OVER</span>
                                                    <span style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-secondary)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{activeCount} ACTIVE</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                                {myListings.length > 0 ? myListings.slice(0, 4).map(job => (
                                                    <div key={job.id} style={{ padding: '20px', background: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>{job.address_masked.split(',')[0]}</div>
                                                        <div style={{ fontWeight: '800', marginBottom: '12px', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{job.title}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.status === 'completed' ? 'var(--color-success)' : job.status === 'claimed' ? 'var(--color-primary)' : 'var(--color-warning)' }}></div>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: job.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                                                                {job.status.toUpperCase().replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No active properties.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row: Notifications / Pending Actions */}
                                        <div className="card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Notifications</h3>
                                                {(myListings.filter(l => l.status === 'pending_approval').length + myListings.filter(l => l.status === 'pending' && l.applications && l.applications.length > 0).length) > 0 && (
                                                    <span style={{ padding: '4px 12px', background: 'var(--color-danger)', color: 'white', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {myListings.filter(l => l.status === 'pending_approval').length + myListings.filter(l => l.status === 'pending' && l.applications && l.applications.length > 0).length} NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {/* 1. Payment / Approval Requests (High Priority) */}
                                                {myListings.filter(l => l.status === 'pending_approval').map(listing => (
                                                    <div key={listing.id} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                                                <Star size={20} fill="currentColor" />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Job Completed: {listing.title}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Work finished. Release payment to {listing.cleaner_name || 'pro'}.</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn-primary"
                                                            style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--color-success)' }}
                                                            onClick={async () => {
                                                                try {
                                                                    await api.put(`/quests/${listing.id}/approve`, {});
                                                                    fetchListings();
                                                                    setReviewQuest({ id: listing.id, title: listing.title });
                                                                    setShowReviewModal(true);
                                                                } catch (err) { alert("Error approving."); }
                                                            }}
                                                        >
                                                            Release Payment
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* 2. New Applicants */}
                                                {myListings.filter(l => l.status === 'pending' && l.applications && l.applications.length > 0).map(listing => (
                                                    <div key={`app-${listing.id}`} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                                                                <MessageSquare size={20} fill="currentColor" />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{listing.applications.length} New Applicant{listing.applications.length > 1 ? 's' : ''}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Pros are interested in: {listing.title}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn-outline"
                                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                                            onClick={() => setActiveTab('listings')}
                                                        >
                                                            Review Pros
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Empty State */}
                                                {(myListings.filter(l => l.status === 'pending_approval').length === 0 && myListings.filter(l => l.status === 'pending' && l.applications && l.applications.length > 0).length === 0) && (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                                        All caught up! No pending notifications.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row: Recent Activity */}
                                        <div className="card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-main)', marginBottom: '24px' }}>Recent Activity</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {myListings.slice(0, 5).map((listing, i) => (
                                                    <div key={listing.id} style={{ padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <div style={{ width: 40, height: 40, background: 'var(--color-bg-secondary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {listing.status === 'completed' ? <Star size={18} color="var(--color-warning)" /> : <TrendingUp size={18} color="var(--color-primary)" />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{listing.title}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{listing.address_masked} • {new Date(listing.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: listing.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{listing.status.toUpperCase()}</div>
                                                    </div>
                                                ))}
                                                {myListings.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>No activity yet.</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Insights Sidebar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                        {/* Level Up Hosting Card */}
                                        <div className="card" style={{ padding: '32px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Award color="#4ade80" size={24} />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-success)', fontWeight: 'bold' }}>GOLD TIER</div>
                                            </div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-main)' }}>Level Up Your Hosting</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>80% to Platinum Host Status</p>

                                            <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: '80%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{completedCount} / 20 Stays</span>
                                                <span>{Math.max(0, 20 - completedCount)} stays to go!</span>
                                            </div>

                                            <button style={{ width: '100%', marginTop: '24px', padding: '12px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                                View Rewards
                                            </button>
                                        </div>

                                        {/* Quick Rebook */}
                                        <div className="card" style={{ padding: '32px', borderRadius: '24px', border: 'none', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow-md)' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Quick Rebook</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {myListings.filter(l => l.status === 'completed').slice(0, 3).map(prev => (
                                                    <button
                                                        key={prev.id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, title: prev.title, description: prev.description, price: prev.price, address_masked: prev.address_masked, latitude: prev.latitude, longitude: prev.longitude });
                                                            setShowPostModal(true);
                                                        }}
                                                        style={{ textAlign: 'left', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>{prev.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{formatPrice(prev.price)} • Re-post</div>
                                                    </button>
                                                ))}
                                                {myListings.filter(l => l.status === 'completed').length === 0 && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Historical data pending.</div>
                                                )}
                                            </div>
                                            <button className="btn-outline" onClick={() => setActiveTab('listings')} style={{ width: '100%', fontSize: '0.85rem', marginTop: '8px' }}>Manage All Listings</button>
                                        </div>

                                        {/* Portfolio Distribution (Fixed Symmetry) */}
                                        <div className="card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: '100%', marginBottom: '24px' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-main)', textAlign: 'left' }}>Portfolio Health</h3>
                                            </div>
                                            <div style={{ width: '100%', maxWidth: '200px', margin: '0 auto 24px' }}>
                                                <Pie data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
                                            </div>
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {chartData.labels.map((label, i) => (
                                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: chartData.datasets[0].backgroundColor[i] }}></div>
                                                            <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                                                        </div>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{chartData.datasets[0].data[i]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'listings' && (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Active Listings</h1>
                                        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your current job postings.</p>
                                    </div>
                                    <button type="button" className="btn-primary" onClick={() => setShowPostModal(true)}>+ Post New Job</button>
                                </div>

                                <div className="card" style={{ border: 'none', padding: '0', overflow: 'hidden' }}>
                                    {myListings.length > 0 ? myListings.map(listing => (
                                        <div key={listing.id} style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '24px' }}>
                                            <div style={{ width: 120, height: 120, background: 'var(--color-bg-secondary)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                {listing.photos_initial && listing.photos_initial.length > 0 ? (
                                                    <img src={listing.photos_initial[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No Image</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{listing.title}</h3>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatPrice(listing.price)}</div>
                                                </div>
                                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>{listing.description}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {listing.address_masked}</span>
                                                    <span>•</span>
                                                    <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                                                    {listing.cleaner_name && (
                                                        <>
                                                            <span>•</span>
                                                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Assigned: {listing.cleaner_name}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Applicants Section */}
                                                {listing.status === 'pending' && listing.applications && listing.applications.length > 0 && (
                                                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-main)' }}>Applicants ({listing.applications.length})</h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                            {listing.applications.map((app: any) => (
                                                                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-main)', padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
                                                                    <div
                                                                        onClick={() => handleViewUserProfile(app.cleaner_id)}
                                                                        style={{ width: 24, height: 24, borderRadius: '50%', background: '#eee', overflow: 'hidden', cursor: 'pointer' }}
                                                                    >
                                                                        <img src={app.cleaner_avatar_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </div>
                                                                    <span
                                                                        onClick={() => handleViewUserProfile(app.cleaner_id)}
                                                                        style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
                                                                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                                                        onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
                                                                    >
                                                                        {app.cleaner_name}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}><Star size={12} fill="#f59e0b" /> {app.cleaner_rating.toFixed(1)}</span>
                                                                    <button
                                                                        onClick={() => handleSelectCleaner(listing.id, app.cleaner_id)}
                                                                        style={{ border: 'none', background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '4px' }}
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {listing.status === 'pending' && (!listing.applications || listing.applications.length === 0) && (
                                                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Waiting for applicants...</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', minWidth: '140px' }}>
                                                <div style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    textAlign: 'center',
                                                    background: listing.status === 'completed' ? 'rgba(74, 222, 128, 0.1)' : listing.status === 'pending_approval' ? 'rgba(251, 191, 36, 0.1)' : listing.status === 'claimed' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                    color: listing.status === 'completed' ? 'var(--color-primary)' : listing.status === 'pending_approval' ? 'var(--color-warning)' : listing.status === 'claimed' ? 'var(--color-secondary)' : 'var(--color-warning)',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {listing.status === 'pending_approval' ? 'Needs Approval' : listing.status === 'claimed' ? 'ACTIVE' : listing.status.replace('_', ' ')}
                                                </div>
                                                {listing.status === 'pending_approval' && (
                                                    <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => {
                                                        api.put(`/quests/${listing.id}/approve`, {}).then(() => {
                                                            alert("Approved!");
                                                            fetchListings();
                                                        });
                                                    }}>Approve</button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ marginBottom: '16px', fontSize: '1.2rem' }}>No active listings found.</div>
                                            <button className="btn-outline" onClick={() => setShowPostModal(true)}>Post your first job</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'cleaners' && (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>Cleaners Directory</h1>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            className="input-field"
                                            placeholder="Search by name, skills..."
                                            value={directoryQuery}
                                            onChange={e => setDirectoryQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && fetchDirectory()}
                                            style={{ width: '300px' }}
                                        />
                                        <button className="btn-primary" onClick={() => fetchDirectory()}>Search</button>
                                    </div>
                                </div>

                                {directoryLoading ? (
                                    <div style={{ textAlign: 'center', padding: '100px' }}>Loading cleaners...</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                        {directoryResults.map(cleaner => (
                                            <div key={cleaner.id} className="card" style={{ padding: '24px', border: 'none', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s' }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div
                                                        onClick={() => handleViewUserProfile(cleaner.id)}
                                                        style={{ width: 64, height: 64, borderRadius: '50%', background: '#eee', overflow: 'hidden', cursor: 'pointer' }}
                                                    >
                                                        <img src={cleaner.avatar_url || "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=200"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            onClick={() => handleViewUserProfile(cleaner.id)}
                                                            style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                                            onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
                                                        >
                                                            {cleaner.full_name}
                                                        </h3>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.9rem' }}>
                                                            <Star size={14} fill="#f59e0b" /> {cleaner.rating || 0.0} ({cleaner.reviews_count || 0})
                                                        </div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', flex: 1 }}>{cleaner.bio || "No bio provided."}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {cleaner.skills?.split(',').map((skill: string, i: number) => (
                                                        <span key={i} style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>{skill.trim()}</span>
                                                    ))}
                                                </div>
                                                <button
                                                    className="btn-outline"
                                                    style={{ width: '100%', marginTop: '8px' }}
                                                    onClick={() => {
                                                        setCurrentChat({ id: cleaner.id, full_name: cleaner.full_name, other_user_id: cleaner.id, other_user_avatar_url: cleaner.avatar_url });
                                                        setActiveTab('messages');
                                                    }}
                                                >
                                                    Message Cleaner
                                                </button>
                                            </div>
                                        ))}
                                        {directoryResults.length === 0 && (
                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#999' }}>No cleaners found. Try a different search!</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'gigs_list' && (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>Platform Gigs</h1>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            className="input-field"
                                            placeholder="Search all gigs..."
                                            value={gigsSearch}
                                            onChange={e => setGigsSearch(e.target.value)}
                                            style={{ width: '300px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                    {allQuests.filter(q => q.title.toLowerCase().includes(gigsSearch.toLowerCase())).map(quest => (
                                        <div key={quest.id} className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{quest.title}</h3>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatPrice(quest.price)}</span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', flex: 1 }}>{quest.description}</p>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} /> {quest.address_masked}
                                            </div>
                                            <div style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-text-main)' }}>
                                                Status: {quest.status.toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                                    {allQuests.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#999' }}>No gigs found on the platform.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'calendar' && (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Schedule & Bookings</h1>
                                    <button type="button" className="btn-primary" onClick={() => setShowPostModal(true)}>+ New Booking</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px' }}>
                                    <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', height: 'fit-content', background: 'var(--color-bg-main)' }}>
                                        <h3 style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-main)' }}>{selectedDate ? `Jobs on Feb ${selectedDate}` : 'Upcoming'}</h3>
                                        {myListings.filter(l => {
                                            if (selectedDate) {
                                                const d = new Date(l.scheduled_at || l.created_at);
                                                return d.getDate() === selectedDate && d.getMonth() === new Date().getMonth();
                                            }
                                            return l.status === 'pending' || l.status === 'claimed' || l.status === 'in_progress';
                                        }).map(job => (
                                            <div key={job.id} style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '12px', borderLeft: `4px solid ${job.status === 'pending' ? 'var(--color-warning)' : job.status === 'claimed' ? 'var(--color-primary)' : 'var(--color-success)'}` }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-text-main)' }}>{job.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(job.scheduled_at || job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span style={{ color: job.status === 'pending' ? 'var(--color-warning)' : job.status === 'claimed' ? 'var(--color-primary)' : 'var(--color-success)', fontWeight: 'bold' }}>{job.status === 'claimed' ? 'ACTIVE' : job.status.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {myListings.filter(l => {
                                            if (selectedDate) {
                                                const d = new Date(l.scheduled_at || l.created_at);
                                                return d.getDate() === selectedDate && d.getMonth() === new Date().getMonth();
                                            }
                                            return l.status === 'pending' || l.status === 'claimed' || l.status === 'in_progress';
                                        }).length === 0 && (
                                                <div style={{ color: '#999', fontStyle: 'italic', fontSize: '0.9rem' }}>No listings for this day.</div>
                                            )}
                                        {selectedDate && (
                                            <button onClick={() => setSelectedDate(null)} style={{ width: '100%', marginTop: '8px', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Show all upcoming →
                                            </button>
                                        )}
                                    </div>
                                    <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <h3 style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>&lt;</button>
                                                <button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>&gt;</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', textAlign: 'center' }}>
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                                <div key={d} style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                                            ))}
                                            {Array.from({ length: 30 }, (_, i) => {
                                                const day = i + 1;
                                                const isToday = day === new Date().getDate();
                                                const hasJob = myListings.some(l => {
                                                    const jobDate = new Date(l.scheduled_at || l.created_at);
                                                    return jobDate.getDate() === day && jobDate.getMonth() === new Date().getMonth();
                                                });

                                                return (
                                                    <div key={i}
                                                        onClick={() => setSelectedDate(day)}
                                                        style={{
                                                            aspectRatio: '1',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderRadius: '12px',
                                                            background: selectedDate === day ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                                            color: selectedDate === day ? 'white' : 'var(--color-text-main)',
                                                            position: 'relative',
                                                            cursor: 'pointer',
                                                            fontWeight: selectedDate === day ? 'bold' : '500',
                                                            transition: 'all 0.2s',
                                                            border: hasJob && selectedDate !== day ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                            boxShadow: selectedDate === day ? 'var(--shadow-md)' : 'none'
                                                        }}>
                                                        <span style={{ fontSize: '1rem' }}>{day}</span>
                                                        {hasJob && (
                                                            <div style={{
                                                                width: '4px',
                                                                height: '4px',
                                                                background: selectedDate === day ? 'white' : '#3b82f6',
                                                                borderRadius: '50%',
                                                                marginTop: '2px'
                                                            }}></div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', fontSize: '0.9rem', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <div style={{ width: 8, height: 8, background: 'var(--color-primary)', borderRadius: '50%' }}></div>
                                            <span>You have <strong>{myListings.filter(l => ['pending', 'claimed', 'in_progress', 'en_route', 'pending_approval'].includes(l.status)).length}</strong> active cleaning sessions this month.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
                                {/* Inbox List */}
                                <div style={{ background: 'var(--color-bg-main)', overflowY: 'auto' }}>
                                    <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Inbox</h2>
                                        <button onClick={() => setShowUserSearch(true)} style={{ background: 'var(--color-bg-secondary)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {conversations.length === 0 && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No messages yet. Start a chat!</div>
                                    )}
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.other_user_id}
                                            onClick={() => setCurrentChat({ id: conv.other_user_id, full_name: conv.other_user_name, other_user_id: conv.other_user_id, other_user_avatar_url: conv.other_user_avatar_url })}
                                            style={{
                                                padding: '20px',
                                                borderBottom: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                background: currentChat && (currentChat.other_user_id === conv.other_user_id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{conv.other_user_name || `User ${conv.other_user_id}`}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: conv.unread_count > 0 ? 'var(--color-text-main)' : 'var(--color-text-secondary)', fontWeight: conv.unread_count > 0 ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.last_message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Chat Area */}
                                <div style={{ background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
                                    {currentChat ? (
                                        <>
                                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                                                    <img src={currentChat.other_user_avatar_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{currentChat.full_name || currentChat.other_user_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ width: 8, height: 8, background: 'var(--color-success)', borderRadius: '50%' }}></div> Active Now
                                                    </div>
                                                </div>
                                                <Settings size={18} color="var(--color-text-secondary)" />
                                            </div>
                                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column-reverse' }}>
                                                {/* Messages are mapped normal order, but flex-col-reverse keeps scroll at bottom. Need to reverse array. */}
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {messages.map((msg, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                                                            marginBottom: '16px'
                                                        }}>
                                                            <div style={{
                                                                background: msg.sender_id === user.id ? 'var(--color-primary)' : 'var(--color-bg-main)',
                                                                color: msg.sender_id === user.id ? 'white' : 'var(--color-text-main)',
                                                                padding: '12px 16px',
                                                                borderRadius: msg.sender_id === user.id ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                                border: msg.sender_id === user.id ? 'none' : '1px solid var(--color-border)',
                                                                maxWidth: '70%'
                                                            }}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px', background: 'var(--color-bg-main)' }}>
                                                <input
                                                    placeholder="Type a message..."
                                                    value={newMessageText}
                                                    onChange={e => setNewMessageText(e.target.value)}
                                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)' }}
                                                />
                                                <button type="submit" className="btn-primary" style={{ borderRadius: '8px', padding: '0 20px' }}>Send</button>
                                            </form>
                                        </>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column', gap: '16px' }}>
                                            <MessageSquare size={48} opacity={0.2} />
                                            <div>Select a conversation or start a new one</div>
                                            <button className="btn-primary" onClick={() => setShowUserSearch(true)}>Start New Chat</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
                                {!isEditingProfile ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        {/* Profile Header */}
                                        <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '48px', background: 'var(--color-bg-main)', boxShadow: 'var(--shadow-lg)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'var(--color-bg-secondary)', margin: 0, overflow: 'hidden', border: '5px solid var(--color-bg-main)', boxShadow: 'var(--shadow-md)' }}>
                                                    <img src={user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--color-primary)', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                                                    <Star size={16} fill="white" />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>{user?.full_name || "New Host"}</h1>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                                                                <Star size={24} fill="var(--color-warning)" /> {user?.rating?.toFixed(1) || "5.0"}
                                                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>({user?.reviews_count || 0} reviews)</span>
                                                            </span>
                                                            <span>•</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={24} /> Metro Manila</span>
                                                            <span>•</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={24} /> {myListings.length} Jobs Posted</span>
                                                        </div>
                                                    </div>
                                                    <button className="btn-primary" onClick={() => setIsEditingProfile(true)} style={{ padding: '12px 32px', borderRadius: '12px', fontSize: '1rem' }}>Edit My Profile</button>
                                                </div>
                                                <div style={{ marginTop: '32px', display: 'flex', gap: '24px' }}>
                                                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-success)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>✓ Identity Verified</div>
                                                    {(user?.rating || 0) >= 4.5 && (
                                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>★ Superhost</div>
                                                    )}
                                                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--color-warning)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid rgba(251, 191, 36, 0.2)' }}>Payment Verified</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                {/* Left: About */}
                                                <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px', color: 'var(--color-text-main)' }}>About the Host</h3>
                                                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                                        {user?.bio || "No description provided yet. Add some details about your properties to attract top-rated cleaners!"}
                                                    </p>

                                                    <div style={{ marginTop: '40px' }}>
                                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-main)' }}>Property Preferences</h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                            {['Condo Cleaning', 'Airbnb Turnover', 'Deep Cleaning', 'Eco-friendly Products'].map(tag => (
                                                                <span key={tag} style={{ padding: '10px 18px', borderRadius: '25px', background: 'var(--color-bg-secondary)', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Contact & Quick Info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px', color: 'var(--color-text-main)' }}>Contact Information</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}><Mail size={20} /></div>
                                                            <div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email Address</div>
                                                                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--color-text-main)' }}>{user?.email}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}><Phone size={20} /></div>
                                                            <div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Phone Number</div>
                                                                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--color-text-main)' }}>{user?.phone || "Not provided"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card" style={{ padding: '40px', border: 'none', background: 'linear-gradient(135deg, var(--color-primary-dark, #166534) 0%, var(--color-primary) 100%)', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Host Status</h3>
                                                    <p style={{ opacity: 0.8, marginBottom: '32px' }}>Your activity summary</p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                        <div>
                                                            <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1 }}>{myListings.length}</div>
                                                            <div style={{ opacity: 0.8, marginTop: '8px' }}>Jobs Posted</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4.9 ★</div>
                                                            <div style={{ opacity: 0.8 }}>Average Rating</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                                            <button className="btn-outline" onClick={() => setIsEditingProfile(false)} style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>←</button>
                                            <h1 style={{ fontSize: '2.4rem', fontWeight: '900' }}>Edit Client Portfolio</h1>
                                        </div>

                                        <div className="card" style={{ padding: '40px', border: 'none' }}>
                                            <form onSubmit={handleUpdateProfile}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                    {/* Photo Upload Section */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                                        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-bg-main)', border: '2px solid var(--color-border)' }}>
                                                            <img src={profileData.avatar_url || user?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Profile Picture</h4>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            setProfileData({ ...profileData, avatar_url: reader.result as string });
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Full Name</label>
                                                        <input
                                                            className="input-field"
                                                            value={profileData.full_name}
                                                            onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                            placeholder="Maria Palad"
                                                            style={{ padding: '14px' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Phone Number</label>
                                                        <input
                                                            className="input-field"
                                                            value={profileData.phone}
                                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                                            placeholder="+63 9xx xxx xxxx"
                                                            style={{ padding: '14px' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Owner Bio / Description</label>
                                                        <textarea
                                                            className="input-field"
                                                            rows={6}
                                                            style={{ height: 'auto', padding: '14px', lineHeight: '1.6' }}
                                                            value={profileData.bio}
                                                            onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                                            placeholder="Tell cleaners about your properties and what you're looking for..."
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                                        <button type="submit" className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px' }}>Save Changes</button>
                                                        <button type="button" className="btn-outline" onClick={() => setIsEditingProfile(false)} style={{ border: 'none' }}>Cancel</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Job History</h1>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>A record of your completed cleaning jobs.</p>
                                <div className="card" style={{ padding: '0', border: 'none', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-bg-secondary)', textAlign: 'left' }}>
                                                <th style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Date</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Job Title</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Cleaner</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Amount</th>
                                                <th style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myListings.filter(l => l.status === 'completed' || l.status === 'paid').length > 0 ? (
                                                myListings.filter(l => l.status === 'completed' || l.status === 'paid').map(job => (
                                                    <tr key={job.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '16px 24px', color: 'var(--color-text-main)' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                                                        <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--color-text-main)' }}>{job.title}</td>
                                                        <td style={{ padding: '16px 24px' }}>Cleaner #{job.id}</td>
                                                        <td style={{ padding: '16px 24px' }}>{formatPrice(job.price)}</td>
                                                        <td style={{ padding: '16px 24px' }}>
                                                            <span style={{ background: '#e6f4ea', color: '#1e8e3e', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Completed</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No completed history yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div style={{ padding: '40px' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Account Settings</h1>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Manage your host account and security.</p>
                                <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-secondary)' }}>
                                    <Settings size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <p>Settings module coming soon.</p>
                                </div>
                            </div>
                        )}

                    </main>
                </div>

                {/* Post Request Modal */}
                {showPostModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div style={{ background: 'var(--color-bg-main)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}>
                            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Post cleaning request</h2>
                            <form onSubmit={handlePostQuest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <input className="input-field" placeholder="Job Title (e.g. 2BR Condo Clean)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                <textarea className="input-field" placeholder="Details (e.g. Bring own vacuum, focus on kitchen...)" rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                                <div style={{ margin: '8px 0' }}>
                                    <MapPreview lat={formData.latitude} lng={formData.longitude} />
                                    <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                                        Pin is currently at: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}.
                                        Enter an address below to update the pin.
                                    </p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Offer Price (PHP)</label>
                                        <input className="input-field" type="number" placeholder="Offer Price" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Schedule Date & Time</label>
                                        <input
                                            className="input-field"
                                            type="datetime-local"
                                            value={formData.scheduled_at}
                                            onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Location Address</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                                        <input
                                            className="input-field"
                                            placeholder="Type address..."
                                            value={formData.address_masked}
                                            onChange={e => setFormData({ ...formData, address_masked: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="btn-outline"
                                            onClick={handleVerifyAddress}
                                            disabled={isGeocoding}
                                            style={{ padding: '0 20px', borderRadius: '10px' }}
                                        >
                                            {isGeocoding ? 'Locating...' : 'Check Map'}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-outline" style={{ border: 'none' }} onClick={() => setShowPostModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isGeocoding}>
                                        {isGeocoding ? 'Locating...' : 'Post Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Search Modal */}
                {showUserSearch && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div style={{ background: 'var(--color-bg-main)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}>
                            <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)' }}>New Message</h2>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                                <input
                                    className="input-field"
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    // Trigger search on enter or typing
                                    onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                                />
                                <button className="btn-primary" onClick={handleSearchUsers}>Search</button>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, borderTop: '1px solid var(--color-border)' }}>
                                {searchResults.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            setCurrentChat({ id: u.id, full_name: u.full_name, other_user_id: u.id, other_user_name: u.full_name, other_user_avatar_url: u.avatar_url });
                                            setShowUserSearch(false);
                                            setMessages([]); // Clear previous chat
                                        }}
                                        style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                                            <img src={u.avatar_url || "https://via.placeholder.com/40"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{u.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.role}</div>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && searchQuery && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No users found.</div>
                                )}
                            </div>

                            <button className="btn-outline" style={{ marginTop: '16px', alignSelf: 'flex-end', border: 'none' }} onClick={() => setShowUserSearch(false)}>Close</button>
                        </div>
                    </div>
                )}

                {/* User Profile View Modal */}
                {isProfileModalOpen && viewingUser && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                        <div style={{ background: 'var(--color-bg-main)', width: '90%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', border: '1px solid var(--color-border)' }}>
                            {/* Close Button */}
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--color-bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'var(--color-text-main)' }}
                            >
                                ✕
                            </button>

                            {/* Modal Content */}
                            <div style={{ padding: '0' }}>
                                {/* Header / Cover Area */}
                                <div style={{ height: '120px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}></div>

                                <div style={{ padding: '0 32px 32px', marginTop: '-50px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '24px', border: '4px solid var(--color-bg-main)', overflow: 'hidden', background: 'var(--color-bg-secondary)' }}>
                                            <img src={viewingUser.avatar_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                setCurrentChat({ id: viewingUser.id, full_name: viewingUser.full_name, other_user_id: viewingUser.id, other_user_avatar_url: viewingUser.avatar_url });
                                                setActiveTab('messages');
                                                setIsProfileModalOpen(false);
                                            }}
                                            style={{ marginBottom: '10px' }}
                                        >
                                            Message
                                        </button>
                                    </div>

                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-main)' }}>{viewingUser.full_name}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                                            <Star size={18} fill="var(--color-warning)" /> {viewingUser.rating?.toFixed(1) || "0.0"}
                                        </span>
                                        <span>•</span>
                                        <span>Cleaner</span>
                                        <span>•</span>
                                        <span><MapPin size={16} style={{ display: 'inline', marginRight: '4px' }} /> Metro Manila</span>
                                    </div>

                                    <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem', color: 'var(--color-text-main)' }}>About</h4>
                                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                            {viewingUser.bio || "This cleaner hasn't added a bio yet."}
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Contact Info</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                    <Mail size={14} /> {viewingUser.email}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                    <Phone size={14} /> {viewingUser.phone || "Not public"}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Skills</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {(viewingUser.skills || "General Cleaning").split(',').map((s: string) => (
                                                    <span key={s} style={{ padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        {s.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && reviewQuest && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                        <div style={{ background: 'var(--color-bg-main)', borderRadius: '24px', padding: '32px', width: '400px', maxWidth: '90%', animation: 'fadeIn 0.2s', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)', textAlign: 'center' }}>Rate Your Pro</h2>
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>How did they do on <strong style={{ color: 'var(--color-text-main)' }}>{reviewQuest.title}</strong>?</p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={32}
                                        fill={star <= reviewRating ? "var(--color-warning)" : "none"}
                                        color={star <= reviewRating ? "var(--color-warning)" : "var(--color-border)"}
                                        style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                                        onClick={() => setReviewRating(star)}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </div>

                            <textarea
                                placeholder="What was the vibe? (Optional)"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                style={{ width: '100%', padding: '16px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '12px', color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '24px', minHeight: '100px', resize: 'vertical' }}
                            />

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReviewModal(false)}>Later</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
                                    try {
                                        await api.post(`/reviews/${reviewQuest.id}`, {
                                            rating: reviewRating,
                                            comment: reviewComment
                                        });
                                        alert("Review submitted! You're awesome.");
                                        setShowReviewModal(false);
                                        setReviewComment("");
                                        setReviewRating(5);
                                    } catch (err: any) {
                                        alert(err.response?.data?.detail || "Failed to submit review");
                                    }
                                }}>Submit Review</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
