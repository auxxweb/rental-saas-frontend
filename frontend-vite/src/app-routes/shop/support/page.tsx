import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { SearchToolbar } from '@/components/SearchToolbar'
import { youtubeEmbedUrl } from '@/lib/youtube'

type Tab = 'tickets' | 'create' | 'help' | 'tutorials'

function ticketStatusVariant(s: string): 'pending' | 'active' | 'returned' | 'cancelled' | 'default' {
  switch (s) {
    case 'open':
      return 'pending'
    case 'in_progress':
      return 'active'
    case 'resolved':
      return 'returned'
    case 'closed':
      return 'cancelled'
    default:
      return 'default'
  }
}

export default function ShopSupportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tickets')

  const [tickets, setTickets] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketSearchDraft, setTicketSearchDraft] = useState('')
  const [ticketSearchApplied, setTicketSearchApplied] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
  })
  const [creating, setCreating] = useState(false)

  const [articles, setArticles] = useState<any[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleSearchDraft, setArticleSearchDraft] = useState('')
  const [articleSearchApplied, setArticleSearchApplied] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null)

  const [tutorials, setTutorials] = useState<any[]>([])
  const [tutorialsLoading, setTutorialsLoading] = useState(false)
  const [tutorialSearchDraft, setTutorialSearchDraft] = useState('')
  const [tutorialSearchApplied, setTutorialSearchApplied] = useState('')
  const [selectedTutorial, setSelectedTutorial] = useState<any | null>(null)

  const fetchTickets = async (search: string) => {
    setTicketsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      const q = params.toString()
      const res = await api.get(`/tickets/my${q ? `?${q}` : ''}`)
      setTickets(res.data)
    } catch {
      toast.error('Could not load tickets')
    } finally {
      setTicketsLoading(false)
    }
  }

  const fetchTicketDetail = async (id: string) => {
    try {
      const res = await api.get(`/tickets/${id}`)
      setSelectedTicket(res.data)
    } catch {
      toast.error('Could not load ticket')
    }
  }

  useEffect(() => {
    if (activeTab === 'tickets') fetchTickets(ticketSearchApplied)
  }, [activeTab, ticketSearchApplied])

  useEffect(() => {
    if (activeTab !== 'tickets' || !selectedTicketId) {
      setSelectedTicket(null)
      return
    }
    setSelectedTicket(null)
    fetchTicketDetail(selectedTicketId)
  }, [activeTab, selectedTicketId])

  const fetchArticles = async (search: string) => {
    setArticlesLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      const q = params.toString()
      const res = await api.get(`/help-articles${q ? `?${q}` : ''}`)
      setArticles(res.data)
    } catch {
      toast.error('Could not load help articles')
    } finally {
      setArticlesLoading(false)
    }
  }

  const fetchTutorials = async (search: string) => {
    setTutorialsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      const q = params.toString()
      const res = await api.get(`/tutorials${q ? `?${q}` : ''}`)
      setTutorials(res.data)
    } catch {
      toast.error('Could not load tutorials')
    } finally {
      setTutorialsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'help') fetchArticles(articleSearchApplied)
  }, [activeTab, articleSearchApplied])

  useEffect(() => {
    if (activeTab === 'tutorials') fetchTutorials(tutorialSearchApplied)
  }, [activeTab, tutorialSearchApplied])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim() || !createForm.description.trim()) {
      toast.error('Title and description are required')
      return
    }
    setCreating(true)
    try {
      await api.post('/tickets', createForm)
      toast.success('Ticket created')
      setCreateForm({ title: '', description: '', category: 'other', priority: 'medium' })
      setActiveTab('tickets')
      setTicketSearchApplied('')
      fetchTickets('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create ticket')
    } finally {
      setCreating(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicketId || !replyBody.trim() || selectedTicket?.status === 'closed') return
    setReplying(true)
    try {
      await api.post(`/tickets/${selectedTicketId}/reply`, { message: replyBody.trim() })
      setReplyBody('')
      await fetchTicketDetail(selectedTicketId)
      fetchTickets(ticketSearchApplied)
      toast.success('Reply sent')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send reply')
    } finally {
      setReplying(false)
    }
  }

  const openArticle = async (id: string) => {
    try {
      const res = await api.get(`/help-articles/${id}`)
      setSelectedArticle(res.data)
    } catch {
      toast.error('Could not load article')
    }
  }

  const openTutorial = async (id: string) => {
    try {
      const res = await api.get(`/tutorials/${id}`)
      setSelectedTutorial(res.data)
    } catch {
      toast.error('Could not load tutorial')
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-5xl mx-auto">
        <PageHeader title="Support & Help" description="Tickets, help articles, and video tutorials" />

        <Card padding="none">
          <div className="border-b border-[var(--border)]">
            <nav className="flex -mb-px overflow-x-auto">
              {(
                [
                  ['tickets', 'My tickets'],
                  ['create', 'Create ticket'],
                  ['help', 'Help center'],
                  ['tutorials', 'Tutorials'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id)
                    if (id === 'tickets') setSelectedTicketId(null)
                    if (id === 'help') setSelectedArticle(null)
                    if (id === 'tutorials') setSelectedTutorial(null)
                  }}
                  className={`py-4 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap ${
                    activeTab === id
                      ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                <SearchToolbar
                  draft={ticketSearchDraft}
                  onDraftChange={setTicketSearchDraft}
                  onSearch={() => setTicketSearchApplied(ticketSearchDraft)}
                  placeholder="Search tickets (click Search)"
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <div className="px-3 py-2 bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-secondary)]">
                      Your tickets
                    </div>
                    {ticketsLoading ? (
                      <p className="p-4 text-sm text-[var(--text-secondary)]">Loading…</p>
                    ) : tickets.length === 0 ? (
                      <p className="p-4 text-sm text-[var(--text-secondary)]">No tickets yet.</p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)] max-h-[420px] overflow-y-auto">
                        {tickets.map((t) => (
                          <li key={t._id}>
                            <button
                              type="button"
                              onClick={() => setSelectedTicketId(t._id)}
                              className={`w-full text-left px-3 py-3 text-sm hover:bg-[var(--surface-2)] ${
                                selectedTicketId === t._id ? 'bg-[var(--surface-2)]' : ''
                              }`}
                            >
                              <div className="font-medium text-[var(--text-primary)]">{t.title}</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant={ticketStatusVariant(t.status)} size="sm">
                                  {t.status.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-[var(--text-secondary)]">{t.priority}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-[var(--border)] p-4 min-h-[200px]">
                    {!selectedTicketId ? (
                      <p className="text-sm text-[var(--text-secondary)]">Select a ticket to view the thread.</p>
                    ) : !selectedTicket ? (
                      <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{selectedTicket.title}</h3>
                          <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                            {selectedTicket.description}
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {(selectedTicket.messages || []).map((m: any) => (
                            <div
                              key={m._id}
                              className="rounded-lg border border-[var(--border)] p-2 text-sm bg-[var(--surface)]"
                            >
                              <div className="text-xs text-[var(--text-secondary)] mb-1">
                                {m.sender?.name || 'User'} ·{' '}
                                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                              </div>
                              <div className="whitespace-pre-wrap text-[var(--text-primary)]">{m.message}</div>
                            </div>
                          ))}
                        </div>
                        {selectedTicket.status === 'closed' && (
                          <p className="text-xs text-[var(--text-secondary)]">This ticket is closed. Replies are disabled.</p>
                        )}
                        <form onSubmit={handleReply} className="space-y-2">
                          <textarea
                            className="w-full min-h-[80px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Write a reply…"
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            disabled={selectedTicket.status === 'closed'}
                          />
                          <Button
                            type="submit"
                            disabled={
                              replying ||
                              !replyBody.trim() ||
                              selectedTicket.status === 'closed'
                            }
                          >
                            {replying ? 'Sending…' : 'Send reply'}
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <form onSubmit={handleCreateTicket} className="space-y-4 max-w-lg">
                <Input
                  label="Title"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
                  <select
                    className="w-full h-11 px-4 border rounded-xl border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={createForm.category}
                    onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="rental_issue">Rental issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
                  <select
                    className="w-full h-11 px-4 border rounded-xl border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={createForm.priority}
                    onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
                  <textarea
                    required
                    className="w-full min-h-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Submitting…' : 'Submit ticket'}
                </Button>
              </form>
            )}

            {activeTab === 'help' && (
              <div className="space-y-4">
                <SearchToolbar
                  draft={articleSearchDraft}
                  onDraftChange={setArticleSearchDraft}
                  onSearch={() => setArticleSearchApplied(articleSearchDraft)}
                  placeholder="Search articles (click Search)"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    {articlesLoading ? (
                      <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                    ) : articles.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">No articles found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {articles.map((a) => (
                          <li key={a._id}>
                            <button
                              type="button"
                              onClick={() => openArticle(a._id)}
                              className="w-full text-left rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-2)]"
                            >
                              <div className="font-medium text-[var(--text-primary)]">{a.title}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{a.category}</div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-[var(--border)] p-4 min-h-[200px]">
                    {!selectedArticle ? (
                      <p className="text-sm text-[var(--text-secondary)]">Select an article.</p>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-lg text-[var(--text-primary)]">{selectedArticle.title}</h3>
                        <div className="mt-3 text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                          {selectedArticle.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutorials' && (
              <div className="space-y-4">
                <SearchToolbar
                  draft={tutorialSearchDraft}
                  onDraftChange={setTutorialSearchDraft}
                  onSearch={() => setTutorialSearchApplied(tutorialSearchDraft)}
                  placeholder="Search tutorials (click Search)"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    {tutorialsLoading ? (
                      <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                    ) : tutorials.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">No tutorials yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {tutorials.map((t) => (
                          <li key={t._id}>
                            <button
                              type="button"
                              onClick={() => openTutorial(t._id)}
                              className="w-full text-left rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-2)]"
                            >
                              <div className="font-medium text-[var(--text-primary)]">{t.title}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{t.category}</div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-[var(--border)] p-4 min-h-[200px]">
                    {!selectedTutorial ? (
                      <p className="text-sm text-[var(--text-secondary)]">Select a tutorial.</p>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-[var(--text-primary)]">{selectedTutorial.title}</h3>
                        {selectedTutorial.description && (
                          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                            {selectedTutorial.description}
                          </p>
                        )}
                        {(() => {
                          const embed = youtubeEmbedUrl(selectedTutorial.youtubeLink || '')
                          return embed ? (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                              <iframe
                                title={selectedTutorial.title}
                                src={embed}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--text-secondary)]">Invalid YouTube URL.</p>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
