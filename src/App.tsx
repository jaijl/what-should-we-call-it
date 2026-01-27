import { useState } from 'react';
import { PollList } from './components/PollList';
import { CreatePoll } from './components/CreatePoll';
import { PollView } from './components/PollView';

type View = 'list' | 'create' | 'view';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      {currentView === 'list' && (
        <PollList onCreateNew={handleCreateNew} onSelectPoll={handleSelectPoll} />
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
