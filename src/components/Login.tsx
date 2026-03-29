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
    <div className="relative flex flex-col md:flex-row items-center justify-center h-full overflow-hidden bg-white/40 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm">
      
      {/* Left side graphics (hidden on mobile) */}
      <div className="hidden md:flex w-1/2 h-full relative bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-600 p-8 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent"></div>
        
        {/* Floating elements */}
        <motion.div 
          animate={{ y: [0, -15, 0] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-xl"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 20, 0] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-10 bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-xl"
        >
          <Map className="w-8 h-8 text-white" />
        </motion.div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-xl mb-6 backdrop-blur-md border border-white/30">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            Travel Fearlessly.<br/>Explore Freely.
          </h1>
          <p className="text-rose-100 text-lg max-w-md">
            Join a global network of women protecting women. Real-time safety, trusted guardians, and smart routing.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <img key={i} src={`https://randomuser.me/api/portraits/women/${i + 10}.jpg`} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
            ))}
          </div>
          <span className="text-white text-sm font-medium">10,000+ women traveling safely</span>
        </div>
      </div>

      {/* Right side login */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
        {/* Decorative background blobs for mobile */}
        <div className="md:hidden absolute top-0 left-0 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="md:hidden absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:text-left space-y-3 z-10 mb-10"
        >
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">SafeJourney</span></h2>
          <p className="text-slate-500 font-medium">Choose how you want to use the app today.</p>
        </motion.div>

        <div className="w-full space-y-5 z-10">
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
            className="w-full relative overflow-hidden p-1 rounded-3xl group cursor-pointer shadow-lg disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-purple-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/10 backdrop-blur-md p-5 rounded-[22px] flex items-center gap-4 border border-white/20">
              <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div className="text-left text-white">
                <h3 className="text-xl font-bold mb-0.5 flex items-center gap-2">
                  I am a Traveler
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </h3>
                <p className="text-rose-100 text-sm font-medium">Explore safely with local support</p>
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
            className="w-full relative overflow-hidden p-1 rounded-3xl group cursor-pointer shadow-lg disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/10 backdrop-blur-md p-5 rounded-[22px] flex items-center gap-4 border border-white/20">
              <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-left text-white">
                <h3 className="text-xl font-bold mb-0.5 flex items-center gap-2">
                  I am a Guardian
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </h3>
                <p className="text-teal-100 text-sm font-medium">Help protect travelers in your city</p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
