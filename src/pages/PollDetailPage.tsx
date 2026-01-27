import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Plus, CreditCard as Edit2, Trash2, Users } from 'lucide-react';

interface PollData {
  poll_id: string;
  poll_title: string;
  poll_description: string | null;
  poll_user_id: string;
  poll_created_at: string;
  poll_updated_at: string;
  option_id: string | null;
  option_name: string | null;
  option_created_at: string | null;
  option_user_id: string | null;
  vote_count: number;
}

interface Option {
  id: string;
  name: string;
  created_at: string;
  user_id: string | null;
  vote_count: number;
  hasVoted: boolean;
}

export function PollDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [addingOption, setAddingOption] = useState(false);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    if (id && user) {
      fetchPollDetails();
    }
  }, [id, user]);

  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          user_id,
          created_at,
          updated_at,
          options (
            id,
            name,
            created_at,
            user_id
          )
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;

      if (data) {
        setPoll(data);
        
        // Get vote counts for each option
        const { data: voteCounts } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', data.id);

        const voteCountMap = new Map<string, number>();
        voteCounts?.forEach((vote) => {
          voteCountMap.set(vote.option_id, (voteCountMap.get(vote.option_id) || 0) + 1);
        });

        // Check which options the user has voted for
        const { data: userVotes } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', data.id)
          .eq('user_id', user!.id);

        const userVoteSet = new Set(userVotes?.map(v => v.option_id) || []);

        const optionsWithVotes = data.options.map((option: any) => ({
          ...option,
          vote_count: voteCountMap.get(option.id) || 0,
          hasVoted: userVoteSet.has(option.id),
        }));

        setOptions(optionsWithVotes);
      }
    } catch (error) {
      console.error('Error fetching poll details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!poll || voting) return;

    try {
      setVoting(optionId);
      
      const { error } = await supabase
        .from('votes')
        .insert([
          {
            poll_id: poll.id,
            option_id: optionId,
            user_id: user!.id,
          },
        ]);

      if (error) throw error;

      await fetchPollDetails();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(null);
    }
  };

  const handleUnvote = async (optionId: string) => {
    if (!poll || voting) return;

    try {
      setVoting(optionId);
      
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('option_id', optionId)
        .eq('user_id', user!.id);

      if (error) throw error;

      await fetchPollDetails();
    } catch (error) {
      console.error('Error removing vote:', error);
    } finally {
      setVoting(null);
    }
  };

  const handleAddOption = async () => {
    if (!poll || !newOption.trim() || addingOption) return;

    try {
      setAddingOption(true);
      
      const { error } = await supabase
        .from('options')
        .insert([
          {
            poll_id: poll.id,
            name: newOption.trim(),
            user_id: user!.id,
          },
        ]);

      if (error) throw error;

      setNewOption('');
      await fetchPollDetails();
    } catch (error) {
      console.error('Error adding option:', error);
    } finally {
      setAddingOption(false);
    }
  };

  const canEditOption = (option: Option) => {
    return user && option.user_id === user.id;
  };

  const canEditPoll = () => {
    return user && poll && poll.user_id === user.id;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Poll not found</h2>
          <Link
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to polls
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = options.reduce((sum, option) => sum + option.vote_count, 0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to polls
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
            {poll.description && (
              <p className="text-gray-600 mb-4">{poll.description}</p>
            )}
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
              <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {canEditPoll() && (
            <Link
              to={`/polls/${poll.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Poll
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Options</h2>
          
          {options.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No options available yet.</p>
          ) : (
            <div className="space-y-4">
              {options.map((option) => {
                const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
                
                return (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.name}</span>
                      <div className="flex items-center space-x-2">
                        {canEditOption(option) && (
                          <>
                            <button
                              onClick={() => handleEditOption(option.id, option.name)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                              title="Edit option"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOption(option.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>{option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {option.hasVoted ? (
                        <button
                          onClick={() => handleUnvote(option.id)}
                          disabled={voting === option.id}
                          className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {voting === option.id ? 'Removing vote...' : 'Remove Vote'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVote(option.id)}
                          disabled={voting === option.id}
                          className="w-full px-4 py-2 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {voting === option.id ? 'Voting...' : 'Vote'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Option</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Enter new option"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <button
                onClick={handleAddOption}
                disabled={!newOption.trim() || addingOption}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingOption ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}