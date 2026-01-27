import React from 'react';
import { stripeProducts } from '../stripe-config';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function SubscriptionPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Link>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="mt-2 text-gray-600">
                Choose the plan that works best for you
              </p>
            </div>
            
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Plan:</p>
                <SubscriptionStatus />
              </div>
            )}
          </div>
        </div>

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
            <p className="text-blue-800">
              Please{' '}
              <Link to="/login" className="font-medium underline">
                sign in
              </Link>{' '}
              or{' '}
              <Link to="/signup" className="font-medium underline">
                create an account
              </Link>{' '}
              to subscribe to a plan.
            </p>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stripeProducts.map((product) => (
            <SubscriptionCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}