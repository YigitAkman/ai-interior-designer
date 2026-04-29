import axios from 'axios';
import { translateToEnglish } from './translateService';

const FAL_API_KEY = process.env.EXPO_PUBLIC_FAL_API_KEY;

interface FalResponse {
    images: Array<{
        url: string;
        width: number;
        height: number;
    }>;
    request_id: string;
}

/**
 * Generates an interior design transformation using an existing image.
 * Uses fal-ai/flux-2/flash/edit for advanced and fast image-to-image editing.
 */
export const generateDesign = async (imageInput: string, prompt: string): Promise<string> => {
    try {
        if (!imageInput) {
            throw new Error("Görsel verisi eksik. Lütfen bir görsel seçin.");
        }

        console.log(`🎨 Fal.ai: Transform Image request started (Flash Edit)`);

        // Translate Turkish prompt to English
        const englishPrompt = await translateToEnglish(prompt);

        // Ensure we send a valid image source to Fal.ai
        // If it's already a URL or has the data prefix, use it as is.
        // Otherwise, wrap it in a data URI prefix.
        let finalImageSource = imageInput;
        if (typeof imageInput === 'string' && !imageInput.startsWith('http') && !imageInput.startsWith('data:')) {
            finalImageSource = `data:image/jpeg;base64,${imageInput}`;
        }

        const response = await axios.post<FalResponse>(
            'https://fal.run/fal-ai/flux-2/flash/edit',
            {
                image_urls: [finalImageSource],
                prompt: englishPrompt + ", Ultra photorealistic 8K interior render, hyper-detailed, physically based rendering (PBR), ray tracing, global illumination, cinematic lighting, soft natural shadows, real-world material textures, ultra high resolution 7680x4320, DSLR photography look, 35mm lens, depth of field, HDR, sharp focus, realistic light bounce, volumetric light, high dynamic range, realistic reflections, micro surface details, texture fidelity, architectural visualization quality, professional interior photography, premium rendering, Octane render quality, Unreal Engine 5 quality, extreme realism, no CGI look cinematic camera movement, interior architectural photography, natural window light, soft shadow gradients, balanced exposure, realistic white balance, professional color grading, depth layering, foreground framing, AVOID: low resolution, blurry, flat lighting, bad shadows, unrealistic materials, cartoonish, CGI, 3D render look, oversaturated, distorted perspective, noisy texture, plastic surfaces, bad proportions, unrealistic reflections.",
                sync_mode: true,
                guidance_scale: 2.5,
                num_images: 1,
                enable_prompt_expansion: false,
                output_format: "jpeg"
            },
            {
                headers: {
                    'Authorization': `Key ${FAL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.images && response.data.images.length > 0) {
            console.log("✅ Fal.ai: Image transformed successfully");
            return response.data.images[0].url;
        } else {
            throw new Error("Fal.ai hatası: Görsel üretilemedi.");
        }
    } catch (error: any) {
        console.error("❌ Fal.ai Transform Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || "Fal.ai üzerinden odayı yenilerken bir hata oluştu.");
    }
};

/**
 * Generates an image from scratch using only a text prompt (Dream mode)
 * Uses fal-ai/flux-1/schnell for super fast and high quality text-to-image.
 */
export const generateFromText = async (prompt: string): Promise<string> => {
    try {
        console.log(`🌟 Fal.ai: Dream Text-to-Image request started (Schnell)`);

        // Translate Turkish prompt to English
        const englishPrompt = await translateToEnglish(prompt);

        const response = await axios.post<FalResponse>(
            'https://fal.run/fal-ai/flux-1/schnell',
            {
                prompt: englishPrompt + ", Ultra photorealistic 8K interior render, hyper-detailed, physically based rendering (PBR), ray tracing, global illumination, cinematic lighting, soft natural shadows, real-world material textures, ultra high resolution 7680x4320, DSLR photography look, 35mm lens, depth of field, HDR, sharp focus, realistic light bounce, volumetric light, high dynamic range, realistic reflections, micro surface details, texture fidelity, architectural visualization quality, professional interior photography, premium rendering, Octane render quality, Unreal Engine 5 quality, extreme realism, no CGI look cinematic camera movement, interior architectural photography, natural window light, soft shadow gradients, balanced exposure, realistic white balance, professional color grading, depth layering, foreground framing, AVOID: low resolution, blurry, flat lighting, bad shadows, unrealistic materials, cartoonish, CGI, 3D render look, oversaturated, distorted perspective, noisy texture, plastic surfaces, bad proportions, unrealistic reflections.",
                num_inference_steps: 12, // High-quality fixed steps
                enable_safety_checker: true,
                sync_mode: true
            },
            {
                headers: {
                    'Authorization': `Key ${FAL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.images && response.data.images.length > 0) {
            console.log("✅ Fal.ai: Dream Image generated successfully");
            return response.data.images[0].url;
        } else {
            throw new Error("Fal.ai hatası: Dream görseli üretilemedi.");
        }
    } catch (error: any) {
        console.error("❌ Fal.ai Dream Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || "Hayalinizi görselleştirirken bir hata oluştu.");
    }
};

