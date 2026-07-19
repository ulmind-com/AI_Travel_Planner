import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../context/appContext';
import { 
    Sparkles, MapPin, Calendar, DollarSign, Sliders, Plane, 
    Activity, TrendingUp, ShieldAlert, Award, ChevronDown, 
    ChevronUp, Navigation, Compass, AlertCircle, RefreshCw,
    Moon, Compass as CompassIcon, Zap, Heart, CheckSquare
} from 'lucide-react';
import EmotionIndicator from './EmotionIndicator';
import MoodSuggestionCard from './MoodSuggestionCard';

const ADJUSTMENTS_OPTIONS = [
    { id: 'cheap', label: 'Make it cheaper 💸', directive: 'Make it cheaper' },
    { id: 'relaxing', label: 'Make it more relaxing 🧘', directive: 'Make it more relaxing' },
    { id: 'adventure', label: 'Add adventure 🧗', directive: 'Add adventure' }
];

export default function ItineraryOptimizer() {
    const { getToken, user } = useAppContext();

    // Input States
    const [destination, setDestination] = useState('');
    const [days, setDays] = useState(3);
    const [budget, setBudget] = useState(30000);
    const [emotion, setEmotion] = useState('neutral');
    const [selectedAdjustments, setSelectedAdjustments] = useState([]);
    
    // UI state
    const [userNote, setUserNote] = useState('');
    const [detectingEmotion, setDetectingEmotion] = useState(false);
    const [detectedEmotionData, setDetectedEmotionData] = useState(null);
    const [optimizing, setOptimizing] = useState(false);
    const [optimizedResult, setOptimizedResult] = useState(null);
    const [activeDay, setActiveDay] = useState(1);
    const [error, setError] = useState(null);

    // Run emotion detection on note input
    const handleDetectEmotion = async () => {
        if (!userNote.trim()) return;
        setDetectingEmotion(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await axios.post('/api/v1/ai/emotion-detect', 
                { text: userNote },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.success) {
                const data = res.data.data;
                setDetectedEmotionData(data);
                setEmotion(data.emotion);
            }
        } catch (err) {
            console.error('Emotion detection failed:', err);
            setError('Failed to analyze emotion. Using manual vibe selection.');
        } finally {
            setDetectingEmotion(false);
        }
    };

    // Run Itinerary Optimization API
    const handleOptimizeItinerary = async (currentAdjustments = selectedAdjustments) => {
        if (!destination) {
            setError('Please enter a destination.');
            return;
        }
        setOptimizing(true);
        setError(null);
        try {
            const token = await getToken();
            const adjustmentDirectives = currentAdjustments.map(id => {
                const found = ADJUSTMENTS_OPTIONS.find(opt => opt.id === id);
                return found ? found.directive : id;
            });

            const payload = {
                destination,
                days,
                budget,
                emotion,
                adjustments: adjustmentDirectives
            };

            const res = await axios.post('/api/v1/ai/optimize-itinerary', 
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                setOptimizedResult(res.data.data);
                setActiveDay(1);
            } else {
                throw new Error('API failed to optimize');
            }
        } catch (err) {
            console.error('Itinerary optimization failed:', err);
            setError('Failed to generate optimized itinerary. Please try again.');
        } finally {
            setOptimizing(false);
        }
    };

    // Toggle adjustment checkboxes and re-run optimization immediately for dynamic updates
    const handleToggleAdjustment = (id) => {
        let updated;
        if (selectedAdjustments.includes(id)) {
            updated = selectedAdjustments.filter(item => item !== id);
        } else {
            updated = [...selectedAdjustments, id];
        }
        setSelectedAdjustments(updated);
        
        // If we already have a generated result, trigger dynamic re-optimization
        if (optimizedResult) {
            handleOptimizeItinerary(updated);
        }
    };

    // Quick Select Mood handler
    const handleSelectMood = (selectedId) => {
        setEmotion(selectedId);
        // Reset detected data since manual override happened
        setDetectedEmotionData(prev => prev ? { ...prev, emotion: selectedId } : { emotion: selectedId, intensity: 1.0, intent: 'manual' });
        
        // Trigger re-optimize if plan is already present
        if (optimizedResult) {
            setTimeout(() => {
                handleOptimizeItinerary();
            }, 100);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            MERN + AI Engine
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        Smart Emotion Travel Optimizer
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                        AdventureNexus syncs with your current emotional state to automatically draft, budget, and align distance-optimal travel itineraries.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Step 1: Mood Detection Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input form & Vibe Detector */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">1. Core Setup & Vibe</h2>
                    </div>

                    {/* How are you feeling today? */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tell AI how you are feeling
                        </label>
                        <div className="relative">
                            <textarea
                                value={userNote}
                                onChange={(e) => setUserNote(e.target.value)}
                                placeholder="I feel really stressed and tired from work. I need a peaceful escape to clear my mind..."
                                className="w-full h-24 px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all duration-300 resize-none"
                            />
                            <button
                                type="button"
                                disabled={detectingEmotion || !userNote.trim()}
                                onClick={handleDetectEmotion}
                                className="absolute bottom-3 right-3 px-3 py-1.5 text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl transition-all duration-300 flex items-center gap-1.5"
                            >
                                {detectingEmotion ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                )}
                                Analyze Vibe
                            </button>
                        </div>
                    </div>

                    {/* Detected Vibe */}
                    {detectedEmotionData && (
                        <div className="animate-fadeIn">
                            <EmotionIndicator 
                                emotion={detectedEmotionData.emotion}
                                intensity={detectedEmotionData.intensity}
                                intent={detectedEmotionData.intent}
                            />
                        </div>
                    )}

                    {/* Setup Parameters */}
                    <div className="space-y-4 pt-4 border-t border-slate-800/80">
                        {/* Destination */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Target Destination
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="e.g. Goa, Paris, Manali"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Days and Budget */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Duration (Days)
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={days}
                                        onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Budget (INR)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        step="1000"
                                        min="5000"
                                        value={budget}
                                        onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Adjustments Checkboxes */}
                        <div className="space-y-2.5 pt-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Quick Modifiers (Updates Live)
                            </label>
                            <div className="flex flex-col gap-2">
                                {ADJUSTMENTS_OPTIONS.map((opt) => {
                                    const isSelected = selectedAdjustments.includes(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleToggleAdjustment(opt.id)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-md'
                                                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <span className="text-[10px]">✓</span>}
                                            </div>
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optimize Trigger */}
                        <button
                            type="button"
                            disabled={optimizing || !destination}
                            onClick={() => handleOptimizeItinerary()}
                            className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold uppercase tracking-wider text-sm rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {optimizing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Optimizing Plan...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Optimized Plan
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mood Mapping Detail Card */}
                <div className="lg:col-span-2 flex flex-col justify-between gap-6">
                    <MoodSuggestionCard 
                        currentEmotion={emotion}
                        explanation={optimizedResult?.explanation || "AI will explain its choices once your plan is generated!"}
                        onSelectMood={handleSelectMood}
                    />
                </div>
            </div>

            {/* Step 2: Optimized Output Showcase */}
            {optimizedResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-slate-800/60 animate-fadeIn">
                    
                    {/* Left: Optimizer Score Metrics & Highlights */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Core Optimization score Ring */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center text-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                                Optimizer Health Score
                            </h3>
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                {/* SVG Ring */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r="60"
                                        className="stroke-slate-800 fill-none"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r="60"
                                        className="stroke-emerald-500 fill-none transition-all duration-1000"
                                        strokeWidth="10"
                                        strokeDasharray={376.8}
                                        strokeDashoffset={376.8 - (376.8 * (optimizedResult.metrics?.score || 0.8))}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-extrabold tracking-tight text-white">
                                        {Math.round((optimizedResult.metrics?.score || 0.8) * 100)}%
                                    </span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                                        Optimized
                                    </span>
                                </div>
                            </div>

                            {/* Metrics Breakdown Progress Bars */}
                            <div className="w-full mt-6 space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                                        <span>Distance Efficiency (30%)</span>
                                        <span>{Math.round((optimizedResult.metrics?.distanceEfficiency || 0) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full" 
                                            style={{ width: `${(optimizedResult.metrics?.distanceEfficiency || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                                        <span>Cost Efficiency (20%)</span>
                                        <span>{Math.round((optimizedResult.metrics?.costEfficiency || 0) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-sky-500 rounded-full" 
                                            style={{ width: `${(optimizedResult.metrics?.costEfficiency || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                                        <span>Emotion Match (30%)</span>
                                        <span>{Math.round((optimizedResult.metrics?.emotionMatch || 0) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-pink-500 rounded-full" 
                                            style={{ width: `${(optimizedResult.metrics?.emotionMatch || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
                                        <span>Time Utilization (20%)</span>
                                        <span>{Math.round((optimizedResult.metrics?.timeUtilization || 0) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-orange-500 rounded-full" 
                                            style={{ width: `${(optimizedResult.metrics?.timeUtilization || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Budget breakdown and overview */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                Budget Breakdown
                            </h3>
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Flights / Commute</span>
                                    <span className="font-bold text-white">{optimizedResult.budget_breakdown?.flights} INR</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Accommodation</span>
                                    <span className="font-bold text-white">{optimizedResult.budget_breakdown?.accommodation} INR</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Activities</span>
                                    <span className="font-bold text-white">{optimizedResult.budget_breakdown?.activities} INR</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Food</span>
                                    <span className="font-bold text-white">{optimizedResult.budget_breakdown?.food} INR</span>
                                </div>
                                <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-emerald-400">
                                    <span>Total Computed</span>
                                    <span>{optimizedResult.budget_breakdown?.total} INR</span>
                                </div>
                            </div>
                        </div>

                        {/* Travel Mode info */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Plane className="w-4 h-4 text-indigo-400" />
                                Transit Recommendation
                            </h3>
                            <div className="space-y-3 pt-2 text-xs">
                                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                    <strong>Best Way:</strong> {optimizedResult.how_to_reach?.best_way}
                                </p>
                                {optimizedResult.how_to_reach?.modes?.map((m, index) => (
                                    <div key={index} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1">
                                        <div className="flex justify-between font-bold text-slate-200 text-xs">
                                            <span>{m.type}</span>
                                            <span className="text-indigo-400">{m.estimated_cost}</span>
                                        </div>
                                        <div className="text-slate-400 flex justify-between">
                                            <span>{m.description}</span>
                                            <span>{m.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle + Right: Detailed Itinerary Day-by-Day Planner */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                            
                            {/* Trip title & summary */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">
                                        {optimizedResult.name}
                                    </h2>
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">
                                        🌴 Style: {optimizedResult.travel_style}
                                    </p>
                                </div>
                                <div className="text-xs text-slate-400 font-medium max-w-sm sm:text-right">
                                    {optimizedResult.destination_overview}
                                </div>
                            </div>

                            {/* Highlights */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Trip Highlights
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {optimizedResult.trip_highlights?.map((h, i) => (
                                        <div key={i} className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
                                            <div className="font-extrabold text-sm text-slate-200 mb-1">{h.name}</div>
                                            <div className="text-xs text-slate-400 leading-normal">{h.description}</div>
                                            <div className="text-[10px] text-emerald-400/80 font-mono mt-2 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 inline-block">
                                                Match: {h.match_reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Day Navigation Tabs */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Daily Schedule
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {optimizedResult.suggested_itinerary?.map((dayObj) => (
                                        <button
                                            key={dayObj.day}
                                            onClick={() => setActiveDay(dayObj.day)}
                                            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                                activeDay === dayObj.day
                                                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-900'
                                            }`}
                                        >
                                            Day {dayObj.day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Active Day Detail Display */}
                            {optimizedResult.suggested_itinerary?.map((dayObj) => {
                                if (dayObj.day !== activeDay) return null;
                                return (
                                    <div key={dayObj.day} className="space-y-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-850 animate-fadeIn">
                                        <div className="border-b border-slate-800 pb-3">
                                            <h3 className="text-lg font-extrabold text-white">
                                                Day {dayObj.day}: {dayObj.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                {dayObj.description}
                                            </p>
                                        </div>

                                        {/* Pacing slots */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Morning</div>
                                                <p className="text-xs text-slate-200 leading-normal">{dayObj.morning}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-1">Afternoon</div>
                                                <p className="text-xs text-slate-200 leading-normal">{dayObj.afternoon}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-pink-400 mb-1">Evening</div>
                                                <p className="text-xs text-slate-200 leading-normal">{dayObj.evening}</p>
                                            </div>
                                        </div>

                                        {/* Structured activities List */}
                                        <div className="space-y-2.5 pt-2">
                                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Featured Activities
                                            </span>
                                            <div className="space-y-2">
                                                {dayObj.activities?.map((act, actIndex) => (
                                                    <div key={actIndex} className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="font-extrabold text-sm text-slate-100">{act.name}</div>
                                                            <p className="text-xs text-slate-400 leading-normal max-w-xl">{act.description}</p>
                                                        </div>
                                                        <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1 text-[11px] font-mono shrink-0">
                                                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">{act.time}</span>
                                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{act.cost}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Local Tips & Hints */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Local Advisory & Tips
                                    </h4>
                                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                        {optimizedResult.local_tips?.map((tip, i) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Arrival Checklist
                                    </h4>
                                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                        {optimizedResult.how_to_reach?.arrival_tips?.map((tip, i) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
