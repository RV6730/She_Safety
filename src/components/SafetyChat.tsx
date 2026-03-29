/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Search, MapPin, Loader2, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface SafetyChatProps {
  onClose: () => void;
  location: [number, number];
}

export default function SafetyChat({ onClose, location }: SafetyChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, links?: any[] }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey! });

      const tools: any[] = [];
      let toolConfig: any = undefined;

      if (mode === 'search') {
        tools.push({ googleSearch: {} });
      } else if (mode === 'maps') {
        tools.push({ googleMaps: {} });
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location[0],
              longitude: location[1]
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are Aura, a travel safety assistant. Provide concise, helpful, and accurate information to keep the user safe.",
          tools,
          toolConfig
        }
      });

      let links: any[] = [];
      if (mode === 'search') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          links = chunks.map((c: any) => c.web).filter(Boolean);
        }
      } else if (mode === 'maps') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          links = chunks.map((c: any) => c.maps).filter(Boolean);
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'No response.', links }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error while fetching information.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Safety Intel
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-indigo-500" />
          </button>
        </div>

        <div className="flex p-2 gap-2 bg-slate-50 border-b border-slate-100">
          <button 
            onClick={() => setMode('search')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${mode === 'search' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Search className="w-4 h-4" /> Web Search
          </button>
          <button 
            onClick={() => setMode('maps')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${mode === 'maps' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <MapPin className="w-4 h-4" /> Local Places
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-10">
              <ShieldCheck className="w-12 h-12 mx-auto text-indigo-200 mb-3" />
              <p className="font-medium">Ask Aura about local safety news or find nearby safe spots like police stations and hospitals.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <div className="prose prose-sm prose-indigo max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.links && msg.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                  {msg.links.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors truncate max-w-full">
                      {link.title || 'Source Link'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Aura is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={mode === 'search' ? "Ask about safety news..." : "Find nearby police stations..."}
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white p-3 rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
