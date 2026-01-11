import { useState } from 'react';
import { Header } from '../components/layout';
import {
    User, Bell, Palette, Mail, Loader2, Check,
    Moon, Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEmailPreferences } from '../hooks/useEmailPreferences';

type SettingsTab = 'profile' | 'notifications' | 'appearance';

export function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const { profile } = useAuth();
    const { theme, setTheme } = useTheme();
    const {
        preferences,
        loading: prefsLoading,
        saving,
        togglePreference
    } = useEmailPreferences();

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    ];

    const notificationSettings = [
        { key: 'task_assigned' as const, label: 'Task Assigned', description: 'When someone assigns a task to you' },
        { key: 'task_due_soon' as const, label: 'Due Date Reminder', description: '24 hours before a task is due' },
        { key: 'task_completed' as const, label: 'Task Completed', description: 'When an assigned task is completed' },
        { key: 'task_comment' as const, label: 'New Comments', description: 'When someone comments on your tasks' },
        { key: 'daily_digest' as const, label: 'Daily Digest', description: 'Daily summary of your tasks' },
        { key: 'weekly_summary' as const, label: 'Weekly Summary', description: 'Weekly task and goal report' },
    ];

    const themeOptions: Array<{ value: 'light' | 'dark'; label: string; icon: typeof Sun }> = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
    ];

    return (
        <div className="min-h-screen pb-20">
            <Header title="Settings" />

            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Information</h3>
                            <p className="text-sm text-slate-500">Your account details</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || profile?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {profile?.full_name || 'User'}
                                    </p>
                                    <p className="text-sm text-slate-500">{profile?.role || 'Team Member'}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{profile?.email || 'Not set'}</span>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={profile?.full_name || ''}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Your full name"
                                    disabled
                                />
                                <p className="text-xs text-slate-400 mt-1">Contact admin to update your name</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Notifications</h3>
                            <p className="text-sm text-slate-500">Choose what emails you receive</p>
                        </div>

                        {prefsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {notificationSettings.map(setting => (
                                    <div key={setting.key} className="flex items-center justify-between px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{setting.label}</p>
                                            <p className="text-xs text-slate-500">{setting.description}</p>
                                        </div>
                                        <button
                                            onClick={() => togglePreference(setting.key)}
                                            disabled={saving}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${preferences[setting.key]
                                                ? 'bg-primary-500'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                                } ${saving ? 'opacity-50' : ''}`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences[setting.key] ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
                            <p className="text-sm text-slate-500">Customize how the app looks</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Theme
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {themeOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === option.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === option.value
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                            }`}>
                                            <option.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-sm font-medium ${theme === option.value
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {option.label}
                                        </span>
                                        {theme === option.value && (
                                            <Check className="w-4 h-4 text-primary-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
