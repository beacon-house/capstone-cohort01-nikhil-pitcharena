// Main application component for Pitch Arena
// Manages routing, authentication state, and top-level navigation

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { EntrepreneurDashboard } from './components/dashboard/EntrepreneurDashboard';
import { DiscoverFeed } from './components/discover/DiscoverFeed';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { ProfilePage } from './components/profile/ProfilePage';
import { PitchSubmissionForm } from './components/pitch/PitchSubmissionForm';
import { PitchDetailView } from './components/pitch/PitchDetailView';
import { Navigation } from './components/layout/Navigation';
import { Loader2 } from 'lucide-react';

type View = 'dashboard' | 'discover' | 'leaderboard' | 'profile';
type Modal = 'pitch-form' | 'pitch-detail' | null;

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'reviewer') {
      setCurrentView('discover');
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <SignupPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleViewPitch = (pitchId: string) => {
    setSelectedPitchId(pitchId);
    setModal('pitch-detail');
  };

  const handleCreatePitch = () => {
    setModal('pitch-form');
  };

  const handlePitchComplete = () => {
    setModal(null);
    setCurrentView('dashboard');
  };

  const handleCloseModal = () => {
    setModal(null);
    setSelectedPitchId(null);
  };

  const showCreateButton = profile?.role === 'entrepreneur' && currentView === 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:pl-64 pb-16 lg:pb-0">
        {currentView === 'dashboard' && (
          <EntrepreneurDashboard
            onCreatePitch={handleCreatePitch}
            onViewPitch={handleViewPitch}
          />
        )}

        {currentView === 'discover' && <DiscoverFeed onViewPitch={handleViewPitch} />}

        {currentView === 'leaderboard' && <Leaderboard onViewPitch={handleViewPitch} />}

        {currentView === 'profile' && <ProfilePage onClose={() => setCurrentView('dashboard')} />}
      </div>

      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        onCreatePitch={profile?.role === 'entrepreneur' ? handleCreatePitch : undefined}
        showCreateButton={showCreateButton}
      />

      {modal === 'pitch-form' && (
        <PitchSubmissionForm
          onComplete={handlePitchComplete}
          onCancel={handleCloseModal}
          onViewPitch={handleViewPitch}
        />
      )}

      {modal === 'pitch-detail' && selectedPitchId && (
        <PitchDetailView pitchId={selectedPitchId} onClose={handleCloseModal} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
