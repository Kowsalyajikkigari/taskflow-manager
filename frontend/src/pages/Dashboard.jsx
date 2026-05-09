import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/* ═══════════════════════════════════════════════════════
   Color tokens — mirrors the purple theme
   ═══════════════════════════════════════════════════════ */
const CHART_COLORS = {
  brand: '#6366f1',
  brandLight: '#a5b4fc',
  brandDark: '#4338ca',
  slate: '#94a3b8',
  slateLight: '#e2e8f0',
  emerald: '#10b981',
  emeraldLight: '#a7f3d0',
  amber: '#f59e0b',
  amberLight: '#fde68a',
  rose: '#f43f5e',
  roseLight: '#fecdd3',
  blue: '#3b82f6',
  blueLight: '#bfdbfe',
};

/* ── Shared Recharts tooltip style ──────────────────── */
const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
    padding: '10px 14px',
  },
  itemStyle: { padding: '2px 0' },
  labelStyle: {
    fontWeight: 600,
    color: '#334155',
    marginBottom: 4,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

/* ═══════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0 });
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects/'),
      api.get('/tasks/'),
    ])
      .then(([projectsRes, tasksRes]) => {
        const projectData = projectsRes.data;
        setStats({
          projects: projectData.count ?? projectData.length,
        });

        const taskData = tasksRes.data.results ?? tasksRes.data;
        setAllTasks(Array.isArray(taskData) ? taskData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived data for charts ──────────────────────── */
  const analytics = useMemo(() => {
    const todo = allTasks.filter((t) => t.status === 'todo').length;
    const inProgress = allTasks.filter((t) => t.status === 'in_progress').length;
    const done = allTasks.filter((t) => t.status === 'done').length;
    const pending = todo + inProgress;

    const low = allTasks.filter((t) => t.priority === 'low').length;
    const medium = allTasks.filter((t) => t.priority === 'medium').length;
    const high = allTasks.filter((t) => t.priority === 'high').length;

    return {
      total: allTasks.length,
      completed: done,
      pending,
      todo,
      inProgress,
      done,
      low,
      medium,
      high,
      completionRate: allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0,
    };
  }, [allTasks]);

  const recentTasks = allTasks.slice(0, 5);

  /* ── Chart-ready data arrays ──────────────────────── */
  const statusData = [
    { name: 'To Do', value: analytics.todo, fill: CHART_COLORS.slateLight, stroke: CHART_COLORS.slate },
    { name: 'In Progress', value: analytics.inProgress, fill: CHART_COLORS.blueLight, stroke: CHART_COLORS.blue },
    { name: 'Done', value: analytics.done, fill: CHART_COLORS.emeraldLight, stroke: CHART_COLORS.emerald },
  ];

  const completionData = [
    { name: 'Completed', value: analytics.completed, fill: CHART_COLORS.brand, radius: [6, 6, 0, 0] },
    { name: 'Pending', value: analytics.pending, fill: CHART_COLORS.slateLight, radius: [6, 6, 0, 0] },
  ];

  const priorityData = [
    { name: 'Low', value: analytics.low, fill: CHART_COLORS.slate },
    { name: 'Medium', value: analytics.medium, fill: CHART_COLORS.amber },
    { name: 'High', value: analytics.high, fill: CHART_COLORS.rose },
  ];

  const noData = analytics.total === 0;

  /* ── Loading ──────────────────────────────────────── */
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

  /* ── Stat cards config ────────────────────────────── */
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
      value: analytics.total,
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
      value: analytics.completed,
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

  /* ── Render ───────────────────────────────────────── */
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

      {/* ── Row 1: Stat cards ───────────────────────── */}
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

      {/* ── Row 2: Analytics charts ─────────────────── */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Chart 1: Tasks by Status — Donut */}
        <ChartCard title="Tasks by Status">
          {noData ? (
            <ChartEmpty />
          ) : (
            <div className="flex flex-col items-center">
            <div style={{ height: '192px' }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                      strokeWidth={2}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} stroke={entry.stroke} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.stroke }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Chart 2: Completed vs Pending — Bar */}
        <ChartCard
          title="Completed vs Pending"
          headerExtra={
            !noData && (
              <span className="ml-auto text-[13px] font-semibold text-brand-600">
                {analytics.completionRate}%
              </span>
            )
          }
        >
          {noData ? (
            <ChartEmpty />
          ) : (
            <>
              {/* Completion bar */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">Completion rate</span>
                  <span className="font-semibold text-slate-700">{analytics.completionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${analytics.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Bar chart */}
              <div style={{ height: '144px' }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionData}
                    barCategoryGap="20%"
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      allowDecimals={false}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" radius={6}>
                      {completionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </ChartCard>

        {/* Chart 3: Priority Distribution — Horizontal bars */}
        <ChartCard title="Priority Distribution">
          {noData ? (
            <ChartEmpty />
          ) : (
            <div className="space-y-4">
              {priorityData.map((item) => {
                const pct = analytics.total > 0 ? Math.round((item.value / analytics.total) * 100) : 0;
                return (
                  <PriorityBar
                    key={item.name}
                    label={item.label}
                    value={item.value}
                    pct={pct}
                    color={item.fill}
                    total={analytics.total}
                  />
                );
              })}
              {/* Mini bar chart visual */}
              <div style={{ height: '112px' }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    layout="vertical"
                    barCategoryGap="25%"
                    margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      width={56}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Recent tasks ─────────────────────── */}
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

        {recentTasks.length === 0 ? (
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
                  {recentTasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <tr key={task.id} className={`transition-colors ${overdue ? 'bg-red-50/60 hover:bg-red-50/80' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={task.status} />
                            {overdue && <OverdueBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                        <td className="hidden sm:table-cell px-4 py-3 text-slate-500">
                          {task.assignee_name || <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Reusable chart sub-components
   ═══════════════════════════════════════════════════════ */

function ChartCard({ title, headerExtra, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
        {headerExtra}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-[13px] text-slate-400">No task data yet</p>
    </div>
  );
}

function PriorityBar({ label, value, pct, color, total }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium capitalize text-slate-600">{label}</span>
        <span className="text-slate-400">
          {value} <span className="text-slate-300">/ {total}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Shared badge & utility exports (used by Tasks.jsx)
   ═══════════════════════════════════════════════════════ */

export function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date + 'T00:00:00') < today;
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      Overdue
    </span>
  );
}

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
