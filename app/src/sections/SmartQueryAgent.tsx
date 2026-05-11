import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2, Download, Eye, FileText, Check, X, Upload, Shield, Cpu, BarChart3, MapPin, TrendingUp, Users, Activity, Database, LineChart, FileBarChart, BrainCircuit, Maximize2, Minimize2, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { clearBailianSession } from '@/services/bailianApi';


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

// 能力分类类型
type CapabilityCategory = 'analysis' | 'download' | 'decrypt';

// 能力卡片类型
interface CapabilityCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: CapabilityCategory;
  prompt?: string;
  hasPermission?: boolean; // 是否有权限使用
}

// 能力卡片数据
const CAPABILITY_CARDS: CapabilityCard[] = [
  // 分析模板
  {
    id: 'same-region',
    icon: '🚚',
    title: '同区域货物流向分析',
    description: '分析同一区域内车辆的货物来源与去向，识别本地物流热点。',
    category: 'analysis',
    prompt: '请对同一区域内的货物流向进行分析，重点关注：1）区域内货物来源分布 2）区域内货物去向分布 3）本地物流热点识别 4）区域内运输特征',
    hasPermission: true
  },
  {
    id: 'cross-region',
    icon: '🚛',
    title: '跨区域货物流向分析',
    description: '分析跨区域运输的货物流动特征，识别主要运输通道。',
    category: 'analysis',
    prompt: '请对跨区域货物流向进行分析，重点关注：1）跨区域运输线路分布 2）主要运输通道识别 3）货物流量分析 4）运输效率评估',
    hasPermission: true
  },
  {
    id: 'supply-chain',
    icon: '📊',
    title: '上下游分析',
    description: '分析企业供应链关系、合作伙伴、网络密度。',
    category: 'analysis',
    prompt: '请对以下问题进行供应链深度分析，重点关注：1）企业上下游关系 2）合作伙伴分析 3）供应链网络密度 4）关键节点识别',
    hasPermission: false // 无权限示例
  },
  {
    id: 'cargo-flow',
    icon: '🗺️',
    title: '货物流向分析',
    description: '分析区域间货物流动特征、热门线路、流向分布。',
    category: 'analysis',
    prompt: '请对以下问题进行货物流向深度分析，重点关注：1）主要流向分布 2）热门运输线路 3）区域间货物流动特征 4）货类构成分析',
    hasPermission: true
  },
  {
    id: 'placeholder',
    icon: '⬜',
    title: '占位模板',
    description: '预留模板位置，用于后续扩展。',
    category: 'analysis',
    hasPermission: true
  },
  // 数据下载
  {
    id: 'new-vehicle',
    icon: '📥',
    title: '新增车辆统计',
    description: '下载新增车辆统计数据。',
    category: 'download',
    hasPermission: true
  },
  {
    id: 'retention',
    icon: '📥',
    title: '保有量统计',
    description: '下载车辆保有量统计数据。',
    category: 'download',
    hasPermission: true
  },
  {
    id: 'migration',
    icon: '📥',
    title: '迁出统计',
    description: '下载车辆迁出统计数据。',
    category: 'download',
    hasPermission: true
  },
  // 其他工具
  {
    id: 'decrypt-enterprise',
    icon: '🔓',
    title: '企业名称解密',
    description: '解密企业名称信息。',
    category: 'decrypt',
    hasPermission: true
  },
];

