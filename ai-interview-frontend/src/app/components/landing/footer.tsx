"use client"

import { Github, Linkedin, Twitter } from "lucide-react"

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Changelog", href: "#" },
  ],
  legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer className="relative bg-neutral-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-[#cbe557] flex items-center justify-center">
                <span className="text-neutral-950 font-bold text-xs">AI</span>
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">
                Interview
              </span>
            </a>
            <p className="text-neutral-500 text-xs leading-relaxed mb-4 max-w-[200px]">
              Infrastructure-grade AI interview preparation platform.
            </p>
            <div className="flex gap-2">
              {[Twitter, Github, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/20 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-neutral-400 font-medium text-xs uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-neutral-500 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-neutral-400 font-medium text-xs uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-neutral-500 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-neutral-400 font-medium text-xs uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-neutral-500 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-600 text-xs">
            Built by Sachin Pal | NIT Rourkela
          </p>
          <div className="flex items-center gap-2 text-neutral-600 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
