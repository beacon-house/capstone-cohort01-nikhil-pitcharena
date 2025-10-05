// Responsive navigation component
// Bottom navigation for mobile, sidebar for tablet and desktop

import { Home, Compass, Trophy, User, Plus } from 'lucide-react';

interface NavigationProps {
  currentView: 'dashboard' | 'discover' | 'leaderboard' | 'profile';
  onNavigate: (view: 'dashboard' | 'discover' | 'leaderboard' | 'profile') => void;
  onCreatePitch?: () => void;
  showCreateButton?: boolean;
}

export function Navigation({ currentView, onNavigate, onCreatePitch, showCreateButton = false }: NavigationProps) {
  const navItems = [
    { id: 'dashboard' as const, label: 'My Pitches', icon: Home },
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
        <div className="flex flex-col w-full p-4">
          <div className="mb-8 px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pitch Arena</h1>
                <p className="text-xs text-gray-600">Get feedback, grow faster</p>
              </div>
            </div>
          </div>

          {showCreateButton && onCreatePitch && (
            <button
              onClick={onCreatePitch}
              className="mb-6 flex items-center justify-center space-x-2 w-full bg-blue-700 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-800 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Pitch</span>
            </button>
          )}

          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-blue-700 bg-blue-50 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {showCreateButton && onCreatePitch && (
        <button
          onClick={onCreatePitch}
          className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 transition-all z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
