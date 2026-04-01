import { useState, useEffect, useRef } from 'react';
import { Building2, TrendingUp, Loader2, RefreshCw, Search, Sparkles, ArrowDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import * as echarts from 'echarts';

if (typeof window !== 'undefined') {
  (window as any).echarts = echarts;
}

import { generateCargoFlowAnalysis, clearCache as clearCargoFlowCache } from '@/services/cargoFlowApi';
import { generateEnterpriseAnalysis, clearCache as clearEnterpriseCache } from '@/services/enterpriseApi';

function IframeHtmlRenderer({ html, title }: { html: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        let cleanedHtml = html
          .replace(/<script[^>]*src=["']https?:\/\/[^"']+["'][^>]*><\/script>/gi, '');
        
        const echartsScript = `
          <script>
            window.echarts = window.parent.echarts;
          <\/script>
        `;
        
        if (cleanedHtml.includes('</head>')) {
          cleanedHtml = cleanedHtml.replace('</head>', echartsScript + '</head>');
        } else {
          cleanedHtml = cleanedHtml.replace('<body>', '<head>' + echartsScript + '</head><body>');
        }
        
        doc.open();
        doc.write(cleanedHtml);
        doc.close();
      }
    }
  }, [html, title]);

  if (!html) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-slate-500">加载中...</span>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title={title}
      style={{
        width: '100%',
        minHeight: '800px',
        border: 'none',
        backgroundColor: '#ffffff',
      }}
    />
  );
}

