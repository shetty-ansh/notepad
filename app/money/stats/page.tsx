'use client'

import Loader from '@/components/loader-animation'

import { useState, useEffect, useMemo } from 'react'
import { getTransactions, getTransactionCategories } from '@/lib/actions/money'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import type { Transaction, TransactionCategory } from '@/lib/types'

type TimeSpan = '3m' | '6m' | '1y' | 'all'

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [timeSpan, setTimeSpan] = useState<TimeSpan>('6m')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTransactions(), getTransactionCategories()]).then(
      ([txns, cats]) => {
        setTransactions(txns)
        setCategories(cats)
      }
    ).finally(() => setLoading(false))
  }, [])

  const filteredTxns = useMemo(() => {
    const now = new Date()
    let cutoff: Date
    switch (timeSpan) {
      case '3m':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case '6m':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case '1y':
        cutoff = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      case 'all':
        cutoff = new Date(2000, 0, 1)
        break
    }
    return transactions.filter((t) => new Date(t.txn_date || '') >= cutoff)
  }, [transactions, timeSpan])

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.name, c.color])),
    [categories]
  )

  // Income vs Expense by month
  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {}
    filteredTxns.forEach((t) => {
      const d = new Date(t.txn_date || '')
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { income: 0, expense: 0 }
      if (t.type === 'income') months[key].income += t.amount || 0
      if (t.type === 'expense') months[key].expense += t.amount || 0
    })
    const keys = Object.keys(months)
    return {
      categories: keys,
      income: keys.map((k) => months[k].income),
      expense: keys.map((k) => months[k].expense),
    }
  }, [filteredTxns])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTxns.filter((t) => t.type === 'expense')
    const grouped: Record<string, number> = {}
    expenses.forEach((t) => {
      const cat = t.category || 'Other'
      grouped[cat] = (grouped[cat] || 0) + (t.amount || 0)
    })
    const fallbackColors = ['#64748B', '#94A3B8', '#475569', '#334155', '#1E293B', '#0F172A', '#78716C', '#57534E']
    return Object.entries(grouped)
      .map(([name, y], i) => ({
        name,
        y,
        color: catMap.get(name) || fallbackColors[i % fallbackColors.length],
      }))
      .sort((a, b) => b.y - a.y)
  }, [filteredTxns, catMap])

  // Net savings by month
  const savingsData = useMemo(() => {
    return {
      categories: monthlyData.categories,
      data: monthlyData.categories.map(
        (_, i) => monthlyData.income[i] - monthlyData.expense[i]
      ),
    }
  }, [monthlyData])

  // Summary stats
  const totalIncome = filteredTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = filteredTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const avgMonthlyExpense =
    monthlyData.categories.length > 0
      ? totalExpense / monthlyData.categories.length
      : 0

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const incExpOptions: Highcharts.Options = {
    chart: { type: 'column', backgroundColor: 'transparent', height: 320, style: { fontFamily: 'inherit' } },
    title: { text: undefined },
    xAxis: {
      categories: monthlyData.categories,
      labels: { style: { color: '#6B7280', fontSize: '10px' } },
      lineColor: '#E5E7EB',
      tickLength: 0,
    },
    yAxis: {
      title: { text: undefined },
      labels: {
        style: { color: '#6B7280', fontSize: '10px' },
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
          const v = Number(this.value)
          return v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
        },
      },
      gridLineColor: '#F3F4F6',
    },
    legend: { enabled: true, itemStyle: { fontSize: '11px', color: '#374151' } },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: '#1F2937',
      borderColor: 'transparent',
      borderRadius: 8,
      style: { color: '#F9FAFB', fontSize: '12px' },
    },
    plotOptions: { column: { borderRadius: 4, pointPadding: 0.1, groupPadding: 0.15 } },
    series: [
      { type: 'column', name: 'Income', data: monthlyData.income, color: '#1AB394' },
      { type: 'column', name: 'Expense', data: monthlyData.expense, color: '#111827' },
    ],
  }

  const donutOptions: Highcharts.Options = {
    chart: { type: 'pie', backgroundColor: 'transparent', height: 320, style: { fontFamily: 'inherit' } },
    title: { text: undefined },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: '#1F2937',
      borderColor: 'transparent',
      borderRadius: 8,
      style: { color: '#F9FAFB', fontSize: '12px' },
      pointFormat: '<b>₹{point.y:,.0f}</b> ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: { fontSize: '11px', fontWeight: '500', color: '#374151', textOutline: 'none' },
          distance: 20,
        },
      },
    },
    series: [{ type: 'pie', name: 'Category', data: categoryBreakdown }],
  }

  const savingsOptions: Highcharts.Options = {
    chart: { type: 'area', backgroundColor: 'transparent', height: 280, style: { fontFamily: 'inherit' } },
    title: { text: undefined },
    xAxis: {
      categories: savingsData.categories,
      labels: { style: { color: '#6B7280', fontSize: '10px' } },
      lineColor: '#E5E7EB',
      tickLength: 0,
    },
    yAxis: {
      title: { text: undefined },
      labels: {
        style: { color: '#6B7280', fontSize: '10px' },
        formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
          const v = Number(this.value)
          return v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
        },
      },
      gridLineColor: '#F3F4F6',
      plotLines: [{ color: '#D1D5DB', width: 1, value: 0, dashStyle: 'Dash' }],
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: '#1F2937',
      borderColor: 'transparent',
      borderRadius: 8,
      style: { color: '#F9FAFB', fontSize: '12px' },
      pointFormat: '₹{point.y:,.0f}',
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(26, 179, 148, 0.3)'],
            [1, 'rgba(26, 179, 148, 0.02)'],
          ],
        },
        lineColor: '#1AB394',
        lineWidth: 2,
        marker: { fillColor: '#1AB394', lineColor: '#fff', lineWidth: 2, radius: 4 },
      },
    },
    series: [{ type: 'area', name: 'Net Savings', data: savingsData.data }],
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
        <h1 className="text-[20px] font-medium">Money Stats</h1>
        <div className="flex bg-gray-100 rounded-[6px] p-0.5 gap-0.5">
          {(['3m', '6m', '1y', 'all'] as TimeSpan[]).map((span) => (
            <button
              key={span}
              onClick={() => setTimeSpan(span)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-[4px] transition-all uppercase ${
                timeSpan === span
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {span}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader />
          </div>
        ) : (
        <>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-400 rounded-[12px] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">Total Income</p>
            <p className="mt-1 text-xl font-bold font-mono text-[#1AB394]">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white border border-gray-400 rounded-[12px] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">Total Expense</p>
            <p className="mt-1 text-xl font-bold font-mono text-black">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-white border border-gray-400 rounded-[12px] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">Net</p>
            <p className={`mt-1 text-xl font-bold font-mono ${totalIncome - totalExpense >= 0 ? 'text-[#1AB394]' : 'text-red-500'}`}>
              {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalIncome - totalExpense))}
            </p>
          </div>
          <div className="bg-white border border-gray-400 rounded-[12px] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-secondary]">Avg Monthly Spend</p>
            <p className="mt-1 text-xl font-bold font-mono text-black">{formatCurrency(avgMonthlyExpense)}</p>
          </div>
        </div>

        {/* Income vs Expense */}
        <div className="bg-white border border-gray-400 rounded-[12px] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
            Income vs Expense
          </h3>
          {monthlyData.categories.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-[--text-secondary]">No data yet</p>
            </div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={incExpOptions} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Breakdown */}
          <div className="bg-white border border-gray-400 rounded-[12px] p-5">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
              Spending by Category
            </h3>
            {categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-[--text-secondary]">No expenses</p>
              </div>
            ) : (
              <HighchartsReact highcharts={Highcharts} options={donutOptions} />
            )}
          </div>

          {/* Top Categories Table */}
          <div className="bg-white border border-gray-400 rounded-[12px] p-5">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
              Top Categories
            </h3>
            {categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-[--text-secondary]">No data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 8).map((cat, i) => {
                  const pct = totalExpense > 0 ? (cat.y / totalExpense) * 100 : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-xs text-[--text-secondary] font-mono w-5">{i + 1}.</span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-black flex-1 truncate">{cat.name}</span>
                      <span className="text-sm font-mono font-medium text-black">
                        {formatCurrency(cat.y)}
                      </span>
                      <span className="text-xs text-[--text-secondary] font-mono w-12 text-right">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Net Savings Trend */}
        <div className="bg-white border border-gray-400 rounded-[12px] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
            Net Savings Trend
          </h3>
          {savingsData.categories.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-sm text-[--text-secondary]">No data yet</p>
            </div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={savingsOptions} />
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
