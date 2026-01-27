@@ .. @@
 import React, { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '../lib/supabase';
+import { useAuth } from '../hooks/useAuth';
 import { Plus, X, ArrowLeft } from 'lucide-react';
 import { Link } from 'react-router-dom';

 export function CreatePollPage() {
+  const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const [title, setTitle] = useState('');
   const [options, setOptions] = useState(['', '']);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

+  // Redirect to login if not authenticated
+  if (!authLoading && !user) {
+    navigate('/login');
+    return null;
+  }
+
+  if (authLoading) {
+    return (
+      <div className="max-w-2xl mx-auto py-8 px-4">
+        <div className="animate-pulse">
+          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
+          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
+          <div className="space-y-4">
+            <div className="h-10 bg-gray-200 rounded"></div>
+            <div className="h-10 bg-gray-200 rounded"></div>
+          </div>
+        </div>
+      </div>
+    );
+  }
+
   const addOption = () => {
     setOptions([...options, '']);
   };
@@ .. @@
       const { data: poll, error: pollError } = await supabase
         .from('polls')
         .insert([
           {
             title,
+            user_id: user!.id,
           },
         ])
         .select()
         .single();
@@ .. @@
         const optionInserts = validOptions.map((option) => ({
           poll_id: poll.id,
           name: option,
+          user_id: user!.id,
         }));

         const { error: optionsError } = await supabase