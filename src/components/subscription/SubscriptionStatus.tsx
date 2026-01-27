import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getProductByPriceId } from '../../stripe-config';
import { Crown, Loader2 } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

export function SubscriptionStatus() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading subscription...
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="text-sm text-gray-600">
        Free Plan
      </div>
    );
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = subscription.subscription_status === 'active';
  const isPastDue = subscription.subscription_status === 'past_due';
  const isCanceled = subscription.subscription_status === 'canceled';

  const getStatusColor = () => {
    if (isActive) return 'text-green-600';
    if (isPastDue) return 'text-yellow-600';
    if (isCanceled) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (isActive && subscription.cancel_at_period_end) {
      return 'Canceling';
    }
    if (isActive) return 'Active';
    if (isPastDue) return 'Past Due';
    if (isCanceled) return 'Canceled';
    return subscription.subscription_status;
  };

  return (
    <div className="flex items-center text-sm">
      {isActive && <Crown className="h-4 w-4 text-yellow-500 mr-2" />}
      <span className={getStatusColor()}>
        {product?.name || 'Premium'} - {getStatusText()}
      </span>
    </div>
  );
}