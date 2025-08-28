'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { ClientForm, ClientFormData } from '@/components/ClientForm';
import { MoreHorizontal } from 'lucide-react';
import { toast } from "sonner";

// Definindo o tipo de Cliente com o ID
interface Client extends ClientFormData {
  id: string;
}

export default function ClientesPage() {
  const [user] = useAuthState(auth);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar os modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Efeito para buscar os clientes do Firestore em tempo real
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...(doc.data() as ClientFormData) });
        });
        setClients(clientsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleFormSubmit = async (data: ClientFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (editingClient) {
        // Atualizar cliente existente
        const clientDoc = doc(db, 'clients', editingClient.id);
        await updateDoc(clientDoc, { ...data });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        // Adicionar novo cliente
        await addDoc(collection(db, 'clients'), {
          ...data,
          userId: user.uid,
        });
        toast.success("Cliente adicionado com sucesso!");
      }
      closeForm();
    } catch (error) {
      console.error('Error saving client: ', error);
      toast.error("Não foi possível salvar o cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClientId) return;
    try {
      await deleteDoc(doc(db, 'clients', deletingClientId));
      toast.success("Cliente excluído com sucesso!");
      closeAlert();
    } catch (error) {
      console.error('Error deleting client: ', error);
      toast.error("Não foi possível excluir o cliente.");
    }
  };

  // Funções para abrir e fechar os modais
  const openFormToEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };
  
  const openFormToCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingClient(null);
    setIsFormOpen(false);
  };

  const openAlert = (clientId: string) => {
    setDeletingClientId(clientId);
    setIsAlertOpen(true);
  };

  const closeAlert = () => {
    setDeletingClientId(null);
    setIsAlertOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
        <Button onClick={openFormToCreate}>Adicionar Cliente</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Dia da Visita</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{`${client.address}, ${client.neighborhood}`}</TableCell>
                <TableCell>{client.visitDay}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openFormToEdit(client)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAlert(client.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Adicionar/Editar Cliente */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            defaultValues={editingClient || {}}
          />
        </DialogContent>
      </Dialog>
      
      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}