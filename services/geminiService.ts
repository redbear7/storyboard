
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ImageStyle, Era, AspectRatio } from "../types";

const getApiKey = () => {
  return localStorage.getItem('LIFEDRAMA_API_KEY') || process.env.API_KEY || '';
};

/**
 * Analyzes the script using gemini-3-pro-preview.
 */
export const analyzeScript = async (scriptText: string, chapterCount: number, selectedStyle: ImageStyle, era: Era): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const isJoseon = era === 'joseon';
  
  const prompt = `
    Analyze the following Korean drama script set in the ${era === 'modern' ? 'MODERN DAY' : 'JOSEON DYNASTY PERIOD'}.
    
    Task:
    1. Identify the single most intense "Climax" scene.
    2. Divide the rest into exactly ${chapterCount} key "스토리보드 컷" (Storyboard Cuts).
    3. Create a "Hooking Headline" (2 lines, concise, impactful Korean).
    4. **등장캐릭터**: Identify the 2-3 most important main characters. For each character, provide a detailed English "imagePrompt" that will generate a high-quality SOLO portrait consistent with their description.
    5. **시각적 가이드**: Define a guide to maintain character consistency.

    **CRITICAL LANGUAGE RULE**: 
    - The "imagePrompt" fields (for scenes AND characters) MUST be in English.
    - ALL OTHER FIELDS (headline, characters.name, characters.description, visualStyleGuide, title, summary, scriptSegment) MUST be written in KOREAN.

    For each storyboard cut and character:
    - "imagePrompt": Detailed English prompt including specific physical features, clothing, and mood.
    - **SETTING & CLOTHING**: ${isJoseon 
        ? "Strictly JOSEON DYNASTY setting. Characters MUST wear TRADITIONAL Korean clothing (Hanbok). Architecture must be traditional Hanok." 
        : "Strictly MODERN South Korean setting. Characters MUST wear MODERN fashion. Architecture must be modern cityscapes/interiors."}

    Response must be valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, { text: scriptText }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.OBJECT,
              properties: {
                line1: { type: Type.STRING, description: '간결하고 강렬한 첫 번째 헤드라인 줄입니다.' },
                line2: { type: Type.STRING, description: '간결하고 강렬한 두 번째 헤드라인 줄입니다.' }
              },
              required: ["line1", "line2"]
            },
            visualStyleGuide: { type: Type.STRING, description: '캐릭터의 일관성을 유지하기 위한 한국어 가이드입니다.' },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: '캐릭터 이름입니다.' },
                  description: { type: Type.STRING, description: '캐릭터 특징 설명입니다.' },
                  imagePrompt: { type: Type.STRING, description: 'Detailed English prompt for this specific character portrait.' }
                },
                required: ["name", "description", "imagePrompt"]
              }
            },
            climax: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: '장면 제목입니다.' },
                summary: { type: Type.STRING, description: '장면 요약입니다.' },
                scriptSegment: { type: Type.STRING, description: '장면의 대본 발췌입니다.' },
                imagePrompt: { type: Type.STRING, description: 'English visual prompt.' }
              },
              required: ["title", "summary", "scriptSegment", "imagePrompt"]
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: '장면 제목입니다.' },
                  summary: { type: Type.STRING, description: '장면 요약입니다.' },
                  scriptSegment: { type: Type.STRING, description: '장면의 대본 발췌입니다.' },
                  imagePrompt: { type: Type.STRING, description: 'English visual prompt.' }
                },
                required: ["title", "summary", "scriptSegment", "imagePrompt"]
              }
            }
          },
          required: ["headline", "visualStyleGuide", "characters", "climax", "chapters"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI로부터 응답을 받지 못했습니다.");
    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("분석 실패:", error);
    throw error;
  }
};

const STYLE_PROMPTS: Record<ImageStyle, string> = {
  cinematic: "Photorealistic, cinematic lighting, 8k, highly detailed, realistic skin textures, film grain.",
  webtoon_action: "Modern manhwa style, sharp lines, vibrant colors, dynamic shading, aesthetic, high contrast.",
  webtoon_romance: "Soft manhwa style, pastel colors, sparkly eyes, emotional atmosphere, graceful character designs, beautiful background wash.",
  webtoon_thriller: "Dark manhwa style, gritty textures, heavy shadows, suspenseful atmosphere, sharp angles, muted color palette with high contrast.",
  webtoon_yadam: "Traditional Korean ink wash painting aesthetic combined with clean manhwa lines, elegant, subtle traditional textures."
};

/**
 * Generates images using gemini-2.5-flash-image.
 */
export const generateImage = async (prompt: string, style: ImageStyle, styleGuide: string, era: Era, aspectRatio: AspectRatio, isCharacter: boolean = false): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const isJoseon = era === 'joseon';
    const eraContext = isJoseon 
      ? "Set in Joseon Dynasty, wearing traditional Korean Hanbok, traditional Korean architecture" 
      : "Set in modern day South Korea, wearing modern trendy fashion, modern city background";
    
    // 캐릭터 생성 시 단독 인물임을 극도로 강조
    const characterHint = isCharacter 
      ? "A solo portrait of ONE SINGLE PERSON. ONLY ONE individual in the frame. No groups, no crowds, no second person. Single subject only. Centered portrait, looking at camera." 
      : "";
      
    const finalPrompt = `${prompt}. ${characterHint}. ${STYLE_PROMPTS[style]}. ${styleGuide}. ${eraContext}. South Korean character. High quality.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("이미지 데이터를 찾을 수 없습니다.");
  } catch (error: any) {
    throw error;
  }
};
