'use client';

import { useState } from 'react';
import { useProductRequests } from '@/hooks/useProductRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, X, Clock, Package, User, Phone, Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SolicitacoesPage() {
  const { 
    requests, 
    pendingRequests, 
    approvedRequests, 
    rejectedRequests,
    approveRequest, 
    rejectRequest, 
    isLoading 
  } = useProductRequests();

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setActionInProgress(requestId);
    try {
      await approveRequest(requestId);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionInProgress(requestId);
    try {
      await rejectRequest(requestId);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp as string | Date);
    }
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const sendWhatsAppMessage = (clientPhone: string, clientName: string, products: string[]) => {
    const productsList = products.map(product => `• ${product}`).join('\n');
    const message = `Olá ${clientName}!\n\nSua solicitação de produtos foi APROVADA! ✅\n\nProdutos aprovados:\n${productsList}\n\nEstarão disponíveis na próxima visita!`;
    
    const phoneNumber = clientPhone.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const RequestCard = ({ request }: { request: { 
    id: string; 
    clientName: string; 
    clientPhone: string; 
    products: string[]; 
    status: string; 
    requestDate: { toDate?: () => Date } | Date | string | null; 
    notes?: string; 
  }}) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <CardTitle className="text-base">{request.clientName}</CardTitle>
          </div>
          {getStatusBadge(request.status)}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {request.clientPhone}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(request.requestDate)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">Produtos solicitados:</span>
            </div>
            <ul className="space-y-1 ml-6">
              {request.products.map((product: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">• {product}</li>
              ))}
            </ul>
          </div>

          {request.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{request.notes}</span>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={actionInProgress === request.id}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aprovar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aprovar Solicitação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja aprovar esta solicitação de produtos para {request.clientName}?
                      Os produtos aprovados aparecerão automaticamente nos &quot;Produtos do Dia&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Confirmar Aprovação
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={actionInProgress === request.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja rejeitar esta solicitação de produtos para {request.clientName}?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleReject(request.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirmar Rejeição
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {request.status === 'approved' && request.clientPhone && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => sendWhatsAppMessage(request.clientPhone, request.clientName, request.products)}
              className="w-full flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Notificar Cliente da Aprovação
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Solicitações de Produtos</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando solicitações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Solicitações de Produtos</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {pendingRequests.length} Pendentes
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Aprovadas ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Rejeitadas ({rejectedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Todas ({requests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação pendente</h3>
                <p className="text-gray-600">Todas as solicitações foram processadas.</p>
              </div>
            ) : (
              pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            {approvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <Check className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação aprovada</h3>
                <p className="text-gray-600">Aprove solicitações para vê-las aqui.</p>
              </div>
            ) : (
              approvedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            {rejectedRequests.length === 0 ? (
              <div className="text-center py-12">
                <X className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação rejeitada</h3>
                <p className="text-gray-600">Solicitações rejeitadas aparecerão aqui.</p>
              </div>
            ) : (
              rejectedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-600">As solicitações de produtos aparecerão aqui quando enviadas.</p>
              </div>
            ) : (
              requests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}