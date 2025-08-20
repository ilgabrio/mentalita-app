import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (email, password) => {
    try {
      console.log('📱 Attempting login...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('📱 Login successful');
      return result;
    } catch (error) {
      console.error('📱 Login error:', error.code, error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user profile if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        provider: 'google',
        isAdmin: user.email === 'ilgabrio@gmail.com'
      });
    }

    return result;
  };

  const register = async (email, password, userData = {}) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      uid: user.uid,
      createdAt: new Date(),
      ...userData,
      isAdmin: email === 'ilgabrio@gmail.com'
    });

    return result;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      localStorage.removeItem('onboardingCompleted');
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email);
  };

  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        
        // Se il campo initialQuestionnaireCompleted non esiste, controlla se ha fatto il questionario
        if (!profile.initialQuestionnaireCompleted) {
          try {
            const questionnaireDoc = await getDoc(doc(db, 'users', uid, 'questionnaires', 'initial'));
            if (questionnaireDoc.exists()) {
              console.log('📋 Found completed questionnaire in subcollection');
              profile.initialQuestionnaireCompleted = true;
              // Aggiorna il documento principale
              await updateDoc(doc(db, 'users', uid), {
                initialQuestionnaireCompleted: true
              });
            }
          } catch (error) {
            console.log('Could not check questionnaire subcollection:', error);
          }
        }
        
        setUserProfile(profile);
        const adminStatus = profile.isAdmin === true || profile.email === 'ilgabrio@gmail.com';
        console.log('DEBUG Admin check:', {
          email: profile.email,
          isAdminField: profile.isAdmin,
          isHardcodedAdmin: profile.email === 'ilgabrio@gmail.com',
          finalAdminStatus: adminStatus
        });
        setIsAdmin(adminStatus);
        
        // Check if onboarding is completed and sync with localStorage
        if (profile.onboardingCompleted === true) {
          localStorage.setItem('onboardingCompleted', 'true');
        } else {
          localStorage.removeItem('onboardingCompleted');
        }
        
        return profile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  useEffect(() => {
    console.log('📱 Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('📱 Auth state changed:', user ? user.email : 'null');
      setCurrentUser(user);
      
      if (user) {
        // CONTROLLO IMMEDIATO per admin hardcoded
        if (user.email === 'ilgabrio@gmail.com') {
          console.log('ADMIN HARDCODED RICONOSCIUTO:', user.email);
          setIsAdmin(true);
        }
        
        console.log('📱 Fetching user profile...');
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    fetchUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};