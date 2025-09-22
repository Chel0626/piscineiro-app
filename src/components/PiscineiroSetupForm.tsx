'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, MapPin, Briefcase, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { piscineiroProfileSchema, type PiscineiroProfile, especialidadesOptions, estadosBrasil } from '@/lib/schemas/piscineiroSchema';
import { toast } from 'sonner';

interface PiscineiroSetupFormProps {
  onComplete: (profile: PiscineiroProfile) => void;
  onSkip?: () => void;
}

export function PiscineiroSetupForm({ onComplete, onSkip }: PiscineiroSetupFormProps) {
  const [currentTab, setCurrentTab] = useState('basico');
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PiscineiroProfile>({
    resolver: zodResolver(piscineiroProfileSchema),
    defaultValues: {
      disponivel: true,
      aceitaEmergencia: false,
      especialidades: [],
    }
  });

  const watchedValues = watch();
  
  // Calcular progresso do formulário
  const calculateProgress = () => {
    const requiredFields = ['nome', 'sobrenome', 'email', 'telefone', 'cidade', 'estado', 'cep', 'experiencia'];
    const filledFields = requiredFields.filter(field => {
      const value = watchedValues[field as keyof PiscineiroProfile];
      return value && value !== '';
    });
    return (filledFields.length / requiredFields.length) * 100;
  };

  const handleEspecialidadeToggle = (especialidade: string) => {
    const updated = selectedEspecialidades.includes(especialidade)
      ? selectedEspecialidades.filter(e => e !== especialidade)
      : [...selectedEspecialidades, especialidade];
    
    setSelectedEspecialidades(updated);
    setValue('especialidades', updated);
  };

  const onSubmit = async (data: PiscineiroProfile) => {
    setIsSubmitting(true);
    try {
      // Adicionar timestamps
      const profileData = {
        ...data,
        especialidades: selectedEspecialidades,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      // Aqui você salvaria no Firebase/Firestore
      console.log('Perfil do piscineiro:', profileData);
      
      toast.success('Perfil criado com sucesso!');
      onComplete(profileData);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao criar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Complete seu perfil profissional
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vamos configurar seu perfil para que seus clientes possam te conhecer melhor
        </p>
        <div className="w-full max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-1">{Math.round(progress)}% completo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basico" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="localizacao" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Local
            </TabsTrigger>
            <TabsTrigger value="profissional" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Profissional
            </TabsTrigger>
            <TabsTrigger value="sobre" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sobre
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais para identificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      {...register('nome')}
                      placeholder="Seu nome"
                    />
                    {errors.nome && (
                      <p className="text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sobrenome">Sobrenome *</Label>
                    <Input
                      id="sobrenome"
                      {...register('sobrenome')}
                      placeholder="Seu sobrenome"
                    />
                    {errors.sobrenome && (
                      <p className="text-sm text-red-600">{errors.sobrenome.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      {...register('telefone')}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.telefone && (
                      <p className="text-sm text-red-600">{errors.telefone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localizacao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
                <CardDescription>
                  Onde você atende seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      {...register('cidade')}
                      placeholder="São Paulo"
                    />
                    {errors.cidade && (
                      <p className="text-sm text-red-600">{errors.cidade.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select onValueChange={(value) => setValue('estado', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosBrasil.map(estado => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.estado && (
                      <p className="text-sm text-red-600">{errors.estado.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      placeholder="00000-000"
                    />
                    {errors.cep && (
                      <p className="text-sm text-red-600">{errors.cep.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço completo (opcional)</Label>
                  <Input
                    id="endereco"
                    {...register('endereco')}
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Experiência Profissional</CardTitle>
                <CardDescription>
                  Suas qualificações e especialidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empresa">Empresa (opcional)</Label>
                    <Input
                      id="empresa"
                      {...register('empresa')}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experiencia">Nível de experiência *</Label>
                    <Select onValueChange={(value) => setValue('experiencia', value as 'iniciante' | 'intermediario' | 'avancado' | 'expert')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante (0-2 anos)</SelectItem>
                        <SelectItem value="intermediario">Intermediário (2-5 anos)</SelectItem>
                        <SelectItem value="avancado">Avançado (5-10 anos)</SelectItem>
                        <SelectItem value="expert">Expert (10+ anos)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experiencia && (
                      <p className="text-sm text-red-600">{errors.experiencia.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Especialidades</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {especialidadesOptions.map((especialidade) => (
                      <div key={especialidade} className="flex items-center space-x-2">
                        <Checkbox
                          id={especialidade}
                          checked={selectedEspecialidades.includes(especialidade)}
                          onCheckedChange={() => handleEspecialidadeToggle(especialidade)}
                        />
                        <Label htmlFor={especialidade} className="text-sm">
                          {especialidade}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedEspecialidades.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEspecialidades.map((esp) => (
                        <Badge key={esp} variant="secondary">
                          {esp}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sobre" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sobre Você</CardTitle>
                <CardDescription>
                  Conte um pouco sobre seu trabalho e contatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="biografia">Biografia (opcional)</Label>
                  <Textarea
                    id="biografia"
                    {...register('biografia')}
                    placeholder="Conte um pouco sobre sua experiência, método de trabalho..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {watchedValues.biografia?.length || 0}/500 caracteres
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="site">Site (opcional)</Label>
                    <Input
                      id="site"
                      {...register('site')}
                      placeholder="https://seusite.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram (opcional)</Label>
                    <Input
                      id="instagram"
                      {...register('instagram')}
                      placeholder="@seuinstagram"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsapp"
                    {...register('whatsapp')}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Atendimento</CardTitle>
                <CardDescription>
                  Como você gostaria de aparecer para os clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disponivel"
                      {...register('disponivel')}
                      defaultChecked={true}
                    />
                    <Label htmlFor="disponivel">
                      Perfil ativo - aceitar novos clientes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aceitaEmergencia"
                      {...register('aceitaEmergencia')}
                    />
                    <Label htmlFor="aceitaEmergencia">
                      Aceitar chamadas de emergência
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="raioAtendimento">Raio de atendimento (km, opcional)</Label>
                  <Input
                    id="raioAtendimento"
                    type="number"
                    {...register('raioAtendimento', { valueAsNumber: true })}
                    placeholder="Ex: 20"
                    min="1"
                    max="100"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          {onSkip && (
            <Button type="button" variant="outline" onClick={onSkip}>
              Pular por agora
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {currentTab !== 'basico' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ['basico', 'localizacao', 'profissional', 'sobre', 'configuracoes'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Anterior
              </Button>
            )}
            {currentTab !== 'configuracoes' ? (
              <Button
                type="button"
                onClick={() => {
                  const tabs = ['basico', 'localizacao', 'profissional', 'sobre', 'configuracoes'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Próximo
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}