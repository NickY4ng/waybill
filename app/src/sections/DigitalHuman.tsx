import { useState } from 'react';
import { 
  Bot, 
  Newspaper, 
  TrendingUp,
  Bell,
  Settings,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  Activity,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 行业动态类型
interface IndustryNews {
  id: string;
  title: string;
  category: 'policy' | 'price' | 'competitor' | 'market';
  source: string;
  time: string;
  summary: string;
  isRead: boolean;
  importance: 'high' | 'medium' | 'low';
}

// 早报类型
interface MorningReport {
  id: string;
  date: string;
  title: string;
  summary: string;
  keyPoints: string[];
  dataInsights: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
}

// 监控提示词类型
interface MonitorPrompt {
  id: string;
  name: string;
  content: string;
  category: 'policy' | 'price' | 'competitor' | 'market' | 'general';
  isActive: boolean;
}

// 模拟行业动态数据
const MOCK_NEWS: IndustryNews[] = [
  {
    id: '1',
    title: '交通运输部发布新物流政策，降低公路运输成本',
    category: 'policy',
    source: '交通运输部',
    time: '10分钟前',
    summary: '新政策将优化物流运输结构，预计降低运输成本5-8%',
    isRead: false,
    importance: 'high',
  },
  {
    id: '2',
    title: '华北地区煤炭运价上涨12%，主要受供需影响',
    category: 'price',
    source: '物流价格指数',
    time: '30分钟前',
    summary: '受季节性需求增加影响，煤炭运输价格持续走高',
    isRead: false,
    importance: 'high',
  },
  {
    id: '3',
    title: '竞争对手A公司新增200辆新能源车辆',
    category: 'competitor',
    source: '行业监测',
    time: '1小时前',
    summary: '新能源车队规模扩大，绿色物流竞争加剧',
    isRead: true,
    importance: 'medium',
  },
  {
    id: '4',
    title: '长三角地区物流效率提升报告发布',
    category: 'market',
    source: '物流研究院',
    time: '2小时前',
    summary: '数字化改造使平均运输时效提升15%',
    isRead: true,
    importance: 'medium',
  },
  {
    id: '5',
    title: '油价下调，预计降低运输成本3%',
    category: 'price',
    source: '发改委',
    time: '3小时前',
    summary: '本轮油价调整对长途运输成本影响显著',
    isRead: false,
    importance: 'high',
  },
  {
    id: '6',
    title: '智能物流园区建设标准正式发布',
    category: 'policy',
    source: '工信部',
    time: '4小时前',
    summary: '新标准将推动物流园区智能化升级改造',
    isRead: true,
    importance: 'medium',
  },
];

// 模拟早报数据
const MOCK_REPORT: MorningReport = {
  id: '1',
  date: '2026年3月6日',
  title: '物流行业每日洞察早报',
  summary: '今日物流行业整体运行平稳，政策面利好频出，运价指数小幅上涨。建议关注新能源车辆政策及华北煤炭运输市场动态。',
  keyPoints: [
    '交通运输部发布降本增效新政策',
    '华北煤炭运价上涨12%，需关注成本压力',
    '竞争对手加速新能源车辆布局',
    '油价下调利好长途运输企业',
  ],
  dataInsights: [
    { label: '行业运价指数', value: '108.5', trend: 'up' },
    { label: '平均运输时效', value: '18.2h', trend: 'down' },
    { label: '车辆利用率', value: '76.8%', trend: 'up' },
    { label: '成本指数', value: '95.3', trend: 'down' },
  ],
};

// 初始监控提示词
const INITIAL_PROMPTS: MonitorPrompt[] = [
  {
    id: '1',
    name: '政策关注',
    content: '重点关注交通运输、物流行业的政策变化，特别是涉及运输成本、环保要求、新能源车辆补贴等方面的政策',
    category: 'policy',
    isActive: true,
  },
  {
    id: '2',
    name: '运价监控',
    content: '监控主要运输线路的运价波动，特别是煤炭、钢铁、建材等大宗商品的运输价格变化',
    category: 'price',
    isActive: true,
  },
  {
    id: '3',
    name: '竞争对手',
    content: '关注主要竞争对手的动态，包括车辆规模扩张、新业务线、合作伙伴、技术创新等方面',
    category: 'competitor',
    isActive: true,
  },
];

export function DigitalHuman() {
  const [news, setNews] = useState<IndustryNews[]>(MOCK_NEWS);
  const [report] = useState<MorningReport>(MOCK_REPORT);
  const [prompts, setPrompts] = useState<MonitorPrompt[]>(INITIAL_PROMPTS);
  const [selectedNews, setSelectedNews] = useState<IndustryNews | null>(null);
  
  // 监控设置弹窗
  const [showMonitorSettings, setShowMonitorSettings] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Partial<MonitorPrompt>>({
    category: 'general',
    isActive: true,
  });

  // 标记新闻为已读
  const markAsRead = (id: string) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // 获取重要性图标
  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Bell className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      policy: '政策',
      price: '运价',
      competitor: '竞对',
      market: '市场',
    };
    return map[category] || '其他';
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      policy: 'bg-blue-50 text-blue-700 border-blue-200',
      price: 'bg-amber-50 text-amber-700 border-amber-200',
      competitor: 'bg-purple-50 text-purple-700 border-purple-200',
      market: 'bg-green-50 text-green-700 border-green-200',
    };
    return map[category] || 'bg-slate-50 text-slate-700';
  };

  // 添加提示词
  const handleAddPrompt = () => {
    if (newPrompt.name && newPrompt.content) {
      const prompt: MonitorPrompt = {
        id: Date.now().toString(),
        name: newPrompt.name,
        content: newPrompt.content,
        category: newPrompt.category as 'policy' | 'price' | 'competitor' | 'market' | 'general',
        isActive: true,
      };
      setPrompts(prev => [...prev, prompt]);
      setNewPrompt({ category: 'general', isActive: true });
    }
  };

  // 删除提示词
  const handleDeletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  // 切换提示词状态
  const togglePrompt = (id: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* 左侧：大卡数字人概览 */}
      <div className="w-64 flex flex-col gap-3 overflow-y-auto pb-2">
        {/* 数字人形象展示 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">大卡数字人</h3>
                <p className="text-xs text-white/80 truncate">您的智能行业监控助手</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">监控数据源</span>
                <span className="font-bold">{prompts.filter(p => p.isActive).length} 个</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">服务状态</span>
                <span className="font-bold">运行中</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能介绍 */}
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">行业动态监控</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 flex-shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-sm">7×24小时智能监控</div>
                <div className="text-xs text-slate-500">实时追踪行业政策、运价、竞对动态</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 系统状态 */}
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              系统状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">数据同步</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                正常
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">监控服务</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                运行中
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">今日更新</span>
              <span className="text-slate-900 font-medium">23 条</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧：内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 overflow-y-auto pr-2">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">行业动态监控</h2>
              <p className="text-sm text-slate-500 mt-1">大卡数字人7×24小时智能监控，个性化早报推送</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Bell className="w-3 h-3 mr-1" />
                {news.filter(n => !n.isRead).length} 条未读
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMonitorSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                监控设置
              </Button>
            </div>
          </div>

          {/* 今日早报 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Newspaper className="w-5 h-5" />
                  今日早报 · {report.date}
                </CardTitle>
                <Badge className="bg-white/20 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI生成
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {report.summary}
              </p>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {report.dataInsights.map((insight, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xs text-white/70 mb-1">{insight.label}</div>
                    <div className="text-lg font-bold flex items-center justify-center gap-1">
                      {insight.value}
                      {insight.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-300" />}
                      {insight.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-300 rotate-180" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {report.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    {point}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 动态分类标签 */}
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer">全部</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">政策</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">运价</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">竞对</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">市场</Badge>
          </div>

          {/* 行业动态瀑布流布局 */}
          <div className="grid grid-cols-2 gap-3">
            {news.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !item.isRead ? 'border-l-4 border-l-purple-500' : ''
                }`}
                onClick={() => {
                  setSelectedNews(item);
                  markAsRead(item.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getImportanceIcon(item.importance)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(item.category)}`}>
                          {getCategoryName(item.category)}
                        </Badge>
                        <span className="text-xs text-slate-400">{item.time}</span>
                        {!item.isRead && (
                          <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0">
                            新
                          </Badge>
                        )}
                      </div>
                      <h4 className={`font-medium mb-2 text-sm leading-snug ${item.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{item.source}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 新闻详情弹窗 */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getCategoryColor(selectedNews?.category || '')}>
                {getCategoryName(selectedNews?.category || '')}
              </Badge>
              <span className="text-xs text-slate-400">{selectedNews?.time}</span>
            </div>
            <DialogTitle className="text-base leading-relaxed">
              {selectedNews?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
              <Globe className="w-4 h-4" />
              <span>来源: {selectedNews?.source}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedNews?.summary}
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">重要性</div>
              <div className="flex items-center gap-2">
                {getImportanceIcon(selectedNews?.importance || 'low')}
                <span className="text-sm font-medium">
                  {selectedNews?.importance === 'high' ? '高' : selectedNews?.importance === 'medium' ? '中' : '低'}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 监控设置弹窗 */}
      <Dialog open={showMonitorSettings} onOpenChange={setShowMonitorSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>监控设置</DialogTitle>
            <DialogDescription>
              配置大卡数字人的监控规则，定制您关注的行业动态
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {/* 现有提示词列表 */}
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-800">当前监控规则</h4>
              {prompts.map((prompt) => (
                <div key={prompt.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">{prompt.name}</span>
                        <Badge 
                          variant={prompt.isActive ? 'default' : 'secondary'}
                          className="text-xs cursor-pointer"
                          onClick={() => togglePrompt(prompt.id)}
                        >
                          {prompt.isActive ? '已启用' : '已暂停'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{prompt.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(prompt.category)}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 添加新提示词 */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-800 mb-3">添加新监控规则</h4>
              <div className="space-y-3">
                <div>
                  <Label>规则名称</Label>
                  <input
                    type="text"
                    placeholder="例如：新能源政策关注"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={newPrompt.name || ''}
                    onChange={e => setNewPrompt({...newPrompt, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>监控类别</Label>
                  <Select 
                    value={newPrompt.category} 
                    onValueChange={(v: any) => setNewPrompt({...newPrompt, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">政策</SelectItem>
                      <SelectItem value="price">运价</SelectItem>
                      <SelectItem value="competitor">竞对</SelectItem>
                      <SelectItem value="market">市场</SelectItem>
                      <SelectItem value="general">通用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>监控内容描述</Label>
                  <Textarea 
                    placeholder="描述您希望监控的具体内容..."
                    value={newPrompt.content || ''}
                    onChange={e => setNewPrompt({...newPrompt, content: e.target.value})}
                    className="h-20"
                  />
                </div>
                <Button 
                  onClick={handleAddPrompt}
                  disabled={!newPrompt.name || !newPrompt.content}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  添加监控规则
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
