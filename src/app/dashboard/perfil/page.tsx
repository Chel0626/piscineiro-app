'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiscineiroSetupForm } from '@/components/PiscineiroSetupForm';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PerfilPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<PiscineiroProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profileRef = doc(db, 'piscineiroProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setCurrentProfile(profileSnap.data() as PiscineiroProfile);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadProfile();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleProfileUpdate = async (profile: PiscineiroProfile) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'piscineiroProfiles', user.uid);
      await setDoc(profileRef, {
        ...profile,
        userId: user.uid,
        email: user.email,
        criadoEm: currentProfile?.criadoEm || new Date(),
        atualizadoEm: new Date(),
      }, { merge: true });

      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        

        <PiscineiroSetupForm 
          onComplete={handleProfileUpdate}
          initialData={currentProfile}
          isEditing={true}
        />
      </div>
    </div>
  );
}