import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, CloudRain, Wind, Thermometer, Users, ShieldCheck, 
  ShieldAlert, Clock, Sparkles, MapPin, Compass, AlertTriangle,
  ChevronDown, ChevronUp, Droplets
} from 'lucide-react';

export default function LiveInfoCards({ intelData, destinationName }) {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!intelData) {
    return (
      <div className="absolute right-6 bottom-52 z-30 w-80 md:w-96 p-6 rounded-3xl border border-white/5 bg-black/60 backdrop-blur-xl text-center">
        <div className="w-10 h-10 rounded-full border border-t-transparent border-white/40 animate-spin mx-auto mb-3" />
        <p className="text-xs text-white/50 font-medium tracking-wide">Syncing live intelligence feeds...</p>
      </div>
    );
  }

  const { weather, crowdLevel, riskLevel, bestTimeToday, recommendations, riskDetails, crowdDetails } = intelData;

  const toggleExpand = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'danger':
        return <ShieldAlert className="text-red-500 animate-pulse" size={20} />;
      case 'caution':
        return <AlertTriangle className="text-amber-500 animate-pulse" size={20} />;
      default:
        return <ShieldCheck className="text-emerald-500" size={20} />;
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'danger': return 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-200';
      case 'caution': return 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-200';
      default: return 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-200';
    }
  };

  return (
    <div className="absolute right-6 bottom-52 md:top-24 md:bottom-auto z-30 w-[92vw] max-w-sm md:w-96 flex flex-col gap-3 pointer-events-auto max-h-[50vh] md:max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
      
      {/* 1. Live Weather Card */}
      <motion.div
        layout
        onClick={() => toggleExpand('weather')}
        className="glass-card rounded-2xl border border-white/10 bg-card/25 backdrop-blur-2xl hover:bg-white/[0.04] transition-all p-4 cursor-pointer relative overflow-hidden group shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 text-sky-400">
              {weather?.rain > 0 ? <CloudRain size={20} /> : <Sun size={20} className="animate-spin-slow" />}
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Real-Time Weather</span>
              <h4 className="text-xs font-semibold text-white/80">{weather?.description || 'Partly Cloudy'}</h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white">{weather?.temp ?? 22}°C</span>
            {expandedCard === 'weather' ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </div>
        </div>

        {expandedCard === 'weather' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-3"
          >
            <div className="flex items-center gap-2 text-white/70">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-xs font-medium">Humidity: {weather?.humidity || 55}%</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Wind size={14} className="text-teal-400" />
              <span className="text-xs font-medium">Wind: {weather?.wind || 10} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 col-span-2">
              <Sun size={14} className="text-yellow-400" />
              <span className="text-xs font-medium">UV Exposure Index: {weather?.uv || 3} (Moderate)</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 2. Crowd Density Estimator */}
      <motion.div
        layout
        onClick={() => toggleExpand('crowd')}
        className="glass-card rounded-2xl border border-white/10 bg-card/25 backdrop-blur-2xl hover:bg-white/[0.04] transition-all p-4 cursor-pointer relative overflow-hidden group shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/10 text-purple-400">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Crowd Level Estimator</span>
              <h4 className="text-xs font-semibold text-white/80">Current Density</h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
              crowdLevel?.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              crowdLevel?.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {crowdLevel || 'Low'}
            </span>
            {expandedCard === 'crowd' ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </div>
        </div>

        {expandedCard === 'crowd' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs text-white/70"
          >
            <div className="flex justify-between items-center">
              <span>Real-time Searches:</span>
              <span className="font-semibold text-white">{crowdDetails?.searches || 120} travelers</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Local Bookings:</span>
              <span className="font-semibold text-white">{crowdDetails?.bookings || 45} confirmed</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
                style={{ width: `${crowdDetails?.score ? crowdDetails.score * 10 : 30}%` }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 3. Safety & Risks Card */}
      <motion.div
        layout
        onClick={() => toggleExpand('safety')}
        className={`glass-card rounded-2xl border bg-gradient-to-tr backdrop-blur-2xl hover:bg-white/[0.04] transition-all p-4 cursor-pointer relative overflow-hidden group shadow-lg ${getRiskColor(riskLevel)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-center">
              {getRiskIcon(riskLevel)}
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Safety & Hazards</span>
              <h4 className="text-xs font-semibold text-white/80">Risk Level Assessment</h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest">{riskLevel || 'Safe'}</span>
            {expandedCard === 'safety' ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
          </div>
        </div>

        {expandedCard === 'safety' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs"
          >
            {riskDetails?.reasons && riskDetails.reasons.length > 0 ? (
              <ul className="list-disc list-inside space-y-1.5 opacity-90 text-[11px] leading-relaxed">
                {riskDetails.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="opacity-70 text-[11px]">No local hazards, warnings, or travel notices detected in the vicinity.</p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* 4. Best Visited Hours Card */}
      <motion.div
        layout
        onClick={() => toggleExpand('bestTime')}
        className="glass-card rounded-2xl border border-white/10 bg-card/25 backdrop-blur-2xl hover:bg-white/[0.04] transition-all p-4 cursor-pointer relative overflow-hidden group shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 text-amber-400">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Optimal Visited Window</span>
              <h4 className="text-xs font-semibold text-white/80">Best Hour Today</h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{bestTimeToday || '09:00 - 11:00'}</span>
            {expandedCard === 'bestTime' ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </div>
        </div>

        {expandedCard === 'bestTime' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-white/5 text-xs text-white/70 space-y-3"
          >
            {intelData.bestTimeDetails?.explanation && (
              <p className="text-[11px] leading-relaxed italic">"{intelData.bestTimeDetails.explanation}"</p>
            )}
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-primary">
                <Sparkles size={12} /> Live AI Insights
              </div>
              <ul className="space-y-2">
                {recommendations && recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5 border border-white/5 leading-relaxed text-[11px]">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
