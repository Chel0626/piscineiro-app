'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductRequests } from '@/hooks/useProductRequests';
import { CheckSquare, XSquare, Package, User, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ProdutosDoDiaPage() {
  const { 
    pendingRequests, 
    approvedProducts, 
    approveRequest, 
    rejectRequest, 
    isLoading 
  } = useProductRequests();

  const handleApprove = async (requestId: string) => {
    const success = await approveRequest(requestId);
    if (success) {
      toast.success('Solicitação aprovada!');
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectRequest(requestId);
    if (success) {
      toast.success('Solicitação rejeitada');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Package className="h-6 w-6" />
        Produtos do Dia
      </h1>

      {/* Solicitações Pendentes */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Solicitações Pendentes ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{request.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{request.clientPhone}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {request.products.map((product: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={isLoading}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={isLoading}
                    >
                      <XSquare className="h-3 w-3 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos Aprovados */}
      {approvedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Aprovados ({approvedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedProducts.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{request.clientName}</span>
                    <span className="text-sm text-gray-500">{request.clientPhone}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.products.map((product: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {pendingRequests.length === 0 && approvedProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma solicitação hoje
            </h3>
            <p className="text-gray-500">
              Quando houver solicitações de produtos, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
