import { useEffect, useState, memo } from 'react';
import { Plus, MessageCircle, TrendingUp, Trash2, Crown } from 'lucide-react';
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

export const PollList = memo(function PollList({ onCreateNew, onSelectPoll }: PollListProps) {
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pollsCreated, setPollsCreated] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');

  useEffect(() => {
    loadCurrentUser();
    loadPolls();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('polls_created, subscription_status')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setPollsCreated(profile.polls_created || 0);
          setSubscriptionStatus(profile.subscription_status || 'free');
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('poll_list_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      const pollsWithStats = pollsData.map((poll) => ({
        id: poll.id,
        title: poll.title,
        user_id: poll.user_id,
        created_at: poll.created_at,
        updated_at: poll.updated_at,
        optionCount: poll.option_count,
        voteCount: poll.total_votes
      }));

      setPolls(pollsWithStats);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (e: React.MouseEvent, pollId: string, userId: string | null) => {
    e.stopPropagation();

    if (userId !== currentUserId) {
      alert('Only the poll creator can delete this poll.');
      return;
    }

    if (!confirm('Delete this poll?')) return;

    try {
      const { error } = await supabase.from('polls').delete().eq('id', pollId);

      if (error) throw error;

      loadPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll. You can only delete polls you created.');
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

      {subscriptionStatus === 'active' ? (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Premium Member</div>
              <div className="text-sm text-gray-600">Create unlimited polls</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">
                {pollsCreated}/2 Free Polls Used
              </div>
              <div className="text-sm text-gray-600">Upgrade for unlimited polls</div>
            </div>
            {pollsCreated >= 2 && (
              <button
                onClick={onCreateNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      )}

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
            <div
              key={poll.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 transition-all border border-gray-100 hover:border-blue-200 group"
            >
              <div className="flex justify-between items-start mb-3">
                <button
                  onClick={() => onSelectPoll(poll.id)}
                  className="flex-1 text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
                </button>
                {poll.user_id === currentUserId && (
                  <button
                    onClick={(e) => handleDeletePoll(e, poll.id, poll.user_id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete poll"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => onSelectPoll(poll.id)}
                className="w-full text-left"
              >
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
