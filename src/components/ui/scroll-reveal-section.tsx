"use client";

import React from 'react';
import ScrollReveal from './ScrollReveal';

export function ScrollRevealSection() {
  return (
    <section className="relative w-full py-24 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={10}
          containerClassName="max-w-5xl mx-auto"
          textClassName="text-white text-center"
        >
          Transform your engineering workflow from chaos to clarity. Manage every detail from bidding to delivery, track every drawing revision, and maintain audit-grade security across your entire technical documentation lifecycle.
        </ScrollReveal>
      </div>
    </section>
  );
}

export default ScrollRevealSection;
