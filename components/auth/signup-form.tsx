"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Car, User, Building } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-md font-medium rounded-xl"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export function SignUpForm() {
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = (formData.get("role") as string) || "user"

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      // Check if response is ok and content-type is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Expected JSON response but got " + contentType)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      toast.success("Account created successfully!", {
        description: "Please check your email to verify your account.",
      })
      
      // Store role information for post-email-confirmation redirect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingSignupRole', role)
        sessionStorage.setItem('pendingSignupRedirectUrl', data.redirectUrl || '')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error("Signup failed", {
        description: errorMessage,
      })
      console.error("Signup error:", err)
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
        {/* <CardTitle className="text-3xl font-bold text-foreground">Join Carrrs</CardTitle> */}
        <p className="text-muted-foreground">Create your account to get started</p>
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Account Type</label>
              <RadioGroup defaultValue="user" name="role" className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border border-border rounded-lg p-3 hover:bg-secondary/50">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="flex items-center cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Customer
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-border rounded-lg p-3 hover:bg-secondary/50">
                  <RadioGroupItem value="host" id="host" />
                  <Label htmlFor="host" className="flex items-center cursor-pointer">
                    <Building className="h-4 w-4 mr-2" />
                    Host
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Note:</span> Selecting "Host" will require additional information after account verification to complete your host registration.
              </p>
            </div>
          </div>

          <SubmitButton pending={pending} />

          <div className="text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
