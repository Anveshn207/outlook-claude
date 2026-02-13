"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  BarChart3,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const features = [
  {
    icon: Users,
    title: "Candidate Pipeline",
    description:
      "Track every candidate from first touch to offer. Visual Kanban boards, bulk actions, and smart filters.",
  },
  {
    icon: Briefcase,
    title: "Job Management",
    description:
      "Create and publish jobs in seconds. Auto-match candidates, manage applications, and close roles faster.",
  },
  {
    icon: BarChart3,
    title: "Recruiting Analytics",
    description:
      "Real-time dashboards showing time-to-hire, pipeline velocity, source effectiveness, and team performance.",
  },
  {
    icon: Zap,
    title: "Real-Time Notifications",
    description:
      "SSE-powered live updates. Know the instant a candidate applies, an interview is scheduled, or a task is due.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access control, invite-only onboarding, httpOnly cookie auth, and refresh token rotation.",
  },
  {
    icon: Globe,
    title: "Client CRM",
    description:
      "Manage hiring clients alongside candidates. Track contacts, contracts, and placements in one place.",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your team",
    description: "Invite recruiters, set roles and permissions. Be ready in under 5 minutes.",
  },
  {
    number: "02",
    title: "Import or create jobs",
    description: "Bulk import from spreadsheets or create job postings with our guided flow.",
  },
  {
    number: "03",
    title: "Track & hire",
    description: "Move candidates through your pipeline, schedule interviews, and close positions.",
  },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06060f] text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="landing-blob landing-blob-1" />
        <div className="landing-blob landing-blob-2" />
        <div className="landing-blob landing-blob-3" />
      </div>

      {/* Mouse follower glow */}
      <div
        className="pointer-events-none fixed z-10 h-[600px] w-[600px] rounded-full opacity-[0.07] transition-transform duration-700 ease-out"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
        }}
      />

      {/* Noise texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      {/* Navigation */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrollY > 50
            ? "border-b border-white/10 bg-[#06060f]/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-lg">
              K
            </div>
            <span className="text-xl font-bold tracking-tight">
              Kurwe<span className="text-indigo-400">Ball</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-white/60 transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-white/60 transition-colors hover:text-white">
              How it works
            </a>
            <a href="#stats" className="text-sm text-white/60 transition-colors hover:text-white">
              Results
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div className="landing-fade-up mb-8 flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <Sparkles className="h-4 w-4" />
          <span>The modern recruiting platform</span>
        </div>

        {/* Headline */}
        <h1 className="landing-fade-up landing-delay-1 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
          Hire{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            smarter
          </span>
          ,{" "}
          <br className="hidden sm:block" />
          not harder
        </h1>

        {/* Subtitle */}
        <p className="landing-fade-up landing-delay-2 mt-6 max-w-2xl text-lg text-white/50 md:text-xl">
          KurweBall unifies your candidate pipeline, job postings, client relationships,
          and team collaboration into one powerful recruiting platform.
        </p>

        {/* CTA Buttons */}
        <div className="landing-fade-up landing-delay-3 mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-2xl hover:shadow-indigo-500/30"
          >
            Start recruiting
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            See features
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="landing-fade-up landing-delay-4 absolute bottom-10 flex flex-col items-center gap-2">
          <span className="text-xs text-white/30">Scroll to explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce text-white/30" />
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-20 border-y border-white/5 bg-white/[0.02] py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: 10, suffix: "x", label: "Faster hiring" },
            { value: 98, suffix: "%", label: "User satisfaction" },
            { value: 50, suffix: "k+", label: "Candidates tracked" },
            { value: 500, suffix: "+", label: "Companies trust us" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-20 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
              Features
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                recruit at scale
              </span>
            </h2>
            <p className="mt-4 text-lg text-white/40">
              From sourcing to offer, KurweBall handles every step of your hiring workflow.
            </p>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.03] p-8 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06]"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-20 py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
              How it works
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              Up and running in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                minutes
              </span>
            </h2>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+60px)] top-8 hidden h-px w-[calc(100%-120px)] bg-gradient-to-r from-indigo-500/50 to-transparent md:block" />
                )}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-2xl font-extrabold text-indigo-400 ring-1 ring-indigo-500/30">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm text-white/40">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="relative z-20 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
            <div className="grid md:grid-cols-2">
              {/* Left - Text */}
              <div className="flex flex-col justify-center p-12 md:p-16">
                <span className="mb-4 text-sm font-medium tracking-widest text-indigo-400 uppercase">
                  Built for teams
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  Role-based access that{" "}
                  <span className="text-indigo-400">actually works</span>
                </h2>
                <p className="mt-4 text-white/40">
                  Four distinct roles — Admin, Manager, Recruiter, and Viewer — each with
                  granular permissions. Your team sees exactly what they need, nothing more.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Invite-only onboarding — no open registration",
                    "Granular permissions per page and action",
                    "Audit trail for all team activity",
                    "Secure session management with token rotation",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right - Visual */}
              <div className="flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-12 md:p-16">
                <div className="w-full max-w-sm space-y-4">
                  {["Admin", "Manager", "Recruiter", "Viewer"].map((role, i) => (
                    <div
                      key={role}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                            [
                              "from-indigo-400 to-purple-500",
                              "from-blue-400 to-cyan-500",
                              "from-green-400 to-emerald-500",
                              "from-orange-400 to-amber-500",
                            ][i]
                          } flex items-center justify-center text-sm font-bold text-white`}
                        >
                          {role[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{role}</div>
                          <div className="text-xs text-white/40">
                            {
                              [
                                "Full system access",
                                "Team & pipeline management",
                                "Candidate operations",
                                "Read-only access",
                              ][i]
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 4 - i }).map((_, j) => (
                          <div
                            key={j}
                            className="h-2 w-2 rounded-full bg-indigo-400/60"
                          />
                        ))}
                        {Array.from({ length: i }).map((_, j) => (
                          <div
                            key={j}
                            className="h-2 w-2 rounded-full bg-white/10"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-20 py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          {/* Glow behind CTA */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-indigo-500/15 blur-[120px]" />
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Ready to transform{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              your recruiting?
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/40">
            Join hundreds of teams who have already streamlined their hiring process with
            KurweBall. Get started in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-2xl hover:shadow-indigo-500/30"
            >
              Get started free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
              K
            </div>
            <span className="font-semibold tracking-tight text-white/60">
              KurweBall
            </span>
          </div>
          <div className="flex gap-8 text-sm text-white/30">
            <a href="#features" className="transition-colors hover:text-white/60">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white/60">How it works</a>
            <Link href="/login" className="transition-colors hover:text-white/60">Sign in</Link>
          </div>
          <div className="text-sm text-white/20" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} KurweBall. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
