
import { GoogleGenAI } from "@google/genai";
import { PondRecord } from "../types";

export const analyzeProductionData = async (records: PondRecord[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Eres un experto consultor en acuacultura de camarón.
    Analiza los siguientes registros de producción y proporciona:
    1. Un resumen del estado general de la granja.
    2. Identifica los estanques con mejor y peor desempeño (basado en FCA e incremento semanal).
    3. Sugerencias específicas para mejorar la supervivencia o el factor de conversión alimenticia.
    4. Alertas si algún dato parece fuera de los rangos óptimos.

    Datos de los estanques:
    ${JSON.stringify(records, null, 2)}

    Responde en español de forma profesional y concisa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text || "No se pudo generar el análisis en este momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error al conectar con la inteligencia artificial. Por favor, revisa tu conexión o intenta más tarde.";
  }
};
