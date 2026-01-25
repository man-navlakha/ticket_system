import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-gray-800">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="text-xl font-bold tracking-tight">Man's <span className="text-gray-500">Ticket System</span></div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#workflow" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#tech" className="hover:text-white transition-colors">Tech Stack</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400 mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
              </svg>
              Enterprise-Grade Ticket Management System
            </div>

            <h1 className="bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-7xl lg:text-8xl">
              Streamline Your<br />Support Workflow
            </h1>

            <p className="mx-auto max-w-3xl text-xl text-gray-400 md:text-2xl leading-relaxed">
              A modern, invite-only ticket system with role-based access, inventory management,
              and email notifications. Built for teams that value security and efficiency.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
              <Link
                href="#features"
                className="h-12 rounded-lg bg-white px-8 text-base font-semibold text-black transition-all hover:bg-gray-200 flex items-center justify-center min-w-[160px]"
              >
                Explore Features
              </Link>
              <Link
                href="/auth/login"
                className="h-12 rounded-lg border border-white/20 bg-transparent px-8 text-base font-semibold text-white transition-all hover:bg-white/5 flex items-center justify-center min-w-[160px]"
              >
                Admin Login
              </Link>
            </div>
          </div>

          {/* Subtle Grid Background Effect */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { label: "Secure Auth", value: "JWT + Bcrypt" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Email Delivery", value: "Zoho SMTP" },
              { label: "Response Time", value: "< 100ms" }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              Production-ready features built for modern teams
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Invite-Only System",
                description: "Admins send secure email invitations. Users complete setup and get instant access.",
                icon: "✉️"
              },
              {
                title: "Inventory Management",
                description: "Users must link a device (PID) to their account before creating tickets.",
                icon: "💻"
              },
              {
                title: "Role-Based Access",
                description: "Three distinct roles: USER, AGENT, and ADMIN with granular permissions.",
                icon: "🔐"
              },
              {
                title: "Real-Time Comments",
                description: "Threaded conversations on each ticket for efficient collaboration.",
                icon: "💬"
              },
              {
                title: "Status Tracking",
                description: "Track tickets through OPEN, IN_PROGRESS, and CLOSED states.",
                icon: "📊"
              },
              {
                title: "Email Notifications",
                description: "Automated emails via Zoho Mail for invites and important updates.",
                icon: "📧"
              },
              {
                title: "Priority Levels",
                description: "Categorize tickets as LOW, MEDIUM, or HIGH priority.",
                icon: "🎯"
              },
              {
                title: "Secure Sessions",
                description: "HTTP-only cookies with refresh token rotation and auto-expiry.",
                icon: "🛡️"
              },
              {
                title: "Dark Mode UI",
                description: "Beautiful Vercel-inspired design with premium aesthetics.",
                icon: "🌙"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="border-t border-white/10 bg-black py-24">
          <div className="container mx-auto px-6">
            <div className="mb-20 text-center">
              <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
                How It Works
              </h2>
              <p className="mt-4 text-xl text-gray-400">
                Simple onboarding, powerful workflow
              </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-6">
              {[
                {
                  step: "01",
                  title: "Admin Sends Invite",
                  description: "Admin goes to Team page, enters user email and role, and sends invitation via Zoho Mail.",
                  color: "blue"
                },
                {
                  step: "02",
                  title: "User Receives Email",
                  description: "Beautiful HTML email with secure setup link (valid for 24 hours).",
                  color: "purple"
                },
                {
                  step: "03",
                  title: "Account Setup",
                  description: "User completes registration by setting name and password. Account activated.",
                  color: "green"
                },
                {
                  step: "04",
                  title: "Link Inventory",
                  description: "User must claim a device (PID) before creating tickets. Persistent prompt until completed.",
                  color: "amber"
                },
                {
                  step: "05",
                  title: "Create & Manage Tickets",
                  description: "Users create tickets, agents respond, admins manage everything.",
                  color: "red"
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-6 items-start rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all"
                >
                  <div className={`flex-shrink-0 w-16 h-16 rounded-lg bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center font-bold text-lg border border-${item.color}-500/30`}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech" className="container mx-auto px-6 py-24">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              Built with Modern Tech
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              Production-grade tools for maximum performance
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Tech Stack List */}
            <div className="space-y-6">
              {[
                {
                  name: "Next.js 15",
                  description: "React framework with App Router and Server Components",
                  details: "Server Actions, Route Handlers, Streaming SSR"
                },
                {
                  name: "Prisma ORM",
                  description: "Type-safe database client with migrations",
                  details: "Relations, Validation, PostgreSQL optimized"
                },
                {
                  name: "Neon Database",
                  description: "Serverless PostgreSQL for the cloud",
                  details: "Auto-scaling, Branching, Connection pooling"
                },
                {
                  name: "TailwindCSS",
                  description: "Utility-first CSS framework",
                  details: "Custom design system, Dark mode, Responsive"
                },
                {
                  name: "Nodemailer + Zoho",
                  description: "Professional email delivery",
                  details: "SMTP integration, HTML templates, Deliverability"
                },
                {
                  name: "JWT + Bcrypt",
                  description: "Secure authentication system",
                  details: "Token rotation, Refresh tokens, Password hashing"
                }
              ].map((tech, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
                >
                  <h3 className="text-xl font-bold mb-1">{tech.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{tech.description}</p>
                  <p className="text-gray-500 text-xs">{tech.details}</p>
                </div>
              ))}
            </div>

            {/* Right: Code Example */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
              <div className="flex gap-2 mb-6">
                <div className="h-3 w-3 rounded-full bg-red-500/50"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/50"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="text-gray-400 text-xs mb-2">schema.prisma</div>
              <pre className="text-gray-300 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{`model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?
  role      Role     @default(USER)
  status    UserStatus @default(PENDING)
  
  inviteToken    String?   @unique
  inviteExpires  DateTime?
  
  tickets   Ticket[]
  inventory InventoryItem[]
  comments  Comment[]
}

model Ticket {
  id          String   @id @default(uuid())
  title       String
  description String
  status      Status   @default(OPEN)
  priority    Priority @default(MEDIUM)
  
  user     User      @relation(...)
  comments Comment[]
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.1),transparent_50%)]"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-300">
                This is an invite-only system. Contact your administrator to receive an invitation link.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/auth/login"
                  className="h-12 rounded-lg bg-white px-8 text-base font-semibold text-black transition-all hover:bg-gray-200 flex items-center justify-center"
                >
                  Admin Login
                </Link>
                <a
                  href="mailto:admin@example.com"
                  className="h-12 rounded-lg border border-white/20 px-8 text-base font-semibold text-white transition-all hover:bg-white/5 flex items-center justify-center"
                >
                  Contact Admin
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 bg-black py-12 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Man's Ticket System. Built with Next.js, Prisma & Neon.
        </p>
      </footer>
    </div>
  );
}
