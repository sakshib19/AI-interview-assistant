"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button" // Ensure correct import path

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Architecture", href: "#architecture" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled
          ? "bg-neutral-950/90 backdrop-blur-sm border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <button 
            onClick={() => router.push("/")} 
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm"
          >
            <div className="w-6 h-6 rounded bg-[#cbe557] flex items-center justify-center" aria-hidden="true">
              <span className="text-neutral-950 font-bold text-xs">AI</span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Interview
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-400 hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm px-1"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/auth/login")}
              className="text-neutral-400 hover:text-white hover:bg-transparent text-sm"
            >
              Log in
            </Button>

            <Button
              size="sm"
              onClick={() => router.push("/auth/signup")}
              className="bg-transparent border border-[#cbe557] text-[#cbe557] hover:bg-[#cbe557]/10 hover:shadow-[0_0_20px_rgba(203,229,87,0.3)] transition-all text-sm"
            >
              Start Interview
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-md"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-1 pb-4 pt-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-neutral-400 hover:text-white transition-colors text-sm py-3 px-2 rounded-md hover:bg-white/5"
                  >
                    {link.name}
                  </a>
                ))}

                <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mt-2 px-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      router.push("/auth/login")
                    }}
                    className="text-neutral-400 hover:text-white hover:bg-transparent w-full justify-center text-sm"
                  >
                    Log in
                  </Button>

                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      router.push("/auth/signup")
                    }}
                    className="bg-transparent border border-[#cbe557] text-[#cbe557] hover:bg-[#cbe557]/10 w-full text-sm"
                  >
                    Start Interview
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}