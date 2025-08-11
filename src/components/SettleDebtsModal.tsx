'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Bitcoin } from 'lucide-react'
import { formatCurrency } from '@/lib/bitcoin'

interface Group {
  id: string
  name: string
}

interface Balance {
  userId: string
  balance: number
  user: {
    id: string
    username: string
    bitcoinAddress?: string
  }
}

interface Settlement {
  fromUserId: string
  toUserId: string
  amount: number
  fromUser: {
    id: string
    username: string
  }
  toUser: {
    id: string
    username: string
    bitcoinAddress?: string
  }
}

interface SettleDebtsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groups: Group[]
  currentUserId: string
  userPreferredUnit?: string
}

export default function SettleDebtsModal({ isOpen, onClose, onSuccess, groups, currentUserId, userPreferredUnit = 'BTC' }: SettleDebtsModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [balances, setBalances] = useState<Balance[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedGroupId) {
      loadBalances()
    }
  }, [selectedGroupId])

  if (!isOpen) return null

  const loadBalances = async () => {
    try {
      const response = await fetch(`/api/groups/${selectedGroupId}/balances`)
      if (response.ok) {
        const data = await response.json()
        setBalances(data.balances)
        setSettlements(data.settlements)
      }
    } catch (error) {
      console.error('Failed to load balances:', error)
    }
  }

  const handleSettlement = async (settlement: Settlement) => {
    if (!settlement.toUser.bitcoinAddress) {
      alert('Recipient has not set their Bitcoin address')
      return
    }

    const txHash = prompt(
      `Please send ${formatCurrency(settlement.amount, userPreferredUnit as 'BTC' | 'sats')} to ${settlement.toUser.bitcoinAddress}\n\nEnter the transaction hash after sending:`
    )

    if (!txHash) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: settlement.toUserId,
          amount: settlement.amount
        })
      })

      if (response.ok) {
        const { settlement: createdSettlement } = await response.json()
        
        const completeResponse = await fetch(`/api/settlements/${createdSettlement.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash })
        })

        if (completeResponse.ok) {
          alert('Settlement completed successfully!')
          onSuccess()
          onClose()
        } else {
          alert('Failed to complete settlement')
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create settlement')
      }
    } catch (error) {
      console.error('Failed to settle debt:', error)
      alert('Failed to settle debt')
    } finally {
      setIsLoading(false)
    }
  }

  const mySettlements = settlements.filter(s => s.fromUserId === currentUserId)
  const myBalance = balances.find(b => b.userId === currentUserId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Settle Debts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {selectedGroupId && (
            <>
              {myBalance && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Your Balance</h3>
                  <p className={`text-lg ${myBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {myBalance.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(myBalance.balance), userPreferredUnit as 'BTC' | 'sats')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {myBalance.balance >= 0 ? 'You are owed money' : 'You owe money'}
                  </p>
                </div>
              )}

              {mySettlements.length > 0 ? (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Your Settlements</h3>
                  <div className="space-y-3">
                    {mySettlements.map((settlement, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Pay {settlement.toUser.username}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(settlement.amount, userPreferredUnit as 'BTC' | 'sats')}
                            </p>
                            {settlement.toUser.bitcoinAddress && (
                              <p className="text-xs text-gray-400 mt-1">
                                {settlement.toUser.bitcoinAddress}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleSettlement(settlement)}
                            disabled={isLoading || !settlement.toUser.bitcoinAddress}
                            size="sm"
                          >
                            <Bitcoin className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </div>
                        {!settlement.toUser.bitcoinAddress && (
                          <p className="text-xs text-red-500 mt-2">
                            User needs to set Bitcoin address
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedGroupId && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No settlements needed</p>
                </div>
              )}
            </>
          )}

          <div className="pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}