import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, AlertCircle, ArrowRight, Chrome } from 'lucide-react';
import AnimatedLogo from '@/components/AnimatedLogo';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const registerUserOnBackend = async (firebaseUser, displayName) => {
        const api_url = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
        try {
            const token = await firebaseUser.getIdToken();
            await axios.post(`${api_url}/api/v1/users/register`, {
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                username: displayName || firebaseUser.displayName || 'Traveler',
                profileImage: firebaseUser.photoURL || ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Backend registration failed:", err);
            // Optionally handle this, but Firebase account is created
        }
    };

    const handleEmailSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            // Sync with our backend
            await registerUserOnBackend(userCredential.user, name);
            
            toast.success("Account created successfully!");
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to create account.');
            toast.error("Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            
            // Sync with our backend
            await registerUserOnBackend(userCredential.user, userCredential.user.displayName);
            
            toast.success("Successfully logged in with Google!");
            navigate('/');
        } catch (err) {
            setError(err.message || 'Google sign up failed.');
            toast.error("Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Left section - SignUp Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 order-2 lg:order-1">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
                        <p className="text-white/40 font-medium text-sm">Join AdventureNexus and start exploring.</p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button 
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="w-full h-14 bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 transition-all"
                        >
                            <Chrome size={18} />
                            Continue with Google
                        </Button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-white/20 text-xs font-black uppercase tracking-widest">Or email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                    <Input 
                                        type="text" 
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                    <Input 
                                        type="email" 
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                    <Input 
                                        type="password" 
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(20,184,166,0.3)] transition-all"
                            >
                                {loading ? "Creating account..." : "Sign Up"}
                                {!loading && <ArrowRight size={16} />}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-white/40">
                            Already have an account?{' '}
                            <Link to="/login" className="text-white hover:text-teal-400 transition-colors font-bold">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right section - Branding */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10 border-l border-white/5 bg-white/[0.02] order-1 lg:order-2">
                <div className="flex justify-end">
                    <Link to="/" className="flex items-center gap-3 w-fit">
                        <AnimatedLogo size={40} />
                        <span className="font-black text-2xl text-white tracking-tighter">AdventureNexus</span>
                    </Link>
                </div>
                
                <div className="max-w-md ml-auto text-right">
                    <h1 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
                        Start Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Today.</span>
                    </h1>
                    <p className="text-white/50 text-lg font-medium leading-relaxed ml-auto">
                        Connect with thousands of travelers. Discover hidden gems, plan trips together, and build lasting memories.
                    </p>
                </div>
                
                <div className="text-sm font-bold tracking-widest uppercase text-white/30 text-right">
                    Adventure awaits.
                </div>
            </div>
        </div>
    );
}
