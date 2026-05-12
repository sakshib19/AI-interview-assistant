"use client"

import { motion } from "framer-motion"
import { ArrowRight, Play, Terminal, CheckCircle2 } from "lucide-react"
import { Button } from "../ui/button" // Ensure this path matches your project structure

// Extracted Data for cleaner JSX
const evaluationMetrics = [
  { label: "Technical Accuracy", value: 92 },
  { label: "Communication", value: 88 },
  { label: "Code Quality", value: 95 },
]

const aiFeedbackLogs = [
  { id: 1, text: "Excellent use of hash map for O(n) time complexity.", type: "positive" },
  { id: 2, text: "Consider edge cases: empty array, no solution.", type: "neutral" },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-neutral-950 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-neutral-900/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs text-neutral-400 mb-8"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#cbe557]" aria-hidden="true" />
              Now with real-time code execution
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Engineering Interviews,
              <br />
              <span className="text-white">Solved.</span>
            </h1>

            <p className="mt-6 text-base text-neutral-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              An infrastructure-grade AI platform that conducts live technical
              interviews, executes code in real-time, and evaluates system
              design skills.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-transparent border border-[#cbe557] text-[#cbe557] hover:bg-[#cbe557]/10 hover:shadow-[0_0_30px_rgba(203,229,87,0.25)] transition-all duration-300 font-medium group"
              >
                Start Interview
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/20 font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                View Architecture
              </Button>
            </div>
          </motion.div>

          {/* Right Visual - Interactive App Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
            aria-hidden="true" // Hide complex visual mockup from screen readers
          >
            {/* MacOS Window */}
            <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-900/50 backdrop-blur-sm shadow-2xl shadow-black/50">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs text-neutral-500 ml-3 font-mono">
                  interview-session — AI Interview Platform
                </span>
              </div>

              {/* Split Pane Content */}
              <div className="grid grid-cols-5 min-h-[380px]">
                {/* Left Pane - VS Code Style Editor */}
                <div className="col-span-3 border-r border-white/10 flex flex-col">
                  {/* Editor Tabs */}
                  <div className="flex items-center border-b border-white/10 bg-neutral-900/50">
                    <div className="flex items-center gap-2 px-4 py-2 border-r border-white/10 bg-neutral-800/50">
                      <Terminal className="w-3.5 h-3.5 text-[#cbe557]" />
                      <span className="text-xs text-neutral-300 font-mono">
                        solution.py
                      </span>
                    </div>
                  </div>

                  {/* Code Content */}
                  <div className="flex-1 p-4 font-mono text-xs overflow-hidden">
                    <div className="flex">
                      {/* Line Numbers */}
                      <div className="pr-4 text-neutral-600 select-none text-right">
                        {[...Array(10)].map((_, i) => (
                          <div key={i + 1} className="leading-5">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      {/* Code */}
                      <pre className="text-neutral-300 leading-5">
                        <code>
                          <span className="text-[#c586c0]">def</span>{" "}
                          <span className="text-[#dcdcaa]">two_sum</span>
                          <span className="text-neutral-400">(</span>
                          <span className="text-[#9cdcfe]">nums</span>
                          <span className="text-neutral-400">,</span>{" "}
                          <span className="text-[#9cdcfe]">target</span>
                          <span className="text-neutral-400">):</span>
                          {"\n"}
                          {"    "}
                          <span className="text-[#6a9955]">
                            # Hash map for O(n) lookup
                          </span>
                          {"\n"}
                          {"    "}
                          <span className="text-[#9cdcfe]">seen</span>{" "}
                          <span className="text-neutral-400">=</span> {"{"}
                          {"}"}
                          {"\n"}
                          {"    "}
                          <span className="text-[#c586c0]">for</span>{" "}
                          <span className="text-[#9cdcfe]">i</span>
                          <span className="text-neutral-400">,</span>{" "}
                          <span className="text-[#9cdcfe]">num</span>{" "}
                          <span className="text-[#c586c0]">in</span>{" "}
                          <span className="text-[#dcdcaa]">enumerate</span>
                          <span className="text-neutral-400">(</span>
                          <span className="text-[#9cdcfe]">nums</span>
                          <span className="text-neutral-400">):</span>
                          {"\n"}
                          {"        "}
                          <span className="text-[#9cdcfe]">diff</span>{" "}
                          <span className="text-neutral-400">=</span>{" "}
                          <span className="text-[#9cdcfe]">target</span>{" "}
                          <span className="text-neutral-400">-</span>{" "}
                          <span className="text-[#9cdcfe]">num</span>
                          {"\n"}
                          {"        "}
                          <span className="text-[#c586c0]">if</span>{" "}
                          <span className="text-[#9cdcfe]">diff</span>{" "}
                          <span className="text-[#c586c0]">in</span>{" "}
                          <span className="text-[#9cdcfe]">seen</span>
                          <span className="text-neutral-400">:</span>
                          {"\n"}
                          {"            "}
                          <span className="text-[#c586c0]">return</span>{" "}
                          <span className="text-neutral-400">[</span>
                          <span className="text-[#9cdcfe]">seen</span>
                          <span className="text-neutral-400">[</span>
                          <span className="text-[#9cdcfe]">diff</span>
                          <span className="text-neutral-400">],</span>{" "}
                          <span className="text-[#9cdcfe]">i</span>
                          <span className="text-neutral-400">]</span>
                          {"\n"}
                          {"        "}
                          <span className="text-[#9cdcfe]">seen</span>
                          <span className="text-neutral-400">[</span>
                          <span className="text-[#9cdcfe]">num</span>
                          <span className="text-neutral-400">]</span>{" "}
                          <span className="text-neutral-400">=</span>{" "}
                          <span className="text-[#9cdcfe]">i</span>
                          {"\n"}
                          {"    "}
                          <span className="text-[#c586c0]">return</span>{" "}
                          <span className="text-neutral-400">[]</span>
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <div className="border-t border-white/10 bg-neutral-900/80 p-3">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-neutral-500">$</span>
                      <span className="text-neutral-400">python test.py</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-[#28c840]/10 border border-[#28c840]/20 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#28c840]" />
                      <span className="text-xs text-[#28c840] font-medium">
                        Tests Passed 4/4
                      </span>
                      <span className="text-xs text-neutral-500 ml-auto">
                        32ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Pane - Feedback Sidebar */}
                <div className="col-span-2 p-4 flex flex-col gap-4 bg-neutral-900/30">
                  {/* Score Section */}
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                      Evaluation
                    </div>
                    <div className="space-y-3">
                      {evaluationMetrics.map((metric) => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-400">
                              {metric.label}
                            </span>
                            <span className="text-white font-medium">
                              {metric.value}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-[#cbe557] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Chat Log */}
                  <div className="flex-1">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
                      AI Feedback
                    </div>
                    <div className="space-y-2">
                      {aiFeedbackLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2.5 bg-neutral-800/50 border border-white/5 rounded text-xs ${
                            log.type === "positive" ? "text-neutral-300" : "text-neutral-400"
                          }`}
                        >
                          {log.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/30 border border-white/5 rounded text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cbe557] animate-pulse" />
                    <span className="text-neutral-500">Session Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}