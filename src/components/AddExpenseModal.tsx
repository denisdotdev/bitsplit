'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { parseCurrencyInput, convertCurrency } from '@/lib/bitcoin'

interface Group {
  id: string
  name: string
  members: Array<{
    user: {
      id: string
      username: string
      email: string
    }
  }>
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groups: Group[]
  userPreferredUnit?: string
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess, groups, userPreferredUnit = 'BTC' }: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [groupId, setGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount || !groupId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: convertCurrency(
            parseCurrencyInput(amount, userPreferredUnit as 'BTC' | 'sats'),
            userPreferredUnit as 'BTC' | 'sats',
            'BTC'
          ),
          groupId,
          splitType: 'equal'
        })
      })

      if (response.ok) {
        setDescription('')
        setAmount('')
        setGroupId('')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add expense')
      }
    } catch (error) {
      console.error('Failed to add expense:', error)
      alert('Failed to add expense')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({userPreferredUnit}) *
            </label>
            <Input
              type="number"
              step={userPreferredUnit === 'sats' ? '1' : '0.00000001'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={userPreferredUnit === 'sats' ? '1000' : '0.00000000'}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter amount in {userPreferredUnit === 'sats' ? 'satoshis' : 'Bitcoin'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group *
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !description.trim() || !amount || !groupId}
            >
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}