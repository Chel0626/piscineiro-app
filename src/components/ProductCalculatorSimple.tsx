'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductCalculatorProps {
  poolVolume?: number;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
}

export function ProductCalculator({ poolVolume: initialVolume, ph: initialPh, cloro: initialCloro, alcalinidade: initialAlcalinidade }: ProductCalculatorProps) {
  const [volume, setVolume] = useState<number>(initialVolume || 0);
  const [ph, setPh] = useState<number>(initialPh || 7.4);
  const [cloro, setCloro] = useState<number>(initialCloro || 2.0);
  const [alcalinidade, setAlcalinidade] = useState<number>(initialAlcalinidade || 100);

  const calcularProdutos = () => {
    if (volume === 0) {
      return ["⚠️ Informe o volume da piscina para calcular os produtos necessários."];
    }

    const acoes: string[] = [];

    // Parâmetros ideais:
    // pH: 7.2 - 7.6 (ideal: 7.4)
    // Cloro livre: 1.0 - 3.0 ppm (ideal: 2.0)
    // Alcalinidade: 80 - 120 ppm (ideal: 100)
    
    if (cloro < 1.0) {
      const cloroDiff = 2.0 - cloro;
      const cloroNecessario = (cloroDiff * volume * 1.5);
      acoes.push(`🧪 Cloro: ${cloroNecessario.toFixed(0)}g de cloro granulado 65% (meta: 2.0 ppm)`);
    }

    // Primeiro verificar alcalinidade, pois corrigi-la também afeta o pH
    if (alcalinidade < 80) {
      const alcDiff = 100 - alcalinidade;
      const bicarbonato = (alcDiff * volume * 1.2);
      acoes.push(`📈 Alcalinidade: ${bicarbonato.toFixed(0)}g de bicarbonato de sódio (meta: 100 ppm)`);
      
      // Se pH também está baixo, apenas avisar que a alcalinidade vai ajudar
      if (ph < 7.2) {
        acoes.push(`ℹ️ pH baixo será corrigido automaticamente com a correção da alcalinidade`);
      }
    } else if (alcalinidade > 120) {
      acoes.push(`📉 Alcalinidade alta: Adicione ácido muriático gradualmente e teste novamente`);
    } else {
      // Se alcalinidade está ok, aí sim corrigir pH se necessário
      if (ph > 7.6) {
        const phDiff = ph - 7.4;
        const acidoNecessario = (phDiff * volume * 50);
        acoes.push(`⬇️ pH: ${acidoNecessario.toFixed(0)}ml de ácido muriático (meta: 7.4)`);
      } else if (ph < 7.2) {
        const phDiff = 7.4 - ph;
        const barrilhaNecessaria = (phDiff * volume * 75);
        acoes.push(`⬆️ pH: ${barrilhaNecessaria.toFixed(0)}g de barrilha (meta: 7.4)`);
      }
    }

    // Produtos para decantação
    acoes.push(`\n💧 **Para Decantação:**`);
    const sulfatoAluminio = volume * 4;
    acoes.push(`• Sulfato de Alumínio: ${sulfatoAluminio.toFixed(0)}g`);
    
    const clarificante = volume * 0.5;
    acoes.push(`• Clarificante: ${clarificante.toFixed(1)}ml`);

    if (acoes.length === 3) {
      acoes.unshift("✅ Parâmetros dentro do ideal! Apenas produtos para decantação:");
    }

    return acoes;
  };

  const recomendacoes = calcularProdutos();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Produtos</CardTitle>
        <CardDescription>
          Calcule as quantidades necessárias para correção dos parâmetros e decantação.
          <br />
          <strong>Metas:</strong> pH: 7.2-7.6 | Cloro: 1.0-3.0 ppm | Alcalinidade: 80-120 ppm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volume">Volume da Piscina (m³)</Label>
              <Input
                id="volume"
                type="number"
                step="1"
                placeholder="Ex: 30"
                value={volume || ''}
                onChange={(e) => setVolume(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="ph">pH Atual</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                placeholder="7.4"
                value={ph || ''}
                onChange={(e) => setPh(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cloro">Cloro Livre (ppm)</Label>
              <Input
                id="cloro"
                type="number"
                step="0.1"
                placeholder="2.0"
                value={cloro || ''}
                onChange={(e) => setCloro(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="alcalinidade">Alcalinidade (ppm)</Label>
              <Input
                id="alcalinidade"
                type="number"
                step="1"
                placeholder="100"
                value={alcalinidade || ''}
                onChange={(e) => setAlcalinidade(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-lg mb-3">💊 Dosagem Recomendada:</h4>
            <div className="space-y-2">
              {recomendacoes.map((recomendacao, index) => (
                <div 
                  key={index} 
                  className={`text-sm ${recomendacao.includes('⚠️') ? 'text-orange-600 font-medium' : 
                            recomendacao.includes('✅') ? 'text-green-600 font-medium' : 
                            recomendacao.includes('**Para Decantação:**') ? 'text-blue-600 font-medium mt-3' : 
                            'text-gray-700 dark:text-gray-300'}`}
                >
                  {recomendacao}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}