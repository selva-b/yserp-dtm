"use client";

import MarketingLayout from "@/components/marketing/MarketingLayout";
import { motion } from "framer-motion";
import { Mail, Database, Layers, BarChart3, Code2, Plug } from "lucide-react";

const integrations = [
  {
    title: 'Email / SMTP',
    body: 'Send notifications and approvals through your SMTP provider. Works with existing email domains.',
    icon: Mail
  },
  {
    title: 'Azure Blob Storage',
    body: 'Store drawings and documents with Azure-backed durability and security.',
    icon: Database
  },
  {
    title: 'Queue / pg-boss',
    body: 'Background jobs for notifications, exports, and long-running tasks.',
    icon: Layers
  },
  {
    title: 'Analytics / ClickHouse',
    body: 'Stream events for reporting and dashboards.',
    icon: BarChart3
  },
  {
    title: 'API-first',
    body: 'Expose data programmatically; export audit logs and operational data.',
    icon: Code2
  },
]

export default function WebsiteIntegrationsPage() {
  return (
    <MarketingLayout>
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background grid - same as pricing */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px] [mask-image:radial-gradient(50%_50%,white,transparent)] opacity-40" />

      {/* Blue gradient orbs - same as pricing */}
      <div
        className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] rounded-full"
        style={{
          border: "200px solid #3131f5",
          filter: "blur(92px)",
          WebkitFilter: "blur(92px)",
        }}
      />
      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full"
        style={{
          backgroundImage: `radial-gradient(circle at center, #206ce8 0%, transparent 70%)`,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-medium text-blue-400 backdrop-blur-sm">
              <Plug className="w-4 h-4" />
              Integrations & API
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 text-5xl md:text-6xl font-extrabold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Connect to Your Stack
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              with an API-First Approach
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Use your email, storage, queue, and analytics providers while keeping drawings, projects, tickets, tasks, and time aligned in one place.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href="/auth/signup"
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-800 border border-blue-500 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Book a Demo
            </a>
            <a
              href="/website/support"
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-t from-neutral-950 to-neutral-600 shadow-lg shadow-neutral-900 border border-neutral-800 rounded-xl hover:border-blue-500/50 transition-all"
            >
              Talk to Support
            </a>
          </motion.div>
        </section>

        {/* Integrations Grid */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item, index) => (
              <motion.div
                key={item.title}
                className="group relative rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-800 p-6 hover:border-blue-500/50 hover:shadow-[0px_0px_40px_0px_rgba(49,49,245,0.3)] transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-500/0 group-hover:from-blue-600/10 group-hover:to-blue-500/5 transition-all duration-500 rounded-2xl" />
                <div className="relative z-10">
                  <item.icon className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.body}</p>
                  <div className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    API docs available →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How to Integrate Section */}
          <motion.div
            className="mt-16 relative rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-blue-500/30 p-8 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-500/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Code2 className="w-6 h-6 text-blue-500" />
                <h3 className="text-2xl font-bold text-white">How to Integrate</h3>
              </div>
              <ol className="space-y-4 text-gray-300">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
                    1
                  </span>
                  <span className="pt-1">
                    Identify the module and events you want to connect (bids, projects, drawings, tickets, tasks, time).
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
                    2
                  </span>
                  <span className="pt-1">
                    Use the API to read/write data and export audit logs for compliance reporting.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
                    3
                  </span>
                  <span className="pt-1">
                    Automate notifications or exports using queue/pg-boss and your SMTP provider.
                  </span>
                </li>
              </ol>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
    </MarketingLayout>
  )
}

