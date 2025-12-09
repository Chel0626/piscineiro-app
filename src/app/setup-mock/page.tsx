'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

export default function SetupMockPage() {
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  async function createMockAccount() {
    setStatus('running');
    addLog('Iniciando criação da conta mockup...');

    try {
      const email = 'mhmservicos91@gmail.com';
      const password = 'senha123';

      // 1. Criar ou Logar Usuário
      let user;
      try {
        addLog(`Tentando criar usuário ${email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        addLog('Usuário criado com sucesso!');
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          addLog('Usuário já existe. Tentando logar...');
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          addLog('Logado com sucesso!');
        } else {
          throw error;
        }
      }

      if (!user) throw new Error('Falha ao obter usuário.');

      // 2. Criar Perfil do Piscineiro
      addLog('Criando perfil do piscineiro...');
      await setDoc(doc(db, 'users', user.uid), {
        name: 'MHM Serviços',
        email: email,
        phone: '11999999999',
        plan: 'pro',
        createdAt: new Date().toISOString()
      });

      // 3. Criar Clientes Mockup
      addLog('Criando clientes de exemplo...');
      
      const clients = [
        {
          name: 'Condomínio Jardins',
          address: 'Rua das Flores, 123',
          neighborhood: 'Centro',
          phone: '11988887777',
          poolVolume: 50,
          serviceValue: 450,
          visitFrequency: 'biweekly',
          visitDays: ['Segunda-feira', 'Quinta-feira'],
          contractStartDate: '2024-01-10',
          filterModel: 'Dancor DFR-15',
          filterSandKg: 100,
          lastSandChange: '2024-06-15',
          nextSandChange: '2025-12-15',
          userId: user.uid
        },
        {
          name: 'Dona Maria Silva',
          address: 'Av. Paulista, 1000 - Casa 2',
          neighborhood: 'Bela Vista',
          phone: '11977776666',
          poolVolume: 25,
          serviceValue: 280,
          visitFrequency: 'weekly',
          visitDays: ['Sexta-feira'],
          contractStartDate: '2024-03-01',
          filterModel: 'Jacuzzi 15TP',
          filterSandKg: 50,
          lastSandChange: '2023-11-20',
          nextSandChange: '2025-05-20',
          userId: user.uid
        },
        {
          name: 'Clube Esportivo',
          address: 'Rua do Esporte, 500',
          neighborhood: 'Vila Olímpia',
          phone: '11966665555',
          poolVolume: 150,
          serviceValue: 1200,
          visitFrequency: 'biweekly',
          visitDays: ['Terça-feira', 'Sexta-feira'],
          contractStartDate: '2023-05-10',
          filterModel: 'Nautilus F650',
          filterSandKg: 250,
          lastSandChange: '2024-01-10',
          nextSandChange: '2025-07-10',
          userId: user.uid
        }
      ];

      for (const clientData of clients) {
        const docRef = await addDoc(collection(db, 'clients'), clientData);
        addLog(`Cliente ${clientData.name} criado (ID: ${docRef.id})`);
        
        // Adicionar algumas visitas fictícias
        const visitsRef = collection(db, 'clients', docRef.id, 'visits');
        await addDoc(visitsRef, {
          date: '2024-12-01',
          ph: 7.2,
          cloro: 3.0,
          alkalinity: 100,
          waterCondition: 'limpa',
          timestamp: new Date('2024-12-01T10:00:00')
        });
      }

      addLog('Processo concluído com sucesso!');
      setStatus('success');

    } catch (error: any) {
      console.error(error);
      addLog(`ERRO: ${error.message}`);
      setStatus('error');
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setup Mock Account</h1>
      <p className="mb-4 text-gray-600">
        Esta página cria a conta <strong>mhmservicos91@gmail.com</strong> e popula com dados de exemplo.
      </p>
      
      <button 
        onClick={createMockAccount}
        disabled={status === 'running'}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'running' ? 'Criando...' : 'Criar Conta e Dados'}
      </button>

      <div className="mt-6 bg-gray-100 p-4 rounded h-64 overflow-y-auto text-xs font-mono">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
