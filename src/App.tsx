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
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          await supabase.auth.signOut();
          setUser(null);
        } else if (session) {
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

          if (userError || !currentUser) {
            console.error('Invalid session, signing out');
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user ?? null);
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
