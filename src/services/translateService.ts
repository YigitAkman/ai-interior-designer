import axios from 'axios';

/**
 * Translates text from Turkish to English using MyMemory API.
 * This ensures that the AI models receive prompts in a language they understand best.
 */
export const translateToEnglish = async (text: string): Promise<string> => {
    if (!text || text.trim() === '') return '';
    
    // Check if the text contains any Turkish characters. If not, it might already be English.
    // However, it's safer to always run it through translation or detect language.
    // Simple check for Turkish-specific characters: ç, ğ, ı, ö, ş, ü
    const turkishChars = /[çğışöüÇĞİŞÖÜ]/;
    if (!turkishChars.test(text)) {
        // If no Turkish characters are found, we still check if it's potentially English
        // but for now, let's just translate to be sure or if it's long enough.
        // If it's a single word like "Modern", translation won't hurt.
    }

    try {
        console.log(`🌐 Translating prompt: "${text}"`);
        
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: 'tr|en'
            }
        });

        if (response.data && response.data.responseData) {
            const translatedText = response.data.responseData.translatedText;
            console.log(`✅ Translated to: "${translatedText}"`);
            return translatedText;
        }
        
        return text; // Fallback to original if translation fails
    } catch (error) {
        console.error("❌ Translation Error:", error);
        return text; // Fallback to original
    }
};
