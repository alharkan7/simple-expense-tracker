'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc, Calendar, Edit2, Check, X, Loader2, Trash2, ReceiptText, AlertTriangle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { convertDatabaseCategoriesToForm, FormCategory } from '@/lib/icon-mapper'

interface TransactionRecord {
  id?: number;
  user_id?: number;
  timestamp?: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  source?: string;
  external_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface TransactionTableProps {
  expenses: TransactionRecord[];
  incomes: TransactionRecord[];
  loading: boolean;
  currentMonth: number;
  currentYear: number;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  getMonthName: (month: number) => string;
  onBackClick?: () => void;
  onRefreshData?: () => void;
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export function TransactionTable({
  expenses,
  incomes,
  loading,
  currentMonth,
  currentYear,
  onNavigateMonth,
  getMonthName,
  onBackClick,
  onRefreshData
}: TransactionTableProps) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expenseCategories, setExpenseCategories] = useState<FormCategory[]>([])
  const [incomeCategories, setIncomeCategories] = useState<FormCategory[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    category: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionRecord | null>(null)

  // Fetch user categories for filter options
  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const response = await fetch('/api/user-categories')
        if (response.ok) {
          const data = await response.json()
          const expenseCats = convertDatabaseCategoriesToForm(data.expense_categories || [])
          const incomeCats = convertDatabaseCategoriesToForm(data.income_categories || [])
          setExpenseCategories(expenseCats)
          setIncomeCategories(incomeCats)
        }
      } catch (error) {
        console.error('Error fetching user categories:', error)
      }
    }

    fetchUserCategories()
  }, [])

  // Calculate navigation limits
  const getDateLimits = () => {
    const allDates = [...expenses, ...incomes]
      .filter(item => item && item.date)
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

  const canNavigatePrev = prevMonth >= minDate
  const canNavigateNext = nextMonth <= maxDate

  // Filter and sort data
  const processedData = useMemo(() => {
    const dataToUse = activeTab === 'expense' ? expenses : incomes
    
    // Filter by current month
    const filteredByMonth = dataToUse.filter(item => {
      if (!item || !item.date) return false
      try {
        const itemDate = new Date(item.date)
        if (isNaN(itemDate.getTime())) return false
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      } catch {
        return false
      }
    })

    // Filter by category
    const filteredByCategory = categoryFilter === 'all' 
      ? filteredByMonth 
      : filteredByMonth.filter(item => item.category === categoryFilter)

    // Sort data
    const sortedData = [...filteredByCategory].sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = typeof a.amount === 'number' ? a.amount : parseFloat(String(a.amount) || '0')
          bValue = typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount) || '0')
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sortedData
  }, [activeTab, expenses, incomes, currentMonth, currentYear, categoryFilter, sortField, sortDirection])

  // Get available categories for current tab
  const availableCategories = useMemo(() => {
    const dataToUse = activeTab === 'expense' ? expenses : incomes
    const filteredData = dataToUse.filter(item => {
      if (!item || !item.date) return false
      try {
        const itemDate = new Date(item.date)
        if (isNaN(itemDate.getTime())) return false
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
      } catch {
        return false
      }
    })
    
    const uniqueCategories = Array.from(new Set(filteredData.map(item => item.category))).filter(Boolean)
    return uniqueCategories
  }, [activeTab, expenses, incomes, currentMonth, currentYear])

  // Reset category filter when switching tabs or months
  useEffect(() => {
    setCategoryFilter('all')
  }, [activeTab, currentMonth, currentYear])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.getMonth() + 1
      return `${day}/${month}`
    } catch {
      return dateString
    }
  }

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount?.toString() || '0')
    return `Rp ${numAmount.toLocaleString('id-ID')}`
  }

  const extractCategoryLabel = (categoryValue: string) => {
    // Remove emoji and extract the main text
    return categoryValue.replace(/^[^\w\s]+\s*/, '').trim()
  }

  const handleEdit = (transaction: TransactionRecord) => {
    const transactionId = `${transaction.id || 'temp'}-${transaction.date}-${transaction.amount}`
    setEditingId(transactionId)
    setEditForm({
      amount: parseFloat(transaction.amount.toString()).toString(), // Remove trailing decimals
      category: transaction.category,
      description: transaction.description || ''
    })
  }

  const handleSaveEdit = async (transaction: TransactionRecord) => {
    try {
      if (!transaction.id) {
        console.error('Cannot update transaction without ID')
        return
      }

      const amount = parseFloat(editForm.amount)
      if (isNaN(amount) || amount < 0) {
        console.error('Invalid amount')
        return
      }

      setSaving(true)

      const updateData = {
        id: transaction.id,
        date: transaction.date, // Keep original date for now
        amount: amount,
        category: editForm.category,
        description: editForm.description || undefined
      }

      // Determine API endpoint based on active tab
      const endpoint = activeTab === 'expense' ? '/api/update-expense' : '/api/update-income'

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        console.log('Transaction updated successfully')
        // Refresh data from parent component
        if (onRefreshData) {
          onRefreshData()
        }
        setEditingId(null)
        setEditForm({ amount: '', category: '', description: '' })
      } else {
        const errorData = await response.json()
        console.error('Failed to update transaction:', errorData)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      // You could show a toast notification here
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ amount: '', category: '', description: '' })
  }

  const handleDelete = (transaction: TransactionRecord) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!transactionToDelete || !transactionToDelete.id) {
      console.error('Cannot delete transaction without ID')
      return
    }

    const transactionId = `${transactionToDelete.id}-${transactionToDelete.date}-${transactionToDelete.amount}`

    try {
      setDeletingId(transactionId)
      setDeleteDialogOpen(false)

      // Determine API endpoint based on active tab
      const endpoint = activeTab === 'expense' ? '/api/delete-expense' : '/api/delete-income'

      const response = await fetch(`${endpoint}?id=${transactionToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Transaction deleted successfully')
        // Refresh data from parent component
        if (onRefreshData) {
          onRefreshData()
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to delete transaction:', errorData)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      // You could show a toast notification here
    } finally {
      setDeletingId(null)
      setTransactionToDelete(null)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setTransactionToDelete(null)
  }

  if (loading) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button disabled className="p-1 rounded-full text-gray-300 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-gray-600 text-sm">Loading...</p>
          <button disabled className="p-1 rounded-full text-gray-300 cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Loading content */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header with back button and month navigation */}
      <div className="mb-4 flex flex-shrink-0 items-center justify-between">
        {/* Back button */}
        {onBackClick && (
          <Button
            onClick={onBackClick}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Month navigation */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-1">
          <button
            onClick={() => onNavigateMonth('prev')}
            disabled={!canNavigatePrev}
            className={`rounded-lg p-1.5 transition-colors ${
              canNavigatePrev
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="min-w-[112px] text-center text-sm font-semibold tracking-tight text-slate-800">
            {getMonthName(currentMonth)} {currentYear}
          </p>
          <button
            onClick={() => onNavigateMonth('next')}
            disabled={!canNavigateNext}
            className={`rounded-lg p-1.5 transition-colors ${
              canNavigateNext
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Spacer for centering */}
        <div className="w-6" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'expense' | 'income')} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid h-11 w-full flex-shrink-0 grid-cols-2 rounded-xl border-0 bg-slate-100 p-1">
          <TabsTrigger value="expense" className="rounded-lg border-0 text-xs font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm">
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="income" className="rounded-lg border-0 text-xs font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm">
            Pemasukan
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          {/* Filters and Sort */}
          <div className="mb-3 flex flex-shrink-0 items-center gap-2">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-sm">
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <SelectValue placeholder="Kategori" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Semua Kategori</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 px-2.5 text-xs shadow-sm"
                onClick={() => handleSort('date')}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {sortField === 'date' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 px-2.5 text-xs shadow-sm"
                onClick={() => handleSort('amount')}
              >
                Rp
                {sortField === 'amount' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-slate-200 px-2.5 text-xs shadow-sm"
                onClick={() => handleSort('category')}
              >
                Cat
                {sortField === 'category' && (
                  sortDirection === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-3 pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
            {processedData.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-slate-400">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">Belum ada transaksi</p>
                <p className="mt-1 text-xs">Tidak ada data untuk bulan ini</p>
              </div>
            ) : (
              processedData.map((transaction, index) => {
                const transactionId = `${transaction.id || index}-${transaction.date}-${transaction.amount}`
                const isEditing = editingId === transactionId
                const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories
                
                return (
                  <div
                    key={transactionId}
                    className="group relative rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                  >
                    {!isEditing ? (
                      <>
                        {/* Row 1: Category/Date and Amount */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
                              {transaction.category} <span className="ml-1 text-[11px] font-medium text-slate-400">{formatDate(transaction.date)}</span>
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className={`text-sm font-bold tabular-nums tracking-tight ${
                              activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {activeTab === 'expense' ? '-' : '+'}
                              {formatAmount(transaction.amount)}
                            </p>
                          </div>
                        </div>

                        {/* Row 2: Description and Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            {transaction.description ? (
                              <p className="truncate text-xs leading-5 text-slate-500">
                                {transaction.description}
                              </p>
                            ) : (
                              <div className="h-4"></div> // Placeholder for consistent height
                            )}
                          </div>
                          <div className="flex flex-shrink-0 gap-1">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction)}
                              disabled={deletingId === transactionId}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete transaction"
                            >
                              {deletingId === transactionId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Edit Form */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={editForm.amount}
                              onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                              placeholder="Amount"
                              className="h-8 text-xs rounded-lg flex-1"
                            />
                            <Select
                              value={editForm.category}
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Category">
                                  {editForm.category && (
                                    <span className="truncate block w-full text-left">
                                      {editForm.category}
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {currentCategories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Description (optional)"
                              className="h-8 text-xs rounded-lg flex-1"
                            />
                            {/* Save/Cancel Buttons */}
                            <div className="flex flex-shrink-0">
                              <button
                                onClick={() => handleSaveEdit(transaction)}
                                disabled={saving}
                                className="p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save changes"
                              >
                                {saving ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                title="Cancel edit"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Summary */}
          {processedData.length > 0 && (
            <div className="-mx-4 flex-shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 py-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total Transaksi</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">{processedData.length} transaksi</p>
                </div>
                <span className={`text-xl font-bold tabular-nums tracking-tight ${
                  activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {formatAmount(
                    processedData.reduce((sum, transaction) => {
                      const amount = typeof transaction.amount === 'number'
                        ? transaction.amount
                        : parseFloat(String(transaction.amount) || '0')
                      return sum + (isNaN(amount) ? 0 : amount)
                    }, 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <DialogHeader className="px-6 pb-5 pt-6 text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
              Hapus transaksi?
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-6 text-slate-500">
              Transaksi ini akan dihapus secara permanen dan tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          
          {/* Transaction Details */}
          {transactionToDelete && (
            <div className="mx-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {transactionToDelete.category}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {formatDate(transactionToDelete.date)}
                  </p>
                </div>
                <p className={`flex-shrink-0 text-base font-bold tabular-nums tracking-tight ${
                  activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {activeTab === 'expense' ? '-' : '+'}
                  {formatAmount(transactionToDelete.amount)}
                </p>
              </div>
              {transactionToDelete.description && (
                <p className="mt-3 border-t border-slate-200 pt-3 text-left text-xs leading-5 text-slate-500">
                  {transactionToDelete.description}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:grid-cols-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deletingId !== null}
              className="h-11 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deletingId !== null}
              className="h-11 rounded-xl bg-rose-600 font-semibold text-white shadow-[0_8px_20px_rgba(225,29,72,0.22)] hover:bg-rose-700"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
