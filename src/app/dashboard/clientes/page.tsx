'use client';

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "sonner";

import { clientFormSchema, ClientFormData } from '@/lib/validators/clientSchema';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClientForm } from '@/components/ClientForm';
import { MoreHorizontal } from 'lucide-react';

interface Client extends ClientFormData { id: string; }

// Com o schema corrigido, podemos usar 'undefined' para indicar um campo vazio.
const defaultFormValues: Partial<ClientFormData> = {
    name: '',
    address: '',
    neighborhood: '',
    phone: '',
    poolVolume: undefined,
    serviceValue: undefined,
    visitDay: '',
};

export default function ClientesPage() {
    const [user, authLoading] = useAuthState(auth); 
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
    
    // O erro de tipo não ocorrerá mais aqui.
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
    const handleRowClick = (clientId: string) => { router.push(`/dashboard/clientes/${clientId}`); };
    const openFormToEdit = (client: Client) => { setEditingClient(client); setIsFormOpen(true); };
    const openFormToCreate = () => { setEditingClient(null); setIsFormOpen(true); };
    const closeForm = () => { setEditingClient(null); setIsFormOpen(false); form.reset(defaultFormValues); };
    const openAlert = (clientId: string) => { setDeletingClientId(clientId); setIsAlertOpen(true); };
    const closeAlert = () => { setDeletingClientId(null); setIsAlertOpen(false); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
                <Button onClick={openFormToCreate} disabled={authLoading}>{authLoading ? 'Aguarde...' : 'Adicionar Cliente'}</Button>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Endereço</TableHead><TableHead>Dia da Visita</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer hover:bg-gray-100">
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{`${client.address}, ${client.neighborhood}`}</TableCell>
                                <TableCell>{client.visitDay}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openFormToEdit(client); }}>Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAlert(client.id); }}>Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                        <DialogDescription>Preencha ou edite as informações do cliente abaixo. Clique em salvar quando terminar.</DialogDescription>
                    </DialogHeader>
                    <ClientForm form={form} onSubmit={handleFormSubmit} />
                    <DialogFooter>
                        <Button type="submit" form="client-form" disabled={isSubmitting || authLoading}>{isSubmitting ? 'Salvando...' : 'Salvar Cliente'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.</AlertDialogDescription>
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