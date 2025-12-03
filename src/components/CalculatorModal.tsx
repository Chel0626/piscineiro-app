import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  poolVolume: number;
  clientName: string;
}

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ open, onClose, poolVolume, clientName }) => {
  const [ph, setPh] = useState(7.4);
  const [cloro, setCloro] = useState(0);
  const [alcalinidade, setAlcalinidade] = useState(100);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const phValues = [6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0];
  const cloroValues = [0, 1, 2, 3, 4];
  const alcalinidadeValues = Array.from({ length: 21 }, (_, i) => i * 10); // 0-200

  const calcularProdutos = (): ProductSuggestion[] => {
    const volume = poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    // 1. CLORO GRANULADO
    const cloroIdeal = 3.0;
    if (cloro < cloroIdeal) {
      const cloroFaltante = cloroIdeal - cloro;
      const cloroNecessario = 10 * volume * cloroFaltante;
      suggestions.push({
        id: 'cloro-granulado',
        name: 'Cloro Granulado',
        quantity: Math.round(cloroNecessario),
        unit: 'g'
      });
    }

    // Tratamento de choque
    if (cloro <= 0.5) {
      const choqueOxidacao = 25 * volume;
      suggestions.push({
        id: 'cloro-choque',
        name: 'Cloro Granulado (Tratamento de Choque)',
        quantity: Math.round(choqueOxidacao),
        unit: 'g'
      });
    }

    // 2. PASTILHAS DE CLORO
    const pastilhas = Math.ceil(volume / 45);
    if (pastilhas > 0) {
      suggestions.push({
        id: 'pastilha-cloro',
        name: 'Pastilha de Cloro 200g (manutenção semanal)',
        quantity: pastilhas,
        unit: 'unidades'
      });
    }

    // 3. ALCALINIDADE
    const alcalinidadeIdeal = 120;
    if (alcalinidade < alcalinidadeIdeal) {
      const alcalinidadeFaltante = alcalinidadeIdeal - alcalinidade;
      const elevadorNecessario = (170 * volume * alcalinidadeFaltante) / 10;
      suggestions.push({
        id: 'elevador-alcalinidade',
        name: 'Elevador de Alcalinidade',
        quantity: Math.round(elevadorNecessario),
        unit: 'g'
      });
    }

    // 4. pH
    if (ph > 7.6) {
      const diferencaPh = ph - 7.4;
      const redutorNecessario = (100 * volume * diferencaPh) / 0.2;
      suggestions.push({
        id: 'redutor-ph',
        name: 'Redutor de pH (Ácido)',
        quantity: Math.round(redutorNecessario),
        unit: 'ml'
      });
    }
    
    if (ph < 7.2) {
      const diferencaPh = 7.4 - ph;
      const barrilhaNecessaria = (100 * volume * diferencaPh) / 0.2;
      suggestions.push({
        id: 'elevador-ph',
        name: 'Barrilha / Elevador de pH',
        quantity: Math.round(barrilhaNecessaria),
        unit: 'g'
      });
    }

    // 5. ALGICIDA
    if (cloro < 1.0) {
      const algicidaChoque = (250 * volume) / 10;
      suggestions.push({
        id: 'algicida-choque',
        name: 'Algicida (Tratamento de Choque)',
        quantity: Math.round(algicidaChoque),
        unit: 'ml'
      });
    } else {
      const algicidaManutencao = (80 * volume) / 10;
      suggestions.push({
        id: 'algicida-manutencao',
        name: 'Algicida (Manutenção Semanal)',
        quantity: Math.round(algicidaManutencao),
        unit: 'ml'
      });
    }

    // 6. CLARIFICANTE
    const clarificanteManutencao = 40 * volume;
    suggestions.push({
      id: 'clarificante-manutencao',
      name: 'Clarificante Líquido (Manutenção)',
      quantity: Math.round(clarificanteManutencao),
      unit: 'ml'
    });
    
    if (cloro < 1.5) {
      const clarificanteDecantacao = 120 * volume;
      suggestions.push({
        id: 'clarificante-decantacao',
        name: 'Clarificante Líquido (Decantação)',
        quantity: Math.round(clarificanteDecantacao),
        unit: 'ml'
      });
    }

    // 7. CLARIFICANTE GEL
    const clarificanteGel = Math.ceil(volume / 12);
    if (clarificanteGel > 0) {
      suggestions.push({
        id: 'clarificante-gel',
        name: 'Clarificante Gel / Sachê',
        quantity: clarificanteGel,
        unit: 'unidades'
      });
    }

    // 8. SULFATO DE ALUMÍNIO
    if (cloro < 1.0) {
      const sulfatoAluminio = 50 * volume;
      suggestions.push({
        id: 'sulfato-aluminio',
        name: 'Sulfato de Alumínio (Decantante)',
        quantity: Math.round(sulfatoAluminio),
        unit: 'g'
      });
    }

    // 9. LIMPA BORDAS
    suggestions.push({
      id: 'limpa-bordas',
      name: 'Limpa Bordas',
      quantity: 200,
      unit: 'ml'
    });

    return suggestions;
  };

  const recomendacoes = calcularProdutos();

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const copiarParaWhatsApp = () => {
    const produtosSelecionados = recomendacoes.filter(p => selectedProducts.has(p.id));
    if (produtosSelecionados.length === 0) {
      alert('Selecione pelo menos um produto');
      return;
    }

    const mensagem = `*Relatório de Dosagem - ${clientName}*\n\n` +
      `📊 *Parâmetros Medidos:*\n` +
      `• pH: ${ph}\n` +
      `• Cloro: ${cloro} ppm\n` +
      `• Alcalinidade: ${alcalinidade} ppm\n\n` +
      `💊 *Produtos Aplicados:*\n` +
      produtosSelecionados.map(p => `• ${p.name}: ${p.quantity}${p.unit}`).join('\n') +
      `\n\n🏊 Volume da piscina: ${poolVolume}m³`;

    navigator.clipboard.writeText(mensagem);
    alert('Mensagem copiada para a área de transferência!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Calculadora de Dosagem - {clientName}
            <Badge variant="secondary">Volume: {poolVolume}m³ ({poolVolume * 1000}L)</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parâmetros */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Parâmetros Atuais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* pH */}
              <div className="space-y-2">
                <label className="text-sm font-medium">pH</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = phValues.indexOf(ph);
                      if (idx > 0) setPh(phValues[idx - 1]);
                    }}
                    disabled={ph === phValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{ph}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = phValues.indexOf(ph);
                      if (idx < phValues.length - 1) setPh(phValues[idx + 1]);
                    }}
                    disabled={ph === phValues[phValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Cloro */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cloro (ppm)</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = cloroValues.indexOf(cloro);
                      if (idx > 0) setCloro(cloroValues[idx - 1]);
                    }}
                    disabled={cloro === cloroValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{cloro}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = cloroValues.indexOf(cloro);
                      if (idx < cloroValues.length - 1) setCloro(cloroValues[idx + 1]);
                    }}
                    disabled={cloro === cloroValues[cloroValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Alcalinidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Alcalinidade (ppm)</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = alcalinidadeValues.indexOf(alcalinidade);
                      if (idx > 0) setAlcalinidade(alcalinidadeValues[idx - 1]);
                    }}
                    disabled={alcalinidade === alcalinidadeValues[0]}
                  >
                    -
                  </Button>
                  <span className="min-w-[60px] text-center font-mono text-lg font-semibold">{alcalinidade}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const idx = alcalinidadeValues.indexOf(alcalinidade);
                      if (idx < alcalinidadeValues.length - 1) setAlcalinidade(alcalinidadeValues[idx + 1]);
                    }}
                    disabled={alcalinidade === alcalinidadeValues[alcalinidadeValues.length - 1]}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Valores Ideais:</strong> pH 7.2-7.6 | Cloro 2-3 ppm | Alcalinidade 100-120 ppm
            </p>
          </div>

          {/* Recomendações */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Recomendações de Produtos</h3>
            {recomendacoes.length > 0 ? (
              <div className="space-y-2">
                {recomendacoes.map((produto) => (
                  <div key={produto.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Checkbox
                      id={produto.id}
                      checked={selectedProducts.has(produto.id)}
                      onCheckedChange={() => handleProductToggle(produto.id)}
                      className="h-5 w-5"
                    />
                    <label htmlFor={produto.id} className="flex-1 text-sm font-medium cursor-pointer">
                      {produto.name}: <span className="font-bold text-blue-600">{produto.quantity}{produto.unit}</span>
                    </label>
                  </div>
                ))}
                {selectedProducts.size > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ {selectedProducts.size} produto(s) selecionado(s)
                    </p>
                    <Button onClick={copiarParaWhatsApp} size="sm">
                      📋 Copiar para WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aguardando parâmetros...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
