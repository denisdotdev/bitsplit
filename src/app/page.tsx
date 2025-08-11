'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Bitcoin, Users, Receipt, ArrowLeftRight, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/bitcoin'
import CreateGroupModal from '@/components/CreateGroupModal'
import AddExpenseModal from '@/components/AddExpenseModal'
import SettleDebtsModal from '@/components/SettleDebtsModal'
import GroupMembersModal from '@/components/GroupMembersModal'

interface User {
  id: string
  email: string
  username: string
  bitcoinAddress?: string
  avatarUrl?: string
  preferredUnit?: string
}

interface Group {
  id: string
  name: string
  description?: string
  members: Array<{
    user: {
      id: string
      username: string
      email: string
    }
  }>
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: {
    id: string
    username: string
    avatarUrl?: string
  }
  group: {
    id: string
    name: string
  }
  splits: Array<{
    userId: string
    amount: number
    settled: boolean
  }>
  createdAt: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSettleDebts, setShowSettleDebts] = useState(false)
  const [showGroupMembers, setShowGroupMembers] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        await Promise.all([loadGroups(), loadExpenses()])
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses)
      }
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = authMode === 'login' 
        ? { email, password }
        : { email, username, password }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await checkAuth()
        setEmail('')
        setUsername('')
        setPassword('')
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Auth failed:', error)
      alert('Authentication failed')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setGroups([])
      setExpenses([])
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleDataRefresh = async () => {
    await Promise.all([loadGroups(), loadExpenses()])
  }

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group)
    setShowGroupMembers(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-8">
            <Bitcoin className="h-8 w-8 text-orange-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">BitSplit</h1>
          </div>
          
          <div className="flex mb-6">
            <Button
              variant={authMode === 'login' ? 'primary' : 'ghost'}
              onClick={() => setAuthMode('login')}
              className="flex-1 mr-2"
            >
              Login
            </Button>
            <Button
              variant={authMode === 'register' ? 'primary' : 'ghost'}
              onClick={() => setAuthMode('register')}
              className="flex-1 ml-2"
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              {authMode === 'login' ? 'Login' : 'Register'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bitcoin className="h-8 w-8 text-orange-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">BitSplit</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar 
                  src={user.avatarUrl} 
                  alt={user.username} 
                  size="sm"
                />
                <span className="text-gray-700">Welcome, {user.username}</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/settings'}
                className="flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Recent Expenses
              </h2>
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <Avatar 
                            src={expense.paidBy.avatarUrl} 
                            alt={expense.paidBy.username} 
                            size="sm"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{expense.description}</h3>
                            <p className="text-sm text-gray-500">
                              Paid by {expense.paidBy.username} in {expense.group.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(expense.amount, (user?.preferredUnit as 'BTC' | 'sats') || 'BTC')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(expense.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses yet</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Your Groups
              </h2>
              {groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageMembers(group)}
                          className="text-xs"
                        >
                          Members
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No groups yet</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ArrowLeftRight className="h-5 w-5 mr-2" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowCreateGroup(true)}
                >
                  Create Group
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowAddExpense(true)}
                  disabled={groups.length === 0}
                >
                  Add Expense
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowSettleDebts(true)}
                  disabled={groups.length === 0}
                >
                  Settle Debts
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={handleDataRefresh}
      />

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSuccess={handleDataRefresh}
        groups={groups}
        userPreferredUnit={user.preferredUnit}
      />

      <SettleDebtsModal
        isOpen={showSettleDebts}
        onClose={() => setShowSettleDebts(false)}
        onSuccess={handleDataRefresh}
        groups={groups}
        currentUserId={user.id}
        userPreferredUnit={user.preferredUnit}
      />

      {selectedGroup && (
        <GroupMembersModal
          isOpen={showGroupMembers}
          onClose={() => {
            setShowGroupMembers(false)
            setSelectedGroup(null)
          }}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
