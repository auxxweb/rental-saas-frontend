'use client'

import { useEffect, useState, useRef } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { format } from 'date-fns'

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
}

interface Conversation {
  _id: string
  shop: {
    name: string
    email: string
  }
  shopAdmin: {
    name: string
    email: string
  }
  status: string
  lastMessageAt: string
  unreadCount: number
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id)
      const interval = setInterval(() => {
        loadMessages(selectedConversation._id)
      }, 3000) // Poll messages every 3 seconds
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations')
      setConversations(response.data)
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0])
      }
    } catch (error) {
      toast.error('Error fetching conversations')
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
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      const response = await api.post('/chat/messages', {
        conversation: selectedConversation._id,
        content: newMessage.trim()
      })

      setMessages([...messages, response.data])
      setNewMessage('')
      await fetchConversations()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending message')
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (conversationId: string, status: string) => {
    try {
      await api.put(`/chat/conversations/${conversationId}/status`, { status })
      await fetchConversations()
      toast.success('Status updated')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating status')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Customer Support Chat"
          description="Manage customer support conversations"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card padding="none">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Conversations</h3>
              </div>
              <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-[var(--text-secondary)]">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-[var(--surface-2)] transition-colors ${
                        selectedConversation?._id === conv._id ? 'bg-[rgba(154,230,110,0.10)] border-l-4 border-[var(--accent)]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {conv.shop.name}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)] truncate">
                            {conv.shopAdmin.name}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {format(new Date(conv.lastMessageAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-col items-end">
                          <Badge variant={conv.status === 'open' ? 'active' : 'cancelled'}>
                            {conv.status}
                          </Badge>
                          {conv.unreadCount > 0 && (
                            <span className="mt-1 h-5 w-5 bg-[rgba(239,68,68,0.95)] rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card padding="none" className="h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {selectedConversation.shop.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {selectedConversation.shopAdmin.name} ({selectedConversation.shopAdmin.email})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => updateStatus(selectedConversation._id, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)]">
                  {messages.length === 0 ? (
                    <div className="text-center text-[var(--text-secondary)] py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderRole === 'super_admin'
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-xl px-4 py-2 border ${
                              isOwn
                                ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-ink)] border-[rgba(154,230,110,0.35)]'
                                : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border)]'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium mb-1 opacity-75">
                                {message.sender.name}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'opacity-80' : 'text-[var(--text-tertiary)]'}`}>
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
                <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 h-10 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center text-[var(--text-secondary)]">
                  <p>Select a conversation to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
