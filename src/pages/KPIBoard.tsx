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
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </Header>

      <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-fade-in">
        {/* Overview KPIs - Large Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overview Metrics</h2>
            <button
              onClick={() => handleOpenCreate('overview')}
              className="btn-secondary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add KPI
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpisByCategory.overview.map((kpi) => (
              <OverviewKPICard key={kpi.id} kpi={kpi} onUpdate={updateKPI} onDelete={deleteKPI} />
            ))}
          </div>
        </div>

        {/* Role-specific KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['vendor_ops', 'rider_fleet', 'customer_service'] as const).map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                  {categoryLabels[category]}
                </h3>
                <button
                  onClick={() => handleOpenCreate(category)}
                  className="text-slate-400 hover:text-primary-500 transition-colors"
                  title="Add KPI"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 flex-1">
                {kpisByCategory[category].map((kpi) => (
                  <RoleKPIRow key={kpi.id} kpi={kpi} onUpdate={updateKPI} onDelete={deleteKPI} />
                ))}
                {kpisByCategory[category].length === 0 && (
                  <div className="text-center py-8 text-sm text-slate-400">
                    No KPIs yet. Click + to add one.
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
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add KPI to {categoryLabels[category]}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              KPI Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Response Rate"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 95% or 120"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {category === 'overview' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Icon (optional)
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select icon...</option>
                <option value="Package">Package</option>
                <option value="Users">Users</option>
                <option value="Clock">Clock</option>
                <option value="Star">Star</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
  const [showMenu, setShowMenu] = useState(false);

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
    if (confirm(`Delete "${kpi.name}"?`)) {
      await onDelete(kpi.id);
    }
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 group relative">
      {/* Menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        {change && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${trend === 'up'
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
              : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'
            }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mb-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full text-3xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-primary-300 dark:border-primary-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex items-center gap-2 mt-2">
            <button onClick={handleSave} disabled={saving} className="p-1.5 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={handleCancel} className="p-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer group/value">
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{kpi.value}</h3>
            <Pencil className="w-4 h-4 text-slate-400 opacity-0 group-hover/value:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{kpi.name}</p>
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
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors group">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors flex-1">
        {kpi.name}
      </span>

      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-24 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-primary-300 dark:border-primary-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
          />
          <button onClick={handleSave} disabled={saving} className="p-1 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={handleCancel} className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-slate-900 dark:text-white tabular-nums tracking-tight cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 group/value"
          >
            {kpi.value}
            <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/value:opacity-100 transition-opacity" />
          </span>
          <button
            onClick={handleDelete}
            className="p-1 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
