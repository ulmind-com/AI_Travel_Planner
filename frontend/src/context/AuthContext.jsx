import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch detailed user profile from backend to populate 'user' object (like Firebase's useUser)
        try {
          const token = await firebaseUser.getIdToken();
          const api_url = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_BACKEND_URL || 'https://adventure-nexus-backend.onrender.com');
          
          // Fallback or attempt to fetch user
          try {
            const response = await axios.get(`${api_url}/api/v1/users/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedUser = response.data.userData || response.data.data || response.data;
            if (fetchedUser) {
                // Map profilepicture to imageUrl for frontend compatibility
                if (fetchedUser.profilepicture) fetchedUser.imageUrl = fetchedUser.profilepicture;
                // Map fullname to fullName
                if (fetchedUser.fullname) fetchedUser.fullName = fetchedUser.fullname;
                // Force firebaseUid and id to ensure hooks like useProfile always get the correct Firebase UID
                fetchedUser.firebaseUid = fetchedUser.firebaseUid || firebaseUser.uid;
                fetchedUser.id = fetchedUser.id || firebaseUser.uid;
            }
            setUser(fetchedUser);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // If user doesn't exist, we might need to create them or wait for signup flow
            setUser({
              id: firebaseUser.uid,
              firebaseUid: firebaseUser.uid, // Keep naming for compatibility
              emailAddresses: [{ emailAddress: firebaseUser.email }],
              fullName: firebaseUser.displayName,
              imageUrl: firebaseUser.photoURL,
            });
          }

        } catch (error) {
          console.error("Error getting token or profile", error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const getToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  const value = {
    currentUser,
    user,
    userId: currentUser?.uid,
    isLoaded: !loading,
    isSignedIn: !!currentUser,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const context = useContext(AuthContext);
  return {
    user: context.user,
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn
  };
}