const ANALYSIS_CONFIG = {
  enterprise: {
    title: '企业上下游分析',
    description: '深度解析企业供应链关系，识别核心供应商与下游客户，优化供应链布局',
    icon: Building2,
    hoverContent: `
      <div className="p-4">
        <h4 className="font-semibold mb-2">分析目的：</h4>
        <p className="text-sm mb-3">提供8个标准化分析维度，支撑企业上下游分析、供应链溯源、行业洞察等关键需求，帮助客户快速理解供应链网络结构、货物流向、关键节点、效率成本及趋势风险。</p>
        <h4 className="font-semibold mb-2">8个分析维度：</h4>
        <ul className="text-sm list-disc pl-5 space-y-1">
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
  cargo: {
    title: '货物流向分析',
    description: '全景展示区域间货物流动趋势，挖掘物流热点线路与流向特征',
    icon: TrendingUp,
    hoverContent: `
      <div className="p-4">
        <h4 className="font-semibold mb-2">分析目的：</h4>
        <p className="text-sm mb-3">提供标准化的货物流向分析框架，从8个维度全面理解货物运输特征。</p>
        <h4 className="font-semibold mb-2">8个分析维度：</h4>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>区域流向维度 - 分析货物从出发地到目的地的流动特征</li>
          <li>货类流向维度 - 分析不同货类的特定流向特征（17大类货类）</li>
          <li>POI类型维度 - 按场站POI类型分析流向（中转场站、终端市场等）</li>
          <li>时间趋势维度 - 分析月度、季度、年度货物流向变化</li>
          <li>流向集中度维度 - 统计热门线路占比，评估流向集中度</li>
          <li>距离分布维度 - 按运输距离区间分析特征（短途/中途/长途）</li>
          <li>线路维度 - 分析线路分布及特征</li>
          <li>车辆属性维度 - 分析参与运输车辆的静态基本信息</li>
        </ul>
      </div>
    `
  },
};

export function SmartAnalysisAgent() {
  const [activeTab, setActiveTab] = useState('enterprise');
  
  const [cargoFlowHtml, setCargoFlowHtml] = useState<string>('');
  const [cargoFlowLoading, setCargoFlowLoading] = useState<boolean>(false);
  const [cargoFlowError, setCargoFlowError] = useState<string>('');

  const [enterpriseHtml, setEnterpriseHtml] = useState<string>('');
  const [enterpriseLoading, setEnterpriseLoading] = useState<boolean>(false);
  const [enterpriseError, setEnterpriseError] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  const loadEnterpriseAnalysis = async () => {
    setEnterpriseLoading(true);
    setEnterpriseError('');
    try {
      const html = await generateEnterpriseAnalysis();
      setEnterpriseHtml(html);
    } catch (error) {
      console.error('加载企业分析失败:', error);
      setEnterpriseError('加载失败，请重试');
      toast.error('企业分析加载失败');
    } finally {
      setEnterpriseLoading(false);
    }
  };

  const refreshEnterpriseAnalysis = () => {
    clearEnterpriseCache();
    setEnterpriseHtml('');
    loadEnterpriseAnalysis();
  };

  const loadCargoFlowAnalysis = async () => {
    setCargoFlowLoading(true);
    setCargoFlowError('');
    try {
      const html = await generateCargoFlowAnalysis();
      setCargoFlowHtml(html);
    } catch (error) {
      console.error('加载货物流向分析失败:', error);
      setCargoFlowError('加载失败，请重试');
      toast.error('货物流向分析加载失败');
    } finally {
      setCargoFlowLoading(false);
    }
  };

  const refreshCargoFlowAnalysis = () => {
    clearCargoFlowCache();
    setCargoFlowHtml('');
    loadCargoFlowAnalysis();
  };



  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setShowSearchDialog(true);
    setTimeout(() => {
      analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearchFocus = () => {
    setShowSearchDialog(true);
  };

  const currentConfig = ANALYSIS_CONFIG[activeTab as keyof typeof ANALYSIS_CONFIG];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="h-full flex flex-col">
      {/* 顶部搜索区域 */}
      <div className="bg-gradient-to-r from-white via-blue-50/30 to-cyan-50/20 border-b border-slate-200/60 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold gradient-text mb-2">深度分析报告</h2>
            <p className="text-slate-500">基于AI大模型的物流数据智能分析平台</p>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入您想分析的问题，例如：分析山西省的物流流向特征..."
                  className="w-full pl-10 pr-4 py-3 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 h-12 rounded-xl shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12 px-6 rounded-xl shadow-lg shadow-blue-500/25"
              >
                <Send className="w-4 h-4 mr-2" />
                分析
              </Button>
            </div>
            
            {/* 展开的对话区域 */}
            {showSearchDialog && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 text-sm">
                      {searchQuery ? `正在分析：${searchQuery}` : '请输入您想分析的问题，我将为您生成深度分析报告。'}
                    </p>
                    {searchQuery && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI正在理解您的需求...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 提示滚动 */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => analysisRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <span>查看分析选项</span>
                    <ArrowDown className="w-3 h-3 animate-bounce" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 分析内容区域 */}
      <div ref={analysisRef} className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
              {Object.entries(ANALYSIS_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <HoverCard key={key} openDelay={100} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <TabsTrigger 
                        value={key} 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg px-4 py-2"
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {config.title}
                      </TabsTrigger>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-4" side="bottom" align="start">
                      <div dangerouslySetInnerHTML={{ __html: config.hoverContent }} />
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="enterprise" className="mt-0">
            <Card className="bg-white border-slate-200/60 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                      <CurrentIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-800">{currentConfig.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{currentConfig.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!enterpriseHtml && !enterpriseLoading && (
                      <Button
                        onClick={loadEnterpriseAnalysis}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成分析
                      </Button>
                    )}
                    {enterpriseHtml && (
                      <Button
                        variant="outline"
                        onClick={refreshEnterpriseAnalysis}
                        className="border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重新生成
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {enterpriseLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-slate-500">AI正在生成企业上下游分析报告...</span>
                  </div>
                ) : enterpriseError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p className="mb-4">{enterpriseError}</p>
                    <Button
                      variant="outline"
                      onClick={loadEnterpriseAnalysis}
                      className="border-slate-200"
                    >
                      重试
                    </Button>
                  </div>
                ) : (
                  <IframeHtmlRenderer html={enterpriseHtml} title="企业上下游分析" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cargo" className="mt-0">
            <Card className="bg-white border-slate-200/60 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                      <CurrentIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-800">{currentConfig.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{currentConfig.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!cargoFlowHtml && !cargoFlowLoading && (
                      <Button
                        onClick={loadCargoFlowAnalysis}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成分析
                      </Button>
                    )}
                    {cargoFlowHtml && (
                      <Button
                        variant="outline"
                        onClick={refreshCargoFlowAnalysis}
                        className="border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重新生成
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {cargoFlowLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-slate-500">AI正在生成货物流向分析报告...</span>
                  </div>
                ) : cargoFlowError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p className="mb-4">{cargoFlowError}</p>
                    <Button
                      variant="outline"
                      onClick={loadCargoFlowAnalysis}
                      className="border-slate-200"
                    >
                      重试
                    </Button>
                  </div>
                ) : (
                  <IframeHtmlRenderer html={cargoFlowHtml} title="货物流向分析" />
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}
