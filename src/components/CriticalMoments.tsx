import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, Footprints, Train, Building, MapPin, 
  Coffee, BatteryLow, Timer, Users, PhoneOff,
  ChevronDown, ShieldAlert, Navigation, Smartphone,
  AlertTriangle, ShieldCheck
} from 'lucide-react';

const MOMENTS = [
  {
    id: 1,
    title: "Cab ride at night",
    fear: "Route deviation by driver",
    feature: "Journey Watch mode",
    demo: "Automatically alerts guardians if the cab deviates >500m from the expected route. Live tracking updates every 10 seconds.",
    icon: Car,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50"
  },
  {
    id: 2,
    title: "Being followed on foot",
    fear: "Someone tracking your movements",
    feature: "Fake call + nearest safe zone",
    demo: "Triggers a realistic incoming call and instantly routes you to the nearest 24/7 safe spot (like a 24h pharmacy or police station).",
    icon: Footprints,
    color: "from-rose-500 to-red-600",
    bg: "bg-rose-50"
  },
  {
    id: 3,
    title: "Arriving at unknown station late night",
    fear: "Disorientation in a new, empty place",
    feature: "Arrival Mode auto-activates",
    demo: "Pins your live location to your top 3 guardians until you reach your accommodation safely.",
    icon: Train,
    color: "from-purple-500 to-fuchsia-600",
    bg: "bg-purple-50"
  },
  {
    id: 4,
    title: "Checking into hotel alone",
    fear: "Vulnerability at the reception/room",
    feature: "Silent check-in share",
    demo: "One-tap discreet check-in sends hotel name and room number to guardians without alerting anyone nearby.",
    icon: Building,
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50"
  },
  {
    id: 5,
    title: "Walking to accommodation (last mile)",
    fear: "Dark, unlit, or deserted streets",
    feature: "Route safety score",
    demo: "Highlights well-lit streets and areas with high foot traffic to avoid dark zones. Warns if you enter a low-score area.",
    icon: MapPin,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50"
  },
  {
    id: 6,
    title: "Sitting alone in restaurant",
    fear: "Unwanted attention or harassment",
    feature: "Discreet SOS via earphone tap",
    demo: "Triple-tap your bluetooth earphones or press volume down 3 times to trigger a silent SOS to nearby guardians.",
    icon: Coffee,
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50"
  },
  {
    id: 7,
    title: "Low battery mid-trip",
    fear: "Phone dying, losing all connection",
    feature: "Auto last-location alert",
    demo: "Automatically broadcasts your final GPS coordinates and battery status to guardians when battery hits 10%.",
    icon: BatteryLow,
    color: "from-red-500 to-orange-600",
    bg: "bg-red-50"
  },
  {
    id: 8,
    title: "Going for early morning run",
    fear: "Isolated trails or empty parks",
    feature: "Check-in timer auto-SOS",
    demo: "Set a 45-min timer. If you don't check in or extend it, an SOS is automatically triggered to your emergency contacts.",
    icon: Timer,
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50"
  },
  {
    id: 9,
    title: "Meeting a stranger (travel buddy, host)",
    fear: "Unknown intentions of a new person",
    feature: "Share trip plan with guardian",
    demo: "Logs the person's details and your meeting spot, accessible only if you trigger an alert or fail to check in.",
    icon: Users,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50"
  },
  {
    id: 10,
    title: "No local emergency numbers",
    fear: "Panic during an actual emergency",
    feature: "Offline city emergency kit",
    demo: "Instantly provides local police, ambulance, and embassy numbers without internet connection.",
    icon: PhoneOff,
    color: "from-slate-600 to-slate-800",
    bg: "bg-slate-50"
  }
];

export default function CriticalMoments() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-4 z-10 relative">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">
          The 10 Critical Moments
        </h2>
        <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
          Why solo women need SafeJourney. Explore the real-world scenarios where our features automatically activate to keep you safe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOMENTS.map((moment) => {
          const Icon = moment.icon;
          const isExpanded = expandedId === moment.id;

          return (
            <motion.div
              key={moment.id}
              layout
              onClick={() => setExpandedId(isExpanded ? null : moment.id)}
              className={`rounded-3xl cursor-pointer overflow-hidden border transition-all duration-300 ${
                isExpanded 
                  ? 'bg-white shadow-xl border-slate-200' 
                  : 'bg-white/60 backdrop-blur-sm shadow-sm border-white/50 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="p-5 flex items-start gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${moment.color} text-white shadow-inner flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                    {moment.title}
                  </h3>
                  <p className="text-sm text-rose-600 font-medium flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Fear: {moment.fear}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {moment.feature}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-1 rounded-full bg-slate-50 text-slate-400"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className={`p-5 pt-0 border-t border-slate-100 ${moment.bg}`}>
                      <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-50"></div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <Smartphone className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Feature Demo</h4>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              {moment.demo}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
