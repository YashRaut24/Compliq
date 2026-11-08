import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const categories = [
  { value: '', label: 'All categories' },
  { value: 'refund', label: 'Refund' },
  { value: 'delay', label: 'Delay' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'other', label: 'Other' },
]

const urgencies = [
  { value: '', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
]

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'inbox') {
    return <svg {...common}><path d="M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Z" /><path d="M2 15h6l2 3h4l2-3h6" /></svg>
  }
  if (name === 'chart') {
    return <svg {...common}><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></svg>
  }
  if (name === 'building') {
    return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3" /></svg>
  }
  if (name === 'search') {
    return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></svg>
  }
  if (name === 'refresh') {
    return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></svg>
  }
  if (name === 'arrow') {
    return <svg {...common}><path d="M7 17 17 7M7 7h10v10" /></svg>
  }
  return null
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function titleCase(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ComplaintCard({ complaint, onReplyUpdated }) {
  const id = complaint._id || complaint.id
  const [editingReply, setEditingReply] = useState(false)
  const [replyDraft, setReplyDraft] = useState(complaint.replyDraft || '')
  const [savingReply, setSavingReply] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [replySaved, setReplySaved] = useState(false)

  async function saveReply(event) {
    event.preventDefault()
    setSavingReply(true)
    setReplyError('')
    setReplySaved(false)

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/complaints/${id}/reply`,
        { replyDraft },
      )
      onReplyUpdated(response.data.complaint)
      setEditingReply(false)
      setReplySaved(true)
    } catch (requestError) {
      setReplyError(
        requestError.response?.data?.message || 'Could not save this reply. Please try again.',
      )
    } finally {
      setSavingReply(false)
    }
  }

  return (
    <article className="complaint-card">
      <div className="card-main">
        <div className="card-topline">
          <div className="badge-list">
            <span className={`badge category-badge category-${complaint.issueType || 'other'}`}>
              {titleCase(complaint.issueType || 'other')}
            </span>
            <span className={`badge priority-badge priority-${complaint.priority || 'normal'}`}>
              <span className="priority-dot" />
              {titleCase(complaint.priority || 'normal')} priority
            </span>
            <span className={`badge status-badge status-${complaint.status || 'new'}`}>
              {titleCase(complaint.status || 'new')}
            </span>
          </div>
          <span className="complaint-date">{formatDate(complaint.createdAt)}</span>
        </div>

        <p className="complaint-message">{complaint.message || 'No complaint message provided.'}</p>

        <div className="card-footer">
          <div className="complaint-meta">
            <span className="source-label">{titleCase(complaint.source || 'other')}</span>
            <span className="meta-divider" />
            <span className={`sentiment sentiment-${complaint.sentiment || 'neutral'}`}>
              {titleCase(complaint.sentiment || 'neutral')} sentiment
            </span>
            {id && <><span className="meta-divider" /><span className="complaint-id">#{String(id).slice(-6)}</span></>}
          </div>
        </div>
        <section className="reply-editor" aria-label="Reply draft">
          <div className="reply-editor-heading">
            <span className="reply-label">REPLY DRAFT</span>
            {!editingReply && (
              <button
                type="button"
                className="reply-edit-button"
                onClick={() => {
                  setReplyDraft(complaint.replyDraft || '')
                  setReplyError('')
                  setReplySaved(false)
                  setEditingReply(true)
                }}
              >
                {complaint.replyDraft ? 'Edit draft' : 'Add draft'}
              </button>
            )}
          </div>
          {editingReply ? (
            <form className="reply-edit-form" onSubmit={saveReply}>
              <textarea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                maxLength={2000}
                rows={3}
                required
                aria-label="Edit reply draft"
              />
              {replyError && <p className="form-error" role="alert">{replyError}</p>}
              <div className="reply-form-actions">
                <span className="character-count">{replyDraft.length}/2000</span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingReply(false)}
                  disabled={savingReply}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={savingReply || !replyDraft.trim()}>
                  {savingReply ? 'Saving…' : 'Save draft'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {complaint.replyDraft
                ? <p className="reply-draft-text">{complaint.replyDraft}</p>
                : <p className="reply-placeholder">No reply draft yet.</p>}
              {replySaved && <p className="success-message" role="status">Draft saved.</p>}
            </>
          )}
        </section>
      </div>
    </article>
  )
}

function App() {
  const [complaints, setComplaints] = useState([])
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [businessId, setBusinessId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newSource, setNewSource] = useState('email')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const params = {}
    if (category) params.category = category
    if (urgency) params.urgency = urgency
    if (status) params.status = status

    async function loadComplaints() {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${API_BASE_URL}/complaints`, {
          params,
          signal: controller.signal,
        })
        setComplaints(response.data.complaints)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(
          requestError.response?.data?.message ||
            'Could not load complaints. Check that the API server is running and try again.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadComplaints()
    return () => controller.abort()
  }, [category, urgency, status, refreshKey])

  const visibleComplaints = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return complaints
    return complaints.filter((complaint) =>
      [complaint.message, complaint.issueType, complaint.source, complaint.replyDraft]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [complaints, search])

  const activeFilterCount = [category, urgency, status].filter(Boolean).length

  async function submitComplaint(event) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      await axios.post(`${API_BASE_URL}/complaints`, {
        businessId: businessId.trim(),
        message: newMessage.trim(),
        source: newSource,
      })
      setNewMessage('')
      setShowSubmitForm(false)
      setSubmitSuccess('Complaint submitted. Its analysis and reply draft are ready.')
      setRefreshKey((key) => key + 1)
    } catch (requestError) {
      setSubmitError(
        requestError.response?.data?.message || 'Could not submit the complaint. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function updateComplaintReply(updatedComplaint) {
    const updatedId = updatedComplaint._id || updatedComplaint.id
    setComplaints((current) =>
      current.map((complaint) =>
        (complaint._id || complaint.id) === updatedId ? updatedComplaint : complaint,
      ),
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Compliq home">
          <span className="brand-mark">C</span>
          <span>compliq<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">S</span>
          <span className="workspace-name">Small business</span>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="nav-label">MENU</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#inbox" aria-current="page">
            <Icon name="inbox" />
            <span>Inbox</span>
            <span className="nav-count">{complaints.length}</span>
          </a>
          <a className="nav-item disabled-nav" href="#insights" onClick={(event) => event.preventDefault()}>
            <Icon name="chart" />
            <span>Insights</span>
            <span className="soon-label">SOON</span>
          </a>
          <a className="nav-item disabled-nav" href="#business" onClick={(event) => event.preventDefault()}>
            <Icon name="building" />
            <span>Business</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-indicator"><span /> All systems operational</div>
          <div className="profile">
            <div className="profile-avatar">Y</div>
            <div className="profile-copy"><strong>Workspace admin</strong><span>Owner</span></div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="inbox">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>Inbox</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <span className="user-avatar">Y</span>
          </div>
        </header>

        <section className="inbox-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> CUSTOMER CARE</div>
              <h1>Complaint inbox</h1>
              <p className="page-subtitle">A clear view of every customer concern, all in one place.</p>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
            >
              <Icon name="refresh" size={16} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="submit-area">
            <div className="submit-area-top">
              <div>
                <strong>Have a new customer complaint?</strong>
                <span>Submit it for AI analysis and a reply draft.</span>
              </div>
              <button
                type="button"
                className="submit-button"
                onClick={() => {
                  setShowSubmitForm((shown) => !shown)
                  setSubmitError('')
                  setSubmitSuccess('')
                }}
                aria-expanded={showSubmitForm}
                aria-controls="complaint-submit-form"
              >
                {showSubmitForm ? 'Close form' : 'New complaint'}
              </button>
            </div>
            {submitSuccess && <p className="success-message submit-feedback" role="status">{submitSuccess}</p>}
            {showSubmitForm && (
              <form id="complaint-submit-form" className="submit-form" onSubmit={submitComplaint}>
                <div className="form-field">
                  <label htmlFor="business-id">Business ID</label>
                  <input
                    id="business-id"
                    value={businessId}
                    onChange={(event) => setBusinessId(event.target.value)}
                    placeholder="Paste an existing business ID"
                    required
                  />
                  <span className="field-hint">Use the MongoDB ID of an existing business.</span>
                </div>
                <div className="form-field">
                  <label htmlFor="complaint-source">Source</label>
                  <select
                    id="complaint-source"
                    value={newSource}
                    onChange={(event) => setNewSource(event.target.value)}
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field form-field-wide">
                  <label htmlFor="complaint-message">Customer message</label>
                  <textarea
                    id="complaint-message"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Paste the customer’s complaint here…"
                    maxLength={5000}
                    rows={4}
                    required
                  />
                  <span className="field-hint">{newMessage.length}/5000 characters</span>
                </div>
                {submitError && <p className="form-error form-field-wide" role="alert">{submitError}</p>}
                <div className="submit-form-actions form-field-wide">
                  <span className="field-hint">The generated reply is a draft for your review.</span>
                  <button type="submit" className="submit-button" disabled={submitting || !newMessage.trim() || !businessId.trim()}>
                    {submitting ? 'Analyzing…' : 'Analyze complaint'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <section className="inbox-panel" aria-label="Complaint list">
            <div className="panel-heading">
              <div className="panel-title-group">
                <h2>All complaints</h2>
                <span className="total-pill">{loading ? '…' : visibleComplaints.length}</span>
              </div>
              <label className="search-box">
                <Icon name="search" size={17} />
                <input
                  type="search"
                  placeholder="Search complaints..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search complaints"
                />
                <kbd>/</kbd>
              </label>
            </div>

            <div className="filter-toolbar">
              <div className="filter-label">
                <span>FILTER BY</span>
                {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount} active</span>}
              </div>
              <div className="filter-controls">
                <label className="select-wrap">
                  <span className="sr-only">Filter by category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Filter by urgency</span>
                  <select value={urgency} onChange={(event) => setUrgency(event.target.value)}>
                    {urgencies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="select-wrap">
                  <span className="sr-only">Filter by status</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {activeFilterCount > 0 && (
                  <button
                    className="clear-filters"
                    type="button"
                    onClick={() => { setCategory(''); setUrgency(''); setStatus('') }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <div className="feedback-state error-state" role="alert">
                <span className="feedback-icon">!</span>
                <h3>We couldn’t load the inbox</h3>
                <p>{error}</p>
                <button type="button" className="text-button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button>
              </div>
            ) : loading ? (
              <div className="feedback-state" role="status">
                <span className="loading-spinner" />
                <h3>Loading complaints</h3>
                <p>Fetching the latest from your inbox…</p>
              </div>
            ) : visibleComplaints.length === 0 ? (
              <div className="feedback-state">
                <div className="empty-icon"><Icon name="inbox" size={23} /></div>
                <h3>{search || activeFilterCount ? 'No matching complaints' : 'Your inbox is clear'}</h3>
                <p>{search || activeFilterCount ? 'Try adjusting your search or filters.' : 'New customer complaints will show up here.'}</p>
                {(search || activeFilterCount > 0) && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => { setSearch(''); setCategory(''); setUrgency(''); setStatus('') }}
                  >
                    Clear search and filters
                  </button>
                )}
              </div>
            ) : (
              <div className="complaint-list">
                {visibleComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint._id || complaint.id}
                    complaint={complaint}
                    onReplyUpdated={updateComplaintReply}
                  />
                ))}
              </div>
            )}

            {!loading && !error && visibleComplaints.length > 0 && (
              <div className="list-footer">
                Showing <strong>{visibleComplaints.length}</strong> complaint{visibleComplaints.length === 1 ? '' : 's'}
                {search && complaints.length !== visibleComplaints.length && <> matching <strong>“{search}”</strong></>}
              </div>
            )}
          </section>
          <footer className="page-footer"><span>COMPLIQ</span><span>Customer conversations, handled thoughtfully.</span></footer>
        </section>
      </main>
    </div>
  )
}

export default App
