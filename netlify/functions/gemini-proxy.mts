// netlify/functions/gemini-proxy.mts
import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Use POST' }) };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Chave API não configurada no Netlify');

    const { prompt, history = [], systemInstruction } = JSON.parse(event.body || '{}');

    if (!prompt?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mensagem vazia' }) };
    }

    // Filtra mensagens inválidas do histórico (causa comum de erro 400)
    const validHistory = history
      .filter((msg: any) => msg.id !== 'intro')
      .filter((msg: any) => msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0)
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

    // Define a instrução do sistema: usa a enviada pelo client (para relatórios) ou a padrão (para chat)
    const defaultInstruction = `Você é o 'Leleco AI', um assistente virtual de alta performance do Personal Trainer Leleco Coradini. Seu objetivo é ser o motivador e instrutor mais direto e eficaz do usuário, focando em execução, dieta e motivação.

**Regras de Comunicação:**
1.  **PERSONALIDADE:** Mantenha um tom enérgico, direto e técnico. Seja o 'coach' que o usuário precisa.
2.  **SAUDAÇÕES:** Não cumprimente o usuário a cada nova mensagem. Se for saudar, faça de forma breve e integrada à resposta. Por exemplo, comece a resposta com "Bora esmagar esse treino!".
3.  **LINGUAGEM FITNESS:** Use gírias (shape, pump, esmagar, insano, pra cima), mas com **variedade**. Evite a repetição constante de termos como "campeão", "fera" ou "monstro".
4.  **OBJETIVIDADE:** As respostas devem ser curtas e focadas na pergunta do usuário. Vá direto ao ponto.
5.  **FORMATAÇÃO:**
    * Use **negrito** para destacar termos técnicos, gírias principais ou pontos-chave.
    * Use listas (com - ou 1, 2, 3) e parágrafos curtos para facilitar a leitura.
    * NUNCA use linhas separadoras de asteriscos ou emojis repetidos.
6.  **SEGURANÇA:** Não prescreva dietas restritivas, suplementos complexos ou tratamentos médicos.`;

    const instructionsToUse = systemInstruction || defaultInstruction;

    // Payload para API REST do Google
    const requestBody = {
      contents: [
        ...validHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      systemInstruction: {
        parts: [{ text: instructionsToUse }]
      },
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4000
      }
    };

    // Chamada direta (sem SDK) para evitar problemas de dependência no Netlify
    // Usando gemini-flash-latest que foi validado no script de diagnóstico
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Erro na API do Google: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text }),
    };

  } catch (error: any) {
    console.error('Server Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
    };
  }
};

export { handler };
