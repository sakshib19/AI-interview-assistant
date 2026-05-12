"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Terminal, Camera, FileText, ChevronRight } from "lucide-react"

export function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-950 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.1) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Core Infrastructure
          </h2>
          <p className="mt-2 text-neutral-400 text-sm max-w-lg">
            Built for engineers who demand precision and reliability.
          </p>
        </motion.div>

        {/* Bento Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Live Sandbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative rounded-xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-[#cbe557]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-neutral-800 border border-white/5">
                <Terminal className="w-4 h-4 text-[#cbe557]" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-white">Live Sandbox</h3>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed mb-4 flex-1">
              Execute Python and C++ in isolated containers with real-time output streaming.
            </p>

            {/* Mini Terminal */}
            <div className="rounded-lg bg-neutral-950 border border-white/5 overflow-hidden mt-auto">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
              </div>
              <div className="p-3 font-mono text-[10px] text-neutral-400 space-y-1">
                <div>
                  <span className="text-[#cbe557]">$</span> python main.py
                </div>
                <div className="text-neutral-500">Running tests...</div>
                <div className="text-[#28c840]">All assertions passed</div>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-600">exit:</span>
                  <span className="text-white">0</span>
                </div>
              </div>
            </div>

            <a href="#sandbox" className="mt-4 flex items-center gap-1 text-xs text-neutral-500 group-hover:text-[#cbe557] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm w-fit">
              <span>Learn more</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </motion.div>

          {/* Card 2: Computer Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative rounded-xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-[#cbe557]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-neutral-800 border border-white/5">
                <Camera className="w-4 h-4 text-[#cbe557]" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-white">Vision Proctoring</h3>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed mb-4 flex-1">
              YOLOv8 and DeepFace integration for identity verification and behavioral analysis.
            </p>

            {/* Camera Feed Wireframe */}
            <div className="rounded-lg bg-neutral-950 border border-white/5 overflow-hidden aspect-video relative mt-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Face Detection Wireframe */}
                <div className="relative w-16 h-20" aria-hidden="true">
                  <div className="absolute inset-0 border border-dashed border-[#cbe557]/50 rounded-lg" />
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#cbe557]" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-[#cbe557]" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-[#cbe557]" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#cbe557]" />
                </div>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                <span className="text-[10px] text-neutral-500 font-mono">REC</span>
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-neutral-600 font-mono">
                720p @ 30fps
              </div>
            </div>

            <a href="#vision" className="mt-4 flex items-center gap-1 text-xs text-neutral-500 group-hover:text-[#cbe557] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm w-fit">
              <span>Learn more</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </motion.div>

          {/* Card 3: Deep Resumes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative rounded-xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-[#cbe557]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-neutral-800 border border-white/5">
                <FileText className="w-4 h-4 text-[#cbe557]" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-white">Deep Resumes</h3>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed mb-4 flex-1">
              PDF parsing with structured extraction for personalized technical deep-dives.
            </p>

            {/* JSON Tree Wireframe */}
            <div className="rounded-lg bg-neutral-950 border border-white/5 p-3 font-mono text-[10px] mt-auto">
              <div className="text-neutral-500">{"{"}</div>
              <div className="pl-3">
                <span className="text-[#cbe557]">"experience"</span>
                <span className="text-neutral-600">: [</span>
              </div>
              <div className="pl-6">
                <span className="text-neutral-500">{"{"}</span>
              </div>
              <div className="pl-9">
                <span className="text-[#cbe557]">"role"</span>
                <span className="text-neutral-600">:</span>
                <span className="text-neutral-400"> "SDE Intern"</span>
              </div>
              <div className="pl-9">
                <span className="text-[#cbe557]">"company"</span>
                <span className="text-neutral-600">:</span>
                <span className="text-neutral-400"> "FAANG"</span>
              </div>
              <div className="pl-6">
                <span className="text-neutral-500">{"}"}</span>
              </div>
              <div className="pl-3">
                <span className="text-neutral-600">],</span>
              </div>
              <div className="pl-3">
                <span className="text-[#cbe557]">"skills"</span>
                <span className="text-neutral-600">:</span>
                <span className="text-neutral-500"> [...]</span>
              </div>
              <div className="text-neutral-500">{"}"}</div>
            </div>

            <a href="#resumes" className="mt-4 flex items-center gap-1 text-xs text-neutral-500 group-hover:text-[#cbe557] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm w-fit">
              <span>Learn more</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}