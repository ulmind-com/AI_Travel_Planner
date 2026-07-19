import { useAuth } from '@/context/AuthContext'; // Custom Firebase Auth context
import { 
    Menu, X, Sun, Moon, Search, Compass, ChevronDown, 
    Sparkles, MapPin, Globe, Award,
    MessageSquare, Bell, User as UserIcon, UserPlus
} from 'lucide-react'; // Icons
import { useEffect, useState } from 'react'; // React hooks
import { Link, useNavigate } from 'react-router-dom'; // Navigation link
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLogo from './AnimatedLogo';
import NotificationCenter from '@/features/social/components/NotificationCenter';

import { Button } from '@/components/ui/button';

function NavBar() {
    const { user, isSignedIn, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Navigation items
    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'My Trips', path: '/trips' },
        { name: 'Reviews', path: '/reviews' },
    ];

    const discoverItems = [
        { 
            name: 'Community', 
            path: '/community', 
            icon: Globe, 
            desc: 'Join fellow travelers and share stories.',
            color: 'text-blue-500'
        },
        { 
            name: 'Trip Planner', 
            path: '/search', 
            icon: Compass, 
            desc: 'AI-powered smart itinerary builder.',
            color: 'text-purple-500'
        },
        { 
            name: 'Experiences', 
            path: '/experiences', 
            icon: Sparkles, 
            desc: 'Curated local activities and hidden gems.',
            color: 'text-pink-500'
        }
    ];

    if (user) {
        discoverItems.push({
            name: 'My Profile',
            path: '/profile',
            icon: UserIcon,
            desc: 'Manage your profile and explore your control center.',
            color: 'text-emerald-500'
        });
    }

    const [discoverOpen, setDiscoverOpen] = useState(false);

    // Mobile menu toggle
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // Navbar scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!mounted) return null;

    return (
        <div>
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        onClick={toggleMobileMenu}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu — Animated slide drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        className="mobile-menu fixed top-0 right-0 h-full w-[85vw] max-w-[320px] bg-background z-50 md:hidden border-l border-border flex flex-col"
                    >
                        <div className="flex justify-between items-center p-5 border-b border-border">
                            <div className="flex items-center space-x-2">
                                <AnimatedLogo size={36} />
                                <span className="text-base font-bold logo-shimmer font-outfit tracking-tight drop-shadow-lg">
                                    AdventureNexus
                                </span>
                            </div>
                            <button
                                onClick={toggleMobileMenu}
                                className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2 rounded-xl hover:bg-accent"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Mobile search bar */}
                        <div className="px-5 py-3 border-b border-border">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const query = e.target.search.value;
                                    if (query) { navigate(`/social-search?q=${query}`); toggleMobileMenu(); }
                                }}
                                className="relative"
                            >
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
                                    <Search size={16} />
                                </div>
                                <input
                                    name="search"
                                    type="text"
                                    placeholder="Search travelers..."
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
                                />
                            </form>
                        </div>

                        <div className="flex flex-col flex-1 overflow-y-auto p-5 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl px-4 py-3 transition-all duration-300 text-sm font-medium"
                                    onClick={toggleMobileMenu}
                                >
                                    {item.name}
                                </Link>
                            ))}

                            <div className="py-2 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Discover</div>
                            {discoverItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="flex items-center gap-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl px-4 py-3 transition-all duration-300 text-sm"
                                    onClick={toggleMobileMenu}
                                >
                                    <item.icon size={18} className={item.color} />
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile bottom actions — chat, notifications, auth */}
                        <div className="border-t border-border p-5 space-y-3">
                            {isSignedIn && (
                                <div className="flex gap-2 mb-3">
                                    <Link to="/chat" onClick={toggleMobileMenu} className="flex-1">
                                        <Button variant="outline" className="w-full rounded-xl h-11 text-xs gap-2 border-white/10 hover:bg-white/5">
                                            <MessageSquare size={16} /> Chat
                                        </Button>
                                    </Link>
                                    <Link to="/search" onClick={toggleMobileMenu} className="flex-1">
                                        <Button className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-bold">
                                            Plan Trip
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {!isSignedIn ? (
                                <Link to="/login" onClick={toggleMobileMenu}>
                                    <Button variant="ghost" className="w-full justify-center text-foreground hover:bg-accent h-11 rounded-xl">
                                        Sign In
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                                        <UserIcon size={16} />
                                        <span className="truncate max-w-[200px]">{user?.email}</span>
                                    </div>
                                    <Button variant="destructive" onClick={() => { logout(); toggleMobileMenu(); }} className="w-full h-11 rounded-xl">
                                        Sign Out
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Navigation */}
            <div className="fixed top-0 w-full z-50 flex justify-center pt-4 sm:pt-6 px-3 sm:px-4">
                <nav
                    className={`transition-all duration-500 ease-in-out px-4 sm:px-6 py-2 rounded-full border border-white/10 glass-card flex items-center justify-between gap-4 sm:gap-6 w-full max-w-6xl ${
                        scrolled ? 'scale-95' : 'scale-100'
                    }`}
                >
                    <div className="flex items-center gap-4 lg:gap-8 flex-1">
                        <Link to="/" className="flex items-center gap-2 group">
                            <AnimatedLogo size={32} />
                            <span className="hidden lg:block font-black text-white tracking-tighter text-lg group-hover:text-primary transition-colors">AdventureNexus</span>
                        </Link>

                        {/* Desktop Search */}
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const query = e.target.search.value;
                                if (query) navigate(`/social-search?q=${query}`);
                            }}
                            className="hidden lg:block relative group w-56 xl:w-72"
                        >
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <Search size={14} />
                            </div>
                            <input 
                                name="search"
                                type="text"
                                placeholder="Search travelers..."
                                className="w-full bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all"
                            />
                        </form>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                        <Link to="/" className="text-white/40 hover:text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">Home</Link>
                        <Link to="/trips" className="text-white/40 hover:text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">My Trips</Link>
                        
                        <div className="relative group" onMouseEnter={() => setDiscoverOpen(true)} onMouseLeave={() => setDiscoverOpen(false)}>
                            <button className="flex items-center gap-1.5 text-white/40 hover:text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                                Discover
                                <ChevronDown size={12} className="group-hover:rotate-180 transition-transform duration-300" />
                            </button>
                            <AnimatePresence>
                                {discoverOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-4 w-80 bg-card/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 grid grid-cols-1 gap-2 shadow-2xl z-50"
                                    >
                                        {discoverItems.map((item) => (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group/item"
                                            >
                                                <div className={`p-2 rounded-xl bg-white/5 ${item.color} group-hover/item:scale-110 transition-transform`}>
                                                    <item.icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-white group-hover/item:text-primary transition-colors uppercase tracking-widest">{item.name}</div>
                                                    <div className="text-[10px] text-white/30 leading-tight mt-1">{item.desc}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Link to="/reviews" className="text-white/40 hover:text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">Reviews</Link>
                    </div>

                    {/* Social & Auth Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                        {isSignedIn ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 border-r border-white/5 pr-4 mr-2">
                                    <Link to="/chat">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 relative">
                                            <MessageSquare size={18} className="text-white/60" />
                                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black animate-pulse"></span>
                                        </Button>
                                    </Link>
                                    <NotificationCenter />
                                </div>
                                <div className="relative group/user">
                                    <button className="flex items-center gap-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors bg-white/5 p-1 pr-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                                            {user?.imageUrl ? (
                                                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={16} className="text-emerald-500" />
                                            )}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-white hidden sm:block">
                                            {user?.username || 'User'}
                                        </span>
                                    </button>
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all">
                                        <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                            <UserIcon size={14} /> Profile
                                        </Link>
                                        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1">
                                            <X size={14} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">Sign In</Button>
                            </Link>
                        )}

                        <Link to="/search" className="hidden sm:block">
                            <Button className="h-10 px-6 bg-white text-black hover:bg-white/90 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                Plan Trip
                            </Button>
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button className="md:hidden text-white/60 hover:text-white transition-colors" onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Spacer to prevent content overlap — responsive */}
            <div className="h-16 sm:h-20" />
        </div>
    );
}

export default NavBar;
