'use client'; // Keep client for potential future interactions

import Link from 'next/link';
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
import Image from 'next/image';
// Helper component for feature cards - Cartoon Style
const FeatureCard = ({ icon: Icon, title, desc, color, delay }: { icon: React.ElementType, title: string, desc: string, color: string, delay: string }) => (
  <div 
    className={cn(
      `relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-neutral-800`, // Changed border style
      `bg-white shadow-lg`, // Changed background and shadow
      `transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group`, 
      `animate-fade-in-up` // Keeping fade-in animation
    )}
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    {/* Simplified Icon container */}
    <div className={cn(`mb-4 rounded-lg p-3`, color === 'cyan' ? 'bg-cyan-100' : color === 'lime' ? 'bg-lime-100' : 'bg-purple-100')}>
      <Icon className={cn(`h-7 w-7 group-hover:scale-110 transition-transform duration-300`, color === 'cyan' ? 'text-cyan-700' : color === 'lime' ? 'text-lime-700' : 'text-purple-700')} />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-neutral-800">{title}</h3> {/* Changed text color */}
    <p className="text-neutral-600 text-sm leading-relaxed"> {/* Changed text color */}
      {desc}
    </p>
  </div>
);

// Helper for How It Works steps - Cartoon Style
const HowItWorksStep = ({ icon: Icon, title, desc, delay }: { icon: React.ElementType, title: string, desc: string, delay: string }) => (
  <div 
    className="flex flex-col items-center text-center animate-fade-in-up"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    {/* Simplified Icon container */}
    <div className="mb-4 rounded-xl p-4 bg-blue-100 border-2 border-neutral-800 shadow-sm">
      <Icon className="h-8 w-8 text-blue-600" />
    </div>
    <h4 className="text-lg font-semibold mb-1 text-neutral-800">{title}</h4> {/* Changed text color */}
    <p className="text-sm text-neutral-500">{desc}</p> {/* Changed text color */}
  </div>
);

