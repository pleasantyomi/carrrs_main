"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Car } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6  text-md cursor-pointer font-medium rounded-xl "
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export function LoginForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      // Check if response is ok and content-type is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Expected JSON response but got " + contentType)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in")
      }

      toast.success("Welcome back!", {
        description: "You have been successfully signed in.",
      })

      // Redirect based on user role
      if (data.redirectUrl) {
        // If redirecting to a different app, use window.location
        const currentOrigin = window.location.origin
        if (data.redirectUrl.startsWith('http') && !data.redirectUrl.startsWith(currentOrigin)) {
          window.location.href = data.redirectUrl
        } else {
          // If staying in same app, use router
          router.push(data.redirectUrl.replace(currentOrigin, '') || '/dashboard')
        }
      } else {
        // Fallback redirect
        router.push("/dashboard")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error("Sign in failed", {
        description: errorMessage,
      })
      console.error("Login error:", err)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-card border-border">
      <CardHeader className="text-center space-y-4">
         <Image
          src="/logo/carrs.png"
          alt="Logo"
          width="200"
          height="75"
          className="block mx-auto"
        />
        <CardTitle className="text-3xl font-bold text-foreground">Welcome back to Carrrs</CardTitle>
        {/* <p className="text-muted-foreground">Sign in to your account</p> */}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-background border-border text-foreground rounded-lg"
              />
            </div>
          </div>

          <SubmitButton pending={pending} />

          <div className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
