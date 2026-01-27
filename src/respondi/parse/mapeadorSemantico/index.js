// Importa as bibliotecas necessárias
// 'fs' para ler arquivos, 'transformers' para o modelo de IA, e 'cosine-similarity' para os cálculos.
import fs from 'fs';
//import { pipeline } from '@xenova/transformers';
import cosineSimilarity from 'cosine-similarity';
import OpenAI from 'openai';

/**
 * Função para executar o processo de mapeamento semântico entre as perguntas do formulario e as propriedades do lead.
 * @typedef { import("../../../app/index.js").default } App
 * @param {App} app 
 */
export default async (app, answersData) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        // --- 1. CARREGAR OS DADOS ---
        // pega do kommo os customns fields do contato
        const fieldsData = await app.kommo.FindByQuery("contacts/custom_fields", "");

        const rawAnswers = answersData.respondent.raw_answers;
        const customFields = fieldsData._embedded.custom_fields;

        // Extrai apenas os textos que serão convertidos em vetores (embeddings).
        const questionTitles = rawAnswers.map(answer => answer.question.question_title);
        const fieldNames = customFields.map(field => field.name);

        // --- 2. INICIALIZAR O MODELO DE EMBEDDING ---
        console.log('Usando o modelo de embedding da OpenAI...');

        // --- 3. GERAR EMBEDDINGS ---
        console.log('Gerando embeddings para as perguntas e campos usando OpenAI...');

        async function getEmbeddings(texts) {
            const response = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: texts
            });
            return response.data.map(item => item.embedding);
        }

        const questionEmbeddings = await getEmbeddings(questionTitles);
        const fieldEmbeddings = await getEmbeddings(fieldNames);

        console.log('Embeddings gerados.');

        // --- 4. ENCONTRAR A MELHOR CORRESPONDÊNCIA PARA CADA PERGUNTA ---
        console.log('Calculando similaridade e mapeando os campos...');
        const resultMap = {};

        // Itera sobre cada pergunta e seu embedding.
        for (let i = 0; i < questionTitles.length; i++) {
            const questionId = rawAnswers[i].question.question_id;
            const currentQuestionEmbedding = questionEmbeddings[i];

            let bestMatch = {
                fieldId: null,
                score: -1 // A similaridade de cosseno vai de -1 a 1, então -1 é um bom ponto de partida.
            };

            // Compara a pergunta atual com TODOS os campos disponíveis.
            for (let j = 0; j < fieldNames.length; j++) {
                const fieldId = customFields[j].id;
                const currentFieldEmbedding = fieldEmbeddings[j];

                // Calcula a similaridade de cosseno entre o vetor da pergunta e o vetor do campo.
                const similarityScore = cosineSimilarity(currentQuestionEmbedding, currentFieldEmbedding);
                
                // Se a pontuação atual for a maior que já encontramos para esta pergunta,
                // atualizamos como a melhor correspondência.
                if (similarityScore > bestMatch.score) {
                    bestMatch.score = similarityScore;
                    bestMatch.fieldId = fieldId;
                }
            }
            
            // Adiciona a melhor correspondência encontrada ao objeto de resultado.
            // Opcionalmente, pode-se adicionar um limiar de confiança (ex: if (bestMatch.score > 0.7))
            if (bestMatch.fieldId) {
                resultMap[questionId] = bestMatch.fieldId;
                console.log(` -> Pergunta "${questionTitles[i]}" melhor corresponde com field_id ${bestMatch.fieldId} (Score: ${bestMatch.score.toFixed(4)})`);
            }
        }

        // --- 5. EXIBIR O RESULTADO FINAL ---
        console.log('\n--- MAPEAMENTO FINAL GERADO ---');
        console.log(resultMap);
        
        return resultMap;

    } catch (error) {
        console.error('Ocorreu um erro durante o processo:', error);
        return null;
    }
}