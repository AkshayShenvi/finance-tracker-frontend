import { useState, useEffect } from 'react'
import { Account, getAccounts, uploadCSV, ImportResult } from '../services/api'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAccounts()
    }
  }, [isOpen])

  const loadAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const accountList = await getAccounts()
      setAccounts(accountList)
      if (accountList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountList[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load accounts')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file')
      return
    }

    if (!selectedAccountId) {
      setError('Please select an account')
      return
    }

    setIsLoading(true)
    setError('')
    setImportResult(null)

    try {
      const result = await uploadCSV(selectedFile, selectedAccountId, skipDuplicates)
      setImportResult(result)

      // Call onSuccess after successful upload
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload CSV')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setError('')
    setImportResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          minWidth: '500px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Import AMEX Transactions</h2>

        {!importResult && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="account" style={{ display: 'block', marginBottom: '5px' }}>
                Select Account
              </label>
              {loadingAccounts ? (
                <div>Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div style={{ color: '#d9534f' }}>No accounts found. Please create an account first.</div>
              ) : (
                <select
                  id="account"
                  value={selectedAccountId || ''}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.account_type}) - ${account.current_balance}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>
                Select CSV File
              </label>
              <input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {selectedFile && (
                <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Skip duplicate transactions
              </label>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', marginLeft: '24px' }}>
                Duplicates are identified by matching date, amount, and description
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isLoading || !selectedFile || !selectedAccountId || accounts.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    isLoading || !selectedFile || !selectedAccountId || accounts.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    isLoading || !selectedFile || !selectedAccountId || accounts.length === 0
                      ? 0.6
                      : 1,
                }}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </>
        )}

        {importResult && (
          <div>
            <div
              style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Import Complete!</h3>
              <div style={{ fontSize: '14px' }}>
                <div>Total rows processed: {importResult.total_rows}</div>
                <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                  Created: {importResult.created}
                </div>
                <div>Skipped: {importResult.skipped}</div>
                {importResult.errors > 0 && (
                  <div style={{ color: '#d9534f', fontWeight: 'bold' }}>
                    Errors: {importResult.errors}
                  </div>
                )}
              </div>
            </div>

            {importResult.categories_created.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>New Categories Created:</h4>
                <div style={{ fontSize: '14px' }}>
                  {importResult.categories_created.map((category, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        marginBottom: '5px',
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Errors:</h4>
                <div
                  style={{
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }}
                >
                  {importResult.results
                    .filter((r) => r.status === 'error')
                    .map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '8px',
                          backgroundColor: '#f8d7da',
                          color: '#721c24',
                          borderRadius: '4px',
                          marginBottom: '5px',
                        }}
                      >
                        Row {result.row_number}: {result.message}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
