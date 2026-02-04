'use client'

import { useState, useEffect, useRef } from 'react'
import { getCurrentUser } from '@/lib/auth'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    email: string
  }
  senderRole: string
  content: string
  createdAt: string
  isRead: boolean
}

interface Conversation {
  _id: string
  shop: {
    name: string
  }
  shopAdmin: {
    name: string
  }
  status: string
  unreadCount: number
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    if (isOpen && mounted) {
      loadConversation()
      startPolling()
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [isOpen, mounted])

  useEffect(() => {
    if (isOpen && mounted) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isOpen, mounted])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) return
    pollingIntervalRef.current = setInterval(() => {
      if (conversation) {
        loadMessages(conversation._id)
      }
    }, 3000) // Poll every 3 seconds
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const loadConversation = async () => {
    try {
      setLoading(true)
      // Get or create conversation
      const response = await api.get('/chat/conversations')
      let conv = response.data[0]

      if (!conv) {
        // Create new conversation
        const createResponse = await api.post('/chat/conversations')
        conv = createResponse.data
      }

      setConversation(conv)
      if (conv) {
        await loadMessages(conv._id)
      }
    } catch (error) {
      toast.error('Error loading conversation')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/messages/${conversationId}`)
      setMessages(response.data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return

    try {
      setSending(true)
      const response = await api.post('/chat/messages', {
        conversation: conversation._id,
        content: newMessage.trim()
      })

      setMessages([...messages, response.data])
      setNewMessage('')
      await fetchUnreadCount()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending message')
    } finally {
      setSending(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count')
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Don't render until mounted (client-side only)
  if (!mounted) {
    return null
  }

  // Only show for shop admins
  if (!user || user.role !== 'shop_admin') {
    return null
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg hover:brightness-90 hover:shadow-xl flex items-center justify-center transition-all duration-200 ring-2 ring-[var(--accent)]/20"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-[var(--error)] rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full sm:w-96 h-[600px] flex flex-col bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-[var(--accent-ink)] rounded-t-xl">
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs opacity-90">We'll respond as soon as possible</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--accent-ink)] hover:opacity-70 transition-opacity"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-primary)]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender._id === user._id
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-[var(--accent-ink)]'
                          : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.sender.name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'opacity-80' : 'text-[var(--text-secondary)]'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                size="md"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
