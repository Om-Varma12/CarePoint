"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Moon, Sun, X, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string | null
  onLogout: () => void
}

export function SettingsModal({ isOpen, onClose, userName, onLogout }: SettingsModalProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info Section */}
        {userName && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="text-lg font-semibold text-foreground">{userName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Appearance</h3>
          <div className="flex gap-3">
            <Button
              variant={mounted && theme === "light" ? "default" : "outline"}
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="w-4 h-4" />
              Light
            </Button>
            <Button
              variant={mounted && theme === "dark" ? "default" : "outline"}
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="w-4 h-4" />
              Dark
            </Button>
          </div>
        </div>

        {/* Logout Section */}
        {userName && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                onLogout()
                onClose()
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}

        {/* Guest Message */}
        {!userName && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Login to access more features
            </p>
          </div>
        )}
      </div>
    </div>
  )
}