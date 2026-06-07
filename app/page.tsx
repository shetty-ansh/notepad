'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const mockGoals = [
  { name: 'Emergency Fund', saved: 45000, target: 100000 },
  { name: 'MacBook Pro', saved: 89000, target: 120000 },
  { name: 'Holiday Trip', saved: 12000, target: 50000 },
]

const mockLedger = [
  { person: 'Aarav', direction: 'they_owe', amount: 2400, desc: 'Dinner split' },
  { person: 'Priya', direction: 'i_owe', amount: 800, desc: 'Coffee run' },
  { person: 'Kabir', direction: 'they_owe', amount: 5200, desc: 'Trip expenses' },
]

const mockTransactions = [
  { label: 'Swiggy', category: 'Food', amount: -340 },
  { label: 'Salary', category: 'Income', amount: 85000 },
  { label: 'Netflix', category: 'Entertainment', amount: -649 },
  { label: 'Freelance', category: 'Income', amount: 12000 },
]

const mockTodos = [
  { text: 'Review Q2 budget', done: true },
  { text: 'Call insurance agent', done: false },
  { text: 'Renew gym membership', done: false },
  { text: 'File advance tax', done: true },
]

const mockHabits = [
  { name: 'No-spend day', streak: 12, days: [1, 1, 1, 0, 1, 1, 1] },
  { name: 'Log expenses', streak: 28, days: [1, 1, 1, 1, 1, 1, 1] },
  { name: 'Read 20 min', streak: 5, days: [0, 1, 1, 1, 0, 1, 1] },
]

const mockNotes = [
  { title: 'Investment thesis', preview: 'SIP into index funds first, then…', time: '2h ago' },
  { title: 'Side project ideas', preview: 'Freelance rate card, notion template…', time: 'Yesterday' },
  { title: 'Tax saving checklist', preview: '80C limit, ELSS, PPF contribution…', time: '3d ago' },
]

