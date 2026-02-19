'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import FloatingLines from '@/components/FloatingLines';

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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };
    checkSession();
  }, [router]);

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
    image: "https://man-support-desk.netlify.app/favicon.png",
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
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />

      {/* Announcement Banner */}


      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 overflow-hidden">
          {/* Background Gradient Spot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

          <FloatingLines />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center space-y-8">

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                System Operational
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white drop-shadow-sm">
                  Enterprise Support Hub
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
                  Unified ticket management, inventory tracking, and team collaboration built for enterprise-grade support.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                >
                  Access Dashboard
                </Link>
                <button
                  onClick={() => document.getElementById('request-access')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 rounded-full border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-colors"
                >
                  Request Access
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics - Vercel Style */}
        <section className="border-y border-white/10 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">1,250+</div>
                <div className="text-sm text-gray-400 font-mono uppercase tracking-wider">Tickets Resolved</div>
              </div>
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">98%</div>
                <div className="text-sm text-gray-400 font-mono uppercase tracking-wider">Satisfaction Rate</div>
              </div>
              <div className="py-8 md:py-12 px-8 text-center">
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">15m</div>
                <div className="text-sm text-gray-400 font-mono uppercase tracking-wider">Avg Response</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Ticket Lookup - Vercel Style */}
        <section className="py-24 px-4 border-b border-white/10 bg-black relative overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8">Track Ticket Status</h2>
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto transform transition-all">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-black rounded-lg border border-white/10 p-1">
                  <input
                    type="text"
                    placeholder="Enter ticket ID (e.g., ticket-123...)"
                    value={searchTicket}
                    onChange={(e) => setSearchTicket(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none text-sm font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-white text-black rounded text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Track'}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 rounded border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            {ticketData && (
              <div className="mt-8 p-6 rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur text-left max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium">Ticket #{ticketData.id.slice(0, 8)}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ticketData.status === 'OPEN' ? 'bg-green-500' : ticketData.status === 'RESOLVED' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                      <span className="text-xs text-gray-400 capitalize">{ticketData.status.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono border border-white/10 px-2 py-1 rounded text-gray-400">{ticketData.priority}</span>
                </div>
                <div className="text-xs text-gray-500 pt-4 border-t border-white/5 flex justify-between">
                  <span>Updated {new Date(ticketData.updatedAt || ticketData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features - Vercel Style: Bento Grid */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-black">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-20 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              Everything you need to <br /> scale support.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Card 1 */}
              <div className="md:col-span-2 p-8 rounded-3xl border border-white/10 bg-zinc-900/20 hover:border-white/20 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">⚡</div>
                  <h3 className="text-xl font-semibold text-white mb-3">Smart Automation</h3>
                  <p className="text-gray-400 leading-relaxed max-w-md">
                    Auto-assign tickets based on priority and team expertise. SLA monitoring keeps everyone accountable with automated escalations.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/20 hover:border-white/20 transition-colors relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">📦</div>
                  <h3 className="text-xl font-semibold text-white mb-3">Inventory Sync</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Link assets directly to support tickets for complete context.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/20 hover:border-white/20 transition-colors relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">👥</div>
                  <h3 className="text-xl font-semibold text-white mb-3">Collaboration</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Mention team members and maintain internal notes in real-time.
                  </p>
                </div>
              </div>

              {/* Large Card 2 */}
              <div className="md:col-span-2 p-8 rounded-3xl border border-white/10 bg-zinc-900/20 hover:border-white/20 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/10 blur-[80px] rounded-full group-hover:bg-pink-500/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-2xl">✨</div>
                  <h3 className="text-xl font-semibold text-white mb-3">AI Suggestions</h3>
                  <p className="text-gray-400 leading-relaxed max-w-md">
                    Automatic priority detection and categorization. Intelligent tagging accelerates resolution time by learning from past tickets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Request Access - Vercel Style: Minimal Form */}
        <section id="request-access" className="py-32 px-4 border-t border-white/10 bg-black relative">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Request Access</h2>
              <p className="text-gray-500 text-sm">Join the enterprise platform for modern support teams.</p>
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
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
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
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
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
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
                />
              </div>

              {requestStatus === 'success' && (
                <div className="text-green-400 text-xs text-center py-2">Request submitted successfully!</div>
              )}
              {requestStatus === 'error' && (
                <div className="text-red-400 text-xs text-center py-2">{requestError || 'Error submitting request'}</div>
              )}

              <button
                type="submit"
                disabled={requestStatus === 'loading' || requestStatus === 'success'}
                className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
              >
                {requestStatus === 'loading' ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        </section>

        <footer className="py-12 border-t border-white/10 bg-black relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 relative z-10">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500 font-mono">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <span>© 2026 Man&apos;s Support Desk.</span>
                <div className="flex gap-6">
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <a href="#" className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
                  {/* LinkedIn Icon */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                <a href="#" className="p-2 rounded-lg border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
                  {/* X / Twitter Icon */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <div className="h-4 w-px bg-white/10 mx-2"></div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 hover:text-white transition-colors group"
                >
                  <span>Top</span>
                  <svg className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </div>
            </div>

            {/* Huge Footer Text */}
            <div className="w-full flex justify-center -z-10 pt-8 md:pt-16 pb-4">
              <h1 className="text-[13vw] leading-[0.8] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d4d] via-[#a259ff] to-[#7f00ff] text-center select-none -m-24">
                MAN&apos;S SUPPORT
              </h1>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
