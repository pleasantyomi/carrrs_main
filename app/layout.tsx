import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { ToastProvider } from "@/components/ui/toast-provider"
import "./globals.css"
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "carrrs.",
  description: "Rent unique cars from local hosts in Nigeria.",
  openGraph: {
    title: "carrrs.",
    description: "Rent unique cars from local hosts in Nigeria.",
    url: "https://carrrs.company", 
    siteName: "carrrs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "carrrs.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "carrrs.",
    description: "Rent unique cars from local hosts in Nigeria.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.className} antialiased relative`}>
      <body className="min-h-screen bg-black text-white">
        {children}
        <ToastProvider />
        <Script 
          src="https://checkout.flutterwave.com/v3.js" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
