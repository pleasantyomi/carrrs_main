"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()

        if (data.session && data.profile) {
          if (data.profile.role === "host") {
            router.push("/host")
          } else {
            router.push("/dashboard")
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}
