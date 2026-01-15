
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function compareWithPro(playerName: string, userStats: any) {
  const prompt = `
    Compare o desempenho do atleta amador "${userStats.name}" com o jogador profissional "${playerName}".
    Estatísticas do Atleta: ${JSON.stringify(userStats.stats)}
    
    Forneça uma análise motivacional, dicas técnicas baseadas no estilo de jogo do profissional e onde o amador pode melhorar para chegar mais próximo do nível de elite. 
    Seja específico sobre métricas como sprints, velocidade e percepção de esforço.
    Responda em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Erro ao buscar comparação. Tente novamente mais tarde.", sources: [] };
  }
}

export async function getProPlayerInfo(playerName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Forneça informações básicas sobre o jogador de futebol "${playerName}": Nome completo, time atual, posição principal e uma foto oficial de alta qualidade em URL se disponível. Retorne em JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          team: { type: Type.STRING },
          position: { type: Type.STRING },
          summary: { type: Type.STRING },
          imageUrl: { type: Type.STRING }
        },
        required: ["name", "team", "position"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateProgressInsight(history: any[], stats: any) {
  const prompt = `
    Como um treinador de elite do ecossistema Athletix, faça uma análise TÁTICA E CURTA do atleta:
    Histórico Recente: ${JSON.stringify(history.slice(-3))}
    Status Atual: ${JSON.stringify(stats)}

    Gere um feedback conciso (máx 120 palavras) em PT-BR seguindo esta estrutura:
    1. **Performance Anaeróbica & Explosão**: Analise sprints e velocidade de pico nos últimos jogos. Destaque ganhos de potência.
    2. **Domínio em Jogo**: Resuma o volume e ações de alta intensidade (distância/minuto se houver).
    3. **Ponto de Ajuste**: Um alerta crítico e uma ação prática para o próximo jogo.
    Use emojis esportivos, seja direto e use linguagem de futebol de alto rendimento.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Mantenha o foco nos treinos! Continue registrando seus dados para uma análise detalhada.";
  }
}

export async function getUpcomingGames(clubName: string) {
  const prompt = `Busque os próximos 5 jogos oficiais de futebol do clube "${clubName}".
  Para cada jogo, encontre a URL de uma logo oficial (escudo PNG transparente) do clube buscado e do adversário.
  Inclua: data, horário, adversário, competição, local e se o clube buscado joga em casa.
  Retorne os dados em um formato JSON estruturado com logos.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            club: { type: Type.STRING },
            clubLogo: { type: Type.STRING, description: "URL da logo PNG do clube buscado" },
            games: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  opponent: { type: Type.STRING },
                  opponentLogo: { type: Type.STRING, description: "URL da logo PNG do adversário" },
                  competition: { type: Type.STRING },
                  location: { type: Type.STRING },
                  home: { type: Type.BOOLEAN }
                },
                required: ["date", "opponent", "opponentLogo", "competition"]
              }
            }
          },
          required: ["club", "games", "clubLogo"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      clubLogo: data.clubLogo,
      games: data.games,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Games Error:", error);
    return { games: [], sources: [], clubLogo: "" };
  }
}

/**
 * Sincroniza o elenco e dados de performance dos últimos 2 jogos
 */
export async function syncSquadAndPerformance(clubName: string) {
  const prompt = `
    Acesse o transfermarkt.com.br e busque o elenco ATUAL do "${clubName}". 
    Além disso, analise os DOIS ÚLTIMOS jogos oficiais do clube (fichas técnicas e estatísticas).
    Para cada jogador encontrado no elenco principal:
    1. Nome, Posição e URL da foto.
    2. Crie um histórico de performance fictício (mas baseado na minutagem real se disponível) para os dois últimos jogos.
    3. Inclua métricas: velocidade máxima, distância, sprints, percepção de esforço e fadiga.
    Retorne os dados em um JSON estruturado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            players: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  position: { type: Type.STRING },
                  avatar: { type: Type.STRING },
                  stats: {
                    type: Type.OBJECT,
                    properties: {
                      velocidadeMaximaJogo: { type: Type.NUMBER },
                      distanciaJogo: { type: Type.NUMBER },
                      sprints: { type: Type.NUMBER },
                      percepcaoEsforco: { type: Type.NUMBER },
                      controleFadiga: { type: Type.NUMBER }
                    }
                  },
                  history: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        sprints: { type: Type.NUMBER },
                        distance: { type: Type.NUMBER },
                        velocidadeMaxima: { type: Type.NUMBER },
                        percepcaoEsforco: { type: Type.NUMBER },
                        fadiga: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                required: ["name", "position", "stats", "history"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
}
