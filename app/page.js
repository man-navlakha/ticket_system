'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FloatingLines from '@/components/FloatingLines';
import LandingNav from '@/components/LandingNav';
import Footer from '@/components/Footer';
import { Brain, WandSparkles, Users, ShelvingUnit } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchTicket, setSearchTicket] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', department: '' });
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, loading, success, error
  const [requestError, setRequestError] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.replace('/dashboard');
          return; // keep spinner while navigating
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
      setIsCheckingAuth(false); // not logged in — show landing page
    };
    checkSession();
  }, [router]);

  // While checking auth, show a minimal full-screen loader
  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-background, #fff)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #ec4269', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ... (handleSearch remains the same)

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setRequestStatus('loading');
    setRequestError('');

    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setRequestStatus('success');
      setFormData({ name: '', email: '', department: '' }); // Reset form
    } catch (err) {
      setRequestStatus('error');
      setRequestError(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;

    setLoading(true);
    setError('');
    setTicketData(null);

    try {
      const res = await fetch(`/api/tickets/track?id=${searchTicket.trim()}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Ticket not found. Please check the ID and try again.');
        throw new Error('Something went wrong. Please try again later.');
      }
      const data = await res.json();
      setTicketData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: "Man's Support Desk",
    image: "https://it.excellentpublicity.com//favicon.png",
    description: "Enterprise IT support ticketing system with integrated inventory management and automation.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: "4.8",
      ratingCount: "1250"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Announcement Banner */}

      <LandingNav />

      <main className="pt-2 md:pt-24 lg:pt-0">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 overflow-hidden">
          {/* Background Gradient Spot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

          <FloatingLines />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center space-y-8">

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Powered by <span className="text-[#ec4269] dark:text-[#D4AF37] font-semibold">MAN NAVLAKHA</span>
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-foreground drop-shadow-sm">
                  Enterprise Support Hub
                </h1>
                <span className="text-lg sm:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">

                </span>
                <p className="text-lg sm:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
                  Unified ticket management, inventory tracking, and team collaboration built for enterprise-grade support.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-3 rounded-full bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all outline-none ring-2 ring-[#ec4269]/50 ring-offset-2 ring-offset-background shadow-lg shadow-[#ec4269]/20"
                >
                  Access Dashboard
                </Link>
                <button
                  onClick={() => document.getElementById('request-access')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 rounded-full border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
                >
                  Request Access
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics - Vercel Style */}
        <section className="border-y border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">1,250+</div>
                <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Tickets Resolved</div>
              </div>
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">98%</div>
                <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Satisfaction Rate</div>
              </div>
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">15m</div>
                <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Avg Response</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Ticket Lookup - Vercel Style */}
        <section className="py-24 px-4 border-b border-border bg-background relative overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.05]"></div>

          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">Track Ticket Status</h2>
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto transform transition-all">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-background rounded-lg border border-border p-1">
                  <input
                    type="text"
                    placeholder="Enter ticket ID (e.g., ticket-123...)"
                    value={searchTicket}
                    onChange={(e) => setSearchTicket(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900  rounded text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Track'}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 rounded border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {ticketData && (
              <div className="mt-8 p-6 rounded-xl border border-border bg-card/80 backdrop-blur text-left max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-foreground font-medium">Ticket #{ticketData.id.slice(0, 8)}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ticketData.status === 'OPEN' ? 'bg-green-500' : ticketData.status === 'RESOLVED' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                      <span className="text-xs text-muted-foreground capitalize">{ticketData.status.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono border border-border px-2 py-1 rounded text-muted-foreground">{ticketData.priority}</span>
                </div>
                <div className="text-xs text-muted-foreground pt-4 border-t border-border flex justify-between">
                  <span>Updated {new Date(ticketData.updatedAt || ticketData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features - Vercel Style: Bento Grid */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-20 text-foreground">
              Everything you need to <br /> <span className="text-[#ec4269] dark:text-[#D4AF37]"> scale support.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Large Card 1 */}
              <div className="md:col-span-2 p-8 rounded-tl-3xl border-t border-l border-border bg-card hover:border-foreground/20 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-muted/80 backdrop-blur-sm shadow-inner border border-border flex items-center text-[#ec4269] dark:text-[#D4AF37] justify-center mb-6 text-3xl">
                    <Brain />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Smart Automation</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Auto-assign tickets based on priority and team expertise. SLA monitoring keeps everyone accountable with automated escalations.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-tr-3xl border-t border-r border-border bg-card hover:border-foreground/20 transition-colors relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center mb-6 text-2xl text-[#ec4269] dark:text-[#D4AF37]"><ShelvingUnit /></div>
                  <h3 className="text-xl font-semibold text-[#ec4269] dark:text-[#D4AF37] mb-3">Inventory Sync</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Link assets directly to support tickets for complete context.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-8 rounded-bl-3xl border-b border-l border-border bg-card hover:border-foreground/20 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 -right-3 w-64 h-64 bg-pink-800/10 blur-[80px] rounded-full group-hover:bg-pink-500/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center mb-6 text-2xl text-[#ec4269] dark:text-[#D4AF37]"><Users /></div>
                  <h3 className="text-xl font-semibold text-[#ec4269] dark:text-[#D4AF37] mb-3">Collaboration</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Mention team members and maintain internal notes in real-time.
                  </p>
                </div>
              </div>

              {/* Large Card 2 */}
              <div className="md:col-span-2 p-8 rounded-br-3xl border-b border-r border-border bg-card hover:border-foreground/20 hover:border-b hover:border-r transition-colors relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-pink-800/10 blur-[80px] rounded-full group-hover:bg-pink-500/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center text-[#ec4269] dark:text-[#D4AF37] justify-center mb-6 text-3xl">
                    <WandSparkles /></div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">AI Suggestions</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Automatic priority detection and categorization. Intelligent tagging accelerates resolution time by learning from past tickets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Request Access - Vercel Style: Minimal Form */}
        <section id="request-access" className="py-32 px-4 border-t border-border bg-background relative">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">Request Access</h2>
              <p className="text-muted-foreground text-sm">Join the enterprise platform for modern support teams.</p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Work Email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <input
                  required
                  type="text"
                  name="department"
                  placeholder="Department"
                  value={formData.department}
                  onChange={handleFormChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none transition-colors text-sm"
                />
              </div>

              {requestStatus === 'success' && (
                <div className="text-green-500 text-xs text-center py-2">Request submitted successfully!</div>
              )}
              {requestStatus === 'error' && (
                <div className="text-red-500 text-xs text-center py-2">{requestError || 'Error submitting request'}</div>
              )}

              <button
                type="submit"
                disabled={requestStatus === 'loading' || requestStatus === 'success'}
                className="w-full py-3 bg-[#ec4269] dark:bg-[#D4AF37] text-white dark:text-zinc-900 font-medium rounded-lg hover:opacity-90 transition-colors text-sm disabled:opacity-50"
              >
                {requestStatus === 'loading' ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        </section>

        <Footer />

      </main>
    </div>
  );
}
