import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Navigation, ShieldCheck, Eye, Sparkles, Route, ShieldAlert, Users, Star, History, X, MessageSquare, CheckCircle, Mic, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import Map from './Map';
import AIAssistant from './AIAssistant';
import SafetyChat from './SafetyChat';
import { collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GoogleGenAI } from '@google/genai';

export default function TravelerDashboard() {
  const [sosActive, setSosActive] = useState(false);
  const [passiveEscort, setPassiveEscort] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [activeRoute, setActiveRoute] = useState<'safe' | 'direct'>('safe');
  const [location, setLocation] = useState<[number, number]>([28.6139, 77.2090]);

  // Modals state
  const [showTripHistory, setShowTripHistory] = useState(false);
  const [showGuardianList, setShowGuardianList] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSafetyChat, setShowSafetyChat] = useState(false);
  const [reviewingTrip, setReviewingTrip] = useState<any>(null);
  const [viewingGuardian, setViewingGuardian] = useState<any>(null);

  // Review form state
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');

  // Firestore data
  const [comments, setComments] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [liveGuardians, setLiveGuardians] = useState<any[]>([]);

  // Safety Tips State
  const [safetyTips, setSafetyTips] = useState<string | null>(null);
  const [isFetchingTips, setIsFetchingTips] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  // Route Stats State
  const [routeStats, setRouteStats] = useState({
    safe: { time: '-- min', distance: '-- mi' },
    direct: { time: '-- min', distance: '-- mi' }
  });
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const fetchSafetyTips = async () => {
    setIsFetchingTips(true);
    setShowSafetyTips(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setSafetyTips("Gemini API Key is missing. Cannot fetch safety tips.");
        setIsFetchingTips(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      let prompt = `Provide 3 short, actionable safety tips for a traveler currently at coordinates ${location[0]}, ${location[1]}.`;
      if (isRouting) {
        prompt = `Provide 3 short, actionable safety tips for a traveler traveling from coordinates ${location[0]}, ${location[1]} to ${destination[0]}, ${destination[1]}.`;
      }
      
      prompt += " Keep the tips concise, practical, and formatted as a bulleted list. Do not use markdown headers, just bullet points.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setSafetyTips(response.text || "No safety tips available at the moment.");
    } catch (error) {
      console.error("Error fetching safety tips:", error);
      setSafetyTips("Failed to load safety tips. Please try again later.");
    } finally {
      setIsFetchingTips(false);
    }
  };

  useEffect(() => {
    if (isRouting) {
      setIsCalculatingRoute(true);
      // Simulate API call for route calculation
      const timer = setTimeout(() => {
        setRouteStats({
          safe: { time: '18 min', distance: '1.2 mi' },
          direct: { time: '12 min', distance: '0.8 mi' }
        });
        setIsCalculatingRoute(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setRouteStats({
        safe: { time: '-- min', distance: '-- mi' },
        direct: { time: '-- min', distance: '-- mi' }
      });
    }
  }, [isRouting]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const commentsQuery = query(collection(db, 'comments'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    const tripsQuery = query(collection(db, 'trips'), where('travelerId', '==', auth.currentUser.uid));
    const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
      const fetchedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPastTrips(fetchedTrips);
    }, (error) => {
      console.error("Error fetching trips:", error);
    });

    const guardiansQuery = query(collection(db, 'users'), where('role', '==', 'guardian'), where('isBeaconActive', '==', true));
    const unsubscribeGuardians = onSnapshot(guardiansQuery, (snapshot) => {
      const fetchedGuardians = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveGuardians(fetchedGuardians);
    }, (error) => {
      console.error("Error fetching live guardians:", error);
    });

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

    return () => {
      unsubscribeComments();
      unsubscribeTrips();
      unsubscribeGuardians();
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Base list of guardians
  const baseGuardians = [
    { id: '1', position: [28.6189, 77.1890] as [number, number], name: 'Sarah' },
    { id: '2', position: [28.6089, 77.2190] as [number, number], name: 'Elena' },
    { id: '3', position: [28.6239, 77.2290] as [number, number], name: 'Maria' },
    { id: '4', position: [28.6189, 77.2340] as [number, number], name: 'Jessica' },
    { id: '5', position: [28.6039, 77.1990] as [number, number], name: 'Chloe' },
    { id: '6', position: [28.6289, 77.2090] as [number, number], name: 'David' },
    { id: '7', position: [28.6139, 77.2390] as [number, number], name: 'Emma' },
  ];

  // Combine live guardians with base guardians
  const allGuardians = [
    ...baseGuardians,
    ...liveGuardians.filter(g => g.location).map(g => ({
      id: g.id,
      position: g.location as [number, number],
      name: g.name || 'Guardian'
    }))
  ];

  // Mock destination for routing
  const destination: [number, number] = [28.6289, 77.2390];

  // Simulated Google Maps Distance Matrix API routing
  const routes = isRouting ? [
    {
      id: 'direct',
      positions: [location, destination] as [number, number][],
      color: activeRoute === 'direct' ? '#ef4444' : '#cbd5e1', // Red if active, gray if not
      dashArray: '5, 10',
      weight: activeRoute === 'direct' ? 4 : 2
    },
    {
      id: 'safe',
      positions: [location, [28.6089, 77.2190], [28.6239, 77.2290], [28.6189, 77.2340], destination] as [number, number][],
      color: activeRoute === 'safe' ? '#8b5cf6' : '#cbd5e1', // Purple for Aura route
      weight: activeRoute === 'safe' ? 5 : 2
    }
  ] : [];

  // Helper for distance calculation
  const getDistance = (p1: [number, number], p2: [number, number]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  };

  const distToSegmentSquared = (p: [number, number], v: [number, number], w: [number, number]) => {
    const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
    if (l2 === 0) return Math.pow(p[0] - v[0], 2) + Math.pow(p[1] - v[1], 2);
    let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.pow(p[0] - (v[0] + t * (w[0] - v[0])), 2) + Math.pow(p[1] - (v[1] + t * (w[1] - v[1])), 2);
  };

  const minDistanceToRoute = (point: [number, number], routePoints: [number, number][]) => {
    let minDist = Infinity;
    for (let i = 0; i < routePoints.length - 1; i++) {
      minDist = Math.min(minDist, Math.sqrt(distToSegmentSquared(point, routePoints[i], routePoints[i+1])));
    }
    return minDist;
  };

  const activeRouteData = routes.find(r => r.id === activeRoute);
  const MATCH_THRESHOLD = 0.012; // roughly 1.2km radius for Aura matching

  // Dynamically match guardians based on route proximity or current location
  const guardiansData = allGuardians.map(g => {
    let isMatched = false;
    
    if (isRouting && activeRouteData) {
      // Prioritize guardians closer to the intended path
      const distanceToPath = minDistanceToRoute(g.position, activeRouteData.positions);
      isMatched = distanceToPath < MATCH_THRESHOLD;
    } else {
      // Fallback to current location proximity
      const distanceToUser = getDistance(g.position, location);
      isMatched = distanceToUser < MATCH_THRESHOLD;
    }

    return { ...g, isMatched };
  });

  // Mock local safe spots
  const localPlaces = [
    { id: 'p1', position: [28.6239, 77.2190] as [number, number], name: 'St. Elmo 24/7 Diner', rating: 4.9, comment: '"Staff is trained in safety protocols. Very well lit." - Guardian Sarah' },
    { id: 'p2', position: [28.6189, 77.2290] as [number, number], name: 'Riverside Walkway', rating: 4.5, comment: '"Lots of CCTV and regular patrols. Good for evening walks." - Guardian Maria' },
    { id: 'p3', position: [28.6289, 77.2090] as [number, number], name: 'Central Transit Hub', rating: 4.7, comment: '"Always busy, security on site 24/7." - Guardian Elena' },
  ];

  // Dynamically map guardians based on the active route
  const mapMarkers = [
    ...guardiansData.map(g => {
      let type: 'guardian' | 'guardian-matched' | 'guardian-unmatched' = 'guardian';
      let label = `${g.name} (Active Beacon)`;
      
      if (isRouting) {
        if (g.isMatched) {
          type = 'guardian-matched';
          label = `${g.name} (On Your Path)`;
        } else {
          type = 'guardian-unmatched';
          label = `${g.name} (Off Path)`;
        }
      } else if (passiveEscort || sosActive) {
        if (g.isMatched) {
          type = 'guardian-matched';
          label = `${g.name} (Nearby Guardian)`;
        } else {
          type = 'guardian-unmatched';
          label = `${g.name} (Out of Range)`;
        }
      }
      
      return { id: g.id, position: g.position, type, label };
    }),
    ...(isRouting ? [{ id: 'dest', position: destination, type: 'destination' as const, label: 'Home' }] : []),
    ...(showPlaces ? localPlaces.map(p => ({
      id: p.id,
      position: p.position,
      type: 'place' as const,
      label: (
        <div className="min-w-[150px]">
          <h4 className="font-bold text-slate-800">{p.name}</h4>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold my-1">
            <Star className="w-3 h-3 fill-current" /> {p.rating} / 5.0
          </div>
          <p className="text-xs text-slate-600 italic">{p.comment}</p>
        </div>
      )
    })) : [])
  ];

  // Calculate how many guardians are actively covering the traveler
  const matchedCount = guardiansData.filter(g => g.isMatched).length;

  const endTripAndPromptReview = async (routeType: string) => {
    if (!auth.currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'trips'), {
        travelerId: auth.currentUser.uid,
        route: routeType,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        guardianName: 'Community Guardians',
        guardianId: 'community-guardians',
        reviewed: false,
        completed: true
      });
      
      const newTrip = {
        id: docRef.id,
        route: routeType,
        guardianName: 'Community Guardians',
        guardianId: 'community-guardians'
      };
      
      // Trigger a push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Trip Completed', {
          body: 'Glad you made it safely! Please take a moment to review your trip.',
          icon: '/vite.svg'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Trip Completed', {
              body: 'Glad you made it safely! Please take a moment to review your trip.',
              icon: '/vite.svg'
            });
          }
        });
      }

      // Show the review modal
      setReviewingTrip(newTrip);
    } catch (error) {
      console.error("Error creating completed trip:", error);
    }
  };

  const handleSOS = async () => {
    const newSos = !sosActive;
    setSosActive(newSos);
    if (!newSos) {
      if (passiveEscort) endTripAndPromptReview('Passive Escort');
      else if (isRouting) endTripAndPromptReview('Home Route');
      setPassiveEscort(false);
      setIsRouting(false);
    }
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        sosActive: newSos,
        passiveEscort: !newSos ? false : passiveEscort
      }).catch(console.error);
    }
  };

  const handlePassiveEscort = async () => {
    const newEscort = !passiveEscort;
    setPassiveEscort(newEscort);
    if (!newEscort) {
      setSosActive(false);
      endTripAndPromptReview('Passive Escort');
    }
    
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        passiveEscort: newEscort,
        sosActive: !newEscort ? false : sosActive
      }).catch(console.error);
    }
  };

  const toggleRouting = () => {
    const newRouting = !isRouting;
    setIsRouting(newRouting);
    if (!newRouting) {
      setSosActive(false);
      endTripAndPromptReview('Home Route');
    }
  };

  const handleMarkerClick = (id: string, type: string) => {
    if (type.includes('guardian')) {
      const guardian = guardiansData.find(g => g.id === id);
      if (guardian) {
        setViewingGuardian(guardian);
      }
    }
  };

  const submitReview = async () => {
    if (!reviewingTrip || !auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'comments'), {
        guardianId: reviewingTrip.guardianId,
        travelerId: auth.currentUser.uid,
        travelerName: auth.currentUser.displayName || 'Anonymous',
        tripId: reviewingTrip.id,
        rating,
        text: commentText,
        date: new Date().toISOString()
      });

      // Update the trip to mark it as reviewed
      await updateDoc(doc(db, 'trips', reviewingTrip.id), { reviewed: true });

      setReviewingTrip(null);
      setRating(5);
      setCommentText('');
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const getGuardianStats = (guardianId: string) => {
    const guardianComments = comments.filter(c => c.guardianId === guardianId);
    const totalReviews = guardianComments.length;
    const avgRating = totalReviews > 0 
      ? (guardianComments.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : 'New';
    return { totalReviews, avgRating };
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
          <Map center={location} markers={mapMarkers as any} routes={routes} onMarkerClick={handleMarkerClick} />
        </div>

        {/* Top Status Bar (Floating) */}
        <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50 flex justify-between items-center z-[1000]">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-400 to-purple-500 p-2 rounded-xl shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Aura Active</h2>
              <p className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                {isRouting ? 'Path-Based Matching' : 'Proximity Matching'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowTripHistory(true)}
              className="bg-white text-slate-700 p-2 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Trip History & Reviews"
            >
              <History className="w-5 h-5" />
            </button>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm border transition-colors ${
              matchedCount > 0 
                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-teal-800 border-teal-200' 
                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
            }`}>
              {matchedCount > 0 ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {matchedCount} {isRouting ? 'On Path' : 'Nearby'}
            </div>
          </div>
        </div>
        
        {sosActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-24 left-4 right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(225,29,72,0.5)] z-[1000] flex items-center justify-between border border-red-400/50"
          >
            <div className="flex items-center gap-3 font-black text-lg tracking-wide">
              <AlertTriangle className="w-7 h-7 animate-bounce" />
              SOS BROADCASTING
            </div>
            <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md">Guardians Notified</span>
          </motion.div>
        )}

        {passiveEscort && !sosActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-24 left-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.5)] z-[1000] flex items-center justify-between border border-indigo-400/50"
          >
            <div className="flex items-center gap-3 font-black text-lg tracking-wide">
              <Eye className="w-6 h-6 animate-pulse" />
              PASSIVE ESCORT
            </div>
            <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl font-bold backdrop-blur-md">{matchedCount} Eyes On You</span>
          </motion.div>
        )}
      </div>

      {/* Right Column: Controls & Actions */}
      <div className="flex flex-col space-y-4 h-full overflow-y-auto pb-6 pr-2 custom-scrollbar">
        {/* Routing Options Card */}
        <AnimatePresence>
          {isRouting && !sosActive && (
            <motion.div 
              key="routing-overlay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-slate-200"
            >
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Route className="w-5 h-5 text-purple-600" /> Route Options
              </h3>
              <div className="space-y-3">
                {/* Safe Route Option */}
                <div 
                  onClick={() => setActiveRoute('safe')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    activeRoute === 'safe' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-purple-200'
                  }`}
                >
                  <div>
                    <p className="font-bold text-purple-900 flex items-center gap-2">
                      Aura Safe Route <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </p>
                    <p className="text-xs text-purple-700 font-medium mt-1">100% Guardian Coverage</p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    {isCalculatingRoute ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500 ml-auto" />
                    ) : (
                      <>
                        <p className="font-black text-purple-700 text-lg">{routeStats.safe.time}</p>
                        <p className="text-xs text-slate-500">{routeStats.safe.distance}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Direct Route Option */}
                <div 
                  onClick={() => setActiveRoute('direct')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    activeRoute === 'direct' ? 'border-red-400 bg-red-50' : 'border-slate-100 hover:border-red-200'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      Direct Route <ShieldAlert className="w-4 h-4 text-red-500" />
                    </p>
                    <p className="text-xs text-red-600 font-medium mt-1">Passes through Dark Zones</p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    {isCalculatingRoute ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400 ml-auto" />
                    ) : (
                      <>
                        <p className="font-black text-slate-700 text-lg">{routeStats.direct.time}</p>
                        <p className="text-xs text-slate-500">{routeStats.direct.distance}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safety Tips Inline Card */}
        <AnimatePresence>
          {showSafetyTips && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-white backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-indigo-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" /> 
                    Context-Aware Safety Tips
                  </h3>
                  <button onClick={() => setShowSafetyTips(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {isFetchingTips ? (
                  <div className="flex items-center justify-center gap-3 text-indigo-600 font-medium py-6">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Aura is analyzing your location...</span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-700 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="markdown-body prose prose-sm prose-indigo max-w-none">
                      <Markdown>{safetyTips || ''}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons (Bento Grid) */}
        <div className="grid grid-cols-2 gap-3 z-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAIAssistant(true)}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-3xl shadow-lg shadow-indigo-500/30 flex flex-col items-start justify-between gap-4 font-bold text-sm cursor-pointer h-32"
        >
          <div className="bg-white/20 p-2 rounded-2xl">
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-lg tracking-tight">Voice AI</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSafetyChat(true)}
          className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-5 rounded-3xl shadow-lg shadow-teal-500/30 flex flex-col items-start justify-between gap-4 font-bold text-sm cursor-pointer h-32"
        >
          <div className="bg-white/20 p-2 rounded-2xl">
            <Search className="w-6 h-6" />
          </div>
          <span className="text-lg tracking-tight">Safety Intel</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSOS}
          className={`col-span-2 py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer overflow-hidden relative ${
            sosActive 
              ? 'bg-slate-900 text-white hover:bg-slate-800' 
              : 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white hover:shadow-[0_0_30px_rgba(244,63,94,0.6)]'
          }`}
        >
          {!sosActive && (
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
          <AlertTriangle className={`w-8 h-8 ${sosActive ? '' : 'animate-pulse'}`} />
          {sosActive ? 'CANCEL SOS' : 'EMERGENCY SOS'}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={handlePassiveEscort}
          className={`col-span-1 p-5 rounded-3xl font-bold text-sm flex flex-col items-start justify-between gap-4 transition-all shadow-lg cursor-pointer border h-32 ${
            passiveEscort
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white/80 backdrop-blur-md border-white/50 text-slate-700 hover:bg-white'
          }`}
        >
          <div className={`p-2 rounded-2xl ${passiveEscort ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <Eye className={`w-6 h-6 ${passiveEscort ? 'text-indigo-600' : 'text-purple-500'}`} />
          </div>
          <span className="text-base tracking-tight leading-tight">{passiveEscort ? 'End Escort' : 'Passive Escort'}</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={toggleRouting}
          className={`col-span-1 p-5 rounded-3xl font-bold text-sm flex flex-col items-start justify-between gap-4 transition-all shadow-lg cursor-pointer border h-32 ${
            isRouting
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : 'bg-white/80 backdrop-blur-md border-white/50 text-slate-700 hover:bg-white'
          }`}
        >
          <div className={`p-2 rounded-2xl ${isRouting ? 'bg-purple-100' : 'bg-slate-100'}`}>
            <Route className={`w-6 h-6 ${isRouting ? 'text-purple-600' : 'text-rose-500'}`} />
          </div>
          <span className="text-base tracking-tight leading-tight">{isRouting ? 'Clear Route' : 'Safe Route'}</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={() => setShowPlaces(!showPlaces)}
          className={`col-span-1 p-5 rounded-3xl font-bold text-sm flex flex-col items-start justify-between gap-4 transition-all shadow-lg cursor-pointer border h-32 ${
            showPlaces
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-white/80 backdrop-blur-md border-white/50 text-slate-700 hover:bg-white'
          }`}
        >
          <div className={`p-2 rounded-2xl ${showPlaces ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <Star className={`w-6 h-6 ${showPlaces ? 'text-amber-500 fill-amber-500' : 'text-amber-500'}`} />
          </div>
          <span className="text-base tracking-tight leading-tight">{showPlaces ? 'Hide Spots' : 'Safe Spots'}</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={() => setShowGuardianList(true)}
          className="col-span-1 p-5 rounded-3xl font-bold text-sm flex flex-col items-start justify-between gap-4 transition-all shadow-lg cursor-pointer border bg-white/80 backdrop-blur-md border-white/50 text-slate-700 hover:bg-white h-32"
        >
          <div className="p-2 rounded-2xl bg-slate-100">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-base tracking-tight leading-tight">Guardians</span>
        </motion.button>

        {!showSafetyTips && (
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={fetchSafetyTips}
            className="col-span-2 py-5 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Get Context-Aware Safety Tips
          </motion.button>
        )}
      </div>
    </div>
    <AnimatePresence>
        {/* AI Assistant Modal */}
        {showAIAssistant && (
          <AIAssistant key="ai-assistant" onClose={() => setShowAIAssistant(false)} />
        )}

        {/* Safety Chat Modal */}
        {showSafetyChat && (
          <SafetyChat key="safety-chat" onClose={() => setShowSafetyChat(false)} location={location} />
        )}

        {/* Trip History Modal */}
        {showTripHistory && !reviewingTrip && (
          <motion.div 
            key="trip-history"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" /> Trip History
                </h3>
                <button onClick={() => setShowTripHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {pastTrips.map(trip => (
                  <div key={trip.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800">{trip.route}</p>
                        <p className="text-xs text-slate-500">{trip.date}</p>
                      </div>
                      <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Safe
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Guardian: <span className="font-semibold text-slate-800">{trip.guardianName}</span></p>
                    
                    {trip.reviewed ? (
                      <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl w-fit">
                        <CheckCircle className="w-4 h-4" /> Reviewed
                      </div>
                    ) : (
                      <button 
                        onClick={() => setReviewingTrip(trip)}
                        className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" /> Leave a Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Review Form Modal */}
        {reviewingTrip && (
          <motion.div 
            key="review-form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                  Rate your Guardian
                </h3>
                <button onClick={() => setReviewingTrip(null)} className="p-2 hover:bg-indigo-100 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-indigo-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-1">How was your trip with</p>
                  <p className="text-xl font-black text-slate-800">{reviewingTrip.guardianName}?</p>
                </div>
                
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star className={`w-10 h-10 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Leave a comment (Optional)</label>
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Detail your experience. Did they communicate well? Did you feel safe?"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-0 outline-none resize-none h-24"
                  />
                </div>

                <button 
                  onClick={submitReview}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Guardian Profile Modal */}
        {viewingGuardian && (
          <motion.div 
            key="guardian-profile"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-teal-50 relative">
                <button onClick={() => setViewingGuardian(null)} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center border-4 border-white shadow-md shrink-0">
                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{viewingGuardian.name}</h2>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-4 h-4" /> Verified Local Guardian
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {getGuardianStats(viewingGuardian.id).avgRating}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        ({getGuardianStats(viewingGuardian.id).totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-400" /> Traveler Reviews
                </h3>
                
                <div className="space-y-4">
                  {comments.filter(c => c.guardianId === viewingGuardian.id).length > 0 ? (
                    comments.filter(c => c.guardianId === viewingGuardian.id).map(comment => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-800 text-sm">{comment.travelerName}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < comment.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 italic">"{comment.text}"</p>
                        <p className="text-xs text-slate-400 mt-2">{comment.date}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No reviews yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Guardian List Modal */}
        {showGuardianList && !viewingGuardian && (
          <motion.div 
            key="guardian-list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" /> Nearby Guardians
                </h3>
                <button onClick={() => setShowGuardianList(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {guardiansData.map(guardian => {
                  const stats = getGuardianStats(guardian.id);
                  return (
                    <div 
                      key={guardian.id} 
                      onClick={() => setViewingGuardian(guardian)}
                      className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                          <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{guardian.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {stats.avgRating}
                            </div>
                            <span className="text-xs text-slate-400">({stats.totalReviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        View Profile
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
