'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { useClientesAvulsos } from '@/hooks/useClientesAvulsos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClientForm } from '@/components/ClientForm';
import { MoreHorizontal, User, MapPin, Calendar, Search, Users, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Toda a lógica agora vem do nosso hook customizado.
    const {
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
    } = useClients();

    // Hook para clientes avulsos
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clientesAvulsos, isLoading: isLoadingAvulsos } = useClientesAvulsos();

    // Filtrar clientes baseado na busca
    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return clients;
        
        const searchLower = searchTerm.toLowerCase();
        return clients.filter(client => 
            client.name.toLowerCase().includes(searchLower) ||
            client.address.toLowerCase().includes(searchLower) ||
            client.neighborhood.toLowerCase().includes(searchLower)
        );
    }, [clients, searchTerm]);

    // Filtrar clientes avulsos baseado na busca
    const filteredClientesAvulsos = useMemo(() => {
        if (!searchTerm.trim()) return clientesAvulsos;
        
        const searchLower = searchTerm.toLowerCase();
        return clientesAvulsos.filter(cliente => 
            cliente.nome.toLowerCase().includes(searchLower) ||
            cliente.endereco.toLowerCase().includes(searchLower) ||
            cliente.tipoServico.toLowerCase().includes(searchLower)
        );
    }, [clientesAvulsos, searchTerm]);
    
    const handleRowClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    const handleCardClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    return (
        <div className="p-2 sm:p-4">
            {/* Header responsivo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Gerenciamento de Clientes</h1>
                <Button 
                    onClick={openFormToCreate} 
                    disabled={authLoading}
                    className="w-full sm:w-auto text-sm"
                >
                    {authLoading ? 'Aguarde...' : 'Adicionar Cliente'}
                </Button>
            </div>

            {/* Campo de busca */}
            <div className="mb-4 sm:mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar cliente por nome, endereço ou bairro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        {filteredClients.length + filteredClientesAvulsos.length} cliente(s) encontrado(s) de {clients.length + clientesAvulsos.length} total
                    </p>
                )}
            </div>

            {/* Accordions para separar clientes fixos e avulsos */}
            <div className="space-y-4">
                {/* Clientes Fixos */}
                <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-blue-50 [&[open]>summary>span:last-child]:rotate-180" open>
                    <summary className="cursor-pointer p-4 font-medium text-blue-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Clientes Fixos ({filteredClients.length})
                        </span>
                        <span className="text-gray-400 transition-transform duration-200">▼</span>
                    </summary>
                    <div className="border-t border-gray-200 bg-white">
                        {/* Layout para Desktop - Tabela */}
                        <div className="hidden sm:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-sm">Nome</TableHead>
                                        <TableHead className="text-sm">Endereço</TableHead>
                                        <TableHead className="text-sm">Dia da Visita</TableHead>
                                        <TableHead className="text-right text-sm">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => (
                                        <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer hover:bg-gray-100">
                                            <TableCell className="font-medium text-sm">{client.name}</TableCell>
                                            <TableCell className="text-sm">{`${client.address}, ${client.neighborhood}`}</TableCell>
                                            <TableCell className="text-sm">
                                              {client.visitDays ? client.visitDays.join(', ') : 
                                               (client as typeof client & { visitDay?: string }).visitDay || 'Não definido'}
                                            </TableCell>
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

                        {/* Layout para Mobile - Cards */}
                        <div className="sm:hidden p-4 space-y-3">
                            {filteredClients.map((client) => (
                                <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick(client.id)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <p className="font-semibold text-sm truncate">{client.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                    <p className="text-xs text-gray-600 truncate">{`${client.address}, ${client.neighborhood}`}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    <p className="text-xs text-gray-600">
                                                      {client.visitDays ? client.visitDays.join(', ') : 
                                                       (client as typeof client & { visitDay?: string }).visitDay || 'Não definido'}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openFormToEdit(client); }}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAlert(client.id); }}>
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredClients.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">Nenhum cliente fixo encontrado</p>
                            </div>
                        )}
                    </div>
                </details>

                {/* Clientes Avulsos */}
                <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-orange-50 [&[open]>summary>span:last-child]:rotate-180">
                    <summary className="cursor-pointer p-4 font-medium text-orange-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Clientes Avulsos ({filteredClientesAvulsos.length})
                        </span>
                        <span className="text-gray-400 transition-transform duration-200">▼</span>
                    </summary>
                    <div className="border-t border-gray-200 bg-white">
                        {/* Layout para Desktop - Tabela */}
                        <div className="hidden sm:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-sm">Nome</TableHead>
                                        <TableHead className="text-sm">Endereço</TableHead>
                                        <TableHead className="text-sm">Tipo de Serviço</TableHead>
                                        <TableHead className="text-sm">Valor</TableHead>
                                        <TableHead className="text-sm">Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClientesAvulsos.map((cliente) => (
                                        <TableRow key={cliente.id} className="hover:bg-gray-100">
                                            <TableCell className="font-medium text-sm">{cliente.nome}</TableCell>
                                            <TableCell className="text-sm">{cliente.endereco}</TableCell>
                                            <TableCell className="text-sm">{cliente.tipoServico}</TableCell>
                                            <TableCell className="text-sm">R$ {cliente.valor.toFixed(2)}</TableCell>
                                            <TableCell className="text-sm">
                                                {cliente.timestamp?.toDate ? 
                                                    cliente.timestamp.toDate().toLocaleDateString('pt-BR') : 
                                                    'N/A'
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Layout para Mobile - Cards */}
                        <div className="sm:hidden p-4 space-y-3">
                            {filteredClientesAvulsos.map((cliente) => (
                                <Card key={cliente.id} className="border-orange-200">
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <UserPlus className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                <p className="font-semibold text-sm truncate">{cliente.nome}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                <p className="text-xs text-gray-600 truncate">{cliente.endereco}</p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-600">{cliente.tipoServico}</span>
                                                <span className="font-medium text-green-600">R$ {cliente.valor.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                <p className="text-xs text-gray-600">
                                                    {cliente.timestamp?.toDate ? 
                                                        cliente.timestamp.toDate().toLocaleDateString('pt-BR') : 
                                                        'N/A'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredClientesAvulsos.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">Nenhum cliente avulso encontrado</p>
                            </div>
                        )}
                    </div>
                </details>
            </div>

            {/* Dialog do formulário - responsivo */}
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => !isOpen && closeForm()}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
                    <DialogHeader className="pb-3">
                        <DialogTitle className="text-base sm:text-lg">
                            {editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Preencha ou edite as informações do cliente abaixo. Clique em salvar quando terminar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <ClientForm form={form} onSubmit={handleFormSubmit} />
                    </div>
                    <DialogFooter className="pt-3">
                        <Button 
                            type="submit" 
                            form="client-form" 
                            disabled={isSubmitting || authLoading}
                            className="w-full sm:w-auto text-sm"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={(isOpen) => !isOpen && closeAlert()}>
                <AlertDialogContent className="mx-2 sm:mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="text-sm">Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}