import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-gray-800 relative overflow-hidden">
      {/* Navigation */}
      <LandingNav />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-300 backdrop-blur-md shadow-2xl transition-transform hover:scale-105">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            System Operational
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="bg-gradient-to-b from-white via-white/80 to-white/40 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl md:text-8xl lg:text-9xl filter drop-shadow-sm">
              My Help Desk
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-8 max-w-3xl mx-auto">
            <p className="text-xl text-gray-400 md:text-2xl leading-relaxed font-light tracking-wide">
              The centralized support hub for inventory management and ticket resolution.
            </p>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>

            <p className="text-base text-gray-500 leading-relaxed max-w-2xl mx-auto">
              This offers a secure, invite-only environment tailored for enterprise-grade efficiency.
              <br className="hidden md:block" />
              Contact your system administrator for access privileges.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
