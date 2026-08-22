'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, TrendingUp, TrendingDown, Wallet, Loader2, Mic, Square } from 'lucide-react'
import { convertDatabaseCategoriesToForm, FormCategory } from '@/lib/icon-mapper'
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useMathInput } from '@/lib/math-utils'

// Indonesian month names
const indonesianMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

// Format date in Indonesian format: "D MMM YYYY" (e.g., "7 Agu 2025")
function formatIndonesianDate(date: Date): string {
  const day = date.getDate()
  const month = indonesianMonths[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

interface ExpenseFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading: boolean;
  onCategorySwitch?: (category: 'income' | 'expense') => void;
  isDemoMode?: boolean;
}

interface FormData {
  amount: number;
  category: string;
  date: string;
  note: string;
  type: 'expense' | 'income';
}

export function ExpenseForm({ onSubmit, loading, onCategorySwitch, isDemoMode = false }: ExpenseFormProps) {
  const [activeCategory, setActiveCategory] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [date, setDate] = useState<Date>(new Date()) // Initialize with today's date
  const [note, setNote] = useState('')
  const [expenseCategories, setExpenseCategories] = useState<FormCategory[]>([])
  const [incomeCategories, setIncomeCategories] = useState<FormCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [validationErrors, setValidationErrors] = useState({
    amount: false,
    category: false,
    date: false
  })

  // Use math input hook for amount handling
  const { displayValue: amountDisplayValue, handleAmountChange: handleMathInputChange } = useMathInput(amount, setAmount);

  // Fetch user categories
  const fetchUserCategories = async () => {
    // In demo mode, load default categories directly
    if (isDemoMode) {
      await setDefaultCategories()
      return
    }

    try {
      const response = await fetch('/api/user-categories')
      if (response.ok) {
        const data = await response.json()
        const expenseCats = convertDatabaseCategoriesToForm(data.expense_categories || [])
        const incomeCats = convertDatabaseCategoriesToForm(data.income_categories || [])
        setExpenseCategories(expenseCats)
        setIncomeCategories(incomeCats)
      } else {
        console.error('Failed to fetch user categories, using defaults')
        // Set default categories on API failure
        await setDefaultCategories()
      }
    } catch (error) {
      console.error('Error fetching user categories, using defaults:', error)
      // Set default categories on error
      await setDefaultCategories()
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Set default categories
  const setDefaultCategories = async () => {
    try {
      const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } = await import('@/schema/schema')
      const expenseCats = convertDatabaseCategoriesToForm(DEFAULT_EXPENSE_CATEGORIES)
      const incomeCats = convertDatabaseCategoriesToForm(DEFAULT_INCOME_CATEGORIES)
      setExpenseCategories(expenseCats)
      setIncomeCategories(incomeCats)
    } catch (error) {
      console.error('Error setting default categories:', error)
      // Fallback to empty arrays if import fails
      setExpenseCategories([])
      setIncomeCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    fetchUserCategories()
  }, [])

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  // Notify parent component when category switches
  useEffect(() => {
    if (onCategorySwitch) {
      onCategorySwitch(activeCategory)
    }
  }, [activeCategory, onCategorySwitch])

  const handleSave = async () => {
    if (categoriesLoading) {
      toast.warning('Please wait for categories to load')
      return
    }

    const currentCategories = activeCategory === 'expense' ? expenseCategories : incomeCategories
    if (currentCategories.length === 0 && !categoriesLoading) {
      toast.error('No categories available. Please try refreshing the page.')
      return
    }

    // Clear previous validation errors
    setValidationErrors({ amount: false, category: false, date: false })

    // Validate required fields
    const errors = { amount: false, category: false, date: false }
    const missingFields = []

    // Validate amount
    const amountValue = parseFloat(amount)
    if (!amount.trim() || isNaN(amountValue) || amountValue <= 0) {
      errors.amount = true
      missingFields.push('Amount (must be greater than 0)')
    }

    // Validate category
    if (!selectedCategory) {
      errors.category = true
      missingFields.push('Category')
    }

    // Validate date
    if (!date) {
      errors.date = true
      missingFields.push('Date')
    }

    // Set validation errors
    setValidationErrors(errors)

    if (missingFields.length > 0) {
      toast.warning(`Please fill in the required fields: ${missingFields.join(', ')}`)
      return
    }

    const formData: FormData = {
      amount: amountValue,
      category: selectedCategory,
      date: format(date, 'yyyy-MM-dd'),
      note: note || '',
      type: activeCategory
    }

    try {
      await onSubmit(formData)

      // Reset form after successful submission
      setAmount('')
      setSelectedCategory('')
      setDate(new Date()) // Reset to today's date
      setNote('')
      setValidationErrors({ amount: false, category: false, date: false })
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error)
    }
  }

  const processVoiceRecording = async (audioBlob: Blob, mimeType: string, categories: string[]) => {
    setVoiceState('processing')

    try {
      const payload = new FormData()
      const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      payload.append('audio', audioBlob, `transaction.${extension}`)
      payload.append('mode', activeCategory)
      payload.append('categories', JSON.stringify(categories))
      payload.append('today', format(new Date(), 'yyyy-MM-dd'))

      const response = await fetch('/api/parse-voice-transaction', {
        method: 'POST',
        body: payload,
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Tidak dapat memahami rekaman.')
      }

      setAmount(String(result.amount))
      setSelectedCategory(result.category)
      const [year, month, day] = String(result.date).split('-').map(Number)
      setDate(new Date(year, month - 1, day))
      setNote(result.notes || '')
      setValidationErrors({ amount: false, category: false, date: false })
      toast.success('Form berhasil diisi. Silakan periksa kembali sebelum menyimpan.')
    } catch (error) {
      console.error('Voice transaction error:', error)
      toast.error(error instanceof Error ? error.message : 'Tidak dapat memproses rekaman.')
    } finally {
      setVoiceState('idle')
    }
  }

  const stopVoiceRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const startVoiceRecording = async () => {
    if (isDemoMode) {
      toast.info('Input suara tersedia setelah masuk dengan akun Anda.')
      return
    }

    const currentCategories = activeCategory === 'expense' ? expenseCategories : incomeCategories
    if (categoriesLoading || currentCategories.length === 0) {
      toast.error('Kategori belum tersedia. Silakan coba lagi sebentar.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Perekaman suara tidak didukung oleh browser ini.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const supportedMimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
      const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const recordedType = recorder.mimeType || mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedType })
        stream.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
        void processVoiceRecording(
          audioBlob,
          recordedType,
          currentCategories.map(category => category.value)
        )
      }
      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
        setVoiceState('idle')
        toast.error('Perekaman suara gagal. Silakan coba lagi.')
      }

      recorder.start()
      setVoiceState('recording')
      recordingTimeoutRef.current = setTimeout(stopVoiceRecording, 30000)
    } catch (error) {
      console.error('Microphone access error:', error)
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
      setVoiceState('idle')
      toast.error('Akses mikrofon diperlukan untuk input suara.')
    }
  }

  return (
    <section className="finance-form-card ios-card mt-3 flex w-full max-w-sm flex-shrink-0 flex-col space-y-3 rounded-[28px] p-4">
      {/* Category Segmented Control */}
      <div className="flex w-full gap-1 rounded-[16px] bg-slate-100/90 p-1 ring-1 ring-inset ring-slate-200/60">
        <button
          className={`ios-press flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-xs font-semibold ${activeCategory === 'expense'
            ? 'bg-white text-rose-600 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.03]'
            : 'text-slate-500 hover:text-slate-700'
            }`}
          onClick={() => {
            setActiveCategory('expense')
            setSelectedCategory('') // Clear selected category when switching
            setDate(new Date()) // Set date to today when switching to expense
            // Clear validation errors when switching categories
            setValidationErrors({ amount: false, category: false, date: false })
          }}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Pengeluaran
        </button>
        <button
          className={`ios-press flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-xs font-semibold ${activeCategory === 'income'
            ? 'bg-white text-emerald-600 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.03]'
            : 'text-slate-500 hover:text-slate-700'
            }`}
          onClick={() => {
            setActiveCategory('income')
            setSelectedCategory('') // Clear selected category when switching
            setDate(new Date()) // Set date to today when switching to income
            // Clear validation errors when switching categories
            setValidationErrors({ amount: false, category: false, date: false })
          }}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Pemasukan
        </button>
      </div>

      {/* Input Form */}
      <div className="finance-form-fields w-full space-y-3">
        {/* Amount Input */}
        <div className="w-full space-y-3">
          <div className="w-full">
            <div className={cn(
              "relative w-full rounded-[20px] bg-slate-50/90 ring-1 ring-inset transition-shadow",
              validationErrors.amount ? "ring-rose-300" : "ring-slate-200/80 focus-within:ring-2 focus-within:ring-blue-400/40"
            )}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                id="amount"
                placeholder="0"
                inputMode="decimal"
                pattern="[0-9+\-*/\s]*"
                autoComplete="off"
                required
                value={amountDisplayValue}
                onChange={(e) => {
                  handleMathInputChange(e);
                  // Clear amount validation error when user starts typing or clears the field
                  if (validationErrors.amount) {
                    setValidationErrors(prev => ({ ...prev, amount: false }))
                  }
                }}
                onBlur={() => {
                  // Validate amount on blur - ensure it's not zero or negative
                  const numValue = parseFloat(amount);
                  if (amount && (isNaN(numValue) || numValue <= 0)) {
                    setValidationErrors(prev => ({ ...prev, amount: true }))
                  }
                }}
                className={cn(
                  "h-[3.25rem] w-full appearance-none border-0 bg-transparent pl-12 pr-4 text-right text-[1.35rem] font-bold tracking-tight text-slate-950 placeholder:text-slate-300 focus:placeholder:opacity-0 focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  validationErrors.amount ? "text-rose-700" : ""
                )}
              />
            </div>
          </div>

          {/* Category & Date Row */}
          <div className="flex w-full gap-2.5">
            {/* Category Select */}
            <div className="flex-1">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  // Clear category validation error when user selects a category
                  if (validationErrors.category) {
                    setValidationErrors(prev => ({ ...prev, category: false }))
                  }
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger className={cn(
                  "ios-control h-11 w-full rounded-[15px] px-3 text-left text-sm shadow-none focus:ring-0 disabled:opacity-50",
                  validationErrors.category
                    ? "border-rose-300 bg-rose-50/50"
                    : "hover:border-slate-300 hover:bg-white"
                )}>
                  <div className="flex items-center gap-2">
                    {selectedCategory ? (
                      (() => {
                        const category = (activeCategory === 'expense' ? expenseCategories : incomeCategories)
                          .find(cat => cat.value === selectedCategory);
                        return category ? (
                          <span className="truncate">{category.value}</span>
                        ) : null;
                      })()
                    ) : (
                      <>
                        {categoriesLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-secondary-foreground/50" />
                        ) : null}
                        <span className="text-secondary-foreground/50">
                          {categoriesLoading ? 'Loading...' : 'Kategori'}
                        </span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  {(() => {
                    const currentCategories = activeCategory === 'expense' ? expenseCategories : incomeCategories
                    if (currentCategories.length === 0) {
                      return (
                        <div className="p-2 text-center text-sm text-secondary-foreground/50">
                          {categoriesLoading ? 'Loading categories...' : 'No categories available'}
                        </div>
                      )
                    }
                    return currentCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <span className="truncate">{category.value}</span>
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "ios-control ios-press flex h-11 w-full items-center gap-2 rounded-[15px] px-3 text-left text-sm",
                    validationErrors.date
                      ? "border-rose-300 bg-rose-50/50"
                      : "hover:border-slate-300 hover:bg-white"
                  )}>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                      <span className={cn("truncate", !date && "text-secondary-foreground/50")}>
                        {date ? formatIndonesianDate(date) : "Tanggal"}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg border-0 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(day) => {
                      if (day) {
                        setDate(day)
                        // Clear date validation error when user selects a date
                        if (validationErrors.date) {
                          setValidationErrors(prev => ({ ...prev, date: false }))
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Note Input */}
          <div className="w-full">
            <textarea
              id="note"
              placeholder="Catatan..."
              className="ios-control flex h-11 max-h-24 w-full resize-none overflow-hidden rounded-[15px] px-3 py-3 text-sm text-slate-800 shadow-none placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/15"
              value={note}
              onChange={(e) => {
                e.target.style.height = '2.75rem';
                e.target.style.height = e.target.scrollHeight + 'px';
                setNote(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex w-full gap-2.5 pt-0.5">
          <Button
            onClick={handleSave}
            disabled={loading || voiceState !== 'idle'}
            className="ios-press h-12 flex-1 rounded-[16px] bg-[linear-gradient(135deg,#1677ff_0%,#4f46e5_100%)] text-sm font-semibold shadow-[0_10px_24px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-105"
          >
            {loading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-1 h-4 w-4" />
            )}
            {loading ? 'Saving...' : 'Save Transaction'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={voiceState === 'recording' ? stopVoiceRecording : startVoiceRecording}
            disabled={loading || voiceState === 'processing'}
            aria-label={voiceState === 'recording' ? 'Stop voice recording' : 'Fill transaction with voice'}
            title={voiceState === 'recording' ? 'Stop recording' : 'Input dengan suara'}
            className={cn(
              'ios-press relative h-12 w-12 flex-shrink-0 rounded-[16px] border-slate-200 p-0 shadow-[0_3px_12px_rgba(15,23,42,0.06)]',
              voiceState === 'recording'
                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
            )}
          >
            {voiceState === 'processing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : voiceState === 'recording' ? (
              <>
                <span className="absolute inset-1 animate-ping rounded-lg bg-rose-400/15" />
                <Square className="relative h-3.5 w-3.5 fill-current" />
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
