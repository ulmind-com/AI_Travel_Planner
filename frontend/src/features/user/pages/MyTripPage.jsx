import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Plus,
  FileText,
  Upload,
  Download,
  Plane,
  Hotel,
  Camera,
  Navigation,
  Star,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  Compass,
  Settings,
  Share2,
  Heart,
  Eye,
  MoreVertical,
  Filter,
  Search,
  Scan,
  Lock,
  Unlock,
  Copy,
  RefreshCw,
  AlertTriangle,
  Shield,
  Image as ImageIcon,
  File,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'react-hot-toast';
import NavBar from '@/components/NavBar';
import Footer from '@/components/mvpblocks/footer-newsletter';

gsap.registerPlugin(ScrollTrigger);

// MyTripsPage component manages and displays the user's trips
const MyTripsPage = () => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('history'); // 'history' | 'liked'
  const [likedTrips, setLikedTrips] = useState([]);
  const [isLikedLoading, setIsLikedLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    isPublic: false,
    notifications: true
  });

  // Enhanced document states for file uploads and management
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    name: '',
    type: 'passport',
    category: 'identity',
    expiryDate: '',
    notes: '',
    isPrivate: false,
    password: ''
  });
  const [documentPreview, setDocumentPreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [processingOCR, setProcessingOCR] = useState(false);

  const containerRef = useRef(null);
  const headerRef = useRef(null);

  // Enhanced document categories
  const documentCategories = {
    identity: {
      label: 'Identity Documents',
      types: [
        { value: 'passport', label: 'Passport', icon: '🛂' },
        { value: 'drivers_license', label: 'Driver\'s License', icon: '🚗' },
        { value: 'national_id', label: 'National ID', icon: '🆔' },
        { value: 'pan_card', label: 'PAN Card', icon: '🏛️' },
        { value: 'aadhar', label: 'Aadhar Card', icon: '🇮🇳' }
      ]
    },
    travel: {
      label: 'Travel Documents',
      types: [
        { value: 'visa', label: 'Visa', icon: '✈️' },
        { value: 'boarding_pass', label: 'Boarding Pass', icon: '🎫' },
        { value: 'hotel_booking', label: 'Hotel Booking', icon: '🏨' },
        { value: 'travel_insurance', label: 'Travel Insurance', icon: '🛡️' },
        { value: 'vaccination', label: 'Vaccination Certificate', icon: '💉' }
      ]
    },
    financial: {
      label: 'Financial Documents',
      types: [
        { value: 'credit_card', label: 'Credit Card', icon: '💳' },
        { value: 'bank_statement', label: 'Bank Statement', icon: '🏦' },
        { value: 'forex_receipt', label: 'Forex Receipt', icon: '💱' },
        { value: 'receipt', label: 'Receipt', icon: '🧾' }
      ]
    },
    emergency: {
      label: 'Emergency Contacts',
      types: [
        { value: 'emergency_contact', label: 'Emergency Contact', icon: '🚨' },
        { value: 'medical_info', label: 'Medical Information', icon: '⚕️' },
        { value: 'embassy_info', label: 'Embassy Information', icon: '🏛️' }
      ]
    }
  };

  // Mock data
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips from backend
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setIsLikedLoading(true);
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');

        // Fetch My Plans (History)
        const myPlansRes = await fetch(`${backendUrl}/api/v1/plans/my-plans`, { headers });
        if (myPlansRes.ok) {
            const myPlansData = await myPlansRes.json();
            if (myPlansData.status === 'Success') {
              const cleanTitle = (title) => title ? title.replace(/^["']+|["']+$/g, '') : 'Untitled Trip';
              
              const transformedTrips = (myPlansData.data || []).map(plan => {
                if (!plan) return null;
                return {
                  id: plan._id, title: cleanTitle(plan.name), destination: plan.to || 'Unknown Destination', startDate: plan.date || new Date().toISOString(),
                  totalDays: plan.days || 1, status: new Date(plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
                  budget: plan.budget || 20000, spent: plan.cost || Math.floor((plan.budget || 20000) * 0.4), travelers: plan.travelers || 1,
                  image: plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
                  aiGenerated: !!plan.ai_score, progress: 0, currentDay: 0,
                  itineraryItems: plan.itineraryItems || [],
                  documents: plan.documents || [],
                  suggestedItinerary: plan.suggested_itinerary || [],
                  destinationOverview: plan.destination_overview || '',
                  perfectFor: plan.perfect_for || [],
                  budgetBreakdown: plan.budget_breakdown || null,
                  userId: plan.userId || null
                };
              }).filter(Boolean);
              setTrips(transformedTrips);
            }
        }

        // Fetch Liked Plans
        const likedRes = await fetch(`${backendUrl}/api/v1/liked-plans`, { headers });
        if (likedRes.ok) {
            const likedData = await likedRes.json();
            if (likedData.success && likedData.likedPlans) {
              const cleanTitle = (title) => title ? title.replace(/^["']+|["']+$/g, '') : 'Untitled Trip';

              const transformedLiked = (likedData.likedPlans || []).map(plan => {
                if (!plan) return null;
                return {
                  id: plan._id, title: cleanTitle(plan.name), destination: plan.to || 'Unknown Destination', startDate: plan.date || new Date().toISOString(),
                  totalDays: plan.days || 1, status: new Date(plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
                  budget: plan.budget || 30000, spent: plan.cost || Math.floor((plan.budget || 30000) * 0.3), travelers: plan.travelers || 1,
                  image: plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
                  aiGenerated: !!plan.ai_score, progress: 0, currentDay: 0,
                  itineraryItems: plan.itineraryItems || [],
                  documents: plan.documents || [],
                  suggestedItinerary: plan.suggested_itinerary || [],
                  destinationOverview: plan.destination_overview || '',
                  perfectFor: plan.perfect_for || [],
                  budgetBreakdown: plan.budget_breakdown || null,
                  userId: plan.userId || null
                };
              }).filter(Boolean);
              setLikedTrips(transformedLiked);
            }
        }
      } catch (error) {
        console.error('Fetch Trips Error:', error);
      } finally {
        setLoading(false);
        setIsLikedLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const [itineraryItems, setItineraryItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [itinerarySubTab, setItinerarySubTab] = useState('custom');

  // Activity form states
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    day: 1,
    time: '09:00',
    type: 'activity',
    title: '',
    description: '',
    location: '',
    duration: '',
    cost: 0,
    status: 'confirmed'
  });

  // Sync itinerary and documents when a trip is selected
  useEffect(() => {
    if (selectedTrip) {
      setItineraryItems(selectedTrip.itineraryItems || []);
      setDocuments(selectedTrip.documents || []);
    } else {
      setItineraryItems([]);
      setDocuments([]);
    }
  }, [selectedTrip]);

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setDocumentPreview(e.target.result);
      reader.readAsDataURL(file);

      // Simulate OCR processing
      setProcessingOCR(true);
      setTimeout(() => {
        setOcrText(`Extracted text from ${file.name}:\nDocument Number: ABC123456\nExpiry Date: 2030-12-31\nName: John Doe`);
        setProcessingOCR(false);
      }, 2000);
    } else {
      setDocumentPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTrip) return;

    setUploadingDocument(true);
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentForm.name || selectedFile.name);
      formData.append('type', documentForm.type);
      formData.append('category', documentForm.category);
      formData.append('expiryDate', documentForm.expiryDate);
      formData.append('notes', documentForm.notes);
      formData.append('isPrivate', documentForm.isPrivate);

      const res = await fetch(`${backendUrl}/api/v1/plans/${selectedTrip.id}/documents`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.status === 'Success') {
          const updatedDocs = responseData.data;
          setDocuments(updatedDocs);
          
          if (responseData.clonedPlanId) {
            const mappedNewTrip = {
              id: responseData.plan._id,
              title: responseData.plan.name ? responseData.plan.name.replace(/^["']+|["']+$/g, '') : 'Untitled Trip',
              destination: responseData.plan.to || 'Unknown Destination',
              startDate: responseData.plan.date || new Date().toISOString(),
              totalDays: responseData.plan.days || 1,
              status: new Date(responseData.plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
              budget: responseData.plan.budget || 20000,
              spent: responseData.plan.cost || 0,
              travelers: responseData.plan.travelers || 1,
              image: responseData.plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
              aiGenerated: !!responseData.plan.ai_score,
              progress: 0,
              currentDay: 0,
              itineraryItems: responseData.plan.itineraryItems || [],
              documents: responseData.plan.documents || [],
              suggestedItinerary: responseData.plan.suggested_itinerary || [],
              destinationOverview: responseData.plan.destination_overview || '',
              perfectFor: responseData.plan.perfect_for || [],
              budgetBreakdown: responseData.plan.budget_breakdown || null,
              userId: responseData.plan.userId || null
            };
            setTrips(prev => [mappedNewTrip, ...prev]);
            setSelectedTrip(mappedNewTrip);
            setViewMode('history');
            toast.success('Cloned trip to history & uploaded document!');
          } else {
            const updatedTrip = { ...selectedTrip, documents: updatedDocs };
            setSelectedTrip(updatedTrip);
            setTrips(prev => prev.map(t => t.id === selectedTrip.id ? updatedTrip : t));
            toast.success('Document uploaded successfully!');
          }

          // Reset form
          setSelectedFile(null);
          setDocumentPreview(null);
          setDocumentForm({
            name: '',
            type: 'passport',
            category: 'identity',
            expiryDate: '',
            notes: '',
            isPrivate: false,
            password: ''
          });
          setOcrText('');
          setShowAddForm(false);
        } else {
          toast.error(responseData.message || 'Failed to upload document');
        }
      } else {
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('An error occurred during file upload.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!selectedTrip) return;
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
      
      const res = await fetch(`${backendUrl}/api/v1/plans/${selectedTrip.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.status === 'Success') {
          const updatedDocs = responseData.data;
          setDocuments(updatedDocs);

          if (responseData.clonedPlanId) {
            const mappedNewTrip = {
              id: responseData.plan._id,
              title: responseData.plan.name ? responseData.plan.name.replace(/^["']+|["']+$/g, '') : 'Untitled Trip',
              destination: responseData.plan.to || 'Unknown Destination',
              startDate: responseData.plan.date || new Date().toISOString(),
              totalDays: responseData.plan.days || 1,
              status: new Date(responseData.plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
              budget: responseData.plan.budget || 20000,
              spent: responseData.plan.cost || 0,
              travelers: responseData.plan.travelers || 1,
              image: responseData.plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
              aiGenerated: !!responseData.plan.ai_score,
              progress: 0,
              currentDay: 0,
              itineraryItems: responseData.plan.itineraryItems || [],
              documents: responseData.plan.documents || [],
              suggestedItinerary: responseData.plan.suggested_itinerary || [],
              destinationOverview: responseData.plan.destination_overview || '',
              perfectFor: responseData.plan.perfect_for || [],
              budgetBreakdown: responseData.plan.budget_breakdown || null,
              userId: responseData.plan.userId || null
            };
            setTrips(prev => [mappedNewTrip, ...prev]);
            setSelectedTrip(mappedNewTrip);
            setViewMode('history');
            toast.success('Cloned trip to history & deleted document!');
          } else {
            const updatedTrip = { ...selectedTrip, documents: updatedDocs };
            setSelectedTrip(updatedTrip);
            setTrips(prev => prev.map(t => t.id === selectedTrip.id ? updatedTrip : t));
            toast.success('Document deleted successfully!');
          }
        } else {
          toast.error(responseData.message || 'Failed to delete document');
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('An error occurred during deletion.');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;
    
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
      
      const res = await fetch(`${backendUrl}/api/v1/plans/${selectedTrip.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(activityForm)
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.status === 'Success') {
          const updatedItems = responseData.data;
          setItineraryItems(updatedItems);

          if (responseData.clonedPlanId) {
            const mappedNewTrip = {
              id: responseData.plan._id,
              title: responseData.plan.name ? responseData.plan.name.replace(/^["']+|["']+$/g, '') : 'Untitled Trip',
              destination: responseData.plan.to || 'Unknown Destination',
              startDate: responseData.plan.date || new Date().toISOString(),
              totalDays: responseData.plan.days || 1,
              status: new Date(responseData.plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
              budget: responseData.plan.budget || 20000,
              spent: responseData.plan.cost || 0,
              travelers: responseData.plan.travelers || 1,
              image: responseData.plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
              aiGenerated: !!responseData.plan.ai_score,
              progress: 0,
              currentDay: 0,
              itineraryItems: responseData.plan.itineraryItems || [],
              documents: responseData.plan.documents || [],
              suggestedItinerary: responseData.plan.suggested_itinerary || [],
              destinationOverview: responseData.plan.destination_overview || '',
              perfectFor: responseData.plan.perfect_for || [],
              budgetBreakdown: responseData.plan.budget_breakdown || null,
              userId: responseData.plan.userId || null
            };
            setTrips(prev => [mappedNewTrip, ...prev]);
            setSelectedTrip(mappedNewTrip);
            setViewMode('history');
            toast.success('Cloned trip to history & added activity!');
          } else {
            const updatedTrip = { ...selectedTrip, itineraryItems: updatedItems };
            setSelectedTrip(updatedTrip);
            setTrips(prev => prev.map(t => t.id === selectedTrip.id ? updatedTrip : t));
            toast.success('Activity added successfully!');
          }

          setIsAddActivityModalOpen(false);
          // Reset form
          setActivityForm({
            day: 1,
            time: '09:00',
            type: 'activity',
            title: '',
            description: '',
            location: '',
            duration: '',
            cost: 0,
            status: 'confirmed'
          });
        } else {
          toast.error(responseData.message || 'Failed to add activity');
        }
      } else {
        toast.error('Failed to add activity');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('An error occurred while adding activity.');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!selectedTrip) return;
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
      
      const res = await fetch(`${backendUrl}/api/v1/plans/${selectedTrip.id}/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.status === 'Success') {
          const updatedItems = responseData.data;
          setItineraryItems(updatedItems);

          if (responseData.clonedPlanId) {
            const mappedNewTrip = {
              id: responseData.plan._id,
              title: responseData.plan.name ? responseData.plan.name.replace(/^["']+|["']+$/g, '') : 'Untitled Trip',
              destination: responseData.plan.to || 'Unknown Destination',
              startDate: responseData.plan.date || new Date().toISOString(),
              totalDays: responseData.plan.days || 1,
              status: new Date(responseData.plan.date || new Date()) > new Date() ? 'upcoming' : 'completed',
              budget: responseData.plan.budget || 20000,
              spent: responseData.plan.cost || 0,
              travelers: responseData.plan.travelers || 1,
              image: responseData.plan.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
              aiGenerated: !!responseData.plan.ai_score,
              progress: 0,
              currentDay: 0,
              itineraryItems: responseData.plan.itineraryItems || [],
              documents: responseData.plan.documents || [],
              suggestedItinerary: responseData.plan.suggested_itinerary || [],
              destinationOverview: responseData.plan.destination_overview || '',
              perfectFor: responseData.plan.perfect_for || [],
              budgetBreakdown: responseData.plan.budget_breakdown || null,
              userId: responseData.plan.userId || null
            };
            setTrips(prev => [mappedNewTrip, ...prev]);
            setSelectedTrip(mappedNewTrip);
            setViewMode('history');
            toast.success('Cloned trip to history & deleted activity!');
          } else {
            const updatedTrip = { ...selectedTrip, itineraryItems: updatedItems };
            setSelectedTrip(updatedTrip);
            setTrips(prev => prev.map(t => t.id === selectedTrip.id ? updatedTrip : t));
            toast.success('Activity deleted successfully!');
          }
        } else {
          toast.error(responseData.message || 'Failed to delete activity');
        }
      } else {
        toast.error('Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('An error occurred while deleting activity.');
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.trip-card', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
      });

      gsap.from('.itinerary-item', {
        scrollTrigger: {
          trigger: '.itinerary-container',
          start: 'top 85%',
        },
        x: -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [selectedTrip, activeTab]);

  const currentArray = viewMode === 'history' ? trips : likedTrips;
  const filteredTrips = currentArray.filter(trip => {
    if (!trip) return false;
    const title = trip.title || '';
    const destination = trip.destination || '';
    
    const matchesSearch = title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                          destination.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, viewMode]);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage) || 1;
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalSpent = currentArray.reduce((acc, trip) => acc + (trip.spent || 0), 0);
  const uniqueDestinations = new Set(currentArray.map(t => t.destination || '').filter(Boolean)).size;

  const handleDeleteTrip = async (tripId, e) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      if (!token) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      if (viewMode === 'history') {
        const res = await fetch(`${backendUrl}/api/v1/plans/${tripId}`, { method: 'DELETE', headers });
        if (res.ok) {
          toast.success("Plan deleted permanently.");
          setTrips(trips.filter(t => t.id !== tripId));
        } else {
          toast.error("Failed to delete plan.");
        }
      } else {
        const res = await fetch(`${backendUrl}/api/v1/liked-plans/${tripId}`, { method: 'DELETE', headers });
        if (res.ok) {
          toast.success("Plan removed from Liked Plans.");
          setLikedTrips(likedTrips.filter(t => t.id !== tripId));
        } else {
          toast.error("Failed to remove plan.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during deletion.");
    }
  };

  const openShareModal = () => {
    setShareMessage("");
    setIsShareModalOpen(true);
  };

  const submitShareTrip = async () => {
    if (!selectedTrip) return;
    try {
        setIsSharing(true);
        const token = await getToken();
        if (!token) {
           toast.error('Please sign in to share your trip');
           return;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
        const formData = new FormData();
        formData.append('title', `My Trip: ${selectedTrip.title}`);
        formData.append('content', shareMessage || `I planned a trip to ${selectedTrip.destination}! Check it out.`);
        formData.append('category', 'Trip Sharing');
        formData.append('tripId', selectedTrip.id);

        const res = await fetch(`${backendUrl}/api/v1/community/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            toast.success("Trip successfully shared to the community feed!");
            setIsShareModalOpen(false);
        } else {
            toast.error("Failed to share trip.");
        }
    } catch (error) {
        console.error("Error sharing trip:", error);
        toast.error("An error occurred while sharing.");
    } finally {
        setIsSharing(false);
    }
  };

  const openSettingsModal = () => {
    if (selectedTrip) {
      setSettingsForm({
        title: selectedTrip.title,
        isPublic: selectedTrip.status !== 'private',
        notifications: true
      });
      setIsSettingsModalOpen(true);
    }
  };

  const saveSettings = async () => {
    if (!selectedTrip) return;

    const originalTrip = selectedTrip;
    const updatedTrip = {
      ...selectedTrip,
      title: settingsForm.title,
      // If demo trip or updating, keep status or set based on isPublic
      status: settingsForm.isPublic ? 'upcoming' : 'completed'
    };

    // 1. Optimistic Update of local state
    setTrips(prev => prev.map(t => t.id === selectedTrip.id ? updatedTrip : t));
    setSelectedTrip(updatedTrip);
    setIsSettingsModalOpen(false);

    // 2. Perform background API call to persist the changes if it's not a demo/mock trip
    if (selectedTrip.id && !selectedTrip.id.startsWith('demo-')) {
      try {
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await fetch(`${backendUrl}/api/v1/plans/${selectedTrip.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: settingsForm.title
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save settings on server');
        }

        toast.success("Trip settings saved successfully!");
      } catch (error) {
        console.error('Error saving trip settings:', error);
        toast.error("Saved locally, but failed to sync to server.");
        // Rollback state on failure
        setTrips(prev => prev.map(t => t.id === originalTrip.id ? originalTrip : t));
        setSelectedTrip(originalTrip);
      }
    } else {
      toast.success("Trip settings updated locally!");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/50';
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/50';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'flight': return <Plane size={16} />;
      case 'hotel': return <Hotel size={16} />;
      case 'activity': return <Camera size={16} />;
      case 'restaurant': return <Star size={16} />;
      case 'transport': return <Navigation size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'passport': return 'bg-purple-500/10 text-purple-500';
      case 'visa': return 'bg-blue-500/10 text-blue-500';
      case 'boarding_pass': return 'bg-green-500/10 text-green-500';
      case 'hotel_booking': return 'bg-orange-500/10 text-orange-500';
      case 'travel_insurance': return 'bg-red-500/10 text-red-500';
      case 'pan_card': return 'bg-yellow-500/10 text-yellow-500';
      case 'aadhar': return 'bg-indigo-500/10 text-indigo-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDocUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    return `${backendUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground" ref={containerRef}>
      {/* Header */}
      <NavBar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 relative z-10">
        {!selectedTrip ? (
          <div className="space-y-10">
            {/* View Mode Tabs */}
            <div className="flex justify-center mb-12 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-card/25 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 inline-flex shadow-2xl relative">
                <button
                  onClick={() => { setViewMode('history'); setCurrentPage(1); }}
                  className={`flex items-center space-x-2.5 py-3 px-8 rounded-xl transition-all duration-500 font-semibold z-10 text-sm md:text-base ${
                    viewMode === 'history' ? 'text-white' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Compass size={18} className={`transition-transform duration-500 ${viewMode === 'history' ? 'rotate-45 text-white' : 'text-muted-foreground'}`} />
                  <span>Search History</span>
                </button>
                <button
                  onClick={() => { setViewMode('liked'); setCurrentPage(1); }}
                  className={`flex items-center space-x-2.5 py-3 px-8 rounded-xl transition-all duration-500 font-semibold z-10 text-sm md:text-base ${
                    viewMode === 'liked' ? 'text-white' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Heart size={18} className={`transition-transform duration-300 ${viewMode === 'liked' ? 'scale-110 text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                  <span>Saved & Liked Plans</span>
                </button>
                <div 
                  className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-xl shadow-lg transition-all duration-500 ease-out ${viewMode === 'history' ? 'translate-x-0' : 'translate-x-[calc(100%-0px)]'}`}
                  style={{ width: 'calc(50% - 3px)' }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Controls / Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-5 justify-between items-stretch lg:items-center bg-card/20 backdrop-blur-3xl border border-white/5 p-5 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row flex-1 gap-4 items-center">
                <div className="relative w-full sm:max-w-md group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                  </div>
                  <Input
                    className="pl-11 h-12 w-full bg-background/30 border-white/10 hover:border-primary/40 focus:border-primary text-white rounded-xl text-base transition-all duration-300 focus-visible:ring-1 focus-visible:ring-primary/50"
                    placeholder="Search past trips by title or destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Styled Dropdown select container */}
                <div className="relative w-full sm:w-auto group">
                  <select
                    className="appearance-none h-12 w-full sm:w-52 bg-background/30 border border-white/10 hover:border-primary/40 rounded-xl px-4 py-2 pr-10 text-white cursor-pointer transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all" className="bg-card text-white">All Trips</option>
                    <option value="upcoming" className="bg-card text-white">Upcoming</option>
                    <option value="active" className="bg-card text-white">Active</option>
                    <option value="completed" className="bg-card text-white">Completed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground group-hover:text-white transition-colors duration-300">
                    <Filter size={16} />
                  </div>
                </div>
              </div>
              
              <Button className="w-full lg:w-auto h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold px-8 rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                <Plus size={18} className="mr-2 animate-pulse" />
                Plan New Trip
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              {/* Total Trips */}
              <Card className="relative overflow-hidden bg-card/25 backdrop-blur-2xl border-white/5 shadow-2xl group hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10 flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                    <MapPin size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Trips</p>
                    <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{currentArray.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Trips */}
              <Card className="relative overflow-hidden bg-card/25 backdrop-blur-2xl border-white/5 shadow-2xl group hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10 flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Navigation size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Trips</p>
                    <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{currentArray.filter(t => t.status === 'active').length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card className="relative overflow-hidden bg-card/25 backdrop-blur-2xl border-white/5 shadow-2xl group hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10 flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Camera size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Destinations</p>
                    <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{uniqueDestinations}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Spent */}
              <Card className="relative overflow-hidden bg-card/25 backdrop-blur-2xl border-white/5 shadow-2xl group hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10 flex items-center gap-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Star size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Spent</p>
                    <p className="text-2xl font-extrabold text-white tracking-tight mt-1">{inrFormat.format(totalSpent)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trip Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(viewMode === 'history' ? loading : isLikedLoading) ? (
                <div className="col-span-full py-24 flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-primary opacity-40"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 relative" />
                  </div>
                  <p className="text-muted-foreground font-medium text-sm mt-4">Fetching your adventures...</p>
                </div>
              ) : currentArray.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-card/10 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                   <Compass size={56} className="mx-auto mb-5 text-muted-foreground opacity-40 animate-pulse" />
                   <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">No Plans Found</h2>
                   <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">Looks like you haven't {viewMode === 'history' ? 'generated' : 'saved'} any trips yet. Let's create your first adventure!</p>
                </div>
              ) : (
                paginatedTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="group cursor-pointer relative rounded-3xl overflow-hidden min-h-[430px] shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-white/5 hover:border-primary/40 flex flex-col justify-between"
                    onClick={() => setSelectedTrip(trip)}
                  >
                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={trip.image} 
                        alt={trip.title} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    {/* Badges & Actions */}
                    <div className="relative z-10 p-5 flex justify-between items-start">
                      <Badge className={`backdrop-blur-md border border-white/10 text-white font-semibold text-xs tracking-wider uppercase px-3 py-1 rounded-full shadow-lg transition-colors duration-300 ${
                        trip.status === 'completed' ? 'bg-black/40 hover:bg-black/55' : 
                        trip.status === 'active' ? 'bg-emerald-500/25 hover:bg-emerald-500/35 border-emerald-500/20 text-emerald-400' :
                        'bg-blue-500/25 hover:bg-blue-500/35 border-blue-500/20 text-blue-400'
                      }`}>
                        {trip.status}
                      </Badge>
                      
                      <div className="flex gap-2 items-center">
                        {trip.aiGenerated && (
                          <Badge className="bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 border border-white/15 text-white font-bold text-2xs tracking-widest px-2.5 py-1 shadow-md shadow-violet-900/30">
                            ✨ AI PLAN
                          </Badge>
                        )}
                        <button 
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          className="p-2 rounded-xl backdrop-blur-md bg-white/5 text-zinc-400 hover:bg-red-500/25 hover:text-red-400 hover:border-red-500/35 transition-all duration-300 shadow-lg border border-white/10 z-20 relative hover:scale-110 active:scale-95"
                          title={viewMode === 'history' ? "Delete permanently" : "Remove from Liked"}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Bottom Metadata Panel */}
                    <div className="relative z-10 p-6 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-12">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                            <MapPin size={13} className="mr-1 text-primary shrink-0" />
                            <span className="line-clamp-1">{trip.destination}</span>
                          </div>
                          <h3 className="text-2xl font-extrabold text-white group-hover:text-primary transition-colors duration-300 leading-tight tracking-tight line-clamp-2 drop-shadow-md">
                            {trip.title}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-white/10 text-xs">
                          <div className="space-y-0.5">
                            <p className="text-2xs text-zinc-500 uppercase tracking-widest font-bold">Budget</p>
                            <p className="text-white font-bold text-sm tracking-wide">{inrFormat.format(trip.budget)}</p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <p className="text-2xs text-zinc-500 uppercase tracking-widest font-bold">Travelers</p>
                            <p className="text-white font-bold text-sm tracking-wide">{trip.travelers} Pax</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {!(viewMode === 'history' ? loading : isLikedLoading) && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 py-4 z-10 relative">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-card/40 backdrop-blur-md border border-white/10 text-white hover:text-black hover:bg-white"
                >
                  Previous
                </Button>
                
                <div className="flex gap-1 hidden sm:flex">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-medium transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                          : 'bg-card/40 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-card/40 backdrop-blur-md border border-white/10 text-white hover:text-black hover:bg-white"
                >
                  Next
                </Button>
              </div>
            )}
            
          </div>
        ) : (
          // Trip Detail View
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 relative z-10 space-y-6">
            {/* Back Button & Trip Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedTrip(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Trips
              </Button>
              <div className="flex space-x-2">
                <Button 
                  onClick={openShareModal}
                  variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <Share2 size={16} className="mr-2" />
                  Share to Community
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openSettingsModal}
                  className="text-muted-foreground border-border hover:bg-muted transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Trip Info Header */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <img
                    src={selectedTrip.image}
                    alt={selectedTrip.title}
                    className="w-full lg:w-64 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">{selectedTrip.title}</h1>
                        <p className="text-xl text-muted-foreground">{selectedTrip.destination}</p>
                      </div>
                      <Badge className={getStatusColor(selectedTrip.status)}>
                        {selectedTrip.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="text-foreground font-semibold">
                          {new Date(selectedTrip.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-foreground font-semibold">{selectedTrip.totalDays} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-foreground font-semibold">{inrFormat.format(selectedTrip.budget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Travelers</p>
                        <p className="text-foreground font-semibold">{selectedTrip.travelers}</p>
                      </div>
                    </div>

                    {selectedTrip.status === 'active' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Trip Progress</span>
                          <span className="text-foreground">
                            Day {selectedTrip.currentDay} of {selectedTrip.totalDays}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
                            style={{ width: `${selectedTrip.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Navigation */}
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                {[
                  { key: 'overview', label: 'Overview', icon: <Eye size={16} /> },
                  { key: 'itinerary', label: 'Itinerary', icon: <Calendar size={16} /> },
                  { key: 'documents', label: 'Documents', icon: <FileText size={16} /> }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Trip Summary</CardTitle>
                        <CardDescription>
                          AI-generated insights and recommendations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-muted-foreground">
                          Your {selectedTrip.totalDays}-day adventure through {selectedTrip.destination} has been
                          carefully crafted by AI to maximize your experience. This itinerary balances cultural
                          exploration, culinary delights, and memorable activities.
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="text-primary" size={16} />
                              <span className="text-sm text-muted-foreground">Destinations</span>
                            </div>
                            <span className="text-foreground font-semibold">5 cities</span>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Star className="text-yellow-500" size={16} />
                              <span className="text-sm text-muted-foreground">Activities</span>
                            </div>
                            <span className="text-foreground font-semibold">12 planned</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Budget Tracker</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Spent</span>
                            <span className="text-foreground">{inrFormat.format(selectedTrip.spent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="text-green-500">
                              {inrFormat.format(selectedTrip.budget - selectedTrip.spent)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(selectedTrip.spent / selectedTrip.budget) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start border-input text-muted-foreground hover:text-foreground">
                          <Edit3 size={16} className="mr-2" />
                          Edit Trip Details
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-input text-muted-foreground hover:text-foreground">
                          <Share2 size={16} className="mr-2" />
                          Share with Friends
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-input text-muted-foreground hover:text-foreground">
                          <Download size={16} className="mr-2" />
                          Export Itinerary
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Trip Itinerary</h3>
                      <p className="text-sm text-muted-foreground mt-1">Plan and manage your daily activities and events.</p>
                    </div>
                    <Button onClick={() => setIsAddActivityModalOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus size={16} className="mr-2" />
                      Add Activity
                    </Button>
                  </div>

                  {/* Toggle subtabs if AI suggested itinerary exists */}
                  {selectedTrip?.suggestedItinerary && selectedTrip.suggestedItinerary.length > 0 && (
                    <div className="flex space-x-2 bg-muted/30 p-1.5 rounded-xl max-w-md border border-white/5">
                      <button
                        onClick={() => setItinerarySubTab('custom')}
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          itinerarySubTab === 'custom'
                            ? 'bg-card text-white shadow-sm border border-white/5'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        My Custom Itinerary
                      </button>
                      <button
                        onClick={() => setItinerarySubTab('ai')}
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          itinerarySubTab === 'ai'
                            ? 'bg-card text-white shadow-sm border border-white/5'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        ✨ AI Suggested Guide
                      </button>
                    </div>
                  )}

                  {itinerarySubTab === 'custom' ? (
                    <div className="itinerary-container space-y-4">
                      {itineraryItems && itineraryItems.length > 0 ? (
                        itineraryItems.map((item) => (
                          <Card key={item.id} className="itinerary-item bg-card border border-border hover:border-primary/30 transition-all duration-200">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="p-3 bg-muted rounded-xl text-foreground">
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Day {item.day} • {item.time}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {item.cost > 0 && <span className="text-xs bg-muted py-1 px-2.5 rounded-full font-medium text-foreground">₹{item.cost}</span>}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-1.5 h-auto rounded-lg transition-colors"
                                      onClick={() => handleDeleteActivity(item.id)}
                                    >
                                      <Trash2 size={15} />
                                    </Button>
                                  </div>
                                </div>
                                {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
                                {item.location && <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1"><MapPin size={12} /> {item.location}</p>}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card/10">
                          <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                          <h4 className="font-semibold text-foreground mb-1">Your Custom Schedule is Empty</h4>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">Click "Add Activity" to plan your flights, check-ins, dining spots, and excursions.</p>
                          <Button onClick={() => setIsAddActivityModalOpen(true)} variant="outline" className="border-border">
                            <Plus size={16} className="mr-2" /> Add Your First Activity
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedTrip.suggestedItinerary.map((dayPlan) => (
                        <Card key={dayPlan.day} className="bg-card border-border overflow-hidden">
                          <CardHeader className="pb-3 bg-muted/10 border-b border-border">
                            <CardTitle className="text-lg font-bold text-primary">Day {dayPlan.day}: {dayPlan.title || 'Sightseeing'}</CardTitle>
                            {dayPlan.description && <CardDescription className="text-xs mt-1">{dayPlan.description}</CardDescription>}
                          </CardHeader>
                          <CardContent className="space-y-4 pt-4">
                            {dayPlan.morning && (
                              <div className="border-l-2 border-primary/40 pl-4 py-0.5">
                                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Morning</span>
                                <p className="text-foreground text-sm mt-0.5">{dayPlan.morning}</p>
                              </div>
                            )}
                            {dayPlan.afternoon && (
                              <div className="border-l-2 border-primary/40 pl-4 py-0.5">
                                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Afternoon</span>
                                <p className="text-foreground text-sm mt-0.5">{dayPlan.afternoon}</p>
                              </div>
                            )}
                            {dayPlan.evening && (
                              <div className="border-l-2 border-primary/40 pl-4 py-0.5">
                                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Evening</span>
                                <p className="text-foreground text-sm mt-0.5">{dayPlan.evening}</p>
                              </div>
                            )}

                            {dayPlan.activities && dayPlan.activities.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/80">
                                <h5 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Planned Excursions</h5>
                                <div className="space-y-3">
                                  {dayPlan.activities.map((act, i) => (
                                    <div key={i} className="flex justify-between items-start text-sm bg-muted/20 p-3 rounded-xl border border-white/5">
                                      <div>
                                        <p className="font-semibold text-foreground">{act.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1.5">
                                        <Badge variant="secondary" className="text-[10px] py-0.5 px-2 bg-muted/65 text-foreground">{act.time}</Badge>
                                        {act.cost && <p className="text-xs font-semibold text-muted-foreground">{act.cost}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Trip Documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">Keep copies of your travel credentials, tickets, and bookings secure.</p>
                    </div>
                    <Button onClick={() => setShowAddForm(prev => !prev)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {showAddForm ? 'Cancel' : 'Upload Document'}
                    </Button>
                  </div>

                  {showAddForm && (
                    <Card className="bg-card border-border mt-6 overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-lg text-foreground font-semibold">Upload New Document</CardTitle>
                        <CardDescription className="text-xs">Add metadata and store document securely.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="doc-name" className="text-white">Document Name</Label>
                            <Input
                              id="doc-name"
                              value={documentForm.name}
                              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                              placeholder="e.g. Passport, Boarding Pass, Hotel Booking"
                              className="bg-background/50 border-white/10 text-white"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="doc-type" className="text-white">Document Type</Label>
                            <select
                              id="doc-type"
                              value={documentForm.type}
                              onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                            >
                              <option value="passport" className="bg-card text-white">Passport</option>
                              <option value="visa" className="bg-card text-white">Visa</option>
                              <option value="boarding_pass" className="bg-card text-white">Boarding Pass</option>
                              <option value="hotel_booking" className="bg-card text-white">Hotel Booking</option>
                              <option value="id" className="bg-card text-white">Identity Card</option>
                              <option value="other" className="bg-card text-white">Other Document</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="doc-expiry" className="text-white">Expiry Date</Label>
                            <Input
                              id="doc-expiry"
                              type="date"
                              value={documentForm.expiryDate}
                              onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                              className="bg-background/50 border-white/10 text-white"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="doc-category" className="text-white">Category</Label>
                            <select
                              id="doc-category"
                              value={documentForm.category}
                              onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="identity" className="bg-card text-white">Identity</option>
                              <option value="travel" className="bg-card text-white">Travel</option>
                              <option value="medical" className="bg-card text-white">Medical</option>
                              <option value="other" className="bg-card text-white">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="doc-notes" className="text-white">Notes</Label>
                          <Textarea
                            id="doc-notes"
                            value={documentForm.notes}
                            onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                            placeholder="Add brief details about the document..."
                            className="bg-background/50 border-white/10 text-white min-h-[60px]"
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
                          <div className="space-y-0.5">
                            <Label className="text-sm text-white">Keep Private</Label>
                            <p className="text-xs text-muted-foreground">Encrypt the file link and hide from public profiles.</p>
                          </div>
                          <Switch
                            checked={documentForm.isPrivate}
                            onCheckedChange={(checked) => setDocumentForm({ ...documentForm, isPrivate: checked })}
                          />
                        </div>

                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('file-upload').click()}
                        >
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                          />
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          {selectedFile ? (
                            <div>
                              <p className="text-foreground font-semibold text-sm">Selected File: {selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-foreground font-medium">Click to select or drag and drop a file</p>
                              <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>
                          )}
                        </div>

                        {selectedFile && (
                          <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setSelectedFile(null)} disabled={uploadingDocument}>
                              Clear File
                            </Button>
                            <Button onClick={handleUpload} disabled={uploadingDocument} className="bg-primary text-primary-foreground hover:bg-primary/90">
                              {uploadingDocument ? 'Uploading...' : 'Save & Upload'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents && documents.length > 0 ? (
                      documents.map(doc => (
                        <Card key={doc.id} className="bg-card border-border hover:border-primary/20 transition-all duration-200">
                          <CardContent className="p-4 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-3 rounded-xl ${getDocumentTypeColor(doc.type).split(' ')[0]}`}>
                                <FileText className={getDocumentTypeColor(doc.type).split(' ')[1]} size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{doc.size} • {new Date(doc.uploadDate || new Date()).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {doc.url && doc.url !== '#' && (
                                <a href={getDocUrl(doc.url)} target="_blank" rel="noopener noreferrer" download>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white p-1.5 h-auto rounded-lg">
                                    <Download size={16} />
                                  </Button>
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-1.5 h-auto rounded-lg"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-border rounded-2xl bg-card/10">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h4 className="font-semibold text-foreground mb-1">No Documents Stored</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">Store visas, identity cards, reservation PDF files, and receipts securely.</p>
                        <Button onClick={() => setShowAddForm(true)} variant="outline" className="border-border">
                          <Plus size={16} className="mr-2" /> Upload First Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />

      {/* Share to Community Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Share to Community</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Write something about your trip to {selectedTrip?.destination} to share with fellow travelers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder={`I planned an amazing trip to ${selectedTrip?.destination}! Check it out.`}
              className="col-span-4 bg-background/50 border-white/10 text-white min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={submitShareTrip} disabled={isSharing} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSharing ? 'Sharing...' : 'Share Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Trip Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manage preferences and visibility for this trip.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-white">Trip Name</Label>
              <Input
                id="title"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                className="bg-background/50 border-white/10 text-white focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Public Visibility</Label>
                <p className="text-sm text-muted-foreground">Allow others to see this trip on your profile.</p>
              </div>
              <Switch
                checked={settingsForm.isPublic}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, isPublic: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Trip Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive reminders and updates.</p>
              </div>
              <Switch
                checked={settingsForm.notifications}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, notifications: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={saveSettings} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Modal */}
      <Dialog open={isAddActivityModalOpen} onOpenChange={setIsAddActivityModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-card border border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Itinerary Activity</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Add a custom flight, check-in, restaurant, activity, or transport to your schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="act-day" className="text-white">Day of Trip</Label>
                <Input
                  id="act-day"
                  type="number"
                  min="1"
                  max={selectedTrip?.totalDays || 30}
                  value={activityForm.day}
                  onChange={(e) => setActivityForm({ ...activityForm, day: Number(e.target.value) })}
                  className="bg-background/50 border-white/10 text-white"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="act-time" className="text-white">Time</Label>
                <Input
                  id="act-time"
                  type="time"
                  value={activityForm.time}
                  onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                  className="bg-background/50 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-type" className="text-white">Activity Type</Label>
              <select
                id="act-type"
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                required
              >
                <option value="activity" className="bg-card text-white">Activity / Sightseeing</option>
                <option value="flight" className="bg-card text-white">Flight</option>
                <option value="hotel" className="bg-card text-white">Hotel / Check-in</option>
                <option value="restaurant" className="bg-card text-white">Restaurant / Dining</option>
                <option value="transport" className="bg-card text-white">Transport / Transfer</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-title" className="text-white">Title</Label>
              <Input
                id="act-title"
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="e.g. Check-in, Breakfast at Cafe, Eiffel Tower Visit"
                className="bg-background/50 border-white/10 text-white"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-description" className="text-white">Description</Label>
              <Textarea
                id="act-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Details about what you will do..."
                className="bg-background/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-location" className="text-white">Location / Address</Label>
              <Input
                id="act-location"
                value={activityForm.location}
                onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                placeholder="e.g. Shibuya Station, Tokyo"
                className="bg-background/50 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="act-duration" className="text-white">Duration</Label>
                <Input
                  id="act-duration"
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                  placeholder="e.g. 2h, 45m"
                  className="bg-background/50 border-white/10 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="act-cost" className="text-white">Estimated Cost (₹)</Label>
                <Input
                  id="act-cost"
                  type="number"
                  value={activityForm.cost}
                  onChange={(e) => setActivityForm({ ...activityForm, cost: Number(e.target.value) })}
                  className="bg-background/50 border-white/10 text-white"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddActivityModalOpen(false)} className="border-white/10 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add Activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTripsPage;
