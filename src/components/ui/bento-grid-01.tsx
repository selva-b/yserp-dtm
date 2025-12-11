import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, FileText, FolderKanban, ListChecks, Clock, Shield, Users, Zap, BarChart3, Globe } from "lucide-react"

// Drawing Versioning Animation
function DrawingVersions() {
  const [version, setVersion] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setVersion((prev) => (prev >= 3 ? 1 : prev + 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <FileText className="w-16 h-16 text-white/80" />
        <motion.span
          key={version}
          className="text-4xl md:text-5xl font-sans font-medium text-white"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
        >
          v{version}.0
        </motion.span>
        <span className="text-xs text-gray-400">Version Control</span>
      </div>
    </div>
  )
}

// Project Timeline Animation
function ProjectTimeline() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 20))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
      <FolderKanban className="w-12 h-12 text-white/80" />
      <div className="w-full max-w-[160px] space-y-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 bg-black/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: progress >= (i + 1) * 33 ? "100%" : "0%" }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Task Management Animation
function TaskFlow() {
  const [activeTask, setActiveTask] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTask((prev) => (prev + 1) % 3)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col gap-2 w-full max-w-[140px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTask === i ? 'bg-white/20' : 'bg-white/5'
            }`}
            animate={{ scale: activeTask === i ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <ListChecks className={`w-4 h-4 ${activeTask === i ? 'text-white' : 'text-gray-600'}`} />
            <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
              {activeTask === i && (
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5 }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Timesheet Tracking Animation
function TimesheetTracker() {
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      setHours(8.5)
    }, 800)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Clock className="w-12 h-12 text-white/80" />
      <div className="h-12 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-white/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -20, position: 'absolute' }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-sans font-medium text-white"
            >
              {hours}h
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-gray-400">Today's Hours</span>
    </div>
  )
}

// RBAC Security Animation
function RBACBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setShields(prev => {
        const nextIndex = prev.findIndex(s => !s.active)
        if (nextIndex === -1) {
          return prev.map(() => ({ id: Math.random(), active: false }))
        }
        return prev.map((s, i) => i === nextIndex ? { ...s, active: true } : s)
      })
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            shield.active ? 'bg-white/20' : 'bg-white/5'
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Shield className={`w-5 h-5 ${shield.active ? 'text-white' : 'text-gray-600'}`} />
        </motion.div>
      ))}
    </div>
  )
}

// Collaboration Animation
function CollaborationNetwork() {
  const [pulses] = useState([0, 1, 2, 3])

  return (
    <div className="flex items-center justify-center h-full relative">
      <Users className="w-16 h-16 text-white/80 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-white/30 rounded-full"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: pulse * 0.7,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

function FeaturesSection() {
  return (
    <section className="relative bg-black px-6 py-24 md:py-32 min-h-screen flex items-center justify-center overflow-hidden">
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

      <div className="max-w-7xl w-full mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-medium text-blue-400 backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              Enterprise-Grade Features
            </span>
          </motion.div>

          <motion.h2
            className="text-5xl md:text-7xl font-extrabold text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Built for Technical
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Excellence
            </span>
          </motion.h2>

          <motion.p
            className="text-gray-400 text-lg md:text-xl text-center max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Comprehensive tools designed specifically for technical and engineering organizations.
            Keep your team aligned with role-based permissions, automated workflows, and real-time visibility across every project phase.
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { label: "Active Projects", value: "2,500+", icon: FolderKanban },
              { label: "Team Members", value: "15K+", icon: Users },
              { label: "Drawings Managed", value: "1M+", icon: FileText }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <stat.icon className="w-5 h-5 text-blue-400" />
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bento Grid Container */}
        <div className="relative">
          {/* Subtle glow effect behind grid */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 blur-3xl rounded-3xl" />

          <div className="relative bg-gradient-to-br from-gray-950/80 via-gray-900/80 to-black/80 backdrop-blur-xl p-4 md:p-8 rounded-3xl border border-gray-800/50 shadow-2xl">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[220px]">

            {/* 1. Drawing Management - Tall (2x2) */}
            <motion.div
              className="group md:col-span-2 md:row-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/5 transition-all duration-500" />
              <div className="flex-1 relative z-10">
                <DrawingVersions />
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">Drawing Management</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Version-controlled drawings with revision history, markups, and secure Azure storage.</p>
              </div>
            </motion.div>

            {/* 2. Project Tracking - Standard (2x1) */}
            <motion.div
              className="group md:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-cyan-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
              <div className="flex-1 relative z-10">
                <ProjectTimeline />
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">Project Tracking</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Milestones, budgets, progress tracking, and real-time visibility.</p>
              </div>
            </motion.div>

            {/* 3. Task Management - Tall (2x2) */}
            <motion.div
              className="group md:col-span-2 md:row-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/5 transition-all duration-500" />
              <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="relative w-full">
                  <TaskFlow />
                </div>
              </div>
              <div className="mt-auto relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">Task Management</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Assignments, due dates, status tracking, and automated workflows for your team.</p>
              </div>
            </motion.div>

            {/* 4. Timesheet Tracking - Standard (2x1) */}
            <motion.div
              className="group md:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
              <div className="flex-1 relative z-10">
                <TimesheetTracker />
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">Timesheet Tracking</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Precise time capture with approval flows and audit trails.</p>
              </div>
            </motion.div>

            {/* 5. RBAC Security - Wide (3x1) */}
            <motion.div
              className="group md:col-span-3 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-red-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.01, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:to-orange-500/5 transition-all duration-500" />
              <div className="flex-1 relative z-10">
                <RBACBadge />
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">RBAC & Security</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Bank-level security with role-based access control, granular permissions, and complete org isolation.</p>
              </div>
            </motion.div>

            {/* 6. Team Collaboration - Wide (3x1) */}
            <motion.div
              className="group md:col-span-3 bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-green-500/50 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 cursor-pointer overflow-hidden relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.01, y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/5 transition-all duration-500" />
              <div className="flex-1 flex items-center justify-center relative z-10">
                <CollaborationNetwork />
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <h3 className="text-xl md:text-2xl text-white font-bold">Team Collaboration</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Real-time notifications, instant updates, and comprehensive audit logs across all modules.</p>
              </div>
            </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return <FeaturesSection />
}
