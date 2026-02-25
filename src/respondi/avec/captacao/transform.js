import { promises as fs } from 'fs';
import { join } from 'path';

// --- Configuration ---
// Mapping of question titles to their corresponding IDs and types.
// This allows for a more structured and predictable output.
const questionConfig = {
    "Qual é o seu nome completo?": { id: "xopyalskloic", type: "name" },
    "Qual é o seu número de Whatsapp?": { id: "x9qne4si4vzp", type: "phone" },
    "Qual é o seu melhor e-mail?": { id: "xk4qpp2lhoh", type: "email" },
    "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": { id: "xg6ayiq29rwf", type: "text" },
    "Em qual estado seu salão está situado?": { id: "xzn55i94d4f", type: "text" },
    "Em qual cidade seu salão está situado?": { id: "xd115sg65bpr", type: "text" },
    "Quem é você dentro do negócio?": { id: "xjnirz2pqgy", type: "radio" },
    "Você tem clareza do lucro do seu negócio?": { id: "xuvuahv3jyor", type: "radio" },
    "Qual o tempo de atuação no seu negócio?": { id: "xt2h6820w2x", type: "text" },
    "Qual o número de colaboradores no seu time?": { id: "xotep0x273uc", type: "radio" },
    "Em qual àrea você sente mais dificuldade hoje?": { id: "x3c9u8ihorn4", type: "radio" },
    "Quanto você fatura no seu negócio mensalmente?": { id: "xwmol4zkwuc", type: "radio" }
};

// List of keys from the source object that are not actual questions.
const nonQuestionKeys = [
    'Pontuação', 'Data', 'ID', 'utm_source', 'utm_medium', 'utm_campaign', 
    'utm_term', 'utm_content', 'gclid', 'fbclid'
];

/**
 * Transforms a single record from the source format to the target format.
 * @param {object} originalRecord - The original data object.
 * @returns {object} The transformed data object.
 */
function transformRecord(originalRecord) {
    const answers = {};
    const raw_answers = [];

    // Iterate over each property in the original object to build answers
    for (const key in originalRecord) {
        if (originalRecord.hasOwnProperty(key) && !nonQuestionKeys.includes(key)) {
            const answerValue = originalRecord[key];
            answers[key] = answerValue; // Populate the simple answers object

            const config = questionConfig[key] || { id: `unknown_${Math.random().toString(36).substr(2, 9)}`, type: 'text' };
            
            let finalAnswer = answerValue;
            // Special handling for phone numbers
            if (config.type === 'phone' && typeof answerValue === 'string') {
                const parts = answerValue.split(' ');
                finalAnswer = {
                    country: parts[0] || '',
                    phone: parts.slice(1).join('') || ''
                };
            // For radio buttons, the desired output format is an array
            } else if (config.type === 'radio') {
                finalAnswer = [answerValue];
            }

            raw_answers.push({
                question: {
                    question_title: key,
                    question_id: config.id,
                    question_type: config.type
                },
                answer: finalAnswer
            });
        }
    }

    // Construct the final transformed object
    return {
        form: {
            form_name: "Novo formulário Avec Franquia Barueri",
            form_id: "ceksxHyj"
        },
        respondent: {
            status: "completed",
            date: originalRecord['Data'],
            score: originalRecord['Pontuação'],
            respondent_id: originalRecord['ID'],
            answers: answers,
            raw_answers: raw_answers,
            respondent_utms: {
                utm_source: originalRecord['utm_source'],
                utm_medium: originalRecord['utm_medium'],
                utm_campaign: originalRecord['utm_campaign'],
                utm_term: originalRecord['utm_term'],
                utm_content: originalRecord['utm_content'],
                gclid: originalRecord['gclid'],
                fbclid: originalRecord['fbclid']
            }
        }
    };
}

/**
 * Main function to read, transform, and write the data.
 */
async function main() {
    try {
        const inputFilePath = join('input.json');
        const outputFilePath = join('output.json');

        // 1. Read the source JSON file
        const data = await fs.readFile(inputFilePath, 'utf8');
        const originalArray = JSON.parse(data);

        // 2. Transform the array
        const transformedArray = originalArray.map(transformRecord);

        // 3. Write the new array to the output file
        await fs.writeFile(outputFilePath, JSON.stringify(transformedArray, null, 4));

        console.log(`Successfully transformed the data and saved it to ${outputFilePath}`);
    } catch (error) {
        console.error("An error occurred during the transformation process:", error);
    }
}

// Execute the main function
main();