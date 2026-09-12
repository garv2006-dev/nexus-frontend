import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Zap,
  CheckCircle2,
  Sparkles,
  Shield,
  FileText,
  Users,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Check,
  Crown,
  Layers,
  HardDrive,
  ShoppingCart
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useWorkspace } from '../context/WorkspaceContext'
import { updateWorkspaceSettings } from '../services/api'

export default function PlanPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { activeWorkspace, fetchWorkspaces } = useWorkspace()

  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const isOwner = activeWorkspace?.user_role === 'owner'
  const currentPlan = activeWorkspace?.plan_type || 'starter'

  const handlePurchasePlan = async (planKey, planName, price) => {
    if (!isOwner || updating) return
    try {
      setUpdating(true)
      setErrorMsg(null)
      setSuccessMsg(null)
      const token = await getToken()
      await updateWorkspaceSettings(token, workspaceId, {
        plan_type: planKey
      })
      await fetchWorkspaces()
      setSuccessMsg(`Plan Purchased Successfully! Upgraded workspace to ${planName} (${price}). Daily budget: ${planKey === 'pro' ? '250,000' : planKey === 'enterprise' ? '1,000,000' : '50,000'} tokens & ${planKey === 'pro' ? '250' : planKey === 'enterprise' ? '500' : '50'} pages.`)
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to purchase plan')
    } finally {
      setUpdating(false)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter / Free Plan',
      price: '$0',
      period: 'forever',
      tokens: 50000,
      pages: 50,
      members: 5,
      description: 'Default plan automatically selected upon workspace creation with 50 pages capacity.',
      features: [
        '50,000 Daily Token Budget',
        '50 Total Pages Max Capacity',
        'No Document Count Limit (Upload multiple files up to 50 pages total)',
        'Automatic Vector Store Ingestion',
        'Admin & Owner Upload Restrictions'
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
      pages: 250,
      members: 15,
      description: '5x Page capacity (250 total pages) for multi-document repositories.',
      features: [
        '250,000 Daily Token Budget (5x)',
        '250 Total Pages Max Capacity (5x)',
        'No Document File Limit',
        'Up to 15 Collaborators',
        'Priority Chunking & Embedding Pipeline'
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
      pages: 500,
      members: 50,
      description: 'Expanded capacity (500 total pages) for enterprise-scale RAG index.',
      features: [
        '1,000,000 Daily Token Budget (20x)',
        '500 Total Pages Max Capacity (10x)',
        'No Document File Limit',
        'Up to 50 Collaborators',
        'High-throughput Vector Search'
      ],
      badge: 'Maximum Power',
      highlight: false
    }
  ]

  return (
    <WorkspaceLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-8">
        {/* Page Title & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                Workspace Quotas & Plan Upgrades
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Plan & Upgrades
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select or purchase a plan tier to expand daily token budgets and total page capacity.
            </p>
          </div>

          <button
            onClick={() => navigate(`/workspace/${workspaceId}/settings`)}
            className="px-3.5 py-2 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-2 w-fit"
          >
            <Shield className="w-4 h-4 text-indigo-400" /> Return to Settings
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tier Comparison Cards Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const active = currentPlan === plan.id
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
                      plan.highlight
                        ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                        : active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {active ? 'Purchased Plan' : plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Plan Name & Pricing */}
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

                  {/* Resource Caps Highlight Box */}
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

                  {/* Feature Checklist */}
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

                {/* Plan Action Button */}
                <div className="pt-5 mt-5 border-t border-slate-800/80">
                  {active ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 cursor-default"
                    >
                      <Check className="w-4 h-4" /> Current Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchasePlan(plan.id, plan.name, plan.price)}
                      disabled={updating || !isOwner}
                      className={`w-full py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !isOwner
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : plan.highlight
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !isOwner ? (
                        'Owner Permission Required'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" /> Upgrade to {plan.name} ({plan.price})
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
    </WorkspaceLayout>
  )
}
