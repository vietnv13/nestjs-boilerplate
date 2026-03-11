'use client'

import NProgress from 'nprogress'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

NProgress.configure({ showSpinner: false, speed: 250, minimum: 0.08, trickleSpeed: 200 })

export function NavigationProgress() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stop bar when route change completes
  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname
    NProgress.done()
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [pathname])

  // Start bar on any internal anchor click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) {
        return
      }
      NProgress.start()
      // Hard stop after 8 s so a stalled navigation doesn't leave the bar hanging
      timerRef.current = setTimeout(() => NProgress.done(), 8000)
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // White bar — visible against the dark #002140 header at the top of the page
  return (
    <style>{`
      #nprogress .bar {
        background: rgba(255,255,255,0.9);
        height: 2px;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
      }
      #nprogress .peg {
        box-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.8);
      }
    `}</style>
  )
}
