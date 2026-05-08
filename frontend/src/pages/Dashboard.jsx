import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, tasks: 0, completed: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects/'),
      api.get('/tasks/?limit=5'),
    ])
      .then(([projectsRes, tasksRes]) => {
        setStats({
          projects: projectsRes.data.count ?? projectsRes.data.length,
          tasks: tasksRes.data.count ?? tasksRes.data.length,
          completed: tasksRes.data.results
            ? tasksRes.data.results.filter((t) => t.status === 'done').length
            : tasksRes.data.filter((t) => t.status === 'done').length,
        });
        const results = tasksRes.data.results ?? tasksRes.data;
        setRecent(Array.isArray(results) ? results.slice(0, 5) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
          <span className="text-sm text-slate-400">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Projects',
      value: stats.projects,
      to: '/projects',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 20a2 2 0 002-2V8a2 2 0 00-2-2h-7.9a2 2 0 01-1.69-.9L9.6 3.9A2 2 0 007.93 3H4a2 2 0 00-2 2v13a2 2 0 002 2h16z" />
        </svg>
      ),
      bg: 'bg-brand-50',
      iconColor: 'text-brand-600',
    },
    {
      label: 'Total Tasks',
      value: stats.tasks,
      to: '/tasks',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: stats.completed,
      to: '/tasks?status=done',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      ),
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="animate-fade-in-up mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.username}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's what's happening across your projects.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.995]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg} ${s.iconColor} transition-transform group-hover:scale-110`}>
                {s.icon}
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent tasks */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="text-[13px] font-medium text-brand-600 hover:text-brand-500"
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            }
            title="No tasks yet"
            description="Create your first task from the Tasks page."
            action={
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Go to Tasks
              </Link>
            }
          />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((task) => (
                    <tr key={task.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="hidden sm:table-cell px-4 py-3 text-slate-500">
                        {task.assignee_name || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared badge components ────────────────────────── */

export function StatusBadge({ status }) {
  const map = {
    todo:        { bg: 'bg-slate-100',  text: 'text-slate-600', dot: 'bg-slate-400' },
    in_progress: { bg: 'bg-blue-50',    text: 'text-blue-700',  dot: 'bg-blue-500' },
    done:        { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  const s = map[status] || map.todo;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {labels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    low:    { bg: 'bg-slate-50',   text: 'text-slate-500' },
    medium: { bg: 'bg-amber-50',   text: 'text-amber-600' },
    high:   { bg: 'bg-rose-50',    text: 'text-rose-600' },
  };
  const p = map[priority] || map.medium;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${p.bg} ${p.text}`}>
      {priority}
    </span>
  );
}

/* ── Empty state component ──────────────────────────── */

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 px-6 py-14">
      <div className="mb-4">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-xs text-center text-[13px] text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
