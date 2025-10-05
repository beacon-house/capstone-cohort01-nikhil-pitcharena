// User profile and settings page
// Allows users to view and edit their profile information and preferences

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Briefcase, LogOut, Save, Loader2 } from 'lucide-react';

interface ProfilePageProps {
  onClose: () => void;
}

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    role: profile?.role || 'entrepreneur',
  });

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      await updateProfile({
        display_name: formData.display_name,
        bio: formData.bio,
        role: formData.role as 'entrepreneur' | 'reviewer',
      });

      setSuccess(true);
      setEditing(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm">
            Profile updated successfully!
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-500 bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={!editing}
                className={`block w-full rounded-lg border-gray-300 border px-4 py-3 ${
                  editing
                    ? 'text-gray-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent'
                    : 'text-gray-500 bg-gray-50'
                } outline-none transition-all`}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 mr-2" />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!editing}
                className={`block w-full rounded-lg border-gray-300 border px-4 py-3 ${
                  editing
                    ? 'text-gray-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent'
                    : 'text-gray-500 bg-gray-50'
                } outline-none transition-all`}
              >
                <option value="entrepreneur">Entrepreneur</option>
                <option value="reviewer">Reviewer</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Your role determines your default dashboard view
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                rows={4}
                className={`block w-full rounded-lg border-gray-300 border px-4 py-3 ${
                  editing
                    ? 'text-gray-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent'
                    : 'text-gray-500 bg-gray-50'
                } outline-none transition-all resize-none`}
                placeholder="Tell others about yourself..."
              />
            </div>

            {editing && (
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      display_name: profile?.display_name || '',
                      bio: profile?.bio || '',
                      role: profile?.role || 'entrepreneur',
                    });
                  }}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
