import { useState } from 'react';
import { Header } from '../components/layout';
import { useKPIs, calculateChange } from '../hooks';
import type { KPI, KPICategory } from '../hooks';
import { TrendingUp, TrendingDown, Users, Package, Clock, Star, Loader2, RefreshCw, Check, X, Pencil, Plus, Trash2, AlertCircle } from 'lucide-react';

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Users,
  Clock,
  Star,
};

const categoryLabels: Record<string, string> = {
  overview: 'Overview',
  vendor_ops: 'Vendor Ops',
  rider_fleet: 'Rider Fleet',
  customer_service: 'Customer Service',
};

export function KPIBoard() {
  const { kpisByCategory, loading, createKPI, updateKPI, deleteKPI, refetch } = useKPIs();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCategory, setCreateCategory] = useState<KPICategory>('vendor_ops');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleOpenCreate = (category: KPICategory) => {
    setCreateCategory(category);
    setShowCreateModal(true);
  };

  const handleCreateKPI = async (name: string, value: string, icon?: string) => {
    const result = await createKPI(name, value, createCategory, icon);
    if (result.success) {
      setShowCreateModal(false);
    }
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Role KPI Board">
        <button
          onClick={handleRefresh}
          className="ml-4 p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh KPIs"
        >
          <RefreshCw strokeWidth={1.5} className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </Header>

      <div className="p-6 md:p-8 space-y-10 max-w-[1400px] mx-auto animate-fade-in">
        {/* Overview KPIs - Large Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Overview Metrics</h2>
            <button
              onClick={() => handleOpenCreate('overview')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-md text-[12px] font-bold transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 group"
            >
              <Plus strokeWidth={1.5} className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              Add KPI
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpisByCategory.overview.map((kpi) => (
              <OverviewKPICard key={kpi.id} kpi={kpi} onUpdate={updateKPI} onDelete={deleteKPI} />
            ))}
          </div>
        </div>

        {/* Role-specific KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(['vendor_ops', 'rider_fleet', 'customer_service'] as const).map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-[#000000] rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden flex flex-col group/category transition-all hover:border-slate-300 dark:hover:border-white/10"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="w-1 h-3.5 bg-primary-500 rounded-full" />
                  {categoryLabels[category]}
                </h3>
                <button
                  onClick={() => handleOpenCreate(category)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all opacity-0 group-hover/category:opacity-100"
                  title="Add KPI"
                >
                  <Plus strokeWidth={1.5} className="w-4 h-4" />
                </button>
              </div>
              <div className="p-1 flex-1">
                {kpisByCategory[category].map((kpi) => (
                  <RoleKPIRow key={kpi.id} kpi={kpi} onUpdate={updateKPI} onDelete={deleteKPI} />
                ))}
                {kpisByCategory[category].length === 0 && (
                  <div className="text-center py-10 px-4">
                    <AlertCircle strokeWidth={1.5} className="w-8 h-8 text-slate-100 dark:text-white/5 mx-auto mb-3" />
                    <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                      No KPIs yet. Click + to add one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create KPI Modal */}
      {showCreateModal && (
        <CreateKPIModal
          category={createCategory}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKPI}
        />
      )}
    </div>
  );
}

// Create KPI Modal
interface CreateKPIModalProps {
  category: KPICategory;
  onClose: () => void;
  onCreate: (name: string, value: string, icon?: string) => Promise<{ success: boolean; error?: string }>;
}

function CreateKPIModal({ category, onClose, onCreate }: CreateKPIModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) {
      setError('Name and value are required');
      return;
    }

    setLoading(true);
    setError('');
    const result = await onCreate(name.trim(), value.trim(), icon.trim() || undefined);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create KPI');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#111111] rounded-xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              New KPI
            </h2>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Add a new metric to {categoryLabels[category]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
              KPI Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Response Rate"
              className="w-full px-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
              Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 95% or 120"
              className="w-full px-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
            />
          </div>

          {category === 'overview' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">Select icon...</option>
                <option value="Package">📦 Package</option>
                <option value="Users">👥 Users</option>
                <option value="Clock">🕒 Clock</option>
                <option value="Star">⭐ Star</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !value.trim()}
              className="px-5 py-2 text-sm font-bold bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <Plus strokeWidth={1.5} className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OverviewKPICardProps {
  kpi: KPI;
  onUpdate: (id: string, value: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function OverviewKPICard({ kpi, onUpdate, onDelete }: OverviewKPICardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(kpi.value);
  const [saving, setSaving] = useState(false);

  const Icon = kpi.icon ? iconMap[kpi.icon] || Package : Package;
  const { change, trend } = calculateChange(kpi.value, kpi.previous_value);

  const handleSave = async () => {
    if (editValue.trim() === kpi.value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const result = await onUpdate(kpi.id, editValue.trim());
    setSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(kpi.value);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${kpi.name}"?`)) {
      await onDelete(kpi.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="bg-white dark:bg-[#080808] rounded-xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

      {/* Menu */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
          title="Delete KPI"
        >
          <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center group-hover:border-primary-500/30 transition-all duration-300">
          <Icon strokeWidth={1.5} className="w-5 h-5 text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors" />
        </div>
        {change && (
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${trend === 'up'
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-100 dark:border-emerald-400/20'
              : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-100 dark:border-rose-400/20'
              }`}>
              {trend === 'up' ? (
                <TrendingUp strokeWidth={1.5} className="w-3 h-3" />
              ) : (
                <TrendingDown strokeWidth={1.5} className="w-3 h-3" />
              )}
              {change}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-2xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-black border border-primary-500/50 rounded-lg px-2 py-1 focus:outline-none transition-all"
            />
            <div className="flex items-center gap-1.5">
              <button onClick={handleSave} disabled={saving} className="p-1 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
                {saving ? <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" /> : <Check strokeWidth={1.5} className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleCancel} className="p-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="cursor-pointer group/value inline-block">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-primary-500 transition-colors">{kpi.value}</h3>
              <Pencil strokeWidth={1.5} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover/value:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
        <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{kpi.name}</p>
      </div>
    </div>
  );
}

interface RoleKPIRowProps {
  kpi: KPI;
  onUpdate: (id: string, value: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function RoleKPIRow({ kpi, onUpdate, onDelete }: RoleKPIRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(kpi.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === kpi.value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const result = await onUpdate(kpi.id, editValue.trim());
    setSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(kpi.value);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${kpi.name}"?`)) {
      await onDelete(kpi.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded-lg transition-all group">
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-bold text-slate-500 dark:text-[#999999] group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate uppercase tracking-tight">
          {kpi.name}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-20 text-[13px] font-bold text-slate-900 dark:text-white bg-white dark:bg-black border border-primary-500/50 rounded px-2 py-1 focus:outline-none text-right"
            />
            <button onClick={handleSave} disabled={saving} className="p-1 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
              {saving ? <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> : <Check strokeWidth={1.5} className="w-3 h-3" />}
            </button>
            <button onClick={handleCancel} className="p-1 rounded bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              onClick={() => setIsEditing(true)}
              className="flex flex-col items-end cursor-pointer group/value"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {kpi.value}
                </span>
                <Pencil strokeWidth={1.5} className="w-3 h-3 text-slate-400 opacity-0 group-hover/value:opacity-100 transition-opacity" />
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="p-1 px-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
              <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
