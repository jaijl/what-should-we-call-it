import React, { useState } from 'react';
import { StripeProduct } from '../../stripe-config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Crown, Loader2 } from 'lucide-react';

interface SubscriptionCardProps {
  product: StripeProduct;
}

export function SubscriptionCard({ product }: SubscriptionCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
          mode: product.mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <Crown className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
      </div>
      
      <p className="text-gray-600 mb-4">{product.description}</p>
      
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </span>
        <span className="text-gray-600 ml-1">
          /{product.mode === 'subscription' ? 'month' : 'one-time'}
        </span>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading || !user}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          `Subscribe for $${product.price.toFixed(2)}/month`
        )}
      </button>

      {!user && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Please sign in to subscribe
        </p>
      )}
    </div>
  );
}