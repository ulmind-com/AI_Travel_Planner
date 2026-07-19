import React, { useState } from 'react';
import { Play, Square, Share2, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TravelControls({ isTracking, onToggleTracking, coordinates, destinationName }) {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleShareLocation = () => {
    if (!coordinates) {
      toast.error("Location coordinates are not resolved yet.");
      return;
    }
    const trackingLink = `${window.location.origin}/shared-plan/live?lat=${coordinates.lat}&lng=${coordinates.lng}`;
    navigator.clipboard.writeText(trackingLink);
    toast.success("Live location link copied to clipboard!", {
      icon: '🔗',
      style: {
        background: '#09090b',
        color: '#f4f4f5',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }
    });
  };

  const triggerEmergency = () => {
    setShowEmergencyModal(true);
    toast((t) => (
      <span className="flex items-center gap-2 text-red-500 font-bold text-xs">
        <ShieldAlert className="animate-ping" size={16} />
        EMERGENCY PROTOCOL ACTIVATED
      </span>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#450a0a',
        color: '#fee2e2',
        border: '1px solid #f87171'
      }
    });
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-35 w-[92vw] max-w-lg pointer-events-auto">
        <div className="flex items-center justify-between p-3.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          
          {/* 1. Toggle Travel Tracking button */}
          <button
            onClick={onToggleTracking}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              isTracking
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-white hover:bg-neutral-200 text-black shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-102'
            }`}
          >
            {isTracking ? (
              <>
                <Square size={13} fill="currentColor" /> Stop Tracking
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Start Mode
              </>
            )}
          </button>

          {/* 2. Share Live Location */}
          <button
            onClick={handleShareLocation}
            className="flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-white transition-all cursor-pointer"
            title="Share Live Coordinates Link"
          >
            <Share2 size={16} />
          </button>

          {/* 3. Emergency Action button */}
          <button
            onClick={triggerEmergency}
            className="flex items-center gap-2 px-4.5 py-3 rounded-full bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer animate-pulse"
          >
            <AlertOctagon size={14} /> Emergency
          </button>
        </div>
      </div>

      {/* Emergency Alert Modal Panel */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-red-500/30 p-6 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden">
            {/* Screen flashing indicator */}
            <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-500">
              <ShieldAlert className="animate-bounce" size={32} />
            </div>

            <h3 className="text-lg font-black uppercase tracking-wider text-red-500 font-outfit">Emergency SOS Activated</h3>
            <p className="text-xs text-white/60 leading-relaxed mt-2.5">
              Your GPS coordinates <strong>({coordinates?.lat?.toFixed(5) || '0.00000'}, {coordinates?.lng?.toFixed(5) || '0.00000'})</strong> and location history have been broadcasted to local authorities and emergency contacts.
            </p>

            {/* Local Helplines */}
            <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs space-y-2.5">
              <div className="text-[10px] uppercase font-black text-white/40 tracking-wider">Local Support Helplines</div>
              <div className="flex justify-between items-center text-white/80">
                <span>National Emergency Line:</span>
                <span className="font-bold text-red-400">112 / 911</span>
              </div>
              <div className="flex justify-between items-center text-white/80">
                <span>Adventure Rescue Team:</span>
                <span className="font-bold text-primary">+91 98765 43210</span>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel SOS Broadcast
            </button>
          </div>
        </div>
      )}
    </>
  );
}
