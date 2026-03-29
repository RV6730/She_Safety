/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface AIAssistantProps {
  onClose: () => void;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    // Initialize GoogleGenAI
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setError("Gemini API Key is missing.");
      return;
    }
    aiRef.current = new GoogleGenAI({ apiKey });

    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (!aiRef.current) return;
    setIsConnecting(true);
    setError(null);
    setTranscript('Connecting to AI Assistant...');

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      const sessionPromise = aiRef.current.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsRecording(true);
            setTranscript('Listening... Speak now.');
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
              
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              const base64Audio = message.serverContent.modelTurn.parts[0]?.inlineData?.data;
              if (base64Audio) {
                playAudio(base64Audio);
              }
            }
            if (message.serverContent?.interrupted) {
              // Handle interruption
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            stopRecording();
          },
          onclose: () => {
            stopRecording();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful and reassuring travel safety assistant named Aura. Keep your responses concise and supportive.",
        },
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Microphone access error:", err);
      setError("Could not access microphone.");
      setIsConnecting(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    try {
      const binaryString = atob(base64Audio);
      const pcm16 = new Int16Array(binaryString.length / 2);
      for (let i = 0; i < pcm16.length; i++) {
        const byte1 = binaryString.charCodeAt(i * 2);
        const byte2 = binaryString.charCodeAt(i * 2 + 1);
        pcm16[i] = (byte2 << 8) | byte1;
      }
      
      const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 0x7FFF;
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsConnecting(false);
    setTranscript('Conversation ended.');
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Aura Assistant
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            {isRecording && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-indigo-200 rounded-full opacity-50 blur-xl"
              />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isConnecting}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              } disabled:opacity-50 cursor-pointer`}
            >
              {isConnecting ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <h4 className="font-bold text-slate-800 text-xl">
              {isRecording ? 'Aura is listening...' : 'Tap to speak with Aura'}
            </h4>
            <p className="text-slate-500 text-sm h-10">
              {error ? <span className="text-red-500">{error}</span> : transcript}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
