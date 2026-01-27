import { useState } from 'react';
import { PollList } from './components/PollList';
import { CreatePoll } from './components/CreatePoll';
import { PollView } from './components/PollView';

type View = 'list' | 'create' | 'view';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
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
