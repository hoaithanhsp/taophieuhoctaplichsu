import { GoogleGenAI, Type } from "@google/genai";
import { ParsedData } from "../types";

// Danh sách model fallback theo thứ tự ưu tiên
const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash'
];

// Helper functions cho localStorage
export const getStoredApiKey = (): string | null => {
  return localStorage.getItem('gemini_api_key');
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem('gemini_api_key', key);
};

export const getStoredModel = (): string => {
  return localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';
};

export const setStoredModel = (model: string): void => {
  localStorage.setItem('gemini_model', model);
};

// Hàm gọi AI với cơ chế fallback
const callWithFallback = async (
  apiKey: string,
  prompt: string,
  schema: object,
  preferredModel?: string
): Promise<string> => {
  // Sắp xếp models với preferred model lên đầu
  let models = [...FALLBACK_MODELS];
  if (preferredModel && models.includes(preferredModel)) {
    models = [preferredModel, ...models.filter(m => m !== preferredModel)];
  }

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Đang thử với model: ${model}`);
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema as any
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      console.log(`✓ Thành công với model: ${model}`);
      return text;
    } catch (error) {
      console.warn(`✗ Model ${model} thất bại:`, error);
      lastError = error as Error;
      // Tiếp tục với model tiếp theo
    }
  }

  // Tất cả models đều thất bại
  throw new Error(`Tất cả models đều thất bại. Lỗi cuối cùng: ${lastError?.message || 'Unknown error'}`);
};

export const parseContentWithGemini = async (text: string): Promise<ParsedData> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error("Vui lòng nhập API Key trước khi sử dụng");

  const preferredModel = getStoredModel();

  const prompt = `
    Phân tích nội dung văn bản giáo dục lịch sử sau đây và trích xuất dữ liệu để tạo game.
    Nếu không tìm thấy thông tin cụ thể, hãy cố gắng suy luận hoặc để trống.
    
    Yêu cầu output JSON:
    1. events: Danh sách sự kiện lịch sử và năm xảy ra.
    2. questions: Tạo câu hỏi trắc nghiệm (4 lựa chọn) từ nội dung.
    3. characters: Danh sách nhân vật lịch sử và 4 gợi ý về họ (gợi ý 1 khó nhất, gợi ý 4 dễ nhất).
    4. title: Tiêu đề ngắn gọn cho nội dung.

    Nội dung văn bản:
    ${text.substring(0, 15000)}
  `;

  // Define schema using Type enum
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      events: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            year: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ["name", "year"]
        }
      },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
          }
        }
      },
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            hints: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
          }
        }
      }
    }
  };

  try {
    const jsonText = await callWithFallback(apiKey, prompt, schema, preferredModel);

    const data = JSON.parse(jsonText) as ParsedData;
    // Add IDs if missing and sanitize
    data.events = data.events.map((e, i) => ({ ...e, id: `evt-${i}`, year: Number(e.year) || 0 }));
    data.questions = data.questions.map((q, i) => ({ ...q, id: `quiz-${i}` }));
    data.characters = data.characters.map((c, i) => ({ ...c, id: `char-${i}` }));
    return data;
  } catch (e) {
    console.error("Error:", e);
    throw e;
  }
};