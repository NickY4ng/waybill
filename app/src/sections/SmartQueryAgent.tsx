import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2, Download, Eye, FileText, Check, X, Upload, Shield, Cpu, BarChart3, MapPin, TrendingUp, Users, Activity, Database, LineChart, FileBarChart, BrainCircuit, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { clearBailianSession } from '@/services/bailianApi';

// 鼠标跟随Tooltip组件 - 使用Portal渲染到body
interface MouseFollowTooltipProps {
  children: React.ReactNode;
  content: string;
}

function MouseFollowTooltip({ children, content }: MouseFollowTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    // 使用全局鼠标位置，让浮窗在整个页面显示
    setPosition({ 
      x: e.clientX + 10, 
      y: e.clientY + 10 
    });
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setPosition({ 
      x: e.clientX + 10, 
      y: e.clientY + 10 
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // 防止浮窗超出屏幕边界
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 340),
    y: Math.min(position.y, window.innerHeight - 200),
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className="fixed z-[2147483647] w-80 bg-white border border-slate-200 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>,
        document.body
      )}
    </>
  );
}
import { callDeepAnalysisAgent, downloadHtmlReport, isHtmlReport, clearDeepAnalysisSession } from '@/services/deepAnalysisApi';
import { incrementServiceCount } from '@/sections/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';

// 消息类型
interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isHtml?: boolean;
  isDeepAnalysis?: boolean;
}

// 会话类型
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 深度分析任务类型
interface DeepAnalysisTask {
  id: string;
  sessionId: string;
  messageId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

// CSV下载任务类型
interface CsvDownloadTask {
  id: string;
  messageId: string;
  fileName: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  data?: string;
  createdAt: Date;
  completedAt?: Date;
}

// 专家类型
interface Expert {
  id: string;
  name: string;
  title: string;
  avatar: string;
  specialty: string;
  status: 'idle' | 'working' | 'completed';
  currentTask: string;
  progress: number;
  order: number;
}

// 动态查询状态类型
interface QueryStatus {
  id: string;
  text: string;
  icon: React.ReactNode;
}

// 分析阶段类型
type AnalysisPhase = 'requirement' | 'requirement_waiting' | 'analysis' | 'summarizing' | 'completed';

// 分析模板类型
interface AnalysisTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompt: string;
  hoverContent: string;
}

// 自定义模板类型
interface CustomTemplate {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

// 自定义模板存储键
const CUSTOM_TEMPLATES_KEY = 'daka_custom_templates';

// 分析模板列表
const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'flow',
    name: '货物流向分析',
    icon: <MapPin className="w-5 h-5" />,
    description: '分析区域间货物流动特征、热门线路、流向分布',
    prompt: '请对以下问题进行货物流向深度分析，重点关注：1）主要流向分布 2）热门运输线路 3）区域间货物流动特征 4）货类构成分析',
    hoverContent: `
      <div class="p-3 text-xs">
        <h4 class="font-semibold mb-1.5 text-sm">分析目的：</h4>
        <p class="mb-2.5 text-slate-600">提供标准化的货物流向分析框架，基于虚拟运单数据从8个维度全面理解货物运输特征，支持区域规划、货类洞察、运力优化等决策需求。</p>
        <h4 class="font-semibold mb-1.5 text-sm">8个分析维度：</h4>
        <ul class="list-disc pl-4 space-y-0.5 text-slate-600">
          <li>区域流向维度 - 分析货物从出发地到目的地的流动特征</li>
          <li>货类流向维度 - 分析不同货类的特定流向特征</li>
          <li>POI类型维度 - 按场站POI类型分析流向</li>
          <li>时间趋势维度 - 分析月度、季度、年度货物流向变化，识别季节性波动和长期趋势</li>
          <li>流向集中度维度 - 统计热门线路占比，评估货物流向集中或分散程度</li>
          <li>距离分布维度 - 按运输距离区间分析特征</li>
          <li>线路维度 - 分析线路分布及特征</li>
          <li>车辆属性维度 - 分析参与运输车辆的静态基本信息</li>
        </ul>
      </div>
    `
  },
  {
    id: 'supplychain',
    name: '上下游分析',
    icon: <Users className="w-5 h-5" />,
    description: '分析企业供应链关系、合作伙伴、网络密度',
    prompt: '请对以下问题进行供应链深度分析，重点关注：1）企业上下游关系 2）合作伙伴分析 3）供应链网络密度 4）关键节点识别',
    hoverContent: `
      <div class="p-3 text-xs">
        <h4 class="font-semibold mb-1.5 text-sm">分析目的：</h4>
        <p class="mb-2.5 text-slate-600">提供8个标准化分析维度，支撑企业上下游分析、供应链溯源、行业洞察等关键需求，帮助客户快速理解供应链网络结构、货物流向、关键节点、效率成本及趋势风险。</p>
        <h4 class="font-semibold mb-1.5 text-sm">8个分析维度：</h4>
        <ul class="list-disc pl-4 space-y-0.5 text-slate-600">
          <li>企业流量维度 - 量化企业物流活动规模，识别核心物流节点</li>
          <li>供应链溯源维度 - 追溯货物来源和去向，构建供应链网络</li>
          <li>行业特征维度 - 分析不同行业的供应链特征和差异</li>
          <li>龙头识别维度 - 识别行业内的关键企业和市场领导者</li>
          <li>距离集中度维度 - 量化供应链的空间效率和市场结构</li>
          <li>装卸效率维度 - 评估供应链节点的操作效率</li>
          <li>成本效益维度 - 量化供应链的运输成本和效益</li>
          <li>趋势预测维度 - 分析供应链的时间动态和未来趋势</li>
        </ul>
      </div>
    `
  },
];

// 需求确认专家（第一阶段）
const REQUIREMENT_EXPERT: Expert = {
  id: 'req',
  name: '首席需求分析师',
  title: '刘薇',
  avatar: '🔍',
  specialty: '业务需求洞察与分析范围界定',
  status: 'idle',
  currentTask: '等待指令',
  progress: 0,
  order: 0,
};

