import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { EmptyState } from './Dashboard';

export default function Projects() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [formModal, setFormModal] = useState({ open: false, editId: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '' });

  // Form state
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api
      .get('/projects/')
      .then((res) => {
        const results = res.data.results ?? res.data;
        setProjects(Array.isArray(results) ? results : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  /* ── Open helpers ─────────────────────────────────── */

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setError('');
    setFormModal({ open: true, editId: null });
  };

  const openEdit = (project) => {
    setForm({ name: project.name, description: project.description || '' });
    setError('');
    setFormModal({ open: true, editId: project.id });
  };

  const openDelete = (project) => {
    setConfirmModal({ open: true, id: project.id, name: project.name });
  };

  /* ── Submit handler (create or update) ────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const isEdit = formModal.editId !== null;

    try {
      if (isEdit) {
        await api.patch(`/projects/${formModal.editId}/`, form);
        addToast('Project updated successfully');
      } else {
        await api.post('/projects/', form);
        addToast('Project created successfully');
      }
      setFormModal({ open: false, editId: null });
      fetchProjects();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(', ');
        setError(msgs);
      } else {
        setError(isEdit ? 'Failed to update project.' : 'Failed to create project.');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete handler ───────────────────────────────── */

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${confirmModal.id}/`);
      addToast(`"${confirmModal.name}" deleted`);
      setConfirmModal({ open: false, id: null, name: '' });
      fetchProjects();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete project.', 'error');
      setConfirmModal({ open: false, id: null, name: '' });
    } finally {
      setDeleting(false);
    }
  };

  /* ── Render ───────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
          <span className="text-sm text-slate-400">Loading projects…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
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
          New Project
        </button>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 002-2V8a2 2 0 00-2-2h-7.9a2 2 0 01-1.69-.9L9.6 3.9A2 2 0 007.93 3H4a2 2 0 00-2 2v13a2 2 0 002 2h16z" />
            </svg>
          }
          title="No projects yet"
          description="Create your first project to start organizing tasks."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.995]"
            >
              {/* Accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-brand-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Action buttons */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEdit(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="Edit project"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => openDelete(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete project"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>

              <h3 className="pr-16 text-[15px] font-semibold text-slate-900">{p.name}</h3>
              {p.description && (
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
                  {p.description}
                </p>
              )}

              {/* Meta */}
              <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  {p.task_count ?? 0} {p.task_count === 1 ? 'task' : 'tasks'}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {p.member_count ?? 0} {p.member_count === 1 ? 'member' : 'members'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────── */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, editId: null })}
        title={formModal.editId ? 'Edit Project' : 'New Project'}
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
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Name</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none resize-none"
              placeholder="Briefly describe the project…"
            />
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
                : (formModal.editId ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete Modal ──────────────────────── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        message={
          <>
            Are you sure you want to delete <strong className="text-slate-800">"{confirmModal.name}"</strong>?
            All tasks in this project will also be permanently deleted. This action cannot be undone.
          </>
        }
      />
    </div>
  );
}
