import { useEffect, useState } from 'react';
import { Plus, MessageCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Poll } from '../types';

interface PollListProps {
  onCreateNew: () => void;
  onSelectPoll: (pollId: string) => void;
}

interface PollWithStats extends Poll {
  optionCount: number;
  voteCount: number;
}

export function PollList({ onCreateNew, onSelectPoll }: PollListProps) {
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      const pollsWithStats = await Promise.all(
        pollsData.map(async (poll) => {
          const [optionsResponse, votesResponse] = await Promise.all([
            supabase.from('options').select('id').eq('poll_id', poll.id),
            supabase.from('votes').select('id').eq('poll_id', poll.id)
          ]);

          return {
            ...poll,
            optionCount: optionsResponse.data?.length || 0,
            voteCount: votesResponse.data?.length || 0
          };
        })
      );

      setPolls(pollsWithStats);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-500">Loading polls...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What Should We Call It?</h1>
          <p className="text-gray-600">Team naming polls made easy</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          New Poll
        </button>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-600 mb-6">Create your first naming poll to get started</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Poll
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <button
              key={poll.id}
              onClick={() => onSelectPoll(poll.id)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 text-left transition-all border border-gray-100 hover:border-blue-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{poll.title}</h3>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{poll.optionCount} options</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{poll.voteCount} votes</span>
                </div>
                <div className="ml-auto text-xs text-gray-500">
                  {new Date(poll.created_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
