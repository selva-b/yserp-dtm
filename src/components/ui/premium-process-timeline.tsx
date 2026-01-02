"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple utility function to merge class names, replacing the need for an external file.
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- Component Props & Data Types ---

interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  duration: string;
  image: string; // URL to the image for the phone mockup
}

interface QuantumTimelineProps {
  steps?: ProcessStep[];
  defaultStep?: string;
}

// --- Default Data ---
const DEMO_STEPS: ProcessStep[] = [
  {
    id: "01",
    title: "Project Initiation",
    subtitle: "Setting Up Your Engineering Workspace",
    description: "Create your project structure with role-based access control. Upload initial drawings, define team permissions, and establish your technical documentation baseline.",
    details: ["Project Configuration", "Team Role Assignment", "Drawing Repository Setup", "Security Protocols"],
    duration: "Day 1",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&h=600&fit=crop",
  },
  {
    id: "02",
    title: "Drawing Management",
    subtitle: "Version Control & Approvals",
    description: "Upload technical drawings with automatic version tracking. Set up approval workflows for design changes and maintain complete audit trails for compliance.",
    details: ["CAD Integration", "Version Control", "Approval Workflows", "Revision Tracking"],
    duration: "Ongoing",
    image: "https://images.unsplash.com/photo-1581094794329-c8112e2e7b7a?w=300&h=600&fit=crop",
  },
  {
    id: "03",
    title: "Team Coordination",
    subtitle: "Task & Ticket Management",
    description: "Assign tasks across teams, track progress in real-time, and manage technical issues with integrated ticket system. Keep everyone aligned with automated notifications.",
    details: ["Task Assignment", "Progress Tracking", "Issue Resolution", "Team Notifications"],
    duration: "Daily",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=600&fit=crop",
  },
  {
    id: "04",
    title: "Project Delivery",
    subtitle: "Final Approvals & Handover",
    description: "Complete final drawing approvals, generate comprehensive audit reports, and deliver documentation packages with full traceability and compliance records.",
    details: ["Final Approvals", "Audit Reports", "Documentation Handover", "Compliance Records"],
    duration: "Project Close",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=600&fit=crop",
  },
];


// --- Main Timeline Component ---

export const QuantumTimeline = ({ steps = DEMO_STEPS, defaultStep }: QuantumTimelineProps) => {
  const [activeStep, setActiveStep] = useState(defaultStep || steps[0]?.id);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeStepData = steps.find(step => step.id === activeStep);
  const activeIndex = steps.findIndex(step => step.id === activeStep);

  // Auto-advance to next step every 5 seconds
  React.useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveStep(currentStep => {
        const currentIndex = steps.findIndex(step => step.id === currentStep);
        const nextIndex = (currentIndex + 1) % steps.length;
        return steps[nextIndex].id;
      });
    }, 5000); // Change step every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, steps]);

  // Pause auto-play when user interacts
  const handleStepClick = (stepId: string) => {
    setActiveStep(stepId);
    setIsAutoPlaying(false);

    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 lg:py-20 font-sans bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h5 className="text-xs md:text-sm uppercase tracking-wide text-blue-400 mb-3 md:mb-4">How It Works</h5>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-4 md:mb-6">
            Streamlined <span className="text-blue-500">Engineering Workflow</span>
          </h2>
          <p className="mx-auto max-w-3xl text-sm md:text-base lg:text-lg text-slate-400 leading-relaxed">
            From project initiation to final delivery, manage your entire engineering lifecycle with precision.
            Our platform guides you through each phase with powerful tools and automation.
          </p>
        </div>

        {/* Top Navigation */}
        <TimelineNav steps={steps} activeStep={activeStep} onStepClick={handleStepClick} isAutoPlaying={isAutoPlaying} />

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeStepData && (
            <motion.div
              key={activeStepData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 md:mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16"
            >
              <TimelineContent step={activeStepData} />
              <TimelinePhoneMockup image={activeStepData.image} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Timeline */}
        <BottomTimeline steps={steps} activeIndex={activeIndex} onStepClick={handleStepClick} />
      </div>
    </div>
  );
};

// --- Sub-components ---

const TimelineNav = ({ steps, activeStep, onStepClick, isAutoPlaying }: { steps: ProcessStep[], activeStep: string, onStepClick: (id: string) => void, isAutoPlaying: boolean }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 md:mb-10">
    <div className="flex items-center gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg md:text-xl relative">
        Y
        {isAutoPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>
      <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">Project Workflow</span>
    </div>
    <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-full w-full sm:w-auto overflow-x-auto">
      {steps.map(step => (
        <button
          key={step.id}
          onClick={() => onStepClick(step.id)}
          className={cn(
            "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0",
            activeStep === step.id
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-400 hover:bg-slate-700/50"
          )}
        >
          {step.id}
        </button>
      ))}
    </div>
  </div>
);

const TimelineContent = ({ step }: { step: ProcessStep }) => (
  <div className="flex flex-col justify-center">
    <span className="text-xs md:text-sm font-bold text-blue-400">{step.id}</span>
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-2 text-white leading-tight">{step.title}</h2>
    <p className="mt-2 text-sm md:text-base text-slate-400">{step.subtitle}</p>
    <p className="mt-4 md:mt-6 text-sm md:text-base leading-relaxed text-slate-300">{step.description}</p>
    <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {step.details.map((detail, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</div>
          <span className="text-xs md:text-sm text-slate-300">{detail}</span>
        </div>
      ))}
    </div>
    <div className="mt-6 md:mt-8 flex items-center gap-3 p-3 md:p-4 bg-slate-800 rounded-lg">
      <span className="text-blue-400 text-lg">⏳</span>
      <span className="text-xs md:text-sm font-semibold text-slate-300">Duration: {step.duration}</span>
    </div>
  </div>
);

const TimelinePhoneMockup = ({ image }: { image: string }) => (
    <div className="flex items-center justify-center py-8 lg:py-0">
        <div className="w-56 h-[448px] sm:w-64 sm:h-[512px] md:w-72 md:h-[576px] bg-slate-800 rounded-[32px] md:rounded-[40px] p-3 md:p-4 border-4 border-slate-700 shadow-2xl">
            <div className="w-full h-full bg-black rounded-[20px] md:rounded-[24px] overflow-hidden">
                <img src={image} alt="App Screenshot" className="w-full h-full object-cover" />
            </div>
        </div>
    </div>
);


const BottomTimeline = ({ steps, activeIndex, onStepClick }: { steps: ProcessStep[], activeIndex: number, onStepClick: (id: string) => void }) => (
  <div className="mt-12 md:mt-16 lg:mt-20">
    <div className="relative w-full h-1 bg-slate-800 rounded-full">
      <motion.div
        className="absolute h-1 bg-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-3 h-3 md:w-4 md:h-4 -top-1 md:-top-1.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
        initial={{ left: '0%' }}
        animate={{ left: `calc(${(activeIndex / (steps.length - 1)) * 100}% - 0.5rem)` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
    <div className="mt-4 md:mt-6 grid grid-cols-4 gap-2">
      {steps.map((step, i) => (
        <button key={step.id} onClick={() => onStepClick(step.id)} className="text-center">
          <span className={cn(
            "text-xs md:text-sm font-semibold transition-colors block",
            i <= activeIndex ? "text-blue-400" : "text-slate-500"
          )}>
            {step.id}
          </span>
          <p className={cn(
            "text-[10px] md:text-xs mt-1 transition-colors",
            i <= activeIndex ? "text-slate-300" : "text-slate-600"
          )}>
            {step.title.split(' ')[0]}
          </p>
        </button>
      ))}
    </div>
  </div>
);
