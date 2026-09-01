import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import SupportedLanguages from "@/components/SupportedLanguages";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Dynamic ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-15" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[1000px] rounded-full bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-1/4 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="relative">
        <Navbar />
        <Hero />
        <HowItWorks />
        <Features />
        <SupportedLanguages />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
