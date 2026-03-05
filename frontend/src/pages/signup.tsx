
import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import styles from "@/styles/Home.module.css";

export default function Signup() {
    const router = useRouter();
    const { role } = router.query;

    // Default to 'client' if not specified, or respect the query param
    const userRole = role === 'cleaner' ? 'cleaner' : 'client';

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: userRole
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const pageTitle = userRole === 'cleaner' ? 'Join as a Cleaner' : 'Sign up to Hire';
    const pageSubtitle = userRole === 'cleaner'
        ? 'Start earning money by cleaning homes'
        : 'Find the perfect cleaner for your needs';

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("Registering with:", formData);
            // 1. Register
            await axios.post("http://127.0.0.1:8000/auth/register", {
                email: formData.email,
                password: formData.password,
                role: userRole, // Force role from query/logic
                full_name: formData.full_name
            });

            // 2. Auto-login (get token)
            const loginRes = await axios.post("http://127.0.0.1:8000/auth/token", {
                email: formData.email,
                password: formData.password
            });

            const token = loginRes.data.access_token;
            localStorage.setItem("token", token);

            // 3. Update profile with name (since register might not take full_name in one go depending on schema?)
            // Based on auth.py, register endpoint takes UserCreate which has BaseUser fields including full_name?
            // Let's check schemas/user.py -> UserCreate inherits UserBase. UserBase has full_name.
            // backend/auth.py register endpoint creates User model.
            // User model has full_name.
            // So we might not need an extra update step if register handles it.
            // Checking backend/routers/auth.py -> register_user takes UserCreate.
            // new_user = models.User(email=..., hashed_password=..., role=...)
            // WAIT! The register_user function in auth.py ONLY sets email, password, and role!
            // It IGNORES full_name even if it's in the schema.
            // We need to fix that backend bug too, or do an update call here.

            // For now, let's do the update call to be safe or fix the backend.
            // Fixing backend is better. But let's add the update call here just in case I don't fix backend immediately.
            // Actually, I should fix the backend.

            if (userRole === 'cleaner') {
                router.push("/dashboard/cleaner");
            } else {
                router.push("/dashboard/client");
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || "Registration failed. Try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up | KleanerZ</title>
            </Head>
            <div className={`page`} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className={styles.logo} style={{ justifyContent: 'center', marginBottom: '24px' }}>
                        <span style={{ color: 'var(--color-primary)' }}>•</span> KleanerZ
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center', fontWeight: '800' }}>
                        {pageTitle}
                    </h1>
                    <p style={{ textAlign: 'center', marginBottom: '24px', color: '#777' }}>{pageSubtitle}</p>

                    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <input
                                className="input-field"
                                placeholder="Full Name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <div style={{ color: 'red', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#777' }}>
                        Already have an account? <Link href={`/login?role=${userRole}`} style={{ color: 'var(--color-text-main)', fontWeight: 'bold', textDecoration: 'underline' }}>Log in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
