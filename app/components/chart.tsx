'use client'

import React, { useState, useMemo } from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Plus, Minus, Loader2, ChevronLeft, ChevronRight, Info, List } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface ChartProps {
  data: ChartData[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  loading: boolean;
  mode?: 'income' | 'expense';
  chartType?: 'donut' | 'line';
  currentMonth: number;
  currentYear: number;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onChartTypeSwitch: (type: 'donut' | 'line') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  getMonthName: (month: number) => string;
  expenses: any[];
  incomes: any[];
  monthlyBudget: number;
  budgetLoading: boolean;
  budgetsLoaded: boolean;
  onOpenBudgetDrawer: () => void;
  onShowDetails?: () => void;
}

export function Chart({
  data,
  totalIncome,
  totalExpenses,
  balance,
  loading,
  mode = 'expense',
  chartType = 'donut',
  currentMonth,
  currentYear,
  onNavigateMonth,
  onChartTypeSwitch,
  canNavigatePrev: propCanNavigatePrev,
  canNavigateNext: propCanNavigateNext,
  getMonthName,
  expenses,
  incomes,
  monthlyBudget,
  budgetLoading,
  budgetsLoaded,
  onOpenBudgetDrawer,
  onShowDetails
}: ChartProps) {
  const formatCompactCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
    }
    if (Math.abs(value) >= 1_000) {
      return `${Math.round(value / 1_000).toLocaleString('id-ID')} rb`
    }
    return value.toLocaleString('id-ID')
  }

  // Calculate navigation limits internally to avoid infinite loops
  const getDateLimits = () => {
    const allDates = [...expenses, ...incomes]
      .filter(item => item && item.date) // Better null checking
      .map(item => {
        try {
          const date = new Date(item.date)
          return isNaN(date.getTime()) ? null : date
        } catch {
          return null
        }
      })
      .filter(date => date !== null) as Date[]

    if (allDates.length === 0) {
      const now = new Date()
      return {
        minDate: new Date(now.getFullYear(), now.getMonth(), 1),
        maxDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    return {
      minDate: new Date(minDate.getFullYear(), minDate.getMonth(), 1),
      maxDate: new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)
    }
  }

  const { minDate, maxDate } = getDateLimits()
  const prevMonth = new Date(currentYear, currentMonth - 1, 1)
  const nextMonth = new Date(currentYear, currentMonth + 1, 1)

  const canNavigatePrevInternal = prevMonth >= minDate
  const canNavigateNextInternal = nextMonth <= maxDate

  // Prepare line chart data (daily aggregation) - memoized to prevent constant recalculation
  const lineChartData = useMemo(() => {
    const dataToUse = mode === 'expense' ? expenses : incomes

    // Filter data by current month and year, with better error handling
    const filteredData = dataToUse.filter(item => {
      if (!item || !item.date) return false
      try {
        const itemDate = new Date(item.date)
        // Check if date is valid
        if (isNaN(itemDate.getTime())) return false
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      } catch (error) {
        console.warn('Invalid date format in item:', item)
        return false
      }
    })

    // Group by day with better error handling
    const dailyTotals: { [key: string]: number } = {}
    filteredData.forEach(item => {
      try {
        const date = new Date(item.date)
        if (!isNaN(date.getTime())) {
          const dayKey = date.getDate().toString()
          const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || '0')
          if (!isNaN(amount)) {
            dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + amount
          }
        }
      } catch (error) {
        console.warn('Error processing item for line chart:', item, error)
      }
    })

    // Create array of all days in the month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const lineData = []

    for (let day = 1; day <= daysInMonth; day++) {
      lineData.push({
        day: day,
        amount: dailyTotals[day.toString()] || 0,
        date: day
      })
    }

    return lineData
  }, [mode, expenses, incomes, currentMonth, currentYear])

  // Calculate dynamic Y-axis properties based on the data
  const yAxisConfig = useMemo(() => {
    if (!lineChartData || lineChartData.length === 0) {
      return { domain: [0, 100000], tickFormatter: (value: number) => `${(value / 1000).toFixed(0)}k` }
    }

    const maxValue = Math.max(...lineChartData.map(d => d.amount))
    const minValue = Math.min(...lineChartData.map(d => d.amount))

    // If all values are zero, use a default range
    if (maxValue === 0) {
      return { domain: [0, 100000], tickFormatter: (value: number) => `${(value / 1000).toFixed(0)}k` }
    }

    // Add some padding to the max value (20% above the highest value)
    const paddedMax = maxValue * 1.2

    // Determine the best unit and formatter based on the data range
    let tickFormatter: (value: number) => string
    let domain: [number, number]

    if (paddedMax >= 1000000) {
      // Use millions (M) for values >= 1M
      tickFormatter = (value: number) => `${(value / 1000000).toFixed(1)}M`
      domain = [0, Math.ceil(paddedMax / 100000) * 100000] // Round up to nearest 100k
    } else if (paddedMax >= 1000) {
      // Use thousands (k) for values >= 1k
      tickFormatter = (value: number) => `${(value / 1000).toFixed(0)}k`
      domain = [0, Math.ceil(paddedMax / 1000) * 1000] // Round up to nearest 1k
    } else {
      // Use raw values for small amounts
      tickFormatter = (value: number) => value.toString()
      domain = [0, Math.ceil(paddedMax / 100) * 100] // Round up to nearest 100
    }

    return { domain, tickFormatter }
  }, [lineChartData])

  // Debug: log line chart data
  React.useEffect(() => {
    console.log('Line chart data:', lineChartData)
    console.log('Line chart data length:', lineChartData.length)
  }, [lineChartData])
  const [selectedSegment, setSelectedSegment] = useState<ChartData | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  
  // Animation state for chart type switching
  const [isChartAnimating, setIsChartAnimating] = useState(false)
  const [chartAnimationDirection, setChartAnimationDirection] = useState<'left' | 'right'>('right')

  // Animation functions for chart type switching
  const switchToLineChartWithAnimation = () => {
    setChartAnimationDirection('left')
    setIsChartAnimating(true)
    onChartTypeSwitch('line')
    setTimeout(() => {
      setIsChartAnimating(false)
    }, 300)
  }

  const switchToDonutChartWithAnimation = () => {
    setChartAnimationDirection('right')
    setIsChartAnimating(true)
    onChartTypeSwitch('donut')
    setTimeout(() => {
      setIsChartAnimating(false)
    }, 300)
  }

  const handlePieClick = (data: any, index: number) => {
    if (data && index !== undefined) {
      setSelectedSegment(data)
      setIsPopoverOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-sm flex-shrink-0 space-y-3 text-center">
        {/* Header section - matches the navigation and balance display */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              disabled={true}
              className="p-1 rounded-full text-gray-300 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 bg-gray-200 rounded-full w-28 animate-pulse"></div>
            <button
              disabled={true}
              className="p-1 rounded-full text-gray-300 cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Balance and Budget Info - matches the actual balance display */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-9 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
          </div>

          <div className="text-center mt-2">
            <div className="h-3 bg-gray-100 rounded-full w-36 animate-pulse mx-auto"></div>
          </div>
        </div>

        {/* Chart Container - responsive dimensions for mobile */}
        <div className="relative mx-auto flex h-[180px] w-full max-w-full flex-shrink-0 items-center justify-center p-2">
          <div className="relative mx-auto flex h-40 w-40 max-w-full items-center justify-center overflow-hidden rounded-full bg-gray-50">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
              <p className="text-gray-500 mt-2 text-sm">Loading data...</p>
            </div>
          </div>
        </div>

        {/* Bottom section - matches the income/expense totals */}
        <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
          <span className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-gray-100 text-gray-400">
            <Minus className="w-4 h-4" />
            --
          </span>
          <span className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-gray-100 text-gray-400">
            <Plus className="w-4 h-4" />
            --
          </span>
        </div>
      </div>
    )
  }

  return (
    <section className="finance-chart-card ios-card w-full max-w-sm flex-shrink-0 space-y-3 rounded-[28px] p-4 text-center">
      <div>
        <div className="ios-control mb-3 inline-flex items-center gap-1 rounded-full p-1">
          <button
            onClick={() => onNavigateMonth('prev')}
            disabled={!canNavigatePrevInternal}
            className={`ios-press rounded-full p-1.5 ${canNavigatePrevInternal
                ? 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                : 'cursor-not-allowed text-slate-300'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="min-w-[9rem] text-xs font-semibold tracking-wide text-slate-700">
            {chartType === 'donut' ? 'Saldo' : 'Tren'} {getMonthName(currentMonth)} {currentYear}
          </p>
          <button
            onClick={() => onNavigateMonth('next')}
            disabled={!canNavigateNextInternal}
            className={`ios-press rounded-full p-1.5 ${canNavigateNextInternal
                ? 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                : 'cursor-not-allowed text-slate-300'
              }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Balance and Budget Info - Always show regardless of chart type */}
        <div className="flex items-center justify-center gap-2">
          <h1 className="break-words text-[2rem] font-bold tracking-[-0.04em] text-slate-950 tabular-nums">
            Rp {balance.toLocaleString('id-ID')}
          </h1>
          {monthlyBudget === 0 && (
            <button
              onClick={onOpenBudgetDrawer}
              className="ios-press rounded-full p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
              title="Set budget for this month"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-1 text-center">
          <p className="text-[11px] font-medium tracking-wide text-slate-400">
            Budget: Rp {Math.floor(monthlyBudget).toLocaleString('id-ID')}
            {!budgetsLoaded && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
          </p>
        </div>
      </div>

      {/* Chart Container with Animation - responsive for mobile */}
      <div className="finance-chart-visual relative mx-auto h-[168px] w-full max-w-full flex-shrink-0 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_center,rgba(239,246,255,0.9),rgba(248,250,252,0.35)_48%,transparent_72%)] p-1">
        {/* Chart Type Navigation */}
        {chartType === 'line' && (
          <button
            onClick={switchToDonutChartWithAnimation}
            className="ios-control ios-press absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:text-slate-900"
            title="Switch to Chart view"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {chartType === 'donut' && (
          <button
            onClick={switchToLineChartWithAnimation}
            className="ios-control ios-press absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:text-slate-900"
            title="Switch to Trend view"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Details Button */}
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="ios-control ios-press absolute right-1 top-1 z-10 rounded-xl p-2 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            title="View transaction details"
          >
            <List className="w-4 h-4" />
          </button>
        )}

        {/* Chart Views Container */}
        <div className="w-full h-full relative">
          {/* Donut Chart Section */}
          <div 
            className={`absolute inset-0 transition-transform duration-300 ease-in-out flex items-center justify-center ${
              chartType === 'line' ? 'transform -translate-x-full' : 'transform translate-x-0'
            }`}
          >
            <div className="finance-chart-donut relative mx-auto h-40 w-40 max-w-full overflow-hidden rounded-full drop-shadow-[0_10px_18px_rgba(15,23,42,0.08)]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    onClick={handlePieClick}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-white/80 bg-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {mode === 'expense' ? 'Keluar' : 'Masuk'}
                  </span>
                  <span className="mt-0.5 text-xs font-bold tracking-tight text-slate-800 tabular-nums">
                    Rp {formatCompactCurrency(mode === 'expense' ? totalExpenses : totalIncome)}
                  </span>
                </div>
              </div>

              {/* Invisible trigger for popover positioning */}
              <div className="absolute opacity-0 pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-0 h-0" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 bg-white rounded-xl shadow-lg border" side="top" align="center">
                    {selectedSegment && (
                      <div className="text-center space-y-2">
                        <div className="font-medium text-sm text-gray-900">
                          {selectedSegment.name}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          Rp {selectedSegment.value.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {((selectedSegment.value / (mode === 'expense' ? totalExpenses : totalIncome)) * 100).toFixed(1)}% of {mode === 'expense' ? 'Expenses' : 'Income'}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Line Chart Section */}
          <div 
            className={`absolute inset-0 transition-transform duration-300 ease-in-out flex items-center justify-center ${
              chartType === 'line' ? 'transform translate-x-0' : 'transform translate-x-full'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              {lineChartData && lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart
                    data={lineChartData}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={yAxisConfig.domain}
                      tickFormatter={yAxisConfig.tickFormatter}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length && label) {
                          const value = payload[0].value as number
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                          const formattedDate = `${parseInt(label.toString())} ${monthNames[currentMonth]}`

                          return (
                            <div style={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              padding: '12px',
                              fontSize: '12px'
                            }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#374151',
                                marginBottom: '4px'
                              }}>
                                {value.toLocaleString('id-ID')}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6b7280'
                              }}>
                                {formattedDate}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={mode === 'expense' ? '#ef4444' : '#10b981'}
                      strokeWidth={2}
                      dot={{ fill: mode === 'expense' ? '#ef4444' : '#10b981', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: mode === 'expense' ? '#ef4444' : '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                  No data available for this month
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-2.5 text-sm">
        <span
          className={`flex items-center justify-center gap-1.5 rounded-[15px] px-2 py-2.5 transition-all duration-200 tabular-nums ${mode === 'expense'
            ? 'bg-rose-50 text-rose-700 font-bold ring-1 ring-inset ring-rose-200/80'
            : 'bg-slate-50/80 text-rose-500 ring-1 ring-inset ring-slate-200/70'
            }`}>
          <Minus className="w-4 h-4" />
          {totalExpenses.toLocaleString('id-ID')}
        </span>
        <span
          className={`flex items-center justify-center gap-1.5 rounded-[15px] px-2 py-2.5 transition-all duration-200 tabular-nums ${mode === 'income'
            ? 'bg-emerald-50 text-emerald-700 font-bold ring-1 ring-inset ring-emerald-200/80'
            : 'bg-slate-50/80 text-emerald-600 ring-1 ring-inset ring-slate-200/70'
            }`}>
          <Plus className="w-4 h-4" />
          {totalIncome.toLocaleString('id-ID')}
        </span>

      </div>
    </section>
  )
}
