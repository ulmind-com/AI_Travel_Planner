import React, { useEffect, useState, useRef } from 'react';
import api from '../services/adminApi';
import { 
    Trash2, Search, Map as MapIcon, Calendar, Users as UsersIcon, 
    Clock, DollarSign, MapPin, Eye, Compass, Info, RefreshCw,
    TrendingUp, Shield, AlertTriangle, Star, CheckCircle, Flag, 
    Zap, Sparkles, Sliders, ChevronDown, ChevronUp, MessageSquare, 
    Heart, Bookmark, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/AdminSocketContext';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

// 🌍 HIGH-FIDELITY GEOMAPPING DICTIONARY FOR SATELLITE INTEL
const GEOMAP: Record<string, [number, number]> = {
    'KOLAGHAT': [22.4338, 87.8711],
    'KOLKATA': [22.5726, 88.3639],
    'KYOTO': [35.0116, 135.7681],
    'KYOTO, JAPAN': [35.0116, 135.7681],
    'DARJEELING': [27.0410, 88.2627],
    'CHINA': [35.8617, 104.1954],
    'TAIWAN': [23.6978, 120.9605],
    'MUMBAI': [19.0760, 72.8777],
    'DELHI': [28.6139, 77.2090],
    'LONDON': [51.5074, -0.1278],
    'NEW YORK': [40.7128, -74.0060],
    'PARIS': [48.8566, 2.3522],
    'TOKYO': [35.6762, 139.6503],
    'SINGAPORE': [1.3521, 103.8198],
    'BANGKOK': [13.7563, 100.5018],
    'SYDNEY': [-33.8688, 151.2093],
    'BALI': [-8.4095, 115.1889],
    'DUBAI': [25.2048, 55.2708],
    'SWITZERLAND': [46.8182, 8.2275],
    'ICELAND': [64.9631, -19.0208],
};

// Deterministic hashing fallback for dynamically created destinations
const getCoords = (name: string): [number, number] => {
    if (!name) return [0, 0];
    const uName = name.toUpperCase().trim();
    for (const key in GEOMAP) {
        if (uName.includes(key)) return GEOMAP[key];
    }
    
    // Deterministic string hash
    let hash = 0;
    for (let i = 0; i < uName.length; i++) {
        hash = uName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Distribute to valid lat/lng boundaries
    const lat = -35 + Math.abs((hash % 95) * 1.05); // -35 to 65 (comfort projection)
    const lng = -170 + Math.abs(((hash >> 8) % 340)); // -170 to 170
    return [lat, lng];
};

interface ExpeditionWorldMapProps {
    plans: any[];
    onFocusSelect: (coords: [number, number] | null) => void;
    focusCoords: [number, number] | null;
}

const MapFlyController: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 5, {
                animate: true,
                duration: 1.8,
            });
        } else {
            // Reset to world view
            map.setView([20, 0], 2, {
                animate: true,
                duration: 1.8,
            });
        }
    }, [coords, map]);
    return null;
};

