'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export type FilterOption = {
    value: string
    label: string
}

export function FilterDropdown({
    options,
    value,
    onChange,
    className,
}: {
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const selectedLabel = options.find((o) => o.value === value)?.label ?? value

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div ref={ref} className={`relative inline-block ${className ?? ''}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="
                    flex items-center gap-1.5
                    h-9 px-3 sm:px-4
                    text-xs sm:text-sm font-semibold
                    rounded-[4px]
                    text-[#de6536] bg-white
                    hover:bg-black
                    transition-colors
                    shadow-sm
                    select-none
                "
            >
                {selectedLabel}
                <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-[8px] border border-black/10 bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {options.map((opt) => {
                        const isSelected = opt.value === value
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value)
                                    setOpen(false)
                                }}
                                className={`
                                    w-full text-left px-3 py-2 text-xs sm:text-sm 
                                    transition-colors
                                    ${isSelected
                                        ? 'bg-[#de6536] text-white'
                                        : 'bg-white text-[#de6536] hover:bg-[#de6536]/10'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
