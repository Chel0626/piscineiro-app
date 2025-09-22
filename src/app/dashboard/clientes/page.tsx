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
import { ClienteAvulsoModal } from '@/components/ClienteAvulsoModal';
import { MoreHorizontal, User, MapPin, Calendar, Search, UserPlus, ChevronDown, ChevronUp, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export default function ClientesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isClienteAvulsoModalOpen, setIsClienteAvulsoModalOpen] = useState(false);
    const [isClientesAvulsosOpen, setIsClientesAvulsosOpen] = useState(false);
    const [isClientesFisicosOpen, setIsClientesFisicosOpen] = useState(true);
    const [showClientesAvulsos, setShowClientesAvulsos] = useState(false);
    
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
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                        onClick={openFormToCreate} 
                        disabled={authLoading}
                        className="flex-1 sm:flex-none text-sm"
                    >
                        {authLoading ? 'Aguarde...' : 'Adicionar Cliente'}
                    </Button>
                    <Button 
                        onClick={() => setIsClienteAvulsoModalOpen(true)}
                        variant="outline"
                        className="flex-1 sm:flex-none text-sm flex items-center gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        Cliente Avulso
                    </Button>
                </div>
            </div>

            {/* Botões de controle */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Button
                    variant={showClientesAvulsos ? "default" : "outline"}
                    onClick={() => setShowClientesAvulsos(!showClientesAvulsos)}
                    className="text-sm flex items-center gap-2"
                >
                    <Eye className="h-4 w-4" />
                    {showClientesAvulsos ? 'Ocultar' : 'Mostrar'} Clientes Avulsos ({clientesAvulsos.length})
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
                        {filteredClients.length} cliente(s) encontrado(s) de {clients.length} total
                    </p>
                )}
            </div>

            {/* Seção de Clientes Avulsos (se ativada) */}
            {showClientesAvulsos && (
                <Collapsible open={isClientesAvulsosOpen} onOpenChange={setIsClientesAvulsosOpen}>
                    <Card className="mb-6">
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-blue-600" />
                                        Clientes Avulsos ({clientesAvulsos.length})
                                    </CardTitle>
                                    {isClientesAvulsosOpen ? (
                                        <ChevronUp className="h-5 w-5" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5" />
                                    )}
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent>
                                {isLoadingAvulsos ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">Carregando clientes avulsos...</p>
                                    </div>
                                ) : clientesAvulsos.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">Nenhum cliente avulso cadastrado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {clientesAvulsos.slice(0, 10).map((cliente) => (
                                            <div key={cliente.id} className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{cliente.nome}</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">{cliente.endereco}</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">{cliente.telefone}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="secondary" className="mb-1">
                                                            {cliente.tipoServico}
                                                        </Badge>
                                                        <p className="text-sm font-medium text-green-600">
                                                            R$ {cliente.valor.toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {cliente.timestamp?.toDate().toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {clientesAvulsos.length > 10 && (
                                            <p className="text-center text-sm text-gray-500">
                                                E mais {clientesAvulsos.length - 10} clientes...
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            )}

            {/* Seção de Clientes Físicos (Fixos) */}
            <Collapsible open={isClientesFisicosOpen} onOpenChange={setIsClientesFisicosOpen}>
                <Card className="mb-6">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-600" />
                                    Clientes Físicos ({filteredClients.length})
                                </CardTitle>
                                {isClientesFisicosOpen ? (
                                    <ChevronUp className="h-5 w-5" />
                                ) : (
                                    <ChevronDown className="h-5 w-5" />
                                )}
                            </div>
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
                </Card>
            </Collapsible>

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

            {/* Modal Cliente Avulso */}
            <ClienteAvulsoModal 
                isOpen={isClienteAvulsoModalOpen} 
                onClose={() => setIsClienteAvulsoModalOpen(false)} 
            />
        </div>
    );
}