import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnrollDialog } from "@/components/EnrollDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Brain, Rocket, Users, CheckCircle2, Star, Calendar,
  MessageSquare, Briefcase, GraduationCap, ArrowRight, Zap, Award
} from "lucide-react";
import heroImg from "@/assets/hero-ai.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const modules = [
  { num: "01", title: "AI Foundations", desc: "Demystify how LLMs, prompts & tokens actually work — no maths required." },
  { num: "02", title: "Prompt Engineering", desc: "Master the techniques pros use to get 10x better outputs from ChatGPT, Claude & Gemini." },
  { num: "03", title: "AI for Productivity", desc: "Automate research, emails, reports & content workflows in your day-to-day." },
  { num: "04", title: "AI Tools Stack", desc: "Hands-on with Notion AI, Perplexity, Midjourney, ElevenLabs & 15+ tools." },
  { num: "05", title: "Build Without Code", desc: "Ship a real AI-powered project — chatbot, automation, or content engine." },
  { num: "06", title: "Monetize AI Skills", desc: "Land freelance gigs, offer AI services, or pitch AI projects at work." },
];

const benefits = [
  { icon: Brain, title: "Practical, not theoretical", desc: "Every lesson ends with a project you ship the same day." },
  { icon: Rocket, title: "Designed for Kenya", desc: "Local case studies, Swahili examples, Kenyan freelance market focus." },
  { icon: Users, title: "Live cohort + community", desc: "Learn alongside 200+ peers in a private WhatsApp & Discord." },
  { icon: Award, title: "Certificate of completion", desc: "Verifiable credential to share on LinkedIn & with employers." },
];

const testimonials = [
  { name: "Brian Otieno", role: "Marketing Freelancer, Nairobi", quote: "Landed a Ksh 80k/month retainer using AI workflows I learned in week 2. Best investment this year.", initial: "B" },
  { name: "Achieng Odhiambo", role: "Final Year Student, JKUAT", quote: "I went from zero to building a chatbot for my dad's business. The instructor explains things so simply.", initial: "A" },
  { name: "David Kamau", role: "Operations Manager", quote: "Saving 10+ hours a week on reports. My manager asked me to train the whole team.", initial: "D" },
];

const audiences = [
  { icon: GraduationCap, label: "Students" },
  { icon: Briefcase, label: "Freelancers" },
  { icon: Users, label: "Professionals" },
];

function Landing() {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40 glass">
        <nav className="container mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold tracking-tight">AI Skills Africa</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#modules" className="hover:text-foreground transition-colors">Curriculum</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <button onClick={handleSignOut} className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Sign out
              </button>
            ) : (
              <Link to="/login" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Sign in
              </Link>
            )}
            <Button onClick={() => setEnrollOpen(true)} size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
              Enroll
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            New cohort starts Monday — 47 seats left
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="text-gradient">AI for Beginners.</span>
            <br />
            <span className="text-gradient-brand">Built for Kenya.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A live 4-week cohort that turns curious students, freelancers & professionals
            into confident AI users. Real projects. Real outcomes. Taught simply.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => setEnrollOpen(true)}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow text-base h-12 px-8">
              Enroll for KES 2,500 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="#modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              See what you'll learn ↓
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            {audiences.map((a) => (
              <div key={a.label} className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">Why this cohort</p>
            <h2 className="text-4xl md:text-5xl font-bold">Most AI courses are noise. <br/>This one ships results.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="group rounded-2xl bg-gradient-card border border-border/60 p-6 hover:border-primary/40 transition-all hover:-translate-y-1 shadow-card">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">The curriculum</p>
            <h2 className="text-4xl md:text-5xl font-bold">6 modules. 4 weeks. <span className="text-gradient-brand">Endless leverage.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => (
              <div key={m.num} className="group relative rounded-2xl bg-gradient-card border border-border/60 p-7 hover:border-primary/40 transition-all overflow-hidden">
                <div className="absolute -top-4 -right-4 text-7xl font-bold text-primary/5 font-display group-hover:text-primary/10 transition-colors">
                  {m.num}
                </div>
                <div className="relative">
                  <span className="text-xs font-mono text-primary">MODULE {m.num}</span>
                  <h3 className="text-xl font-semibold mt-2 mb-3">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">Student stories</p>
            <h2 className="text-4xl md:text-5xl font-bold">Real Kenyans. Real wins.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-gradient-card border border-border/60 p-7 shadow-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center font-semibold text-primary-foreground">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="relative rounded-3xl bg-gradient-card border border-primary/30 p-10 md:p-14 shadow-elegant overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />

            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-medium text-primary mb-6">
                <Zap className="h-3 w-3" /> One-time payment · Lifetime access
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Join the next cohort</h2>
              <p className="text-muted-foreground mb-8">Everything included. No upsells. No subscriptions.</p>

              <div className="flex items-baseline justify-center gap-2 mb-8">
                <span className="text-6xl md:text-7xl font-bold text-gradient-brand font-display">2,500</span>
                <span className="text-2xl text-muted-foreground font-medium">KES</span>
              </div>

              <ul className="text-left max-w-md mx-auto space-y-3 mb-10">
                {[
                  "4 weeks of live sessions on Google Meet",
                  "6 modules + downloadable resources",
                  "Private WhatsApp & Discord community",
                  "Real-world projects with feedback",
                  "Certificate of completion",
                  "Lifetime access to recordings",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" onClick={() => setEnrollOpen(true)}
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow text-base h-13 px-10 w-full sm:w-auto">
                Pay with M-Pesa <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <Calendar className="h-3 w-3" /> Next cohort starts Monday · 47 seats remaining
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6 mt-12">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-hero flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>© 2026 AI Skills Africa</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="mailto:hello@aiskills.africa" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>hello@aiskills.africa</span>
            </a>
          </div>
        </div>
      </footer>

      <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} />
    </div>
  );
}
