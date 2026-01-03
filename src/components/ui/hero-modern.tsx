import React, { useEffect, useMemo, useRef, useState } from "react";

const STYLE_ID = "hero3-animations";

const DeckGlyph = ({ theme = "dark" }: { theme?: string }) => {
  const stroke = theme === "dark" ? "#f5f5f5" : "#111111";
  const fill = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(17,17,17,0.08)";

  return (
    <svg viewBox="0 0 120 120" className="h-16 w-16" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        className="motion-safe:animate-[hero3-orbit_8.5s_linear_infinite] motion-reduce:animate-none"
        style={{ strokeDasharray: "18 14" }}
      />
      <rect
        x="34"
        y="34"
        width="52"
        height="52"
        rx="14"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        className="motion-safe:animate-[hero3-grid_5.4s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <circle cx="60" cy="60" r="7" fill={stroke} />
      <path
        d="M60 30v10M60 80v10M30 60h10M80 60h10"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        className="motion-safe:animate-[hero3-pulse_6s_ease-in-out_infinite] motion-reduce:animate-none"
      />
    </svg>
  );
};

function HeroOrbitDeck() {
  const theme = "dark"; // Force dark theme
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("strategy");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      @keyframes hero3-intro {
        0% { opacity: 0; transform: translate3d(0, 64px, 0) scale(0.98); filter: blur(12px); }
        60% { filter: blur(0); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
      }
      @keyframes hero3-card {
        0% { opacity: 0; transform: translate3d(0, 32px, 0) scale(0.95); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      }
      @keyframes hero3-orbit {
        0% { stroke-dashoffset: 0; transform: rotate(0deg); }
        100% { stroke-dashoffset: -64; transform: rotate(360deg); }
      }
      @keyframes hero3-grid {
        0%, 100% { transform: rotate(-2deg); opacity: 0.7; }
        50% { transform: rotate(2deg); opacity: 1; }
      }
      @keyframes hero3-pulse {
        0%, 100% { stroke-dasharray: 0 200; opacity: 0.2; }
        45%, 60% { stroke-dasharray: 200 0; opacity: 1; }
      }
      @keyframes hero3-glow {
        0%, 100% { opacity: 0.45; transform: translate3d(0,0,0); }
        50% { opacity: 0.9; transform: translate3d(0,-8px,0); }
      }
      @keyframes hero3-drift {
        0%, 100% { transform: translate3d(0,0,0) rotate(-3deg); }
        50% { transform: translate3d(0,-12px,0) rotate(3deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current || typeof window === "undefined") {
      setVisible(true);
      return;
    }

    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const palette = useMemo(
    () => ({
      surface: "bg-black text-white",
      subtle: "text-white/60",
      border: "border-white/12",
      card: "bg-white/6",
      accent: "bg-white/12",
      glow: "rgba(255,255,255,0.14)",
      background: {
        color: "#000000",
        layers: [
          "radial-gradient(ellipse 80% 60% at 10% -10%, rgba(255,255,255,0.08), transparent 60%)",
          "radial-gradient(ellipse 90% 70% at 90% -20%, rgba(120,120,120,0.06), transparent 70%)",
        ],
        dots:
          "radial-gradient(circle at 25% 25%, rgba(250,250,250,0.04) 0.7px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(250,250,250,0.04) 0.7px, transparent 1px)",
      },
    }),
    []
  );

  const metrics = [
    { label: "Project Speed", value: "3x" },
    { label: "Active Users", value: "2K+" },
    { label: "Uptime", value: "99.9%" },
  ];

  const modes = useMemo(
    () => ({
      strategy: {
        title: "Project Planning",
        description:
          "Streamline your engineering workflows from bidding to delivery. Centralize project documentation, drawings, and technical specifications with audit-grade security.",
        items: [
          "Bid management and proposal tracking",
          "Drawing version control and approvals",
          "Project milestone and timeline mapping",
        ],
      },
      execution: {
        title: "Team Execution",
        description:
          "Coordinate distributed teams with real-time task tracking, timesheet management, and issue resolution. Keep technical operations visible and accountable.",
        items: [
          "Task assignment and progress tracking",
          "Timesheet automation and reporting",
          "Ticket and issue escalation workflow",
        ],
      },
    }),
    []
  );

  const activeMode = modes[mode as keyof typeof modes];

  const protocols = [
    {
      name: "Project Setup",
      detail: "Create project structure, upload drawings, define roles and permissions.",
      status: "Ready",
    },
    {
      name: "Team Sync",
      detail: "Assign tasks, track progress, coordinate multi-discipline workflows.",
      status: "Active",
    },
    {
      name: "Delivery",
      detail: "Final approvals, document handover, audit trail generation in real-time.",
      status: "Live",
    },
  ];

  const setSpotlight = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--hero3-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--hero3-y", `${event.clientY - rect.top}px`);
  };

  const clearSpotlight = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    target.style.removeProperty("--hero3-x");
    target.style.removeProperty("--hero3-y");
  };

  const showcaseImage = {
    src: "https://assets.awwwards.com/awards/submissions/2025/04/67efc5b712cba086181804.png",
    alt: "Engineering technical drawing and blueprint documentation",
  };

  return (
    <div className={`relative isolate min-h-screen w-full transition-colors duration-700 ${palette.surface}`}>
      <div
        className="pointer-events-none absolute inset-0 -z-30"
        style={{
          backgroundColor: palette.background.color,
          backgroundImage: palette.background.layers.join(", "),
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-80"
        style={{
          backgroundImage: palette.background.dots,
          backgroundSize: "12px 12px",
          backgroundRepeat: "repeat",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(60% 50% at 50% 10%, rgba(255,255,255,0.08), transparent 70%)",
          filter: "blur(22px)",
        }}
      />

      <section
        ref={sectionRef}
        className={`relative flex min-h-screen w-full flex-col gap-16 px-6 py-24 transition-opacity duration-700 md:gap-20 md:px-10 lg:px-16 xl:px-24 ${
          visible ? "motion-safe:animate-[hero3-intro_1s_cubic-bezier(.22,.68,0,1)_forwards]" : "opacity-0"
        }`}
      >
        {/* Section Heading */}
        <div className="text-center space-y-4 md:space-y-6">
          <h5 className="text-xs md:text-sm uppercase tracking-wide text-blue-400">Platform Overview</h5>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white">
            Powerful Features for <span className="text-blue-500">Engineering Teams</span>
          </h2>
          <p className="mx-auto max-w-3xl text-sm md:text-base lg:text-lg text-slate-400 leading-relaxed">
            Explore comprehensive tools designed to streamline your technical workflows, from project initiation to final delivery.
          </p>
        </div>

        <header className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] ${palette.border} ${palette.accent}`}>
                VARAI Platform
              </span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Complete Engineering & Technical Management Platform
              </h1>
              <p className={`max-w-2xl text-base md:text-lg ${palette.subtle}`}>
                Streamline your engineering workflows from bidding to delivery. Manage projects, drawings, tickets, tasks, and timesheets with enterprise-grade security and precision.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={`inline-flex flex-wrap gap-3 rounded-full border px-5 py-3 text-xs uppercase tracking-[0.3em] transition ${palette.border} ${palette.accent}`}>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  System Active
                </span>
                <span className="opacity-60">∙</span>
                <span>Enterprise Ready</span>
              </div>
              <div className={`flex divide-x divide-white/10 overflow-hidden rounded-full border text-xs uppercase tracking-[0.35em] ${palette.border}`}>
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col px-5 py-3">
                    <span className={`text-[11px] ${palette.subtle}`}>{metric.label}</span>
                    <span className="text-lg font-semibold tracking-tight">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`relative flex flex-col gap-6 rounded-3xl border p-8 transition ${palette.border} ${palette.card}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em]">Mode</p>
                <h2 className="text-xl font-semibold tracking-tight">{activeMode.title}</h2>
              </div>
              <DeckGlyph theme={theme} />
            </div>
            <p className={`text-sm leading-relaxed ${palette.subtle}`}>{activeMode.description}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("strategy")}
                className={`flex-1 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                  mode === "strategy" ? "bg-white text-black" : `${palette.border} ${palette.accent}`
                }`}
              >
                Strategy
              </button>
              <button
                type="button"
                onClick={() => setMode("execution")}
                className={`flex-1 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                  mode === "execution" ? "bg-white text-black" : `${palette.border} ${palette.accent}`
                }`}
              >
                Execution
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {activeMode.items.map((item) => (
                <li key={item} className={`flex items-start gap-3 ${palette.subtle}`}>
                  <span className="mt-1 h-2 w-2 rounded-full bg-current" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] xl:items-stretch">
          <div className={`order-2 flex flex-col gap-6 rounded-3xl border p-8 transition ${palette.border} ${palette.card} xl:order-1`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.35em]">Core Features</h3>
              <span className="text-xs uppercase tracking-[0.35em] opacity-60">v2.1</span>
            </div>
            <p className={`text-sm leading-relaxed ${palette.subtle}`}>
              Built for engineering teams that demand precision. Manage the entire project lifecycle with integrated tools for drawings, tasks, tickets, and comprehensive audit trails.
            </p>
            <div className="grid gap-3">
              {["Drawing version control", "Real-time collaboration", "Audit-grade security"].map((item) => (
                <div key={item} className="relative overflow-hidden rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.3em] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
                  <span>{item}</span>
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 hover:opacity-100" style={{ background: `radial-gradient(180px circle at 50% 20%, ${palette.glow}, transparent 70%)` }} />
                </div>
              ))}
            </div>
          </div>

                    <figure className="group order-1 overflow-hidden rounded-[32px] border transition-all duration-700 hover:scale-[1.01] hover:shadow-[0_25px_70px_rgba(255,255,255,0.15)] hover:border-white/30 xl:order-2 relative" style={{ position: "relative" }}>
            <div className="relative w-full pb-[120%] sm:pb-[90%] lg:pb-[72%] overflow-hidden">
              <video
                src="/website/illustrations/video/vi1.mp4"
                className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-[1.05] group-hover:grayscale-0"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                disablePictureInPicture
                disableRemotePlayback
                style={{ willChange: 'auto' }}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-70" />
              <div className="pointer-events-none absolute inset-0 border border-white/20 mix-blend-overlay transition-all duration-700 group-hover:border-white/40" />
              <span className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-full border border-white/15 opacity-70 motion-safe:animate-[hero3-glow_9s_ease-in-out_infinite] transition-opacity duration-700 group-hover:opacity-100" />
              <span className="pointer-events-none absolute -right-12 bottom-16 h-48 w-48 rounded-full border border-white/10 opacity-40 motion-safe:animate-[hero3-drift_12s_ease-in-out_infinite] transition-opacity duration-700 group-hover:opacity-70" />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
            </div>
            <figcaption className={`flex items-center justify-between px-6 py-5 text-xs uppercase tracking-[0.35em] ${palette.subtle} transition-all duration-500 group-hover:text-white bg-black/20 backdrop-blur-sm`}>
              <span className="transition-all duration-500 group-hover:translate-x-1">Technical Drawing</span>
              <span className="flex items-center gap-2 transition-all duration-500 group-hover:-translate-x-1">
                <span className="h-1 w-8 bg-current transition-all duration-500 group-hover:w-12 group-hover:shadow-[0_0_8px_currentColor]" />
                Engineering Grade
              </span>
            </figcaption>
          </figure>

          <aside className={`order-3 flex flex-col gap-6 rounded-3xl border p-8 transition ${palette.border} ${palette.card} xl:order-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.35em]">Workflow Stages</h3>
              <span className="text-xs uppercase tracking-[0.35em] opacity-60">Tracked</span>
            </div>
            <ul className="space-y-4">
              {protocols.map((protocol, index) => (
                <li
                  key={protocol.name}
                  onMouseMove={setSpotlight}
                  onMouseLeave={clearSpotlight}
                  className="group relative overflow-hidden rounded-2xl border px-5 py-4 transition duration-500 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                    style={{
                      background: "radial-gradient(190px circle at var(--hero3-x, 50%) var(--hero3-y, 50%), rgba(255,255,255,0.18), transparent 72%)",
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.25em]">{protocol.name}</h4>
                    <span className="text-[10px] uppercase tracking-[0.35em] opacity-70">{protocol.status}</span>
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed ${palette.subtle}`}>{protocol.detail}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default HeroOrbitDeck;
export { HeroOrbitDeck };
