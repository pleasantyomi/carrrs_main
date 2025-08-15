interface PriceBreakdownProps {
  basePrice: number
  days: number
  totalAmount: number
  isExperience?: boolean
  isService?: boolean
}

export function PriceBreakdown({ basePrice, days, totalAmount, isExperience, isService }: PriceBreakdownProps) {
  const serviceFee = totalAmount * 0.05 // 5% service fee
  const finalTotal = totalAmount + serviceFee

  return (
    <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
      <h3 className="font-semibold">Price Breakdown</h3>
      <div className="space-y-2 text-sm">
        {isExperience ? (
          <div className="flex justify-between">
            <span>Experience Package</span>
            <span>₦{basePrice.toLocaleString()}</span>
          </div>
        ) : isService ? (
          <div className="flex justify-between">
            <span>Service Fee</span>
            <span>₦{basePrice.toLocaleString()}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span>
                ₦{basePrice.toLocaleString()} × {days} days
              </span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span>Service Fee</span>
          <span>₦{serviceFee.toLocaleString()}</span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>₦{finalTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
