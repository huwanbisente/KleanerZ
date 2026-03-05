import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Star, CheckCircle, Sparkles, ArrowRight, Quote, ShieldCheck, Zap, Heart } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Klient",
      text: "KleanerZ literally saved my weekend. Finding a reliable cleaner used to be such a mission, but now it's just a tap away. 10/10 aesthetic.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100"
    },
    {
      name: "Sarah Chen",
      role: "Kleaner",
      text: "Being a Kleaner gave me the flexibility I needed while finishing my degree. The community is so supportive and the pay is actually fair!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100"
    },
    {
      name: "Jordan Lee",
      role: "Klient",
      text: "The 'Active' job tracking is a game changer. I love seeing the progress photos. It feels much safer than other platforms.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100"
    }
  ];

  return (
    <>
      <Head>
        <title>KleanerZ | Your Space, Refreshed.</title>
        <meta name="description" content="The modern way to find cleaning professionals. Gen-Z coded, quality driven." />
      </Head>

      <div style={{ background: 'var(--color-bg-main)', color: 'var(--color-text-main)', fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}>
        <Navbar />

        {/* Hero Section */}
        <section style={{
          padding: '120px 20px 80px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-main) 100%)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', animation: 'float 6s ease-in-out infinite' }}>
            <Sparkles size={40} color="#4ade80" opacity={0.3} />
          </div>
          <div style={{ position: 'absolute', bottom: '20%', right: '15%', animation: 'float 8s ease-in-out infinite' }}>
            <Heart size={30} color="#f472b6" opacity={0.2} />
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#dcfce7',
              color: '#166534',
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '32px'
            }}>
              <Zap size={16} fill="#166534" /> NEW: Cleaning tracking in real-time
            </div>
            <h1 style={{
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              fontWeight: '900',
              lineHeight: '1',
              letterSpacing: '-0.04em',
              marginBottom: '24px',
              color: 'var(--color-text-main)'
            }}>
              Cleaning but make it <span style={{ color: '#4ade80' }}>aesthetic.</span>
            </h1>
            <p style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '650px',
              margin: '0 auto 48px',
              lineHeight: '1.6'
            }}>
              The first marketplace designed for the next generation of clients and cleaners. Fresh spaces, fair pay, and zero stress.
            </p>
          </div>
        </section>

        {/* Selection Cards (The "Two Options") */}
        <section style={{ padding: '0 20px 100px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '32px'
          }}>
            {/* Option 1: I'm looking for KleanerZ (Client) */}
            <Link href="/login?role=client" style={{ textDecoration: 'none' }}>
              <div className="selection-card" style={{
                height: '550px',
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'url("/client_looking_for_service.png") center/cover',
                  transition: 'transform 0.6s ease'
                }} className="card-bg"></div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)'
                }}></div>
                <div style={{ position: 'relative', padding: '40px', color: 'white', width: '100%' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>I'm looking for KleanerZ</h2>
                  <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '24px' }}>Find curated cleaning pros to refresh your space. Top-tier quality, guaranteed.</p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    color: 'black',
                    padding: '16px 32px',
                    borderRadius: '100px',
                    fontWeight: 'bold'
                  }}>
                    Find a Kleaner <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Option 2: I'm Looking for KlientZ (Cleaner) */}
            <Link href="/login?role=cleaner" style={{ textDecoration: 'none' }}>
              <div className="selection-card" style={{
                height: '550px',
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'url("/cleaner_provider_genz.png") center/cover',
                  transition: 'transform 0.6s ease'
                }} className="card-bg"></div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)'
                }}></div>
                <div style={{ position: 'relative', padding: '40px', color: 'white', width: '100%' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>I'm Looking for KlientZ</h2>
                  <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '24px' }}>Join the community. Set your own rates, choose your gigs, and grow your hustle.</p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#4ade80',
                    color: '#064e3b',
                    padding: '16px 32px',
                    borderRadius: '100px',
                    fontWeight: 'bold'
                  }}>
                    Become a Kleaner <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Trust Section */}
        <section style={{ background: 'var(--color-bg-secondary)', padding: '100px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '60px' }}>Trust is our entire vibe.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
              <div style={{ padding: '32px', background: 'var(--color-bg-main)', borderRadius: '24px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <ShieldCheck size={32} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Verified Pros</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>We background check every single Kleaner so you can vibe in peace.</p>
              </div>
              <div style={{ padding: '32px', background: 'var(--color-bg-main)', borderRadius: '24px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Star size={32} color="var(--color-secondary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Clear Transparency</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Ratings, reviews, and real clean photos. No surprises, just spotless results.</p>
              </div>
              <div style={{ padding: '32px', background: 'var(--color-bg-main)', borderRadius: '24px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Quote size={32} color="var(--color-warning)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>Always Active</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Live tracked jobs and instant messaging. You're always in the loop.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={{ padding: '100px 20px', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
              <div style={{ maxWidth: '500px' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--color-text-main)', marginBottom: '16px' }}>Don't just take it from us.</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>Real stories from the KleanerZ community.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ background: '#f3f4f6', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div style={{ background: '#111827', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                  <ArrowRight size={24} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              {testimonials.map((t, idx) => (
                <div key={idx} style={{
                  padding: '40px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '32px',
                  border: '1px solid var(--color-border)',
                  position: 'relative'
                }}>
                  <Quote size={40} color="var(--color-border)" style={{ position: 'absolute', top: '30px', right: '30px' }} />
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', marginBottom: '32px', position: 'relative' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={t.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{t.role} Member</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '100px 20px' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            background: '#0a3d2e',
            borderRadius: '48px',
            padding: '80px 40px',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: '#4ade80', borderRadius: '50%', opacity: 0.1, filter: 'blur(50px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: '#3b82f6', borderRadius: '50%', opacity: 0.1, filter: 'blur(50px)' }}></div>

            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '24px' }}>Ready for a <span style={{ color: '#4ade80' }}>fresh start?</span></h2>
            <p style={{ fontSize: '1.3rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto 48px' }}>
              Join thousands of others making their spaces aesthetic and their hustles profitable.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                background: '#4ade80',
                color: '#064e3b',
                padding: '20px 48px',
                borderRadius: '100px',
                fontWeight: '900',
                fontSize: '1.1rem',
                textDecoration: 'none'
              }}>Get Started Now</Link>
              <Link href="/about" style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                padding: '20px 48px',
                borderRadius: '100px',
                fontWeight: '700',
                fontSize: '1.1rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                textDecoration: 'none'
              }}>Learn More</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '80px 20px 40px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '80px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '24px', color: 'var(--color-primary)' }}>kleanerz<span style={{ color: 'var(--color-text-main)' }}>.</span></h3>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>The new standard for cleaning services. Built for the next generation.</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Product</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-secondary)' }}>
                  <li>Find a Kleaner</li>
                  <li>Become a Provider</li>
                  <li>Safety Measures</li>
                  <li>Pricing</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Support</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-secondary)' }}>
                  <li>Help Center</li>
                  <li>Contact Us</li>
                  <li>Terms of Service</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '20px' }}>Social</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-secondary)' }}>
                  <li>Instagram</li>
                  <li>TikTok</li>
                  <li>Twitter</li>
                  <li>Discord</li>
                </ul>
              </div>
            </div>
            <div style={{
              paddingTop: '40px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>© 2026 KleanerZ Inc. All rights reserved.</div>
              <div style={{ display: 'flex', gap: '24px', color: '#94a3b8', fontSize: '0.9rem' }}>
                <span>Security</span>
                <span>Status</span>
                <span>Docs</span>
              </div>
            </div>
          </div>
        </footer>

        <style jsx>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                    .selection-card:hover {
                        transform: translateY(-12px);
                        box-shadow: 0 40px 80px rgba(0,0,0,0.15);
                    }
                    .selection-card:hover .card-bg {
                        transform: scale(1.05);
                    }
                `}</style>
      </div>
    </>
  );
}
