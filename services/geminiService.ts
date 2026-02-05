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

// Schema cho parsed data
const getOutputSchema = () => ({
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
});

// Prompt cơ bản cho phân tích lịch sử
const getBasePrompt = () => `
Phân tích nội dung giáo dục lịch sử sau đây và trích xuất dữ liệu để tạo game.
Nếu không tìm thấy thông tin cụ thể, hãy cố gắng suy luận hoặc để trống.

Yêu cầu output JSON:
1. events: Danh sách sự kiện lịch sử và năm xảy ra.
2. questions: Tạo câu hỏi trắc nghiệm (4 lựa chọn) từ nội dung.
3. characters: Danh sách nhân vật lịch sử và 4 gợi ý về họ (gợi ý 1 khó nhất, gợi ý 4 dễ nhất).
4. title: Tiêu đề ngắn gọn cho nội dung.
`;

// Timeout wrapper để tránh request bị treo quá lâu
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout sau ${timeoutMs / 1000}s`)), timeoutMs)
    )
  ]);
};

// Thời gian timeout cho mỗi request (60 giây)
const REQUEST_TIMEOUT = 60000;

// Hàm gọi AI với cơ chế fallback
const callWithFallback = async (
  apiKey: string,
  prompt: string,
  preferredModel?: string
): Promise<string> => {
  let models = [...FALLBACK_MODELS];
  if (preferredModel && models.includes(preferredModel)) {
    models = [preferredModel, ...models.filter(m => m !== preferredModel)];
  }

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Đang thử với model: ${model}`);
      const ai = new GoogleGenAI({ apiKey });

      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: getOutputSchema() as any
          }
        }),
        REQUEST_TIMEOUT
      );

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      console.log(`✓ Thành công với model: ${model}`);
      return text;
    } catch (error) {
      console.warn(`✗ Model ${model} thất bại:`, error);
      lastError = error as Error;

      // Nếu là lỗi API key không hợp lệ, dừng ngay không thử model khác
      const errorMsg = (error as Error).message || '';
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
        throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại API Key của bạn.');
      }
    }
  }

  throw new Error(`Tất cả models đều thất bại. Lỗi cuối cùng: ${lastError?.message || 'Unknown error'}`)
};

// Hàm gọi AI với ảnh (Gemini Vision)
const callWithImage = async (
  apiKey: string,
  imageBase64: string,
  imageMimeType: string,
  preferredModel?: string
): Promise<string> => {
  let models = [...FALLBACK_MODELS];
  if (preferredModel && models.includes(preferredModel)) {
    models = [preferredModel, ...models.filter(m => m !== preferredModel)];
  }

  let lastError: Error | null = null;

  const prompt = `${getBasePrompt()}

Hãy đọc và phân tích nội dung lịch sử trong hình ảnh này. Trích xuất tất cả thông tin về sự kiện, năm, nhân vật lịch sử.`;

  for (const model of models) {
    try {
      console.log(`Đang thử phân tích ảnh với model: ${model}`);
      const ai = new GoogleGenAI({ apiKey });

      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: imageMimeType,
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: getOutputSchema() as any
          }
        }),
        REQUEST_TIMEOUT
      );

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      console.log(`✓ Phân tích ảnh thành công với model: ${model}`);
      return text;
    } catch (error) {
      console.warn(`✗ Model ${model} thất bại khi phân tích ảnh:`, error);
      lastError = error as Error;

      // Nếu là lỗi API key không hợp lệ, dừng ngay không thử model khác
      const errorMsg = (error as Error).message || '';
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
        throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại API Key của bạn.');
      }
    }
  }

  throw new Error(`Không thể phân tích ảnh. Lỗi: ${lastError?.message || 'Unknown error'}`)
};

// Xử lý và chuẩn hóa dữ liệu trả về
const normalizeData = (data: ParsedData): ParsedData => {
  data.events = data.events.map((e, i) => ({ ...e, id: `evt-${i}`, year: Number(e.year) || 0 }));
  data.questions = data.questions.map((q, i) => ({ ...q, id: `quiz-${i}` }));
  data.characters = data.characters.map((c, i) => ({ ...c, id: `char-${i}` }));
  return data;
};

/**
 * Phân tích nội dung text với Gemini
 */
export const parseContentWithGemini = async (text: string): Promise<ParsedData> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error("Vui lòng nhập API Key trước khi sử dụng");

  const preferredModel = getStoredModel();
  const prompt = `${getBasePrompt()}\n\nNội dung văn bản:\n${text.substring(0, 15000)}`;

  try {
    const jsonText = await callWithFallback(apiKey, prompt, preferredModel);
    const data = JSON.parse(jsonText) as ParsedData;
    return normalizeData(data);
  } catch (e) {
    console.error("Error:", e);
    throw e;
  }
};

/**
 * Phân tích ảnh với Gemini Vision API
 */
export const parseImageWithGemini = async (
  imageBase64: string,
  imageMimeType: string
): Promise<ParsedData> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error("Vui lòng nhập API Key trước khi sử dụng");

  const preferredModel = getStoredModel();

  try {
    const jsonText = await callWithImage(apiKey, imageBase64, imageMimeType, preferredModel);
    const data = JSON.parse(jsonText) as ParsedData;
    return normalizeData(data);
  } catch (e) {
    console.error("Error parsing image:", e);
    throw e;
  }
};