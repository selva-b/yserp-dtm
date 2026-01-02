"use client";

import { useEffect } from 'react';
import { HeroSection } from '@/components/ui/hero-section-5';
import { HeroOrbitDeck } from '@/components/ui/hero-modern';
import { QuantumTimeline } from '@/components/ui/premium-process-timeline';
import TestimonialV2 from '@/components/ui/testimonial-v2';
import HoverFooter from '@/components/website/HoverFooter';
import GetInTouch from '@/components/website/GetInTouch';

export default function WebsiteHomePage() {
  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full ">
        {/* Hero Section with Header */}
        <HeroSection />

        {/* Modern Hero Deck Section */}
        <HeroOrbitDeck />

        {/* Process Timeline Section */}
        {/* <QuantumTimeline /> */}

        {/* Testimonials Section */}
        <TestimonialV2 />
        {/* Get In Touch Section */}
        <GetInTouch />

        {/* Footer Section */}
        <HoverFooter />
    </div>
  );
}