// 分析专家团队（第二阶段，依次工作）
const ANALYSIS_EXPERTS: Expert[] = [
  {
    id: '1',
    name: '首席数据架构师',
    title: '陈明',
    avatar: '🎯',
    specialty: '分布式数据检索与清洗',
    status: 'idle',
    currentTask: '等待指令',
    progress: 0,
    order: 1,
  },
  {
    id: '2',
    name: '高级物流算法专家',
    title: '苏菲',
    avatar: '🔮',
    specialty: '物流网络优化与流向预测',
    status: 'idle',
    currentTask: '等待指令',
    progress: 0,
    order: 2,
  },
  {
    id: '3',
    name: '行业战略顾问',
    title: '张凯',
    avatar: '⚡',
    specialty: '供应链战略与行业洞察',
    status: 'idle',
    currentTask: '等待指令',
    progress: 0,
    order: 3,
  },
  {
    id: '4',
    name: '数据可视化总监',
    title: '王艺',
    avatar: '💎',
    specialty: '交互式可视化与报告设计',
    status: 'idle',
    currentTask: '等待指令',
    progress: 0,
    order: 4,
  },
];

// 需求确认阶段状态
const REQUIREMENT_STATUSES: QueryStatus[] = [
  { id: 'req1', text: '正在解析用户意图...', icon: <BrainCircuit className="w-4 h-4" /> },
  { id: 'req2', text: '正在识别分析维度...', icon: <Activity className="w-4 h-4" /> },
  { id: 'req3', text: '正在界定分析范围...', icon: <MapPin className="w-4 h-4" /> },
  { id: 'req4', text: '正在构建分析框架...', icon: <Database className="w-4 h-4" /> },
];

// 深度分析阶段状态
const ANALYSIS_STATUSES: QueryStatus[] = [
  { id: '1', text: '正在连接数据中交数据库...', icon: <Database className="w-4 h-4" /> },
  { id: '2', text: '正在检索运单数据...', icon: <Activity className="w-4 h-4" /> },
  { id: '3', text: '正在清洗数据...', icon: <BrainCircuit className="w-4 h-4" /> },
  { id: '4', text: '正在加工数据...', icon: <Cpu className="w-4 h-4" /> },
  { id: '5', text: '正在分析物流特征...', icon: <LineChart className="w-4 h-4" /> },
  { id: '6', text: '正在计算成本指标...', icon: <BarChart3 className="w-4 h-4" /> },
  { id: '7', text: '正在识别网络节点...', icon: <Users className="w-4 h-4" /> },
  { id: '8', text: '正在生成可视化图表...', icon: <FileBarChart className="w-4 h-4" /> },
  { id: '9', text: '正在构建分析报告...', icon: <FileText className="w-4 h-4" /> },
  { id: '10', text: '正在优化报告布局...', icon: <BrainCircuit className="w-4 h-4" /> },
  { id: '11', text: '正在进行数据校验...', icon: <Check className="w-4 h-4" /> },
  { id: '12', text: '正在生成最终报告...', icon: <TrendingUp className="w-4 h-4" /> },
];

// 示例问题
const EXAMPLE_QUERIES = [
  '分析全国货物流向',
  '给我输出一个物流时效的分析方案',
  '统计25年全年运单数',
  '导出北京到河北的运单数据',
];

// 生成会话标题
const generateSessionTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.type === 'user');
  if (firstUserMessage) {
    return firstUserMessage.content.slice(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '');
  }
  return '新会话';
};

// HTML代码高亮组件
const HtmlCodeHighlight = ({ code }: { code: string }) => {
  const highlightedRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlightedRef.current) {
      highlightedRef.current.innerHTML = Prism.highlight(
        code,
        Prism.languages.markup,
        'markup'
      );
    }
  }, [code]);

  return (
    <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[600px]">
      <code ref={highlightedRef as React.RefObject<HTMLElement>} className="language-markup" />
    </pre>
  );
};

