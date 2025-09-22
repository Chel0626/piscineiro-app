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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClientForm } from '@/components/ClientForm';
import { MoreHorizontal, User, MapPin, Calendar, Search, ChevronDown, ChevronRight, UserCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClientesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isClientesFisicosOpen, setIsClientesFisicosOpen] = useState(true);
    const [isClientesAvulsosOpen, setIsClientesAvulsosOpen] = useState(false);
    
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
                        {filteredClients.length + filteredClientesAvulsos.length} resultado(s) encontrado(s)
                    </p>
                )}
            </div>

            {/* Seção de Clientes Físicos (Fixos) */}
            <Card className="mb-6">
                <Collapsible open={isClientesFisicosOpen} onOpenChange={setIsClientesFisicosOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-blue-600" />
                                    <span>Clientes Fixos</span>
                                    <Badge variant="secondary">{filteredClients.length}</Badge>
                                </div>
                                {isClientesFisicosOpen ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                }
                            </CardTitle>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>

            {/* Layout para Desktop - Tabela */}
            <div className="hidden sm:block border rounded-lg overflow-x-auto">
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
            <div className="sm:hidden space-y-3">
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
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Seção de Clientes Avulsos */}
            <Card className="mb-6">
                <Collapsible open={isClientesAvulsosOpen} onOpenChange={setIsClientesAvulsosOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    <span>Clientes Avulsos</span>
                                    <Badge variant="secondary">{filteredClientesAvulsos.length}</Badge>
                                </div>
                                {isClientesAvulsosOpen ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                }
                            </CardTitle>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                            {isLoadingAvulsos ? (
                                <p className="text-center text-gray-500 py-4">Carregando clientes avulsos...</p>
                            ) : filteredClientesAvulsos.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                    {searchTerm ? 'Nenhum cliente avulso encontrado' : 'Nenhum cliente avulso cadastrado'}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredClientesAvulsos.map((cliente) => (
                                        <Card key={cliente.id} className="hover:shadow-sm transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="font-semibold text-sm">{cliente.nome}</p>
                                                        <p className="text-xs text-gray-600">{cliente.endereco}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-600">{cliente.tipoServico}</p>
                                                        <p className="text-xs text-gray-600">{cliente.telefone}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-600">R$ {cliente.valor.toFixed(2)}</p>
                                                        <p className="text-xs text-gray-600">
                                                            {cliente.timestamp?.toDate?.()?.toLocaleDateString('pt-BR') || 'Data não disponível'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="text-xs">
                                                            Concluído
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

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