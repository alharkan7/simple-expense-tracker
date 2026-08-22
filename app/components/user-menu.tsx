'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import { User, LogOut, Zap, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  isDemoMode?: boolean
  onOpenBudget?: () => void
  onOpenSettings?: () => void
}

export function UserMenu({ isDemoMode = false, onOpenBudget, onOpenSettings }: UserMenuProps) {
  const { data: session, status } = useSession()

  if (status === "loading" && !isDemoMode) {
    return <User className="w-6 h-6 text-white animate-pulse" />
  }

  if (session || isDemoMode) {
    const demoUser = {
      name: 'User Name',
      email: 'user@youremail.com',
      image: null
    }
    const user = isDemoMode ? demoUser : session?.user
    return (
      <div className="flex items-center gap-3">
        {/* Display user name */}
        <span className="hidden text-sm font-medium text-white/80 sm:block">
          Welcome, {user?.name?.split(' ')[0] || 'User'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ios-press h-11 w-11 rounded-full border-2 border-white/70 bg-white/10 p-0 shadow-[0_8px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-xl hover:bg-white/15">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[9999] w-64 rounded-[20px] border border-white/80 bg-white/95 p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            {/* User info in dropdown */}
            <div className="px-3 py-2 text-sm border-b border-border">
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-muted-foreground text-xs">{user?.email}</div>
            </div>

            {onOpenBudget && (
              <DropdownMenuItem
                onClick={() => onOpenBudget()}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Zap className="w-4 h-4" />
                Anggaran
              </DropdownMenuItem>
            )}

            {onOpenSettings && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onOpenSettings()}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                if (isDemoMode) {
                  // Reload page to exit demo mode
                  window.location.reload()
                } else {
                  signOut()
                }
              }}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <LogOut className="w-4 h-4" />
              {isDemoMode ? 'Exit Demo' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signIn("google")}
    >
      <User className="w-4 h-4 mr-2" />
      Sign In
    </Button>
  )
}