export default function LandingPage() {
  return (
    // Changed overall background and text colors
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 text-neutral-800 overflow-x-hidden font-sans"> 
      {/* Removed complex background animation */}
      
      {/* Header - Light Theme */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto h-16 flex items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            {/* Revert to text logo: "FlowAPI" */}
            <span className="font-bold text-xl text-blue-700 tracking-tight group-hover:text-blue-800 transition-colors">
              FlowAPI
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                // Adjusted button style for light theme
                className="text-neutral-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Go to App
                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section - Cartoon Style */}
        <section className="relative w-full pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32 overflow-hidden"> 
          {/* Simple subtle background shapes */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
             <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl opacity-50 -translate-x-1/4"></div>
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl opacity-50 translate-x-1/4"></div>
          </div>
          
          {/* Container */}
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            {/* Grid for two columns */}
            <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center"> 
              
              {/* Column 1: Text Content */}
              <div 
                className="space-y-6 text-left animate-fade-in-up"
                style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
              >
                {/* Adjusted Title Style */}
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem] leading-tight text-neutral-900"> 
                  Build Data Flows, <span className="text-blue-600">Visually!</span> 
                </h1>
                {/* Adjusted Paragraph Style */}
                <p className="text-lg text-neutral-600 md:text-xl max-w-xl">
                  Connect APIs, transform data, and automate workflows with our fun and intuitive node-based builder. Make development playful!
                </p>
                {/* Adjusted Buttons Style */}
                <div 
                  className="flex flex-col sm:flex-row gap-4 justify-start pt-6 animate-fade-in-up" 
                  style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                >
                  <Link href="/dashboard">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg border-2 border-neutral-800 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5 px-8 py-3 text-base font-semibold group w-full sm:w-auto rounded-xl" // Cartoon button style
                    >
                      Launch Builder 
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 hover:border-neutral-900 transition-all duration-300 transform hover:scale-103 px-8 py-3 text-base w-full sm:w-auto rounded-xl font-semibold" // Cartoon outline button
                  >
                    View Docs (Soon!)
                  </Button>
                </div>
              </div>

              {/* Column 2: Visual Placeholder - Cartoon Style */}
              <div 
                className="relative mt-12 lg:mt-0 animate-fade-in-up"
                style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
              >
                {/* Placeholder for Cartoon Illustration */}
                <div className="relative aspect-video rounded-2xl group overflow-hidden bg-gradient-to-br from-cyan-100 to-purple-100 border-2 border-neutral-800 shadow-lg p-2">
                  {/* Container for the image, removing centering flex/p tag and adding position relative for fill */}
                  <div className="relative z-10 w-full h-full bg-white/70 rounded-lg backdrop-blur-sm">
                    <Image 
                      src="/main.png" 
                      alt="Cartoon Illustration" 
                      fill={true} // Use fill to occupy the container
                      objectFit='cover' // Change to cover to fill the space
                       // Optional padding around the image itself
                    />
                  </div>
                   {/* Optional subtle decoration */}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works Section - Light Theme */} 
        <section className="w-full py-20 md:py-28 lg:py-28 bg-blue-50/50 border-y border-neutral-200"> 
          <div className="px-4 md:px-6">
            <h2 
              className="text-3xl font-bold tracking-tight text-center text-neutral-800 mb-16 md:mb-20 lg:mb-20 animate-fade-in-up" // Adjusted color and margin
              style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
            >
              How It Works: Easy as 1-2-3-4!
            </h2>
             {/* Adjusted connecting lines for light theme */}
            <div className="relative grid gap-12 md:grid-cols-2 md:gap-16 lg:grid-cols-4 max-w-5xl mx-auto items-start">
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-[calc(50%-1.5rem)] -mt-4 bg-gradient-to-r from-transparent via-neutral-300 to-transparent opacity-70"></div>
              
              <HowItWorksStep icon={PlugZap} title="Connect" desc="Link data sources with friendly nodes." delay="0.8s" />
              <HowItWorksStep icon={SlidersHorizontal} title="Configure" desc="Set parameters & logic visually, no sweat!" delay="1.0s" />
              <HowItWorksStep icon={PlayCircle} title="Execute" desc="Run flows instantly and see the magic." delay="1.2s" />
              <HowItWorksStep icon={Share2} title="Share/Output" desc="Use your results wherever you need them." delay="1.4s" />
            </div>
          </div>
        </section>

        {/* Features Section - Light Theme */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-white"> 
          <div className="container px-4 md:px-6 mx-auto">
            <h2 
              className="text-3xl font-bold tracking-tight text-center text-neutral-800 mb-16 md:mb-20 lg:mb-20 animate-fade-in-up" 
              style={{ animationDelay: '1.6s', animationFillMode: 'both' }}
            >
              Awesome Features Packed In
            </h2>
            <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 max-w-6xl mx-auto"> {/* Adjusted max-width */}
              <FeatureCard 
                icon={Workflow} 
                title="Visual Flow Builder" 
                desc="Drag, drop, connect! Build complex pipelines without writing tons of code. It's like playing with blocks!"
                color="cyan"
                delay="1.8s"
              />
              <FeatureCard 
                icon={Settings} 
                title="Easy Configuration" 
                desc="Set up HTTP requests, tweak JSON, pick fields... all with simple clicks and settings."
                color="lime"
                delay="2.0s"
              />
              <FeatureCard 
                icon={GitBranch} 
                title="Open & Growing" 
                desc="Built with modern tech. We plan to add custom nodes and let the community join the fun!"
                color="purple"
                delay="2.2s"
              />
            </div>
          </div>
        </section>

        {/* Trusted By Section - Simplified Light Theme */}
        <section className="w-full py-16 md:py-20 lg:py-20 bg-neutral-50 border-t border-neutral-200"> 
           <div className="px-4 md:px-6 text-center">
             <h3 className="text-sm font-semibold tracking-wider text-neutral-500 uppercase mb-8 animate-fade-in-up" style={{ animationDelay: '2.4s', animationFillMode: 'both' }}>
               Helping Teams Build Joyfully
             </h3>
             <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12 opacity-60 animate-fade-in-up" style={{ animationDelay: '2.6s', animationFillMode: 'both' }}> 
               {[BarChart, Layers, Component, Users, CheckCircle].map((Logo, i) => (
                 <Logo key={i} className="h-8 w-auto text-neutral-500" /> // Adjusted color
               ))}
             </div>
           </div>
         </section>

      </main>

      {/* Footer - Light Theme */}
      <footer className="border-t border-neutral-200 py-6 bg-white"> 
        <div className="mx-auto px-4 md:px-6 text-center text-sm text-neutral-500"> 
          © {new Date().getFullYear()} FlowAPI Builder. Making data flows fun! @ECM
        </div>
      </footer>
    </div>
  );
}
