import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Wand2,
  Layers,
  FileSearch,
  Users,
  Target,
  FileOutput,
  MessageSquare,
  Pencil,
  Share2,
  ArrowRight,
  MapPin,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Wizard",
    description:
      "5-phase guided flow generates everything from a single conversation.",
  },
  {
    icon: Layers,
    title: "Service Blueprints",
    description:
      "NNGroup-standard blueprints with lines of visibility and drag-and-drop canvas.",
  },
  {
    icon: FileSearch,
    title: "Research Pipeline",
    description:
      "Upload transcripts, AI extracts insights, and auto-links them to your blueprint.",
  },
  {
    icon: Users,
    title: "Personas",
    description:
      "AI-generated from research data, automatically linked to blueprints.",
  },
  {
    icon: Target,
    title: "Recommendations",
    description:
      "Impact/effort matrix — the last mile no competitor delivers.",
  },
  {
    icon: FileOutput,
    title: "Export Quality",
    description:
      "PPTX, PDF, shareable links — consultant-ready deliverables in one click.",
  },
];

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Start a conversation",
    description:
      "The AI wizard asks the right questions to understand your service design challenge.",
  },
  {
    number: "02",
    icon: Pencil,
    title: "Review & refine",
    description:
      "Edit personas, problem statement, and findings until everything is exactly right.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Export & share",
    description:
      "Download as PPTX, PDF, or share a live link with your team and stakeholders.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#08090a]">
      {/* ──────────────── NAV ──────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#fafafa]/80 backdrop-blur-lg border-b border-black/[0.06]">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <MapPin className="h-6 w-6 text-[#5E6AD2]" strokeWidth={2.2} />
            <span className="text-[15px] font-semibold tracking-tight">
              JourneyMapper
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#6b6f76] hover:text-[#08090a] transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#4f5bc4] rounded-lg px-4 py-2 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ──────────────── HERO ──────────────── */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#5E6AD2]/[0.06] blur-[120px]" />
          <div className="absolute top-32 right-1/4 w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5E6AD2]/10 mb-8">
            <MapPin className="h-7 w-7 text-[#5E6AD2]" strokeWidth={2} />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            AI-Powered Service
            <br />
            Blueprinting
          </h1>

          <p className="text-lg sm:text-xl text-[#6b6f76] max-w-xl mx-auto mb-10 leading-relaxed">
            Transform research into beautiful service blueprints. From problem
            statement to actionable recommendations&nbsp;&mdash; in minutes, not
            weeks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#4f5bc4] rounded-lg px-6 py-3 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#08090a] border border-black/[0.12] hover:border-black/[0.2] bg-white hover:bg-[#f5f5f7] rounded-lg px-6 py-3 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#5E6AD2] tracking-wide uppercase mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to blueprint services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-black/[0.06] bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#5E6AD2]/10 mb-4">
                  <f.icon className="h-5 w-5 text-[#5E6AD2]" />
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <section className="py-24 px-6 bg-white border-y border-black/[0.06]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#5E6AD2] tracking-wide uppercase mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three steps to a complete blueprint
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.number} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5E6AD2]/10 mb-5">
                  <s.icon className="h-5 w-5 text-[#5E6AD2]" />
                </div>
                <p className="text-xs font-bold text-[#5E6AD2] tracking-widest uppercase mb-2">
                  Step {s.number}
                </p>
                <h3 className="text-[15px] font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── CTA ──────────────── */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">
            Ready to transform your
            <br className="hidden sm:block" /> service design practice?
          </h2>
          <p className="text-[#6b6f76] mb-8">
            Start creating AI-powered service blueprints today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#4f5bc4] rounded-lg px-7 py-3.5 transition-colors shadow-sm"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer className="border-t border-black/[0.06] py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#6b6f76]">
            &copy; {new Date().getFullYear()} JourneyMapper. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-[#6b6f76] hover:text-[#08090a] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm text-[#6b6f76] hover:text-[#08090a] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
