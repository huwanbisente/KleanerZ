import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css"; // Reuse basic styles

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function Login() {
    const router = useRouter();
    const { role } = router.query; // Get role from URL query param
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Determine messaging based on role
    const isWorker = role === 'cleaner';
    const pageTitle = isWorker ? 'Find Gigs as a Cleaner' : 'Post Cleaning Jobs';
    const pageSubtitle = isWorker
        ? 'Login to find and claim cleaning jobs'
        : 'Login to post jobs and hire cleaners';

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        console.log("Attempting login with:", email);

        try {
            const response = await axios.post("http://127.0.0.1:8000/auth/token", {
                email,
                password,
            });

            const token = response.data.access_token;
            localStorage.setItem("token", token);

            // Simple JWT decode (payload is the second part)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userRole = payload.role;

            if (userRole === 'cleaner') {
                router.push("/dashboard/cleaner");
            } else {
                router.push("/dashboard/client");
            }

        } catch (err: any) {
            console.error("Login error:", err);
            const msg = err.response?.data?.detail || "Invalid credentials. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{pageTitle} | KleanerZ</title>
            </Head>
            <div className={`page`} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className={styles.logo} style={{ justifyContent: 'center', marginBottom: '24px' }}>
                        <span style={{ color: 'var(--color-primary)' }}>•</span> KleanerZ
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center', fontWeight: '800' }}>
                        {pageTitle}
                    </h1>
                    <p style={{ textAlign: 'center', marginBottom: '24px', color: '#777' }}>{pageSubtitle}</p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div style={{ color: 'red', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? "Logging in..." : "Continue"}
                        </button>
                    </form>

                    <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#777' }}>
                        Don't have an account? <a href={`/signup${role ? `?role=${role}` : ''}`} style={{ color: 'var(--color-text-main)', fontWeight: 'bold', textDecoration: 'underline' }}>Sign up</a>
                    </p>
                </div>
            </div>
        </>
    );
}
