import { Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

interface SubscriptionGateProps {
  pollsCreated: number;
  onCancel: () => void;
}

export function SubscriptionGate({ pollsCreated, onCancel }: SubscriptionGateProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please sign in to upgrade');
        return;
      }

      // const response = await fetch(
      //   `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${session.access_token}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      const { data, error } = await supabase.functions.invoke(
        'stripe-checkout',
        {
          body: { priceId },
        }
      )
      
      if (error) throw error

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Crown className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          You've reached your free limit
        </h2>

        <p className="text-lg text-gray-600 mb-6">
          You've created {pollsCreated} polls. Upgrade to create unlimited polls!
        </p>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            $9.99<span className="text-xl text-gray-600 font-normal">/month</span>
          </div>
          <div className="text-gray-600">Unlimited Polls</div>
        </div>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Create unlimited naming polls</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Share with unlimited voters</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Cancel anytime</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Loading...' : 'Upgrade Now'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-4 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
