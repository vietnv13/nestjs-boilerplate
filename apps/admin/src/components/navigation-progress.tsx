'use client'

import NProgress from 'nprogress'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

NProgress.configure({ showSpinner: false, speed: 300, minimum: 0.1 })

export function NavigationProgress() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevPathname.current === pathname) return

    prevPathname.current = pathname
    NProgress.done()

    if (timerRef.current) clearTimeout(timerRef.current)
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http')) return

      // Internal navigation — start progress
      NProgress.start()

      // Safety: stop after 10s in case navigation never completes
      timerRef.current = setTimeout(() => NProgress.done(), 10_000)
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <style>{`
      #nprogress .bar {
        background: #1677ff;
        height: 2px;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px #1677ff, 0 0 5px #1677ff;
      }
    `}</style>
  )
}
