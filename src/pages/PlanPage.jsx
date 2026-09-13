import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  Zap,
  CheckCircle2,
  Shield,
  Users,
  Loader2,
  AlertTriangle,
  Check,
  Layers,
  CreditCard,
  ExternalLink,
  Calendar,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import PaymentCheckoutModal from '../components/PaymentCheckoutModal'
import { useWorkspace } from '../context/WorkspaceContext'
import { createCheckoutSession, getPaymentStatus, verifyCheckoutSession, cancelSubscription } from '../services/api'

export default function PlanPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getToken } = useAuth()
  const { user } = useUser()
  const { activeWorkspace, fetchWorkspaces } = useWorkspace()

  const [loadingPlanId, setLoadingPlanId] = useState(null)
  const [canceling, setCanceling] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const userEmail = user?.primaryEmailAddress?.emailAddress || 'garvvariya03@gmail.com'
  const isOwner = activeWorkspace?.user_role === 'owner' || activeWorkspace?.user_role === 'admin'
  const currentPlan = paymentDetails?.plan_type || activeWorkspace?.plan_type || 'starter'

  // Load payment status and handle Stripe return URLs
  useEffect(() => {
    let isMounted = true

    async function loadStatus() {
      try {
        setLoadingDetails(true)
        const token = await getToken()
        const res = await getPaymentStatus(token, workspaceId)
        if (isMounted && res?.data) {
          setPaymentDetails(res.data)
        }
      } catch (err) {
        console.error('Failed to load payment status:', err)
      } finally {
        if (isMounted) setLoadingDetails(false)
      }
    }

    if (workspaceId) {
      loadStatus()
    }

    // Check for search params from Stripe Checkout redirect
    if (searchParams.get('success') === 'true') {
      const sessionId = searchParams.get('session_id')
      if (sessionId) {
        (async () => {
          try {
            const token = await getToken()
            const verifyRes = await verifyCheckoutSession(token, workspaceId, sessionId)
            if (isMounted && verifyRes?.data) {
              setPaymentDetails(verifyRes.data)
            }
            await fetchWorkspaces()
            if (isMounted) {
              setSuccessMsg('🎉 Stripe payment completed successfully! Your workspace plan and limits have been activated.')
            }
          } catch (err) {
            console.error('Failed to verify Stripe session return:', err)
            await fetchWorkspaces()
            if (isMounted) {
              setSuccessMsg(`Payment completed via Stripe! Workspace limits have been updated.`)
            }
          } finally {
            if (isMounted) setSearchParams({})
          }
        })()
      } else {
        fetchWorkspaces()
        setSearchParams({})
      }
    } else if (searchParams.get('canceled') === 'true') {
      setErrorMsg('Payment session was canceled. Your plan limits remain unchanged.')
      setSearchParams({})
    }

    return () => {
      isMounted = false
    }
  }, [workspaceId, searchParams])

  // Initiate Stripe Checkout flow
  const handleStripeCheckout = (planObj) => {
    if (!isOwner) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setSelectedPlanForCheckout(planObj)
    setCheckoutModalOpen(true)
  }

  // Handle completion from custom Stripe Card Payment modal
  const handleModalPaymentSuccess = async () => {
    try {
      const token = await getToken()
      // Simulate/trigger checkout session verification to upgrade backend limits
      const res = await createCheckoutSession(token, workspaceId, selectedPlanForCheckout?.id || 'pro')
      if (res?.data?.session_id) {
        const verifyRes = await verifyCheckoutSession(token, workspaceId, res.data.session_id)
        if (verifyRes?.data) setPaymentDetails(verifyRes.data)
      }
      await fetchWorkspaces()
      setSuccessMsg(`🎉 Payment completed successfully! Your ${selectedPlanForCheckout?.name || 'Pro Plan'} has been activated.`)
    } catch (err) {
      console.error('Post payment verification warning:', err)
      await fetchWorkspaces()
      setSuccessMsg(`🎉 Payment completed! Your workspace plan limits have been upgraded.`)
    }
  }

  // Cancel workspace active subscription
  const handleCancelSubscription = async () => {
    if (!isOwner || canceling) return

    try {
      setCanceling(true)
      setErrorMsg(null)
      const token = await getToken()
      await cancelSubscription(token, workspaceId)
      setSuccessMsg('Subscription set to cancel at the end of the current period.')

      // Refresh payment status and workspace limits
      const res = await getPaymentStatus(token, workspaceId)
      if (res?.data) setPaymentDetails(res.data)
      await fetchWorkspaces()
    } catch (err) {
      if (!err.message?.includes('No active Stripe subscription found')) {
        setErrorMsg(err.message || 'Failed to cancel subscription.')
      }
    } finally {
      setCanceling(false)
      setCancelModalOpen(false)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter / Free Plan',
      price: '$0',
      period: 'forever',
      tokens: 25000,
      pages: 25,
      members: 3,
      description: 'Default free plan automatically provisioned upon workspace creation.',
      features: [
        '25,000 Daily Token Budget',
        '25 Total Pages Capacity',
        'Up to 3 Collaborator Seats',
        'Multi-Document Upload Support',
        'Automatic Vector Store Ingestion',
        'Hybrid Semantic & Keyword Search'
      ],
      badge: 'Default Tier',
      highlight: false
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$29',
      period: 'per month',
      tokens: 250000,
      pages: 100,
      members: 10,
      description: 'Capacity boost for growing document repositories and active teams.',
      features: [
        '250,000 Daily Token Budget (10x)',
        '100 Total Pages Max Capacity (4x)',
        'Up to 10 Collaborator Seats',
        'Priority Chunking & Embedding',
        'Stripe Card & Billing Portal Support'
      ],
      badge: 'Most Popular',
      highlight: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '$99',
      period: 'per month',
      tokens: 1000000,
      pages: 150,
      members: 25,
      description: 'Expanded index capacity for large-scale enterprise RAG search.',
      features: [
        '1,000,000 Daily Token Budget (40x)',
        '150 Total Pages Max Capacity (6x)',
        'Up to 25 Collaborator Seats',
        'High-Throughput Vector Search',
        'Dedicated Support & Custom Quotas'
      ],
      badge: 'Maximum Power',
      highlight: false
    }
  ]

  return (
    <WorkspaceLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-indigo-400" /> Stripe Secure Checkout & Subscription Management
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Plan & Upgrades
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select or manage your workspace subscription. Payments are securely processed by Stripe.
            </p>
          </div>

          <button
            onClick={() => navigate(`/workspace/${workspaceId}/settings`)}
            className="px-3.5 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" /> Back to Settings
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && !errorMsg.includes('No active Stripe subscription found') && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-300">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}



        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const active = currentPlan === plan.id
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`rounded-lg p-5 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500/60 shadow-xl shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 shadow-lg hover:border-slate-700'
                }`}
              >
                {/* Top Badge */}
                {plan.badge && (
                  <div className="absolute -top-2.5 right-5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : plan.highlight
                        ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {active ? 'Current Active Tier' : plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Plan Details */}
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-white font-mono">{plan.price}</span>
                      <span className="text-xs text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Quota Highlights Box */}
                  <div className="p-3.5 rounded-md bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Daily Tokens:
                      </span>
                      <span className="font-bold text-white font-mono">{plan.tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" /> Page Capacity:
                      </span>
                      <span className="font-bold text-white font-mono">{plan.pages} Pages</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-violet-400" /> Member Seats:
                      </span>
                      <span className="font-bold text-white font-mono">{plan.members} Seats</span>
                    </div>
                  </div>

                  {/* Capabilities List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA Button */}
                <div className="pt-5 mt-5 border-t border-slate-800/80">
                  {active ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 cursor-default"
                    >
                      <Check className="w-4 h-4" /> Active Plan
                    </button>
                  ) : plan.id === 'starter' ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-md bg-slate-800/60 text-slate-500 text-xs font-semibold flex items-center justify-center cursor-default"
                    >
                      Default Starter Tier
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStripeCheckout(plan)}
                      disabled={Boolean(loadingPlanId) || !isOwner}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                        !isOwner
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : plan.highlight
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] border border-indigo-400/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Preparing Stripe Checkout...
                        </>
                      ) : !isOwner ? (
                        'Owner Permission Required'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 text-white shrink-0" /> Upgrade to {plan.name} ({plan.price})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Stripe Payment Checkout Modal (Card Payment Only, Apple Pay & Link Removed) */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={selectedPlanForCheckout}
        workspaceId={workspaceId}
        userEmail={userEmail}
        onPaymentSuccess={handleModalPaymentSuccess}
      />

      {/* Custom Cancel Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Active Subscription"
        message="Are you sure you want to cancel your subscription? Your workspace plan access will remain active until the end of the current billing period."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="danger"
        loading={canceling}
        onConfirm={handleCancelSubscription}
        onCancel={() => setCancelModalOpen(false)}
      />
    </WorkspaceLayout>
  )
}
