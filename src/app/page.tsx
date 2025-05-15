'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Workflow,
  Settings,
  GitBranch,
  PlugZap,
  SlidersHorizontal,
  PlayCircle,
  Share2,
  CheckCircle,
  BarChart,
  Layers,
  Component,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import FlowMascotCorner from '@/components/ui/flowMascot';

function HeroCartoon() {
  return (
    <section className="relative w-full min-h-screen pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Fondo doodle SVG */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <img
          src="/doodles-bg.svg"
          alt="Cartoon doodle background"
          className="w-full h-full object-cover opacity-20"
          draggable={false}
        />
      </div>
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, type: "spring" }}
            className="space-y-6 text-left"
          >
            <h1 className="font-nunito text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem] leading-tight text-neutral-900">
              Build Data Flows,{" "}
              <span className="text-blue-600 drop-shadow-cartoon">Visually!</span>
            </h1>
            <p className="text-lg text-neutral-600 md:text-xl max-w-xl">
              Connect APIs, transform data, and automate workflows with our playful, node-based builder.
            </p>
            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-start pt-6">
              <motion.div
                whileHover={{ scale: 1.07, rotate: -3 }}
                transition={{ type: "spring", stiffness: 220 }}
              >
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-4 border-neutral-800 rounded-2xl px-8 py-3 font-bold text-base relative"
                  >
                    <span className="z-10 relative">Launch Builder</span>
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-blue-400/30 blur-xl pointer-events-none"
                      animate={{ opacity: [0.18, 0.45, 0.18] }}
                      transition={{ repeat: Infinity, duration: 2.3, ease: "easeInOut" }}
                    />
                    <ArrowRight className="ml-2 h-5 w-5 relative z-10" />
                  </Button>
                </Link>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 hover:border-neutral-900 rounded-2xl px-8 py-3 font-semibold"
              >
                View Docs (Soon!)
              </Button>
            </div>
          </motion.div>
          {/* Ilustración cartoon */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.7, type: "spring" }}
            className="relative mt-12 lg:mt-0"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-100 to-purple-100 border-4 border-neutral-800 shadow-xl p-2">
              <div className="relative z-10 w-full h-full bg-white/80 rounded-2xl backdrop-blur-sm">
                <Image
                  src="/cartoon.png"
                  alt="Cartoon Workflow"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// FeatureCard y HowItWorksStep igual, pero sin animación interna porque el reveal es externo ahora
const FeatureCard = ({ icon: Icon, title, desc, color }: { icon: React.ElementType, title: string, desc: string, color: string }) => (
  <div
    className={cn(
      `relative flex flex-col items-center text-center p-6 rounded-3xl border-4 border-neutral-800 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group h-full`
    )}
  >
    <div className={cn(`mb-4 rounded-lg p-3`, color === 'cyan' ? 'bg-cyan-100' : color === 'lime' ? 'bg-lime-100' : 'bg-purple-100')}>
      <Icon className={cn(`h-7 w-7 group-hover:scale-110 transition-transform duration-300`, color === 'cyan' ? 'text-cyan-700' : color === 'lime' ? 'text-lime-700' : 'text-purple-700')} />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-neutral-800">{title}</h3>
    <p className="text-neutral-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

const HowItWorksStep = ({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-4 rounded-xl p-4 bg-blue-100 border-2 border-neutral-800 shadow-sm">
      <Icon className="h-8 w-8 text-blue-600" />
    </div>
    <h4 className="text-lg font-semibold mb-1 text-neutral-800">{title}</h4>
    <p className="text-sm text-neutral-500">{desc}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 text-neutral-800 overflow-x-hidden font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto h-16 flex items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-xl text-blue-700 tracking-tight group-hover:text-blue-800 transition-colors">
              FlowAPI
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="text-neutral-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Go to App
                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <HeroCartoon />

        {/* How it works */}
        <RevealOnScroll y={60}>
          <section className="w-full py-20 md:py-28 lg:py-28 bg-blue-50/50 border-y border-neutral-200">
            <div className="px-4 md:px-6">
              <h2 className="text-3xl font-bold tracking-tight text-center text-neutral-800 mb-16 md:mb-20 lg:mb-20">
                How It Works: Easy as 1-2-3-4!
              </h2>
              <div className="relative grid gap-12 md:grid-cols-2 md:gap-16 lg:grid-cols-4 max-w-5xl mx-auto items-start">
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-[calc(50%-1.5rem)] -mt-4 bg-gradient-to-r from-transparent via-neutral-300 to-transparent opacity-70"></div>
                <RevealOnScroll delay={0.05}><HowItWorksStep icon={PlugZap} title="Connect" desc="Link data sources with friendly nodes." /></RevealOnScroll>
                <RevealOnScroll delay={0.15}><HowItWorksStep icon={SlidersHorizontal} title="Configure" desc="Set parameters & logic visually, no sweat!" /></RevealOnScroll>
                <RevealOnScroll delay={0.25}><HowItWorksStep icon={PlayCircle} title="Execute" desc="Run flows instantly and see the magic." /></RevealOnScroll>
                <RevealOnScroll delay={0.35}><HowItWorksStep icon={Share2} title="Share/Output" desc="Use your results wherever you need them." /></RevealOnScroll>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Features */}
        <RevealOnScroll y={60}>
          <section className="w-full py-20 md:py-28 lg:py-32 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-center text-neutral-800 mb-16 md:mb-20 lg:mb-20">
                Awesome Features Packed In
              </h2>
              <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
                <RevealOnScroll delay={0.10}><FeatureCard icon={Workflow} title="Visual Flow Builder" desc="Drag, drop, connect! Build complex pipelines without writing tons of code. It's like playing with blocks!" color="cyan" /></RevealOnScroll>
                <RevealOnScroll delay={0.18}><FeatureCard icon={Settings} title="Easy Configuration" desc="Set up HTTP requests, tweak JSON, pick fields... all with simple clicks and settings." color="lime" /></RevealOnScroll>
                <RevealOnScroll delay={0.26}><FeatureCard icon={GitBranch} title="Open & Growing" desc="Built with modern tech. We plan to add custom nodes and let the community join the fun!" color="purple" /></RevealOnScroll>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Trusted By */}
        <RevealOnScroll y={40}>
          <section className="w-full py-16 md:py-20 lg:py-20 bg-neutral-50 border-t border-neutral-200">
            <div className="px-4 md:px-6 text-center">
              <h3 className="text-sm font-semibold tracking-wider text-neutral-500 uppercase mb-8">
                Helping Teams Build Joyfully
              </h3>
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12 opacity-60">
                {[BarChart, Layers, Component, Users, CheckCircle].map((Logo, i) => (
                  <Logo key={i} className="h-8 w-auto text-neutral-500" />
                ))}
              </div>
            </div>
          </section>
        </RevealOnScroll>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 bg-white">
        <div className="mx-auto px-4 md:px-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} FlowAPI Builder. Making data flows fun! @ECM
        </div>
      </footer>
      <FlowMascotCorner message="¿Ready to build your first workflow? Click 'Launch Builder'!" />
    </div>
  );
}
