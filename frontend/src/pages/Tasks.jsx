import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge, OverdueBadge, isOverdue, EmptyState } from './Dashboard';

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function Tasks() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ project: '', status: '', priority: '' });

  // Modal state
  const [formModal, setFormModal] = useState({ open: false, editId: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, title: '' });

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', project: '', priority: 'medium', due_date: '', assignee: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = {
    title: '', description: '', project: '', priority: 'medium', due_date: '', assignee: '',
  };

  /* ── Data fetching ────────────────────────────────── */

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.project) params.project = filters.project;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    api
      .get('/tasks/', { params })
      .then((res) => {
        const results = res.data.results ?? res.data;
        setTasks(Array.isArray(results) ? results : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    api
      .get('/projects/')
      .then((res) => {
        const results = res.data.results ?? res.data;
        setProjects(Array.isArray(results) ? results : []);
      })
      .catch(() => {});
  }, []);

  /* ── Open helpers ─────────────────────────────────── */

  const openCreate = async () => {
    setForm(emptyForm);
    setError('');
    try {
      const res = await api.get('/users/');
      setUsers(res.data.results ?? res.data);
    } catch { setUsers([]); }
    setFormModal({ open: true, editId: null });
  };

  const openEdit = async (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      project: task.project,
      priority: task.priority,
      due_date: task.due_date || '',
      assignee: task.assignee || '',
    });
    setError('');
    try {
      const res = await api.get('/users/');
      setUsers(res.data.results ?? res.data);
    } catch { setUsers([]); }
    setFormModal({ open: true, editId: task.id });
  };

  const openDelete = (task) => {
    setConfirmModal({ open: true, id: task.id, title: task.title });
  };

  /* ── Submit handler (create or update) ────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const isEdit = formModal.editId !== null;

    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      if (!payload.assignee) payload.assignee = null;

      if (isEdit) {
        await api.patch(`/tasks/${formModal.editId}/`, payload);
        addToast('Task updated successfully');
      } else {
        await api.post('/tasks/', payload);
        addToast('Task created successfully');
      }
      setFormModal({ open: false, editId: null });
      fetchTasks();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(', ');
        setError(msgs);
      } else {
        setError(isEdit ? 'Failed to update task.' : 'Failed to create task.');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete handler ───────────────────────────────── */

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${confirmModal.id}/`);
      addToast(`"${confirmModal.title}" deleted`);
      setConfirmModal({ open: false, id: null, title: '' });
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete task.', 'error');
      setConfirmModal({ open: false, id: null, title: '' });
    } finally {
      setDeleting(false);
    }
  };

  /* ── Quick status change ──────────────────────────── */

  const cycleStatus = async (task) => {
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    const newStatus = next[task.status];
    try {
      await api.patch(`/tasks/${task.id}/`, { status: newStatus });
      addToast(`Status changed to "${newStatus.replace('_', ' ')}"`);
      fetchTasks();
    } catch {
      addToast('Failed to update status.', 'error');
    }
  };

  /* ── Render ───────────────────────────────────────── */

  const hasActiveFilters = filters.project || filters.status || filters.priority;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
          <span className="text-sm text-slate-400">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ project: '', status: '', priority: '' })}
                className="ml-2 font-medium text-brand-600 hover:text-brand-500"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/25 active:scale-[0.98] sm:self-auto"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </div>

      {/* Filters bar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <FilterSelect
          value={filters.project}
          onChange={(v) => setFilters({ ...filters, project: v })}
          placeholder="All projects"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          placeholder="All statuses"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filters.priority}
          onChange={(v) => setFilters({ ...filters, priority: v })}
          placeholder="All priorities"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </FilterSelect>
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          }
          title={hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'Create your first task to start tracking work.'
          }
          action={
            !hasActiveFilters ? (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Task
              </button>
            ) : null
          }
        />
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assignee</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Due</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => {
                  const overdue = isOverdue(t);
                  return (
                  <tr key={t.id} className={`transition-colors ${overdue ? 'bg-red-50/60 hover:bg-red-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {t.title}
                        {overdue && <OverdueBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => cycleStatus(t)}
                        className="cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95"
                        title={`Click to change status (currently: ${t.status.replace('_', ' ')})`}
                      >
                        <StatusBadge status={t.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="hidden md:table-cell px-4 py-3 text-slate-500">
                      {t.project_name || t.project || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-slate-500">
                      {t.assignee_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      {t.due_date ? (
                        <span className={overdue ? 'font-medium text-red-600' : 'text-slate-500'}>{t.due_date}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          title="Edit task"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDelete(t)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete task"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────── */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, editId: null })}
        title={formModal.editId ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none resize-none"
              placeholder="Add more context…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                Project <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Assignee</label>
              <select
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormModal({ open: false, editId: null })}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {saving && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {saving
                ? (formModal.editId ? 'Saving…' : 'Creating…')
                : (formModal.editId ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete Modal ──────────────────────── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null, title: '' })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message={
          <>
            Are you sure you want to delete <strong className="text-slate-800">"{confirmModal.title}"</strong>?
            This action cannot be undone.
          </>
        }
      />
    </div>
  );
}

/* ── Reusable filter dropdown ───────────────────────── */

function FilterSelect({ value, onChange, placeholder, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
