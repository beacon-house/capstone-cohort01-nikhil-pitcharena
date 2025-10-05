// Signup page component for Pitch Arena
// Multi-step signup flow with role selection (entrepreneur or reviewer)

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, Lightbulb, Users } from 'lucide-react';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

export function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'entrepreneur' | 'reviewer'>('entrepreneur');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: 'entrepreneur' | 'reviewer') => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, displayName, role);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Join Pitch Arena
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Choose your role to get started
            </p>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
            <button
              onClick={() => handleRoleSelect('entrepreneur')}
              className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-700 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Lightbulb className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Entrepreneur</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Submit your pitches and get AI-powered feedback plus community validation
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('reviewer')}
              className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-700 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Reviewer</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Discover innovative pitches and provide valuable feedback to entrepreneurs
                  </p>
                </div>
              </div>
            </button>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Signing up as an{' '}
            <span className="font-semibold text-blue-700">
              {role === 'entrepreneur' ? 'Entrepreneur' : 'Reviewer'}
            </span>
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-900">
                Display name
              </label>
              <div className="mt-2">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all"
                  placeholder="Create a strong password"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
