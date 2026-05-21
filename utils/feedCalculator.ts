export interface BWData {
  peso: number;
  bw: number;
}

export const feedTable: BWData[] = [
  { peso: 0.1, bw: 15.0 },
  { peso: 0.2, bw: 11.0 },
  { peso: 0.3, bw: 9.0 },
  { peso: 0.4, bw: 8.5 },
  { peso: 0.5, bw: 8.0 },
  { peso: 0.6, bw: 7.5 },
  { peso: 0.7, bw: 7.0 },
  { peso: 0.8, bw: 6.6 },
  { peso: 0.9, bw: 6.3 },
  { peso: 1.0, bw: 6.0 },
  { peso: 2.0, bw: 5.5 },
  { peso: 3.0, bw: 5.0 },
  { peso: 4.0, bw: 4.5 },
  { peso: 5.0, bw: 4.3 },
  { peso: 6.0, bw: 4.0 },
  { peso: 7.0, bw: 3.8 },
  { peso: 8.0, bw: 3.5 },
  { peso: 9.0, bw: 3.2 },
  { peso: 10.0, bw: 3.0 },
  { peso: 11.0, bw: 2.8 },
  { peso: 12.0, bw: 2.7 },
  { peso: 13.0, bw: 2.6 },
  { peso: 14.0, bw: 2.5 },
  { peso: 15.0, bw: 2.4 },
  { peso: 16.0, bw: 2.3 },
  { peso: 17.0, bw: 2.2 },
  { peso: 18.0, bw: 2.1 },
  { peso: 19.0, bw: 2.1 },
  { peso: 20.0, bw: 2.0 },
  { peso: 21.0, bw: 2.0 },
  { peso: 22.0, bw: 2.0 },
  { peso: 23.0, bw: 1.9 },
  { peso: 24.0, bw: 1.9 },
  { peso: 25.0, bw: 1.8 },
  { peso: 26.0, bw: 1.8 },
  { peso: 27.0, bw: 1.7 },
  { peso: 28.0, bw: 1.7 },
  { peso: 29.0, bw: 1.6 },
  { peso: 30.0, bw: 1.6 }
];

export function calculateBWPercentage(weight: number): number {
  if (weight <= 0) return 0;
  if (weight <= feedTable[0].peso) return feedTable[0].bw;
  if (weight >= feedTable[feedTable.length - 1].peso) return feedTable[feedTable.length - 1].bw;
  
  for (let i = 0; i < feedTable.length - 1; i++) {
    const min = feedTable[i];
    const max = feedTable[i + 1];
    
    if (weight >= min.peso && weight <= max.peso) {
      // Linear interpolation
      const fraction = (weight - min.peso) / (max.peso - min.peso);
      return min.bw + fraction * (max.bw - min.bw);
    }
  }
  return 0;
}

export function calculateFeedProjection(
  totalOrganisms: number,
  survivalRatePercentage: number,
  currentWeightGrams: number
): { projectedDailyKg: number; projectedWeeklyKg: number; bwPercentage: number } {
  // Biomasa en kg = (Organismos iniciales * (Sobrevivencia / 100)) * Peso Actual en gramos / 1000
  const biomassKg = (totalOrganisms * (survivalRatePercentage / 100)) * (currentWeightGrams / 1000);
  
  // Encontramos el % de feeding rate basado en el peso
  const bwPercentage = calculateBWPercentage(currentWeightGrams);
  
  // Alimento diario en kg = Biomasa * (BW% / 100)
  const projectedDailyKg = biomassKg * (bwPercentage / 100);
  
  // Alimento semanal
  const projectedWeeklyKg = projectedDailyKg * 7;
  
  return {
    projectedDailyKg: Number(projectedDailyKg.toFixed(2)),
    projectedWeeklyKg: Number(projectedWeeklyKg.toFixed(2)),
    bwPercentage: Number(bwPercentage.toFixed(2))
  };
}