const features = [
  {
    num: '01',
    title: 'Money',
    body: 'Every rupee tracked. Income, expenses, debts — one clear picture.',
    preview: (
      <div className="mt-3">
        {mockTransactions.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/[0.06] last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.amount > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <p className="text-[11px] font-medium text-black/75">{t.label}</p>
            </div>
            <span className={`font-mono text-[11px] font-semibold ${t.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {t.amount > 0 ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '02',
    title: 'Goals',
    body: 'Name what you want. Set a date. Watch the bar close in.',
    preview: (
      <div className="mt-3 space-y-2.5">
        {mockGoals.map((g, i) => {
          const pct = Math.round((g.saved / g.target) * 100)
          return (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-medium text-black/65">{g.name}</span>
                <span className="text-[10px] font-mono text-black/35">{pct}%</span>
              </div>
              <div className="h-[3px] bg-black/[0.07] rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    num: '03',
    title: 'Ledger',
    body: "Track what you owe and what's owed to you. No mental math.",
    preview: (
      <div className="mt-3">
        {mockLedger.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/[0.06] last:border-0">
            <div>
              <p className="text-[11px] font-medium text-black/75">{l.person}</p>
              <p className="text-[9px] tracking-wider uppercase text-black/28">{l.desc}</p>
            </div>
            <span className={`text-[11px] font-mono font-semibold ${l.direction === 'they_owe' ? 'text-emerald-600' : 'text-red-500'}`}>
              {l.direction === 'they_owe' ? '+' : '-'}₹{l.amount.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '04',
    title: 'To-dos',
    body: 'Tasks that actually get done. Linked to goals, not lost in a list.',
    preview: (
      <div className="mt-3 space-y-1.5">
        {mockTodos.map((t, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-[3px] border flex-shrink-0 flex items-center justify-center ${t.done ? 'bg-black border-black' : 'border-black/20'}`}>
              {t.done && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`text-[11px] ${t.done ? 'line-through text-black/28' : 'text-black/68'}`}>{t.text}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '05',
    title: 'Habits',
    body: 'Build consistency. Log streaks. See which days you showed up.',
    preview: (
      <div className="mt-3 space-y-2">
        {mockHabits.map((h, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-black/65 w-[90px] truncate">{h.name}</span>
              <span className="text-[9px] font-mono text-black/28">{h.streak}d</span>
            </div>
            <div className="flex gap-0.5">
              {h.days.map((d, j) => (
                <div key={j} className={`w-3 h-3 rounded-[2px] ${d ? 'bg-black' : 'bg-black/[0.08]'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '06',
    title: 'Notes',
    body: 'Capture ideas fast. Everything in one place, always findable.',
    preview: (
      <div className="mt-3">
        {mockNotes.map((n, i) => (
          <div key={i} className="py-1.5 border-b border-black/[0.06] last:border-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[11px] font-medium text-black/75">{n.title}</p>
              <span className="text-[9px] text-black/25">{n.time}</span>
            </div>
            <p className="text-[10px] text-black/33 truncate">{n.preview}</p>
          </div>
        ))}
      </div>
    ),
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white border border-black/[0.07] rounded-[12px] p-4 hover:shadow-[0_6px_28px_rgba(0,0,0,0.07)] hover:scale-[1.015] transition-all duration-500"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[9px] tracking-[0.22em] uppercase font-medium text-black/20 font-mono">{feature.num}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-black/14 group-hover:bg-black transition-colors duration-300" />
      </div>
      <h3 className="text-[14px] font-semibold text-black tracking-tight">{feature.title}</h3>
      <p className="text-[11px] text-black/36 leading-relaxed mt-0.5">{feature.body}</p>
      {feature.preview}
    </motion.div>
  )
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const imgScale = useTransform(scrollYProgress, [0, 0.6], [1, 1.06])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <div className="bg-[#F5F4F0] text-black min-h-screen overflow-x-hidden font-sans selection:bg-black selection:text-white">

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 h-13 bg-[#F5F4F0]/80 backdrop-blur-xl border-b border-black/[0.06]">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-black/70">Orbit</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:block text-[9px] tracking-[0.22em] uppercase text-black/28 font-medium">Money · Goals · Life</span>
          <Link
            href="/login"
            className="text-[10px] font-semibold tracking-[0.15em] uppercase px-3 sm:px-4 py-1.5 rounded-[4px] border border-black/18 text-black/55 hover:bg-black hover:text-white hover:border-black transition-all duration-300"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-end pb-10 sm:pb-14 md:pb-18 overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ opacity: imgOpacity, scale: imgScale }}>
          <Image
            src="/orbit-landing-bg.png"
            alt="Abstract orbital spheres"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Gradient overlays to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F4F0] via-[#F5F4F0]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5F4F0]/70 via-[#F5F4F0]/20 to-transparent" />
          {/* Extra mobile overlay for readability on small screens */}
          <div className="absolute inset-0 bg-[#F5F4F0]/30 sm:bg-transparent" />
        </motion.div>

        {/* Mobile-only ORBIT title for top/center empty space */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="absolute top-24 left-0 right-0 z-10 text-center text-[3.5rem] font-bold tracking-[-0.04em] text-black/[0.07] sm:hidden select-none pointer-events-none"
        >
          ORBIT
        </motion.p>

        <motion.div className="relative z-10 w-full px-4 sm:px-6 md:px-12 max-w-5xl" style={{ y: textY }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-[8px] sm:text-[9px] tracking-[0.3em] sm:tracking-[0.35em] uppercase font-medium text-black/30 mb-3 sm:mb-4"
          >
            Money · Goals · Todos · Habits · Notes
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.4rem,9vw,7rem)] font-bold leading-[0.93] tracking-[-0.03em] text-black"
          >
            Everything
            <br />
            <span className="text-black/18">that matters,</span>
            <br />
            in one place.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-4 sm:mt-5 text-[12px] sm:text-[13px] text-black/40 max-w-[280px] sm:max-w-xs leading-relaxed"
          >
            Track money. Build habits. Capture ideas. Set goals. Orbit keeps your whole life in motion — quietly, in the background.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5"
          >
            <Link
              href="/login"
              className="px-6 py-2.5 bg-black text-white text-[11px] font-semibold tracking-[0.12em] uppercase rounded-[4px] hover:bg-black/72 transition-all duration-300 text-center"
            >
              Get started
            </Link>
            <a href="#features" className="text-[10px] font-medium tracking-[0.15em] uppercase text-black/30 hover:text-black transition-colors duration-300">
              See all features ↓
            </a>
          </motion.div>
        </motion.div>

        {/* Floating stat pill — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute top-20 right-8 md:right-14 z-10 bg-white/65 backdrop-blur-md border border-black/[0.07] rounded-[10px] px-4 py-2.5 hidden md:block"
        >
          <p className="text-[9px] tracking-[0.2em] uppercase text-black/30 mb-0.5">Net this month</p>
          <p className="font-mono text-[20px] font-bold text-emerald-600 leading-none">+₹96,011</p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-5 right-6 sm:right-8 z-10"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <div className="w-px h-7 sm:h-9 bg-gradient-to-b from-black/18 to-transparent" />
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-4 sm:px-6 md:px-12 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-7 border-t border-black/[0.09] pt-6 sm:pt-7 gap-3"
        >
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase font-medium text-black/26 mb-1.5">Everything inside</p>
            <h2 className="text-[clamp(1.5rem,4vw,2.6rem)] font-bold tracking-tight leading-tight">
              Six systems.<br /><span className="text-black/20">One interface.</span>
            </h2>
          </div>
          <p className="text-[11px] text-black/30 max-w-[220px] sm:max-w-[170px] leading-relaxed sm:text-right">
            Built for people who want clarity, not complexity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="relative border-t border-black/[0.07] px-4 sm:px-6 md:px-12 py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[clamp(4rem,20vw,18rem)] font-bold text-black/[0.026] tracking-[-0.04em] whitespace-nowrap">
            ORBIT
          </span>
        </div>
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[9px] tracking-[0.3em] uppercase font-medium text-black/26 mb-3"
          >
            Ready to start
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-[clamp(1.8rem,6vw,3.8rem)] font-bold tracking-tight leading-tight mb-5 sm:mb-6"
          >
            Your whole life,<br /><span className="text-black/20">in orbit.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-2.5 bg-black text-white text-[11px] font-semibold tracking-[0.14em] uppercase rounded-[4px] hover:bg-black/70 transition-all duration-300 group"
            >
              Create free account
              <span className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-black/[0.06] px-4 sm:px-6 md:px-12 py-4 sm:py-5 flex items-center justify-between">
        <span className="text-[9px] tracking-[0.25em] uppercase text-black/20 font-medium">Orbit</span>
        <span className="text-[9px] text-black/16">© 2026</span>
      </footer>
    </div>
  )
}