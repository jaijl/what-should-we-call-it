import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CreatePollPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a poll title');
      return;
    }

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert([
          {
            title,
            user_id: user!.id,
          },
        ])
        .select()
        .single();

      if (pollError) throw pollError;

      if (poll) {
        const optionInserts = validOptions.map((option) => ({
          poll_id: poll.id,
          name: option,
          user_id: user!.id,
        }));

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionInserts);

        if (optionsError) throw optionsError;

        navigate(`/poll/${poll.id}`);
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Polls
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
        <p className="text-gray-600 mt-2">
          Create a poll and let others vote on your question
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Question
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="What's your question?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addOption}
            className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <Link
            to="/"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}