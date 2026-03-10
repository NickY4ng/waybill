/**
 * 【实现需求：调用阿里云百炼大模型API生成企业上下游分析报告】
 * 【输入：无 | 输出：HTML格式的分析报告 | 约束：使用独立的应用ID和API Key，每次调用创建新会话】
 */

const APP_ID = '5766913d97124f5da37f0e99f31883ca';
const API_KEY = 'sk-d93416cdfbc84a9e8e333fc9a4276066';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
const CACHE_KEY = 'enterprise_analysis_html';

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
 * 【输入：无 | 输出：缓存的HTML字符串或null | 约束：从localStorage读取缓存】
 */
export function getCachedAnalysis(): string | null {
  return localStorage.getItem(CACHE_KEY);
}

/**
 * 【输入：HTML字符串 | 约束：保存分析结果到localStorage缓存】
 */
export function setCachedAnalysis(html: string): void {
  localStorage.setItem(CACHE_KEY, html);
}

/**
 * 【输入：无 | 输出：HTML字符串 | 约束：调用大模型API生成企业上下游分析报告，每次调用创建新会话，使用缓存机制】
 */
export async function generateEnterpriseAnalysis(): Promise<string> {
  const cached = getCachedAnalysis();
  if (cached) {
    return cached;
  }

  try {
    const prompt = `开始分析。

请生成一份详细的企业上下游分析报告，要求：
1. 基于5000条运单数据，覆盖28个省份156个城市
2. 输出格式为完整的HTML代码（包含style和script）
3. 包含以下模块：
   - 企业总览（企业总数、活跃企业数、核心企业分布）
   - 上游供应商分析（供应商数量、集中度、TOP10供应商）
   - 下游客户分析（客户数量、集中度、TOP10客户）
   - 供应链关系网络（上下游关联度、关键节点识别）
   - 企业画像分析（企业类型分布、规模分布、区域分布）
   - 供应链优化建议
4. 使用ECharts图表库，直接使用全局变量 echarts（不要加载外部脚本）
5. 重要：不要使用地图(map)类型图表，因为中国地图数据不可用
6. 重要：不要使用桑基图(sankey)，因为数据容易出现循环错误
7. 重要：如果使用热力图(heatmap)，必须配置visualMap组件
8. 每个图表下方要有解读结论
9. 样式要求：深色主题（背景#0f172a，卡片背景#1e293b），与物流数据分析平台风格一致
10. 确保所有图表都有初始化代码，例如：var chart = echarts.init(document.getElementById('chart-id'));`;

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
      setCachedAnalysis(data.output.text);
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
 * 【输入：无 | 约束：清除企业分析的缓存】
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
