"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { User, Menu, X, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import Image from "next/image"
import { usePathname } from "next/navigation"


export function CarrrsNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  
  const navigationTabs = [
    { name: "Cars", href: "/cars", isActive: pathname === "/cars" },
    { name: "Stays", href: "/stays", isActive: pathname === "/stays" },
    { name: "Services", href: "/services", isActive: pathname === "/services" },
  ]


  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        // Get user role from metadata or profile
        const role = session.user.user_metadata?.role || "user"
        setUserRole(role)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const role = session.user.user_metadata?.role || "user"
        setUserRole(role)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      })

      if (response.ok) {
        // Refresh the page to update auth state
        window.location.href = "/carrrs"
      }
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <nav className="border-b border-border bg-black/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-11/12 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/carrrs" className="text-2xl font-bold text-primary">
            <Image
              src="/logo/carrs.png"
              alt="Logo"
              width="200"
              height="75"
              className="block h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationTabs.map(({name, href, isActive}) => (
              <Link
                key={name}
                href={href}
                className={`text-foreground hover:text-accent transition-colors font-medium text-[14px] ${
                  isActive ? 'text-primary font-semibold' : ''
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {user ? (
                  <>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a 
                        href={userRole === "host" 
                          ? (process.env.NEXT_PUBLIC_HOST_URL ?? 'http://localhost:3002')
                          : (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3001')
                        }
                        target="_self"
                      >
                        {userRole === "host" ? "Host Dashboard" : "My Dashboard"}
                      </a>
                    </DropdownMenuItem>
                    {userRole === "user" && (
                      <DropdownMenuItem asChild>
                        <a 
                          href={process.env.NEXT_PUBLIC_HOST_URL ?? 'http://localhost:3002'}
                          target="_self"
                        >
                          Become a Host
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/signup">Sign Up</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navigationTabs.map(({name, href, isActive}) => (
                <Link
                  key={name}
                  href={href}
                  className={`text-foreground hover:text-accent transition-colors font-medium ${
                    isActive ? 'text-primary font-semibold' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
