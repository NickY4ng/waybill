// 【实现需求：调用阿里云百炼大模型API生成装卸货效率分析报告，使用新的应用ID和API Key，每次调用创建新会话】

const API_KEY = 'sk-105d7de4928444c6a391492997139290';
const APP_ID = '7498f1bc46fc475ab803dc82e472972c';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;
const CACHE_KEY = 'loading_efficiency_analysis_cache';

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
    text?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  request_id?: string;
}

// 【输入：无 | 输出：string | 约束：从localStorage获取缓存的分析报告】
export function getCachedAnalysis(): string | null {
  return localStorage.getItem(CACHE_KEY);
}

// 【输入：无 | 输出：无 | 约束：清除localStorage中的缓存】
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// 【输入：无 | 输出：Promise<string> | 约束：调用大模型API生成装卸货效率分析HTML报告，每次调用创建新会话】
export async function generateLoadingEfficiencyAnalysis(): Promise<string> {
  const cached = getCachedAnalysis();
  if (cached) {
    return cached;
  }

  try {
    const prompt = `开始分析。

请生成一份详细的装卸货效率分析报告，要求：
    1. 基于5000条运单数据，覆盖28个省份156个城市
    2. 输出格式为完整的HTML代码（包含style和script）
    3. 包含以下模块：
       - 装卸货效率总览（平均装货时间、平均卸货时间、效率评分）
       - 各省份装卸货效率对比（柱状图或雷达图）
       - 装卸货时间分布分析（饼图或直方图）
       - 高效/低效区域识别（TOP5排名）
       - 影响装卸货效率的因素分析
       - 提升装卸货效率的建议
    4. 使用ECharts图表库，直接使用全局变量 echarts（不要加载外部脚本）
    5. 重要：不要使用地图(map)类型图表，因为中国地图数据不可用
    6. 重要：不要使用桑基图(sankey)，因为数据容易出现循环错误
    7. 重要：如果使用热力图(heatmap)，必须配置visualMap组件
    8. 样式要求：深色主题（背景#0f172a，卡片背景#1e293b），与物流数据分析平台风格一致
    9. 数据要求：使用合理的模拟数据，符合物流行业实际情况
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
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: BailianResponse = await response.json();

    const html = data.output?.text || '';

    // 缓存结果
    localStorage.setItem(CACHE_KEY, html);

    return html;
  } catch (error) {
    console.error('生成装卸货效率分析失败:', error);
    throw error;
  }
}
