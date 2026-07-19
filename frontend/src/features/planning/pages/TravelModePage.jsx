import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Navigation, MapPin, Compass, AlertCircle, Calendar, Users, 
  MapPinned, Info, Search, HelpCircle, ChevronRight, Activity
} from 'lucide-react';

// Subcomponents
import LiveMap from '@/components/travelMode/LiveMap';
import AlertBanner from '@/components/travelMode/AlertBanner';
import FloatingAI from '@/components/travelMode/FloatingAI';
import LiveInfoCards from '@/components/travelMode/LiveInfoCards';
import TravelControls from '@/components/travelMode/TravelControls';
import NavBar from '@/components/NavBar';

export default function TravelModePage() {
  const { getToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [intelData, setIntelData] = useState(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(true);
  
  // Real-time tracking and location states
  const [isTracking, setIsTracking] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showTripSelector, setShowTripSelector] = useState(true);

  const watchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  // 1. Fetch User Trips on Mount
  useEffect(() => {
    const fetchUserTrips = async () => {
      try {
        setLoadingTrips(true);
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/plans/my-plans`, { headers });
        if (response.ok) {
          const resData = await response.json();
          if (resData.status === 'Success' && resData.data) {
            setTrips(resData.data);
            // Default to first trip if available
            if (resData.data.length > 0) {
              handleActivateTrip(resData.data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch plans for travel mode:", err);
      } finally {
        setLoadingTrips(false);
      }
    };
    
    fetchUserTrips();
  }, [getToken, VITE_BACKEND_URL]);

  // 2. Load Travel Intelligence details for selected destination
  const fetchTravelIntel = useCallback(async (locationName) => {
    if (!locationName) return;
    try {
      setLoadingIntel(true);
      const token = await getToken();
      const response = await axios.get(
        `${VITE_BACKEND_URL}/api/v1/travel/intel?location=${encodeURIComponent(locationName)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (response.data) {
        const data = response.data;
        setIntelData(data);
        
        // Update destination coordinates
        if (data.coordinates) {
          setDestCoords({
            lat: data.coordinates.lat || data.coordinates.latitude,
            lng: data.coordinates.lng || data.coordinates.longitude
          });
        }

        // Parse risks/alerts
        const riskAlerts = [];
        if (data.riskDetails?.alerts && data.riskDetails.alerts.length > 0) {
          riskAlerts.push(...data.riskDetails.alerts);
        } else if (data.riskLevel && data.riskLevel !== 'safe') {
          riskAlerts.push({
            type: 'Hazard Alert',
            level: data.riskLevel,
            message: `Caution advised when visiting ${locationName}. Current conditions indicate moderate crowd or weather risks.`
          });
        }
        setAlerts(riskAlerts);
      }
    } catch (error) {
      console.error("Failed to load travel intel:", error);
      toast.error("Unable to contact live intelligence feed. Simulating local radar.");
      
      // Fallback fallback simulated data
      setIntelData({
        weather: { temp: 19, rain: 0, wind: 12, uv: 4, humidity: 55, description: "Mild & Breezy" },
        crowdLevel: "medium",
        riskLevel: "safe",
        bestTimeToday: "08:00 - 10:30",
        recommendations: [
          "Check local transit timetables for minor delays.",
          "Keep hydrated under outdoor sunny spells.",
          "Perfect hour for architectural sightseeing."
        ]
      });
      setDestCoords({ lat: 28.6139, lng: 77.2090 });
    } finally {
      setLoadingIntel(false);
    }
  }, [getToken, VITE_BACKEND_URL]);

  // Handle trip activation selection
  const handleActivateTrip = (trip) => {
    setSelectedTrip(trip);
    setShowTripSelector(false);
    fetchTravelIntel(trip.to);
    
    // Automatically set fallback destination coords based on trip data if available
    if (trip.trip_highlights?.[0]?.geo_coordinates) {
      setDestCoords({
        lat: parseFloat(trip.trip_highlights[0].geo_coordinates.lat),
        lng: parseFloat(trip.trip_highlights[0].geo_coordinates.lng)
      });
    }
  };

  // Toggle Live Tracking/Simulation
  const handleToggleTracking = () => {
    if (isTracking) {
      // Stop Tracking
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setIsTracking(false);
      toast.success("Travel Tracking Mode deactivated.");
    } else {
      // Start Tracking
      setIsTracking(true);
      toast.success("Travel Tracking active. Radar HUD engaged.", { icon: '🛰️' });
      
      // Attempt browser Geolocation watch
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setUserCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          },
          (err) => {
            console.warn("Geolocation watch failed, starting simulator", err);
            startSimulator();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        startSimulator();
      }
    }
  };

  // Simulated GPS movement loop to make the live map feel extremely active and interactive
  const startSimulator = () => {
    // Start with coordinates slightly offset from destination coordinates
    let startLat = destCoords ? destCoords.lat - 0.005 : 28.6089;
    let startLng = destCoords ? destCoords.lng - 0.005 : 77.2040;
    
    setUserCoords({ lat: startLat, lng: startLng });
    
    simulationIntervalRef.current = setInterval(() => {
      setUserCoords((prev) => {
        if (!prev) return { lat: startLat, lng: startLng };
        // Increment coordinates slightly to simulate traveling/walking
        return {
          lat: prev.lat + 0.00015,
          lng: prev.lng + 0.00010
        };
      });
    }, 3000);
  };

  // Clean up timers/listeners on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#070708] text-white overflow-hidden">
      {/* Absolute Full Screen Map Background */}
      <LiveMap 
        userCoords={userCoords} 
        destCoords={destCoords} 
        destinationName={selectedTrip?.to || 'Current Area'} 
      />

      {/* Floating Top Header Overlays */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
        <NavBar />
        
        {/* Navigation / HUD status bar */}
        <div className="max-w-6xl mx-auto px-4 mt-6 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 px-4.5 py-2.5 rounded-2xl shadow-lg">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">RADAR RADIAL</span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {selectedTrip ? `MODE: ${selectedTrip.to}` : 'HUD STANDBY'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setShowTripSelector(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition-colors shadow-lg"
          >
            <MapPinned size={14} /> Select Trip
          </button>
        </div>
      </div>

      {/* Alerts Banner (top-middle) */}
      <AlertBanner 
        alerts={alerts} 
        onClose={() => setAlerts([])} 
      />

      {/* Real-time details stack cards (Bottom-Right / Side stack) */}
      {selectedTrip && intelData && (
        <LiveInfoCards 
          intelData={intelData} 
          destinationName={selectedTrip.to} 
        />
      )}

      {/* Draggable AI Helper Agent */}
      {selectedTrip && (
        <FloatingAI 
          currentLocation={selectedTrip.to}
          onCommandExecuted={(cmd, reply) => {
            // Can handle custom actions (like modifying tracking or updating maps) if user instructs the AI
          }}
        />
      )}

      {/* Bottom control bar console */}
      {selectedTrip && (
        <TravelControls 
          isTracking={isTracking} 
          onToggleTracking={handleToggleTracking} 
          coordinates={userCoords || destCoords}
          destinationName={selectedTrip.to}
        />
      )}

      {/* Modal trip picker / selector */}
      <AnimatePresence>
        {showTripSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-neutral-950 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl relative"
            >
              <div className="flex items-center gap-3.5 mb-5 border-b border-white/5 pb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 text-white flex items-center justify-center">
                  <Compass className="animate-spin-slow" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white font-outfit">Engage Travel Mode</h3>
                  <p className="text-xs text-white/50">Select a trip itinerary to load live radar HUD</p>
                </div>
              </div>

              {loadingTrips ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-primary animate-spin mb-3" />
                  <p className="text-xs text-white/40">Accessing secure coordinates vault...</p>
                </div>
              ) : trips.length === 0 ? (
                <div className="py-10 text-center">
                  <AlertCircle className="mx-auto text-white/20 mb-3" size={40} />
                  <p className="text-sm font-semibold text-white/70">No Trips Planned Yet</p>
                  <p className="text-xs text-white/40 mt-1">Please plan or save a trip from the dashboard first to engage Travel Mode.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {trips.map((trip) => (
                    <button
                      key={trip._id}
                      onClick={() => handleActivateTrip(trip)}
                      className="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-left transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                          {trip.image_url ? (
                            <img src={trip.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Navigation size={18} className="text-white/40 group-hover:text-primary transition-colors" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-primary transition-colors">
                            {trip.name || 'Untitled Plan'}
                          </h4>
                          <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {trip.to} • {trip.days || 1} Days
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {/* Close/Dismiss Overlay */}
              {selectedTrip && (
                <button
                  onClick={() => setShowTripSelector(false)}
                  className="w-full mt-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Return to Active Radar
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