const ExpeditionWorldMap: React.FC<ExpeditionWorldMapProps> = ({ plans, onFocusSelect, focusCoords }) => {
    useEffect(() => {
        // Inject Leaflet stylesheet dynamically if it is not already loaded
        const id = 'leaflet-css-link';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        
        // Inject Custom Dark Theme Map styling
        const styleId = 'leaflet-custom-dark-theme';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .leaflet-container {
                    background: #080808 !important;
                }
                .leaflet-bar {
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .leaflet-bar a {
                    background-color: rgba(12, 12, 12, 0.9) !important;
                    color: #a1a1aa !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    transition: all 0.2s;
                }
                .leaflet-bar a:hover {
                    background-color: rgba(99, 102, 241, 0.2) !important;
                    color: #ffffff !important;
                }
                .leaflet-popup-content-wrapper {
                    background: rgba(12, 12, 12, 0.95) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    border-radius: 16px !important;
                    color: #e4e4e7 !important;
                    font-family: monospace !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
                }
                .leaflet-popup-tip {
                    background: rgba(12, 12, 12, 0.95) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                }
                .leaflet-control-attribution {
                    background: rgba(8, 8, 8, 0.7) !important;
                    color: #52525b !important;
                    font-family: monospace !important;
                    font-size: 8px !important;
                }
                .leaflet-control-attribution a {
                    color: #6366f1 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const markers = React.useMemo(() => {
        const uniqueCoords = new Map<string, { lat: number, lng: number, views: number, saves: number, to: string, travelers: number }>();
        
        plans.forEach(plan => {
            if (!plan.to) return;
            const dest = plan.to.toUpperCase().trim();
            const coords = getCoords(plan.to);
            const current = uniqueCoords.get(dest);
            const views = plan.views || 120;
            const saves = plan.saves || 0;
            const travelers = plan.travelers || 1;
            
            if (!current || current.views < views) {
                uniqueCoords.set(dest, { lat: coords[0], lng: coords[1], views, saves, to: plan.to, travelers });
            }
        });

        return Array.from(uniqueCoords.values()).map(m => {
            const radius = Math.min(30, Math.max(8, (m.views / 500) * 20));
            return {
                location: [m.lat, m.lng] as [number, number],
                radius,
                views: m.views,
                saves: m.saves,
                to: m.to,
                travelers: m.travelers
            };
        });
    }, [plans]);

    return (
        <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <MapContainer 
                center={[20, 0]} 
                zoom={2} 
                zoomControl={true}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {markers.map((m, idx) => (
                    <CircleMarker
                        key={idx}
                        center={m.location}
                        radius={m.radius}
                        pathOptions={{
                            color: '#f43f5e',
                            fillColor: '#f43f5e',
                            fillOpacity: 0.35,
                            weight: 1.5,
                        }}
                    >
                        <Popup>
                            <div className="space-y-1.5 font-mono text-[10px]">
                                <div className="text-white font-black uppercase text-xs tracking-tight border-b border-white/10 pb-1">{m.to}</div>
                                <div className="text-rose-400 font-bold uppercase tracking-wider">EXPEDITION INTEL REPORT</div>
                                <div className="text-gray-400">COORDINATES: {m.location[0].toFixed(3)}°N, {m.location[1].toFixed(3)}°E</div>
                                <div className="text-gray-400">TRAFFIC WEIGHT: <span className="text-white font-bold">{m.views} VIEWS</span></div>
                                <div className="text-gray-400">ENGAGED PAX: <span className="text-[#00f2fe] font-bold">{m.travelers} AGENTS</span></div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                <MapFlyController coords={focusCoords} />
            </MapContainer>
        </div>
    );
};

const PlansPage: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        totalPlans: 0,
        activePlans: 0,
        trendingPlans: 0,
        totalViews: 0,
        totalSaves: 0,
        mostActiveDestination: 'N/A',
        highestEngagement: null
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [flaggingPlanId, setFlaggingPlanId] = useState<string | null>(null);
    const [flagReasonInput, setFlagReasonInput] = useState('');

    const { socket } = useSocket();

    const fetchPlansAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/plans/analytics', {
                params: {
                    page,
                    limit: 8,
                    search,
                    status: statusFilter === 'all' ? '' : statusFilter,
                    sortBy,
                    sortOrder
                }
            });
            if (res.data && res.data.data) {
                setPlans(res.data.data.plans || []);
                setStats(res.data.data.stats || {
                    totalPlans: 0,
                    activePlans: 0,
                    trendingPlans: 0,
                    totalViews: 0,
                    totalSaves: 0,
                    mostActiveDestination: 'N/A',
                    highestEngagement: null
                });
                setTotalPages(res.data.data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error('Error fetching travel plans intelligence:', error);
            toast.error('Failed to load expeditions intelligence modules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlansAnalytics();
    }, [page, statusFilter, sortBy, sortOrder]);

    // Handle search query with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchPlansAnalytics();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Hook up real-time socket events
    useEffect(() => {
        if (!socket) return;

        const handlePlanUpdated = (updatedPlan: any) => {
            console.log('[SOCKET] Realtime Plan update received:', updatedPlan);
            setPlans(prevPlans => 
                prevPlans.map(p => p._id === updatedPlan._id ? { ...p, ...updatedPlan } : p)
            );
            toast.success(`Plan details for ${updatedPlan.to} refreshed live!`);
        };

        const handlePlanDeleted = (deletedPlanId: string) => {
            console.log('[SOCKET] Realtime Plan deleted received:', deletedPlanId);
            setPlans(prevPlans => prevPlans.filter(p => p._id !== deletedPlanId));
            if (expandedPlanId === deletedPlanId) setExpandedPlanId(null);
            toast.error('A plan was deleted by another moderator', { icon: '🗑️' });
        };

        socket.on('plan:updated', handlePlanUpdated);
        socket.on('plan:deleted', handlePlanDeleted);

        return () => {
            socket.off('plan:updated', handlePlanUpdated);
            socket.off('plan:deleted', handlePlanDeleted);
        };
    }, [socket, expandedPlanId]);

    // Core Plan Operations Actions
    const handleDelete = async (id: string, destination: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`CRITICAL SECURITY SANCTION: Are you sure you want to permanently purge the expedition itinerary for "${destination}" from MongoDB?`)) return;
        try {
            await api.delete(`/plans/${id}`);
            toast.success(`Expedition node "${destination}" purged from main database.`);
            setPlans(plans.filter(p => p._id !== id));
            if (expandedPlanId === id) setExpandedPlanId(null);
        } catch (error) {
            toast.error('Failed to validate admin permissions for purge request.');
        }
    };

    const handlePromote = async (id: string, destination: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/plans/${id}/promote`);
            const updatedPlan = res.data.data;
            setPlans(plans.map(p => p._id === id ? { ...p, status: updatedPlan.status } : p));
            toast.success(`Expedition to ${destination} is now ${updatedPlan.status}!`, { icon: '🔥' });
        } catch (error) {
            toast.error('Failed to change trending prioritization.');
        }
    };

    const handleFlagClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFlaggingPlanId(id);
        setFlagReasonInput('');
    };

    const submitFlagAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flaggingPlanId) return;
        try {
            const res = await api.post(`/plans/${flaggingPlanId}/flag`, { reason: flagReasonInput });
            const updatedPlan = res.data.data;
            setPlans(plans.map(p => p._id === flaggingPlanId ? { ...p, isFlagged: updatedPlan.isFlagged, flagReason: updatedPlan.flagReason } : p));
            toast.success(updatedPlan.isFlagged ? 'Plan successfully flagged under safety protocols.' : 'Plan warning successfully cleared.');
            setFlaggingPlanId(null);
        } catch (error) {
            toast.error('Failed to commit safety flag modification.');
        }
    };

    const toggleRow = (id: string, destinationName?: string) => {
        if (expandedPlanId === id) {
            setExpandedPlanId(null);
            setFocusCoords(null);
        } else {
            setExpandedPlanId(id);
            if (destinationName) {
                const coords = getCoords(destinationName);
                setFocusCoords(coords);
            }
        }
    };

    // Derived Visual Indicators
    const getEngagementBadge = (score: number) => {
        if (score >= 40) return { text: 'HIGH LOAD', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' };
        if (score >= 20) return { text: 'MID LOAD', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
        return { text: 'LOW LOAD', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-8 pb-24 select-none font-sans text-gray-200"
        >
            {/* Elegant intelligence header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[#00f2fe] shadow-[0_0_20px_rgba(0,242,254,0.1)]">
                            <Compass className="w-6 h-6 animate-spin-slow text-[#00f2fe]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase font-mono flex items-center gap-2">
                                TRAVEL INTELLIGENCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#00f2fe] font-sans">CONSOLE</span>
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">
                                Advanced analytics dashboard tracking live user-generated MongoDB expeditions & performance logs
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPlansAnalytics}
                        className="flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:border-indigo-500/30 rounded-full text-[10px] font-black text-gray-400 hover:text-white bg-white/[0.01] hover:bg-indigo-500/5 transition-all uppercase tracking-widest font-mono shadow-md"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Sync Intel Database
                    </button>
                </div>
            </div>

            {/* Premium Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'TOTAL SYSTEM PLANS', value: stats.totalPlans, desc: 'Expeditions compiled', icon: MapIcon, gradient: 'from-purple-500/20 to-indigo-500/5 border-purple-500/20 text-purple-400 shadow-[0_4px_20px_rgba(168,85,247,0.1)]' },
                    { label: 'ACTIVE EXPEDITIONS', value: stats.activePlans, desc: 'Live target nodes', icon: CheckCircle, gradient: 'from-[#00f2fe]/20 to-indigo-500/5 border-[#00f2fe]/20 text-[#00f2fe] shadow-[0_4px_20px_rgba(0,242,254,0.1)]' },
                    { label: 'TRENDING Prioritizations', value: stats.trendingPlans, desc: 'High momentum nodes', icon: TrendingUp, gradient: 'from-amber-500/20 to-indigo-500/5 border-amber-500/20 text-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.1)]' },
                    { label: 'MOST ACTIVE SYSTEM NODE', value: stats.mostActiveDestination?.split(',')[0], desc: 'Highest generation frequency', icon: Zap, gradient: 'from-rose-500/20 to-indigo-500/5 border-rose-500/20 text-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.1)]' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className={`bg-gradient-to-br ${stat.gradient} border backdrop-blur-md rounded-[24px] p-6 relative overflow-hidden`}
                    >
                        <div className="absolute right-3 top-3 opacity-[0.04]">
                            <stat.icon className="w-24 h-24 stroke-[1]" />
                        </div>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block">{stat.label}</span>
                                <span className="text-3xl font-black text-white font-mono block">{stat.value}</span>
                                <span className="text-[9px] text-gray-400 font-bold block mt-1 uppercase tracking-widest">{stat.desc}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Live Global Expedition Heatmap Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Flat Worldmap Deck (Left 2/3) */}
                <div className="lg:col-span-2 bg-card/85 border border-white/10 rounded-[32px] p-6 shadow-2xl relative flex flex-col gap-6 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent"></div>
                    
                    {/* Visual background pattern */}
                    <div className="absolute inset-0 bg-radial-gradient from-rose-500/[0.02] via-transparent to-transparent pointer-events-none"></div>

                    {/* Top Analytics Panel (Title + Target coords) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 font-mono">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-rose-500">
                                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">GLOBAL EXPEDITION HEATMAP</h3>
                            </div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                                Visualizing live MongoDB expedition density & flat-grid coordinates.
                            </p>
                        </div>
                        
                        {/* Target Satellite Intercept HUD */}
                        <div className="px-4 py-2 bg-gradient-to-r from-indigo-500/[0.05] to-transparent border border-white/5 rounded-2xl flex items-center gap-4 shrink-0 min-w-[240px]">
                            <div className="space-y-0.5">
                                <div className="text-[7px] text-gray-500 font-black uppercase tracking-widest">SATELLITE INTERCEPT</div>
                                {focusCoords ? (
                                    <div className="text-white font-black text-[10px] uppercase tracking-tight">
                                        Latitude: {focusCoords[0].toFixed(3)}°N, Longitude: {focusCoords[1].toFixed(3)}°E
                                    </div>
                                ) : (
                                    <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                        SCANNING FOR PLAN PIN...
                                    </div>
                                )}
                            </div>
                            {focusCoords && (
                                <button 
                                    onClick={() => setFocusCoords(null)}
                                    className="text-[7px] font-black text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 px-2 py-1 rounded-lg uppercase tracking-widest transition-colors ml-auto cursor-pointer"
                                >
                                    RESET
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Display (FULL WIDTH!) */}
                    <div className="w-full relative z-10">
                        <ExpeditionWorldMap 
                            plans={plans} 
                            onFocusSelect={setFocusCoords} 
                            focusCoords={focusCoords} 
                        />
                        {/* Live telemetry badge */}
                        <div className="absolute bottom-4 left-4 bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 z-[1000]">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span className="text-[8px] font-black font-mono text-rose-400 uppercase tracking-widest">LIVE telemetry feed</span>
                        </div>
                    </div>

                    {/* Bottom Instructions Info */}
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3 items-center z-10 font-mono">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="text-[8px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">
                            Interactive navigation enabled. Left click & drag to pan the map; scroll to zoom. Clicking database rows below automatically initiates flight path.
                        </div>
                    </div>
                </div>

                {/* Heatmap Node targets list (Right 1/3) */}
                <div className="bg-card/85 border border-white/10 rounded-[32px] p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#00f2fe]/30 to-transparent"></div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-[8px] text-[#00f2fe] font-black uppercase tracking-widest block">RADAR RANGE SECTOR</span>
                            <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono">ACTIVE TARGET NODES ({plans.length})</h3>
                        </div>

                        {/* Node list feed */}
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 font-mono">
                            {plans.slice(0, 5).map((plan, idx) => {
                                const coords = getCoords(plan.to);
                                const isFocused = focusCoords && focusCoords[0] === coords[0] && focusCoords[1] === coords[1];
                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => setFocusCoords(coords)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                            isFocused
                                            ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] text-rose-400'
                                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${isFocused ? 'bg-rose-500 animate-ping' : 'bg-indigo-500'}`}></div>
                                            <div className="min-w-0">
                                                <span className="text-white font-black text-[10px] uppercase truncate block max-w-[120px]">{plan.to}</span>
                                                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest block mt-0.5">{plan.travelers || 1} AGENTS</span>
                                            </div>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0 transition-all ${
                                            isFocused 
                                            ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                                            : 'bg-white/5 border-white/10 text-gray-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400'
                                        }`}>
                                            {isFocused ? 'LOCKED' : 'FOCUS'}
                                        </span>
                                    </div>
                                );
                            })}
                            {plans.length === 0 && (
                                <div className="text-center py-10 text-gray-600 text-[10px] uppercase font-bold tracking-widest">
                                    No nodes matching search filter
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        <span>SYS SIGNAL: STABLE</span>
                        <span>LATENCY: 14MS</span>
                    </div>
                </div>
            </div>

            {/* Smart Search + Advanced HUD Filters Console */}
            <div className="bg-card/85 backdrop-blur-md border border-white/10 rounded-[28px] p-5 space-y-4 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Field */}
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2.5 flex-1 focus-within:border-indigo-500/40 transition-all shadow-inner">
                        <Search className="w-4.5 h-4.5 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Probe database by destination city, country or creator profile identifier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent text-sm text-gray-200 focus:outline-none w-full placeholder:text-gray-700 font-mono"
                        />
                    </div>

                    {/* Sorting Parameters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-1">
                            {['all', 'trending', 'active', 'inactive'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setStatusFilter(status); setPage(1); }}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        statusFilter === status 
                                        ? 'bg-indigo-500 text-white shadow-md' 
                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Sort Selector Dropdown */}
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-2xl px-3 py-1.5 text-xs text-gray-400 font-mono">
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                                className="bg-transparent focus:outline-none text-gray-300 font-black uppercase text-[9px] tracking-widest cursor-pointer"
                            >
                                <option value="createdAt" className="bg-card text-gray-300">CREATED DATE</option>
                                <option value="engagementScore" className="bg-card text-gray-300">ENGAGEMENT WEIGHT</option>
                                <option value="views" className="bg-card text-gray-300">VIEWS VOLUME</option>
                                <option value="travelers" className="bg-card text-gray-300">TRAVELERS pax</option>
                                <option value="budget" className="bg-card text-gray-300">BUDGET WEIGHT</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                className="pl-1 border-l border-white/10 hover:text-white transition-colors"
                            >
                                {sortOrder === 'desc' ? '▼' : '▲'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Table + Expandable Row */}
            <div className="bg-card/85 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-purple-500 via-indigo-500 to-[#00f2fe]"></div>
                
                {loading ? (
                    /* High-Fidelity Skeleton Loading state */
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex items-center justify-between gap-6 p-4 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5"></div>
                                    <div className="space-y-2">
                                        <div className="h-4.5 w-36 bg-white/5 rounded"></div>
                                        <div className="h-3 w-20 bg-white/5 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-4.5 w-20 bg-white/5 rounded"></div>
                                <div className="h-4.5 w-24 bg-white/5 rounded"></div>
                                <div className="h-8 w-24 bg-white/5 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full overflow-hidden">
                        <table className="w-full text-left font-mono table-fixed">
                            <thead className="bg-white/[0.02] border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="pl-6 md:pl-8 pr-4 py-5 w-[24%] sm:w-[20%]">DESTINATION</th>
                                    <th className="px-4 md:px-6 py-5 hidden sm:table-cell w-[12%]">CREATOR</th>
                                    <th className="px-4 md:px-6 py-5 hidden md:table-cell w-[16%]">ENGAGEMENT WEIGHT</th>
                                    <th className="px-4 md:px-6 py-5 hidden lg:table-cell w-[10%]">TRAVELERS PAX</th>
                                    <th className="px-4 md:px-6 py-5 hidden xl:table-cell w-[15%]">ACTIVITY STRENGTH</th>
                                    <th className="px-4 md:px-6 py-5 hidden lg:table-cell w-[10%]">LAST ACTIVE</th>
                                    <th className="px-4 md:px-6 py-5 w-[11%]">STATUS</th>
                                    <th className="pr-6 md:pr-8 pl-4 py-5 text-right w-[15%] sm:w-[13%]">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[11px] font-medium text-gray-300">
                                {plans.map((plan) => {
                                    const isExpanded = expandedPlanId === plan._id;
                                    const enBadge = getEngagementBadge(plan.engagementScore || 18);
                                    
                                    // Calculate relative Activity progress percentage
                                    const activityPct = Math.min(100, Math.max(10, Math.floor(((plan.views || 120) / 450) * 100)));

                                    return (
                                        <React.Fragment key={plan._id}>
                                            {/* Primary Row */}
                                            <tr
                                                onClick={() => toggleRow(plan._id, plan.to)}
                                                className={`hover:bg-white/[0.01] transition-all duration-200 group cursor-pointer ${
                                                    isExpanded ? 'bg-white/[0.015] border-l-[3px] border-l-indigo-500' : ''
                                                } ${plan.isFlagged ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.05]' : ''}`}
                                            >
                                                <td className="pl-6 md:pl-8 pr-4 py-4.5 overflow-hidden">
                                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                                                            isExpanded 
                                                            ? 'bg-indigo-500/25 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                                            : 'bg-white/[0.02] border-white/10 text-gray-400 group-hover:scale-105'
                                                        }`}>
                                                            <MapIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <div className="text-white font-black tracking-tight text-xs uppercase flex items-center gap-1.5 overflow-hidden">
                                                                <span className="truncate max-w-[85px] sm:max-w-[130px]">{plan.to}</span>
                                                                {plan.isFlagged && (
                                                                    <span className="p-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0" title={`FLAGGED: ${plan.flagReason}`}>
                                                                        <AlertTriangle className="w-3 h-3 animate-bounce" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 max-w-[85px] sm:max-w-[130px] truncate">{plan.name || 'AI INTEL PLAN'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 hidden sm:table-cell overflow-hidden">
                                                    <div className="flex items-center gap-2 overflow-hidden w-full">
                                                        <div className="w-6 h-6 rounded-full border border-white/10 overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                                                            {plan.creator?.profilepicture ? (
                                                                <img src={plan.creator.profilepicture} alt={plan.creator.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-gray-300 text-xs truncate max-w-[70px] md:max-w-[110px]">@{plan.creator?.username || 'system_ai'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 hidden md:table-cell overflow-hidden">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest block w-fit truncate max-w-[130px] ${enBadge.color}`}>
                                                        {enBadge.text} ({plan.engagementScore || 18})
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 hidden lg:table-cell">
                                                    <span className="text-white font-bold text-xs truncate">{plan.travelers || 1} Agents</span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 hidden xl:table-cell overflow-hidden">
                                                    <div className="w-28 md:w-32 space-y-1 overflow-hidden">
                                                        <div className="flex justify-between text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                                                            <span>Views: {plan.views || 120}</span>
                                                            <span>{activityPct}%</span>
                                                        </div>
                                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    activityPct >= 70 ? 'bg-gradient-to-r from-purple-500 to-[#00f2fe]' : 'bg-indigo-500'
                                                                }`}
                                                                style={{ width: `${activityPct}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 hidden lg:table-cell">
                                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] truncate">
                                                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                        <span>{new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4.5 overflow-hidden">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest flex items-center gap-1.5 w-fit shrink-0 truncate ${
                                                        plan.status === 'trending'
                                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse'
                                                        : plan.status === 'inactive'
                                                        ? 'bg-white/5 border-white/5 text-gray-500'
                                                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                                    }`}>
                                                        {plan.status === 'trending' ? '🔥 TRENDING' : plan.status === 'inactive' ? '⚪ INACTIVE' : '🟢 ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="pr-8 pl-4 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2.5">
                                                        {/* Toggle Trending priority */}
                                                        <button
                                                            onClick={(e) => handlePromote(plan._id, plan.to, e)}
                                                            className={`p-2 rounded-xl border transition-all ${
                                                                plan.status === 'trending'
                                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-white/5 hover:border-white/10 hover:text-gray-400'
                                                                : 'bg-white/[0.01] border-white/5 hover:border-amber-500/30 text-gray-500 hover:text-amber-400'
                                                            }`}
                                                            title="Toggle Trending prioritized status"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Safety flag toggler */}
                                                        <button
                                                            onClick={(e) => handleFlagClick(plan._id, e)}
                                                            className={`p-2 rounded-xl border transition-all ${
                                                                plan.isFlagged
                                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-white/5 hover:border-white/10'
                                                                : 'bg-white/[0.01] border-white/5 hover:border-rose-500/30 text-gray-500 hover:text-rose-400'
                                                            }`}
                                                            title="Flag Expedition for review"
                                                        >
                                                            <Flag className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Details view toggle */}
                                                        <button
                                                            onClick={() => toggleRow(plan._id)}
                                                            className={`p-2 rounded-xl border transition-all ${
                                                                isExpanded 
                                                                ? 'bg-indigo-500/20 border-indigo-400 text-white'
                                                                : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-white hover:border-white/20'
                                                            }`}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                        </button>

                                                        {/* Hard database purge */}
                                                        <button
                                                            onClick={(e) => handleDelete(plan._id, plan.to, e)}
                                                            className="p-2 rounded-xl border border-white/5 hover:border-rose-500/20 text-gray-500 hover:text-rose-500 bg-white/[0.01] hover:bg-rose-500/5 transition-all"
                                                            title="Purge Plan itinerary from main database"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable row detail timeline panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={8} className="bg-black/50 border-t border-b border-white/[0.03] p-8">
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                                                    {/* Column 1: Graphic details and Stats */}
                                                                    <div className="space-y-6">
                                                                        {/* Plan landscape graphic card */}
                                                                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg h-44 group-hover:scale-105 transition-transform duration-300">
                                                                            <img
                                                                                src={plan.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800'}
                                                                                alt={plan.to}
                                                                                className="w-full h-full object-cover opacity-50"
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent"></div>
                                                                            <div className="absolute bottom-4 left-5 w-[90%] flex items-end justify-between">
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[7.5px] text-indigo-400 font-black uppercase tracking-widest block">TARGET NODE</span>
                                                                                    <h4 className="text-base font-black text-white uppercase">{plan.to}</h4>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 bg-[#020204]/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                                                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                                                    <span className="text-white font-bold text-[9px]">{plan.star || '4.8'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Advanced Analytics statistics bento grids */}
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            {[
                                                                                { label: 'PLAN VIEWS', val: plan.views || 120, icon: Eye, color: 'text-indigo-400' },
                                                                                { label: 'USER SAVES', val: plan.saves || 24, icon: Bookmark, color: 'text-[#00f2fe]' },
                                                                                { label: 'LIKES COUNT', val: plan.likesCount || 18, icon: Heart, color: 'text-rose-400' },
                                                                                { label: 'COMMENTS', val: plan.commentsCount || 5, icon: MessageSquare, color: 'text-emerald-400' }
                                                                            ].map((bento, bi) => (
                                                                                <div key={bi} className="bg-white/[0.01] border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                                                                                    <div className="p-2 rounded-lg bg-white/[0.02]">
                                                                                        <bento.icon className={`w-4 h-4 ${bento.color}`} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-[7px] text-gray-500 font-bold block uppercase tracking-widest">{bento.label}</span>
                                                                                        <span className="text-white font-black text-xs font-mono">{bento.val}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Local Intelligence alerts */}
                                                                        {plan.local_tips && plan.local_tips.length > 0 && (
                                                                            <div className="space-y-2 bg-indigo-500/[0.02] border border-indigo-500/10 p-4.5 rounded-2xl">
                                                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Local Intelligence Reports
                                                                                </span>
                                                                                <ul className="space-y-1.5 text-[9.5px] text-gray-400 leading-relaxed font-sans list-disc list-inside">
                                                                                    {plan.local_tips.slice(0, 3).map((tip: string, ti: number) => (
                                                                                        <li key={ti} className="italic">"{tip}"</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Column 2: Suggested Itinerary Day Timeline */}
                                                                    <div className="space-y-4 xl:col-span-2">
                                                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">DEPLOYMENT TIMELINE MAP</span>
                                                                            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{plan.days || 3} Days Duration</span>
                                                                        </div>

                                                                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                                                            {plan.suggested_itinerary && plan.suggested_itinerary.length > 0 ? (
                                                                                plan.suggested_itinerary.map((day: any, idx: number) => (
                                                                                    <div key={idx} className="relative pl-9 space-y-1.5">
                                                                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-black border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-black text-[9px] z-10 shadow-lg">
                                                                                            D{day.day}
                                                                                        </div>
                                                                                        <div className="bg-white/[0.01] border border-white/5 p-4.5 rounded-2xl space-y-2">
                                                                                            <h5 className="font-bold text-white text-xs uppercase font-mono tracking-tight">{day.title || `Day ${day.day} Deployment`}</h5>
                                                                                            <div className="space-y-1.5 text-[10px] text-gray-400 font-sans">
                                                                                                {['morning', 'afternoon', 'evening'].map((time) => day[time] && (
                                                                                                    <div key={time} className="flex gap-2.5">
                                                                                                        <span className="text-[7.5px] font-mono font-black text-indigo-400 uppercase w-14 shrink-0 mt-0.5">{time}</span>
                                                                                                        <p className="leading-relaxed">{day[time]}</p>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="text-center py-6 text-gray-600 font-bold text-xs uppercase tracking-widest">
                                                                                    Itinerary details not parsed inside MongoDB document
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Resource allocations breakdown progress lines */}
                                                                        {plan.budget_breakdown && (
                                                                            <div className="space-y-3 pt-3 border-t border-white/5">
                                                                                <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-widest text-gray-500">
                                                                                    <span>Aggregated Resource Allocations</span>
                                                                                    <span className="text-emerald-400 text-xs font-mono">${plan.budget_breakdown.total || plan.budget}</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                                                                    {['flights', 'accommodation', 'activities', 'food'].map((item) => {
                                                                                        const val = plan.budget_breakdown[item] || 0;
                                                                                        const total = plan.budget_breakdown.total || 1;
                                                                                        const pct = Math.min(100, Math.floor((val / total) * 100)) || 25;
                                                                                        return (
                                                                                            <div key={item} className="space-y-1">
                                                                                                <div className="flex justify-between text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                                                                                                    <span>{item}</span>
                                                                                                    <span>${val}</span>
                                                                                                </div>
                                                                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}

                                {plans.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Compass className="w-12 h-12 text-gray-800 animate-pulse" />
                                                <div className="space-y-1">
                                                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">NO DEPLOYED EXPEDITIONS NODES FOUND</p>
                                                    <p className="text-gray-700 text-[10px] uppercase font-bold">Try adjusting your advanced parameters filter or trigger data sync</p>
                                                </div>
                                                <button
                                                    onClick={() => { setSearch(''); setStatusFilter('all'); fetchPlansAnalytics(); }}
                                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all mt-2"
                                                >
                                                    RESET SEARCH FILTERS
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls Footer section */}
                {!loading && plans.length > 0 && (
                    <div className="bg-white/[0.01] border-t border-white/10 px-8 py-5 flex items-center justify-between flex-wrap gap-4 font-mono text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">
                            Showing system page {page} of {totalPages} // Total active records
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3.5 py-2 border border-white/5 hover:border-white/10 rounded-xl bg-white/[0.01] text-[9.5px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white"
                            >
                                PREVIOUS
                            </button>
                            <span className="px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[9.5px]">
                                {page}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3.5 py-2 border border-white/5 hover:border-white/10 rounded-xl bg-white/[0.01] text-[9.5px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-400 hover:text-white"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Futuristic Flag / Safety Protcol Modal overlay */}
            <AnimatePresence>
                {flaggingPlanId && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-rose-500/30 rounded-[32px] max-w-md w-full p-8 space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)]"
                        >
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500 animate-pulse"></div>
                            
                            <div className="flex items-center gap-3 text-rose-500">
                                <Shield className="w-6 h-6 animate-pulse" />
                                <h3 className="text-lg font-black uppercase tracking-widest font-mono">SAFETY SANCTION DECK</h3>
                            </div>

                            <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                                Flagging this plan itinerary alerts users of guidelines violations or tags it under safety review. Leave the reason empty to unflag.
                            </p>

                            <form onSubmit={submitFlagAction} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block font-mono">SANCTION ARGUMENT/REASON</label>
                                    <textarea
                                        value={flagReasonInput}
                                        onChange={(e) => setFlagReasonInput(e.target.value)}
                                        placeholder="Explain the safety violation or regulatory concern here..."
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-rose-500/40 min-h-[90px] placeholder:text-gray-800 text-gray-200"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFlaggingPlanId(null)}
                                        className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all text-gray-500 hover:text-white"
                                    >
                                        ABORT
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md"
                                    >
                                        COMMIT WARNING
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PlansPage;
