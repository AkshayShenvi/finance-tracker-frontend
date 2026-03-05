import { useState, useEffect } from 'react'
import {
  getAccounts,
  updateAccount,
  deleteAccount,
  listParsers,
  type Account,
  type AccountUpdate,
  type Parser,
} from '../services/api'
import CreateAccountModal from '../components/CreateAccountModal'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { formatCurrency } from '../lib/utils'
import { Plus, Pencil, Trash2, CreditCard, X, Check } from 'lucide-react'

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

const TYPE_COLORS: Record<string, string> = {
  checking: 'text-blue-400',
  savings: 'text-profit',
  credit_card: 'text-violet-400',
  investment: 'text-yellow-400',
  cash: 'text-muted-foreground',
  other: 'text-muted-foreground',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [parsers, setParsers] = useState<Parser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editFormData, setEditFormData] = useState<AccountUpdate>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Account | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountsData, parsersData] = await Promise.all([getAccounts(), listParsers()])
      setAccounts(accountsData)
      setParsers(parsersData)
    } catch {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSaveEdit = async () => {
    if (!editingAccount) return
    try {
      await updateAccount(editingAccount.id, editFormData)
      await loadData()
      setEditingAccount(null)
    } catch {
      alert('Failed to update account')
    }
  }

  const handleDelete = async (account: Account) => {
    try {
      await deleteAccount(account.id)
      setDeleteConfirm(null)
      await loadData()
    } catch {
      alert('Failed to delete account')
    }
  }

  const getParserDisplayName = (name?: string) => {
    if (!name) return 'Auto-detect'
    return parsers.find((p) => p.name === name)?.display_name || name
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
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Finance</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Accounts</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Account
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Accounts table */}
      <Card className="animate-fade-up animate-fade-up-1">
        <CardHeader className="pb-3">
          <CardTitle>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No accounts yet</p>
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create first account
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Account</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">Parser</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-muted-foreground">Balance</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accounts.map((account) => (
                    <tr key={account.id} className="txn-row">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{account.name}</p>
                          {account.account_number_last4 && (
                            <p className="text-xs text-muted-foreground mt-0.5">···{account.account_number_last4}</p>
                          )}
                          {account.bank_name && (
                            <p className="text-xs text-muted-foreground">{account.bank_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-medium capitalize ${TYPE_COLORS[account.account_type] || 'text-muted-foreground'}`}>
                          {ACCOUNT_TYPES.find((t) => t.value === account.account_type)?.label || account.account_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{getParserDisplayName(account.default_parser)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {formatCurrency(parseFloat(account.current_balance as string) || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingAccount(account)
                              setEditFormData({
                                name: account.name,
                                account_type: account.account_type,
                                default_parser: account.default_parser || '',
                                bank_name: account.bank_name || '',
                                account_number_last4: account.account_number_last4 || '',
                              })
                            }}
                            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(account)}
                            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-up">
            <h3 className="font-display text-lg font-semibold text-foreground mb-5">Edit Account</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Name</label>
                <Input
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Type</label>
                <select
                  value={editFormData.account_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, account_type: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Default CSV Parser</label>
                <select
                  value={editFormData.default_parser || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, default_parser: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Auto-detect</option>
                  {parsers.map((p) => <option key={p.name} value={p.name}>{p.display_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Bank Name</label>
                <Input
                  value={editFormData.bank_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                  placeholder="e.g., Chase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Last 4 Digits</label>
                <Input
                  maxLength={4}
                  value={editFormData.account_number_last4 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, account_number_last4: e.target.value })}
                  placeholder="1234"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" size="sm" onClick={() => setEditingAccount(null)}>
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-up">
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">Delete account?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This will permanently delete <strong className="text-foreground">"{deleteConfirm.name}"</strong> and all its transactions.
            </p>
            <p className="text-xs text-destructive mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)} className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { setIsCreateModalOpen(false); loadData() }}
      />
    </div>
  )
}
