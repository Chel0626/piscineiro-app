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
import { MoreHorizontal, User, MapPin, Calendar, Search, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function ClientesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isClientesFixosExpanded, setIsClientesFixosExpanded] = useState(true);
    const [isClientesAvulsosExpanded, setIsClientesAvulsosExpanded] = useState(false);
    
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
            (cliente.endereco && cliente.endereco.toLowerCase().includes(searchLower))
        );
    }, [clientesAvulsos, searchTerm]);
    
    const handleRowClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    const handleCardClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    return (
        <div className="w-full max-w-full p-2 sm:p-4 overflow-hidden">
            {/* Header responsivo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Gerenciamento de Clientes</h1>
                <Button 
                    onClick={openFormToCreate} 
                    disabled={authLoading}
                    className="w-full sm:w-auto text-sm flex-shrink-0"
                >
                    {authLoading ? 'Aguarde...' : 'Adicionar Cliente'}
                </Button>
            </div>

            {/* Campo de busca */}
            <div className="mb-4 sm:mb-6 w-full">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar cliente por nome, endereço ou bairro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        {filteredClients.length + filteredClientesAvulsos.length} cliente(s) encontrado(s) de {clients.length + clientesAvulsos.length} total
                    </p>
                )}
            </div>

            {/* Seção de Clientes Fixos */}
            <Collapsible open={isClientesFixosExpanded} onOpenChange={setIsClientesFixosExpanded}>
                <Card className="mb-4 w-full">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="flex items-center gap-2 truncate">
                                    <User className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                    <span className="truncate">Clientes Fixos ({filteredClients.length})</span>
                                </CardTitle>
                                {isClientesFixosExpanded ? (
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 w-full overflow-hidden">
                            {/* Layout para Desktop - Tabela */}
                            <div className="hidden sm:block border rounded-lg overflow-x-auto w-full">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-sm min-w-[120px]">Nome</TableHead>
                                            <TableHead className="text-sm min-w-[200px]">Endereço</TableHead>
                                            <TableHead className="text-sm min-w-[120px]">Dia da Visita</TableHead>
                                            <TableHead className="text-right text-sm min-w-[80px]">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredClients.map((client) => (
                                            <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer hover:bg-gray-100">
                                                <TableCell className="font-medium text-sm max-w-[150px] truncate">{client.name}</TableCell>
                                                <TableCell className="text-sm max-w-[250px] truncate">{`${client.address}, ${client.neighborhood}`}</TableCell>
                                                <TableCell className="text-sm max-w-[120px] truncate">
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
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                        <p className="font-semibold text-sm truncate">{client.name}</p>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-600 leading-relaxed">{`${client.address}, ${client.neighborhood}`}</p>
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

            {/* Seção de Clientes Avulsos */}
            <Collapsible open={isClientesAvulsosExpanded} onOpenChange={setIsClientesAvulsosExpanded}>
                <Card className="mb-4 w-full">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="flex items-center gap-2 truncate">
                                    <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                    <span className="truncate">Clientes Avulsos ({filteredClientesAvulsos.length})</span>
                                </CardTitle>
                                {isClientesAvulsosExpanded ? (
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 w-full overflow-hidden">
                            {isLoadingAvulsos ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Carregando clientes avulsos...</p>
                                </div>
                            ) : filteredClientesAvulsos.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Nenhum cliente avulso encontrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 w-full">
                                    {filteredClientesAvulsos.map((cliente) => (
                                        <Card key={cliente.id} className="hover:shadow-md transition-shadow w-full">
                                            <CardContent className="p-3 sm:p-4 w-full">
                                                <div className="flex items-start justify-between gap-3 w-full">
                                                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                            <p className="font-semibold text-sm truncate">{cliente.nome}</p>
                                                        </div>
                                                        {cliente.endereco && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                                <p className="text-xs text-gray-600 leading-relaxed break-words">{cliente.endereco}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                            <p className="text-xs text-gray-600">
                                                                {new Date(cliente.timestamp?.seconds * 1000).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        {cliente.valor && (
                                                            <p className="text-sm font-medium text-green-600">
                                                                R$ {cliente.valor.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
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
        </div>
    );
}