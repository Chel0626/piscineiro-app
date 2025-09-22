'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Briefcase, Star, ExternalLink, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import Link from 'next/link';

export function PiscineiroProfileWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<PiscineiroProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profileRef = doc(db, 'piscineiroProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as PiscineiroProfile);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (isLoading || !profile) {
    return (
      <Card className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-600 rounded animate-pulse mb-1" />
              <div className="h-3 bg-gray-600 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExperienceColor = (experiencia: string) => {
    switch (experiencia) {
      case 'iniciante': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediario': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'avancado': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'expert': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getExperienceLabel = (experiencia: string) => {
    switch (experiencia) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      case 'expert': return 'Expert';
      default: return experiencia;
    }
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700 overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full p-4 h-auto hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatarUrl} alt={`${profile.nome} ${profile.sobrenome}`} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(profile.nome, profile.sobrenome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">
                  {profile.nome} {profile.sobrenome}
                </p>
                <p className="text-sm text-gray-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.cidade}, {profile.estado}
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4 border-t border-gray-600 dark:border-gray-700">
            {/* Experiência */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <Badge className={getExperienceColor(profile.experiencia)} variant="secondary">
                {getExperienceLabel(profile.experiencia)}
              </Badge>
            </div>

            {/* Empresa */}
            {profile.empresa && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{profile.empresa}</span>
              </div>
            )}

            {/* Biografia */}
            {profile.biografia && (
              <div className="text-sm text-gray-300 leading-relaxed">
                {profile.biografia.length > 100 
                  ? `${profile.biografia.substring(0, 100)}...`
                  : profile.biografia
                }
              </div>
            )}

            {/* Especialidades */}
            {profile.especialidades && profile.especialidades.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Especialidades:</p>
                <div className="flex flex-wrap gap-1">
                  {profile.especialidades.slice(0, 3).map((especialidade) => (
                    <Badge 
                      key={especialidade} 
                      variant="outline" 
                      className="text-xs border-gray-600 text-gray-300"
                    >
                      {especialidade}
                    </Badge>
                  ))}
                  {profile.especialidades.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs border-gray-600 text-gray-300"
                    >
                      +{profile.especialidades.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${profile.disponivel ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300">
                {profile.disponivel ? 'Disponível' : 'Indisponível'}
              </span>
              {profile.aceitaEmergencia && (
                <Badge variant="outline" className="text-xs border-red-600 text-red-400">
                  Emergência
                </Badge>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2">
              {profile.site && (
                <a 
                  href={profile.site} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Site
                </a>
              )}
              {profile.instagram && (
                <a 
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Instagram
                </a>
              )}
            </div>

            {/* Botão de editar */}
            <div className="pt-2 border-t border-gray-600 dark:border-gray-700">
              <Link href="/setup-piscineiro">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}