'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Bitcoin, ArrowLeft, User, Mail, Save, Upload, Trash2, Camera } from 'lucide-react'

interface User {
  id: string
  email: string
  username: string
  bitcoinAddress?: string
  avatarUrl?: string
  preferredUnit?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bitcoinAddress, setBitcoinAddress] = useState('')
  const [preferredUnit, setPreferredUnit] = useState<'BTC' | 'sats'>('BTC')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSavingCurrency, setIsSavingCurrency] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setBitcoinAddress(data.user.bitcoinAddress || '')
        setPreferredUnit(data.user.preferredUnit || 'BTC')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBitcoinAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bitcoinAddress.trim()) {
      alert('Please enter a Bitcoin address')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/users/bitcoin-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bitcoinAddress: bitcoinAddress.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        alert('Bitcoin address updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update Bitcoin address')
      }
    } catch (error) {
      console.error('Failed to save Bitcoin address:', error)
      alert('Failed to save Bitcoin address')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      alert('Please select an image smaller than 1MB')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const avatarData = reader.result as string

        const response = await fetch('/api/users/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarData })
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          alert('Avatar updated successfully!')
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to update avatar')
        }
        setIsUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert('Failed to upload avatar')
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return

    setIsUploadingAvatar(true)
    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        alert('Avatar removed successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove avatar')
      }
    } catch (error) {
      console.error('Failed to remove avatar:', error)
      alert('Failed to remove avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveCurrencyPreference = async () => {
    setIsSavingCurrency(true)
    try {
      const response = await fetch('/api/users/currency-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredUnit })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        alert('Currency preference updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update currency preference')
      }
    } catch (error) {
      console.error('Failed to save currency preference:', error)
      alert('Failed to save currency preference')
    } finally {
      setIsSavingCurrency(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
                <Bitcoin className="h-8 w-8 text-orange-500 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">BitSplit Settings</h1>
              </div>
            </div>
            <div className="text-gray-700">
              Welcome, {user.username}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar 
                      src={user.avatarUrl} 
                      alt={user.username} 
                      size="xl"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {user.avatarUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-gray-500 text-center">
                    Upload a photo to personalize your profile. Max size: 1MB
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Username</p>
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                Bitcoin Settings
              </h2>
              
              <form onSubmit={handleSaveBitcoinAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitcoin Address
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Your Bitcoin address is used for receiving settlement payments. 
                    Make sure this is a valid address that you control.
                  </p>
                  <Input
                    type="text"
                    value={bitcoinAddress}
                    onChange={(e) => setBitcoinAddress(e.target.value)}
                    placeholder="Enter your Bitcoin address (e.g., 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2)"
                    className="font-mono text-sm"
                  />
                  {user.bitcoinAddress && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Current address: {user.bitcoinAddress}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={isSaving || bitcoinAddress === user.bitcoinAddress}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Bitcoin Address'}
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Important Notes:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Only provide Bitcoin addresses that you fully control</li>
                  <li>• Double-check the address before saving - incorrect addresses cannot receive payments</li>
                  <li>• This address will be visible to other group members when they settle debts with you</li>
                  <li>• You can update this address at any time</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                Currency Display Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Currency Unit
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Choose how amounts are displayed throughout the app. You can switch between Bitcoin (BTC) and Satoshis (sats).
                  </p>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="preferredUnit"
                        value="BTC"
                        checked={preferredUnit === 'BTC'}
                        onChange={(e) => setPreferredUnit(e.target.value as 'BTC' | 'sats')}
                        className="mr-2"
                      />
                      <span className="text-sm">BTC (Bitcoin)</span>
                      <span className="text-xs text-gray-500 ml-2">0.00000001 BTC</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="preferredUnit"
                        value="sats"
                        checked={preferredUnit === 'sats'}
                        onChange={(e) => setPreferredUnit(e.target.value as 'BTC' | 'sats')}
                        className="mr-2"
                      />
                      <span className="text-sm">Satoshis (sats)</span>
                      <span className="text-xs text-gray-500 ml-2">1 sat</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveCurrencyPreference}
                    disabled={isSavingCurrency || preferredUnit === user.preferredUnit}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingCurrency ? 'Saving...' : 'Save Currency Preference'}
                  </Button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> 1 BTC = 100,000,000 satoshis. Your preference only affects display - all amounts are stored securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                How Settlements Work
              </h2>
              <div className="prose text-sm text-gray-600">
                <p>
                  When you owe money to someone in a group, you can use the "Settle Debts" 
                  feature to calculate optimal settlements. The app will show you who to pay 
                  and their Bitcoin address.
                </p>
                <p className="mt-3">
                  To complete a settlement:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click "Settle Debts" to see your payment obligations</li>
                  <li>Send Bitcoin to the specified address and amount</li>
                  <li>Enter the transaction hash to mark the settlement as complete</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}