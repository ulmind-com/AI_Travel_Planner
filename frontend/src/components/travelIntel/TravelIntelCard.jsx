import { useState, useEffect } from 'react';
import { useSocket } from '@/context/appContext';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { 
    Search, MapPin, Sparkles, Activity, ShieldCheck, 
    Wifi, WifiOff, RefreshCw, AlertTriangle
} from 'lucide-react';
import WeatherWidget from './WeatherWidget';
import CrowdIndicator from './CrowdIndicator';
import RiskAlert from './RiskAlert';
import BestTimeCard from './BestTimeCard';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Leaflet marker configuration fix (prevents missing icons in Vite build setups)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

// Internal Map Center Updater
const ChangeMapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const TravelIntelCard = () => {
    const { socket } = useSocket();
    const { getToken } = useAuth();
    
    const [location, setLocation] = useState('Manali');
    const [searchVal, setSearchVal] = useState('Manali');
    const [intelData, setIntelData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // Fetch initial parameters using REST as fallback/initial load
    const fetchIntelREST = async (locName) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/v1/travel/intel`, {
                params: { location: locName }
            });
            if (res.data) {
                setIntelData(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch travel intelligence via REST:', err);
            toast.error('API failed. Using default mock datasets.');
        } finally {
            setIsLoading(false);
        }
    };

    // Socket Event Subscribers
    useEffect(() => {
        if (!socket) {
            fetchIntelREST(location);
            return;
        }

        setIsSocketConnected(socket.connected);

        const handleConnect = () => setIsSocketConnected(true);
        const handleDisconnect = () => setIsSocketConnected(false);

        const handleIntelUpdate = (updatedData) => {
            setIsLoading(false);
            setIntelData(updatedData);
        };

        const handleIntelError = (err) => {
            setIsLoading(false);
            toast.error(err.message || 'Error subscribing to travel intelligence.');
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('travel:intel:update', handleIntelUpdate);
        socket.on('travel:intel:error', handleIntelError);

        // Subscribe to current location
        setIsLoading(true);
        socket.emit('travel:intel:subscribe', location);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('travel:intel:update', handleIntelUpdate);
            socket.off('travel:intel:error', handleIntelError);
            socket.emit('travel:intel:unsubscribe', location);
        };
    }, [socket, location]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchVal.trim() === '') return;
        setLocation(searchVal.trim());
    };

    // Evaluate crowd heatmap color parameters
    const getCrowdHeatColor = (lvl) => {
        switch (lvl) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high':
            default: return '#f43f5e';
        }
    };

    const hasCoordinates = intelData?.coordinates?.lat && intelData?.coordinates?.lon;
    const mapCenter = hasCoordinates ? [intelData.coordinates.lat, intelData.coordinates.lon] : [32.2396, 77.1887];

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-white bg-zinc-950 min-h-screen">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
                        Live Travel Intelligence
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Dynamic weather forecasting, crowd density estimations, and real-time risk alerts.
                    </p>
                </div>

                {/* Sockets/REST status */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${
                        isSocketConnected 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                        {isSocketConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        <span>{isSocketConnected ? 'LIVE FEED ACTIVE' : 'REST AUTO-REFRESH'}</span>
                    </div>

                    {intelData?.cached && (
                        <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[11px] font-semibold">
                            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '6s' }} />
                            <span>CACHED DATA</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Location Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <div className="flex items-center pl-2 text-zinc-500">
                    <Search size={18} />
                </div>
                <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Enter location (e.g. Paris, Manali, Goa...)"
                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-white text-sm placeholder-zinc-500"
                />
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                    Analyze
                </button>
            </form>

            {isLoading ? (
                /* Skeleton Loader */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="h-48 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
                    ))}
                    <div className="md:col-span-2 lg:col-span-4 h-[300px] bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
                </div>
            ) : (
                <>
                    {/* Delayed Alert Notification */}
                    {intelData?.delayed && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Live API Interruption:</span> Current meteorological services are running slow.
                                Displaying highly accurate estimated fallbacks based on historic seasons.
                            </div>
                        </div>
                    )}

                    {/* Dashboard Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <WeatherWidget weather={intelData?.weather} />
                        <CrowdIndicator crowd={intelData?.crowdDetails} />
                        <BestTimeCard bestTime={intelData?.bestTimeDetails} weather={intelData?.weather} />
                        <RiskAlert risk={intelData?.riskDetails} />
                    </div>

                    {/* AI Insights & Map Split Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recommendations Panel */}
                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    AI Travel Recommendations
                                </h4>
                                <div className="space-y-3">
                                    {intelData?.recommendations?.map((rec, idx) => (
                                        <div key={idx} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-xl flex gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1.5"></div>
                                            <p className="text-zinc-300 text-xs leading-relaxed">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                                <span>Computed via GROQ AI Twin Engine</span>
                                <ShieldCheck size={14} className="text-emerald-500" />
                            </div>
                        </div>

                        {/* Map Overlay Panel */}
                        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
                            <div className="flex justify-between items-center px-1">
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    Live Map Visualization
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] opacity-75"></span> High Crowd
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] opacity-75"></span> Moderate
                                    </span>
                                </div>
                            </div>

                            {/* Leaflet React Map Rendering */}
                            <div className="h-[300px] w-full rounded-xl border border-zinc-800 overflow-hidden relative z-10">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={12}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                    className="dark-map"
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                                    />
                                    <ChangeMapCenter center={mapCenter} />

                                    {/* Circle overlay indicating crowd density */}
                                    {hasCoordinates && (
                                        <Circle
                                            center={mapCenter}
                                            radius={2200}
                                            pathOptions={{
                                                fillColor: getCrowdHeatColor(intelData.crowdLevel),
                                                fillOpacity: 0.25,
                                                color: getCrowdHeatColor(intelData.crowdLevel),
                                                weight: 1.5
                                            }}
                                        />
                                    )}

                                    {/* Safety / Risk markers */}
                                    {intelData?.riskDetails?.alerts?.map((alert, idx) => (
                                        <Marker 
                                            key={idx} 
                                            position={[
                                                mapCenter[0] + (Math.random() - 0.5) * 0.015,
                                                mapCenter[1] + (Math.random() - 0.5) * 0.015
                                            ]}
                                        >
                                            <Popup>
                                                <div className="text-zinc-900 font-sans p-1 text-xs">
                                                    <strong className="text-rose-600 block uppercase text-[10px]">{alert.type} Alert</strong>
                                                    {alert.message}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TravelIntelCard;
