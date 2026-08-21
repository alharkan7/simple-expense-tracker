'use client'

import { signIn } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Wallet, ShieldCheck, TrendingUp } from 'lucide-react'

export function LoginScreen({ onDemoClick }: { onDemoClick?: () => void }) {
  return (
    <div className="w-full relative overflow-hidden bg-[#0a1128]" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Hero background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1128] via-[#0e1b3d] to-[#12275c]"></div>

        {/* Fine grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 110% 75% at 50% 32%, black 45%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 110% 75% at 50% 32%, black 45%, transparent 90%)',
          }}
        ></div>

        {/* Glow orbs */}
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-blue-500/25 blur-3xl animate-glow-slow"></div>
        <div className="absolute top-40 -left-24 w-64 h-64 rounded-full bg-indigo-400/15 blur-3xl animate-glow-slower"></div>

        {/* Area chart graphic */}
        <svg
          className="absolute left-0 w-full h-72 top-1/2 -translate-y-1/2"
          viewBox="0 0 390 288"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <path
            d="M0,240 C40,230 60,195 90,200 C120,205 140,155 175,148 C210,141 225,178 260,160 C295,142 310,90 350,78 C365,74 380,68 390,64 L390,288 L0,288 Z"
            fill="url(#chartFill)"
          />
          <path
            d="M0,240 C40,230 60,195 90,200 C120,205 140,155 175,148 C210,141 225,178 260,160 C295,142 310,90 350,78 C365,74 380,68 390,64"
            fill="none"
            stroke="url(#chartStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="350" cy="78" r="4" fill="#818cf8" />
          <circle cx="350" cy="78" r="9" fill="#818cf8" opacity="0.25" className="animate-pulse-dot" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Brand header */}
        <div className="pt-16 px-6 max-w-sm mx-auto w-full flex-shrink-0 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg shadow-blue-900/40 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-sky-300" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Finance Tracker
          </h1>
          <p className="mt-2 text-sm text-blue-200/70 leading-relaxed max-w-[16rem]">
            Track spending, grow savings, and stay in control of your money.
          </p>
        </div>

        {/* Floating stat chips */}
        <div className="mt-10 px-6 max-w-sm mx-auto w-full flex justify-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-blue-100" />
            <span className="text-xs font-medium text-blue-100">Insights</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-blue-100" />
            <span className="text-xs font-medium text-blue-100">Secure</span>
          </div>
        </div>

        {/* Spacer pushes sheet down */}
        <div className="flex-1 min-h-[7rem]"></div>

        {/* Login sheet */}
        <div className="flex-shrink-0 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-[0_-12px_40px_rgba(2,8,30,0.45)]">
          <div className="max-w-sm mx-auto w-full">
          <Button
            onClick={() => signIn('google')}
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
            Sign in with Google
          </Button>

          {/* Hidden: demo entry and admin contact
          <div className="text-center text-sm text-gray-400 mt-3">
            or
          </div>

          <Button
            onClick={onDemoClick}
            variant="outline"
            className="w-full h-12 mt-3 rounded-xl"
          >
            <Wallet className="w-4 h-4" />
            Open Demo
          </Button>

          <div className="text-center text-xs text-gray-500 max-w-xs mx-auto mt-4">
            <p>
              Need help? Reach out to <a href="mailto:alharkan7@gmail.com" className="text-blue-500 hover:text-blue-600 underline">Admin</a>
            </p>
          </div>
          */}

          <p className="mt-5 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your data stays private.
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
