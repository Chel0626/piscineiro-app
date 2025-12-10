'use client';
// ... (imports)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Por favor, informe seu e-mail.');
      return;
    }
    
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setIsResetOpen(false);
      setResetEmail('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        toast.error('E-mail não encontrado.');
      } else {
        toast.error('Erro ao enviar e-mail. Tente novamente.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Erro na validação do login');
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao fazer login. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };
  // ... (JSX)
    return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl">Piscineiro Mestre APP</CardTitle>
          <CardDescription>Entre com seu e-mail e senha para acessar o painel.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400" type="button">
                      Esqueci a senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha</DialogTitle>
                      <DialogDescription>
                        Informe seu e-mail para receber um link de redefinição de senha.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reset-email">E-mail</Label>
                          <Input 
                            id="reset-email" 
                            type="email" 
                            placeholder="m@example.com" 
                            value={resetEmail} 
                            onChange={(e) => setResetEmail(e.target.value)} 
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isResetLoading}>
                          {isResetLoading ? 'Enviando...' : 'Enviar E-mail'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline hover:text-blue-600 dark:hover:text-blue-400">Cadastre-se</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}