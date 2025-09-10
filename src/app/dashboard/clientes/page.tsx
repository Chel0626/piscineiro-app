'use client';

import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/useClients'; // 1. Importar nosso novo hook

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClientForm } from '@/components/ClientForm';
import { MoreHorizontal } from 'lucide-react';

export default function ClientesPage() {
    const router = useRouter();
    
    // 2. Chamar o hook para obter toda a lógica e estado
    const {
        authLoading,
        clients,
        isSubmitting,
        isFormOpen,
        isAlertOpen,
        editingClient,
        form,
        handleFormSubmit,
        handleDelete,
        openFormToEdit,
        openFormToCreate,
        closeForm,
        openAlert,
        closeAlert,
    } = useClients();

    const handleRowClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    // 3. O componente agora é apenas JSX, muito mais fácil de ler!
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
                <Button onClick={openFormToCreate} disabled={authLoading}>
                    {authLoading ? 'Aguarde...' : 'Adicionar Cliente'}
                </Button>
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
                            <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer hover:bg-gray-100">
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{`${client.address}, ${client.neighborhood}`}</TableCell>
                                <TableCell>{client.visitDay}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
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
            <Dialog open={isFormOpen} onOpenChange={closeForm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                        <DialogDescription>Preencha ou edite as informações do cliente abaixo. Clique em salvar quando terminar.</DialogDescription>
                    </DialogHeader>
                    <ClientForm form={form} onSubmit={handleFormSubmit} />
                    <DialogFooter>
                        <Button type="submit" form="client-form" disabled={isSubmitting || authLoading}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isAlertOpen} onOpenChange={closeAlert}>
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