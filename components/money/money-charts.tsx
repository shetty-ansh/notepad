'use client'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { MoneyCalendar } from './money-calendar'
import type { Transaction, TransactionCategory, Account } from '@/lib/types'

interface MoneyChartsProps {
  transactions: Transaction[]
  categories: TransactionCategory[]
  accounts: Account[]
}

export function MoneyCharts({ transactions, categories, accounts }: MoneyChartsProps) {
  const now = new Date()
  
  // 1. Last 6 months Income vs Expense
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { month: d.getMonth(), year: d.getFullYear(), name: d.toLocaleString('default', { month: 'short' }) }
  }).reverse()

  const incomeData = last6Months.map(m => {
    return transactions.filter(t => {
      const td = new Date(t.txn_date || '')
      return t.type === 'income' && td.getMonth() === m.month && td.getFullYear() === m.year
    }).reduce((sum, t) => sum + (t.amount || 0), 0)
  })

  const expenseData = last6Months.map(m => {
    return transactions.filter(t => {
      const td = new Date(t.txn_date || '')
      return t.type === 'expense' && td.getMonth() === m.month && td.getFullYear() === m.year
    }).reduce((sum, t) => sum + (t.amount || 0), 0)
  })

  const columnOptions: Highcharts.Options = {
    chart: { type: 'column', backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
    title: { text: '' },
    xAxis: { categories: last6Months.map(m => m.name), crosshair: true },
    yAxis: { title: { text: '' }, labels: { format: '₹{value}' } },
    plotOptions: { column: { borderRadius: 4, grouping: true } },
    series: [
      { type: 'column', name: 'Income', data: incomeData, color: '#10B981' },
      { type: 'column', name: 'Expense', data: expenseData, color: '#EF4444' }
    ],
    credits: { enabled: false },
    tooltip: { shared: true, valuePrefix: '₹' }
  }

  // 2. Current Month Spending by Category
  const currentMonthExpenses = transactions.filter(t => {
    const td = new Date(t.txn_date || '')
    return t.type === 'expense' && td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear()
  })

  const categoryTotals: Record<string, number> = {}
  currentMonthExpenses.forEach(t => {
    const cat = t.category || 'Uncategorized'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0)
  })

  const pieData = Object.entries(categoryTotals).map(([name, y]) => {
    const cat = categories.find(c => c.name === name)
    return { name, y, color: cat?.color || '#9CA3AF' }
  }).sort((a, b) => b.y - a.y)

  const pieOptions: Highcharts.Options = {
    chart: { type: 'pie', backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
    title: { text: '' },
    plotOptions: {
      pie: {
        innerSize: '60%',
        dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %' }
      }
    },
    series: [{ type: 'pie', name: 'Amount', data: pieData }],
    credits: { enabled: false },
    tooltip: { valuePrefix: '₹' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#FCF9F5] border border-[--border] rounded-[12px] p-4 shadow-sm hidden md:block">
        <h3 className="text-[11px] font-bold uppercase mb-2 text-center tracking-wider text-[--text-secondary]">Income vs Expense (6mo)</h3>
        <HighchartsReact highcharts={Highcharts} options={columnOptions} />
      </div>
      <div className="md:hidden">
        <MoneyCalendar transactions={transactions} accounts={accounts} />
      </div>
      <div className="bg-[#FCF9F5] border border-[--border] rounded-[12px] p-4 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase mb-2 text-center tracking-wider text-[--text-secondary]">Current Month Spending</h3>
        {pieData.length > 0 ? (
          <HighchartsReact highcharts={Highcharts} options={pieOptions} />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-[--text-tertiary] font-medium">
            No expenses this month
          </div>
        )}
      </div>
    </div>
  )
}
