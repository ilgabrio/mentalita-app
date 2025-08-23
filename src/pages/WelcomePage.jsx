import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

const WelcomePage = () => {
  const [welcomeData, setWelcomeData] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchWelcomeData();
  }, []);

  const fetchWelcomeData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 WELCOME PAGE - Fetching data...');
      
      // Carica i dati della welcome page
      const welcomeDoc = await getDoc(doc(db, 'welcomePages', 'main'));
      
      console.log('📄 Welcome doc exists:', welcomeDoc.exists());
      
      if (welcomeDoc.exists()) {
        const welcomeInfo = welcomeDoc.data();
        console.log('✅ Welcome data found:', welcomeInfo);
        setWelcomeData(welcomeInfo);
        
        // Se c'è un video selezionato, usalo direttamente
        if (welcomeInfo.selectedVideo) {
          console.log('📹 Using selected video:', welcomeInfo.selectedVideo);
          setVideoData(welcomeInfo.selectedVideo);
        }
        // Fallback per compatibilità con vecchio formato
        else if (welcomeInfo.videoId) {
          console.log('📹 Fetching video by ID:', welcomeInfo.videoId);
          const videoDoc = await getDoc(doc(db, 'videos', welcomeInfo.videoId));
          if (videoDoc.exists()) {
            setVideoData(videoDoc.data());
          }
        }
        // Se non c'è video configurato, prova diversi fallback
        else {
          console.log('📹 No video configured, trying fallbacks...');
          
          try {
            // 1. Prova il video specifico menzionato
            const specificVideoDoc = await getDoc(doc(db, 'videos', 'Rh2Qs8y5RNGPCs7HdFl6'));
            if (specificVideoDoc.exists()) {
              const videoData = specificVideoDoc.data();
              console.log('✅ Found specific welcome video:', videoData);
              setVideoData(videoData);
              return;
            }
            
            // 2. Cerca video con tag "welcome"
            console.log('🔍 Searching for videos with "welcome" tag...');
            const videosQuery = query(
              collection(db, 'videos'),
              where('tags', 'array-contains', 'welcome')
            );
            const videosSnapshot = await getDocs(videosQuery);
            
            if (!videosSnapshot.empty) {
              const welcomeVideo = videosSnapshot.docs[0].data();
              console.log('✅ Found welcome video by tag:', welcomeVideo);
              setVideoData(welcomeVideo);
              return;
            }
            
            // 3. Cerca video con tag "introduzione" o "benvenuto"
            console.log('🔍 Searching for videos with "introduzione" tag...');
            const introQuery = query(
              collection(db, 'videos'),
              where('tags', 'array-contains-any', ['introduzione', 'benvenuto'])
            );
            const introSnapshot = await getDocs(introQuery);
            
            if (!introSnapshot.empty) {
              const introVideo = introSnapshot.docs[0].data();
              console.log('✅ Found intro video by tag:', introVideo);
              setVideoData(introVideo);
              return;
            }
            
            console.log('❌ No welcome videos found in database');
          } catch (error) {
            console.error('❌ Error loading welcome video:', error);
          }
        }
      } else {
        console.log('⚠️ No welcome page found, using fallback');
        // Prova altri possibili document ID
        const alternativeDoc = await getDoc(doc(db, 'welcomePages', 'default'));
        
        if (alternativeDoc.exists()) {
          console.log('✅ Found alternative welcome page');
          const welcomeInfo = alternativeDoc.data();
          setWelcomeData(welcomeInfo);
        } else {
          // Fallback se non ci sono dati
          setWelcomeData({
            title: 'Benvenuto in Mentalità',
            subtitle: 'Il tuo percorso di crescita mentale inizia ora',
            description: 'Scopri come trasformare la tua mente e raggiungere i tuoi obiettivi.',
            buttonText: 'Inizia il tuo percorso',
            backgroundColor: '#1e3a8a',
            textColor: '#ffffff',
            buttonColor: '#10b981',
            isActive: true
          });
        }
      }
    } catch (error) {
      console.error('Error fetching welcome data:', error);
      // Fallback in caso di errore
      setWelcomeData({
        title: 'Benvenuto in Mentalità',
        subtitle: 'Il tuo percorso di crescita mentale inizia ora',
        description: 'Scopri come trasformare la tua mente e raggiungere i tuoi obiettivi.',
        buttonText: 'Inizia il tuo percorso',
        backgroundColor: '#1e3a8a',
        textColor: '#ffffff',
        buttonColor: '#10b981',
        isActive: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourney = async () => {
    try {
      console.log('🚀 WELCOME - Starting journey...', {
        currentUser: currentUser?.uid,
        email: currentUser?.email
      });
      
      // Mark welcome as shown both in localStorage AND database
      localStorage.setItem('welcomeShown', 'true');
      console.log('✅ localStorage welcomeShown set to true');
      
      // Save to database for persistence across devices
      if (currentUser) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            welcomeShown: true,
            welcomeShownAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('✅ Welcome shown saved to database');
        } catch (error) {
          console.error('Error saving welcome shown to database:', error);
        }
        
        console.log('👤 Checking user exercise history...');
        const exercisesQuery = query(
          collection(db, 'exerciseResponses'),
          where('userId', '==', currentUser.uid)
        );
        const exerciseSnapshot = await getDocs(exercisesQuery);
        const hasCompletedExercises = exerciseSnapshot.docs.length > 0;
        
        console.log('📊 Exercise check result:', {
          exerciseCount: exerciseSnapshot.docs.length,
          hasCompletedExercises
        });
        
        // If no exercises completed, go directly to interactive onboarding
        if (!hasCompletedExercises) {
          console.log('🎯 New user with 0 exercises - redirecting to onboarding');
          navigate('/onboarding');
          return;
        }
        
        console.log('👍 User has exercises - redirecting to exercises page');
        navigate('/exercises');
      } else {
        console.log('❌ No current user - redirecting to home');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ WELCOME ERROR:', error);
      // Fallback to home
      navigate('/');
    }
  };

  // Estrae l'ID del video YouTube dall'URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!welcomeData?.isActive) {
    // Se la welcome page non è attiva, reindirizza alla home
    navigate('/');
    return null;
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: welcomeData.backgroundColor || '#1e3a8a',
        color: welcomeData.textColor || '#ffffff'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Welcome Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-12 h-12 text-yellow-300" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {welcomeData.title}
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl md:text-2xl font-medium mb-8 opacity-90">
            {welcomeData.subtitle}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-80">
            {welcomeData.description}
          </p>

          {/* Video Section */}
          {videoData && getYouTubeVideoId(videoData.url) && (
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 mr-2" />
                  <h3 className="text-xl font-semibold">Video Introduttivo</h3>
                </div>
                <p className="mb-6 opacity-80">{videoData.title}</p>
                
                {/* Video Embedded */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoData.url)}?rel=0&modestbranding=1`}
                    title={videoData.title || 'Video Introduttivo'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Esercizi Personalizzati</h3>
              <p className="text-sm opacity-80">Allenamenti mentali su misura per te</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Contenuti Esclusivi</h3>
              <p className="text-sm opacity-80">Articoli, video e audio specializzati</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Crescita Progressiva</h3>
              <p className="text-sm opacity-80">Monitora i tuoi progressi giorno per giorno</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={handleStartJourney}
              className="inline-flex items-center space-x-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl"
              style={{
                backgroundColor: welcomeData.buttonColor || '#10b981',
                color: '#ffffff'
              }}
            >
              <span>{welcomeData.buttonText || 'Inizia il tuo percorso'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
            
            <p className="text-sm opacity-70 mt-4">
              Hai già completato il questionario iniziale ✨
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6 opacity-60">
        <p className="text-sm">
          Inizia oggi stesso il tuo percorso di crescita mentale
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;