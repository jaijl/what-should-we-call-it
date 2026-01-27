@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { useParams, useNavigate, Link } from 'react-router-dom';
 import { supabase } from '../lib/supabase';
+import { useAuth } from '../hooks/useAuth';
 import { ArrowLeft, Plus, Edit2, Trash2, Users } from 'lucide-react';

 interface PollData {
@@ .. @@
   poll_updated_at: string;
   option_id: string | null;
   option_name: string | null;
   option_created_at: string | null;
+  option_user_id: string | null;
   vote_count: number;
 }

 interface Option {
   id: string;
   name: string;
   created_at: string;
+  user_id: string | null;
   vote_count: number;
   hasVoted: boolean;
 }

 export function PollDetailPage() {
+  const { user, loading: authLoading } = useAuth();
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [poll, setPoll] = useState<Poll | null>(null);
@@ .. @@
   const [newOption, setNewOption] = useState('');
   const [addingOption, setAddingOption] = useState(false);

+  // Redirect to login if not authenticated
+  if (!authLoading && !user) {
+    navigate('/login');
+    return null;
+  }
+
   useEffect(() => {
-    if (id) {
+    if (id && user) {
       fetchPollDetails();
     }
-  }, [id]);
+  }, [id, user]);

   const fetchPollDetails = async () => {
@@ .. @@
         const optionsMap = new Map<string, Option>();
         
         data.forEach((row) => {
           if (row.option_id && row.option_name) {
             if (!optionsMap.has(row.option_id)) {
               optionsMap.set(row.option_id, {
                 id: row.option_id,
                 name: row.option_name,
                 created_at: row.option_created_at!,
+                user_id: row.option_user_id,
                 vote_count: 0,
                 hasVoted: false,
               });
@@ .. @@
         // Check which options the user has voted for
         if (poll) {
           const { data: userVotes } = await supabase
             .from('votes')
             .select('option_id')
             .eq('poll_id', poll.id)
+            .eq('user_id', user!.id);

           if (userVotes) {
@@ .. @@
       const { error } = await supabase
         .from('votes')
         .insert([
           {
             poll_id: poll!.id,
             option_id: optionId,
+            user_id: user!.id,
           },
         ]);
@@ .. @@
     try {
       const { error } = await supabase
         .from('votes')
         .delete()
         .eq('option_id', optionId)
+        .eq('user_id', user!.id);

       if (error) throw error;
@@ .. @@
       const { error } = await supabase
         .from('options')
         .insert([
           {
             poll_id: poll!.id,
             name: newOption.trim(),
+            user_id: user!.id,
           },
         ]);
@@ .. @@
     }
   };

+  const canEditOption = (option: Option) => {
+    return user && option.user_id === user.id;
+  };
+
+  const canEditPoll = () => {
+    return user && poll && poll.user_id === user.id;
+  };
+
   if (loading) {
     return (
       <div className="max-w-4xl mx-auto py-8 px-4">
@@ .. @@
                   <div className="flex items-center justify-between">
                     <span className="font-medium">{option.name}</span>
                     <div className="flex items-center space-x-2">
-                      <button
-                        onClick={() => handleEditOption(option.id, option.name)}
-                        className="p-1 text-gray-400 hover:text-indigo-600"
-                        title="Edit option"
-                      >
-                        <Edit2 className="h-4 w-4" />
-                      </button>
-                      <button
-                        onClick={() => handleDeleteOption(option.id)}
-                        className="p-1 text-gray-400 hover:text-red-600"
-                        title="Delete option"
-                      >
-                        <Trash2 className="h-4 w-4" />
-                      </button>
+                      {canEditOption(option) && (
+                        <>
+                          <button
+                            onClick={() => handleEditOption(option.id, option.name)}
+                            className="p-1 text-gray-400 hover:text-indigo-600"
+                            title="Edit option"
+                          >
+                            <Edit2 className="h-4 w-4" />
+                          </button>
+                          <button
+                            onClick={() => handleDeleteOption(option.id)}
+                            className="p-1 text-gray-400 hover:text-red-600"
+                            title="Delete option"
+                          >
+                            <Trash2 className="h-4 w-4" />
+                          </button>
+                        </>
+                      )}
                     </div>
                   </div>
                   
@@ .. @@
             </div>
           </div>

-          <div className="bg-white rounded-lg shadow-md p-6">
-            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Option</h3>
-            <div className="flex space-x-3">
-              <input
-                type="text"
-                value={newOption}
-                onChange={(e) => setNewOption(e.target.value)}
-                placeholder="Enter new option"
-                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
-                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
-              />
-              <button
-                onClick={handleAddOption}
-                disabled={!newOption.trim() || addingOption}
-                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
-              >
-                {addingOption ? (
-                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
-                ) : (
-                  <>
-                    <Plus className="h-4 w-4 mr-2" />
-                    Add Option
-                  </>
-                )}
-              </button>
+          {user && (
+            <div className="bg-white rounded-lg shadow-md p-6">
+              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Option</h3>
+              <div className="flex space-x-3">
+                <input
+                  type="text"
+                  value={newOption}
+                  onChange={(e) => setNewOption(e.target.value)}
+                  placeholder="Enter new option"
+                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
+                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
+                />
+                <button
+                  onClick={handleAddOption}
+                  disabled={!newOption.trim() || addingOption}
+                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
+                >
+                  {addingOption ? (
+                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
+                  ) : (
+                    <>
+                      <Plus className="h-4 w-4 mr-2" />
+                      Add Option
+                    </>
+                  )}
+                </button>
+              </div>
             </div>
-          </div>
+          )}
         </div>
       </div>
     );