import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Radar, MessageSquare, MapPin, Eye, Radio, Settings, X, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Map from './Map';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Helper to calculate distance in miles
const getDistance = (p1: [number, number], p2: [number, number]) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLon = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function GuardianDashboard() {
  const [location, setLocation] = useState<[number, number]>([28.6139, 77.2090]);
  const [isBeaconActive, setIsBeaconActive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [escortDistance, setEscortDistance] = useState(5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [liveTravelers, setLiveTravelers] = useState<any[]>([]);

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLocation(newLoc);
          if (auth.currentUser) {
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
              location: newLoc,
              lastUpdated: new Date().toISOString()
            }).catch(console.error);
          }
        },
        (err) => console.log(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    const loadSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.isBeaconActive !== undefined) setIsBeaconActive(data.isBeaconActive);
          if (data.escortDistance !== undefined) setEscortDistance(data.escortDistance);
          if (data.notificationsEnabled !== undefined) setNotificationsEnabled(data.notificationsEnabled);
        }
      } catch (error) {
        console.error("Error loading guardian settings:", error);
      }
    };
    loadSettings();

    // Listen to live travelers
    const q = query(collection(db, 'users'), where('role', '==', 'traveler'));
    const unsub = onSnapshot(q, (snap) => {
      const travelers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      // Check for new SOS alerts to trigger notifications
      setLiveTravelers(prevTravelers => {
        if (notificationsEnabled) {
          const prevSosIds = new Set(prevTravelers.filter(t => t.sosActive).map(t => t.id));
          const newSosTravelers = travelers.filter(t => t.sosActive && !prevSosIds.has(t.id));
          
          newSosTravelers.forEach(t => {
            // In a real app, this would use the Push API or Firebase Cloud Messaging
            // For this demo, we use the browser's Notification API if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('SOS Alert!', {
                body: `${t.name || 'A traveler'} has activated an SOS alert nearby!`,
                icon: '/vite.svg'
              });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('SOS Alert!', {
                    body: `${t.name || 'A traveler'} has activated an SOS alert nearby!`,
                    icon: '/vite.svg'
                  });
                }
              });
            }
          });
        }
        return travelers;
      });
    });

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      unsub();
    };
  }, []);

  const activeAlerts = liveTravelers
    .filter(t => t.sosActive && t.location)
    .map(t => ({
      id: t.id,
      position: t.location as [number, number],
      type: 'alert' as const,
      label: `SOS: ${t.name || 'Traveler'} in distress!`
    }));

  const activePassiveEscorts = liveTravelers
    .filter(t => t.passiveEscort && !t.sosActive && t.location)
    .map(t => ({
      ...t,
      distance: getDistance(location, t.location as [number, number])
    }))
    .filter(t => t.distance <= escortDistance);

  const updateSetting = async (key: string, value: any) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        [key]: value
      });
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
    }
  };

  const handleToggleBeacon = (active: boolean) => {
    setIsBeaconActive(active);
    updateSetting('isBeaconActive', active);
  };

  const handleDistanceChange = (distance: number) => {
    setEscortDistance(distance);
    updateSetting('escortDistance', distance);
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    updateSetting('notificationsEnabled', enabled);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative"
    >
      {/* Left Column: Map & Status */}
      <div className="lg:col-span-2 h-full relative rounded-[2rem] overflow-hidden border-4 border-white/60 shadow-2xl bg-slate-100">
        {/* Map Container */}
        <div className="absolute inset-0 z-0">
          <Map center={location} markers={[
            ...activeAlerts,
            ...activePassiveEscorts.map(t => ({
              id: t.id,
              position: t.location as [number, number],
              type: 'traveler' as const,
              label: t.name || 'Traveler'
            }))
          ]} />
          {/* Radar Scanner Effect */}
          {isBeaconActive && (
            <div className="absolute inset-0 pointer-events-none z-[500] flex items-center justify-center opacity-30">
              <div className="w-[200%] h-[200%] rounded-full border border-emerald-500/30 animate-[spin_8s_linear_infinite]" 
                   style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.4) 100%)' }}>
              </div>
            </div>
          )}
        </div>

        {/* Top Status Bar (Floating) */}
        <div className={`absolute top-4 left-4 right-4 p-4 rounded-2xl shadow-lg flex justify-between items-center z-[1000] border backdrop-blur-xl transition-colors ${
          isBeaconActive 
            ? 'bg-emerald-600/90 text-white border-emerald-400/50' 
            : 'bg-white/90 text-slate-500 border-white/50'
        }`}>
          {isBeaconActive && (
            <div className="absolute right-0 top-0 opacity-20 pointer-events-none">
              <Radar className="w-32 h-32 animate-spin-slow" />
            </div>
          )}
          <div className="relative z-10 flex-1">
            <h2 className="text-xl font-black flex items-center gap-2 tracking-wide">
              <Radio className={`w-6 h-6 ${isBeaconActive ? 'text-emerald-200 animate-pulse' : 'text-slate-400'}`} /> 
              {isBeaconActive ? 'Active Beacon' : 'Beacon Offline'}
            </h2>
            <p className={`font-medium mt-1 flex items-center gap-2 ${isBeaconActive ? 'text-emerald-50' : 'text-slate-400'}`}>
              {isBeaconActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                  </span>
                  Broadcasting Aura
                </>
              ) : (
                'Not visible to travelers'
              )}
            </p>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className={`relative z-10 p-3 rounded-full transition-colors cursor-pointer shadow-sm ${
              isBeaconActive ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Right Column: Alerts & Escorts */}
      <div className="flex flex-col space-y-4 h-full overflow-y-auto pb-6 pr-2 custom-scrollbar">
        
        {/* City Overview Header */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/50 flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">New Delhi</h3>
              <p className="text-xs text-slate-500 font-medium">Guardian Network Active</p>
            </div>
          </div>
          <div className="flex flex-col items-end justify-center">
            <span className="text-2xl font-black text-indigo-600 leading-none">124</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Guardians</span>
          </div>
        </div>

        {/* Emergency Alerts Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Nearby Alerts</h3>
            {activeAlerts.length > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-black shadow-md"
              >
                {activeAlerts.length} Active
              </motion.span>
            )}
          </div>
          <div className="p-4">
            {activeAlerts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activeAlerts.map(alert => (
                  <motion.div 
                    key={alert.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 rounded-2xl shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-2xl text-white shadow-lg shadow-red-500/30">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-red-700 text-lg">SOS Triggered</h4>
                        <p className="text-sm font-semibold text-red-600/80 mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {alert.label}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 relative z-10 mt-1">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold py-3 rounded-xl shadow-md shadow-red-500/20 cursor-pointer">
                        Respond Now
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-none bg-white border-2 border-red-100 text-red-600 p-3 rounded-xl shadow-sm hover:bg-red-50 cursor-pointer">
                        <MessageSquare className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-6 font-medium">No active alerts in your area. Everything is safe! ✨</p>
            )}
          </div>
        </div>

        {/* Passive Escorts Section */}
        <div className="bg-indigo-50/80 backdrop-blur-xl rounded-3xl border border-indigo-100 shadow-md overflow-hidden">
          <div className="px-5 py-3 border-b border-indigo-100/50 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Passive Escorts
            </h3>
            <span className="text-xs font-bold bg-indigo-200 text-indigo-800 px-2 py-1 rounded-lg">{activePassiveEscorts.length} Active</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {activePassiveEscorts.length > 0 ? (
              activePassiveEscorts.map((escort, index) => (
                <div key={escort.id} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={`https://randomuser.me/api/portraits/women/${index + 20}.jpg`} alt="Traveler" className="w-10 h-10 rounded-full border-2 border-indigo-100" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
                        <MapPin className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{escort.name || 'Traveler'}</p>
                      <p className="text-xs text-slate-500">{escort.distance.toFixed(1)} miles away</p>
                    </div>
                  </div>
                  <button className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-indigo-400 text-sm">No active passive escorts nearby.</div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            key="settings-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-slate-500" /> Guardian Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Beacon Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Radio className={`w-4 h-4 ${isBeaconActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      Active Beacon
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Broadcast your aura to travelers</p>
                  </div>
                  <button 
                    onClick={() => handleToggleBeacon(!isBeaconActive)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${isBeaconActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: isBeaconActive ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {/* Escort Distance */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" /> Max Escort Distance
                    </h4>
                    <span className="text-sm font-bold text-indigo-600">{escortDistance} miles</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="20" 
                    value={escortDistance}
                    onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>1 mi</span>
                    <span>20 mi</span>
                  </div>
                </div>

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" /> Push Notifications
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Receive alerts for nearby SOS</p>
                  </div>
                  <button 
                    onClick={() => handleToggleNotifications(!notificationsEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${notificationsEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: notificationsEnabled ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" /> Edit Public Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
