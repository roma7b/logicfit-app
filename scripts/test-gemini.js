import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testGemini() {
    console.log("--- Iniciando Teste de Diagnóstico do Gemini ---");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env");
        console.log("Verifique se o arquivo .env existe na raiz e tem a chave definida.");
        process.exit(1);
    } else {
        console.log("✅ API Key encontrada (termina com: " + apiKey.slice(-4) + ")");
    }

    try {
        console.log("🔄 Inicializando SDK...");
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelName = "gemini-flash-latest";
        console.log(`🔄 Configurando modelo: ${modelName}`);

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: {
                role: "system",
                parts: [{ text: "Responda apenas com 'OK'." }]
            }
        });

        console.log("🔄 Enviando mensagem de teste...");
        const result = await model.generateContent("Teste de conexão");
        const response = await result.response;
        const text = response.text();

        console.log("✅ SUCESSO! Resposta recebida do Gemini:");
        console.log("------------------------------------------------");
        console.log(text);
        console.log("------------------------------------------------");
    } catch (error) {
        console.error("❌ FALHA NO TESTE:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("StatusText:", error.response.statusText);
        }
        console.error("Mensagem de Erro:", error.message);
        console.error("Detalhes Completos:", error);
    }
}

testGemini();
