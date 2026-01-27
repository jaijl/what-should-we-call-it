import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SuccessPage } from './pages/SuccessPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { PollListPage } from './pages/PollListPage';
import { CreatePollPage } from './pages/CreatePollPage';
import { PollDetailPage } from './pages/PollDetailPage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" replace />} />
        <Route path="/success" element={user ? <SuccessPage /> : <Navigate to="/login" replace />} />
        <Route path="/subscription" element={user ? <SubscriptionPage /> : <Navigate to="/login" replace />} />
        <Route path="/" element={user ? <PollListPage /> : <Navigate to="/login" replace />} />
        <Route path="/create" element={user ? <CreatePollPage /> : <Navigate to="/login" replace />} />
        <Route path="/poll/:id" element={user ? <PollDetailPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
