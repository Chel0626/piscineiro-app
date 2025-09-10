import { useState, useEffect } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "sonner";
import { clientFormSchema, ClientFormData } from '@/lib/validators/clientSchema';

interface Client extends ClientFormData { id: string; }

// Este é o nosso hook. Ele encapsula toda a lógica.
export function useClients() {
    const [user, authLoading] = useAuthState(auth); 
    const [clients, setClients] = useState<Client[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
    
    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            name: '', address: '', neighborhood: '', phone: '',
            poolVolume: 0, serviceValue: 0, visitDay: '',
        },
    });

    useEffect(() => {
        if (isFormOpen) {
            form.reset(editingClient ? editingClient : { 
                name: '', address: '', neighborhood: '', phone: '', 
                poolVolume: 0, serviceValue: 0, visitDay: '' 
            });
        }
    }, [isFormOpen, editingClient, form]);

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
        setIsSubmitting(true);
        try {
            if (editingClient) {
                const clientDoc = doc(db, 'clients', editingClient.id);
                await updateDoc(clientDoc, { ...data });
                toast.success("Cliente atualizado com sucesso!");
            } else {
                const currentUser = auth.currentUser;
                if (!currentUser) { throw new Error("Usuário não está autenticado no cliente."); }
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
            console.error('Erro ao salvar cliente:', error);
            if (error instanceof Error) {
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
            closeAlert();
        } catch (error) {
            console.error('Error deleting client: ', error);
            toast.error("Não foi possível excluir o cliente.");
        }
    };

    const openFormToEdit = (client: Client) => { setEditingClient(client); setIsFormOpen(true); };
    const openFormToCreate = () => { setEditingClient(null); setIsFormOpen(true); };
    const closeForm = () => { setEditingClient(null); setIsFormOpen(false); };
    const openAlert = (clientId: string) => { setDeletingClientId(clientId); setIsAlertOpen(true); };
    const closeAlert = () => { setDeletingClientId(null); setIsAlertOpen(false); };

    // O hook retorna tudo que a página precisa para funcionar
    return {
        user,
        authLoading,
        clients,
        isSubmitting,
        isFormOpen,
        isAlertOpen,
        editingClient,
        deletingClientId,
        form,
        handleFormSubmit,
        handleDelete,
        openFormToEdit,
        openFormToCreate,
        closeForm,
        openAlert,
        closeAlert,
    };
}