/**
 * 【实现需求：集成阿里云百炼大模型 API，实现智能问答的真实调用】
 * 【输入：用户问题文本 | 输出：AI 回答文本 | 约束：使用阿里云百炼应用 ID 和 API Key 进行认证】
 */

const APP_ID = 'ac2b455268a049c3b88bf4ff8235d3a9';
const API_KEY = 'sk-28fd9c8776514c45b67f797b410d869a';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;

interface BailianRequest {
  input: {
    prompt: string;
  };
  parameters?: {
    incremental_output?: boolean;
  };
}

interface BailianResponse {
  output?: {
    text: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  request_id?: string;
  code?: string;
  message?: string;
}

/**
 * 【输入：用户问题字符串 | 输出：AI 回答字符串 | 约束：使用阿里云百炼 API，处理网络错误和 API 错误】
 */
export async function callBailianAgent(prompt: string): Promise<string> {
  try {
    const requestBody: BailianRequest = {
      input: {
        prompt: prompt,
      },
      parameters: {
        incremental_output: false,
      },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data: BailianResponse = await response.json();

    if (data.code) {
      throw new Error(`API 错误: ${data.code} - ${data.message}`);
    }

    if (data.output?.text) {
      return data.output.text;
    }

    throw new Error('API 返回数据格式异常');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败，请检查网络连接');
  }
}
