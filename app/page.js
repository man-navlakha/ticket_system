'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import FloatingLines from '@/components/FloatingLines';

export default function Home() {
  const [searchTicket, setSearchTicket] = useState('');
  const [ticketFound, setTicketFound] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', department: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTicket.trim()) {
      setTicketFound(true);
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
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#141820] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-sm">
          <p className="text-gray-400">
            System Status: <span className="font-medium text-white">All Systems Operational</span>
          </p>
          <button className="text-xs text-gray-500 hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>

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

        {/* Quick Ticket Lookup */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5 bg-[#0B0E14]/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-light tracking-tight mb-6 text-center text-white">Track Your Ticket</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  placeholder="Enter ticket ID (e.g., TKT-001)"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  className="flex-1 bg-[#141820] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Search
                </button>
              </div>
              {ticketFound && (
                <div className="p-5 rounded-xl bg-[#141820] border border-white/10 animate-in fade-in slide-in-from-bottom-2 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">Ticket {searchTicket}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <p className="text-sm text-gray-400">Status: In Progress</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Medium Priority
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-gray-500">
                    <span>Last updated: 2 hours ago</span>
                    <span>Assigned to: Support Team</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">No account needed to check ticket status</p>
            </form>
          </div>
        </section>

        {/* Live Statistics */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-light tracking-tight mb-12 text-center text-white">By The Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-[#141820] border border-white/5 text-center hover:border-white/10 transition-colors group">
                <div className="text-4xl font-light text-white mb-2 group-hover:text-blue-400 transition-colors">1,250+</div>
                <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Tickets Resolved</p>
              </div>
              <div className="p-8 rounded-2xl bg-[#141820] border border-white/5 text-center hover:border-white/10 transition-colors group">
                <div className="text-4xl font-light text-white mb-2 group-hover:text-green-400 transition-colors">98%</div>
                <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Satisfaction Rate</p>
              </div>
              <div className="p-8 rounded-2xl bg-[#141820] border border-white/5 text-center hover:border-white/10 transition-colors group">
                <div className="text-4xl font-light text-white mb-2 group-hover:text-purple-400 transition-colors">15m</div>
                <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Average Response</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5 bg-[#0B0E14]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-light tracking-tight mb-12 text-center text-white">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              <FeatureCard
                icon="📦"
                title="Inventory Management"
                description="Track all company devices and hardware. Link assets directly to support tickets for complete context."
              />
              <FeatureCard
                icon="⚙️"
                title="Smart Automation"
                description="Auto-assign tickets based on priority and team expertise. SLA monitoring keeps everyone accountable."
              />
              <FeatureCard
                icon="👥"
                title="Team Collaboration"
                description="Mention team members, assign tasks, and maintain internal notes. Real-time updates keep everyone synced."
              />
              <FeatureCard
                icon="📚"
                title="Knowledge Base"
                description="Search public help articles directly from the platform. Self-service solutions reduce ticket volume."
              />
              <FeatureCard
                icon="✨"
                title="AI Suggestions"
                description="Automatic priority detection and categorization. Intelligent tagging accelerates resolution time."
              />
              <FeatureCard
                icon="📊"
                title="Analytics & Reporting"
                description="Real-time dashboards display performance metrics, team efficiency, and system health indicators."
              />

            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-light tracking-tight mb-16 text-center text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

              <div className="text-center space-y-6 relative z-10">
                <div className="w-24 h-24 rounded-full bg-[#141820] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-3xl font-light text-white">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Submit Request</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">Describe your issue in detail. Link company devices if applicable for immediate context.</p>
                </div>
              </div>

              <div className="text-center space-y-6 relative z-10">
                <div className="w-24 h-24 rounded-full bg-[#141820] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-3xl font-light text-white">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Auto Assignment</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">AI analyzes priority and assigns to the right team member based on expertise and availability.</p>
                </div>
              </div>

              <div className="text-center space-y-6 relative z-10">
                <div className="w-24 h-24 rounded-full bg-[#141820] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-3xl font-light text-white">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Resolution & Feedback</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">Receive regular updates and share feedback. Help us continuously improve the service.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Request Access */}
        <section id="request-access" className="px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5 bg-[#0B0E14]">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-light tracking-tight mb-4 text-center text-white">Request Access</h2>
            <p className="text-gray-400 text-center mb-10 max-w-md mx-auto">
              This is an invite-only platform. Contact your system administrator or submit your information below.
            </p>

            <form className="space-y-5 bg-[#141820] p-8 rounded-2xl border border-white/5 shadow-2xl">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Work Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Department</label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g., Engineering, Marketing"
                  value={formData.department}
                  onChange={handleFormChange}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all mt-4 transform hover:scale-[1.02]"
              >
                Submit Request
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-12 border-t border-white/5 bg-[#080a0f]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-500">© 2026 Enterprise Support Hub. All rights reserved.</p>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-[#141820] border border-white/5 space-y-4 hover:bg-white/5 transition-all duration-300 hover:border-white/10 group">
      <div className="text-3xl bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
