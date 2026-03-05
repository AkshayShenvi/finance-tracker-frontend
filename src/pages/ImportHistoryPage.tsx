import { useState, useEffect } from 'react'
import {
  getImportSessions,
  getImportSessionTransactions,
  type ImportSession,
  type ImportSessionDetail,
} from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatCurrency } from '../lib/utils'
import { History, FileText, ChevronRight } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'profit' | 'loss' | 'neutral'> = {
  completed: 'profit',
  failed: 'loss',
  partial: 'neutral',
}

export default function ImportHistoryPage() {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ImportSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getImportSessions()
      .then(setSessions)
      .catch(() => setError('Failed to load import history'))
      .finally(() => setLoading(false))
  }, [])

  const loadSessionTransactions = async (sessionId: number) => {
    try {
      const data = await getImportSessionTransactions(sessionId)
      setSelectedSession(data)
    } catch {
      setError('Failed to load session transactions')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Activity</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Import History</h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${selectedSession ? 'grid-cols-1 lg:grid-cols-[340px_1fr]' : 'grid-cols-1 max-w-xl'}`}>
        {/* Sessions list */}
        <Card className="animate-fade-up animate-fade-up-1">
          <CardHeader className="pb-3">
            <CardTitle>{sessions.length} import session{sessions.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <History className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No imports yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.session.id === session.id
                  return (
                    <button
                      key={session.id}
                      onClick={() => loadSessionTransactions(session.id)}
                      className={`w-full text-left px-5 py-4 transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.filename || 'Unnamed Import'}
                          </p>
                          <Badge variant={STATUS_VARIANT[session.status] || 'neutral'} className="shrink-0 text-[10px]">
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{session.account_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px]">
                          <span className="text-profit font-medium">+{session.created_count} added</span>
                          <span className="text-muted-foreground">{session.skipped_count} skipped</span>
                          {session.error_count > 0 && <span className="text-destructive">{session.error_count} errors</span>}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 mt-1 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session transactions */}
        {selectedSession && (
          <Card className="animate-fade-up">
            <CardHeader className="pb-3">
              <CardTitle>{selectedSession.transactions.length} transactions</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                From {selectedSession.session.filename || 'unnamed import'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {selectedSession.transactions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">No transactions in this session</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Description</th>
                        <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">Type</th>
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedSession.transactions.map((txn) => (
                        <tr key={txn.id} className="txn-row">
                          <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(txn.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-foreground max-w-xs truncate">
                            {txn.description}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge variant={txn.transaction_type === 'income' ? 'profit' : txn.transaction_type === 'transfer' ? 'transfer' : 'loss'}>
                              {txn.transaction_type}
                            </Badge>
                          </td>
                          <td className={`px-5 py-3.5 text-right font-mono text-sm font-semibold ${
                            txn.transaction_type === 'income' ? 'text-profit' : 'text-destructive'
                          }`}>
                            {txn.transaction_type === 'income' ? '+' : '−'}
                            {formatCurrency(Math.abs(txn.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
