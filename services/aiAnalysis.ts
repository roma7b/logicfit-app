/**
 * Gera um relatório estratégico de evolução corporal em formato JSON utilizando o proxy serverless.
 */
export const gerarRelatorioEstrategico = async (dadosAvaliacao: any, metodologia?: any): Promise<string | null> => {
  try {
    const dadosCompletos = {
      ...dadosAvaliacao,
      metodologia_aplicada: metodologia || "Não especificada"
    };

    const inputData = JSON.stringify(dadosCompletos, null, 2);

    const systemInstruction = `# INSTRUÇÃO DO SISTEMA: Analista Estratégico de Evolução Corporal

## 1. PAPEL E OBJETIVO
Você é um **Cientista de Dados de Saúde e Estrategista de Treinamento**. Sua função é analisar a avaliação corporal do cliente, validar a metodologia usada e gerar um plano tático.

## 2. FORMATO DE SAÍDA (OBRIGATÓRIO)
Você DEVE retornar APENAS um objeto JSON válido e minificado (sem quebras de linha). Não use Markdown. Siga estritamente este schema:

{ "diagnostico_estrategico": { "risco_principal": "string", "justificativa_completa": "string", "analise_metodologia": "string" }, "resumo_evolucao_texto": { "eficacia_estrategia": "string", "destaque_progresso": "string", "ponto_alerta": "string" }, "plano_ajuste_proxima_fase": [ { "foco": "Nutricional", "acao": "string" }, { "foco": "Treinamento", "acao": "string" }, { "foco": "Comportamental", "acao": "string" } ], "anotacoes_aluno_sugeridas": "string" }`;

    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'generate',
        prompt: `Analise os seguintes dados do aluno e gere o relatório JSON: \n\n${inputData} `,
        systemInstruction: systemInstruction,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText} `);
    }

    const data = await response.json();
    return data.text;

  } catch (error) {
    console.error("Erro AI Strategy:", error);
    return null;
  }
};

/**
 * Gera um relatório motivacional para o dashboard do aluno via Proxy.
 */
export const gerarRelatorioMotivacional = async (dadosAvaliacao: any): Promise<string | null> => {
  try {
    const inputData = JSON.stringify(dadosAvaliacao, null, 2);

    const systemInstruction = `
    # ATUAÇÃO
    Você é um 'Coach Motivacional' especializado em psicologia do esporte.
    
    # OBJETIVO
    Analisar os dados do aluno e gerar um micro - report motivacional em JSON.
    
    # FORMATO OBRIGATÓRIO(JSON)
    {
      "titulo_motivacional": "string (Uma frase de impacto curto, ex: 'Você é uma Máquina!')",
        "conquistas_recentes": "string (Um parágrafo curto elogiando a consistência ou melhora nos números)",
          "objetivos_proxima_fase": [
            { "area": "Treino", "acao": "string (ex: Aumentar carga no supino)" },
            { "area": "Alimentação", "acao": "string (ex: Bater proteína diária)" },
            { "area": "Descanso", "acao": "string (ex: Dormir 7h por noite)" }
          ]
    }
    `;

    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'generate',
        prompt: `Gere um report motivacional com base nestes dados: \n\n${inputData} `,
        systemInstruction: systemInstruction,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error('Falha na API Motivacional');

    const data = await response.json();
    return data.text;

  } catch (e) {
    console.error("Erro AI Motivacional", e);
    return null;
  }
};