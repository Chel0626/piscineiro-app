'use client';

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
// A LINHA MAIS IMPORTANTE: Garantir que esta importação existe.
import { useForm, UseFormReturn } from 'react-hook-form';
import { toast } from "sonner";
import { z } from 'zod';

import { clientFormSchema, ClientFormData, ClientFormInput } from '@/lib/validators/clientSchema';

export interface UseClientsReturn {
  clients: (ClientFormData & { id: string; })[];
  form: UseFormReturn<ClientFormInput>;
  handleFormSubmit: (data: ClientFormInput) => Promise<void>;
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

const defaultFormValues: ClientFormInput = {
    name: '',
    address: '',
    neighborhood: '',
    phone: '',
    poolVolume: '',
    serviceValue: '',
    visitDay: '',
};

export function useClients(): UseClientsReturn {
    const [user, authLoading] = useAuthState(auth);
    const [clients, setClients] = useState<(ClientFormData & { id: string; })[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<(ClientFormData & { id: string; }) | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

    const form = useForm<ClientFormInput>({
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        if (isFormOpen) {
            if (editingClient) {
                form.reset({
                    ...editingClient,
                    poolVolume: String(editingClient.poolVolume),
                    serviceValue: String(editingClient.serviceValue),
                });
            } else {
                form.reset(defaultFormValues);
            }
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

    const handleFormSubmit = async (data: ClientFormInput) => {
        setIsSubmitting(true);
        try {
            const validatedData = clientFormSchema.parse(data);

            if (editingClient) {
                const clientDoc = doc(db, 'clients', editingClient.id);
                await updateDoc(clientDoc, { ...validatedData });
                toast.success("Cliente atualizado com sucesso!");
            } else {
                const currentUser = auth.currentUser;
                if (!currentUser) throw new Error("Usuário não autenticado.");
                const idToken = await currentUser.getIdToken();

                const response = await fetch('/api/clients/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify(validatedData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha ao criar cliente.');
                }
                toast.success("Cliente adicionado com sucesso!");
            }
            closeForm();
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast.error(error.issues[0].message);
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Não foi possível salvar o cliente.");
            }
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
        clients,
        form,
        handleFormSubmit,
        handleDelete,
        openFormToEdit,
        openFormToCreate,
        closeForm,
        openAlert,
        closeAlert,
        isSubmitting,
        isFormOpen,
        isAlertOpen,
        editingClient,
        authLoading,
    };
}
