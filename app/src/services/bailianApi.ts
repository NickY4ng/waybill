/**
 * 【实现需求：集成阿里云百炼大模型 API，实现智能问答的真实调用，保持会话上下文】
 * 【输入：用户问题文本 | 输出：AI 回答文本 | 约束：使用阿里云百炼应用 ID 和 API Key 进行认证，同一页面保持会话，超过30轮或页面刷新时创建新会话】
 */

const APP_ID = 'ac2b455268a049c3b88bf4ff8235d3a9';
const API_KEY = 'sk-28fd9c8776514c45b67f797b410d869a';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
const SESSION_KEY = 'bailian_session_id';
const MESSAGE_COUNT_KEY = 'bailian_message_count';
const MAX_MESSAGE_COUNT = 30;

interface BailianRequest {
  input: {
    prompt: string;
    session_id?: string;
  };
  parameters?: {
    incremental_output?: boolean;
  };
}

interface BailianResponse {
  output?: {
    text: string;
    session_id?: string;
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
 * 【输入：无 | 输出：sessionId字符串或null | 约束：从localStorage读取会话ID】
 */
function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * 【输入：sessionId字符串或null | 输出：无 | 约束：保存或清除localStorage中的会话ID】
 */
function setSessionId(sessionId: string | null): void {
  if (sessionId) {
    localStorage.setItem(SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * 【输入：无 | 输出：消息轮数数字 | 约束：从localStorage读取消息计数，默认为0】
 */
function getMessageCount(): number {
  const count = localStorage.getItem(MESSAGE_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

/**
 * 【输入：消息轮数数字 | 约束：保存消息计数到localStorage】
 */
function setMessageCount(count: number): void {
  localStorage.setItem(MESSAGE_COUNT_KEY, count.toString());
}

/**
 * 【输入：无 | 输出：无 | 约束：清除会话ID和消息计数，创建新会话】
 */
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MESSAGE_COUNT_KEY);
}

/**
 * 【输入：用户问题字符串 | 输出：AI 回答字符串 | 约束：使用阿里云百炼 API，保持会话上下文，超过30轮自动重置会话】
 */
export async function callBailianAgent(prompt: string): Promise<string> {
  try {
    let sessionId = getSessionId();
    let messageCount = getMessageCount();

    if (messageCount >= MAX_MESSAGE_COUNT) {
      clearSession();
      sessionId = null;
      messageCount = 0;
    }

    const requestBody: BailianRequest = {
      input: {
        prompt: prompt,
        session_id: sessionId || undefined,
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
      if (data.output.session_id) {
        setSessionId(data.output.session_id);
      }
      setMessageCount(messageCount + 1);
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
