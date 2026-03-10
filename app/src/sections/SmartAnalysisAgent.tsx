import { useState, useEffect, useRef } from 'react';
import { Building2, TrendingUp, MapPin, Loader2, RefreshCw, Search, Sparkles, ArrowDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as echarts from 'echarts';

if (typeof window !== 'undefined') {
  (window as any).echarts = echarts;
}

import { generateCargoFlowAnalysis, clearCache as clearCargoFlowCache } from '@/services/cargoFlowApi';
import { generateLoadingEfficiencyAnalysis, clearCache as clearLoadingEfficiencyCache } from '@/services/loadingEfficiencyApi';
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
  },
  cargo: {
    title: '货物流向分析',
    description: '全景展示区域间货物流动趋势，挖掘物流热点线路与流向特征',
    icon: TrendingUp,
  },
  location: {
    title: '装卸货效率分析',
    description: '评估各区域装卸货效率，识别瓶颈环节，提升物流运营效率',
    icon: MapPin,
  },
};

export function SmartAnalysisAgent() {
  const [activeTab, setActiveTab] = useState('enterprise');
  
  const [cargoFlowHtml, setCargoFlowHtml] = useState<string>('');
  const [cargoFlowLoading, setCargoFlowLoading] = useState<boolean>(false);
  const [cargoFlowError, setCargoFlowError] = useState<string>('');

  const [loadingEfficiencyHtml, setLoadingEfficiencyHtml] = useState<string>('');
  const [loadingEfficiencyLoading, setLoadingEfficiencyLoading] = useState<boolean>(false);
  const [loadingEfficiencyError, setLoadingEfficiencyError] = useState<string>('');

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

  const loadLoadingEfficiencyAnalysis = async () => {
    setLoadingEfficiencyLoading(true);
    setLoadingEfficiencyError('');
    try {
      const html = await generateLoadingEfficiencyAnalysis();
      setLoadingEfficiencyHtml(html);
    } catch (error) {
      console.error('加载装卸货效率分析失败:', error);
      setLoadingEfficiencyError('加载失败，请重试');
      toast.error('装卸货效率分析加载失败');
    } finally {
      setLoadingEfficiencyLoading(false);
    }
  };

  const refreshLoadingEfficiencyAnalysis = () => {
    clearLoadingEfficiencyCache();
    setLoadingEfficiencyHtml('');
    loadLoadingEfficiencyAnalysis();
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
              <TabsTrigger 
                value="enterprise" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg px-4 py-2"
              >
                <Building2 className="w-4 h-4 mr-1" />
                企业上下游分析
              </TabsTrigger>
              <TabsTrigger 
                value="cargo" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg px-4 py-2"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                货物流向分析
              </TabsTrigger>
              <TabsTrigger 
                value="location" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg px-4 py-2"
              >
                <MapPin className="w-4 h-4 mr-1" />
                装卸货效率分析
              </TabsTrigger>
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

          <TabsContent value="location" className="mt-0">
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
                    {!loadingEfficiencyHtml && !loadingEfficiencyLoading && (
                      <Button
                        onClick={loadLoadingEfficiencyAnalysis}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成分析
                      </Button>
                    )}
                    {loadingEfficiencyHtml && (
                      <Button
                        variant="outline"
                        onClick={refreshLoadingEfficiencyAnalysis}
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
                {loadingEfficiencyLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-slate-500">AI正在生成装卸货效率分析报告...</span>
                  </div>
                ) : loadingEfficiencyError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p className="mb-4">{loadingEfficiencyError}</p>
                    <Button
                      variant="outline"
                      onClick={loadLoadingEfficiencyAnalysis}
                      className="border-slate-200"
                    >
                      重试
                    </Button>
                  </div>
                ) : (
                  <IframeHtmlRenderer html={loadingEfficiencyHtml} title="装卸货效率分析" />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
