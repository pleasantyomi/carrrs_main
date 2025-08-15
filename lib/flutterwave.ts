export interface FlutterwaveConfig {
  public_key: string
  tx_ref: string
  amount: number
  currency: string
  payment_options: string
  customer: {
    email: string
    phone_number: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo: string
  }
  callback: (response: any) => void
  onclose: () => void
}

export const generateTxRef = (): string => {
  return `CARRRS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const initializeFlutterwavePayment = (config: FlutterwaveConfig) => {
  // This would typically load the Flutterwave script dynamically
  if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
    ;(window as any).FlutterwaveCheckout(config)
  } else {
    console.error("Flutterwave checkout not loaded")
  }
}

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount)
}
