import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

interface GeminiTransaction {
  amount: number
  category: string
  date: string
  notes: string
  transcript: string
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to use voice input.' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Voice input is not configured.' }, { status: 503 })
    }

    const formData = await request.formData()
    const audio = formData.get('audio')
    const mode = formData.get('mode')
    const categoriesValue = formData.get('categories')
    const today = formData.get('today')

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: 'No audio was received.' }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'The recording is too large.' }, { status: 413 })
    }
    if (mode !== 'expense' && mode !== 'income') {
      return NextResponse.json({ error: 'Invalid transaction mode.' }, { status: 400 })
    }

    let categories: string[] = []
    try {
      const parsed = JSON.parse(String(categoriesValue || '[]'))
      if (Array.isArray(parsed)) {
        categories = parsed
          .filter((value): value is string => typeof value === 'string' && value.length > 0 && value.length <= 100)
          .slice(0, 100)
      }
    } catch {
      return NextResponse.json({ error: 'Invalid category list.' }, { status: 400 })
    }

    if (categories.length === 0) {
      return NextResponse.json({ error: 'No categories are available yet.' }, { status: 400 })
    }

    const audioBase64 = Buffer.from(await audio.arrayBuffer()).toString('base64')
    const transactionLabel = mode === 'expense' ? 'pengeluaran' : 'pemasukan'
    const prompt = `
Listen to this Indonesian voice note and extract exactly one ${transactionLabel} transaction.

Rules:
- The active transaction mode is ${mode}. Never change it.
- amount must be the numeric rupiah amount. Interpret Indonesian number phrases correctly (for example, "lima puluh ribu" = 50000).
- category must be copied exactly from this allowed list: ${JSON.stringify(categories)}.
- Choose the closest semantic category from the list. Never invent or rewrite a category.
- date must use YYYY-MM-DD. Today is ${String(today)}. Use today when the speaker does not specify a date.
- Resolve relative Indonesian dates such as kemarin, lusa, or minggu lalu relative to today.
- notes should contain useful transaction details that are not the amount, category, or date. Use an empty string if none exist.
- transcript should be a concise verbatim transcription of the speech.
- If some wording is ambiguous, make the most reasonable interpretation while obeying the allowed category list.
`.trim()

    const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: audio.type || 'audio/webm',
                  data: audioBase64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                amount: { type: 'NUMBER' },
                category: { type: 'STRING', enum: categories },
                date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
                notes: { type: 'STRING' },
                transcript: { type: 'STRING' },
              },
              required: ['amount', 'category', 'date', 'notes', 'transcript'],
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const detail = await response.text()
      console.error('Gemini voice transaction error:', response.status, detail)
      return NextResponse.json({ error: 'Could not understand the recording. Please try again.' }, { status: 502 })
    }

    const geminiResponse = await response.json()
    const responseText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) {
      return NextResponse.json({ error: 'No transaction was detected in the recording.' }, { status: 422 })
    }

    const transaction = JSON.parse(responseText) as GeminiTransaction
    const dateParts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(transaction.date)
    const parsedDate = dateParts
      ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])))
      : null
    const isValidDate = Boolean(
      dateParts &&
      parsedDate &&
      parsedDate.getUTCFullYear() === Number(dateParts[1]) &&
      parsedDate.getUTCMonth() === Number(dateParts[2]) - 1 &&
      parsedDate.getUTCDate() === Number(dateParts[3])
    )
    if (
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0 ||
      !categories.includes(transaction.category) ||
      !isValidDate
    ) {
      return NextResponse.json({ error: 'The recording did not contain a complete transaction.' }, { status: 422 })
    }

    return NextResponse.json({
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      notes: typeof transaction.notes === 'string' ? transaction.notes : '',
      transcript: typeof transaction.transcript === 'string' ? transaction.transcript : '',
    })
  } catch (error) {
    console.error('Voice transaction parsing failed:', error)
    return NextResponse.json({ error: 'Could not process the recording.' }, { status: 500 })
  }
}
