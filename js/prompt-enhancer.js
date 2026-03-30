/**
 * AvtarX — Prompt Enhancer (Secret Injector)
 * Modifies the user's prompt behind the scenes to ensure enterprise-grade output visually.
 */

const SECRET_PREFIX = "Ultra-detailed cinematic avatar portrait of a young person, symmetrical face, sharp jawline, expressive eyes with natural reflections, realistic skin texture with pores and subtle imperfections, soft natural lighting with volumetric glow, high dynamic range (HDR), studio-quality photography, 8K resolution, hyper-realistic, ultra sharp focus. Hair: detailed strands, slightly dynamic, natural flow. Face: balanced proportions, clean skin, subtle highlights, realistic shading. Eyes: glossy, deep, highly detailed iris, catchlight reflections. Lighting: soft key light + rim light, cinematic shadows, depth. Style: blend of realism and digital art, slightly stylized but grounded. Background: blurred (bokeh), minimalistic, gradient or soft neon glow. Color grading: professional cinematic tones, high contrast but natural skin tones. Camera: 85mm lens, shallow depth of field, f/1.8, DSLR quality. Composition: centered portrait, rule of thirds, head and shoulders framing. Quality tags: masterpiece, best quality, ultra HD, 8k, highly detailed, photorealistic, professional, trending on artstation.";

const SECRET_NEGATIVE = "blurry, low resolution, distorted face, extra limbs, bad anatomy, overexposed, underexposed, noise, artifacts, watermark, text, logo, cropped, duplicate face.";

/**
 * Enhances the prompt with the secret tags to guarantee extremely high fidelity.
 * @param {string} userPrompt 
 * @returns {string} 
 */
export function enhancePrompt(userPrompt) {
  // Combine user prompt with the high-fidelity template instruction
  return `${userPrompt}, ${SECRET_PREFIX}`;
}

/**
 * Gets the static negative prompt.
 * @returns {string}
 */
export function getNegativePrompt() {
  return SECRET_NEGATIVE;
}
