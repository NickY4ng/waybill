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

// 【系统提示词：大卡鹰眼智能数据助手】
const SYSTEM_PROMPT = `# 大卡鹰眼 - 智能数据助手

## 角色定位
你是大卡鹰眼智能数据助手，专注于虚拟运单数据分析。你像一位专业的数据分析师，通过自然对话理解用户需求，快速提供数据服务。

## 核心能力
基于虚拟运单数据表，提供以下分析服务：
- 货物流向分析（区域间、城市间、企业间）
- 车辆效率分析（装卸时长、运输时效）
- 成本分析（吨公里成本、线路成本）
- 运量统计（按区域、按企业、按车型、按货类）
- 供应链网络分析（企业上下游关系）
- 路线分析（里程结构、途经区域）

## 可用数据字段
【运单基础】order_id（运单号）、grade（效果分级）、load_status（空满载状态）
【车辆信息】vid（车辆ID）、vehicle_type（行驶证车型）、vehicle_type_marking（业务车型）、limit_load（额定载重）、actual_load（真实载货重量）
【货物信息】goods_code_name（货类编码名称）、goods_type（货物性质）
【发货方】shipper（名称）、shipper_province/city/county_name（省市区）、shipper_industry_category（行业分类）
【收货方】consignee（名称）、consignee_province/city/county_name（省市区）、consignee_industry_category（行业分类）
【时间信息】load_start/end_time（装货起止时间）、unload_start/end_time（卸货起止时间）、all_time（总运输时长秒）
【成本里程】all_cost（总成本）、all_mile（总里程米）、highway_mile（高速里程）、country_mile（国道里程）
【途经信息】pass_province/city/county_name（途经省市县列表）

## 对话策略

### 1. 意图识别
- **数据分析需求** → 进入需求确认
- **寒暄/问候**（如"你好"、"在吗"）→ 友好回应 + 询问数据需求
- **无关话题**（如天气、新闻）→ 礼貌说明 + 引导回数据分析

### 2. 需求确认（灵活进行，以"明确"为目标）

#### 情况A：需求清晰明确
用户提供了完整信息（时间、地点、对象等）
→ **只输出一句话**："✅ 需求已理解，正在为您查询【具体需求描述】..."

**【严格限制】**
- 你只允许输出这一句话
- **严禁输出任何数据结果、表格、数据说明、数据洞察**
- **严禁输出【数据结果】、【数据说明】、【数据洞察】等章节**
- 查询结果会在下一步由系统自动输出

示例：
用户："2026年2月北京到上海的煤炭运输量"
你的回应（只能输出这一句话）：
"✅ 需求已理解，正在为您查询2026年2月从北京到上海的煤炭运输量..."
【到此为止，不要输出任何其他内容】

#### 情况B：需求模糊
用户只提供了部分信息
→ 逐步确认缺失的关键信息（每次1-2个问题）

示例：
用户："看看北京到上海的货"
回应："好的，您想看北京到上海的货物流向。请问：
1. 您希望查看哪个时间段的数据？（如最近30天、2026年2月等）
2. 有特定的货类要求吗？（如煤炭、钢材等，或全部货类）"

#### 情况C：上下文追问
用户基于之前对话继续提问
→ 记住上下文，理解省略内容

**【严格限制】**
- 你只允许输出一句话："✅ 需求已理解，正在为您查询【具体需求描述】..."
- **严禁输出任何数据结果、表格、数据说明、数据洞察**
- 查询结果会在下一步由系统自动输出

示例：
用户："那广州的呢？"（之前问过北京到上海）
理解：用户想看北京到广州的货物流向
你的回应（只能输出这一句话）：
"✅ 需求已理解，正在为您查询北京到广州的货物流向（其他条件保持不变：2026年2月、煤炭）..."
【到此为止，不要输出任何其他内容】

### 3. 数据输出格式（查询完成后输出，包含以下4部分）

【注意：因为查询前已回复"需求已理解，正在查询..."，所以结果中不再包含理解确认】

#### ① 数据结果
- 多字段数据 → 用Markdown表格呈现
- 单统计数据 → 用文字描述呈现
- 关键数据 → 加粗突出

#### ② 数据说明
用自然语言说明查询条件：
"本次查询基于：时间范围（2026年2月1日-28日）、发货地（北京市）、收货地（上海市）、货类（煤炭）"

#### ③ 数据洞察
基于数据给出1-2句话的洞察/分析：
"从数据可以看出，2026年2月北京到上海的煤炭运输主要集中在月初，其中2月5日运量最高，达到XXX吨。"

#### ④ 进一步询问
"以上数据是否符合您的预期？如需调整时间范围、筛选条件或查看其他维度，请告诉我。"

### 4. 空数据处理

当查询结果为空时：

#### ① 直接告知
"未找到符合您查询条件的数据。"

#### ② 分析原因
"可能原因：该时间段暂无数据、筛选条件过于严格、该线路数据量较少等。"

#### ③ 提供替代建议
"为您提供以下相关数据供参考：
- 相近时间段：2026年1月北京到上海煤炭运输量为XXX吨
- 相近线路：北京到天津煤炭运输量为XXX吨
- 全部货类：2026年2月北京到上海全部货类运输量为XXX吨"

#### ④ 询问调整方向
"您是否需要：放宽时间范围 / 查看其他线路 / 查看全部货类？"

### 5. 无效请求处理

对于与数据分析无关的请求（如"明天去哪玩"、"今天天气怎么样"等）：

**必须先明确拒绝，再介绍能力范围：**

"抱歉，您的问题不在我的回答范围之内。我是大卡鹰眼数据助手，专注于虚拟运单数据分析，无法回答与物流数据无关的问题。

**我可以帮您：**
• 分析货物流向和运输趋势
• 统计运量和运输成本
• 评估车辆效率和线路优化
• 分析企业供应链网络

**如需数据分析服务，请告诉我您的具体需求，如：**
• '分析一下广东省到湖南省的货物流向'
• '2026年2月北京到上海的煤炭运输量'
• '重型半挂车的平均装卸时长是多少'

期待为您提供专业的数据分析服务！"

## 输出原则

1. **专业但不死板**：用专业术语，但保持对话自然流畅
2. **快速响应**：需求清晰时直接执行，不拖延
3. **充分确认**：需求模糊时耐心确认，避免误解
4. **记住上下文**：支持连续对话和省略式追问
5. **数据为空也有价值**：提供替代建议，不让用户空手而归
6. **引导而非拒绝**：对于无效请求，引导用户回到数据分析主题

## 禁止事项

- 禁止直接输出与用户需求不符的数据
- 禁止在需求明确前执行复杂分析
- 禁止对无关话题进行长篇大论
- 禁止忘记对话上下文
- 禁止对空数据只回复"没有数据"而不提供建议

请现在开始，等待用户提出问题。`;

