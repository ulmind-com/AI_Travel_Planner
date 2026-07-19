import React, { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/mvpblocks/footer-newsletter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ShieldCheck,
  Lock,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Phone,
  FileCheck,
  HeartPulse,
  Trash2,
  UserPlus,
  Radio,
  MapPin,
  Send,
  Loader2,
  Map as MapIcon,
  Wifi,
  CloudLightning,
  AlertOctagon,
  Users
} from 'lucide-react';
import { useAppContext } from '@/context/appContext';
import toast from 'react-hot-toast';

// Fix for default Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for hazard/alerts
const alertMarkerIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white animate-pulse border-2 border-white shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
  className: 'custom-alert-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const SafetyPage = () => {
  const { axios, getToken, isSignedIn } = useAppContext();
  
  // States
  const [alerts, setAlerts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Alert Reporting State
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    category: 'crime',
    locationName: '',
    lat: '',
    lng: ''
  });

  // Emergency Contact Form State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phoneNumber: '',
    relationship: 'Family'
  });

  // SOS Hold-to-Trigger State
  const [sosProgress, setSosProgress] = useState(0);
  const [isSosHolding, setIsSosHolding] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const sosIntervalRef = useRef(null);

  // 1. Get location & fetch alerts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Fallback to London coordinates
          setCurrentLocation({ lat: 51.505, lng: -0.09 });
        }
      );
    } else {
      setCurrentLocation({ lat: 51.505, lng: -0.09 });
    }
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const params = {};
      if (currentLocation) {
        params.lat = currentLocation.lat;
        params.lng = currentLocation.lng;
      }
      
      const response = await axios.get('/api/v1/plans/safety/alerts', { params });
      if (response.data?.success) {
        setAlerts(response.data.alerts);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchContacts = async () => {
    if (!isSignedIn) return;
    try {
      setLoadingContacts(true);
      const token = await getToken();
      const response = await axios.get('/api/v1/plans/safety/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setContacts(response.data.contacts);
      }
    } catch (err) {
      console.error("Failed to load emergency contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentLocation]);

  useEffect(() => {
    if (isSignedIn) {
      fetchContacts();
    }
  }, [isSignedIn]);

  // Alert category filtering helper
  const filteredAlerts = alerts.filter(alert => {
    if (activeCategory === 'all') return true;
    return alert.category === activeCategory;
  });

  // SOS Hold mechanics
  const startSosHold = () => {
    if (sosActivated) return;
    setIsSosHolding(true);
    setSosProgress(0);
    const duration = 3000; // 3 seconds
    const interval = 50;
    const increment = (interval / duration) * 100;

    sosIntervalRef.current = setInterval(() => {
      setSosProgress((prev) => {
        if (prev >= 100) {
          clearInterval(sosIntervalRef.current);
          triggerSOS();
          return 100;
        }
        return prev + increment;
      });
    }, interval);
  };

  const cancelSosHold = () => {
    if (sosActivated) return;
    setIsSosHolding(false);
    clearInterval(sosIntervalRef.current);
    setSosProgress(0);
  };

  const triggerSOS = async () => {
    setSosActivated(true);
    toast.error("🚨 SOS PANIC ALERT ACTIVATED!", { duration: 5000 });
    
    try {
      const token = await getToken();
      const payload = {
        lat: currentLocation?.lat || 0,
        lng: currentLocation?.lng || 0,
        message: "Emergency! I need immediate help. Please check my coordinates."
      };
      
      const response = await axios.post('/api/v1/plans/safety/sos', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        toast.success("Panic SOS alert successfully dispatched to matched travelers & emergency contacts!", { icon: '🛡️' });
      }
    } catch (err) {
      console.error("SOS dispatch error:", err);
      toast.error("Failed to transmit SOS online, calling local authorities!");
    }
  };

  const deactivateSOS = () => {
    setSosActivated(false);
    setSosProgress(0);
    setIsSosHolding(false);
    toast.success("SOS Standby Mode Restored.");
  };

  // Submit new custom Alert
  const handleReportAlert = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please login to report safety alerts");
      return;
    }
    if (!newAlert.title || !newAlert.description || !newAlert.locationName) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setIsSubmittingAlert(true);
      const token = await getToken();
      const lat = parseFloat(newAlert.lat) || currentLocation?.lat || 51.505;
      const lng = parseFloat(newAlert.lng) || currentLocation?.lng || -0.09;

      const payload = {
        ...newAlert,
        lat,
        lng
      };

      const response = await axios.post('/api/v1/plans/safety/alert', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        toast.success("Safety alert published live!");
        setNewAlert({
          title: '',
          description: '',
          category: 'crime',
          locationName: '',
          lat: '',
          lng: ''
        });
        fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to post alert:", err);
      toast.error(err.response?.data?.message || "Failed to post alert");
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  // Add emergency contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phoneNumber) {
      toast.error("Please fill in contact name and number");
      return;
    }

    try {
      setIsAddingContact(true);
      const token = await getToken();
      const response = await axios.post('/api/v1/plans/safety/contact', newContact, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        toast.success("Emergency contact added successfully");
        setNewContact({ name: '', phoneNumber: '', relationship: 'Family' });
        fetchContacts();
      }
    } catch (err) {
      console.error("Failed to add contact:", err);
      toast.error(err.response?.data?.message || "Failed to add contact");
    } finally {
      setIsAddingContact(false);
    }
  };

  // Delete emergency contact
  const handleDeleteContact = async (contactId) => {
    try {
      const token = await getToken();
      const response = await axios.delete(`/api/v1/plans/safety/contact/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        toast.success("Contact removed");
        fetchContacts();
      }
    } catch (err) {
      console.error("Failed to delete contact:", err);
      toast.error("Failed to delete contact");
    }
  };

  // Map click listener for reporting alerts at specific point
  const MapClickPicker = () => {
    useMapEvents({
      click(e) {
        setNewAlert(prev => ({
          ...prev,
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6)
        }));
        toast.success(`Selected coordinates: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      }
    });
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <NavBar />

      {/* SOS Banner Flasher */}
      {sosActivated && (
        <div className="bg-red-600 text-white font-bold py-3 text-center animate-pulse flex items-center justify-center gap-3 relative z-50 shadow-2xl">
          <AlertOctagon size={24} className="animate-spin" />
          <span>EMERGENCY SOS IS LIVE: SHARING GEOLOCATION COORDINATES</span>
          <Button onClick={deactivateSOS} size="sm" variant="outline" className="bg-white text-red-600 border-none hover:bg-slate-100 rounded-full font-bold px-4 py-1">
            Deactivate
          </Button>
        </div>
      )}

      {/* Header Visual Section */}
      <div className="relative py-16 overflow-hidden bg-slate-900 border-b border-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1501535033-a59376afb713?w=1600&auto=format&fit=crop&q=80")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-transparent"></div>
        
        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge className="mb-4 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-1 uppercase tracking-wider backdrop-blur-md">
            Emergency & Alert Hub
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Travel Securely, Stay <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Nexus Protected</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            Crowd-sourced safety feeds, localized emergency networks, and direct group coordinates sharing. Keep your fellow adventurers safe.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 flex-1 grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: SOS Button & Emergency Contacts */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SOS Circular Press Button */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none"></div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Radio className="text-red-500 animate-pulse" size={20} />
                Instant SOS Beacon
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Press and hold for 3 seconds to alert matched travelers & emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              
              {/* Circular interactive SOS target */}
              <div 
                className="relative w-44 h-44 rounded-full flex items-center justify-center cursor-pointer select-none group/btn transition-transform active:scale-95"
                onMouseDown={startSosHold}
                onMouseUp={cancelSosHold}
                onMouseLeave={cancelSosHold}
                onTouchStart={startSosHold}
                onTouchEnd={cancelSosHold}
              >
                {/* SVG Progress Circle Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="80" 
                    className="stroke-slate-800 fill-none" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="80" 
                    className="stroke-red-500 fill-none transition-all duration-75" 
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - sosProgress / 100)}
                  />
                </svg>

                {/* Inner button structure */}
                <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                  sosActivated 
                    ? 'bg-red-600 text-white animate-bounce' 
                    : isSosHolding 
                      ? 'bg-red-800 scale-95 shadow-red-900/50 shadow-2xl' 
                      : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/20 hover:shadow-2xl'
                }`}>
                  <AlertTriangle size={48} className={isSosHolding ? 'animate-spin' : ''} />
                  <span className="text-lg font-black uppercase mt-1 tracking-widest font-outfit">
                    {sosActivated ? 'SOS LIVE' : isSosHolding ? `${Math.round(sosProgress)}%` : 'HOLD SOS'}
                  </span>
                </div>
              </div>

              {sosActivated && (
                <Button onClick={deactivateSOS} variant="outline" className="mt-6 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-full font-semibold">
                  Cancel Active SOS
                </Button>
              )}

              {!isSignedIn && (
                <p className="text-red-400/80 text-xs text-center mt-4">
                  ⚠️ Sign in is required to dispatch actual coordinates alerts.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts Management */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-red-400" />
                Emergency Contacts
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                These contacts receive SMS/alerts instantly when SOS triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Active Contacts List */}
              {loadingContacts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs">No emergency contacts set up yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div key={contact._id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-all">
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{contact.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{contact.phoneNumber}</span>
                          <span className="text-red-400/80 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-red-950/50 rounded border border-red-900/30">
                            {contact.relationship}
                          </span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleDeleteContact(contact._id)}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Contact Form */}
              {isSignedIn ? (
                <form onSubmit={handleAddContact} className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="contact-name" className="text-xs text-slate-400">Full Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="John Doe"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-950 border-slate-800 text-xs mt-1 h-9 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone" className="text-xs text-slate-400">Phone</Label>
                      <Input
                        id="contact-phone"
                        placeholder="+9198765432"
                        value={newContact.phoneNumber}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="bg-slate-950 border-slate-800 text-xs mt-1 h-9 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="contact-rel" className="text-xs text-slate-400">Relation</Label>
                      <select
                        id="contact-rel"
                        value={newContact.relationship}
                        onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-xs mt-1 h-9 rounded-lg px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="Family">Family</option>
                        <option value="Friend">Friend</option>
                        <option value="Partner">Partner</option>
                        <option value="Medical">Medical</option>
                      </select>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isAddingContact}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-9 w-10 flex items-center justify-center"
                    >
                      {isAddingContact ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-center text-xs text-slate-500">
                  Please log in to manage emergency contacts.
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Map & Live Safety Feeds & Report Alerts Form */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Real-time Alerts Leaflet Map */}
          {currentLocation && (
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
              <CardHeader className="py-4">
                <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapIcon size={18} className="text-orange-400" />
                    Live Alert Radar
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    Click coordinates on map to prefill report coordinates
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative h-[320px]">
                <MapContainer 
                  center={[currentLocation.lat, currentLocation.lng]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* Current Location Marker */}
                  <Marker position={[currentLocation.lat, currentLocation.lng]}>
                    <Popup>Your current position</Popup>
                  </Marker>

                  {/* Active Safety Alerts Markers */}
                  {alerts.map((alert) => (
                    alert.lat && alert.lng ? (
                      <Marker 
                        key={alert._id} 
                        position={[alert.lat, alert.lng]} 
                        icon={alertMarkerIcon}
                      >
                        <Popup className="custom-popup">
                          <div className="p-2 space-y-1">
                            <span className="text-xs uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-red-950/80 border border-red-900/40 text-red-400">
                              {alert.category}
                            </span>
                            <h4 className="font-bold text-sm text-slate-100">{alert.title}</h4>
                            <p className="text-xs text-slate-300">{alert.description}</p>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin size={10} />
                              <span>{alert.locationName}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  ))}

                  <MapClickPicker />
                </MapContainer>
              </CardContent>
            </Card>
          )}

          {/* Crowd-sourced Alert reporting Form & Alerts Feed list side-by-side or stacked */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Live Alerts Feed List */}
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio size={18} className="text-red-400 animate-pulse" />
                    Safety Advisories Feed
                  </span>
                </CardTitle>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {['all', 'crime', 'weather', 'crowd', 'other'].map((cat) => (
                    <Badge 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`cursor-pointer capitalize text-[10px] px-2 py-0.5 border rounded-full transition-all ${
                        activeCategory === cat 
                          ? 'bg-red-500 border-red-500 text-white shadow-lg' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {loadingAlerts ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    <CloudLightning className="mx-auto mb-2 text-slate-600" size={32} />
                    <p className="text-xs">No active alerts matches selection</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {filteredAlerts.map((alert) => (
                      <div 
                        key={alert._id} 
                        className="p-4 bg-slate-950/50 hover:bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all space-y-2 relative"
                      >
                        <div className="flex items-start justify-between">
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 capitalize text-[10px]">
                            {alert.category}
                          </Badge>
                          <span className="text-[10px] text-slate-500">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Live'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-200">{alert.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{alert.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-900/60">
                          <MapPin size={10} className="text-red-400/80" />
                          <span>{alert.locationName}</span>
                          {alert.reporter && (
                            <span className="ml-auto text-slate-500 font-medium">
                              By @{alert.reporter.username || 'traveler'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post/Report a Safety Advisory form */}
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-400" />
                  Report An Incident
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Pinpoint and describe safety hazards to protect other travelers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSignedIn ? (
                  <form onSubmit={handleReportAlert} className="space-y-4">
                    <div>
                      <Label htmlFor="alert-title" className="text-xs text-slate-400">Title / Incident</Label>
                      <Input
                        id="alert-title"
                        placeholder="e.g. Scammers near train station"
                        value={newAlert.title}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-slate-950 border-slate-800 text-xs mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="alert-desc" className="text-xs text-slate-400">Detailed Description</Label>
                      <Textarea
                        id="alert-desc"
                        placeholder="Provide details about the danger, exact location details, safety tips..."
                        value={newAlert.description}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-950 border-slate-800 text-xs mt-1 min-h-[70px]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="alert-cat" className="text-xs text-slate-400">Category</Label>
                        <select
                          id="alert-cat"
                          value={newAlert.category}
                          onChange={(e) => setNewAlert(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 text-xs mt-1 h-10 rounded-lg px-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="crime">Scam / Crime</option>
                          <option value="weather">Extreme Weather</option>
                          <option value="crowd">Crowds / Riot</option>
                          <option value="other">Other Hazards</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="alert-loc-name" className="text-xs text-slate-400">Location Name</Label>
                        <Input
                          id="alert-loc-name"
                          placeholder="e.g. Kyoto Station"
                          value={newAlert.locationName}
                          onChange={(e) => setNewAlert(prev => ({ ...prev, locationName: e.target.value }))}
                          className="bg-slate-950 border-slate-800 text-xs mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="alert-lat" className="text-xs text-slate-400 font-mono">Latitude (Optional)</Label>
                        <Input
                          id="alert-lat"
                          placeholder="e.g. 35.6895"
                          value={newAlert.lat}
                          onChange={(e) => setNewAlert(prev => ({ ...prev, lat: e.target.value }))}
                          className="bg-slate-950 border-slate-800 text-xs mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="alert-lng" className="text-xs text-slate-400 font-mono">Longitude (Optional)</Label>
                        <Input
                          id="alert-lng"
                          placeholder="e.g. 139.6917"
                          value={newAlert.lng}
                          onChange={(e) => setNewAlert(prev => ({ ...prev, lng: e.target.value }))}
                          className="bg-slate-950 border-slate-800 text-xs mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmittingAlert}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl py-2 flex items-center justify-center gap-2 font-bold"
                    >
                      {isSubmittingAlert ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Publish Advisory
                    </Button>
                  </form>
                ) : (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    <Lock className="mx-auto mb-2 text-slate-600" size={32} />
                    <p className="text-xs mb-3">Please sign in to publish safety alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
};

export default SafetyPage;
