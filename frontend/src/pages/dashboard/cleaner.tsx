import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic';
import api from "@/utils/api";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";
import { MapPin, Search, Grid, TrendingUp, CheckCircle, Clock, DollarSign, Calendar, Briefcase, Home, List, MessageSquare, Star, Mail, Phone, ChevronRight, Navigation, Zap, Award } from "lucide-react";
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MapPreview = dynamic(() => import('@/components/MapPreview'), {
    ssr: false,
    loading: () => <div style={{ height: '250px', background: 'var(--color-bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
});

interface Quest {
    id: number;
    title: string;
    price: number;
    address_masked: string;
    description: string;
    latitude: number;
    longitude: number;
    photos_initial: string[];
    status: string;
    created_at: string;
    scheduled_at?: string;
    client_id: number;
}

export default function CleanerDashboard() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [myJobs, setMyJobs] = useState<Quest[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState("");
    const [user, setUser] = useState<any>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null); // For detailed view

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewQuest, setReviewQuest] = useState<{ id: number, title: string } | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

    const [profileData, setProfileData] = useState({
        full_name: "",
        phone: "",
        bio: "",
        skills: "",
        equipment: "",
        languages: "",
        avatar_url: ""
    });

    // Messaging State
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentChat, setCurrentChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Directory State
    const [directoryResults, setDirectoryResults] = useState<any[]>([]);
    const [directoryQuery, setDirectoryQuery] = useState("");
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const { formatPrice } = useCurrency();
    const router = useRouter();

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
                skills: userData.skills || "",
                equipment: userData.equipment || "",
                languages: userData.languages || "",
                avatar_url: userData.avatar_url || ""
            });

            // Role Guard: If logged in as client, send to client dashboard
            if (userData.role === 'client') {
                router.push("/dashboard/client");
            }
        } catch (err) {
            // If not logged in, send to login
            router.push("/login?role=cleaner");
        }
    };

    const fetchQuests = async () => {
        try {
            const res = await api.get("/quests/");
            setQuests(res.data);
        } catch (err) { }
    };

    const fetchMyJobs = async () => {
        try {
            const res = await api.get("/quests/my-missions");
            setMyJobs(res.data);
        } catch (err) { }
    };

    useEffect(() => {
        fetchProfile();
        fetchQuests();
        fetchMyJobs();

        // WebSocket Connection for "The Pulse"
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/quest-board");

        ws.onopen = () => {
            console.log("Connected to The Pulse (Quest Board)");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "NEW_QUEST") {
                    // Play notification sound
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.play().catch(e => console.log("Audio play failed (user interaction needed)"));

                    // Add new quest to list instantly
                    // We use functional state update to ensure we have latest
                    const newQuest = { ...data.quest, status: 'pending', created_at: new Date().toISOString() };
                    setQuests(prev => [newQuest, ...prev]);

                    // Optional: Show a UI toast
                    // alert(`New Quest Available: ${newQuest.title}`); 
                }
            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    // Messaging Logic
    useEffect(() => {
        if (activeTab === 'messages') {
            fetchConversations();
        }
        if (activeTab === 'clients') {
            fetchDirectory();
        }
    }, [activeTab]);

    const fetchDirectory = async (q = "") => {
        setDirectoryLoading(true);
        try {
            const res = await api.get(`/users/search?role=client&query=${q || directoryQuery}`);
            setDirectoryResults(res.data);
        } catch (err) {
            console.error("Failed to fetch clients directory");
        } finally {
            setDirectoryLoading(false);
        }
    };

    useEffect(() => {
        if (currentChat) {
            fetchMessages(currentChat.other_user_id || currentChat.id);
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
            fetchConversations();
        } catch (err) {
            alert("Failed to send message: " + err);
        }
    };

    const handleSearchUsers = async () => {
        if (!searchQuery) return;
        try {
            // Cleaners search for clients
            const res = await api.get(`/users/search?role=client&query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Also re-fetch when switching to Find Work or My Jobs
    useEffect(() => {
        if (activeTab === 'find_work') fetchQuests();
        if (activeTab === 'my_jobs') fetchMyJobs();
    }, [activeTab]);

    // Calculate wallet from completed jobs
    const wallet = myJobs
        .filter(job => job.status === 'completed')
        .reduce((sum, job) => sum + job.price, 0);

    // Calculate real stats
    const completedJobsCount = myJobs.filter(job => job.status === 'completed').length;
    const activeJobsCount = myJobs.filter(job => job.status === 'claimed' || job.status === 'in_progress').length;

    const handleApply = async (id: number) => {
        try {
            await api.post(`/quests/${id}/apply`, {});
            alert("Application submitted! The client will review your profile.");
            fetchQuests();
            fetchMyJobs();
        } catch (err: any) {
            console.error("Error applying for job:", err);
            const errorMessage = err.response?.data?.detail || err.message || "Unknown error";
            alert(`Failed to apply: ${errorMessage}`);
        }
    };

    const nextMission = useMemo(() => {
        const active = myJobs.filter(j => ['claimed', 'in_progress', 'en_route'].includes(j.status));
        if (active.length === 0) return null;
        return [...active].sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0];
    }, [myJobs]);

    const filteredQuests = quests.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mock Data for Charts
    const earningsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Monthly Earnings ($)',
                data: [800, 950, 1100, 1050, 1300, 1250],
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#16a34a',
                pointRadius: 6,
                pointHoverRadius: 8
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return (
        <>
            <Head>
                <title>Provider Dashboard | KleanerZ</title>
            </Head>
            <div className={`page`}>
                <Navbar />

                <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>

                    <Sidebar
                        role="cleaner"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        walletBalance={wallet}
                        userName={user?.full_name || (user?.email ? user.email.split('@')[0].split('.')[0].toUpperCase() : undefined)}
                        userAvatar={user?.avatar_url}
                    />

                    {/* Main Content */}
                    <main style={{ flex: 1, background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        {activeTab === 'overview' && (
                            <div style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
                                <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                                    <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Mission Command Center</h1>
                                            <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, {user?.full_name?.split(' ')[0] || 'Professional'}. Here's your mission status.</p>
                                        </div>
                                        <button className="btn-primary" onClick={() => setActiveTab('find_work')}>Find New Work</button>
                                    </div>

                                    {/* Mission Command Center Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                            {/* Top Specific Metrics Row (Moved to Very Top) */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                                <div className="card" style={{ padding: '20px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Total Payouts</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{formatPrice(wallet)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '4px' }}>↑ 3 transactions pending</div>
                                                </div>
                                                <div className="card" style={{ padding: '20px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Jobs Done</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{completedJobsCount}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '4px' }}>Top 5% in your area</div>
                                                </div>
                                                <div className="card" style={{ padding: '20px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Active Gigs</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{activeJobsCount}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', marginTop: '4px' }}>Keep it up!</div>
                                                </div>
                                                <div className="card" style={{ padding: '20px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>Success Rate</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>98.2%</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '4px' }}>Excellent</div>
                                                </div>
                                            </div>

                                            {/* Next Mission Hero Card */}
                                            <div className="card" style={{ padding: '32px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px 24px', background: 'var(--color-primary)', color: '#064e3b', fontWeight: '900', fontSize: '0.8rem', borderBottomLeftRadius: '20px', zIndex: 2 }}>
                                                    NEXT MISSION
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                                                    <div>
                                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px', color: 'var(--color-text-main)' }}>
                                                            {nextMission ? nextMission.title : "No active missions"}
                                                        </h2>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <Clock size={18} color="var(--color-primary)" />
                                                                <span style={{ fontWeight: '600' }}>
                                                                    {nextMission?.scheduled_at ? new Date(nextMission.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <MapPin size={18} color="var(--color-primary)" />
                                                                <span>{nextMission ? nextMission.address_masked : "Set your status to online"}</span>
                                                            </div>
                                                        </div>

                                                        {nextMission ? (
                                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                                <button className="btn-primary" style={{ flex: 1 }}>
                                                                    <Navigation size={18} style={{ marginRight: '8px' }} /> Get Directions
                                                                </button>
                                                                <button className="btn-outline" onClick={() => { setSelectedQuest(nextMission); setActiveTab('my_jobs'); }} style={{ flex: 1 }}>
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-primary" onClick={() => setActiveTab('find_work')}>
                                                                Find New Work
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                        <MapPreview
                                                            lat={nextMission?.latitude || 14.5995}
                                                            lng={nextMission?.longitude || 120.9842}
                                                            zoom={15}
                                                        />
                                                    </div>
                                                </div>
                                            </div>



                                            {/* Notifications / Actions (Moved to Left Column to match Client Layout) */}
                                            <div className="card" style={{ padding: '24px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)' }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--color-text-main)' }}>Notifications</h3>

                                                {/* Pending Actions Feed */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {(myJobs.filter(j => j.status === 'completed' || j.status === 'pending_approval').length === 0) ? (
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No new notifications.</p>
                                                    ) : (
                                                        myJobs.filter(j => j.status === 'completed').map(job => (
                                                            <div key={job.id} style={{ fontSize: '0.85rem', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>
                                                                <strong>Payment Pending:</strong> {job.title} is completed. Waiting for client release.
                                                            </div>
                                                        ))
                                                    )}
                                                    {myJobs.filter(j => j.status === 'pending_approval').map(job => (
                                                        <div key={job.id} style={{ fontSize: '0.85rem', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)', color: 'var(--color-warning)' }}>
                                                            <strong>Approval Pending:</strong> You submitted {job.title}. Waiting for client.
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Nearby Opportunities Heatmap Preview */}
                                            <div className="card" style={{ padding: '24px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                    <div>
                                                        <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Demand Heatmap</h3>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Current high-demand areas for cleaning services</p>
                                                    </div>
                                                    <button onClick={() => setActiveTab('find_work')} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer' }}>View All Jobs →</button>
                                                </div>
                                                <div style={{ height: '300px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                                                    <MapPreview
                                                        lat={14.5995}
                                                        lng={120.9842}
                                                        zoom={12}
                                                    />
                                                    {/* Heatmap Layer Mockup */}
                                                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 40% 50%, rgba(74, 222, 128, 0.2) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(74, 222, 128, 0.15) 0%, transparent 40%)' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                            {/* Notifications Section (Moved to Top Right to match typical "Overview" panel, or actually top of Right Col usually acts as status) 
                                                Wait, if I move it to Left Column, I need to see where to put it. 
                                                Let's stick to the User's "Lower Right" request for Tips, and "Same Area" for Notifications.
                                                If Client has it in Left Column, let's put it in Left Column for Cleaner too.
                                            */}

                                            {/* Professional Level Up Card */}
                                            <div className="card" style={{ padding: '32px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Award color="#4ade80" size={24} />
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-success)', fontWeight: 'bold' }}>GOLD TIER</div>
                                                </div>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-main)' }}>Level Up Your Career</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>80% to Platinum Professional Status</p>

                                                <div style={{ height: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: '80%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                                                </div>

                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>12 / 15 Jobs Done</span>
                                                    <span>3 jobs to go!</span>
                                                </div>

                                                <button style={{ width: '100%', marginTop: '24px', padding: '12px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                                    Unlock Reward Perks
                                                </button>
                                            </div>

                                            {/* Review High-Fives */}
                                            <div className="card" style={{ padding: '24px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Zap color="var(--color-primary)" size={20} />
                                                    </div>
                                                    <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Recent High-Fives</h3>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    {[
                                                        { name: "Mike S.", comment: "Karina was incredibly fast and thorough!", rating: 5 },
                                                        { name: "Sarah J.", comment: "Best cleaning service in Manila so far.", rating: 5 },
                                                        { name: "David L.", comment: "Very professional and punctual.", rating: 5 }
                                                    ].map((rev, i) => (
                                                        <div key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid var(--color-border)', paddingBottom: '16px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{rev.name}</span>
                                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                                    {[...Array(5)].map((_, j) => <Star key={j} size={10} fill="var(--color-warning)" color="var(--color-warning)" />)}
                                                                </div>
                                                            </div>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{rev.comment}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Earnings Pulse Chart (Moved to Sidebar) */}
                                            <div className="card" style={{ padding: '24px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                    <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Earnings Pulse</h3>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold' }}>+12.5%</span>
                                                </div>
                                                <div style={{ height: '150px' }}>
                                                    <Line
                                                        data={{
                                                            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                                                            datasets: [{
                                                                label: 'Earnings',
                                                                data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
                                                                fill: true,
                                                                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                                                borderColor: '#4ade80',
                                                                tension: 0.4,
                                                                pointRadius: 0
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { display: false } },
                                                            scales: {
                                                                x: { display: false },
                                                                y: { display: false }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Professional Tips (Restored & Enhanced) */}
                                            <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <MessageSquare color="var(--color-secondary)" size={20} />
                                                    <div style={{ color: 'var(--color-text-main)', fontSize: '0.85rem' }}>
                                                        <strong style={{ display: 'block', marginBottom: '4px' }}>Pro Tip:</strong>
                                                        Bringing your own micro-fiber cloths increases your average rating by 15%!
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'find_work' && (
                            <div style={{ padding: '32px', height: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>

                                    {/* Header & Stats Row */}
                                    <div style={{ flexShrink: 0, marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <div>
                                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Find Work</h1>
                                                <p style={{ color: 'var(--color-text-secondary)' }}>{filteredQuests.length} opportunities nearby</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px' }}>
                                                {/* Mini Stats */}
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #eee' }}>
                                                    <div style={{ width: 10, height: 10, background: '#45a353', borderRadius: '50%' }}></div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Online</span>
                                                </div>
                                                <button
                                                    onClick={() => fetchQuests()}
                                                    style={{ background: 'white', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    🔄 Refresh
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search Bar */}
                                        <div style={{ display: 'flex', gap: '12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                                            <Search color="var(--color-text-secondary)" />
                                            <input style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', color: 'var(--color-text-main)' }} placeholder="Search for jobs (e.g. Condo, Deep Clean)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                            <button className="btn-primary" style={{ padding: '8px 24px' }}>Filter</button>
                                        </div>
                                    </div>

                                    {/* Split View Content */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '24px', flex: 1, overflow: 'hidden' }}>

                                        {/* Left: Scrollable Job List */}
                                        <div style={{ overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
                                            {filteredQuests.length > 0 ? (
                                                filteredQuests.map(quest => (
                                                    <div
                                                        key={quest.id}
                                                        onClick={() => setSelectedQuest(quest)}
                                                        className="card"
                                                        style={{
                                                            padding: '20px',
                                                            display: 'flex',
                                                            gap: '16px',
                                                            cursor: 'pointer',
                                                            border: selectedQuest?.id === quest.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                            background: selectedQuest?.id === quest.id ? 'rgba(74, 222, 128, 0.05)' : 'var(--color-bg-main)'
                                                        }}
                                                    >
                                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `hsl(${quest.id * 50}, 70%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                                            🏠
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <h3 style={{ fontWeight: 'bold', fontSize: '1rem', margin: 0, color: 'var(--color-text-main)' }}>{quest.title}</h3>
                                                                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-primary)' }}>{formatPrice(quest.price)}</span>
                                                            </div>
                                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                                                                {quest.address_masked}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                <span style={{ background: '#eee', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>Deep Clean</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '40px', textAlign: 'center', color: '#717171' }}>
                                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                                                    <p>No jobs found.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Sticky Details Panel */}
                                        <div className="card" style={{ padding: '0', border: '1px solid var(--color-border)', height: '100%', overflowY: 'auto', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
                                            {selectedQuest ? (
                                                <>
                                                    {/* Map Placeholder */}
                                                    <div style={{ height: '250px', background: '#e0e0e0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#717171' }}>
                                                            <MapPin size={48} style={{ marginBottom: '8px' }} />
                                                            <span style={{ fontWeight: 'bold' }}>Map View</span>
                                                            <span style={{ fontSize: '0.8rem' }}>{selectedQuest.address_masked}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '32px', flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                                                            <div>
                                                                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>{selectedQuest.title}</h1>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> Est. 4 Hours</div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={18} fill="var(--color-warning)" color="var(--color-warning)" /> 5.0 (Client)</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{formatPrice(selectedQuest.price)}</div>
                                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Fixed Price</div>
                                                            </div>
                                                        </div>

                                                        <div style={{ marginBottom: '32px' }}>
                                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-main)' }}>About the Job</h3>
                                                            <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
                                                                {selectedQuest.description}
                                                            </p>
                                                        </div>

                                                        <div style={{ marginBottom: '32px' }}>
                                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>Requirements</h3>
                                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                                {['Bring own supplies', 'Pet friendly', 'Non-smoker', 'Vaccinated'].map(req => (
                                                                    <span key={req} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '0.9rem', color: '#555' }}>{req}</span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px' }}>
                                                            <button className="btn-primary" onClick={() => handleApply(selectedQuest.id)} style={{ flex: 2, padding: '16px', fontSize: '1.1rem' }}>Apply for Job</button>
                                                            <button
                                                                onClick={() => {
                                                                    setCurrentChat({ id: selectedQuest.client_id, full_name: "Client", other_user_id: selectedQuest.client_id, other_user_avatar_url: null });
                                                                    setActiveTab('messages');
                                                                }}
                                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-text-main)' }}
                                                            >
                                                                Message
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999' }}>
                                                    <div style={{ fontSize: '4rem', marginBottom: '24px' }}>👈</div>
                                                    <h3>Select a job to view details</h3>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Jobs Tab - Claimed and Completed Jobs */}
                        {activeTab === 'my_jobs' && (
                            <div style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
                                <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>My Jobs</h2>

                                    {myJobs.length === 0 ? (
                                        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                                            <p style={{ color: '#999', fontSize: '1.1rem' }}>You haven't claimed any jobs yet.</p>
                                            <button
                                                className="btn-primary"
                                                style={{ marginTop: '20px' }}
                                                onClick={() => setActiveTab('find_work')}
                                            >
                                                Find Work
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '24px' }}>
                                            {myJobs.map(job => (
                                                <div key={job.id} className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <div style={{ display: 'flex', gap: '20px' }}>
                                                        {/* Job Image */}
                                                        <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-secondary)' }}>
                                                            {job.photos_initial && job.photos_initial.length > 0 && (
                                                                <img
                                                                    src={job.photos_initial[0]}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    alt={job.title}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Job Details */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                                <div>
                                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-main)' }}>{job.title}</h3>
                                                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                                                        <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                                        {job.address_masked}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                                        {formatPrice(job.price)}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '0.75rem',
                                                                        padding: '4px 12px',
                                                                        borderRadius: '12px',
                                                                        marginTop: '8px',
                                                                        background: job.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : job.status === 'pending_approval' ? 'rgba(245, 158, 11, 0.1)' : job.status === 'claimed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                                        color: job.status === 'completed' ? 'var(--color-success)' : job.status === 'pending_approval' ? 'var(--color-warning)' : job.status === 'claimed' ? 'var(--color-primary)' : 'var(--color-warning)',
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        {job.status === 'claimed' ? 'Active' : job.status === 'pending_approval' ? 'Awaiting Application' : job.status.replace('_', ' ')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                                                {job.description}
                                                            </p>

                                                            {job.status === 'claimed' && (
                                                                <button
                                                                    className="btn-primary"
                                                                    style={{ padding: '10px 24px' }}
                                                                    onClick={async () => {
                                                                        try {
                                                                            await api.put(`/quests/${job.id}/complete`, {
                                                                                photos_before: ["https://images.unsplash.com/photo-1581578731117-104f2a41272c"],
                                                                                photos_after: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f"]
                                                                            });
                                                                            alert("Job marked as complete!");
                                                                            fetchMyJobs();
                                                                        } catch (err) {
                                                                            alert("Failed to complete job.");
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckCircle size={16} style={{ marginRight: '8px', display: 'inline' }} />
                                                                    Mark as Complete
                                                                </button>
                                                            )}

                                                            {job.status === 'pending_approval' && (
                                                                <div style={{
                                                                    padding: '12px',
                                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                                    borderRadius: '8px',
                                                                    color: 'var(--color-warning)',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid rgba(245, 158, 11, 0.2)'
                                                                }}>
                                                                    <Clock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                                                    Waiting for client approval...
                                                                </div>
                                                            )}

                                                            {job.status === 'completed' && (
                                                                <div style={{
                                                                    padding: '12px',
                                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                                    borderRadius: '8px',
                                                                    color: 'var(--color-success)',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid rgba(34, 197, 94, 0.2)'
                                                                }}>
                                                                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                                                    Job approved! Payment processed.
                                                                </div>
                                                            )}

                                                            {(job.status === 'pending' || job.status === 'paid') && (
                                                                <div style={{
                                                                    padding: '12px',
                                                                    background: 'rgba(251, 191, 36, 0.1)',
                                                                    borderRadius: '8px',
                                                                    color: 'var(--color-warning)',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid rgba(251, 191, 36, 0.2)'
                                                                }}>
                                                                    <Clock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                                                    Waiting for payment release
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Earnings History</h1>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Track your cleaning income and payouts.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                                    <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Earnings</div>
                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{formatPrice(wallet)}</div>
                                    </div>
                                    <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Jobs Completed</div>
                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-main)' }}>{completedJobsCount}</div>
                                    </div>
                                    <div className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Active Missions</div>
                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{activeJobsCount}</div>
                                    </div>
                                </div>

                                <h3 style={{ marginBottom: '24px', color: 'var(--color-text-main)' }}>Transaction History</h3>
                                <div className="card" style={{ padding: '0', border: '1px solid var(--color-border)', overflow: 'hidden', background: 'var(--color-bg-main)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'var(--color-bg-secondary)' }}>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Date</th>
                                                <th style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Job Title</th>
                                                <th style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Status</th>
                                                <th style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myJobs.filter(j => j.status === 'completed').map(job => (
                                                <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{job.title}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(34, 197, 94, 0.2)' }}>PAID</span>
                                                        <button
                                                            style={{ marginLeft: '12px', background: 'var(--color-bg-secondary)', border: 'none', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}
                                                            onClick={() => {
                                                                setReviewQuest({ id: job.id, title: job.title });
                                                                setShowReviewModal(true);
                                                            }}
                                                        >
                                                            Rate Client
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: '800', textAlign: 'right', color: 'var(--color-primary)' }}>{formatPrice(job.price)}</td>
                                                </tr>
                                            ))}
                                            {myJobs.filter(j => j.status === 'completed').length === 0 && (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No completed jobs yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
                                            <Search size={16} />+
                                        </button>
                                    </div>
                                    {conversations.length === 0 && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No messages yet. Direct message clients to ask questions!</div>
                                    )}
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.other_user_id}
                                            onClick={() => setCurrentChat({ id: conv.other_user_id, full_name: conv.other_user_name, other_user_id: conv.other_user_id, other_user_avatar_url: conv.other_user_avatar_url })}
                                            style={{
                                                padding: '20px',
                                                borderBottom: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                background: currentChat && (currentChat.other_user_id === conv.other_user_id) ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{conv.other_user_name || `User ${conv.other_user_id}`}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: conv.unread_count > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: conv.unread_count > 0 ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.last_message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Chat Area */}
                                <div style={{ background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
                                    {currentChat ? (
                                        <>
                                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                                                    <img src={currentChat.other_user_avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{currentChat.full_name || currentChat.other_user_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ width: 8, height: 8, background: '#45a353', borderRadius: '50%' }}></div> Active Now
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'var(--color-bg-secondary)', borderRadius: '12px', color: 'var(--color-text-secondary)' }}>Client</div>
                                            </div>
                                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column-reverse' }}>
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
                                            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                                                <input
                                                    placeholder="Type a message..."
                                                    value={newMessageText}
                                                    onChange={e => setNewMessageText(e.target.value)}
                                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-bg-secondary)', color: 'var(--color-text-main)' }}
                                                />
                                                <button type="submit" className="btn-primary" style={{ borderRadius: '8px', padding: '0 20px', background: '#45a353' }}>Send</button>
                                            </form>
                                        </>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column', gap: '16px' }}>
                                            <MessageSquare size={48} opacity={0.2} />
                                            <div>Select a conversation or start a new one to contact a client</div>
                                            <button className="btn-primary" onClick={() => setShowUserSearch(true)} style={{ background: '#45a353' }}>Find Client</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'clients' && (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>Clients Directory</h1>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            className="input-field"
                                            placeholder="Search clients..."
                                            value={directoryQuery}
                                            onChange={e => setDirectoryQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && fetchDirectory()}
                                            style={{ width: '300px' }}
                                        />
                                        <button className="btn-primary" onClick={() => fetchDirectory()} style={{ background: 'var(--color-primary)' }}>Search</button>
                                    </div>
                                </div>

                                {directoryLoading ? (
                                    <div style={{ textAlign: 'center', padding: '100px' }}>Loading clients...</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                        {directoryResults.map(client => (
                                            <div key={client.id} className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-bg-main)' }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div
                                                        onClick={() => handleViewUserProfile(client.id)}
                                                        style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-secondary)', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--color-border)' }}
                                                    >
                                                        <img src={client.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            onClick={() => handleViewUserProfile(client.id)}
                                                            style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-text-main)' }}
                                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-main)'}
                                                        >
                                                            {client.full_name}
                                                        </h3>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Client Member</div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', flex: 1 }}>{client.bio || "Active client on KleanerZ."}</p>
                                                <button
                                                    className="btn-outline"
                                                    style={{ width: '100%' }}
                                                    onClick={() => {
                                                        setCurrentChat({ id: client.id, full_name: client.full_name, other_user_id: client.id, other_user_avatar_url: client.avatar_url });
                                                        setActiveTab('messages');
                                                    }}
                                                >
                                                    Message Client
                                                </button>
                                            </div>
                                        ))}
                                        {directoryResults.length === 0 && (
                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#999' }}>No clients found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'calendar' && (
                            <div style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-main)' }}>Service Schedule</h1>
                                        <p style={{ color: 'var(--color-text-secondary)' }}>Your upcoming cleaning appointments.</p>
                                    </div>
                                    <button className="btn-primary" onClick={() => setActiveTab('find_work')}>Browse New Gigs</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '40px' }}>
                                    {/* Left: Detailed List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>{selectedDate ? `Missions on Feb ${selectedDate}` : 'Upcoming Missions'}</h3>
                                        {myJobs.filter(j => {
                                            if (selectedDate) {
                                                const d = new Date(j.scheduled_at || j.created_at);
                                                return d.getDate() === selectedDate && d.getMonth() === new Date().getMonth();
                                            }
                                            return j.status === 'claimed' || j.status === 'in_progress';
                                        }).map(job => (
                                            <div key={job.id} className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', display: 'flex', gap: '24px', alignItems: 'center', background: 'var(--color-bg-main)' }}>
                                                <div style={{ padding: '12px 20px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '12px', textAlign: 'center', minWidth: '80px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{new Date(job.scheduled_at || job.created_at).toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{new Date(job.scheduled_at || job.created_at).getDate()}</div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{job.title}</h4>
                                                    <div style={{ display: 'flex', color: 'var(--color-text-secondary)', fontSize: '0.9rem', gap: '16px' }}>
                                                        <span><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> {new Date(job.scheduled_at || job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {job.address_masked}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setActiveTab('my_jobs')} className="btn-outline" style={{ padding: '10px 20px' }}>Details</button>
                                            </div>
                                        ))}
                                        {myJobs.filter(j => {
                                            if (selectedDate) {
                                                const d = new Date(j.scheduled_at || j.created_at);
                                                return d.getDate() === selectedDate && d.getMonth() === new Date().getMonth();
                                            }
                                            return j.status === 'claimed' || j.status === 'in_progress';
                                        }).length === 0 && (
                                                <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', border: '2px dashed var(--color-border)', background: 'transparent' }}>
                                                    <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                    <p>{selectedDate ? 'No missions for this day.' : 'No upcoming missions.'}</p>
                                                </div>
                                            )}
                                        {selectedDate && (
                                            <button onClick={() => setSelectedDate(null)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                                                View all upcoming →
                                            </button>
                                        )}
                                    </div>

                                    {/* Right: Date Grid */}
                                    <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)', height: 'fit-content' }}>
                                        <h3 style={{ fontWeight: 'bold', marginBottom: '24px', color: 'var(--color-text-main)' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                                <div key={d} style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '8px' }}>{d}</div>
                                            ))}
                                            {Array.from({ length: 30 }, (_, i) => {
                                                const day = i + 1;
                                                const isToday = day === new Date().getDate();
                                                const hasJob = myJobs.some(j => {
                                                    const jobDate = new Date(j.scheduled_at || j.created_at);
                                                    return jobDate.getDate() === day && jobDate.getMonth() === new Date().getMonth();
                                                });
                                                return (
                                                    <div key={i}
                                                        onClick={() => setSelectedDate(day)}
                                                        style={{
                                                            aspectRatio: '1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderRadius: '50%',
                                                            background: selectedDate === day ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                                            color: selectedDate === day ? 'white' : 'var(--color-text-main)',
                                                            fontSize: '0.9rem',
                                                            fontWeight: selectedDate === day ? 'bold' : '500',
                                                            position: 'relative',
                                                            cursor: 'pointer',
                                                            border: hasJob && selectedDate !== day ? '2px solid var(--color-primary)' : 'none',
                                                            boxShadow: selectedDate === day ? 'var(--shadow-md)' : 'none'
                                                        }}>
                                                        {day}
                                                        {hasJob && (
                                                            <div style={{ position: 'absolute', bottom: selectedDate === day ? '4px' : '0px', width: '4px', height: '4px', background: selectedDate === day ? 'white' : '#45a353', borderRadius: '50%' }}></div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', fontSize: '0.9rem', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <div style={{ width: 8, height: 8, background: 'var(--color-primary)', borderRadius: '50%' }}></div>
                                            <span>You have <strong>{myJobs.filter(j => ['claimed', 'in_progress', 'en_route', 'pending_approval'].includes(j.status)).length}</strong> active cleaning sessions this month.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
                                {!isEditingProfile ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        {/* Profile Header */}
                                        <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '48px', background: 'var(--color-bg-main)', boxShadow: 'var(--shadow-lg)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'var(--color-bg-secondary)', margin: 0, overflow: 'hidden', border: '5px solid var(--color-bg-main)', boxShadow: 'var(--shadow-md)' }}>
                                                    <img src={user?.avatar_url || "https://images.unsplash.com/photo-1554126807-6b10f6f6692a?q=80&w=400"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--color-primary)', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--color-bg-main)' }}>
                                                    <Star size={16} fill="white" />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>{user?.full_name || "New Professional"}</h1>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                                                                <Star size={24} fill="var(--color-warning)" /> {user?.rating?.toFixed(1) || "5.0"}
                                                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>({user?.reviews_count || 0} reviews)</span>
                                                            </span>
                                                            <span>•</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={24} /> Manila, PH</span>
                                                            <span>•</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={24} /> Responds in 1hr</span>
                                                        </div>
                                                    </div>
                                                    <button className="btn-primary" onClick={() => setIsEditingProfile(true)} style={{ padding: '12px 32px', borderRadius: '12px', fontSize: '1rem' }}>Edit My Profile</button>
                                                </div>
                                                <div style={{ marginTop: '32px', display: 'flex', gap: '24px' }}>
                                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>✓ Identity Verified</div>
                                                    {(user?.rating || 0) >= 4.5 && (
                                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>★ Top Rated Plus</div>
                                                    )}
                                                    <div style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid var(--color-border)' }}>Job Success: 98%</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                {/* Left: About */}
                                                <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px', color: 'var(--color-text-main)' }}>Professional Overview</h3>
                                                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                                        {user?.bio || "No bio added yet. Tell clients about your skills and experience to get more jobs!"}
                                                    </p>

                                                    <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                                        <div>
                                                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: 'var(--color-text-main)' }}>Skills & Expertise</h3>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                                {(user?.skills || "General Cleaning,Deep Cleaning").split(',').map((skill: string) => (
                                                                    <span key={skill} style={{ padding: '10px 18px', borderRadius: '25px', background: 'var(--color-bg-secondary)', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{skill.trim()}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: 'var(--color-text-main)' }}>Equipment & Supplies</h3>
                                                            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                                                                {user?.equipment || "Available upon request."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px', color: 'var(--color-text-main)' }}>Work Availability</h3>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                            <div key={day} style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{day}</div>
                                                                <div style={{ height: '40px', borderRadius: '8px', background: ['Sat', 'Sun'].includes(day) ? 'rgba(225, 29, 72, 0.1)' : 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ['Sat', 'Sun'].includes(day) ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold', fontSize: '0.8rem', border: `1px solid ${['Sat', 'Sun'].includes(day) ? 'rgba(225, 29, 72, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` }}>
                                                                    {['Sat', 'Sun'].includes(day) ? 'OFF' : '8A - 5P'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Right: Quick Info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                <div className="card" style={{ padding: '32px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--color-text-main)' }}>Contact Info</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}>@</div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Email</div>
                                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{user?.email}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)' }}><Phone size={18} /></div>
                                                            <div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Phone</div>
                                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{user?.phone || "Not provided"}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card" style={{ padding: '32px', border: 'none', background: 'var(--color-primary)', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Earning Power</h3>
                                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>Since joining KleanerZ</p>
                                                    <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{formatPrice(wallet)}</div>
                                                    <div style={{ marginTop: '20px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>↑ 12% from last month</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                                            <button className="btn-outline" onClick={() => setIsEditingProfile(false)} style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--color-text-main)' }}>←</button>
                                            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--color-text-main)' }}>Edit Your Professional Identity</h1>
                                        </div>

                                        <div className="card" style={{ padding: '40px', border: '1px solid var(--color-border)', background: 'var(--color-bg-main)' }}>
                                            <form onSubmit={handleUpdateProfile}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                                                    {/* Photo Upload Section */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '24px', background: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                                                        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-bg-main)', border: '2px solid var(--color-border)' }}>
                                                            <img src={profileData.avatar_url || user?.avatar_url || "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=400"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Profile Picture</h4>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Recommend 400x400 JPG or PNG.</p>
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
                                                                style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Full Name</label>
                                                            <input
                                                                className="input-field"
                                                                value={profileData.full_name}
                                                                onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                                placeholder="Your professional name"
                                                                style={{ padding: '16px' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Phone Number</label>
                                                            <input
                                                                className="input-field"
                                                                value={profileData.phone}
                                                                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                                                placeholder="+63 9xx xxx xxxx"
                                                                style={{ padding: '16px' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Professional Bio & Pitch</label>
                                                        <textarea
                                                            className="input-field"
                                                            rows={5}
                                                            style={{ height: 'auto', padding: '16px', lineHeight: '1.6' }}
                                                            value={profileData.bio}
                                                            onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                                            placeholder="Describe your experience, cleaning style, and special equipment..."
                                                        />
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Skills (Comma separated)</label>
                                                            <input
                                                                className="input-field"
                                                                value={profileData.skills}
                                                                onChange={e => setProfileData({ ...profileData, skills: e.target.value })}
                                                                placeholder="Deep Cleaning, Pet-friendly, Sanitizing..."
                                                                style={{ padding: '16px' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Languages</label>
                                                            <input
                                                                className="input-field"
                                                                value={profileData.languages}
                                                                onChange={e => setProfileData({ ...profileData, languages: e.target.value })}
                                                                placeholder="English, Tagalog, etc."
                                                                style={{ padding: '16px' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Equipment List</label>
                                                        <input
                                                            className="input-field"
                                                            value={profileData.equipment}
                                                            onChange={e => setProfileData({ ...profileData, equipment: e.target.value })}
                                                            placeholder="Vacuum, Mop, Specialized chemicals, etc."
                                                            style={{ padding: '16px' }}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                                                        <button type="submit" className="btn-primary" style={{ padding: '16px 48px', borderRadius: '12px', flex: 1 }}>Save Profile Changes</button>
                                                        <button type="button" className="btn-outline" onClick={() => setIsEditingProfile(false)} style={{ padding: '16px 32px', border: 'none' }}>Cancel</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div style={{ padding: '40px' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)' }}>Account Settings</h1>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Manage your account preferences.</p>
                                <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-secondary)' }}>
                                    <p>Settings module coming soon.</p>
                                </div>
                            </div>
                        )}

                    </main>
                </div >
                {/* User Search Modal */}
                {
                    showUserSearch && (
                        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                            <div style={{ background: 'var(--color-bg-main)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}>
                                <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)' }}>Find Client</h2>
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
                    )
                }

                {/* User Profile View Modal */}
                {
                    isProfileModalOpen && viewingUser && (
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
                                    <div style={{ height: '120px', background: 'linear-gradient(135deg, #166534 0%, #45a353 100%)' }}></div>

                                    <div style={{ padding: '0 32px 32px', marginTop: '-50px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                                            <div style={{ width: '100px', height: '100px', borderRadius: '24px', border: '4px solid var(--color-bg-main)', overflow: 'hidden', background: 'var(--color-bg-secondary)' }}>
                                                <img src={viewingUser.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <button
                                                className="btn-primary"
                                                onClick={() => {
                                                    setCurrentChat({ id: viewingUser.id, full_name: viewingUser.full_name, other_user_id: viewingUser.id, other_user_avatar_url: viewingUser.avatar_url });
                                                    setActiveTab('messages');
                                                    setIsProfileModalOpen(false);
                                                }}
                                                style={{ marginBottom: '10px', background: '#45a353' }}
                                            >
                                                Message Client
                                            </button>
                                        </div>

                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-main)' }}>{viewingUser.full_name}</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                                                <Star size={18} fill="var(--color-warning)" /> {viewingUser.rating?.toFixed(1) || "5.0"}
                                            </span>
                                            <span>•</span>
                                            <span>Client</span>
                                            <span>•</span>
                                            <span><MapPin size={16} style={{ display: 'inline', marginRight: '4px' }} /> Metro Manila</span>
                                        </div>

                                        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem', color: 'var(--color-text-main)' }}>About</h4>
                                            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                                {viewingUser.bio || "Active client on KleanerZ platform."}
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
                                                <h4 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Trust & Safety</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    <span style={{ padding: '4px 10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                                        Identity Verified
                                                    </span>
                                                    <span style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                        Payment Verified
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* Review Modal */}
                {
                    showReviewModal && reviewQuest && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                            <div style={{ background: 'var(--color-bg-main)', borderRadius: '24px', padding: '32px', width: '400px', maxWidth: '90%', animation: 'fadeIn 0.2s', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-text-main)', textAlign: 'center' }}>Rate Your Client</h2>
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>How was working for <strong style={{ color: 'var(--color-text-main)' }}>{reviewQuest.title}</strong>?</p>

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
                                    placeholder="Any issues? Or were they great? (Optional)"
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
                                            alert("Review submitted! Thank you.");
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
                    )
                }
            </div >
        </>
    );
}
