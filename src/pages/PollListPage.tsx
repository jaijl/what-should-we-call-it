@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { Link } from 'react-router-dom';
 import { supabase } from '../lib/supabase';
+import { useAuth } from '../hooks/useAuth';
 import { Calendar, Users, BarChart3 } from 'lucide-react';

 interface Poll {
@@ .. @@
 }

 export function PollListPage() {
+  const { user, loading: authLoading } = useAuth();
   const [polls, setPolls] = useState<Poll[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
-    fetchPolls();
-  }, []);
+    if (!authLoading) {
+      if (user) {
+        fetchPolls();
+      } else {
+        setLoading(false);
+      }
+    }
+  }, [user, authLoading]);

   const fetchPolls = async () => {
@@ .. @@
     }
   };

+  if (authLoading) {
+    return (
+      <div className="max-w-6xl mx-auto py-8 px-4">
+        <div className="animate-pulse">
+          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
+          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
+            {[...Array(6)].map((_, i) => (
+              <div key={i} className="bg-white rounded-lg shadow-md p-6">
+                <div className="h-6 bg-gray-200 rounded mb-4"></div>
+                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
+                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
+              </div>
+            ))}
+          </div>
+        </div>
+      </div>
+    );
+  }
+
+  if (!user) {
+    return (
+      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
+        <h1 className="text-4xl font-bold text-gray-900 mb-4">
+          Welcome to PollMaster
+        </h1>
+        <p className="text-xl text-gray-600 mb-8">
+          Create and participate in polls with your team
+        </p>
+        <div className="space-x-4">
+          <Link
+            to="/signup"
+            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
+          >
+            Get Started
+          </Link>
+          <Link
+            to="/login"
+            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
+          >
+            Sign In
+          </Link>
+        </div>
+      </div>
+    );
+  }
+
   if (loading) {
     return (
       <div className="max-w-6xl mx-auto py-8 px-4">