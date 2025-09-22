'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiscineiroSetupForm } from '@/components/PiscineiroSetupForm';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function PiscineiroSetupPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      try {
        const profileRef = doc(db, 'piscineiroProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setHasProfile(true);
          // Se já tem perfil, redireciona para o dashboard
          router.push('/dashboard');
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Erro ao verificar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      checkProfile();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleProfileComplete = async (profile: PiscineiroProfile) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'piscineiroProfiles', user.uid);
      await setDoc(profileRef, {
        ...profile,
        userId: user.uid,
        email: user.email,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <PiscineiroSetupForm 
        onComplete={handleProfileComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}