// 分类配置
const CATEGORY_CONFIG: { [key in CapabilityCategory]: { name: string; hasPermission: boolean } } = {
  analysis: { name: '分析模板', hasPermission: true },
  download: { name: '数据下载', hasPermission: true },
  decrypt: { name: '其他', hasPermission: true }, // 可根据权限控制
};

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



  // 能力选择弹窗状态
  const [activeCategory, setActiveCategory] = useState<CapabilityCategory>('analysis');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

      {/* 能力选择弹窗 - 新设计 */}
      <Dialog 
        open={showTemplateDialog} 
        onOpenChange={(open) => {
          // 点击遮罩不关闭，只能通过选择模板或按ESC关闭
          if (open) setShowTemplateDialog(true);
        }}
      >
        <DialogContent 
          className="p-0 overflow-hidden border-0"
          style={{ 
            width: '1000px', 
            height: '700px', 
            maxWidth: '1000px',
            maxHeight: '700px'
          }}
        >
          {/* 顶部标题栏 */}
          <div className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#1F2937]">大卡鹰眼 · 数据工坊</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                title="帮助"
              >
                <span className="text-lg">?</span>
              </button>
              <button 
                onClick={() => setShowTemplateDialog(false)}
                className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 主体内容区 */}
          <div className="flex" style={{ height: 'calc(700px - 56px - 48px)' }}>
            {/* 左侧分类栏 */}
            <div className="w-[200px] bg-[#F5F6F7] flex flex-col py-2">
              {(Object.keys(CATEGORY_CONFIG) as CapabilityCategory[])
                .filter(cat => CATEGORY_CONFIG[cat].hasPermission)
                .map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setTemplateSearchQuery('');
                    }}
                    className={`relative h-12 px-4 text-left text-sm font-medium transition-all ${
                      activeCategory === category
                        ? 'text-[#2563EB] bg-[#EEF2FF]'
                        : 'text-[#374151] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {/* 选中态左侧竖线 */}
                    {activeCategory === category && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2563EB]" />
                    )}
                    {CATEGORY_CONFIG[category].name}
                  </button>
                ))}
            </div>

            {/* 右侧内容区 */}
            <div className="flex-1 bg-white p-5 overflow-y-auto">
              {/* 标题 - 根据分类显示不同标题 */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">
                  {activeCategory === 'analysis' && '请选择模板，填写条件，开启深度分析'}
                  {activeCategory === 'download' && '请选择模板，填写条件，进行数据下载'}
                  {activeCategory === 'decrypt' && '请选择工具，根据提示进行使用'}
                </h2>
              </div>
              
              {/* 系统模板标题 - 仅分析模板显示 */}
              {activeCategory === 'analysis' && (
                <div className="mb-3">
                  <span className="text-sm text-[#6B7280]">系统模板</span>
                </div>
              )}

              {/* 数据下载提示条 */}
              {activeCategory === 'download' && (
                <div className="mb-4 bg-[#FFF3CD] border border-[#FFE69C] rounded px-4 py-3 flex items-start gap-2">
                  <span className="text-[#856404] text-sm">ℹ️</span>
                  <p className="text-sm text-[#856404]">
                    提示：单次下载最大支持 1GB 文件，超出限制请缩小时间范围或筛选条件
                  </p>
                </div>
              )}

              {/* 模板卡片网格 - 两列布局 */}
              <div className="grid grid-cols-2 gap-3">
                {CAPABILITY_CARDS
                  .filter(card => card.category === activeCategory)
                  .filter(card => 
                    templateSearchQuery === '' || 
                    card.title.toLowerCase().includes(templateSearchQuery.toLowerCase())
                  )
                  .map((card) => (
                    <div
                      key={card.id}
                      className="relative"
                    >
                      {card.hasPermission !== false ? (
                        /* 有权限 - 正常卡片 */
                        <>
                          <button
                            onClick={() => {
                              if (card.category === 'analysis' && card.prompt) {
                                setInput(`【使用分析模板：${card.title}】\n\n${card.prompt}\n\n请描述您的分析需求：`);
                              } else if (card.category === 'download') {
                                // 触发CSV下载
                                const userMessageId = Date.now().toString();
                                const userMessage: Message = {
                                  id: userMessageId,
                                  type: 'user',
                                  content: `下载${card.title}`,
                                  timestamp: new Date(),
                                };
                                const botMessageId = (Date.now() + 1).toString();
                                const botMessage: Message = {
                                  id: botMessageId,
                                  type: 'bot',
                                  content: `已收到您的数据下载请求，正在为您准备「${card.title}」的CSV文件，请稍候...`,
                                  timestamp: new Date(),
                                };
                                setSessions(prev => prev.map(session => {
                                  if (session.id === currentSessionId) {
                                    return {
                                      ...session,
                                      messages: [...session.messages, userMessage, botMessage],
                                      updatedAt: new Date(),
                                    };
                                  }
                                  return session;
                                }));
                                setTimeout(() => {
                                  startCsvDownloadTask(botMessageId, card.title);
                                }, 500);
                              }
                              setShowTemplateDialog(false);
                            }}
                            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 flex items-center gap-4 transition-all hover:border-[#8B5CF6] hover:shadow-md cursor-pointer group"
                            onMouseEnter={(e) => {
                              setHoveredCard(card.id);
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            {/* 左侧紫色图标 */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            {/* 右侧标题 */}
                            <span className="text-[15px] font-medium text-[#1F2937] group-hover:text-[#8B5CF6] transition-colors">
                              {card.title}
                            </span>
                          </button>

                          {/* Hover 详情浮窗 */}
                          {hoveredCard === card.id && createPortal(
                            <div
                              className="fixed z-[2147483647] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-5 pointer-events-none max-w-sm"
                              style={{
                                left: `${Math.min(mousePosition.x + 20, window.innerWidth - 340)}px`,
                                top: `${Math.min(mousePosition.y - 50, window.innerHeight - 300)}px`,
                              }}
                            >
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#1F2937] mb-1">分析目的</h4>
                                  <p className="text-xs text-[#6B7280]">{card.title}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-[#1F2937] mb-1">分析维度</h4>
                                  <p className="text-xs text-[#6B7280]">{card.title}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-[#1F2937] mb-1">模板介绍</h4>
                                  <p className="text-xs text-[#6B7280] leading-relaxed">{card.description}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-[#1F2937] mb-1">条件</h4>
                                  <p className="text-xs text-[#6B7280]">选择模板后填写分析条件</p>
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </>
                      ) : (
                        /* 无权限 - 置灰卡片 */
                        <div className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 flex flex-col opacity-40 cursor-not-allowed">
                          <div className="flex items-center gap-4">
                            {/* 左侧灰色图标 */}
                            <div className="w-12 h-12 rounded-xl bg-[#999999] flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            {/* 右侧标题 */}
                            <span className="text-[15px] font-medium text-[#999999]">
                              {card.title}
                            </span>
                          </div>
                          {/* 无权限提示 */}
                          <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                            <p className="text-xs text-[#FF6B6B] mb-1">暂无权限，请联系管理员开通</p>
                            <p className="text-xs text-[#999999]">如需使用此模板，请确认已采购相关数据权限</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* 无搜索结果 */}
              {templateSearchQuery && CAPABILITY_CARDS
                .filter(card => card.category === activeCategory)
                .filter(card => 
                  card.title.toLowerCase().includes(templateSearchQuery.toLowerCase())
                ).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm text-[#6B7280]">未找到匹配模板</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">请尝试其他关键词</p>
                </div>
              )}

              {/* 空分类 */}
              {!templateSearchQuery && CAPABILITY_CARDS.filter(card => card.category === activeCategory).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm text-[#6B7280]">暂无模板</p>
                </div>
              )}
            </div>
          </div>

          {/* 底部搜索栏 */}
          <div className="h-12 bg-white border-t border-[#E5E7EB] flex items-center px-4">
            <Search className="w-4 h-4 text-[#9CA3AF] mr-3" />
            <input
              type="text"
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
              placeholder="搜索模板..."
              className="flex-1 text-sm text-[#374151] placeholder-[#9CA3AF] outline-none"
            />
            {templateSearchQuery && (
              <button
                onClick={() => setTemplateSearchQuery('')}
                className="ml-2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
