import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { PollList } from './components/PollList';
import { CreatePoll } from './components/CreatePoll';
import { PollView } from './components/PollView';
import { LogOut } from 'lucide-react';

type View = 'list' | 'create' | 'view';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handlePollCreated = (pollId: string) => {
    setSelectedPollId(pollId);
    setCurrentView('view');
  };

  const handleSelectPoll = (pollId: string) => {
    setSelectedPollId(pollId);
    setCurrentView('view');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPollId(null);
    setListKey(prev => prev + 1);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto mb-6 flex justify-end">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {currentView === 'list' && (
        <PollList key={listKey} onCreateNew={handleCreateNew} onSelectPoll={handleSelectPoll} />
      )}
      {currentView === 'create' && (
        <CreatePoll onPollCreated={handlePollCreated} onCancel={handleBackToList} />
      )}
      {currentView === 'view' && selectedPollId && (
        <PollView pollId={selectedPollId} onBack={handleBackToList} />
      )}
    </div>
  );
}

export default App;
