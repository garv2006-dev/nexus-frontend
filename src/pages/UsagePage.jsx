import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  PieChart,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { getWorkspaceUsage } from '../services/api'

export default function UsagePage() {
  const { workspaceId } = useParams()
  const { getToken } = useAuth()

  const [usageData, setUsageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsage = async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const token = await getToken()
      const data = await getWorkspaceUsage(token, workspaceId)
      setUsageData(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load workspace token usage')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [workspaceId])

  const totalUsed = usageData?.total_tokens || 0
  const dailyLimit = usageData?.daily_limit || 100000
  const remaining = usageData?.remaining_tokens ?? Math.max(0, dailyLimit - totalUsed)
  const percentage = Math.min(100, Math.round((totalUsed / dailyLimit) * 100))
  const isLimitReached = usageData?.is_limit_reached || totalUsed >= dailyLimit

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Token Usage Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor daily LLM token budgets and historical workspace usage.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" /> Loading usage metrics...
          </div>
        ) : (
          <>
            {/* Top Stat Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-sm dark:shadow-md">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Input Tokens</span>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {(usageData?.input_tokens || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 block">Prompt & context chunks</span>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-sm dark:shadow-md">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Output Tokens</span>
                  <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {(usageData?.output_tokens || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 block">Gemini generated responses</span>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-sm dark:shadow-md">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Total Used Today</span>
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {totalUsed.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 block">Out of {dailyLimit.toLocaleString()} limit</span>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-sm dark:shadow-md">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>Remaining Budget</span>
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {remaining.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 block">Resets daily at midnight</span>
              </div>
            </div>

            {/* Daily Token Limit Meter Card */}
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3.5 shadow-sm dark:shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Workspace Token Consumption</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Workspace token budgets reset automatically each day</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20 w-fit">
                  {percentage}% Consumed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-md bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
                <div
                  className={`h-full rounded-md transition-all duration-500 ${
                    isLimitReached ? 'bg-red-500 shadow-md shadow-red-500/30' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {isLimitReached && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Daily workspace token limit reached. Used {totalUsed.toLocaleString()} / {dailyLimit.toLocaleString()} tokens.</span>
                </div>
              )}
            </div>

            {/* Usage by Day Table */}
            <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-lg">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Usage History by Day
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Last 14 Days</span>
              </div>

              {(!usageData?.history || usageData.history.length === 0) ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs italic">
                  No historical usage recorded yet for this workspace.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-4">Input Tokens</th>
                        <th className="py-3 px-4">Output Tokens</th>
                        <th className="py-3 px-5 text-right">Total Tokens</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {usageData.history.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-5 font-mono text-slate-900 dark:text-white">
                            {row.date_str}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {(row.input_tokens || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {(row.output_tokens || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-5 font-mono font-semibold text-indigo-600 dark:text-indigo-300 text-right">
                            {(row.total_tokens || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
