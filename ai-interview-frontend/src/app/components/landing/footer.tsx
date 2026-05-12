"use client"

import { Github, Linkedin, Twitter } from "lucide-react"

// Extracted types for strict type checking
interface FooterLink {
  name: string;
  href: string;
}

interface FooterData {
  product: FooterLink[];
  resources: FooterLink[];
  legal: FooterLink[];
}

const footerLinks: FooterData = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ],
  resources: [
    { name: "Documentation", href: "#documentation" },
    { name: "API Reference", href: "#api" },
    { name: "Changelog", href: "#changelog" },
  ],
  legal: [
    { name: "Privacy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
]

export function Footer() {
  return (
    <footer className="relative bg-neutral-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm w-fit">
              <div className="w-6 h-6 rounded bg-[#cbe557] flex items-center justify-center" aria-hidden="true">
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
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.label}`}
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {(Object.entries(footerLinks) as [keyof FooterData, FooterLink[]][]).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-neutral-400 font-medium text-xs uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link: FooterLink) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-neutral-500 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#cbe557] rounded-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-600 text-xs">
            Built by Ravi Mishra | NIT Rourkela
          </p>
          <div className="flex items-center gap-2 text-neutral-600 text-xs" role="status">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" aria-hidden="true" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}