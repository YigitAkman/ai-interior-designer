import axios from 'axios';

/**
 * Translates text from Turkish to English using MyMemory API.
 * This ensures that the AI models receive prompts in a language they understand best.
 */
export const translateToEnglish = async (text: string): Promise<string> => {
    if (!text || text.trim() === '') return '';
    
    try {
        // MyMemory API has a 500 character limit for the free tier.
        // We split the text into chunks of 450 characters to be safe.
        const chunks = text.match(/.{1,450}(\s|$)/g) || [text];
        
        console.log(`🌐 Translating prompt (${chunks.length} chunks)...`);
        
        const translatedChunks = await Promise.all(chunks.map(async (chunk) => {
            const response = await axios.get('https://api.mymemory.translated.net/get', {
                params: {
                    q: chunk.trim(),
                    langpair: 'tr|en'
                }
            });
            return response.data?.responseData?.translatedText || chunk;
        }));

        const finalTranslation = translatedChunks.join(' ');
        console.log(`✅ Translation completed.`);
        return finalTranslation;
    } catch (error) {
        console.error("❌ Translation Error:", error);
        return text; 
    }
};
