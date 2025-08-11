'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { X, UserPlus, Trash2 } from 'lucide-react'

interface Member {
  id: string
  userId: string
  role: string
  user: {
    id: string
    username: string
    email: string
    avatarUrl?: string
  }
}

interface GroupMembersModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  currentUserId: string
}

export default function GroupMembersModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupName,
  currentUserId 
}: GroupMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (isOpen && groupId) {
      loadMembers()
    }
  }, [isOpen, groupId])

  if (!isOpen) return null

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail.trim() })
      })

      if (response.ok) {
        setNewMemberEmail('')
        await loadMembers()
        alert('Member added successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      alert('Failed to add member')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMembers()
        alert('Member removed successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  const currentUserMember = members.find(m => m.userId === currentUserId)
  const isCurrentUserAdmin = currentUserMember?.role === 'admin'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Members of {groupName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isCurrentUserAdmin && (
          <form onSubmit={handleAddMember} className="mb-6">
            <div className="flex space-x-2">
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter email to invite"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isAdding || !newMemberEmail.trim()}
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Current Members ({members.length})</h3>
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar 
                  src={member.user.avatarUrl} 
                  alt={member.user.username} 
                  size="sm"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user.username}
                    {member.userId === currentUserId && ' (You)'}
                  </p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                  <p className="text-xs text-blue-600 capitalize">{member.role}</p>
                </div>
              </div>
              {isCurrentUserAdmin && member.userId !== currentUserId && (
                <Button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!isCurrentUserAdmin && (
          <p className="text-sm text-gray-500 mt-4">
            Only group admins can add or remove members.
          </p>
        )}

        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}