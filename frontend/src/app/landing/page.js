import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_34%)]" />

      <div className="relative">
        <Navbar />
        <Hero />
        <Features />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
