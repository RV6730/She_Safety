import React, { useState } from 'react';
import { Shield, User, Map, Heart, BellRing, Loader2 } from 'lucide-react';
import { Role } from '../App';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

export default function Login({ setRole }: { setRole: (role: Role) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (selectedRole: Role) => {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          role: selectedRole,
          isBeaconActive: false,
          escortDistance: 5,
          notificationsEnabled: true,
          location: [0, 0], // Default location, should be updated by dashboard
          createdAt: new Date().toISOString()
        });
      } else {
        // If user exists but chose a different role, we might want to update it or just use the existing one.
        // For now, let's just use the existing role from the database.
        const existingRole = userDoc.data().role as Role;
        if (existingRole !== selectedRole) {
          await setDoc(userDocRef, { role: selectedRole }, { merge: true });
        }
      }

      setRole(selectedRole);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative flex flex-col items-center justify-center h-full space-y-8 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 z-10"
      >
        <div className="inline-flex items-center justify-center p-4 bg-white/50 rounded-full mb-4 shadow-xl backdrop-blur-sm border border-white/50">
          <Heart className="w-10 h-10 text-rose-500 fill-rose-500" />
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">SafeJourney</span></h2>
        <p className="text-slate-600 font-medium text-lg">Empowering women to explore the world fearlessly.</p>
      </motion.div>

      <div className="w-full space-y-5 z-10 mt-8">
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => handleLogin('traveler')}
          disabled={loading}
          className="w-full relative overflow-hidden p-1 rounded-3xl group cursor-pointer shadow-xl disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-purple-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-[22px] flex items-center gap-5 border border-white/20">
            <div className="p-4 bg-white/20 rounded-2xl shadow-inner">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="text-left text-white">
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                I am a Traveler
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              </h3>
              <p className="text-rose-100 font-medium">Explore safely with local support</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => handleLogin('guardian')}
          disabled={loading}
          className="w-full relative overflow-hidden p-1 rounded-3xl group cursor-pointer shadow-xl disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-[22px] flex items-center gap-5 border border-white/20">
            <div className="p-4 bg-white/20 rounded-2xl shadow-inner">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left text-white">
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                I am a Guardian
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              </h3>
              <p className="text-teal-100 font-medium">Help protect travelers in your city</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
