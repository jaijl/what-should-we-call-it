import { useState, useEffect } from 'react';
import { ArrowLeft, User, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Poll, Option, Vote } from '../types';

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
  const [hasVoted, setHasVoted] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    loadPollData();
    subscribeToVotes();
  }, [pollId]);

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
        supabase.from('polls').select('*').eq('id', pollId).single(),
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
    } catch (error) {
      console.error('Error loading poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;

    try {
      const { error } = await supabase.from('votes').insert({
        poll_id: pollId,
        option_id: optionId,
        voter_name: voterName.trim() || null
      });

      if (error) throw error;

      setHasVoted(true);
      setShowNameInput(false);
      loadPollData();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to record vote. Please try again.');
    }
  };

  const initiateVote = (optionId: string) => {
    setSelectedOption(optionId);
    setShowNameInput(true);
  };

  const submitVote = () => {
    if (selectedOption) {
      handleVote(selectedOption);
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
          <h1 className="text-2xl font-bold text-white mb-2">{poll.title}</h1>
          <div className="flex items-center gap-2 text-blue-100">
            <Users className="w-4 h-4" />
            <span className="text-sm">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </div>
        </div>

        <div className="p-8">
          {!hasVoted && !showNameInput && (
            <div className="space-y-3 mb-8">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => initiateVote(option.id)}
                  className="w-full text-left px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">
                    {option.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showNameInput && !hasVoted && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Add your name (optional)
              </label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Leave blank to vote anonymously"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                onKeyDown={(e) => e.key === 'Enter' && submitVote()}
              />
              <div className="flex gap-3">
                <button
                  onClick={submitVote}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Submit Vote
                </button>
                <button
                  onClick={() => {
                    setShowNameInput(false);
                    setSelectedOption(null);
                    setVoterName('');
                  }}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {hasVoted && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center text-green-800 font-medium">
              Thanks for voting!
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
            {options.map((option) => {
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{option.name}</span>
                    <span className="text-sm text-gray-600">
                      {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
