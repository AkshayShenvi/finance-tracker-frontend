import { useState, useEffect } from 'react'
import { createAccount, listParsers, type AccountCreate, type Parser } from '../services/api'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAccountModalProps) {
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<string>('checking')
  const [initialBalance, setInitialBalance] = useState('')
  const [defaultParser, setDefaultParser] = useState<string>('')
  const [parsers, setParsers] = useState<Parser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) loadParsers()
  }, [isOpen])

  const loadParsers = async () => {
    try {
      const data = await listParsers()
      setParsers(data)
    } catch (err) {
      console.error('Failed to load parsers:', err)
    }
  }

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Account name is required'); return }
    setIsLoading(true)
    try {
      const accountData: AccountCreate = {
        name: name.trim(),
        account_type: accountType,
        currency: 'USD',
        initial_balance: initialBalance ? parseFloat(initialBalance) : 0,
        default_parser: defaultParser || undefined,
      }
      await createAccount(accountData)
      setName(''); setAccountType('checking'); setInitialBalance(''); setDefaultParser('')
      onSuccess(); onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName(''); setAccountType('checking'); setInitialBalance(''); setDefaultParser(''); setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-foreground mb-5">Create Account</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Account Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chase Freedom, BOA Checking"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Account Type <span className="text-destructive">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Default CSV Parser
            </label>
            <select
              value={defaultParser}
              onChange={(e) => setDefaultParser(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Auto-detect</option>
              {parsers.map((parser) => (
                <option key={parser.name} value={parser.name}>{parser.display_name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Link this account to a CSV format for easier imports</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Initial Balance
            </label>
            <Input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">Leave empty or enter 0 if starting fresh</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
