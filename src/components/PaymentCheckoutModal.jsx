import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react'

// Helper to format card numbers with spaces every 4 digits
function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  const matches = v.match(/\d{4,16}/g)
  const match = (matches && matches[0]) || ''
  const parts = []

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }

  if (parts.length) {
    return parts.join(' ')
  } else {
    return v
  }
}

// Helper to detect card brand
function getCardBrand(number) {
  const clean = number.replace(/\D/g, '')
  if (/^4/.test(clean)) return 'visa'
  if (/^5[1-5]|^2[2-7]/.test(clean)) return 'mastercard'
  if (/^3[47]/.test(clean)) return 'amex'
  if (/^6(?:011|5)/.test(clean)) return 'discover'
  return 'generic'
}

// Helper for MM/YY formatting
function formatExpiry(value) {
  const clean = value.replace(/\D/g, '')
  if (clean.length >= 2) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`
  }
  return clean
}

// Luhn Algorithm Card Checksum Validation
function isValidLuhn(numberStr) {
  const digits = numberStr.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

// Expiration Date Validation (MM/YY, not in past)
function isValidExpiry(expiryStr) {
  if (!/^\d{2}\/\d{2}$/.test(expiryStr)) return false
  const [mmStr, yyStr] = expiryStr.split('/')
  const mm = parseInt(mmStr, 10)
  const yy = parseInt(`20${yyStr}`, 10)
  if (mm < 1 || mm > 12) return false
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1
  if (yy < curYear) return false
  if (yy === curYear && mm < curMonth) return false
  return true
}

// Email Format Validation
function isValidEmail(emailStr) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
}

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  plan = { id: 'pro', name: 'Pro Plan', priceUSD: 29, tokens: 250000, pages: 100 },
  workspaceId,
  userEmail = 'garvvariya03@gmail.com',
  onPaymentSuccess
}) {
  const [currency, setCurrency] = useState('INR') // 'INR' or 'USD'
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardName, setCardName] = useState('')
  const [country, setCountry] = useState('IN')
  const [postalCode, setPostalCode] = useState('')
  const [email, setEmail] = useState(userEmail)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (userEmail) setEmail(userEmail)
  }, [userEmail])

  if (!isOpen) return null

  // Exchange rate calculation (1 USD = 99.4095 INR matching Stripe reference rate)
  const usdPrice = plan?.id === 'enterprise' ? 99 : 29
  const exchangeRate = 99.4095
  const inrPrice = (usdPrice * exchangeRate).toFixed(2)

  const displayPrice = currency === 'INR' ? `₹${inrPrice}` : `$${usdPrice}.00`
  const cardBrand = getCardBrand(cardNumber)

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const errors = {}

    // Email validation
    if (!email || !isValidEmail(email)) {
      errors.email = true
      setError('Please enter a valid email address.')
      setFieldErrors(errors)
      return
    }

    // Card Number validation
    const rawCard = cardNumber.replace(/\s/g, '')
    if (!rawCard || rawCard.length < 13 || !isValidLuhn(rawCard)) {
      errors.cardNumber = true
      setError('Please enter a valid credit card number.')
      setFieldErrors(errors)
      return
    }

    // Expiration date validation
    if (!expiry || !isValidExpiry(expiry)) {
      errors.expiry = true
      setError('Please enter a valid unexpired expiration date (MM/YY).')
      setFieldErrors(errors)
      return
    }

    // CVC validation
    const reqCvcLength = cardBrand === 'amex' ? 4 : 3
    if (!cvc || cvc.length < reqCvcLength) {
      errors.cvc = true
      setError(`Please enter a valid ${reqCvcLength}-digit CVC code.`)
      setFieldErrors(errors)
      return
    }

    // Cardholder Name validation
    if (!cardName.trim() || cardName.trim().length < 2) {
      errors.cardName = true
      setError('Please enter the full name on the card.')
      setFieldErrors(errors)
      return
    }

    // Postal Code validation
    if (!postalCode.trim() || postalCode.trim().length < 3) {
      errors.postalCode = true
      setError('Please enter a valid PIN / Postal code.')
      setFieldErrors(errors)
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise((res) => setTimeout(res, 1600))
      
      setSuccess(true)
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess()
        onClose()
      }, 1400)
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please verify card details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] sm:max-h-[95vh] flex flex-col my-auto">
        
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-slate-100/90 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-all shadow-sm"
          title="Close Checkout"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden flex-1">
          
          {/* LEFT COLUMN: Order Summary & Currency Switcher */}
          <div className="lg:col-span-5 bg-slate-50/90 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3 sm:space-y-4">
              
              {/* Store Identity Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  <Building2 className="w-3 h-3" />
                </div>
                <span className="font-bold text-slate-900 text-xs tracking-tight">nexus</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sandbox
                </span>
              </div>

              {/* Title & Price Display */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Subscribe to Nexus AI RAG Workspace
                </p>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {plan?.name || 'Pro Plan'}
                </h2>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>
              </div>

              {/* Currency Toggle Switcher (INR / USD) */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      currency === 'INR'
                        ? 'bg-white text-slate-900 shadow-sm border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span>🇮🇳</span> INR
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                      currency === 'USD'
                        ? 'bg-white text-slate-900 shadow-sm border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span>🇺🇸</span> USD
                  </button>
                </div>

                <p className="text-[9px] text-slate-400 leading-snug">
                  1 USD = 99.4095 INR (includes 4% conversion fee). Charges will vary based on exchange rates.
                </p>
              </div>

              {/* Plan Item Line Breakdown */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Nexus AI RAG Workspace - {plan?.name || 'Pro Plan'}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Daily limits: {plan?.tokens?.toLocaleString() || '250,000'} tokens & {plan?.pages || 100} pages storage.
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-xs shrink-0 ml-2">
                    {displayPrice}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 text-[9px] text-slate-400 font-medium">
                  Billed monthly
                </div>
              </div>

            </div>

            {/* Bottom Security Guarantee */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-1.5 text-slate-500 text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Guaranteed 256-bit SSL encrypted Stripe checkout</span>
            </div>
          </div>


          {/* RIGHT COLUMN: Contact Info & Card Payment Form */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between bg-white space-y-3 overflow-y-auto">
            
            <form onSubmit={handleSubmitPayment} className="space-y-3">
              
              {/* Feedback Alerts */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Payment successful! Activating subscription...</span>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact information</h3>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: false }))
                    }}
                    placeholder="Email address"
                    className={`w-full px-3 py-1.5 pt-4 rounded-lg bg-slate-50 border ${
                      fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                    } text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all`}
                    id="stripe-email"
                  />
                  <label
                    htmlFor="stripe-email"
                    className="absolute left-3 top-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none"
                  >
                    Email address
                  </label>
                </div>
              </div>

              {/* Payment Method Section - CLEAN CARD INPUTS ONLY */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment method</h3>
                  <span className="text-[9px] font-bold text-slate-400">Card Payment Only</span>
                </div>

                {/* Card Inputs Form Container */}
                <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm bg-white divide-y divide-slate-200">
                  
                  {/* Card Header Selector */}
                  <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between border-b border-slate-200 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Card Details
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">VISA</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">MC</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">AMEX</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">DISC</span>
                    </div>
                  </div>

                  {/* Card Number Input */}
                  <div className="p-2.5 space-y-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Card number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(formatCardNumber(e.target.value))
                            if (fieldErrors.cardNumber) setFieldErrors(prev => ({ ...prev, cardNumber: false }))
                          }}
                          placeholder="1234 1234 1234 1234"
                          className={`w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border ${
                            fieldErrors.cardNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                          } rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                        />
                        <div className="absolute right-2.5 top-2 flex items-center pointer-events-none">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Expiration date
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => {
                            setExpiry(formatExpiry(e.target.value))
                            if (fieldErrors.expiry) setFieldErrors(prev => ({ ...prev, expiry: false }))
                          }}
                          placeholder="MM / YY"
                          className={`w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border ${
                            fieldErrors.expiry ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                          } rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Security code (CVC)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cvc}
                            onChange={(e) => {
                              setCvc(e.target.value.replace(/\D/g, ''))
                              if (fieldErrors.cvc) setFieldErrors(prev => ({ ...prev, cvc: false }))
                            }}
                            placeholder="CVC"
                            className={`w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border ${
                              fieldErrors.cvc ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                            } rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                          />
                          <Lock className="w-3 h-3 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="p-2.5">
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Cardholder name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value)
                        if (fieldErrors.cardName) setFieldErrors(prev => ({ ...prev, cardName: false }))
                      }}
                      placeholder="Full name on card"
                      className={`w-full px-3 py-1.5 text-xs bg-slate-50 border ${
                        fieldErrors.cardName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                      } rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    />
                  </div>

                  {/* Country Selector & ZIP */}
                  <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Country or region
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
                      >
                        <option value="IN">India (IN) 🇮🇳</option>
                        <option value="US">United States (US) 🇺🇸</option>
                        <option value="GB">United Kingdom (GB) 🇬🇧</option>
                        <option value="CA">Canada (CA) 🇨🇦</option>
                        <option value="DE">Germany (DE) 🇩🇪</option>
                        <option value="AU">Australia (AU) 🇦🇺</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        PIN / Postal code
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => {
                          setPostalCode(e.target.value)
                          if (fieldErrors.postalCode) setFieldErrors(prev => ({ ...prev, postalCode: false }))
                        }}
                        placeholder="380001"
                        className={`w-full px-3 py-1.5 text-xs bg-slate-50 border ${
                          fieldErrors.postalCode ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                        } rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-slate-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Processing Card Payment...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payment Complete!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Subscribe & Pay {displayPrice}</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Stripe Branding & Legal */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <span className="font-extrabold text-slate-700 tracking-tight">stripe</span>
              </div>
              <div className="flex gap-2.5">
                <a href="#terms" className="hover:text-slate-600 transition-colors">Terms</a>
                <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
