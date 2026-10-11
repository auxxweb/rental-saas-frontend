import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

type MainTab = 'tickets' | 'articles' | 'tutorials'

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

export default function SuperAdminSupportPage() {
  const [mainTab, setMainTab] = useState<MainTab>('tickets')

  const [ticketDraft, setTicketDraft] = useState({ search: '', status: '', priority: '' })
  const [ticketApplied, setTicketApplied] = useState({ search: '', status: '', priority: '' })
  const [adminTickets, setAdminTickets] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)
  const [statusEdit, setStatusEdit] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchAdminTickets = async () => {
    setTicketsLoading(true)
    try {
      const params = new URLSearchParams()
      if (ticketApplied.search.trim()) params.set('search', ticketApplied.search.trim())
      if (ticketApplied.status) params.set('status', ticketApplied.status)
      if (ticketApplied.priority) params.set('priority', ticketApplied.priority)
      const q = params.toString()
      const res = await api.get(`/admin/tickets${q ? `?${q}` : ''}`)
      setAdminTickets(res.data)
    } catch {
      toast.error('Could not load tickets')
    } finally {
      setTicketsLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'tickets') fetchAdminTickets()
  }, [mainTab, ticketApplied])

  const fetchTicketDetail = async (id: string) => {
    try {
      const res = await api.get(`/tickets/${id}`)
      setSelectedTicket(res.data)
      setStatusEdit(res.data.status)
    } catch {
      toast.error('Could not load ticket')
    }
  }

  useEffect(() => {
    if (mainTab !== 'tickets' || !selectedTicketId) {
      setSelectedTicket(null)
      return
    }
    setSelectedTicket(null)
    fetchTicketDetail(selectedTicketId)
  }, [mainTab, selectedTicketId])

  const applyTicketFilters = () => {
    setTicketApplied({ ...ticketDraft })
  }

  const handleReplyAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicketId || !replyBody.trim() || selectedTicket?.status === 'closed') return
    setReplying(true)
    try {
      await api.post(`/tickets/${selectedTicketId}/reply`, { message: replyBody.trim() })
      setReplyBody('')
      await fetchTicketDetail(selectedTicketId)
      fetchAdminTickets()
      toast.success('Reply sent')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send reply')
    } finally {
      setReplying(false)
    }
  }

  const handleStatusSave = async () => {
    if (!selectedTicketId || !statusEdit) return
    setSavingStatus(true)
    try {
      await api.patch(`/tickets/${selectedTicketId}/status`, { status: statusEdit })
      await fetchTicketDetail(selectedTicketId)
      fetchAdminTickets()
      toast.success('Status updated')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update status')
    } finally {
      setSavingStatus(false)
    }
  }

  const [articles, setArticles] = useState<any[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleForm, setArticleForm] = useState({
    _id: '' as string,
    title: '',
    content: '',
    category: 'general',
    tags: '',
    isPublished: true,
  })
  const [articleSaving, setArticleSaving] = useState(false)

  const fetchArticlesAdmin = async () => {
    setArticlesLoading(true)
    try {
      const res = await api.get('/admin/help-articles')
      setArticles(res.data)
    } catch {
      toast.error('Could not load articles')
    } finally {
      setArticlesLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'articles') fetchArticlesAdmin()
  }, [mainTab])

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      toast.error('Title and content required')
      return
    }
    setArticleSaving(true)
    try {
      const tags = articleForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (articleForm._id) {
        await api.put(`/admin/help-articles/${articleForm._id}`, {
          title: articleForm.title,
          content: articleForm.content,
          category: articleForm.category,
          tags,
          isPublished: articleForm.isPublished,
        })
        toast.success('Article updated')
      } else {
        await api.post('/admin/help-articles', {
          title: articleForm.title,
          content: articleForm.content,
          category: articleForm.category,
          tags,
          isPublished: articleForm.isPublished,
        })
        toast.success('Article created')
      }
      setArticleForm({ _id: '', title: '', content: '', category: 'general', tags: '', isPublished: true })
      fetchArticlesAdmin()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setArticleSaving(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return
    try {
      await api.delete(`/admin/help-articles/${id}`)
      toast.success('Deleted')
      fetchArticlesAdmin()
    } catch {
      toast.error('Delete failed')
    }
  }

  const editArticle = (a: any) => {
    setArticleForm({
      _id: a._id,
      title: a.title,
      content: a.content,
      category: a.category || 'general',
      tags: (a.tags || []).join(', '),
      isPublished: a.isPublished !== false,
    })
  }

  const [tutorials, setTutorials] = useState<any[]>([])
  const [tutorialsLoading, setTutorialsLoading] = useState(false)
  const [tutorialForm, setTutorialForm] = useState({
    _id: '' as string,
    title: '',
    description: '',
    youtubeLink: '',
    category: 'general',
    isPublished: true,
  })
  const [tutorialSaving, setTutorialSaving] = useState(false)

  const fetchTutorialsAdmin = async () => {
    setTutorialsLoading(true)
    try {
      const res = await api.get('/admin/tutorials')
      setTutorials(res.data)
    } catch {
      toast.error('Could not load tutorials')
    } finally {
      setTutorialsLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'tutorials') fetchTutorialsAdmin()
  }, [mainTab])

  const saveTutorial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tutorialForm.title.trim() || !tutorialForm.youtubeLink.trim()) {
      toast.error('Title and YouTube link required')
      return
    }
    setTutorialSaving(true)
    try {
      if (tutorialForm._id) {
        const { _id, ...tutorialPayload } = tutorialForm
        await api.put(`/admin/tutorials/${_id}`, tutorialPayload)
        toast.success('Tutorial updated')
      } else {
        await api.post('/admin/tutorials', tutorialForm)
        toast.success('Tutorial created')
      }
      setTutorialForm({
        _id: '',
        title: '',
        description: '',
        youtubeLink: '',
        category: 'general',
        isPublished: true,
      })
      fetchTutorialsAdmin()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setTutorialSaving(false)
    }
  }

  const deleteTutorial = async (id: string) => {
    if (!confirm('Delete this tutorial?')) return
    try {
      await api.delete(`/admin/tutorials/${id}`)
      toast.success('Deleted')
      fetchTutorialsAdmin()
    } catch {
      toast.error('Delete failed')
    }
  }

  const editTutorial = (t: any) => {
    setTutorialForm({
      _id: t._id,
      title: t.title,
      description: t.description || '',
      youtubeLink: t.youtubeLink,
      category: t.category || 'general',
      isPublished: t.isPublished !== false,
    })
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <PageHeader title="Support" description="Tickets, help articles, and tutorials" />

        <Card padding="none">
          <div className="border-b border-[var(--border)]">
            <nav className="flex -mb-px overflow-x-auto">
              {(
                [
                  ['tickets', 'Support tickets'],
                  ['articles', 'Help articles'],
                  ['tutorials', 'Tutorials'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMainTab(id)
                    if (id === 'tickets') setSelectedTicketId(null)
                  }}
                  className={`py-4 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap ${
                    mainTab === id
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
            {mainTab === 'tickets' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Search</label>
                    <input
                      className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
                      value={ticketDraft.search}
                      onChange={(e) => setTicketDraft((d) => ({ ...d, search: e.target.value }))}
                      placeholder="Title or description"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Status</label>
                    <select
                      className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                      value={ticketDraft.status}
                      onChange={(e) => setTicketDraft((d) => ({ ...d, status: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="w-36">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                    <select
                      className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                      value={ticketDraft.priority}
                      onChange={(e) => setTicketDraft((d) => ({ ...d, priority: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <Button type="button" onClick={applyTicketFilters}>
                    Apply filters
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <div className="px-3 py-2 bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-secondary)]">
                      All tickets
                    </div>
                    {ticketsLoading ? (
                      <p className="p-4 text-sm text-[var(--text-secondary)]">Loading…</p>
                    ) : adminTickets.length === 0 ? (
                      <p className="p-4 text-sm text-[var(--text-secondary)]">No tickets.</p>
                    ) : (
                      <ul className="divide-y divide-[var(--border)] max-h-[480px] overflow-y-auto">
                        {adminTickets.map((t) => (
                          <li key={t._id}>
                            <button
                              type="button"
                              onClick={() => setSelectedTicketId(t._id)}
                              className={`w-full text-left px-3 py-3 text-sm hover:bg-[var(--surface-2)] ${
                                selectedTicketId === t._id ? 'bg-[var(--surface-2)]' : ''
                              }`}
                            >
                              <div className="font-medium text-[var(--text-primary)]">{t.title}</div>
                              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                                {t.shop?.name || t.shop?.email || 'Shop'}
                              </div>
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
                      <p className="text-sm text-[var(--text-secondary)]">Select a ticket.</p>
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
                        <div className="flex flex-wrap gap-2 items-center">
                          <select
                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                            value={statusEdit}
                            onChange={(e) => setStatusEdit(e.target.value)}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <Button type="button" size="sm" onClick={handleStatusSave} disabled={savingStatus}>
                            {savingStatus ? 'Saving…' : 'Update status'}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
                        <form onSubmit={handleReplyAdmin} className="space-y-2">
                          <textarea
                            className="w-full min-h-[80px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Reply as admin…"
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

            {mainTab === 'articles' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={saveArticle} className="space-y-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    {articleForm._id ? 'Edit article' : 'New article'}
                  </h3>
                  <Input
                    label="Title"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Content</label>
                    <textarea
                      className="w-full min-h-[140px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm"
                      value={articleForm.content}
                      onChange={(e) => setArticleForm((f) => ({ ...f, content: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Category"
                    value={articleForm.category}
                    onChange={(e) => setArticleForm((f) => ({ ...f, category: e.target.value }))}
                  />
                  <Input
                    label="Tags (comma-separated)"
                    value={articleForm.tags}
                    onChange={(e) => setArticleForm((f) => ({ ...f, tags: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={articleForm.isPublished}
                      onChange={(e) => setArticleForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    />
                    Published
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={articleSaving}>
                      {articleSaving ? 'Saving…' : articleForm._id ? 'Update' : 'Create'}
                    </Button>
                    {articleForm._id && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setArticleForm({
                            _id: '',
                            title: '',
                            content: '',
                            category: 'general',
                            tags: '',
                            isPublished: true,
                          })
                        }
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Articles</h3>
                  {articlesLoading ? (
                    <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                  ) : (
                    <ul className="space-y-2 max-h-[520px] overflow-y-auto">
                      {articles.map((a) => (
                        <li
                          key={a._id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
                        >
                          <div>
                            <div className="font-medium text-sm text-[var(--text-primary)]">{a.title}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{a.category}</div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button type="button" size="sm" variant="secondary" onClick={() => editArticle(a)}>
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => deleteArticle(a._id)}>
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {mainTab === 'tutorials' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={saveTutorial} className="space-y-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    {tutorialForm._id ? 'Edit tutorial' : 'New tutorial'}
                  </h3>
                  <Input
                    label="Title"
                    value={tutorialForm.title}
                    onChange={(e) => setTutorialForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm"
                      value={tutorialForm.description}
                      onChange={(e) => setTutorialForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="YouTube link"
                    value={tutorialForm.youtubeLink}
                    onChange={(e) => setTutorialForm((f) => ({ ...f, youtubeLink: e.target.value }))}
                  />
                  <Input
                    label="Category"
                    value={tutorialForm.category}
                    onChange={(e) => setTutorialForm((f) => ({ ...f, category: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={tutorialForm.isPublished}
                      onChange={(e) => setTutorialForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    />
                    Published
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={tutorialSaving}>
                      {tutorialSaving ? 'Saving…' : tutorialForm._id ? 'Update' : 'Create'}
                    </Button>
                    {tutorialForm._id && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setTutorialForm({
                            _id: '',
                            title: '',
                            description: '',
                            youtubeLink: '',
                            category: 'general',
                            isPublished: true,
                          })
                        }
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Tutorials</h3>
                  {tutorialsLoading ? (
                    <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                  ) : (
                    <ul className="space-y-2 max-h-[520px] overflow-y-auto">
                      {tutorials.map((t) => (
                        <li
                          key={t._id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
                        >
                          <div>
                            <div className="font-medium text-sm text-[var(--text-primary)]">{t.title}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                              {t.youtubeLink}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button type="button" size="sm" variant="secondary" onClick={() => editTutorial(t)}>
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => deleteTutorial(t._id)}>
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
