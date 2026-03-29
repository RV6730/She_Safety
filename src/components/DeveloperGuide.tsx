import React from 'react';
import { MoreHorizontal, ArrowDown } from 'lucide-react';

export default function DeveloperGuide() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-300 font-sans p-4 md:p-8 selection:bg-pink-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-800 flex items-center justify-center text-xl font-bold">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                SafeHer — developer guide
              </h1>
              <p className="text-sm text-gray-400">Step-by-step instructions from zero to launch</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-300 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            '1. Setup env', '2. Design UI', '3. Auth', '4. SOS feature', 
            '5. Live tracking', '6. Community', '7. Backend API', '8. Test & launch'
          ].map((step, i) => (
            <button 
              key={step}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                i === 0 
                  ? 'border-gray-500 text-white bg-white/5' 
                  : 'border-[#333] text-gray-400 hover:bg-[#222] hover:text-gray-200'
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {/* Step 1 Container */}
        <div className="border border-[#333] rounded-2xl p-6 mb-4 bg-[#222]">
          {/* Step Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Install required software</h2>
              <p className="text-sm text-gray-400">One-time setup on your computer</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-10 pl-4 border-l border-[#333] ml-4">
            
            {/* Substep 1 */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                1
              </div>
              <h3 className="font-bold text-white mb-2">Install Flutter SDK</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Go to flutter.dev/docs/get-started/install → choose your OS (Windows/Mac/Linux) → download and extract the Flutter SDK folder → add Flutter to your system PATH variable.
              </p>
              <div className="bg-[#141414] border border-[#333] rounded-xl p-4 flex justify-between items-start mb-4">
                <pre className="text-sm text-blue-400 font-mono leading-relaxed">
                  <code>flutter --version<br/>flutter doctor</code>
                </pre>
                <button className="px-4 py-1.5 rounded-lg border border-[#444] text-xs font-medium text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                  copy
                </button>
              </div>
              <div className="bg-[#1a1a1a] border-l-2 border-pink-500 rounded-r-xl p-4 text-sm text-gray-400">
                Run flutter doctor — it tells you exactly what's missing. Fix every red X before moving on.
              </div>
            </div>

            {/* Substep 2 */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                2
              </div>
              <h3 className="font-bold text-white mb-2">Install Android Studio</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Download from developer.android.com/studio → install → open SDK Manager → install Android SDK, Android Emulator, and Google Play Services. Create a virtual device (Pixel 6, API 33).
              </p>
            </div>

            {/* Substep 3 */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                3
              </div>
              <h3 className="font-bold text-white mb-2">Install VS Code + extensions</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Download VS Code → install these 3 extensions: Flutter, Dart, and Pubspec Assist. These give you auto-complete, error highlighting, and package management.
              </p>
            </div>

            {/* Substep 4 */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                4
              </div>
              <h3 className="font-bold text-white mb-2">Install Node.js (for backend)</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Go to nodejs.org → download LTS version → install → verify in terminal.
              </p>
              <div className="bg-[#141414] border border-[#333] rounded-xl p-4 flex justify-between items-start">
                <pre className="text-sm font-mono leading-relaxed">
                  <code className="text-blue-400">node --version    </code>
                  <code className="text-gray-500"># should show v18+</code>
                  <br/>
                  <code className="text-blue-400">npm --version</code>
                </pre>
                <button className="px-4 py-1.5 rounded-lg border border-[#444] text-xs font-medium text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                  copy
                </button>
              </div>
            </div>

            {/* Substep 5 */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                5
              </div>
              <h3 className="font-bold text-white mb-2">Install Git & Create GitHub account</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Download git-scm.com → install → create account at github.com → set your identity in terminal.
              </p>
              <div className="bg-[#141414] border border-[#333] rounded-xl p-4 flex justify-between items-start">
                <pre className="text-sm text-blue-400 font-mono leading-relaxed">
                  <code>git config --global user.name "Your Name"<br/>git config --global user.email "you@email.com"</code>
                </pre>
                <button className="px-4 py-1.5 rounded-lg border border-[#444] text-xs font-medium text-gray-300 hover:bg-[#2a2a2a] transition-colors">
                  copy
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Step 2 Container (Collapsed) */}
        <div className="border border-[#333] rounded-2xl p-5 mb-4 bg-[#222] flex items-center gap-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shrink-0">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create Flutter project & folder structure</h2>
            <p className="text-sm text-gray-400">Your app's skeleton</p>
          </div>
        </div>

        {/* Step 3 Container (Collapsed) */}
        <div className="border border-[#333] rounded-2xl p-5 mb-8 bg-[#222] flex items-center gap-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shrink-0">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Set up Firebase project</h2>
            <p className="text-sm text-gray-400">Your backend-as-a-service</p>
          </div>
        </div>

        <div className="flex justify-center pb-12">
          <button className="w-10 h-10 rounded-full border border-[#444] flex items-center justify-center text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
