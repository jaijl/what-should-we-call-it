import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionBannerProps {
  userId: string;
}

interface UsageData {
  generationsUsed: number;
  generationsRemaining: number;
  isPremium: boolean;
}

export default function SubscriptionBanner({ userId }: SubscriptionBannerProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, [userId]);

  const loadUsageData = async () => {
    try {
      const { data: usageData } = await supabase
        .from('generation_usage')
        .select('generation_count')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('subscription_status, current_period_end')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .maybeSingle();

      const isPremium = subscriptionData !== null;
      const generationsUsed = usageData?.generation_count || 0;
      const generationsRemaining = isPremium ? -1 : Math.max(0, 2 - generationsUsed);

      setUsage({
        generationsUsed,
        generationsRemaining,
        isPremium,
      });
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please log in to upgrade');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!usage) {
    return null;
  }

  if (usage.isPremium) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-lg shadow-lg flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6" />
          <div>
            <div className="font-semibold">Premium Member</div>
            <div className="text-sm opacity-90">Unlimited AI generations</div>
          </div>
        </div>
        <Sparkles className="w-6 h-6" />
      </div>
    );
  }

  const isLimitReached = usage.generationsRemaining === 0;

  return (
    <div className={`p-4 rounded-lg shadow-lg mb-6 ${
      isLimitReached
        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold mb-1">
            {isLimitReached ? 'Free Generations Used Up' : 'Free Trial'}
          </div>
          <div className="text-sm opacity-90">
            {isLimitReached
              ? `You've used all ${usage.generationsUsed} free generations`
              : `${usage.generationsRemaining} of 2 free generations remaining`
            }
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          {isUpgrading ? 'Loading...' : 'Upgrade - $5/month'}
        </button>
      </div>
    </div>
  );
}
