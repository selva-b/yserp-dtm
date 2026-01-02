"use client"

import { ContainerScroll, CardSticky } from "@/components/ui/cards-stack"

const PROCESS_PHASES = [
  {
    id: "process-1",
    title: "Project Initiation & Planning",
    description:
      "We begin with comprehensive discovery sessions to understand your engineering requirements, project scope, and deliverables. Our team defines clear milestones, resource allocation, and establishes project baselines for successful execution.",
  },
  {
    id: "process-2",
    title: "Design & Documentation",
    description:
      "Our engineering team creates detailed technical drawings, specifications, and documentation. We ensure all designs comply with industry standards and regulations while meeting your specific project requirements.",
  },
  {
    id: "process-3",
    title: "Development & Implementation",
    description:
      "With approved designs, we move into the implementation phase. Our developers build robust solutions with clean code, integrated systems, and thorough version control to ensure quality and traceability.",
  },
  {
    id: "process-4",
    title: "Testing & Quality Assurance",
    description:
      "Rigorous testing protocols ensure every component meets specifications. We conduct comprehensive reviews, performance testing, and validation to guarantee reliability and compliance with project standards.",
  },
  {
    id: "process-5",
    title: "Delivery & Support",
    description:
      "After successful deployment, we provide ongoing support and maintenance. Our team ensures smooth handover with complete documentation, training materials, and responsive technical assistance for your continued success.",
  },
]

const WORK_PROJECTS = [
  {
    id: "work-project-1",
    title: "Drawing Management System",
    services: ["Version Control", "CAD Integration", "Approval Workflows", "Audit Trails"],
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112e2e7b7a?w=800&h=600&fit=crop",
  },
  {
    id: "work-project-2",
    title: "Project Lifecycle Platform",
    services: ["Bid Management", "Task Tracking", "Timesheet Automation", "Reporting"],
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  },
  {
    id: "work-project-3",
    title: "Technical Collaboration Hub",
    services: ["Team Coordination", "Ticket System", "Document Control", "Security"],
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  },
]

const Process = () => {
  return (
    <div className="container min-h-svh place-content-center bg-stone-50 px-6 text-stone-900 xl:px-12">
      <div className="grid md:grid-cols-2 md:gap-8 xl:gap-12">
        <div className="left-0 top-0 md:sticky md:h-svh md:py-12">
          <h5 className=" text-xs uppercase tracking-wide">our process</h5>
          <h2 className="mb-6 mt-4 text-4xl font-bold tracking-tight">
            Planning your{" "}
            <span className="text-indigo-500">project development</span> journey
          </h2>
          <p className="max-w-prose text-sm">
            Our journey begins with a deep dive into your vision. In the
            Discovery phase, we engage in meaningful conversations to grasp your
            brand identity, goals, and the essence you want to convey. This
            phase sets the stage for all that follows.
          </p>
        </div>
        <ContainerScroll className="min-h-[400vh] space-y-8 py-12">
          {PROCESS_PHASES.map((phase, index) => (
            <CardSticky
              key={phase.id}
              index={index + 2}
              className="rounded-2xl border p-8 shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="my-6 text-2xl font-bold tracking-tighter">
                  {phase.title}
                </h2>
                <h3 className="text-2xl font-bold text-indigo-500">
                  {String(index + 1).padStart(2, "0")}
                </h3>
              </div>

              <p className="text-foreground">{phase.description}</p>
            </CardSticky>
          ))}
        </ContainerScroll>
      </div>
    </div>
  )
}

const Work = () => {
  return (
    <div className="w-full min-h-screen bg-black px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h5 className="text-xs md:text-sm uppercase tracking-wide text-blue-400 mb-3 md:mb-4">Platform Capabilities</h5>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-4 md:mb-6">
            Comprehensive <span className="text-blue-500">Engineering Solutions</span>
          </h2>
          <p className="mx-auto max-w-3xl text-sm md:text-base lg:text-lg text-slate-400 leading-relaxed">
            From drawing management to complete project lifecycle tracking, VARAI delivers
            end-to-end solutions for engineering teams with enterprise-grade security and precision.
          </p>
        </div>
        <ContainerScroll className="min-h-[500vh] py-12">
          {WORK_PROJECTS.map((project, index) => (
            <CardSticky
              key={project.id}
              index={index}
              className="w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
              incrementY={60}
              incrementZ={5}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {project.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.services.map((service) => (
                    <div
                      key={service}
                      className="flex rounded-lg bg-slate-800 px-3 py-1.5"
                    >
                      <span className="text-xs tracking-tight text-slate-300">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <img
                className="w-full h-auto object-cover"
                width="100%"
                height="100%"
                src={project.imageUrl}
                alt={project.title}
              />
            </CardSticky>
          ))}
        </ContainerScroll>
      </div>
    </div>
  )
}

export { Process, Work }
