'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

/* ---------- mock data for preview cards ---------- */
const mockGoals = [
  { name: 'Emergency Fund', saved: 45000, target: 100000, date: 'Dec 2026' },
  { name: 'MacBook Pro', saved: 89000, target: 120000, date: 'Aug 2026' },
  { name: 'Holiday Trip', saved: 12000, target: 50000, date: 'Mar 2027' },
]

const mockLedger = [
  { person: 'Aarav', direction: 'they_owe', amount: 2400, desc: 'Dinner split' },
  { person: 'Priya', direction: 'i_owe', amount: 800, desc: 'Coffee run' },
  { person: 'Kabir', direction: 'they_owe', amount: 5200, desc: 'Trip expenses' },
]

const mockTransactions = [
  { label: 'Swiggy', category: 'Food', amount: -340, color: '#ef4444' },
  { label: 'Salary', category: 'Income', amount: 85000, color: '#22c55e' },
  { label: 'Netflix', category: 'Entertainment', amount: -649, color: '#ef4444' },
  { label: 'Freelance', category: 'Income', amount: 12000, color: '#22c55e' },
]

/* ---------- reusable mini-components ---------- */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#1AB394] rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen overflow-x-hidden selection:bg-[#1AB394]/30">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#050505]/60 backdrop-blur-xl border-b border-white/[0.06]">
        <span className="text-sm font-semibold tracking-[0.15em] uppercase text-white/90">
          Orbit
        </span>
        <Link
          href="/login"
          className="text-xs font-medium tracking-wider uppercase px-5 py-2 rounded-md border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
        >
          Sign in
        </Link>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg-laptop.jpg"
            alt="Orbital lines in space"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60" />
        </div>

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-white/40 mb-6"
          >
            Personal Finance · Goals · Ledger
          </motion.p>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            All your systems
            <br />
            <span className="text-white/40">in motion.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-sm md:text-base text-white/40 max-w-md leading-relaxed"
          >
            Track money. Set goals. Settle debts. One quiet tool
            that keeps everything moving forward.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10 flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-md hover:bg-white/90 transition-colors duration-300"
            >
              Get started
            </Link>
            <a
              href="#preview"
              className="text-xs font-medium text-white/40 hover:text-white/70 transition-colors duration-300 tracking-wide"
            >
              See how it works ↓
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/20" />
        </motion.div>
      </section>


    </div>
  )
}
