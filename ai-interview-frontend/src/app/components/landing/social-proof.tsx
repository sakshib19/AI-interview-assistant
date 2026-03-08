"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "../ui/button"

export function SocialProof() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-950" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* CTA Banner */}
          <div className="rounded-xl border border-white/10 bg-neutral-900/30 p-8 md:p-12">
            <p className="text-neutral-400 text-xs uppercase tracking-wider mb-4">
              Built for ambitious engineers
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight max-w-2xl mx-auto">
              Targeting top-tier SDE placements?
              <br />
              <span className="text-neutral-400 font-normal">
                Join thousands who have transformed their interview skills.
              </span>
            </h2>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-transparent border border-[#cbe557] text-[#cbe557] hover:bg-[#cbe557]/10 hover:shadow-[0_0_30px_rgba(203,229,87,0.25)] transition-all duration-300 font-medium"
              >
                Start Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/20 font-medium"
              >
                View Documentation
              </Button>
            </div>

            {/* Company Logos */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-neutral-600 text-xs mb-6">
                Our users have landed offers at
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                {["Google", "Microsoft", "Amazon", "Meta", "Apple"].map(
                  (company) => (
                    <span
                      key={company}
                      className="text-neutral-600 font-medium text-sm"
                    >
                      {company}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
