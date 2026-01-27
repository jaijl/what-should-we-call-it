import { useState, memo } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreatePollProps {
  onPollCreated: (pollId: string) => void;
  onCancel: () => void;
}

export const CreatePoll = memo(function CreatePoll({ onPollCreated, onCancel }: CreatePollProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!title.trim() || options.filter(o => o.trim()).length < 2) {
      alert('Please provide a title and at least 2 options');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to create a poll');
        return;
      }

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: title.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const validOptions = options.filter(o => o.trim());
      const { error: optionsError } = await supabase
        .from('options')
        .insert(
          validOptions.map(name => ({
            poll_id: poll.id,
            name: name.trim(),
            user_id: user.id
          }))
        );

      if (optionsError) throw optionsError;

      onPollCreated(poll.id);
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create a Naming Poll</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              What needs a name?
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New internal tool name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name options
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another option
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