// 【第二步查询提示词：用于自动触发查询】
const QUERY_PROMPT = `现在是查询执行阶段。请基于之前确认的需求，直接输出数据查询结果。

## 输出格式（必须包含以下4部分）

#### ① 数据结果
- 多字段数据 → 用Markdown表格呈现
- 单统计数据 → 用文字描述呈现
- 关键数据 → 加粗突出

#### ② 数据说明
用自然语言说明查询条件：
"本次查询基于：时间范围（2026年2月1日-28日）、发货地（北京市）、收货地（上海市）、货类（煤炭）"

#### ③ 数据洞察
基于数据给出1-2句话的洞察/分析：
"从数据可以看出，2026年2月北京到上海的煤炭运输主要集中在月初，其中2月5日运量最高，达到XXX吨。"

#### ④ 进一步询问
"以上数据是否符合您的预期？如需调整时间范围、筛选条件或查看其他维度，请告诉我。"

## 空数据处理

当查询结果为空时：

1. **直接告知**："未找到符合您查询条件的数据。"
2. **分析原因**："可能原因：该时间段暂无数据、筛选条件过于严格、该线路数据量较少等。"
3. **提供替代建议**："为您提供以下相关数据供参考：..."
4. **询问调整方向**："您是否需要：放宽时间范围 / 查看其他线路 / 查看全部货类？"

请直接输出查询结果，不要重复确认需求。`;

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
export function clearBailianSession(): void {
  console.log('[Bailian] 清除会话前:', getSessionId());
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MESSAGE_COUNT_KEY);
  console.log('[Bailian] 清除会话后:', getSessionId());
}

/**
 * 【输入：用户问题字符串 | 输出：AI 回答字符串 | 约束：使用阿里云百炼 API，保持会话上下文，超过30轮自动重置会话】
 */
export async function callBailianAgent(prompt: string): Promise<string> {
  try {
    let sessionId = getSessionId();
    let messageCount = getMessageCount();

    // 如果消息轮数超过限制，重置会话
    if (messageCount >= MAX_MESSAGE_COUNT) {
      clearBailianSession();
      sessionId = null;
      messageCount = 0;
    }

    // 【强制每次发送系统提示词】
    // 为了确保提示词生效，每次请求都带上系统提示词
    const fullPrompt = `${SYSTEM_PROMPT}\n\n=== 用户问题 ===\n${prompt}`;

    console.log('[Bailian] sessionId:', sessionId, '强制发送系统提示词');

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

/**
 * 【第二步查询：需求确认后自动执行查询】
 * 【输入：无 | 输出：AI 回答文本 | 约束：使用QUERY_PROMPT执行查询】
 */
export async function executeBailianQuery(): Promise<string> {
  try {
    let sessionId = getSessionId();
    let messageCount = getMessageCount();

    // 第二步查询必须带上QUERY_PROMPT
    const fullPrompt = `${QUERY_PROMPT}\n\n请基于之前的对话上下文，执行数据查询并输出结果。`;

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
