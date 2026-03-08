"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Upload, UserCheck, MessageCircle, FileDown } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Resume",
    description:
      "Upload your PDF resume and select your target track: FAANG, Startup, or Enterprise.",
  },
  {
    icon: UserCheck,
    step: "02",
    title: "Identity Verification",
    description:
      "Complete face registration and environment check to ensure optimal interview conditions.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Adaptive Interview",
    description:
      "Engage in a conversational interview covering Coding, System Design, and Behavioral questions.",
  },
  {
    icon: FileDown,
    step: "04",
    title: "Detailed Report",
    description:
      "Receive a comprehensive PDF with scores, feedback, and a personalized study roadmap.",
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-950">
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
            How It Works
          </h2>
          <p className="mt-2 text-neutral-400 text-sm max-w-lg">
            A streamlined 4-step process designed for maximum efficiency.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
              )}

              <div className="relative rounded-xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-5 hover:border-[#cbe557]/30 transition-all h-full">
                {/* Step Number */}
                <div className="absolute -top-3 left-5 px-2 py-0.5 bg-neutral-900 border border-white/10 rounded text-[10px] font-mono text-neutral-500">
                  STEP {step.step}
                </div>

                <div className="mt-2">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-[#cbe557]" />
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
