"use client";

import { useEffect } from 'react';
import { HeroSection } from '@/components/ui/hero-section-5';
import { HeroOrbitDeck } from '@/components/ui/hero-modern';
import { QuantumTimeline } from '@/components/ui/premium-process-timeline';
import TestimonialV2 from '@/components/ui/testimonial-v2';
import HoverFooter from '@/components/website/HoverFooter';
import GetInTouch from '@/components/website/GetInTouch';
import ScrollRevealSection from '@/components/ui/scroll-reveal-section';
import FeaturesDetail from '@/components/ui/features-detail';

export default function WebsiteHomePage() {
  // Scroll to top on page load/refresh - with multiple strategies
  useEffect(() => {
    // Strategy 1: Immediate scroll
    window.scrollTo(0, 0);

    // Strategy 2: Disable scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Strategy 3: Force scroll after component mount
    const forceScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    forceScroll();

    // Strategy 4: Ensure scroll after a brief delay (for any async content)
    const timeoutId = setTimeout(forceScroll, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full ">
        {/* Hero Section with Header */}
        <HeroSection />

        {/* Modern Hero Deck Section */}
        <HeroOrbitDeck />

        {/* Scroll Reveal Section */}
        <ScrollRevealSection />

        {/* Features Detail Section */}
        <FeaturesDetail />

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
