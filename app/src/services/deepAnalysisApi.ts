/**
 * 【实现需求：深度分析Agent API，使用独立的应用ID和提示词】
 * 【输入：用户问题文本 | 输出：AI 回答文本（严格三阶段对话，最终输出HTML报告） | 约束：使用深度分析专用应用ID和API Key，支持会话保持】
 */

const APP_ID = 'dc7df2d0429e490d9ee0e641f323a9cf';
const API_KEY = 'sk-4799bdec97094b54b6711b185e4a6686';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
const DEEP_ANALYSIS_SESSION_KEY = 'deep_analysis_session_id';
const DEEP_ANALYSIS_MESSAGE_COUNT_KEY = 'deep_analysis_message_count';
const MAX_MESSAGE_COUNT = 30;

// 【深度分析系统提示词 - 融合版V3.0】
const DEEP_ANALYSIS_SYSTEM_PROMPT = ``;

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
  return localStorage.getItem(DEEP_ANALYSIS_SESSION_KEY);
}

/**
 * 【输入：sessionId字符串或null | 输出：无 | 约束：保存或清除localStorage中的会话ID】
 */
function setSessionId(sessionId: string | null): void {
  if (sessionId) {
    localStorage.setItem(DEEP_ANALYSIS_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(DEEP_ANALYSIS_SESSION_KEY);
  }
}

/**
 * 【输入：无 | 输出：消息轮数数字 | 约束：从localStorage读取消息计数，默认为0】
 */
function getMessageCount(): number {
  const count = localStorage.getItem(DEEP_ANALYSIS_MESSAGE_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

/**
 * 【输入：消息轮数数字 | 约束：保存消息计数到localStorage】
 */
function setMessageCount(count: number): void {
  localStorage.setItem(DEEP_ANALYSIS_MESSAGE_COUNT_KEY, count.toString());
}

/**
 * 【输入：无 | 输出：无 | 约束：清除深度分析会话ID和消息计数，创建新会话】
 */
export function clearDeepAnalysisSession(): void {
  console.log('[深度分析API] 清除会话ID前:', localStorage.getItem(DEEP_ANALYSIS_SESSION_KEY));
  localStorage.removeItem(DEEP_ANALYSIS_SESSION_KEY);
  localStorage.removeItem(DEEP_ANALYSIS_MESSAGE_COUNT_KEY);
  console.log('[深度分析API] 清除会话ID后:', localStorage.getItem(DEEP_ANALYSIS_SESSION_KEY));
}

/**
 * 【输入：用户问题字符串 | 输出：AI 回答字符串 | 约束：使用阿里云百炼 API，保持会话上下文，超过30轮自动重置会话】
 */
export async function callDeepAnalysisAgent(prompt: string): Promise<string> {
  try {
    let sessionId = getSessionId();
    let messageCount = getMessageCount();

    // 如果消息轮数超过限制，重置会话
    if (messageCount >= MAX_MESSAGE_COUNT) {
      clearDeepAnalysisSession();
      sessionId = null;
      messageCount = 0;
    }

    // 【优化：只有新会话（无sessionId）时才发送系统提示词】
    // 有sessionId说明是继续对话，只需发送用户问题，上下文会自动保持
    const fullPrompt = sessionId
      ? prompt  // 继续对话，只发送用户问题
      : `${DEEP_ANALYSIS_SYSTEM_PROMPT}\n\n=== 用户问题 ===\n${prompt}`;  // 新会话，发送系统提示词+用户问题

    // 【调试日志】
    console.log('[深度分析API] sessionId:', sessionId);
    console.log('[深度分析API] 是否新会话:', !sessionId);
    console.log('[深度分析API] 系统提示词长度:', DEEP_ANALYSIS_SYSTEM_PROMPT.length);
    console.log('[深度分析API] 完整prompt长度:', fullPrompt.length);
    console.log('[深度分析API] 完整prompt前200字符:', fullPrompt.substring(0, 200));

    const requestBody: BailianRequest = {
      input: {
        prompt: fullPrompt,
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
      // 保存会话ID
      if (data.output.session_id) {
        setSessionId(data.output.session_id);
      }
      // 增加消息计数
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

/**
 * 【输入：HTML字符串 | 输出：无 | 约束：触发浏览器下载HTML文件】
 */
export function downloadHtmlReport(html: string, filename: string = '深度分析报告.html'): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 【输入：文本内容 | 输出：布尔值 | 约束：判断内容是否为HTML报告（必须包含完整的HTML文档结构）】
 */
export function isHtmlReport(content: string): boolean {
  // 严格判断：必须包含完整的HTML文档结构
  const hasHtmlStructure = content.includes('<!DOCTYPE html>') || 
                           content.includes('<html') || 
                           (content.includes('<head>') && content.includes('<body>'));
  // 同时长度要足够长（至少10000字符，确保是真正的HTML报告而不是简单的HTML标签）
  const isLongContent = content.length > 10000;
  // 必须同时满足：有HTML结构 且 长度足够
  return hasHtmlStructure && isLongContent;
}
