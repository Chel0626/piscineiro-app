'use client';

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "sonner";

// Importamos o schema e o tipo unificado do arquivo corrigido.
import { clientFormSchema, ClientFormData } from '@/lib/validators/clientSchema';

export interface UseClientsReturn {
  clients: (ClientFormData & { id: string; })[];
  form: UseFormReturn<ClientFormData>;
  handleFormSubmit: (data: ClientFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  openFormToEdit: (client: ClientFormData & { id: string; }) => void;
  openFormToCreate: () => void;
  closeForm: () => void;
  openAlert: (clientId: string) => void;
  closeAlert: () => void;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isAlertOpen: boolean;
  editingClient: (ClientFormData & { id: string; }) | null;
  authLoading: boolean;
}

const defaultFormValues: ClientFormData = {
    name: '',
    address: '',
    neighborhood: '',
    phone: '',
    visitDay: '',
    poolVolume: 0,
    serviceValue: 0,
};

export function useClients(): UseClientsReturn {
    const [user, authLoading] = useAuthState(auth);
    const [clients, setClients] = useState<(ClientFormData & { id: string; })[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<(ClientFormData & { id: string; }) | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        if (isFormOpen) {
            form.reset(editingClient ? editingClient : defaultFormValues);
        }
    }, [isFormOpen, editingClient, form]);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const clientsData: (ClientFormData & { id: string; })[] = [];
                querySnapshot.forEach((doc) => {
                    clientsData.push({ id: doc.id, ...(doc.data() as ClientFormData) });
                });
                setClients(clientsData);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleFormSubmit = async (rawData: ClientFormData) => {
        setIsSubmitting(true);
        try {
            // Convertemos os valores numéricos para garantir que sejam numbers
            const data: ClientFormData = {
                ...rawData,
                poolVolume: Number(rawData.poolVolume),
                serviceValue: Number(rawData.serviceValue),
            };

            if (editingClient) {
                const clientDoc = doc(db, 'clients', editingClient.id);
                await updateDoc(clientDoc, data);
                toast.success("Cliente atualizado com sucesso!");
            } else {
                const currentUser = auth.currentUser;
                if (!currentUser) throw new Error("Usuário não autenticado.");
                const idToken = await currentUser.getIdToken();

                const response = await fetch('/api/clients/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha ao criar cliente.');
                }
                toast.success("Cliente adicionado com sucesso!");
            }
            closeForm();
        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : "Não foi possível salvar o cliente.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClientId) return;
        try {
            await deleteDoc(doc(db, 'clients', deletingClientId));
            toast.success("Cliente excluído com sucesso!");
        } catch (err) {
            console.error("Erro ao deletar cliente:", err);
            toast.error("Não foi possível excluir o cliente.");
        } finally {
            closeAlert();
        }
    };

    const openFormToEdit = (client: ClientFormData & { id: string; }) => { setEditingClient(client); setIsFormOpen(true); };
    const openFormToCreate = () => { setEditingClient(null); setIsFormOpen(true); };
    const closeForm = () => { setIsFormOpen(false); setEditingClient(null); form.reset(defaultFormValues); };
    const openAlert = (clientId: string) => { setDeletingClientId(clientId); setIsAlertOpen(true); };
    const closeAlert = () => { setIsAlertOpen(false); setDeletingClientId(null); };

    return {
        clients, form, handleFormSubmit, handleDelete, openFormToEdit,
        openFormToCreate, closeForm, openAlert, closeAlert, isSubmitting,
        isFormOpen, isAlertOpen, editingClient, authLoading,
    };
}