export function SmartQueryAgent() {
  // 会话状态
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: '新会话',
      messages: [
        {
          id: 'welcome',
          type: 'bot',
          content: '您好！我是大卡鹰眼智能报表专家。我可以帮您快速查询数据、行业咨询和多维度深度分析数据。请告诉我您的需求？',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return [initialSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(sessions[0].id);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 输入状态
  const [input, setInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AnalysisTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // 自定义模板状态
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showCustomTemplateDialog, setShowCustomTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [customTemplateForm, setCustomTemplateForm] = useState({
    title: '',
    description: '',
  });

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [, setDeepAnalysisTasks] = useState<DeepAnalysisTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isQueryRunning, setIsQueryRunning] = useState(false);

  // CSV下载任务状态
  const [csvTasks, setCsvTasks] = useState<CsvDownloadTask[]>([]);

  // 分析阶段状态
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('requirement');
  const [requirementExpert, setRequirementExpert] = useState<Expert>(REQUIREMENT_EXPERT);
  const [analysisExperts, setAnalysisExperts] = useState<Expert[]>(ANALYSIS_EXPERTS);
  const [currentExpertIndex, setCurrentExpertIndex] = useState(0);

  // 右侧栏状态
  const [selectedHtmlReport, setSelectedHtmlReport] = useState<{ content: string; messageId: string } | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'html' | 'engine'>('engine');
  const [showRightPanel, setShowRightPanel] = useState(false);

  // 全屏预览状态
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // 动态查询状态
  const [currentQueryStatusIndex, setCurrentQueryStatusIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expertIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  // 当前查询状态
  const currentQueryStatuses = analysisPhase === 'requirement' ? REQUIREMENT_STATUSES : ANALYSIS_STATUSES;
  const currentQueryStatus = currentQueryStatuses[currentQueryStatusIndex % currentQueryStatuses.length];

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 动态查询状态循环
  useEffect(() => {
    if (!isQueryRunning) {
      if (queryIntervalRef.current) {
        clearInterval(queryIntervalRef.current);
        queryIntervalRef.current = null;
      }
      return;
    }

    queryIntervalRef.current = setInterval(() => {
      setCurrentQueryStatusIndex(prev => (prev + 1) % currentQueryStatuses.length);
    }, 2000);

    return () => {
      if (queryIntervalRef.current) {
        clearInterval(queryIntervalRef.current);
      }
    };
  }, [isQueryRunning, currentQueryStatuses.length]);

  // 专家依次工作的动画效果
  useEffect(() => {
    if (!showRightPanel || activeRightTab !== 'engine' || !isQueryRunning || analysisPhase !== 'analysis') {
      if (expertIntervalRef.current) {
        clearInterval(expertIntervalRef.current);
        expertIntervalRef.current = null;
      }
      return;
    }

    expertIntervalRef.current = setInterval(() => {
      setAnalysisExperts(prev => {
        const newExperts = [...prev];
        const currentExpert = newExperts[currentExpertIndex];
        
        if (currentExpert && currentExpert.status === 'working') {
          const newProgress = Math.min(currentExpert.progress + Math.random() * 15, 100);
          newExperts[currentExpertIndex] = {
            ...currentExpert,
            progress: newProgress,
            currentTask: newProgress >= 100 ? '任务完成' : currentExpert.currentTask,
            status: newProgress >= 100 ? 'completed' : 'working',
          };
          
          // 当前专家完成，切换到下一个
          if (newProgress >= 100 && currentExpertIndex < newExperts.length - 1) {
            setTimeout(() => {
              setCurrentExpertIndex(prev => prev + 1);
              setAnalysisExperts(prevExperts => {
                const updated = [...prevExperts];
                updated[currentExpertIndex + 1] = {
                  ...updated[currentExpertIndex + 1],
                  status: 'working',
                  currentTask: getExpertTask(updated[currentExpertIndex + 1].id),
                };
                return updated;
              });
            }, 500);
          }
          
          // 数据可视化总监（第4个专家，index=3）完成后，进入汇总阶段
          if (newProgress >= 100 && currentExpertIndex === 3) {
            setTimeout(() => {
              setAnalysisPhase('summarizing');
            }, 600);
          }
        }
        
        return newExperts;
      });
    }, 1200);

    return () => {
      if (expertIntervalRef.current) {
        clearInterval(expertIntervalRef.current);
      }
    };
  }, [showRightPanel, activeRightTab, isQueryRunning, analysisPhase, currentExpertIndex]);

  // 获取专家任务描述
  const getExpertTask = (expertId: string): string => {
    switch (expertId) {
      case '1': return '连接数据中交数据库...';
      case '2': return '构建物流网络模型...';
      case '3': return '提取行业关键指标...';
      case '4': return '设计可视化方案...';
      default: return '处理中...';
    }
  };

  // 启动需求确认阶段
  const startRequirementPhase = useCallback(() => {
    setAnalysisPhase('requirement');
    setRequirementExpert({
      ...REQUIREMENT_EXPERT,
      status: 'working',
      progress: 0,
      currentTask: '正在分析用户需求...',
    });
    setIsQueryRunning(true);
    setCurrentQueryStatusIndex(0);
  }, []);

  // 启动深度分析阶段（需求确认完成后）
  const startAnalysisPhase = useCallback(() => {
    setAnalysisPhase('analysis');
    setCurrentExpertIndex(0);
    setAnalysisExperts(ANALYSIS_EXPERTS.map((exp, index) => ({
      ...exp,
      status: index === 0 ? 'working' : 'idle',
      progress: index === 0 ? 0 : 0,
      currentTask: index === 0 ? getExpertTask(exp.id) : '等待指令',
    })));
    setRequirementExpert(prev => ({ ...prev, status: 'completed', progress: 100, currentTask: '需求确认完成' }));
    setIsQueryRunning(true);
    setCurrentQueryStatusIndex(0);
  }, []);

  // 停止查询状态
  const stopQueryStatus = useCallback(() => {
    setIsQueryRunning(false);
    if (queryIntervalRef.current) {
      clearInterval(queryIntervalRef.current);
      queryIntervalRef.current = null;
    }
    if (expertIntervalRef.current) {
      clearInterval(expertIntervalRef.current);
      expertIntervalRef.current = null;
    }
  }, []);

  // 完成所有分析
  const completeAnalysis = useCallback(() => {
    setAnalysisPhase('completed');
    setAnalysisExperts(prev => prev.map(exp => ({
      ...exp,
      status: 'completed',
      progress: 100,
      currentTask: '分析完成',
    })));
    stopQueryStatus();
  }, [stopQueryStatus]);

  // 创建新会话
  const createNewSession = () => {
    clearBailianSession();
    clearDeepAnalysisSession();
    stopQueryStatus();
    setAnalysisPhase('requirement');
    setRequirementExpert(REQUIREMENT_EXPERT);
    setAnalysisExperts(ANALYSIS_EXPERTS);
    setCurrentExpertIndex(0);
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新会话',
      messages: [
        {
          id: 'welcome',
          type: 'bot',
          content: '您好！我是大卡鹰眼智能报表专家。我可以帮您快速查询数据、行业咨询和多维度深度分析数据。请告诉我您的需求？',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedTemplate(null);
    setUploadedFile(null);
    setSelectedHtmlReport(null);
    setShowRightPanel(false);
    setActiveRightTab('engine');
  };

  // 删除会话
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      if (newSessions.length === 0) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: '新会话',
          messages: [
            {
              id: 'welcome',
              type: 'bot',
              content: '您好！我是大卡鹰眼智能报表专家。我可以帮您快速查询数据、行业咨询和多维度深度分析数据。请告诉我您的需求？',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentSessionId(newSession.id);
    return [newSession];
  }
  if (currentSessionId === sessionId) {
    setCurrentSessionId(newSessions[0].id);
  }
  return newSessions;
});
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowPrivacyNotice(true);
    }
  };

  // 检测是否是CSV下载请求
  const isCsvDownloadRequest = (text: string): { isRequest: boolean; dataType: string } => {
    const downloadKeywords = ['下载', '导出', '提取', '导出数据', '下载数据'];
    const isRequest = downloadKeywords.some(keyword => text.includes(keyword));
    
    // 根据内容推断数据类型
    let dataType = '运单数据';
    if (text.includes('北京') && text.includes('河北')) {
      dataType = '北京到河北运单';
    } else if (text.includes('2024') || text.includes('10月')) {
      dataType = '2024年10月数据';
    } else if (text.includes('煤炭')) {
      dataType = '煤炭运输数据';
    } else if (text.includes('山西')) {
      dataType = '山西运单数据';
    }
    
    return { isRequest, dataType };
  };

  // 处理发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 检测是否是CSV下载请求（演示用途）
    const { isRequest, dataType } = isCsvDownloadRequest(input);
    if (isRequest) {
      // 创建用户消息
      const userMessageId = Date.now().toString();
      const userMessage: Message = {
        id: userMessageId,
        type: 'user',
        content: input,
        timestamp: new Date(),
      };

      // 创建AI回复消息
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        type: 'bot',
        content: `已收到您的数据导出请求，正在为您准备「${dataType}」的CSV文件，请稍候...`,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          const newMessages = [...session.messages, userMessage, botMessage];
          return {
            ...session,
            messages: newMessages,
            title: session.title === '新会话' ? generateSessionTitle(newMessages) : session.title,
            updatedAt: new Date(),
          };
        }
        return session;
      }));

      setInput('');
      
      // 启动CSV下载任务
      setTimeout(() => {
        startCsvDownloadTask(botMessageId, dataType);
      }, 500);
      
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const newMessages = [...session.messages, userMessage];
        return {
          ...session,
          messages: newMessages,
          title: session.title === '新会话' ? generateSessionTitle(newMessages) : session.title,
          updatedAt: new Date(),
        };
      }
      return session;
    }));

    setInput('');
    setIsLoading(true);

    // 统一使用深度分析模式
    setShowRightPanel(true);
    setActiveRightTab('engine');
    
    // 创建任务记录
    const taskId = Date.now().toString();
    setCurrentTaskId(taskId);
    const newTask: DeepAnalysisTask = {
      id: taskId,
      sessionId: currentSessionId,
      messageId: '',
      status: 'running',
      startTime: new Date(),
    };
    setDeepAnalysisTasks(prev => [...prev, newTask]);

    // 根据当前阶段启动不同的专家
    if (analysisPhase === 'requirement') {
      startRequirementPhase();
    } else {
      startAnalysisPhase();
    }

    try {
      // 构建完整提示词，直接使用用户输入
      let fullPrompt = input;
      
      // 如果选择了模板，添加模板提示词
      if (selectedTemplate) {
        fullPrompt = `${selectedTemplate.prompt}\n\n${fullPrompt}`;
      }
      
      // 如果有上传文件，添加文件信息
      if (uploadedFile) {
        fullPrompt += `\n\n用户上传文件：${uploadedFile.name}`;
      }

      // 统一调用深度分析接口
      const aiResponse = await callDeepAnalysisAgent(fullPrompt);
      incrementServiceCount();

      // 检查是否是"需求已理解"确认消息
      const isRequirementUnderstood = aiResponse.includes('需求已理解') &&
                                      aiResponse.includes('正在为您生成深度分析报告');

      if (isRequirementUnderstood) {
        // 先显示"需求已理解"消息
        const confirmResponse: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: aiResponse,
          timestamp: new Date(),
          isHtml: false,
          isDeepAnalysis: true,
        };

        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [...session.messages, confirmResponse],
              updatedAt: new Date(),
            };
          }
          return session;
        }));

        // 需求确认完成，切换到分析阶段
        setRequirementExpert(prev => ({ ...prev, status: 'completed', progress: 100, currentTask: '需求确认完成' }));
        
        // 等待一小段时间
        await new Promise(resolve => setTimeout(resolve, 800));

        // 启动分析阶段
        startAnalysisPhase();

        // 自动触发第二次调用，生成HTML报告
        const htmlReportResponse = await callDeepAnalysisAgent('【系统触发】请基于已确认的分析范围，生成完整的HTML深度分析报告。');
        incrementServiceCount();

        const isHtmlContent = isHtmlReport(htmlReportResponse);
        const htmlMessageId = Date.now().toString();
        const htmlBotResponse: Message = {
          id: htmlMessageId,
          type: 'bot',
          content: htmlReportResponse,
          timestamp: new Date(),
          isHtml: isHtmlContent,
          isDeepAnalysis: true,
        };

        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [...session.messages, htmlBotResponse],
              updatedAt: new Date(),
            };
          }
          return session;
        }));

        // 报告生成后，完成分析
        completeAnalysis();

        // 自动选中这个报告在右侧展示
        if (isHtmlContent) {
          setSelectedHtmlReport({ content: htmlReportResponse, messageId: htmlMessageId });
          setActiveRightTab('preview');
          setIsSidebarCollapsed(true);
        }

        // 更新任务状态为完成
        setDeepAnalysisTasks(prev => prev.map(task =>
          task.id === currentTaskId
            ? { ...task, status: 'completed', endTime: new Date(), messageId: htmlMessageId }
            : task
        ));

        setIsLoading(false);
        return;
      }

      // 如果不是确认消息（可能是确认问题或引导话术）
      const isHtmlContent = isHtmlReport(aiResponse);
      const botResponse: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date(),
        isHtml: isHtmlContent,
        isDeepAnalysis: true,
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, botResponse],
            updatedAt: new Date(),
          };
        }
        return session;
      }));

      // 进入等待用户确认状态
      setAnalysisPhase('requirement_waiting');
      setRequirementExpert(prev => ({ 
        ...prev, 
        status: 'completed', 
        progress: 100, 
        currentTask: '等待用户确认分析范围' 
      }));

      // 停止查询状态
      stopQueryStatus();

      setIsLoading(false);
      return;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请求失败，请稍后重试';
      const botResponse: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **请求失败**\n\n${errorMessage}\n\n请检查网络连接或稍后重试。`,
        timestamp: new Date(),
        isHtml: false,
      };

      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, botResponse],
            updatedAt: new Date(),
          };
        }
        return session;
      }));

      // 更新任务状态为失败
      setDeepAnalysisTasks(prev => prev.map(task =>
        task.id === currentTaskId
          ? { ...task, status: 'failed', endTime: new Date() }
          : task
      ));

      // 停止查询状态
      stopQueryStatus();
    } finally {
      setIsLoading(false);
      setUploadedFile(null);
    }
  };

  // 点击示例
  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  // 下载HTML报告
  const handleDownloadHtml = (content: string) => {
    const titleMatch = content.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '深度分析报告';
    const cleanTitle = title
      .replace(/[<>:"\/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const now = new Date();
    const dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const filename = `${cleanTitle}_${dateStr}_${timeStr}.html`;
    downloadHtmlReport(content, filename);
  };

  // 生成CSV文件名
  const generateCsvFileName = (dataType: string): string => {
    const now = new Date();
    const dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    return `${dataType}_${dateStr}_${timeStr}.csv`;
  };

  // 模拟生成CSV数据
  const generateMockCsvData = (rowCount: number): string => {
    const headers = ['运单号', '出发地', '目的地', '货物类型', '重量(吨)', '发货时间', '到达时间', '运费(元)'];
    const cities = ['北京', '上海', '广州', '深圳', '天津', '重庆', '武汉', '南京', '杭州', '成都'];
    const cargoTypes = ['电子产品', '服装', '食品', '建材', '化工', '家具', '机械设备'];
    
    let csv = headers.join(',') + '\n';
    
    for (let i = 0; i < rowCount; i++) {
      const fromCity = cities[Math.floor(Math.random() * cities.length)];
      let toCity = cities[Math.floor(Math.random() * cities.length)];
      while (toCity === fromCity) {
        toCity = cities[Math.floor(Math.random() * cities.length)];
      }
      
      const waybillNo = 'YD' + String(Date.now()).slice(-8) + String(i).padStart(4, '0');
      const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
      const weight = (Math.random() * 30 + 1).toFixed(2);
      const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const freight = Math.floor(Math.random() * 5000 + 500);
      
      csv += `${waybillNo},${fromCity},${toCity},${cargoType},${weight},${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]},${freight}\n`;
    }
    
    return csv;
  };

  // 开始CSV下载任务（模拟）
  const startCsvDownloadTask = (messageId: string, dataType: string) => {
    const taskId = Date.now().toString();
    const totalRows = Math.floor(Math.random() * 5000) + 1000; // 模拟1000-6000行数据
    
    const newTask: CsvDownloadTask = {
      id: taskId,
      messageId,
      fileName: generateCsvFileName(dataType),
      status: 'generating',
      progress: 0,
      totalRows,
      processedRows: 0,
      createdAt: new Date(),
    };
    
    setCsvTasks(prev => [...prev, newTask]);
    
    // 模拟进度更新
    const interval = setInterval(() => {
      setCsvTasks(prev => {
        const task = prev.find(t => t.id === taskId);
        if (!task || task.status !== 'generating') {
          clearInterval(interval);
          return prev;
        }
        
        const increment = Math.floor(Math.random() * 200) + 50;
        const newProcessed = Math.min(task.processedRows + increment, task.totalRows);
        const newProgress = Math.floor((newProcessed / task.totalRows) * 100);
        
        if (newProcessed >= task.totalRows) {
          // 完成
          clearInterval(interval);
          const csvData = generateMockCsvData(task.totalRows);
          return prev.map(t => 
            t.id === taskId 
              ? { ...t, status: 'completed', progress: 100, processedRows: task.totalRows, data: csvData, completedAt: new Date() }
              : t
          );
        }
        
        return prev.map(t => 
          t.id === taskId 
            ? { ...t, progress: newProgress, processedRows: newProcessed }
            : t
        );
      });
    }, 200);
  };

  // 下载CSV文件
  const handleDownloadCsv = (task: CsvDownloadTask) => {
    if (!task.data) return;
    
    const blob = new Blob(['\ufeff' + task.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = task.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 点击HTML报告消息
  const handleHtmlMessageClick = (message: Message) => {
    if (message.isHtml && message.isDeepAnalysis) {
      setSelectedHtmlReport({ content: message.content, messageId: message.id });
      setActiveRightTab('preview');
      setShowRightPanel(true);
      setIsSidebarCollapsed(true);
    }
  };

  // 选择模板
  const handleSelectTemplate = (template: AnalysisTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(false);
  };

  // 选择自定义模板
  const handleSelectCustomTemplate = (template: CustomTemplate) => {
    setInput(`【使用自定义模板：${template.title}】\n\n${template.description}\n\n请基于以上分析框架进行深度分析：`);
    setShowTemplateDialog(false);
  };

  // 保存自定义模板到localStorage
  const saveCustomTemplates = (templates: CustomTemplate[]) => {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    setCustomTemplates(templates);
  };

  // 打开新建模板弹窗
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setCustomTemplateForm({
      title: '',
      description: '【分析目的】\n\n\n【分析维度】\n\n',
    });
    setShowCustomTemplateDialog(true);
  };

  // 打开编辑模板弹窗
  const handleOpenEditTemplate = (template: CustomTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setCustomTemplateForm({
      title: template.title,
      description: template.description,
    });
    setShowCustomTemplateDialog(true);
  };

  // 保存自定义模板
  const handleSaveCustomTemplate = () => {
    if (!customTemplateForm.title.trim()) {
      alert('请输入模板标题');
      return;
    }
    if (!customTemplateForm.description.trim()) {
      alert('请输入维度说明');
      return;
    }
    if (customTemplateForm.description.length > 1000) {
      alert('维度说明不能超过1000字');
      return;
    }

    const now = Date.now();
    if (editingTemplate) {
      // 编辑模式
      const updated = customTemplates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, title: customTemplateForm.title, description: customTemplateForm.description, updatedAt: now }
          : t
      );
      saveCustomTemplates(updated);
    } else {
      // 新建模式
      const newTemplate: CustomTemplate = {
        id: now.toString(),
        title: customTemplateForm.title,
        description: customTemplateForm.description,
        createdAt: now,
        updatedAt: now,
      };
      saveCustomTemplates([newTemplate, ...customTemplates]);
    }
    setShowCustomTemplateDialog(false);
  };

  // 删除自定义模板
  const handleDeleteCustomTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个自定义模板吗？')) {
      const filtered = customTemplates.filter(t => t.id !== templateId);
      saveCustomTemplates(filtered);
    }
  };

  // 清除模板选择
  const handleClearTemplate = () => {
    setSelectedTemplate(null);
  };

  // 关闭右侧面板
  const handleCloseRightPanel = () => {
    setShowRightPanel(false);
    setSelectedHtmlReport(null);
    setActiveRightTab('engine');
  };

  // 渲染专家团队
  const renderExpertTeam = () => (
    <div className="space-y-4">
      {/* 动态查询状态 */}
      {isQueryRunning ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700">
                {analysisPhase === 'requirement' ? '需求确认中' : 
                 analysisPhase === 'analysis' ? '深度分析中' : 
                 analysisPhase === 'summarizing' ? '整体汇总中' : '处理中'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-blue-500">{currentQueryStatus.icon}</span>
                <span className="text-sm text-blue-600">{currentQueryStatus.text}</span>
              </div>
            </div>
          </div>
        </div>
      ) : analysisPhase === 'requirement_waiting' ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700">等待用户确认</div>
              <div className="text-sm text-amber-600 mt-1">请确认分析范围后，系统将启动深度分析</div>
            </div>
          </div>
        </div>
      ) : analysisPhase === 'summarizing' ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white animate-pulse">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700">整体汇总中</div>
              <div className="text-sm text-purple-600 mt-1">深度分析报告即将生成，请稍候...</div>
            </div>
          </div>
        </div>
      ) : analysisPhase === 'completed' ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700">分析已完成</div>
              <div className="text-sm text-green-600 mt-1">专家团队已完成全部分析任务</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 需求确认阶段 - 只显示需求专家 */}
      {(analysisPhase === 'requirement' || analysisPhase === 'requirement_waiting') && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">需求确认阶段</span>
            </div>
            <span className="text-xs text-slate-500">界定分析范围</span>
          </div>

          <div className="relative overflow-hidden rounded-xl border transition-all duration-500 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-200 shadow-md">
            {requirementExpert.status === 'working' && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-amber-100/30 to-orange-100/30 transition-all duration-1000"
                style={{ width: `${requirementExpert.progress}%` }}
              />
            )}

            <div className="relative p-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md ${
                  requirementExpert.status === 'working'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse'
                    : requirementExpert.status === 'completed'
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                    : 'bg-gradient-to-br from-slate-200 to-slate-300'
                }`}>
                  {requirementExpert.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{requirementExpert.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{requirementExpert.title}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      requirementExpert.status === 'working'
                        ? 'bg-amber-100 text-amber-700'
                        : requirementExpert.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {requirementExpert.status === 'working' ? '确认中' : requirementExpert.status === 'completed' ? '已完成' : '待命'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1">{requirementExpert.specialty}</div>

                  <div className="flex items-center gap-2 mt-2">
                    {requirementExpert.status === 'working' && (
                      <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                    )}
                    {requirementExpert.status === 'completed' && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                    <span className={`text-xs ${
                      requirementExpert.status === 'working' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {requirementExpert.currentTask}
                    </span>
                  </div>

                  {requirementExpert.status !== 'idle' && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          requirementExpert.status === 'completed'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400'
                        }`}
                        style={{ width: `${requirementExpert.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 其他专家静默显示 */}
          <div className="opacity-40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">智能分析专家团队</span>
            </div>
            <div className="space-y-2">
              {ANALYSIS_EXPERTS.map((expert) => (
                <div key={expert.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                      {expert.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-slate-700">{expert.name}</div>
                      <div className="text-sm text-slate-500">{expert.title}</div>
                    </div>
                    <span className="text-xs text-slate-300 px-2 py-1 rounded-full bg-slate-100">等待激活</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 深度分析阶段 - 显示所有专家依次工作 */}
      {(analysisPhase === 'analysis' || analysisPhase === 'summarizing' || analysisPhase === 'completed') && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">智能分析专家团队</span>
            </div>
            <span className="text-xs text-slate-500">4位专家依次协作</span>
          </div>

          {/* 需求专家（已完成） */}
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200 opacity-70">
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-gradient-to-br from-green-400 to-emerald-500">
                  {requirementExpert.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{requirementExpert.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{requirementExpert.title}</span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">已完成</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{requirementExpert.specialty}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-slate-500">需求确认完成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 分析专家列表 */}
          <div className="space-y-3">
            {analysisExperts.map((expert) => (
              <div
                key={expert.id}
                className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
                  expert.status === 'working'
                    ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200 shadow-md'
                    : expert.status === 'completed'
                    ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200'
                    : 'bg-white border-slate-100 opacity-50'
                }`}
              >
                {/* 进度条背景 */}
                {expert.status === 'working' && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-purple-100/30 transition-all duration-1000"
                    style={{ width: `${expert.progress}%` }}
                  />
                )}

                <div className="relative p-4">
                  <div className="flex items-start gap-3">
                    {/* 专家头像 */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md ${
                      expert.status === 'working'
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse'
                        : expert.status === 'completed'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300'
                    }`}>
                      {expert.avatar}
                    </div>

                    {/* 专家信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-slate-800">{expert.name}</span>
                          <span className="text-sm text-slate-500 ml-2">{expert.title}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          expert.status === 'working'
                            ? 'bg-blue-100 text-blue-700'
                            : expert.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {expert.status === 'working' ? '分析中' : expert.status === 'completed' ? '已完成' : '等待中'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1">{expert.specialty}</div>

                      {/* 当前任务 */}
                      <div className="flex items-center gap-2 mt-2">
                        {expert.status === 'working' && (
                          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        )}
                        {expert.status === 'completed' && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        <span className={`text-xs ${
                          expert.status === 'working' ? 'text-blue-600' : 'text-slate-500'
                        }`}>
                          {expert.currentTask}
                        </span>
                      </div>

                      {/* 进度条 */}
                      {expert.status !== 'idle' && (
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              expert.status === 'completed'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
                            }`}
                            style={{ width: `${expert.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // 渲染隐私声明（优化版）
  const renderPrivacyNotice = () => (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-green-800">数据安全保护中</span>
            <span className="text-xs text-green-600">• 文件仅用于本次分析</span>
            <span className="text-xs text-green-600">• 不用于模型训练</span>
            <span className="text-xs text-green-600">• 企业级隐私隔离</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full gap-4">
      {/* 左侧：会话列表 */}
      <div className={`${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'} flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300`}>
        <div className="p-4 border-b border-slate-100">
          <Button
            onClick={createNewSession}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            开启新会话
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setSelectedHtmlReport(null);
                  setShowRightPanel(false);
                }}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                  session.id === currentSessionId
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="flex-1 text-sm truncate font-medium">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium">大卡鹰眼 智能报表</span>
          </div>
        </div>
      </div>

      {/* 中间：对话区域 */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-w-0">
        {/* 顶部栏：折叠按钮 + 任务指示器 */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30 px-4 py-2 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-blue-600"
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
            <span className="text-sm font-medium text-slate-700">智能报表专家</span>
          </div>


        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/30">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.map((message) => {
              // 查找该消息关联的CSV任务
              const messageCsvTasks = csvTasks.filter(task => task.messageId === message.id);
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : message.isHtml
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="max-w-[85%] space-y-3">
                    <div
                      className={`${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl px-4 py-3'
                          : message.isHtml
                          ? 'bg-white rounded-xl border border-purple-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all'
                          : 'bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3'
                      }`}
                      onClick={() => handleHtmlMessageClick(message)}
                    >
                      {message.isHtml ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-purple-600">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold">深度分析报告已生成</span>
                          </div>
                          <div className="text-slate-600 text-sm leading-relaxed">
                            已完成多维度深度分析，包含地理流向、货类构成、成本水平、时效效率等核心指标的可视化图表。
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHtmlMessageClick(message);
                              }}
                              className="h-8 text-xs border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              查看报告
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadHtml(message.content);
                              }}
                              className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              下载HTML
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={`prose prose-sm max-w-none leading-relaxed ${message.type === 'user' ? 'text-white prose-invert' : 'text-slate-700'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {/* CSV下载任务展示 */}
                    {messageCsvTasks.length > 0 && (
                      <div className="space-y-2">
                        {messageCsvTasks.map(task => (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-3 ${
                              task.status === 'generating'
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                                : task.status === 'completed'
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                            }`}
                          >
                            {task.status === 'generating' ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                  <span className="text-sm font-medium text-slate-700">正在生成CSV文件...</span>
                                  <span className="text-xs text-slate-500 ml-auto">{task.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-slate-500">
                                  已处理 {task.processedRows.toLocaleString()} / {task.totalRows.toLocaleString()} 行数据
                                </div>
                              </div>
                            ) : task.status === 'completed' ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-700">{task.fileName}</div>
                                    <div className="text-xs text-slate-500">
                                      {task.totalRows.toLocaleString()} 行数据 • 
                                      {task.completedAt ? new Date(task.completedAt).toLocaleString() : ''}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadCsv(task)}
                                  className="h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" />
                                  下载CSV
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <span className="text-sm">生成失败，请重试</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-slate-600 text-sm">
                    大卡鹰眼助手正在积极思考中...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 示例问题 */}
        {messages.length <= 2 && (
          <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 px-4 py-3 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-600 font-medium">您可以这样问：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-200 transition-all duration-300 shadow-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t border-slate-100 bg-white p-4 shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* 模板选择和文件上传栏 */}
            <div className="flex items-center gap-3">
              {/* 深度分析模板标签和选择按钮 */}
              <span className="text-sm text-slate-600">深度分析模板：</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTemplateDialog(true)}
                className="h-8 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                {selectedTemplate ? selectedTemplate.name : '选择模板'}
              </Button>

              {selectedTemplate && (
                <button
                  onClick={handleClearTemplate}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  取消模板
                </button>
              )}

              {/* 文件上传 */}
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.csv,.json,.md"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs text-slate-500 hover:text-blue-600"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {uploadedFile ? uploadedFile.name : '上传文件'}
                </Button>
                {uploadedFile && (
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 隐私声明（上传文件时显示） */}
            {showPrivacyNotice && uploadedFile && renderPrivacyNotice()}

            {/* 输入框 */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder='描述您的分析需求，如：分析北京到河北的货物流向特征，或查询2024年10月山西到河北的煤炭运输量...'
                className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：三个Tab（报告预览、HTML代码、智能分析引擎） */}
      {showRightPanel && (
        <div className="w-[40%] flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Tab切换 */}
          <div className="flex border-b border-slate-100">
            {selectedHtmlReport && (
              <>
                <button
                  onClick={() => setActiveRightTab('preview')}
                  className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeRightTab === 'preview'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  报告预览
                </button>
                <button
                  onClick={() => setActiveRightTab('html')}
                  className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeRightTab === 'html'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  HTML代码
                </button>
              </>
            )}
            <button
              onClick={() => setActiveRightTab('engine')}
              className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeRightTab === 'engine'
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Cpu className="w-4 h-4" />
              智能分析引擎
              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseRightPanel();
                }}
                className="ml-2 p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {activeRightTab === 'preview' && selectedHtmlReport && (
                <div className="relative">
                  {/* 全屏按钮 */}
                  <button
                    onClick={() => setIsFullscreenPreview(true)}
                    className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-blue-600 transition-all"
                    title="全屏查看"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <iframe
                    srcDoc={selectedHtmlReport.content}
                    className="w-full h-full min-h-[600px] border-0"
                    title="HTML Report Preview"
                  />
                </div>
              )}
              {activeRightTab === 'html' && selectedHtmlReport && (
                <HtmlCodeHighlight code={selectedHtmlReport.content} />
              )}
              {activeRightTab === 'engine' && renderExpertTeam()}
            </div>
          </div>
        </div>
      )}

      {/* 全屏预览弹窗 */}
      <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0">
          <div className="relative w-full h-full">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsFullscreenPreview(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-red-600 transition-all"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            {selectedHtmlReport && (
              <iframe
                srcDoc={selectedHtmlReport.content}
                className="w-full h-full border-0"
                title="HTML Report Fullscreen Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 模板选择弹窗 */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>选择分析模板</DialogTitle>
            <Button
              onClick={handleOpenNewTemplate}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              新建模板
            </Button>
          </DialogHeader>
          
          {/* 固定模板区域 */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">系统模板</h3>
            <div className="grid grid-cols-3 gap-4">
              {ANALYSIS_TEMPLATES.map((template) => (
                <MouseFollowTooltip key={template.id} content={template.hoverContent}>
                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group w-full"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                        {template.icon}
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-purple-700">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{template.description}</p>
                  </button>
                </MouseFollowTooltip>
              ))}
            </div>
          </div>

          {/* 自定义模板区域 */}
          {customTemplates.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-500 mb-3">
                自定义模板 ({customTemplates.length}个)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {customTemplates.map((template) => {
                  // 生成自定义模板的hoverContent
                  const customHoverContent = `
                    <div class="p-3 text-xs">
                      <h4 class="font-semibold mb-1.5 text-sm">${template.title}</h4>
                      <div class="text-slate-600 whitespace-pre-wrap">${template.description.replace(/\n/g, '<br/>')}</div>
                      <div class="mt-2 text-xs text-slate-400">
                        创建时间：${new Date(template.createdAt).toLocaleString()}<br/>
                        更新时间：${new Date(template.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  `;
                  return (
                    <MouseFollowTooltip key={template.id} content={customHoverContent}>
                      <div
                        className="relative p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group cursor-pointer"
                        onClick={() => handleSelectCustomTemplate(template)}
                      >
                        <div className="w-full text-left">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-slate-700 group-hover:text-blue-700 block truncate">
                                {template.title}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(template.updatedAt).toLocaleDateString()} 更新
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {template.description.replace(/【.*?】/g, '').substring(0, 60)}...
                          </p>
                        </div>
                        {/* 编辑和删除按钮 */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenEditTemplate(template, e)}
                            className="p-1.5 bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                            title="编辑"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                            className="p-1.5 bg-white hover:bg-red-50 rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </MouseFollowTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* 空状态提示 */}
          {customTemplates.length === 0 && (
            <div className="mt-6 p-8 text-center border border-dashed border-slate-200 rounded-xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">暂无自定义模板</p>
              <p className="text-xs text-slate-400 mt-1">点击右上角"新建模板"创建您的第一个模板</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 自定义模板编辑弹窗 */}
      <Dialog open={showCustomTemplateDialog} onOpenChange={setShowCustomTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? '编辑自定义模板' : '新建自定义模板'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* 标题输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                模板标题 <span className="text-red-500">*</span>
              </label>
              <Input
                value={customTemplateForm.title}
                onChange={(e) => setCustomTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入模板标题，如：煤炭运输分析"
                maxLength={50}
                className="border-slate-200 focus:border-purple-400"
              />
              <div className="text-xs text-slate-400 text-right">
                {customTemplateForm.title.length}/50
              </div>
            </div>

            {/* 维度说明输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                维度说明 <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-slate-400 ml-2">最多1000字</span>
              </label>
              <div className="relative">
                <textarea
                  value={customTemplateForm.description}
                  onChange={(e) => setCustomTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="【分析目的】&#10;&#10;请描述分析的目的...&#10;&#10;【分析维度】&#10;&#10;请列出分析的维度..."
                  maxLength={1000}
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400 resize-none font-mono text-sm leading-relaxed"
                />
                {/* 格式提示 */}
                <div className="absolute bottom-3 left-3 right-3 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-700">
                  <span className="font-medium">格式示例：</span>
                  使用 【分析目的】和【分析维度】标签组织内容，支持多维度列举
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${customTemplateForm.description.length > 900 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {customTemplateForm.description.length}/1000 字
                </span>
                {customTemplateForm.description.length > 1000 && (
                  <span className="text-xs text-red-500">已超出字数限制</span>
                )}
              </div>
            </div>

            {/* 预览区域 */}
            {customTemplateForm.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">预览效果</label>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600 whitespace-pre-wrap">
                    {customTemplateForm.description}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setShowCustomTemplateDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveCustomTemplate}
                disabled={!customTemplateForm.title.trim() || !customTemplateForm.description.trim() || customTemplateForm.description.length > 1000}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {editingTemplate ? '保存修改' : '创建模板'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
