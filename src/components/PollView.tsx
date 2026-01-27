import { useState, useEffect } from 'react';
import { ArrowLeft, User, Users, Trash2, Plus, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Poll, Option, Vote } from '../types';

interface PollViewProps {
  pollId: string;
  onBack: () => void;
}

interface OptionWithVotes extends Option {
  voteCount: number;
  votes: Vote[];
}

export function PollView({ pollId, onBack }: PollViewProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<OptionWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadUserProfile();
    loadPollData();
    subscribeToVotes();
  }, [pollId]);

  useEffect(() => {
    if (poll && currentUserId) {
      setIsOwner(poll.user_id === currentUserId);
    }
  }, [poll, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadPollData();
    }
  }, [currentUserId]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserName(profile.name);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`poll-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`
        },
        () => {
          loadPollData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadPollData = async () => {
    try {
      const [pollResponse, optionsResponse, votesResponse] = await Promise.all([
        supabase.from('polls').select('*').eq('id', pollId).maybeSingle(),
        supabase.from('options').select('*').eq('poll_id', pollId),
        supabase.from('votes').select('*').eq('poll_id', pollId)
      ]);

      if (pollResponse.error) throw pollResponse.error;
      if (optionsResponse.error) throw optionsResponse.error;
      if (votesResponse.error) throw votesResponse.error;

      setPoll(pollResponse.data);

      const optionsWithVotes: OptionWithVotes[] = optionsResponse.data.map(option => ({
        ...option,
        voteCount: votesResponse.data.filter(v => v.option_id === option.id).length,
        votes: votesResponse.data.filter(v => v.option_id === option.id)
      }));

      setOptions(optionsWithVotes.sort((a, b) => b.voteCount - a.voteCount));

      if (currentUserId) {
        const userVotes = votesResponse.data
          .filter(v => v.user_id === currentUserId)
          .map(v => v.option_id);
        setMyVotes(userVotes);
      }
    } catch (error) {
      console.error('Error loading poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    const isAlreadyVoted = myVotes.includes(optionId);

    if (isAlreadyVoted) {
      try {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('option_id', optionId)
          .eq('user_id', currentUserId);

        if (error) throw error;

        setMyVotes(myVotes.filter(id => id !== optionId));
        loadPollData();
      } catch (error) {
        console.error('Error removing vote:', error);
        alert('Failed to remove vote. Please try again.');
      }
    } else {
      if (myVotes.length >= 3) {
        alert('You can only vote for up to 3 options.');
        return;
      }

      try {
        const { error } = await supabase.from('votes').insert({
          poll_id: pollId,
          option_id: optionId,
          voter_name: userName || null
        });

        if (error) throw error;

        setMyVotes([...myVotes, optionId]);
        loadPollData();
      } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to record vote. Please try again.');
      }
    }
  };

  const handleAddOption = async () => {
    if (!isOwner) {
      alert('Only the poll creator can add options.');
      return;
    }
    if (!newOptionName.trim()) return;

    try {
      const { error } = await supabase
        .from('options')
        .insert({
          poll_id: pollId,
          name: newOptionName.trim()
        });

      if (error) throw error;

      setNewOptionName('');
      loadPollData();
    } catch (error) {
      console.error('Error adding option:', error);
      alert('Failed to add option. You can only add options to polls you created.');
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!isOwner) {
      alert('Only the poll creator can delete options.');
      return;
    }
    if (!confirm('Are you sure you want to delete this option?')) return;

    try {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      loadPollData();
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Failed to delete option. You can only delete options from polls you created.');
    }
  };

  const handleDeletePoll = async () => {
    if (!isOwner) {
      alert('Only the poll creator can delete this poll.');
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      onBack();
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll. You can only delete polls you created.');
    }
  };

  const startEditingTitle = () => {
    if (!isOwner) {
      alert('Only the poll creator can edit this poll.');
      return;
    }
    if (poll) {
      setEditTitle(poll.title);
      setIsEditingTitle(true);
    }
  };

  const handleUpdateTitle = async () => {
    if (!isOwner) {
      alert('Only the poll creator can edit this poll.');
      return;
    }
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('polls')
        .update({ title: editTitle.trim() })
        .eq('id', pollId);

      if (error) throw error;

      setIsEditingTitle(false);
      setEditTitle('');
      loadPollData();
    } catch (error) {
      console.error('Error updating poll title:', error);
      alert('Failed to update poll title. You can only edit polls you created.');
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center text-gray-500">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center text-gray-500">Poll not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to polls
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
          {isEditingTitle ? (
            <div className="mb-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                  autoFocus
                />
                <button
                  onClick={handleUpdateTitle}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditTitle('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white border border-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold text-white flex-1">{poll.title}</h1>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={startEditingTitle}
                    className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors"
                    title="Edit title"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-white hover:bg-red-600 rounded-lg transition-colors"
                    title="Delete poll"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-blue-100">
            <Users className="w-4 h-4" />
            <span className="text-sm">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-3 mb-8">
            {myVotes.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-800 font-medium">
                You've voted for {myVotes.length} {myVotes.length === 1 ? 'option' : 'options'} (max 3)
              </div>
            )}
            {options.map((option) => {
              const isVoted = myVotes.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  className={`w-full text-left px-6 py-4 border-2 rounded-xl transition-all group ${
                    isVoted
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className={`font-medium ${isVoted ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'}`}>
                    {option.name}
                    {isVoted && <span className="ml-2 text-sm">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>
            </div>

            {options.map((option) => {
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;

              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center gap-3">
                    <span className="font-medium text-gray-900">{option.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {option.votes.filter(v => v.voter_name).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {option.votes
                        .filter(v => v.voter_name)
                        .map((vote, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            <User className="w-3 h-3" />
                            {vote.voter_name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isOwner && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="Add new option..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <button
                    onClick={handleAddOption}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-xl font-bold">Delete Poll?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete the poll and all its votes. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeletePoll}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
