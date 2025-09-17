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
  const [cloro, setCloro] = useState<number>(initialCloro || 3.0);
  const [alcalinidade, setAlcalinidade] = useState<number>(initialAlcalinidade || 12);

  const calcularProdutos = () => {
    if (volume === 0) {
      return ["⚠️ Informe o volume da piscina para calcular os produtos necessários."];
    }

    const acoes: string[] = [];

    // NOVA ESPECIFICAÇÃO DE CÁLCULOS
    
    // 1. CLORO GRANULADO
    // Meta: 3ppm - Fórmula: 4g x litragem em m³ x quanto falta para chegar em 3ppm
    if (cloro < 3.0) {
      const cloroFaltante = 3.0 - cloro;
      const cloroNecessario = 4 * volume * cloroFaltante;
      acoes.push(`🧪 Cloro Granulado: ${cloroNecessario.toFixed(0)}g (meta: 3.0 ppm)`);
    }

    // OXIDAÇÃO DE CHOQUE (quando cloro está zerado)
    if (cloro === 0) {
      const choqueOxidacao = volume * 20;
      acoes.push(`⚡ Oxidação de Choque: ${choqueOxidacao.toFixed(0)}g de Cloro Granulado`);
    }

    // 2. ELEVADOR DE ALCALINIDADE
    // Meta: 12 - Fórmula: 17g x litragem em m³ x quanto falta para chegar em 12
    if (alcalinidade < 12) {
      const alcalinidadeFaltante = 12 - alcalinidade;
      const elevadorAlcalinidadeGramas = 17 * volume * alcalinidadeFaltante;
      const elevadorAlcalinidadeKg = elevadorAlcalinidadeGramas / 1000;
      acoes.push(`� Elevador de Alcalinidade: ${elevadorAlcalinidadeKg.toFixed(2)}kg (meta: 12)`);
    }

    // 3. REDUTOR DE pH
    // Fórmula: litragem em m³ x 10ml
    if (ph > 7.6) {
      const redutorPh = volume * 10;
      acoes.push(`⬇️ Redutor de pH: ${redutorPh.toFixed(0)}ml`);
    }

    // 4. ALGICIDA
    // Manutenção/Choque: litragem x 6ml
    const algicida = volume * 6;
    acoes.push(`🌱 Algicida (manutenção/choque): ${algicida.toFixed(0)}ml`);

    // 5. SULFATO DE ALUMÍNIO
    // Fórmula: litragem x 40g
    const sulfatoAluminio = volume * 40;
    acoes.push(`🧪 Sulfato de Alumínio: ${sulfatoAluminio.toFixed(0)}g`);

    // 6. CLARIFICANTE
    // Para manutenção: 1,5ml x litragem em m³
    const clarificanteManutencao = volume * 1.5;
    acoes.push(`💧 Clarificante (manutenção): ${clarificanteManutencao.toFixed(1)}ml`);
    
    // Para decantação: 6ml x litragem em m³
    const clarificanteDecantacao = volume * 6;
    acoes.push(`💧 Clarificante (decantação): ${clarificanteDecantacao.toFixed(0)}ml`);

    if (acoes.length === 0) {
      acoes.push("✅ Use as fórmulas acima conforme necessário.");
    }

    return acoes;
  };

  const recomendacoes = calcularProdutos();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Produtos</CardTitle>
        <CardDescription>
          Calcule as quantidades necessárias para correção dos parâmetros e manutenção.
          <br />
          <strong>Metas:</strong> pH: 7.2-7.6 | Cloro: 3.0 ppm | Alcalinidade: 12
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
                placeholder="3.0"
                value={cloro || ''}
                onChange={(e) => setCloro(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="alcalinidade">Alcalinidade</Label>
              <Input
                id="alcalinidade"
                type="number"
                step="1"
                placeholder="12"
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