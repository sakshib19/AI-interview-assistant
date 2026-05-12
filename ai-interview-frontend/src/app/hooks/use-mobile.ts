"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  // Default to false for SSR to prevent hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Only run on the client
    if (typeof window === "undefined") return

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    
    // Set initial value
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }
    
    onChange(mql) // Trigger check immediately on mount

    // Listen for window resize
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return isMobile
}