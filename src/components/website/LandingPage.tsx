"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import SecurityCamera from "@/components/website/SecurityCamera";
import CardSwap, { Card } from "@/components/website/CardSwap";
import { cn } from "@/lib/utils";

// Dynamically import GridScan to avoid SSR issues with Three.js
const GridScan = dynamic(() => import("@/components/website/GridScan").then(mod => mod.GridScan), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-black" />
});

// Reusable ScrollGlobe component following shadcn/ui patterns
interface ScrollGlobeProps {
  sections: {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    description: string;
    align?: 'left' | 'center' | 'right';
    features?: { title: string; description: string }[];
    actions?: { label: string; variant: 'primary' | 'secondary'; onClick?: () => void }[];
    image?: {
      url: string;
      alt: string;
      position?: 'left' | 'right' | 'top' | 'bottom';
    };
  }[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Hero: Right side, balanced
    { top: "25%", left: "50%", scale: 0.9 },  // Innovation: Top side, subtle
    { top: "15%", left: "90%", scale: 2 },  // Discovery: Left side, medium
    { top: "50%", left: "50%", scale: 1.8 },  // Future: Center, large backdrop
  ]
};

// Parse percentage string to number
const parsePercent = (str: string): number => parseFloat(str.replace('%', ''));

function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameId = useRef<number>();
  const navLabelTimeoutRef = useRef<NodeJS.Timeout>();

  // Pre-calculate positions for performance
  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  // Simple, direct scroll tracking
  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

    setScrollProgress(progress);

    // Simple section detection
    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    // Direct position update - no interpolation
    const currentPos = calculatedPositions[newActiveSection];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;

    setGlobeTransform(transform);

    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  // Throttled scroll handler with RAF
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listeners and immediate execution
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (navLabelTimeoutRef.current) {
        clearTimeout(navLabelTimeoutRef.current);
      }
    };
  }, [updateScrollPosition]);

  // Initial globe position
  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-black text-white",
        className
      )}
    >
      {/* GridScan Background - Interactive 3D Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#1e293b"
          gridScale={0.15}
          scanColor="#3b82f6"
          scanOpacity={0.3}
          enablePost={true}
          bloomIntensity={0.4}
          chromaticAberration={0.001}
          noiseIntensity={0.005}
          scanDirection="pingpong"
          scanDuration={3.0}
          scanDelay={1.5}
          scanSoftness={1.5}
          scanPhaseTaper={0.8}
        />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gray-800/20 via-gray-700/40 to-gray-800/20 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 will-change-transform shadow-sm"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.15s ease-out',
            filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))'
          }}
        />
      </div>

      {/* Enhanced Navigation with auto-hiding labels - Fully Responsive */}
      <div className="hidden sm:flex fixed right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              {/* Auto-hiding section label - Always visible but with responsive sizing */}
              <div
                className={cn(
                  "nav-label absolute right-5 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2",
                  "px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap",
                  "bg-gray-900/95 backdrop-blur-md border border-gray-700/60 shadow-xl z-50 text-white",
                  activeSection === index ? "animate-fadeOut" : "opacity-0"
                )}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                  <div className="w-1 sm:w-1.5 lg:w-2 h-1 sm:h-1.5 lg:h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs sm:text-sm lg:text-base">
                    {section.badge || `Section ${index + 1}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className={cn(
                  "relative w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                  activeSection === index
                    ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50 before:animate-ping before:bg-blue-500/20"
                    : "bg-transparent border-gray-600/40 hover:border-blue-500/60 hover:bg-blue-500/10"
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>

        {/* Enhanced navigation line - Responsive */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 lg:w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent -translate-x-1/2 -z-10" />
      </div>

      {/* Ultra-smooth SecurityCamera with GSAP scroll animation */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeTransform,
          filter: `opacity(${activeSection === 0 ? 0.85 : 0.9})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <SecurityCamera
            imageSrc={sections[activeSection]?.image?.url || "/website/illustrations/image1.png"}
            imageAlt={sections[activeSection]?.image?.alt || "Technical Drawings & Engineering"}
          />
        </div>
      </div>

      {/* CardSwap Component - positioned in bottom right */}
      {/* <div className="fixed bottom-0 right-0 z-30 pointer-events-auto" style={{ height: '600px', width: '600px' }}>
        <CardSwap
          width={400}
          height={300}
          cardDistance={60}
          verticalDistance={70}
          delay={5000}
          pauseOnHover={true}
          easing="elastic"
        >
          <Card>
            <div className="w-full h-full p-6 bg-gradient-to-br from-blue-900/90 to-blue-950/90 backdrop-blur-md flex flex-col justify-center items-center text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Project Management</h3>
              <p className="text-gray-300 text-sm">Complete project lifecycle management with real-time tracking</p>
            </div>
          </Card>
          <Card>
            <div className="w-full h-full p-6 bg-gradient-to-br from-purple-900/90 to-purple-950/90 backdrop-blur-md flex flex-col justify-center items-center text-center">
              <div className="text-4xl mb-3">📐</div>
              <h3 className="text-xl font-bold text-white mb-2">Drawing Management</h3>
              <p className="text-gray-300 text-sm">Version control and approval workflows for technical drawings</p>
            </div>
          </Card>
          <Card>
            <div className="w-full h-full p-6 bg-gradient-to-br from-cyan-900/90 to-cyan-950/90 backdrop-blur-md flex flex-col justify-center items-center text-center">
              <div className="text-4xl mb-3">⏱️</div>
              <h3 className="text-xl font-bold text-white mb-2">Time Tracking</h3>
              <p className="text-gray-300 text-sm">Accurate timesheet management with approval workflows</p>
            </div>
          </Card>
          <Card>
            <div className="w-full h-full p-6 bg-gradient-to-br from-green-900/90 to-green-950/90 backdrop-blur-md flex flex-col justify-center items-center text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Task Management</h3>
              <p className="text-gray-300 text-sm">Assign and track tasks with priority-based workflows</p>
            </div>
          </Card>
          <Card>
            <div className="w-full h-full p-6 bg-gradient-to-br from-orange-900/90 to-orange-950/90 backdrop-blur-md flex flex-col justify-center items-center text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics & Reports</h3>
              <p className="text-gray-300 text-sm">Comprehensive reporting and data visualization tools</p>
            </div>
          </Card>
        </CardSwap>
      </div> */}

      {/* Dynamic sections - fully responsive */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 z-20 pt-8 sm:pt-12 lg:pt-16 pb-32 sm:pb-40 lg:pb-48",
            "w-full max-w-full overflow-hidden",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            section.align !== 'center' && section.align !== 'right' && "items-start text-left"
          )}
        >
          <div className={cn(
            "w-full will-change-transform transition-all duration-700",
            "opacity-100 translate-y-0",
            index === 0 ? "max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl" : "max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl"
          )}>

            <h1 className={cn(
              "font-bold mb-3 sm:mb-4 leading-[1.1]",
              index === 0
                ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
                : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
            )}>
              {section.subtitle ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className={cn(
                    "relative inline-block",
                    index === 0 ? "tracking-tight" : "tracking-tight"
                  )}>
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent font-extrabold">
                      {section.title}
                    </span>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-500/20 blur-2xl -z-10" />
                  </div>
                  <div className="relative inline-block">
                    <span className="bg-gradient-to-r from-gray-200 via-white to-gray-300 bg-clip-text text-transparent text-[0.55em] sm:text-[0.6em] font-semibold tracking-[0.2em] uppercase">
                      {section.subtitle}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent font-extrabold">
                    {section.title}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-500/20 blur-2xl -z-10" />
                </div>
              )}
            </h1>

            <div className={cn(
              "text-gray-300 leading-relaxed text-base sm:text-lg lg:text-xl font-light",
              section.image ? "mb-8 sm:mb-12" : "mb-4 sm:mb-6",
              section.align === 'center' ? "max-w-full mx-auto text-center" : "max-w-full"
            )}>
              <p className="mb-2 sm:mb-3">{section.description}</p>
              {index === 0 && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 pb-8">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    <span>Interactive Experience</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span>Scroll to Explore</span>
                  </div>
                </div>
              )}
            </div>

            {/* Placeholder space for Robot3D positioning */}
            {section.image && (
              <div className={cn(
                "mb-8 sm:mb-12 mt-12 sm:mt-16 lg:mt-20",
                section.image.position === 'top' && "order-first mb-6 sm:mb-8",
                section.image.position === 'bottom' && "order-last mt-16 sm:mt-20 lg:mt-24"
              )}>
                <div className="relative w-full h-[450px] sm:h-[550px] lg:h-[650px]">
                  {/* Robot3D will float here via GSAP animation */}
                </div>
              </div>
            )}

            {/* Enhanced Features - Responsive 2-column grid, centered */}
            {section.features && (
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl w-full">
                  {section.features.map((feature, featureIndex) => (
                    <div
                      key={feature.title}
                      className={cn(
                        "group p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10",
                        "hover:border-blue-500/30 hover:-translate-y-1"
                      )}
                      style={{ animationDelay: `${featureIndex * 0.1}s` }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500/60 mt-1.5 sm:mt-2 group-hover:bg-blue-500 transition-colors flex-shrink-0" />
                        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                          <h3 className="font-semibold text-white text-base sm:text-lg">{feature.title}</h3>
                          <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Actions - Responsive buttons */}
            {section.actions && (
              <div className={cn(
                "flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4",
                section.align === 'center' && "justify-center",
                section.align === 'right' && "justify-end",
                (!section.align || section.align === 'left') && "justify-start"
              )}>
                {section.actions.map((action, actionIndex) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "group relative px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base",
                      "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto",
                      action.variant === 'primary'
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        : "border-2 border-gray-700/60 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50 hover:border-blue-500/30 text-white"
                    )}
                    style={{ animationDelay: `${actionIndex * 0.1 + 0.2}s` }}
                  >
                    <span className="relative z-10">{action.label}</span>
                    {action.variant === 'primary' && (
                      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ScrollGlobe;
