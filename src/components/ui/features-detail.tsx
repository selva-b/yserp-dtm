"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"


gsap.registerPlugin(ScrollTrigger)

const dashboardTabs = [
  {
    id: 1,
    title: "Bidding & Proposals",
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80",
    alt: "Bidding and Proposal Management Dashboard",
    description: "Streamline your bid process from initial RFP to final submission"
  },
  {
    id: 2,
    title: "Technical Drawings",
    src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80",
    alt: "Technical Drawing Management System",
    description: "Version control and revision tracking for all engineering drawings"
  },
  {
    id: 3,
    title: "Task & Tickets",
    src: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1600&q=80",
    alt: "Task and Ticket Management",
    description: "Assign, track, and resolve project tasks with complete traceability"
  },
  {
    id: 4,
    title: "Timesheets",
    src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=80",
    alt: "Timesheet and Resource Management",
    description: "Track billable hours and project costs with precision"
  },
  {
    id: 5,
    title: "Audit Security",
    src: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1600&q=80",
    alt: "Audit-Grade Security and Compliance",
    description: "Enterprise-level security with complete audit trails and compliance"
  }
]


export default function FeaturesDetail() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline()

    tl.fromTo(
      headingRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
      .fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        sliderRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.2"
      )
      .fromTo(
        ".hero-blur",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
        "-=1"
      )

    // Parallax effect on scroll
    gsap.to(".hero-blur", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    })

    // Auto-slide interval
    const slideInterval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => {
      tl.kill()
      clearInterval(slideInterval)
    }
  }, []);

  // Function to go to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === dashboardTabs.length - 1 ? 0 : prev + 1))
  }

  // Function to go to a specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }


  useEffect(() => {
    // Animate feature items when they come into view
    gsap.fromTo(
      ".feature-item",
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 75%",
        }
      }
    )

    // Animate tab content
    gsap.utils.toArray<HTMLElement>(".tabs-content").forEach((content) => {
      gsap.set(content, { opacity: 0, y: 20 })
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  // Handle tab change animations
  const handleTabChange = (value: string) => {
    gsap.to(".tabs-content", {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        gsap.to(`#content-${value}`, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.1
        })
      }
    })
  }

  return (
    <div ref={sectionRef} className="bg-gradient-to-b from-black via-gray-950 to-black">
      <div className="mx-auto">
        <div >
          {/* <div className="container mx-auto px-4 md:px-8">
            <h1 ref={headingRef} className="text-4xl text-left font-bold tracking-tight sm:text-5xl text-white">Complete control over <br /> every project detail</h1>
            <p ref={textRef} className="mt-4 text-lg text-gray-400 text-left max-w-3xl">From bidding to delivery, manage your entire engineering workflow in one powerful platform. Track drawings, tasks, timesheets, and maintain complete audit trails with enterprise-grade security.</p>
          </div> */}
          <div
            ref={sliderRef}
            className="relative h-[70vh] overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {dashboardTabs.map((tab, index) => {
                const position = index - currentSlide;
                const isActive = position === 0;
                const zIndex = isActive ? 30 : 20 - Math.abs(position);
                const scale = isActive ? 1 : 0.9 - Math.abs(position) * 0.05;

                const translateY = position * 15;

                return (
                  <div
                    key={tab.id}
                    className={`absolute transition-all duration-500 ease-in-out rounded-2xl border-4 ${isActive ? 'border-gray-700' : 'border-gray-800'} ${isActive ? 'shadow-2xl' : 'shadow-md'}`}
                    style={{
                      transform: `translateY(${translateY}%) scale(${scale})`,
                      zIndex
                    }}
                  >
                    <div className="relative aspect-[16/9] w-[70vw] max-w-full rounded-2xl overflow-hidden">
                    <Link href="#" target="_blank">
                      <Image
                        src={tab.src}
                        alt={tab.alt}
                        fill
                        className="object-cover"
                        priority={tab.id === 1}
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-black/5 rounded-2xl"></div>
                      )}
                    </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-8 flex-wrap px-4">
            {dashboardTabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => goToSlide(index)}
                className={`p-2 text-sm font-medium transition-all ${currentSlide === index
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"}`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
