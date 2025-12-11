"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, MessageCircle, Zap } from "lucide-react";

const quickstarts = [
  {
    title: 'Get started',
    body: 'Create your org, invite users, and set roles.',
    icon: Zap
  },
  {
    title: 'Projects & drawings',
    body: 'Set up projects, upload drawings, and publish revisions.',
    icon: FileText
  },
  {
    title: 'Tickets & tasks',
    body: 'Capture issues, assign tasks, and track to completion.',
    icon: MessageCircle
  },
  {
    title: 'Time & approvals',
    body: 'Submit time, route approvals, and export data.',
    icon: BookOpen
  },
]

const faqs = [
  { q: 'How do I get help?', a: 'Open a ticket or email support; priority routing for Team/Enterprise.' },
  { q: 'Where are docs?', a: 'Documentation is available online with guides and API references.' },
  { q: 'Do you have a status page?', a: 'Yes. Check /status for uptime and incidents.' },
  { q: 'Can you provide onboarding?', a: 'Yes. Guided onboarding for Team; dedicated for Enterprise.' },
]

export default function WebsiteSupportPage() {
  return (
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
              <MessageCircle className="w-4 h-4" />
              Support & Documentation
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 text-5xl md:text-6xl font-extrabold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Documentation, Onboarding,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              and Help When You Need It
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Quickstarts, FAQs, and direct support to keep bids, drawings, tickets, tasks, and time on track.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href="mailto:support@yserp-dtm.com"
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-800 border border-blue-500 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Email Support
            </a>
            <a
              href="/status"
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-t from-neutral-950 to-neutral-600 shadow-lg shadow-neutral-900 border border-neutral-800 rounded-xl hover:border-blue-500/50 transition-all"
            >
              View Status
            </a>
          </motion.div>
        </section>

        {/* Quickstarts Section */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Quick Start Guides
          </motion.h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {quickstarts.map((item, index) => (
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
                  <item.icon className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
                  <div className="mt-4 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    Read guide →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-bold text-white mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Frequently Asked Questions
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((item, index) => (
                <motion.div
                  key={item.q}
                  className="group relative rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-800 p-6 hover:border-blue-500/50 hover:shadow-[0px_0px_40px_0px_rgba(49,49,245,0.3)] transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-500/0 group-hover:from-blue-600/10 group-hover:to-blue-500/5 transition-all duration-500 rounded-2xl" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-3">{item.q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

