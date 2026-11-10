import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const ACTIVE_BUSINESS_KEY = 'compliq.activeBusinessId'

function getStoredBusinessId() {
  try {
    return window.localStorage.getItem(ACTIVE_BUSINESS_KEY) || ''
  } catch {
    return ''
  }
}

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

const categoryColors = ['#d3a66d', '#88a7c7', '#cd827a', '#9ca89c']

const chartTooltipStyle = {
  border: '1px solid #e7eae5',
  borderRadius: '8px',
  boxShadow: '0 6px 20px #24372d12',
  fontSize: '11px',
}

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

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${API_BASE_URL}/stats`, {
          signal: controller.signal,
        })
        setStats(response.data)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(
          requestError.response?.data?.message ||
            'Could not load dashboard statistics. Check that the API server is running and try again.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadStats()
    return () => controller.abort()
  }, [refreshKey])

  const categoryData = categories.slice(1).map(({ value, label }) => ({
    name: label,
    count: stats?.byCategory?.[value] || 0,
  }))
  const priorityData = urgencies.slice(1).map(({ value, label }) => ({
    name: label,
    count: stats?.byPriority?.[value] || 0,
  }))
  const statusData = statuses.slice(1).map(({ value, label }) => ({
    name: label,
    count: stats?.byStatus?.[value] || 0,
  }))
  const hasComplaints = (stats?.total || 0) > 0

  return (
    <div className="dashboard-content">
      <div className="dashboard-toolbar">
        <p>Insights across all complaints in your workspace.</p>
        <button
          type="button"
          className="refresh-button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <Icon name="refresh" size={16} />
          <span>{loading ? 'Updating…' : 'Refresh data'}</span>
        </button>
      </div>

      {error ? (
        <div className="feedback-state dashboard-feedback" role="alert">
          <span className="feedback-icon">!</span>
          <h3>Dashboard data is unavailable</h3>
          <p>{error}</p>
          <button type="button" className="text-button" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="stat-cards">
            <article className="stat-card">
              <span className="stat-label">TOTAL COMPLAINTS</span>
              <strong>{loading ? '—' : stats.total}</strong>
              <span className="stat-footnote">All recorded complaints</span>
            </article>
            <article className="stat-card stat-card-open">
              <span className="stat-label">NEEDS ATTENTION</span>
              <strong>{loading ? '—' : stats.unresolved}</strong>
              <span className="stat-footnote">New or in review</span>
            </article>
            <article className="stat-card stat-card-urgent">
              <span className="stat-label">URGENT PRIORITY</span>
              <strong>{loading ? '—' : stats.urgent}</strong>
              <span className="stat-footnote">Requires timely attention</span>
            </article>
            <article className="stat-card stat-card-resolved">
              <span className="stat-label">RESOLVED</span>
              <strong>{loading ? '—' : stats.byStatus.resolved}</strong>
              <span className="stat-footnote">Marked as resolved</span>
            </article>
          </div>

          {loading ? (
            <div className="feedback-state dashboard-loading" role="status">
              <span className="loading-spinner" />
              <h3>Loading dashboard</h3>
              <p>Preparing your complaint insights…</p>
            </div>
          ) : !hasComplaints ? (
            <div className="feedback-state dashboard-empty">
              <div className="empty-icon"><Icon name="chart" size={23} /></div>
              <h3>No insights yet</h3>
              <p>Charts will appear here after complaints have been added to your workspace.</p>
            </div>
          ) : (
            <div className="dashboard-chart-grid">
              <section className="chart-card chart-card-category">
                <div className="chart-heading">
                  <div><h2>Complaints by category</h2><p>What customers are contacting you about</p></div>
                  <span className="chart-mark">01</span>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        innerRadius="57%"
                        outerRadius="79%"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={categoryColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend iconType="circle" iconSize={7} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-total"><strong>{stats.total}</strong><span>total</span></div>
                </div>
              </section>

              <section className="chart-card">
                <div className="chart-heading">
                  <div><h2>Priority breakdown</h2><p>Current complaint urgency</p></div>
                  <span className="chart-mark">02</span>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 2 }}>
                      <CartesianGrid stroke="#edf0eb" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8b938d', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#68736b', fontSize: 10 }} width={58} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#f5f7f3' }} />
                      <Bar dataKey="count" name="Complaints" fill="#809574" radius={[0, 5, 5, 0]} barSize={17} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="chart-card chart-card-status">
                <div className="chart-heading">
                  <div><h2>Resolution status</h2><p>Where each complaint stands</p></div>
                  <span className="chart-mark">03</span>
                </div>
                <div className="chart-area chart-area-status">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 14, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid stroke="#edf0eb" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#68736b', fontSize: 10 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8b938d', fontSize: 10 }} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#f5f7f3' }} />
                      <Bar dataKey="count" name="Complaints" fill="#9aab8f" radius={[5, 5, 0, 0]} barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SettingsPage({ activeBusinessId, onBusinessSaved }) {
  const [businessId, setBusinessId] = useState(activeBusinessId)
  const [loadedBusinessId, setLoadedBusinessId] = useState('')
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!activeBusinessId || activeBusinessId === loadedBusinessId) return undefined

    const controller = new AbortController()
    async function loadActiveBusiness() {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(
          `${API_BASE_URL}/businesses/${encodeURIComponent(activeBusinessId)}`,
          { signal: controller.signal },
        )
        setName(response.data.business.name)
        setIndustry(response.data.business.industry || '')
        setBusinessId(activeBusinessId)
        setLoadedBusinessId(activeBusinessId)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(requestError.response?.data?.message || 'Could not load this business profile.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadActiveBusiness()
    return () => controller.abort()
  }, [activeBusinessId, loadedBusinessId])

  async function loadBusiness(id = businessId) {
    const requestedId = id.trim()
    if (!requestedId) {
      setError('Enter a business ID to load its profile.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await axios.get(`${API_BASE_URL}/businesses/${encodeURIComponent(requestedId)}`)
      setName(response.data.business.name)
      setIndustry(response.data.business.industry || '')
      setBusinessId(requestedId)
      setLoadedBusinessId(requestedId)
      onBusinessSaved(response.data.business)
      setSuccess('Business profile loaded.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this business profile.')
    } finally {
      setLoading(false)
    }
  }

  async function saveBusiness(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = { name: name.trim(), industry: industry.trim() }
      const response = loadedBusinessId && loadedBusinessId === businessId.trim()
        ? await axios.patch(`${API_BASE_URL}/businesses/${encodeURIComponent(loadedBusinessId)}`, payload)
        : await axios.post(`${API_BASE_URL}/businesses`, payload)
      const business = response.data.business
      const savedId = business._id
      let successMessage = 'Business profile saved.'

      try {
        window.localStorage.setItem(ACTIVE_BUSINESS_KEY, savedId)
      } catch {
        successMessage = 'Profile saved, but this browser could not remember the selected business.'
      }

      setBusinessId(savedId)
      setLoadedBusinessId(savedId)
      setName(business.name)
      setIndustry(business.industry || '')
      onBusinessSaved(business)
      setError('')
      setSuccess(successMessage)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this business profile.')
    } finally {
      setSaving(false)
    }
  }

  function startNewProfile() {
    setBusinessId('')
    setLoadedBusinessId('')
    setName('')
    setIndustry('')
    setError('')
    setSuccess('')
  }

  const hasLoadedProfile = Boolean(loadedBusinessId && loadedBusinessId === businessId.trim())

  return (
    <div className="settings-content">
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-icon"><Icon name="building" size={19} /></div>
          <div>
            <h2>Business profile</h2>
            <p>Manage the business details associated with your complaint workspace.</p>
          </div>
        </div>

        <form className="settings-form" onSubmit={saveBusiness}>
          <div className="settings-id-row">
            <div className="form-field">
              <label htmlFor="settings-business-id">Business ID</label>
              <input
                id="settings-business-id"
                value={businessId}
                onChange={(event) => {
                  setBusinessId(event.target.value)
                  setError('')
                  setSuccess('')
                }}
                placeholder="Leave blank to create a business profile"
                aria-describedby="settings-id-help"
              />
              <span className="field-hint" id="settings-id-help">
                {activeBusinessId
                  ? 'This browser remembers the selected business ID.'
                  : 'To edit an existing profile, enter its ID and load it first.'}
              </span>
            </div>
            <button
              type="button"
              className="secondary-button load-business-button"
              onClick={() => loadBusiness()}
              disabled={loading || !businessId.trim()}
            >
              {loading ? 'Loading…' : 'Load profile'}
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="settings-business-name">Business name</label>
            <input
              id="settings-business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Northside Family Clinic"
              maxLength={120}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="settings-business-industry">Industry <span className="optional-label">OPTIONAL</span></label>
            <input
              id="settings-business-industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="e.g. Healthcare, retail, hospitality"
              maxLength={120}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="success-message" role="status">{success}</p>}

          <div className="settings-form-actions">
            <span className="field-hint">
              {hasLoadedProfile ? 'Editing the loaded business profile.' : 'Saving without an ID creates a new business.'}
            </span>
            <div>
              {hasLoadedProfile && (
                <button type="button" className="text-button" onClick={startNewProfile}>
                  Create new profile
                </button>
              )}
              <button
                type="submit"
                className="submit-button"
                disabled={saving || loading || (Boolean(businessId.trim()) && !hasLoadedProfile)}
              >
                {saving ? 'Saving…' : hasLoadedProfile ? 'Save changes' : 'Create profile'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <aside className="settings-note">
        <strong>About your profile</strong>
        <p>Your profile is stored in the database. The selected business ID is remembered only in this browser and is used to prefill the complaint submission form.</p>
      </aside>
    </div>
  )
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
  const [activePage, setActivePage] = useState('inbox')
  const [activeBusinessId, setActiveBusinessId] = useState(getStoredBusinessId)
  const [workspaceName, setWorkspaceName] = useState('Small business')
  const [complaints, setComplaints] = useState([])
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [businessId, setBusinessId] = useState(getStoredBusinessId)
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

  function handleBusinessSaved(business) {
    setActiveBusinessId(business._id)
    setBusinessId(business._id)
    setWorkspaceName(business.name)
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
          <span className="workspace-avatar">{workspaceName.charAt(0).toUpperCase() || 'S'}</span>
          <span className="workspace-name">{workspaceName}</span>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="nav-label">MENU</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${activePage === 'inbox' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('inbox')}
            aria-current={activePage === 'inbox' ? 'page' : undefined}
          >
            <Icon name="inbox" />
            <span>Inbox</span>
            <span className="nav-count">{complaints.length}</span>
          </button>
          <button
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('dashboard')}
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
          >
            <Icon name="chart" />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('settings')}
            aria-current={activePage === 'settings' ? 'page' : undefined}
          >
            <Icon name="building" />
            <span>Settings</span>
          </button>
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

      <main className="main-content" id={activePage}>
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{titleCase(activePage)}</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <span className="user-avatar">Y</span>
          </div>
        </header>

        <section className="inbox-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> {activePage === 'inbox' ? 'CUSTOMER CARE' : activePage === 'dashboard' ? 'WORKSPACE OVERVIEW' : 'WORKSPACE SETTINGS'}</div>
              <h1>{activePage === 'inbox' ? 'Complaint inbox' : activePage === 'dashboard' ? 'Dashboard' : 'Settings'}</h1>
              <p className="page-subtitle">
                {activePage === 'inbox'
                  ? 'A clear view of every customer concern, all in one place.'
                  : activePage === 'dashboard'
                    ? 'A clear picture of customer concerns and how your team is responding.'
                    : 'Keep your business details up to date.'}
              </p>
            </div>
            {activePage === 'inbox' && (
              <button
                className="refresh-button"
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
              >
                <Icon name="refresh" size={16} />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {activePage === 'dashboard' ? (
            <DashboardPage />
          ) : activePage === 'settings' ? (
            <SettingsPage
              activeBusinessId={activeBusinessId}
              onBusinessSaved={handleBusinessSaved}
            />
          ) : (
            <>
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
            </>
          )}
          <footer className="page-footer"><span>COMPLIQ</span><span>Customer conversations, handled thoughtfully.</span></footer>
        </section>
      </main>
    </div>
  )
}

export default App
