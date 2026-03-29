/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import TravelerDashboard from './components/TravelerDashboard';
import GuardianDashboard from './components/GuardianDashboard';
import CriticalMoments from './components/CriticalMoments';
import { Loader2, Sparkles } from 'lucide-react';

export type Role = 'traveler' | 'guardian' | null;

function AppContent() {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as Role);
          } else {
            // User is authenticated but has no role yet (handled in Login component)
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-teal-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-teal-50 text-slate-900 font-sans selection:bg-rose-200 relative overflow-hidden">
      
      {/* Global decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-200/40 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/40 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -40, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-200/30 blur-[100px]"
        />
      </div>

      <header className="bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2"
          >
            <span className="text-3xl drop-shadow-md">🛡️</span> SafeJourney
          </motion.h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/critical-moments">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-rose-600 bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Critical Moments
            </motion.button>
          </Link>
          {role && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="text-sm font-bold text-slate-500 hover:text-rose-600 bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm cursor-pointer transition-colors"
            >
              Sign Out
            </motion.button>
          )}
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-76px)] relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/" 
              element={
                !role ? <Login setRole={setRole} /> : 
                role === 'traveler' ? <Navigate to="/traveler" /> : 
                <Navigate to="/guardian" />
              } 
            />
            <Route 
              path="/traveler" 
              element={role === 'traveler' ? <TravelerDashboard /> : <Navigate to="/" />} 
            />
            <Route 
              path="/guardian" 
              element={role === 'guardian' ? <GuardianDashboard /> : <Navigate to="/" />} 
            />
            <Route path="/critical-moments" element={<CriticalMoments />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
