import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Brain, 
  Database, 
  Plus,
  Activity,
  Send,
  Eye,
  Download,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

// 教程步骤类型
interface TutorialStep {
  id: string;
  type: 'welcome' | 'guide' | 'practice' | 'complete';
  title: string;
  content: React.ReactNode;
  target?: string;
}

// 分步指引数据
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    type: 'welcome',
    title: '欢迎使用大卡鹰眼！',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          您好！我是您的智能数据助手。不用担心，我会一步步教您如何使用。
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-slate-700">
          <p className="font-medium mb-2">大卡鹰眼能帮您做什么？</p>
          <ul className="space-y-1 text-slate-600">
            <li>• 用说话的方式查询数据（就像微信聊天）</li>
            <li>• 自动生成专业的数据分析报告</li>
            <li>• 随时了解行业最新动态</li>
          </ul>
        </div>
        <p className="text-sm text-slate-500">
          接下来用 2 分钟，带您了解每个功能怎么用。
        </p>
      </div>
    )
  },
  {
    id: 'what-is-ai',
    type: 'guide',
    title: '什么是"智能报表"？',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          <span className="font-medium text-blue-600">简单说：您用文字提问，AI帮您查数据、出报告。</span>
        </p>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">💡 举个例子：</p>
          <p className="text-sm text-slate-700">
            您输入："北京到上海的煤炭运输量"<br/>
            AI回答：自动查询数据，告诉您具体数字，还能生成图表
          </p>
        </div>
        <p className="text-sm text-slate-500">
          就像有个数据分析师随时为您服务，不用学复杂的操作。
        </p>
      </div>
    )
  },
  {
    id: 'new-chat',
    type: 'guide',
    title: '第一步：开启新对话',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          每次想问新问题，点击左侧的<span className="font-medium text-blue-600">"开启新会话"</span>按钮。
        </p>
        <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-slate-800">开启新会话</p>
              <p className="text-sm text-slate-500">点这里开始新的问题</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
          <span className="font-medium">小贴士：</span>不同的问题最好开新会话，这样不会搞混。
        </div>
      </div>
    ),
    target: 'new-chat'
  },
  {
    id: 'quick-mode',
    type: 'guide',
    title: '第二步：选择分析模式',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          我们提供两种分析方式，根据您的需要选择：
        </p>
        <div className="grid gap-3">
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-700">快速模式</span>
            </div>
            <p className="text-sm text-slate-700">
              适合简单问题，马上出答案<br/>
              <span className="text-slate-500">比如："上个月运了多少吨煤"</span>
            </p>
          </div>
          <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-700">深度分析模式</span>
            </div>
            <p className="text-sm text-slate-700">
              适合复杂分析，生成完整报告<br/>
              <span className="text-slate-500">比如："全面分析北京到河北的货物流向"</span>
            </p>
          </div>
        </div>
      </div>
    ),
    target: 'mode-selector'
  },
  {
    id: 'how-to-ask',
    type: 'guide',
    title: '第三步：怎么提问？',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          提问时，尽量说清楚<span className="font-medium text-blue-600">时间、地点、对象</span>，这样答案更准确。
        </p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">✅ 好的提问：</p>
          <div className="bg-green-50 rounded-lg p-3 text-sm text-slate-700 space-y-1">
            <p>"2024年10月，从山西到河北的煤炭运输量"</p>
            <p>"北京生产制造企业到河北的货物流向"</p>
            <p>"G15高速和G2高速的货车流量对比"</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">❌ 不太清楚的提问：</p>
          <div className="bg-red-50 rounded-lg p-3 text-sm text-slate-700 space-y-1">
            <p>"查一下运输量"（没说时间和地点）</p>
            <p>"北京到河北的货"（没说时间和货类）</p>
          </div>
        </div>
      </div>
    ),
    target: 'input-area'
  },
  {
    id: 'send-message',
    type: 'guide',
    title: '第四步：发送您的问题',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          在输入框里打字，然后点击发送按钮，或者按键盘上的<span className="font-medium">回车键</span>。
        </p>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-400">
              在这里输入您的问题...
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
              <Send className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
          <span className="font-medium">稍等一下：</span>AI需要几秒钟思考，看到"正在积极思考中"是正常现象。
        </div>
      </div>
    ),
    target: 'send-button'
  },
  {
    id: 'view-report',
    type: 'guide',
    title: '第五步：查看分析报告',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          深度分析完成后，会生成一份专业的HTML报告，您可以：
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">查看报告</p>
              <p className="text-sm text-slate-600">在右侧预览报告内容，有图表和数据</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">下载报告</p>
              <p className="text-sm text-slate-600">保存为HTML文件，可以发给同事或打印</p>
            </div>
          </div>
        </div>
      </div>
    ),
    target: 'report-area'
  },
  {
    id: 'data-assets',
    type: 'guide',
    title: '数据资产是什么？',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          <span className="font-medium text-blue-600">数据资产</span>就是您能查到的所有数据来源。
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700"><span className="font-medium">平台数据：</span>大卡鹰眼提供的基础数据</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-slate-700"><span className="font-medium">系统对接：</span>您公司的TMS/WMS/ERP系统</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-slate-700"><span className="font-medium">上传数据：</span>您自己上传的文件</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          点击顶部"数据资产"可以查看和管理这些数据。
        </p>
      </div>
    ),
    target: 'data-assets-tab'
  },
  {
    id: 'industry-monitor',
    type: 'guide',
    title: '行业动态监控',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          <span className="font-medium text-blue-600">大卡数字人</span>会帮您盯着行业动态，包括：
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="font-medium text-blue-700">政策变化</p>
            <p className="text-slate-600">交通、物流新政策</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="font-medium text-amber-700">运价波动</p>
            <p className="text-slate-600">线路价格变化</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="font-medium text-purple-700">竞争对手</p>
            <p className="text-slate-600">同行动态信息</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="font-medium text-green-700">每日早报</p>
            <p className="text-slate-600">重要信息汇总</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          每天早上来看看，了解行业最新情况。
        </p>
      </div>
    ),
    target: 'industry-tab'
  },
  {
    id: 'practice',
    type: 'practice',
    title: '动手试一试',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          现在您可以试着自己操作了。建议您先试试这个：
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
          <p className="font-medium text-blue-800 mb-2">🎯 练习任务：</p>
          <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
            <li>点击"开启新会话"</li>
            <li>选择"快速模式"</li>
            <li>输入："查询2024年10月从山西到河北的煤炭运输量"</li>
            <li>点击发送，等待AI回答</li>
          </ol>
        </div>
        <p className="text-sm text-slate-500">
          遇到问题不用急，随时可以重新打开这个教程查看。
        </p>
      </div>
    )
  },
  {
    id: 'complete',
    type: 'complete',
    title: '恭喜您，准备就绪！',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">
          您已经了解了基本操作，现在可以开始使用了。
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>会开启新会话</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>会选择分析模式</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>会提问和查看报告</span>
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
          <span className="font-medium">💡 记住：</span>右下角有个小按钮，随时可以重新查看这个教程。
        </div>
      </div>
    )
  }
];

const TUTORIAL_KEY = 'daka_onboarding_completed_v2';

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY);
    if (!completed) {
      setIsOpen(true);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setHasSeenTutorial(true);
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // 教程关闭后显示悬浮帮助按钮
  if (!isOpen && hasSeenTutorial) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
        title="查看使用帮助"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">使用帮助</span>
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* 教程卡片 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 顶部进度条 */}
        <div className="h-1.5 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 步骤计数器 */}
        <div className="absolute top-4 left-4">
          <span className="text-sm text-slate-400">
            步骤 {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 内容区域 */}
        <div className="p-8 pt-12">
          {/* 标题 */}
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {currentStepData.title}
          </h2>

          {/* 内容 */}
          <div className="mb-8">
            {currentStepData.content}
          </div>

          {/* 按钮区域 */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`text-slate-500 ${isFirstStep ? 'opacity-0' : ''}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>

            <div className="flex gap-3">
              {!isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="text-slate-500"
                >
                  跳过教程
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 px-6"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    开始使用
                  </>
                ) : (
                  <>
                    下一步
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 底部装饰条 */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />
      </div>
    </div>
  );
}
