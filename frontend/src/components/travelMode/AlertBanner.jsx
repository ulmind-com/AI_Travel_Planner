import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function AlertBanner({ alerts, onClose }) {
  if (!alerts || alerts.length === 0) return null;

  // Select the most severe alert or show a consolidated list
  const primaryAlert = alerts[0];

  const getAlertIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'danger':
      case 'high':
        return <ShieldAlert className="text-red-500 animate-pulse" size={18} />;
      case 'caution':
      case 'medium':
        return <AlertTriangle className="text-amber-500 animate-bounce" size={18} />;
      default:
        return <AlertCircle className="text-blue-500" size={18} />;
    }
  };

  const getAlertColors = (level) => {
    switch (level?.toLowerCase()) {
      case 'danger':
      case 'high':
        return 'border-red-500/30 bg-red-950/30 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.1)]';
      case 'caution':
      case 'medium':
        return 'border-amber-500/30 bg-amber-950/30 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
      default:
        return 'border-blue-500/30 bg-blue-950/30 text-blue-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl"
      >
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-2xl ${getAlertColors(primaryAlert.level)}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-center">
              {getAlertIcon(primaryAlert.level)}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">
                {primaryAlert.type || 'Travel Alert'}
              </div>
              <div className="text-xs font-semibold leading-relaxed mt-0.5">
                {primaryAlert.message || primaryAlert}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
