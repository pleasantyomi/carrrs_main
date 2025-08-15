"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SignUpForm } from "@/components/auth/signup-form"

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        
        // Check if response is ok and content-type is JSON
        if (!response.ok) {
          console.log("Auth check failed - user not authenticated")
          return
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Auth check error: Expected JSON but got:", contentType)
          return
        }

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
        // Don't redirect on error, just stay on signup page
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}
