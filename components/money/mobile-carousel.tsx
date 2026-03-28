'use client'

import { useRef, useState, useEffect, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MobileCarouselProps {
  children: ReactNode[]
  className?: string
}

export function MobileCarousel({ children, className = '' }: MobileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)

    // Calculate active index
    const itemWidth = el.clientWidth * 0.92
    const idx = Math.round(el.scrollLeft / itemWidth)
    setActiveIndex(Math.min(idx, children.length - 1))
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    el?.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [children.length])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const itemWidth = el.clientWidth * 0.92
    el.scrollBy({ left: dir === 'left' ? -itemWidth : itemWidth, behavior: 'smooth' })
  }

  if (children.length === 0) return null

  return (
    <div className={`md:hidden ${className}`}>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center -ml-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children.map((child, i) => (
            <div
              key={i}
              className="snap-center shrink-0"
              style={{ width: '92%' }}
            >
              {child}
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center -mr-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {children.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {children.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-black w-4' : 'bg-gray-300'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
