"use client";

import ScrollGlobe from '@/components/website/LandingPage';

export default function WebsiteHomePage() {
  const yserpdtmSections = [
    {
      id: "hero",
      badge: "YSERP-DTM",
      title: "Control Drawings",
      subtitle: "& Technical Workflows",
      description: "The unified platform for engineering teams to manage bids, projects, drawings, tickets, tasks, and timesheets with audit-grade security. From intake to delivery, every step is tracked, controlled, and compliant.",
      align: "left" as const,
      actions: [
        {
          label: "Book a Demo",
          variant: "primary" as const,
          onClick: () => window.location.href = '/auth/signup'
        },
        {
          label: "Explore Features",
          variant: "secondary" as const,
          onClick: () => window.location.href = '/website/features'
        },
      ]
    },
    {
      id: "platform",
      badge: "Platform",
      title: "End-to-End Workflow",
      description: "From bidding to project completion, YSERP-DTM connects every stage of your technical workflow. Manage bids, convert to projects, track drawings with full revision history, assign tickets and tasks, and approve timesheets—all in one secure, audit-ready platform.",
      align: "right" as const,
      image: {
        url: "/website/illustrations/image.png",
        alt: "Project workflow and business process management",
        position: "bottom" as const,
      },
    },
    {
      id: "features",
      badge: "Features",
      title: "Built For",
      subtitle: "Engineering Teams",
      description: "Comprehensive tools designed specifically for technical and engineering organizations. Keep your team aligned with role-based permissions, automated workflows, and real-time visibility across every project phase.",
      align: "center" as const,
      image: {
        url: "/website/illustrations/image3.png",
        alt: "Engineering blueprints and technical drawings",
        position: "bottom" as const,
      },
      features: [
        {
          title: "Bids & Projects Management",
          description: "Structured intake, approvals, seamless handoff from estimates to execution with full traceability"
        },
        {
          title: "Drawings & Revisions Control",
          description: "Versioned drawings with Azure-backed storage, status tracking, and permission-based access"
        },
        {
          title: "Tickets, Tasks & Timesheets",
          description: "Assign work, track progress, capture time, and maintain complete accountability across teams"
        },
        {
          title: "Audit Logs & Compliance",
          description: "Every action logged with RBAC, JWT/CSRF protection, org isolation, and exportable evidence"
        }
      ]
    },
    {
      id: "technology",
      badge: "Technology",
      title: "Enterprise-Grade",
      subtitle: "Tech Stack",
      description: "Built on modern, proven technologies for reliability, performance, and security. Our stack ensures your data is safe, your workflows are fast, and your team stays productive.",
      align: "right" as const,
      image: {
        url: "/website/illustrations/image2.png",
        alt: "Modern technology dashboard with analytics and data visualization",
        position: "bottom" as const,
      },
    },
    {
      id: "security",
      badge: "Security",
      title: "Bank-Level",
      subtitle: "Security & Compliance",
      description: "Your data is protected with enterprise-grade security. Role-based access control, multi-factor authentication, encrypted at rest and in transit, with comprehensive audit trails for complete compliance.",
      align: "left" as const,
      image: {
        url: "/website/illustrations/image4.png",
        alt: "Cybersecurity and data protection concept with digital locks",
        position: "bottom" as const,
      },
    },
    {
      id: "collaboration",
      badge: "Collaboration",
      title: "Team Collaboration",
      subtitle: "Made Simple",
      description: "Enable seamless collaboration across your engineering team. Real-time updates, instant notifications, task assignments, and approval workflows keep everyone aligned and productive.",
      align: "right" as const,
      image: {
        url: "/website/illustrations/image5.png",
        alt: "Team collaboration and engineering teamwork",
        position: "bottom" as const,
      },
    },
    {
      id: "getstarted",
      badge: "Get Started",
      title: "Ready to Transform",
      subtitle: "Your Workflows?",
      description: "Join engineering organizations worldwide that trust YSERP-DTM for their drawing and technical management. Experience the power of unified workflows with audit-grade security, backed by Azure infrastructure and PostgreSQL reliability.",
      align: "center" as const,
      actions: [
        {
          label: "Start Free Trial",
          variant: "primary" as const,
          onClick: () => window.location.href = '/auth/signup'
        },
        {
          label: "View Pricing",
          variant: "secondary" as const,
          onClick: () => window.location.href = '/website/pricing'
        }
      ]
    }
  ];

  const customGlobeConfig = {
    positions: [
      { top: "50%", left: "75%", scale: 1.4 },   // Hero - Right side, mid
      { top: "65%", left: "30%", scale: 1.0 },   // Platform - Left lower (image area)
      { top: "70%", left: "50%", scale: 1.3 },   // Features - CENTER (image area)
      { top: "60%", left: "25%", scale: 1.1 },   // Technology - Left mid-lower (image area)
      { top: "68%", left: "75%", scale: 1.2 },   // Security - Right lower (image area)
      { top: "65%", left: "35%", scale: 1.2 },   // Collaboration - Left lower (image area)
      { top: "50%", left: "50%", scale: 1 },   // Get Started - Center, large
    ]
  };

  return (
    <div className="dark">
      <ScrollGlobe
        sections={yserpdtmSections}
        globeConfig={customGlobeConfig}
        className="bg-gradient-to-br from-gray-950 via-gray-900 to-black"
      />
    </div>
  );
}
