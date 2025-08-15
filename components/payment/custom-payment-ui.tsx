"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Banknote, 
  Shield, 
  Lock,
  CheckCircle,
  Loader2,
  Info
} from "lucide-react"
import { generateTxRef } from "@/lib/flutterwave"

interface CustomPaymentUIProps {
  amount: number
  bookingId: string
  userEmail: string
  userName: string
  userPhone: string
  bookingType: "car" | "experience" | "service" | "stay"
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

interface PaymentData {
  // Card payment
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  pin?: string
  
  // Bank transfer
  bankCode: string
  accountNumber: string
  
  // USSD
  ussdBank: string
  
  // Mobile money
  network: string
  voucher?: string
}

export function CustomPaymentUI({
  amount,
  bookingId,
  userEmail,
  userName,
  userPhone,
  bookingType,
  onSuccess,
  onError,
}: CustomPaymentUIProps) {
  const [selectedMethod, setSelectedMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCardPin, setShowCardPin] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    pin: "",
    bankCode: "",
    accountNumber: "",
    ussdBank: "",
    network: "",
    voucher: ""
  })

  const paymentMethods = [
    {
      id: "card",
      name: "Debit/Credit Card",
      icon: CreditCard,
      description: "Pay with your debit or credit card",
      fee: "₦100 + 1.4%",
      popular: true
    },
    {
      id: "transfer",
      name: "Bank Transfer",
      icon: Building2,
      description: "Direct bank transfer",
      fee: "₦50",
      popular: false
    },
    {
      id: "ussd",
      name: "USSD",
      icon: Smartphone,
      description: "Pay using your phone",
      fee: "₦50",
      popular: false
    },
    {
      id: "mobile_money",
      name: "Mobile Money",
      icon: Banknote,
      description: "MTN, Airtel, etc.",
      fee: "₦100",
      popular: false
    }
  ]

  const nigerianBanks = [
    { code: "044", name: "Access Bank" },
    { code: "014", name: "Afribank" },
    { code: "030", name: "Diamond Bank" },
    { code: "050", name: "Ecobank" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "526", name: "Providus Bank" },
    { code: "076", name: "Polaris Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "068", name: "Standard Chartered" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank" },
    { code: "033", name: "United Bank for Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" }
  ]

  const mobileNetworks = [
    { code: "MTN", name: "MTN" },
    { code: "AIRTEL", name: "Airtel" },
    { code: "GLO", name: "Glo" },
    { code: "9MOBILE", name: "9mobile" }
  ]

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      const txRef = generateTxRef()

      // Initialize payment record
      const initResponse = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          amount,
          tx_ref: txRef,
        }),
      })

      if (!initResponse.ok) {
        throw new Error("Failed to initialize payment")
      }

      // Prepare payment payload based on selected method
      let paymentPayload: any = {
        tx_ref: txRef,
        amount,
        currency: "NGN",
        customer: {
          email: userEmail,
          phone_number: userPhone,
          name: userName,
        },
        customizations: {
          title: "Carrrs Payment",
          description: `Payment for ${bookingType} booking`,
          logo: "/logo/carrsWText.png",
        }
      }

      // Add method-specific data
      switch (selectedMethod) {
        case "card":
          paymentPayload.type = "card"
          paymentPayload.card = {
            card_number: paymentData.cardNumber.replace(/\s/g, ""),
            cvv: paymentData.cvv,
            expiry_month: paymentData.expiryMonth,
            expiry_year: paymentData.expiryYear,
            pin: paymentData.pin
          }
          break

        case "transfer":
          paymentPayload.type = "bank_transfer"
          paymentPayload.bank = {
            code: paymentData.bankCode,
            account_number: paymentData.accountNumber
          }
          break

        case "ussd":
          paymentPayload.type = "ussd"
          paymentPayload.ussd = {
            code: paymentData.ussdBank
          }
          break

        case "mobile_money":
          paymentPayload.type = "mobile_money_nigeria"
          paymentPayload.mobile_money = {
            phone: userPhone,
            network: paymentData.network,
            voucher: paymentData.voucher
          }
          break
      }

      // Process payment through your backend
      const paymentResponse = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload)
      })

      const result = await paymentResponse.json()

      if (result.status === "successful") {
        onSuccess?.(result)
      } else if (result.status === "pending") {
        // Handle pending payments (like bank transfers, USSD)
        alert(`Payment initiated! ${result.message || 'Please complete the payment.'}`)
      } else {
        throw new Error(result.message || "Payment failed")
      }

    } catch (error) {
      console.error("Payment failed:", error)
      onError?.(error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const calculateFee = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod)
    if (!method) return 0

    switch (selectedMethod) {
      case "card":
        return 100 + (amount * 0.014)
      case "transfer":
      case "ussd":
        return 50
      case "mobile_money":
        return 100
      default:
        return 0
    }
  }

  const total = amount + calculateFee()

  return (
    <div className="space-y-6">
      {/* Amount Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold">₦{amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">+ ₦{calculateFee().toFixed(0)} processing fee</p>
            </div>
            <div className="flex items-center space-x-2 text-primary">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Secured by Flutterwave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Choose Payment Method</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <div
                  key={method.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  {method.popular && (
                    <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground">
                      Popular
                    </Badge>
                  )}
                  <div className="flex items-start space-x-3">
                    <Icon className="h-6 w-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <p className="text-xs text-primary font-medium mt-1">Fee: {method.fee}</p>
                    </div>
                    <div className={`w-4 h-4 border-2 rounded-full ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {selectedMethod === method.id && (
                        <CheckCircle className="w-3 h-3 text-primary-foreground m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMethod} className="w-full">
            {/* Card Payment */}
            <TabsContent value="card" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value)
                      setPaymentData({ ...paymentData, cardNumber: formatted })
                    }}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Month</Label>
                    <Select
                      value={paymentData.expiryMonth}
                      onValueChange={(value) => setPaymentData({ ...paymentData, expiryMonth: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Year</Label>
                    <Select
                      value={paymentData.expiryYear}
                      onValueChange={(value) => setPaymentData({ ...paymentData, expiryYear: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="YY" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i
                          return (
                            <SelectItem key={year} value={String(year).slice(-2)}>
                              {year}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      maxLength={4}
                    />
                  </div>
                </div>
                {showCardPin && (
                  <div className="space-y-2">
                    <Label htmlFor="pin">Card PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your 4-digit PIN"
                      value={paymentData.pin}
                      onChange={(e) => setPaymentData({ ...paymentData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      maxLength={4}
                    />
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Your PIN is required for Nigerian cards
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Bank Transfer */}
            <TabsContent value="transfer" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Select Bank</Label>
                  <Select
                    value={paymentData.bankCode}
                    onValueChange={(value) => setPaymentData({ ...paymentData, bankCode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigerianBanks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter your account number"
                    value={paymentData.accountNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    maxLength={10}
                  />
                </div>
              </div>
            </TabsContent>

            {/* USSD */}
            <TabsContent value="ussd" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ussdBank">Select Bank for USSD</Label>
                  <Select
                    value={paymentData.ussdBank}
                    onValueChange={(value) => setPaymentData({ ...paymentData, ussdBank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigerianBanks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>How USSD works:</strong>
                    <br />
                    1. Select your bank above
                    <br />
                    2. Click "Pay Now"
                    <br />
                    3. Dial the USSD code shown
                    <br />
                    4. Follow prompts on your phone
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Mobile Money */}
            <TabsContent value="mobile_money" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="network">Mobile Network</Label>
                  <Select
                    value={paymentData.network}
                    onValueChange={(value) => setPaymentData({ ...paymentData, network: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your network" />
                    </SelectTrigger>
                    <SelectContent>
                      {mobileNetworks.map((network) => (
                        <SelectItem key={network.code} value={network.code}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voucher">Voucher Code (Optional)</Label>
                  <Input
                    id="voucher"
                    placeholder="Enter voucher code if available"
                    value={paymentData.voucher}
                    onChange={(e) => setPaymentData({ ...paymentData, voucher: e.target.value })}
                  />
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Mobile Money Payment:</strong>
                    <br />
                    You'll receive an SMS with payment instructions after clicking "Pay Now"
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total to Pay:</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ₦${total.toLocaleString()}`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              🔒 Your payment is secured with 256-bit SSL encryption
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
