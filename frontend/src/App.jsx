import { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Preloader from './components/Preloader';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import { AppProvider, useAppContext } from './context/appContext.jsx';
import ChatAssistant from './components/ChatAssistant';
import { ChatProvider } from './context/ChatContext';
import SEO from './components/SEO';

// ── Skeleton Loader for Suspense Fallback ──
const SuspenseFallback = () => (
  <div className="min-h-screen bg-[#000] flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border border-white/10 border-t-white/80 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-semibold">
        Loading
      </p>
    </div>
  </div>
);

// ── Lazy-loaded Page Components (Code Splitting) ──
// Marketing
const AdventureNexusLanding = lazy(() => import('./features/marketing/pages/LandingPage'));
const HowItWorks = lazy(() => import('./features/marketing/pages/HowItWorksPage'));
const AboutPage = lazy(() => import('./features/marketing/pages/AboutPage'));
const PressPage = lazy(() => import('./features/marketing/pages/PressPage'));
const PartnersPage = lazy(() => import('./features/marketing/pages/PartnersPage'));
const TravelStoriesPage = lazy(() => import('./features/marketing/pages/TravelStoriesPage'));
const ContactPage = lazy(() => import('./features/marketing/pages/ContactPage'));

// Planning
const SearchPage = lazy(() => import('./features/planning/pages/SearchPage'));
const AccommodationsPage = lazy(() => import('./features/planning/pages/HotelPage'));
const FlightsPage = lazy(() => import('./features/planning/pages/FlightsPage'));
const TrainsPage = lazy(() => import('./features/planning/pages/TrainsPage'));
const ExperiencesPage = lazy(() => import('./features/planning/pages/ExperiencesPage'));
const ToursPage = lazy(() => import('./features/planning/pages/ToursPage'));
const MyBookingsPage = lazy(() => import('./features/planning/pages/MyBookingsPage'));
const SharedPlanPage = lazy(() => import('./features/planning/pages/SharedPlanPage'));

// User
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage'));
const MyTripsPage = lazy(() => import('./features/user/pages/MyTripPage'));
const PublicProfilePage = lazy(() => import('./features/user/pages/PublicProfilePage'));
const LoginPage = lazy(() => import('./features/user/pages/LoginPage'));
const SignUpPage = lazy(() => import('./features/user/pages/SignUpPage'));

// Social
const ChatPage = lazy(() => import('./features/social/pages/ChatPage'));
const SocialSearchPage = lazy(() => import('./features/social/pages/SocialSearchPage'));
const SocialHub = lazy(() => import('./components/SocialHub'));

// Community
const SocialHubPage = lazy(() => import('./features/community/pages/SocialHubPage').then(m => ({ default: m.SocialHubPage })));
const GroupPage = lazy(() => import('./features/community/pages/GroupPage').then(m => ({ default: m.GroupPage })));

// Reviews
const AdventureNexusReviews = lazy(() => import('./features/reviews/pages/ReviewPage'));

// Legal
const SafetyPage = lazy(() => import('./features/legal/pages/SafetyPage'));
const TermsPage = lazy(() => import('./features/legal/pages/TermsPage'));
const PrivacyPage = lazy(() => import('./features/legal/pages/PrivacyPage'));
const CookiesPage = lazy(() => import('./features/legal/pages/CookiesPage'));
const AccessibilityPage = lazy(() => import('./features/legal/pages/AccessibilityPage'));

// Support
const HelpPage = lazy(() => import('./features/support/pages/HelpPage'));



// Shared
const PageNotFound = lazy(() => import('./features/shared/pages/PageNotFound'));

// ── Admin (nested lazy) ──
const AdminAuthProvider = lazy(() => import('./admin/context/AdminAuthContext').then(m => ({ default: m.AuthProvider })));
const AdminSocketProvider = lazy(() => import('./admin/context/AdminSocketContext').then(m => ({ default: m.SocketProvider })));
const AdminDashboardLayout = lazy(() => import('./admin/layouts/AdminDashboardLayout'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminUsers = lazy(() => import('./admin/pages/Users'));
const AdminPlans = lazy(() => import('./admin/pages/Plans'));
const AdminReviews = lazy(() => import('./admin/pages/Reviews'));
const AdminModeration = lazy(() => import('./admin/pages/Moderation'));
const AdminAuditLogs = lazy(() => import('./admin/pages/AuditLogs'));
const AdminSettings = lazy(() => import('./admin/pages/Settings'));
const AdminApiAnalytics = lazy(() => import('./admin/pages/ApiAnalytics'));
const AdminMail = lazy(() => import('./admin/pages/Mail'));
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const AdminProtectedRoute = lazy(() => import('./admin/components/AdminProtectedRoute'));


// ── Main Content ──
const AppContent = () => {
  const { pathname } = useLocation();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const { isSignedIn, user } = useAppContext();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Preloader isLoading={loading} />

      {/* Toast notification — styled for dark theme */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0A0A0A',
            color: '#F5F5F7',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#000' },
          },
        }}
      />

      {/* Routes with AnimatePresence for page transitions */}
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* ── Public Routes ── */}
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/signup" element={<PageTransition><SignUpPage /></PageTransition>} />
              <Route path="/works" element={<PageTransition><HowItWorks /></PageTransition>} />
              <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
              <Route path="/hotels" element={<PageTransition><AccommodationsPage /></PageTransition>} />
              <Route path="/flights" element={<PageTransition><FlightsPage /></PageTransition>} />
              <Route path="/trains" element={<PageTransition><TrainsPage /></PageTransition>} />
              <Route path="/trips" element={<PageTransition><MyTripsPage /></PageTransition>} />
              <Route path="/experiences" element={<PageTransition><ExperiencesPage /></PageTransition>} />
              <Route path="/tours" element={<PageTransition><ToursPage /></PageTransition>} />
              <Route path="/press" element={<PageTransition><PressPage /></PageTransition>} />
              <Route path="/partners" element={<PageTransition><PartnersPage /></PageTransition>} />
              <Route path="/help" element={<PageTransition><HelpPage /></PageTransition>} />
              <Route path="/safety" element={<PageTransition><SafetyPage /></PageTransition>} />
              <Route path="/community" element={<PageTransition><SocialHubPage /></PageTransition>} />
              <Route path="/community/group/:groupId" element={<PageTransition><GroupPage /></PageTransition>} />
              <Route path="/stories" element={<PageTransition><TravelStoriesPage /></PageTransition>} />
              <Route path="/social-search" element={<PageTransition><SocialSearchPage /></PageTransition>} />
              <Route path="/profile/:username" element={<PageTransition><ProfilePage /></PageTransition>} />
              <Route path="/user/profile/:firebaseUid" element={<PageTransition><PublicProfilePage /></PageTransition>} />
              <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
              <Route path="/cookies" element={<PageTransition><CookiesPage /></PageTransition>} />
              <Route path="/accessibility" element={<PageTransition><AccessibilityPage /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
              <Route path="/shared-plan/:id" element={<PageTransition><SharedPlanPage /></PageTransition>} />


              {/* ── Protected Routes ── */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <PageTransition><ProfilePage /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <PageTransition><ChatPage /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <PageTransition><SearchPage /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/reviews" element={
                <ProtectedRoute>
                  <PageTransition><AdventureNexusReviews /></PageTransition>
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <PageTransition><MyBookingsPage /></PageTransition>
                </ProtectedRoute>
              } />

              {/* ── Admin Routes ── */}
              <Route path="/admin/*" element={
                <Suspense fallback={<SuspenseFallback />}>
                  <AdminAuthProvider>
                    <Routes>
                      <Route path="login" element={<AdminLogin />} />
                      <Route element={<AdminProtectedRoute />}>
                        <Route element={
                          <Suspense fallback={<SuspenseFallback />}>
                            <AdminSocketProvider>
                              <AdminDashboardLayout />
                            </AdminSocketProvider>
                          </Suspense>
                        }>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="plans" element={<AdminPlans />} />
                          <Route path="reviews" element={<AdminReviews />} />
                          <Route path="moderation" element={<AdminModeration />} />
                          <Route path="audit" element={<AdminAuditLogs />} />
                          <Route path="analytics" element={<AdminApiAnalytics />} />
                          <Route path="mail" element={<AdminMail />} />
                          <Route path="settings" element={<AdminSettings />} />
                          <Route index element={<Navigate to="dashboard" replace />} />
                        </Route>
                      </Route>
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </AdminAuthProvider>
                </Suspense>
              } />

              {/* ── Landing ── */}
              <Route path="/" element={<PageTransition><AdventureNexusLanding /></PageTransition>} />

              {/* ── 404 ── */}
              <Route path="*" element={<PageTransition><PageNotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>

      {/* Floating Chat Assistant */}
      <ChatAssistant />
    </>
  );
};

// Main App component
function App() {
  return (
    <AppProvider>
      <ChatProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ChatProvider>
    </AppProvider>
  );
}

export default App;
