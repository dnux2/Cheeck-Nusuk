import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Map, Clock, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-display font-bold text-xl">N</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">CheckNusuk</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <Link href="/dashboard" className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300">
            Open Control Center
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32">
        <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary font-semibold text-sm mb-8 border border-primary/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Hajj 1445 System Online
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]"
          >
            Ensuring a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Safe & Seamless</span> Pilgrimage
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium"
          >
            AI-powered crowd management, real-time tracking, and instant emergency response for the Guests of Allah.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
              Access Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/services" className="px-8 py-4 bg-card text-foreground font-bold rounded-2xl text-lg flex items-center justify-center gap-3 border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300">
              Pilgrim Services
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-card border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Comprehensive Management</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Integrated systems designed specifically for the unique challenges of Hajj.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Map, title: "Smart Crowd Control", desc: "Predictive AI to prevent congestion before it happens." },
                { icon: ShieldCheck, title: "Unauthorized Detection", desc: "Automated permit verification via smart cameras." },
                { icon: HeartHandshake, title: "Emergency Response", desc: "Instant SOS alerts directly to the nearest medical team." },
                { icon: Clock, title: "Real-time Tracking", desc: "Live location updates for groups and individuals." }
              ].map((feature, i) => (
                <div key={i} className="bg-background rounded-3xl p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
