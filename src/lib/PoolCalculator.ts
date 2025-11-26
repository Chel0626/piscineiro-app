// PoolCalculator.ts
// Lógica Avançada de Tratamento Químico (Genco/Cris Água)

export type WaterAspect =
  | 'CRYSTAL'
  | 'CLOUDY'
  | 'MILKY'
  | 'GREEN'
  | 'DARK_GREEN';

export interface TreatmentInputs {
  poolVolume: number; // m³
  ph: number;
  alkalinity: number; // ppm
  chlorine: number; // ppm
  aspect: WaterAspect;
}

export interface TreatmentStep {
  order: number;
  product: string;
  amount: number;
  unit: string;
  instruction: string;
}

export interface TreatmentResult {
  status: 'OK' | 'WARNING' | 'CRITICAL';
  steps: TreatmentStep[];
  warnings: string[];
}

export function calculateTreatment({ poolVolume, ph, alkalinity, chlorine, aspect }: TreatmentInputs): TreatmentResult {
  const steps: TreatmentStep[] = [];
  const warnings: string[] = [];
  let order = 1;
  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

  // Passo 1: Ajuste de Alcalinidade
  if (alkalinity < 80) {
    const amount = Math.round((100 - alkalinity) * poolVolume * 1.7);
    steps.push({
      order: order++,
      product: 'Elevador de Alcalinidade (Bicarbonato)',
      amount,
      unit: 'g',
      instruction: 'Aplique primeiro e aguarde 2 horas antes de ajustar o pH.'
    });
    status = 'WARNING';
  }

  // Passo 2: Ajuste de pH
  if (ph < 7.2) {
    let amount = 0;
    if (ph < 6.8) {
      amount = Math.round(20 * poolVolume);
    } else if (ph >= 6.8 && ph < 7.0) {
      amount = Math.round(10 * poolVolume);
    } else {
      amount = Math.round(10 * poolVolume);
    }
    steps.push({
      order: order++,
      product: 'Barrilha Leve (Carbonato de Sódio)',
      amount,
      unit: 'g',
      instruction: 'Corrija o pH baixo.'
    });
    status = 'WARNING';
  } else if (ph > 7.6) {
    let amount = 0;
    if (ph > 8.0) {
      amount = Math.round(20 * poolVolume);
    } else {
      amount = Math.round(10 * poolVolume);
    }
    steps.push({
      order: order++,
      product: 'Redutor de pH (Ácido)',
      amount,
      unit: 'ml',
      instruction: 'Corrija o pH alto.'
    });
    status = 'WARNING';
  }

  // Passo 3: Seletor de Tratamento
  if (aspect === 'GREEN' || aspect === 'DARK_GREEN') {
    // Choque
    status = 'CRITICAL';
    steps.push({
      order: order++,
      product: 'Cloro Granulado (Dose de Choque)',
      amount: Math.round(14 * poolVolume),
      unit: 'g',
      instruction: 'Supercloração para matar algas.'
    });
    steps.push({
      order: order++,
      product: 'Algicida de Choque',
      amount: Math.round(7 * poolVolume),
      unit: 'ml',
      instruction: 'Aplique 1 hora após o cloro.'
    });
    steps.push({
      order: order++,
      product: 'Decantador (Sulfato de Alumínio)',
      amount: Math.round(40 * poolVolume),
      unit: 'g',
      instruction: 'Aplique para decantar impurezas.'
    });
    steps.push({
      order: order++,
      product: 'Barrilha Leve (Complemento pH)',
      amount: Math.round(16 * poolVolume),
      unit: 'g',
      instruction: 'Ajuste o pH após sulfato.'
    });
    warnings.push('Água verde detectada: Escove bem as paredes.');
    warnings.push('Filtrar por 6h e deixar decantar.');
  } else if (aspect === 'CRYSTAL') {
    // Manutenção
    const cloroMeta = 3.0;
    const deltaCloro = Math.max(0, cloroMeta - chlorine);
    if (deltaCloro > 0.1) {
      steps.push({
        order: order++,
        product: 'Cloro Granulado (Dicloro)',
        amount: Math.round(deltaCloro * poolVolume * 4),
        unit: 'g',
        instruction: 'Ajuste de cloro para manutenção.'
      });
    }
    steps.push({
      order: order++,
      product: 'Algicida de Manutenção',
      amount: Math.round(5 * poolVolume),
      unit: 'ml',
      instruction: 'Dose semanal de algicida.'
    });
  } else if (aspect === 'CLOUDY') {
    // Turva
    steps.push({
      order: order++,
      product: 'Clarificante',
      amount: Math.round(6 * poolVolume),
      unit: 'ml',
      instruction: 'Filtrar por 6 horas.'
    });
    warnings.push('Água turva: Filtrar por 6h.');
  } else if (aspect === 'MILKY') {
    // Leitosa
    steps.push({
      order: order++,
      product: 'Clarificante Max',
      amount: Math.round(6 * poolVolume),
      unit: 'ml',
      instruction: 'Filtrar intensamente e ajustar pH.'
    });
    warnings.push('Água leitosa: Priorize ajuste de pH e filtração intensa.');
  }

  return {
    status,
    steps,
    warnings,
  };
}
