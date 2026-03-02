import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, TrendingUp, MapPin, ArrowRight, Factory, Truck, Search, X, Loader2, Fuel, Lightbulb, Route, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as echarts from 'echarts';

// 将echarts挂载到window对象，供动态加载的脚本使用
if (typeof window !== 'undefined') {
  (window as any).echarts = echarts;
}

import { generateCargoFlowAnalysis, clearCache as clearCargoFlowCache, getCachedAnalysis as getCargoFlowCachedAnalysis } from '@/services/cargoFlowApi';
import { generateLoadingEfficiencyAnalysis, clearCache as clearLoadingEfficiencyCache, getCachedAnalysis as getLoadingEfficiencyCachedAnalysis } from '@/services/loadingEfficiencyApi';
import { generateEnterpriseAnalysis, clearCache as clearEnterpriseCache, getCachedAnalysis as getEnterpriseCachedAnalysis } from '@/services/enterpriseApi';

// 【实现需求：虚拟企业数据，包含上下游运输量、趟次数、月度数据和趋势分析】
interface Enterprise {
  id: string;
  name: string;
  upstreamVolume: number;
  downstreamVolume: number;
  upstreamTrips: number;
  downstreamTrips: number;
  upstreamPartners: { name: string; volume: number; trips: number }[];
  downstreamPartners: { name: string; volume: number; trips: number }[];
  monthlyData: {
    months: string[];
    upstreamTrips: number[];
    downstreamTrips: number[];
  };
  trendAnalysis: string[];
}

const MOCK_ENTERPRISES: Enterprise[] = [
  {
    id: '1',
    name: '宁武集团德盛煤业',
    upstreamVolume: 12500,
    downstreamVolume: 28600,
    upstreamTrips: 312,
    downstreamTrips: 715,
    upstreamPartners: [
      { name: '山西煤炭运销集团', volume: 5200, trips: 130 },
      { name: '大同煤矿集团', volume: 4500, trips: 112 },
      { name: '阳泉煤业集团', volume: 2800, trips: 70 },
    ],
    downstreamPartners: [
      { name: '昌盛煤气化公司', volume: 8600, trips: 215 },
      { name: '河北钢铁集团', volume: 7200, trips: 180 },
      { name: '天津港煤炭码头', volume: 6800, trips: 170 },
      { name: '山东魏桥创业集团', volume: 6000, trips: 150 },
    ],
    monthlyData: {
      months: ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      upstreamTrips: [18, 22, 28, 32, 35, 28, 25, 22, 30, 38, 20, 14],
      downstreamTrips: [45, 52, 68, 75, 82, 70, 65, 58, 72, 88, 48, 32],
    },
    trendAnalysis: [
      '冬季供暖季（11月-次年2月）下游趟次显著上升，与北方采暖需求高度相关',
      '夏季（6-8月）运输量相对平稳，主要受工业用电需求支撑',
      '春节前后（1-2月）运输量明显下降，受假期停工影响',
      '整体呈现明显的季节性波动特征，与煤炭行业周期性一致',
    ],
  },
  {
    id: '2',
    name: '青岛中集冷藏箱制造',
    upstreamVolume: 8600,
    downstreamVolume: 15200,
    upstreamTrips: 215,
    downstreamTrips: 380,
    upstreamPartners: [
      { name: '宝钢集团', volume: 3200, trips: 80 },
      { name: '河北钢铁集团', volume: 2800, trips: 70 },
      { name: '青岛普朗德电气', volume: 2600, trips: 65 },
    ],
    downstreamPartners: [
      { name: '海尔集团', volume: 4200, trips: 105 },
      { name: '美的集团', volume: 3800, trips: 95 },
      { name: '青岛港物流', volume: 3600, trips: 90 },
      { name: '顺丰冷链', volume: 3600, trips: 90 },
    ],
    monthlyData: {
      months: ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      upstreamTrips: [12, 15, 18, 20, 22, 20, 18, 16, 14, 12, 10, 8],
      downstreamTrips: [28, 32, 38, 42, 45, 40, 35, 30, 26, 22, 18, 14],
    },
    trendAnalysis: [
      '上半年（3-7月）运输量持续攀升，与出口订单季节性增长相关',
      '下半年（8-12月）逐步回落，受海外需求放缓影响',
      '春节前后（1-2月）处于全年低谷，生产线停工检修',
      '整体趋势与家电出口周期高度吻合',
    ],
  },
  {
    id: '3',
    name: '广东中烟工业湛江卷烟厂',
    upstreamVolume: 6200,
    downstreamVolume: 9800,
    upstreamTrips: 155,
    downstreamTrips: 245,
    upstreamPartners: [
      { name: '益锋粮油', volume: 2800, trips: 70 },
      { name: '云南烟草集团', volume: 2200, trips: 55 },
      { name: '贵州中烟', volume: 1200, trips: 30 },
    ],
    downstreamPartners: [
      { name: '广东省烟草公司', volume: 4200, trips: 105 },
      { name: '深圳市烟草公司', volume: 2800, trips: 70 },
      { name: '广州市烟草公司', volume: 2800, trips: 70 },
    ],
    monthlyData: {
      months: ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      upstreamTrips: [10, 12, 13, 14, 13, 12, 14, 15, 16, 18, 12, 6],
      downstreamTrips: [18, 20, 22, 24, 22, 20, 23, 25, 28, 32, 20, 11],
    },
    trendAnalysis: [
      '春节前（12月-1月）运输量达到峰值，与节日备货需求相关',
      '春节后（2月）急剧下降，市场需求进入短暂调整期',
      '全年运输相对平稳，波动幅度较小，体现烟草行业稳定性',
      '下半年整体略高于上半年，与中秋国庆双节备货有关',
    ],
  },
  {
    id: '4',
    name: '惠州市新骏宏鞋业',
    upstreamVolume: 3200,
    downstreamVolume: 5800,
    upstreamTrips: 80,
    downstreamTrips: 145,
    upstreamPartners: [
      { name: '福建皮革厂', volume: 1200, trips: 30 },
      { name: '浙江纺织集团', volume: 1000, trips: 25 },
      { name: '广东橡胶厂', volume: 1000, trips: 25 },
    ],
    downstreamPartners: [
      { name: '佳联迅物流仓库', volume: 2200, trips: 55 },
      { name: '深圳华强北批发商', volume: 1800, trips: 45 },
      { name: '广州鞋城', volume: 1800, trips: 45 },
    ],
    monthlyData: {
      months: ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      upstreamTrips: [5, 6, 7, 8, 7, 6, 7, 8, 9, 10, 4, 3],
      downstreamTrips: [10, 12, 14, 16, 14, 12, 14, 16, 18, 20, 8, 5],
    },
    trendAnalysis: [
      '下半年（9-12月）运输量明显高于上半年，与秋冬鞋类旺季相关',
      '夏季（6-8月）相对平稳，凉鞋需求与原材料供应形成平衡',
      '春节前后（1-2月）大幅下降，工厂放假及物流停运影响显著',
      '整体呈现明显的淡旺季交替特征',
    ],
  },
  {
    id: '5',
    name: '河北钢铁集团唐山分公司',
    upstreamVolume: 28600,
    downstreamVolume: 32400,
    upstreamTrips: 572,
    downstreamTrips: 648,
    upstreamPartners: [
      { name: '澳大利亚铁矿石', volume: 12000, trips: 240 },
      { name: '巴西淡水河谷', volume: 8600, trips: 172 },
      { name: '山西焦炭集团', volume: 8000, trips: 160 },
    ],
    downstreamPartners: [
      { name: '中国建筑集团', volume: 12000, trips: 240 },
      { name: '上海汽车集团', volume: 8600, trips: 172 },
      { name: '美的集团', volume: 6800, trips: 136 },
      { name: '格力电器', volume: 5000, trips: 100 },
    ],
    monthlyData: {
      months: ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      upstreamTrips: [38, 42, 48, 52, 55, 50, 48, 45, 52, 58, 42, 32],
      downstreamTrips: [42, 48, 55, 60, 65, 58, 55, 50, 58, 65, 48, 36],
    },
    trendAnalysis: [
      '春季（3-5月）运输量稳步上升，与基建开工季高度相关',
      '夏季（6-8月）维持高位，房地产和制造业需求双重支撑',
      '秋季（9-11月）再次攀升，年底工程赶工带动钢材需求',
      '冬季（12-2月）明显回落，环保限产及工地停工影响',
      '上游铁矿石进口波动与国际航运价格变化相关',
    ],
  },
];

// 【核心组件：Iframe 渲染器，用于安全地渲染大模型生成的 HTML】
function IframeHtmlRenderer({ html, title }: { html: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log(`[${title}] IframeHtmlRenderer useEffect 触发，html 长度:`, html?.length || 0);
    
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        console.log(`[${title}] 开始处理 HTML...`);
        
        // 【关键修复：注入 ECharts 库到 iframe】
        // 移除外部 CDN 引用，避免 Tracking Prevention 阻止
        let cleanedHtml = html
          .replace(/<script[^>]*src=["']https?:\/\/[^"']+["'][^>]*><\/script>/gi, '');
        
        console.log(`[${title}] 移除 CDN 后 HTML 长度:`, cleanedHtml.length);
        
        // 在 HTML 头部注入 echarts 变量声明
        // 使用主页面已加载的 echarts
        const echartsScript = `
          <script>
            console.log('[iframe] 注入 echarts...');
            window.echarts = window.parent.echarts;
            console.log('[iframe] echarts 注入完成:', typeof window.echarts);
          <\/script>
        `;
        
        // 在 </head> 前注入脚本
        if (cleanedHtml.includes('</head>')) {
          cleanedHtml = cleanedHtml.replace('</head>', echartsScript + '</head>');
          console.log(`[${title}] 在 </head> 前注入 echarts`);
        } else {
          // 如果没有 head，在 body 开始前注入
          cleanedHtml = cleanedHtml.replace('<body>', '<head>' + echartsScript + '</head><body>');
          console.log(`[${title}] 在 <body> 前注入 echarts`);
        }
        
        // 检查是否包含图表初始化代码
        const hasEchartsInit = cleanedHtml.includes('echarts.init');
        const hasChartContainers = (cleanedHtml.match(/id="[^"]*chart[^"]*"/gi) || []).length;
        console.log(`[${title}] 包含 echarts.init:`, hasEchartsInit);
        console.log(`[${title}] 图表容器数量:`, hasChartContainers);
        
        doc.open();
        doc.write(cleanedHtml);
        doc.close();
        
        console.log(`[${title}] HTML 写入 iframe 完成`);
      } else {
        console.error(`[${title}] 无法获取 iframe document`);
      }
    } else {
      console.log(`[${title}] 条件不满足 - iframeRef:`, !!iframeRef.current, 'html:', !!html);
    }
  }, [html, title]);

  // 如果没有 html，显示加载状态
  if (!html) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <span className="ml-2 text-slate-400">加载中...</span>
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
        backgroundColor: '#0f172a',
      }}
    />
  );
}

export function SmartAnalysisAgent() {
  const [activeTab, setActiveTab] = useState('enterprise');
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>(MOCK_ENTERPRISES[0].id);
  
  // 【实现需求：货物流向分析状态管理】
  const [cargoFlowHtml, setCargoFlowHtml] = useState<string>('');
  const [cargoFlowLoading, setCargoFlowLoading] = useState<boolean>(false);
  const [cargoFlowError, setCargoFlowError] = useState<string>('');

  // 【实现需求：装卸货效率分析状态管理】
  const [loadingEfficiencyHtml, setLoadingEfficiencyHtml] = useState<string>('');
  const [loadingEfficiencyLoading, setLoadingEfficiencyLoading] = useState<boolean>(false);
  const [loadingEfficiencyError, setLoadingEfficiencyError] = useState<string>('');

  // 【实现需求：企业上下游分析状态管理】
  const [enterpriseHtml, setEnterpriseHtml] = useState<string>('');
  const [enterpriseLoading, setEnterpriseLoading] = useState<boolean>(false);
  const [enterpriseError, setEnterpriseError] = useState<string>('');
  
  const cargoChartRef = useRef<HTMLDivElement>(null);
  const flowChartRef = useRef<HTMLDivElement>(null);
  const regionChartRef = useRef<HTMLDivElement>(null);
  const vehicleChartRef = useRef<HTMLDivElement>(null);
  const mapFlowChartRef = useRef<HTMLDivElement>(null);
  const regionInteractionChartRef = useRef<HTMLDivElement>(null);

  // 【实现需求：货物流向分析图表初始化函数】
  const initCargoCharts = () => {
    // 货类分布图
    if (cargoChartRef.current) {
      const chart = echarts.init(cargoChartRef.current);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: [
            { name: '矿物性建筑材料', value: 42, itemStyle: { color: '#3b82f6' } },
            { name: '煤炭及制品', value: 28, itemStyle: { color: '#10b981' } },
            { name: '钢铁', value: 18, itemStyle: { color: '#f59e0b' } },
            { name: '机械设备', value: 8, itemStyle: { color: '#8b5cf6' } },
            { name: '其他', value: 4, itemStyle: { color: '#6b7280' } },
          ],
          label: { color: '#94a3b8', fontSize: 11 },
          itemStyle: { borderRadius: 5, borderColor: '#0f172a', borderWidth: 2 },
        }],
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 10 },
        },
      });
    }

    // 货物流向图
    if (flowChartRef.current) {
      const chart = echarts.init(flowChartRef.current);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['山西→河北', '内蒙古→北京', '陕西→河南', '新疆→甘肃', '山东→江苏', '四川→重庆', '其他'],
          axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        yAxis: {
          type: 'value',
          name: '运输趟次',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#334155' } },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        series: [{
          type: 'bar',
          data: [285, 234, 198, 156, 142, 128, 245],
          itemStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '60%',
        }],
      });
    }

    // 区域分布图
    if (regionChartRef.current) {
      const chart = echarts.init(regionChartRef.current);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        series: [{
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: [
            { name: '华北地区', value: 35, itemStyle: { color: '#3b82f6' } },
            { name: '华东地区', value: 28, itemStyle: { color: '#10b981' } },
            { name: '华南地区', value: 18, itemStyle: { color: '#f59e0b' } },
            { name: '西南地区', value: 12, itemStyle: { color: '#8b5cf6' } },
            { name: '其他地区', value: 7, itemStyle: { color: '#6b7280' } },
          ],
          label: { color: '#94a3b8', fontSize: 11 },
          itemStyle: { borderRadius: 5, borderColor: '#0f172a', borderWidth: 2 },
        }],
        legend: {
          orient: 'horizontal',
          bottom: 0,
          textStyle: { color: '#94a3b8', fontSize: 10 },
        },
      });
    }

    // 车辆类型分布
    if (vehicleChartRef.current) {
      const chart = echarts.init(vehicleChartRef.current);
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          name: '占比(%)',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8', formatter: '{value}%' },
          axisLine: { lineStyle: { color: '#334155' } },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        yAxis: {
          type: 'category',
          data: ['重型货车', '中型货车', '轻型货车', '集装箱车', '罐车'],
          axisLabel: { color: '#94a3b8' },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        series: [{
          type: 'bar',
          data: [45, 25, 18, 8, 4],
          itemStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#94a3b8',
          },
        }],
      });
    }

    // 区域流向热力图
    if (regionInteractionChartRef.current) {
      const chart = echarts.init(regionInteractionChartRef.current);
      const regions = ['华北', '华东', '华南', '华中', '西南', '西北', '东北'];
      const interactionData = [
        [0, 0, 0], [0, 1, 85], [0, 2, 62], [0, 3, 45], [0, 4, 38], [0, 5, 28], [0, 6, 35],
        [1, 0, 78], [1, 1, 0], [1, 2, 92], [1, 3, 68], [1, 4, 42], [1, 5, 22], [1, 6, 38],
        [2, 0, 45], [2, 1, 88], [2, 2, 0], [2, 3, 52], [2, 4, 75], [2, 5, 15], [2, 6, 25],
        [3, 0, 52], [3, 1, 65], [3, 2, 48], [3, 3, 0], [3, 4, 58], [3, 5, 32], [3, 6, 28],
        [4, 0, 35], [4, 1, 42], [4, 2, 68], [4, 3, 55], [4, 4, 0], [4, 5, 45], [4, 6, 22],
        [5, 0, 25], [5, 1, 18], [5, 2, 15], [5, 3, 28], [5, 4, 35], [5, 5, 0], [5, 6, 15],
        [6, 0, 32], [6, 1, 35], [6, 2, 22], [6, 3, 25], [6, 4, 18], [6, 5, 12], [6, 6, 0],
      ];
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          formatter: (params: any) => `${regions[params.data[0]]} → ${regions[params.data[1]]}: ${params.data[2]}趟`,
        },
        grid: { height: '70%', top: '10%' },
        xAxis: {
          type: 'category',
          data: regions,
          splitArea: { show: true, areaStyle: { color: ['#1e293b', '#0f172a'] } },
          axisLabel: { color: '#94a3b8' },
        },
        yAxis: {
          type: 'category',
          data: regions,
          splitArea: { show: true, areaStyle: { color: ['#1e293b', '#0f172a'] } },
          axisLabel: { color: '#94a3b8' },
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '2%',
          textStyle: { color: '#94a3b8' },
          inRange: {
            color: ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          },
        },
        series: [{
          type: 'heatmap',
          data: interactionData,
          label: { show: true, color: '#fff' },
          itemStyle: {
            borderColor: '#0f172a',
            borderWidth: 1,
          },
        }],
      });
    }
  };

  // 【实现需求：初始化图表】
  useEffect(() => {
    initCargoCharts();
    const handleResize = () => {
      // 添加空值检查，避免报错
      if (cargoChartRef.current) echarts.getInstanceByDom(cargoChartRef.current)?.resize();
      if (flowChartRef.current) echarts.getInstanceByDom(flowChartRef.current)?.resize();
      if (regionChartRef.current) echarts.getInstanceByDom(regionChartRef.current)?.resize();
      if (vehicleChartRef.current) echarts.getInstanceByDom(vehicleChartRef.current)?.resize();
      if (regionInteractionChartRef.current) echarts.getInstanceByDom(regionInteractionChartRef.current)?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 【实现需求：加载企业上下游分析】
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

  // 【实现需求：刷新企业分析】
  const refreshEnterpriseAnalysis = () => {
    clearEnterpriseCache();
    setEnterpriseHtml('');
    loadEnterpriseAnalysis();
  };

  // 【实现需求：加载货物流向分析】
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

  // 【实现需求：刷新货物流向分析】
  const refreshCargoFlowAnalysis = () => {
    clearCargoFlowCache();
    setCargoFlowHtml('');
    loadCargoFlowAnalysis();
  };

  // 【实现需求：清除缓存并重新生成货物流向分析】
  const clearAndRegenerateCargoFlow = () => {
    clearCargoFlowCache();
    setCargoFlowHtml('');
    loadCargoFlowAnalysis();
    toast.success('已清除缓存，重新生成中...');
  };

  // 【实现需求：加载装卸货效率分析】
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

  // 【实现需求：刷新装卸货效率分析】
  const refreshLoadingEfficiencyAnalysis = () => {
    clearLoadingEfficiencyCache();
    setLoadingEfficiencyHtml('');
    loadLoadingEfficiencyAnalysis();
  };

  // 【实现需求：加载企业上下游分析 HTML 内容，支持缓存】
  useEffect(() => {
    if (activeTab !== 'enterprise') return;

    const cached = getEnterpriseCachedAnalysis();
    if (cached) {
      setEnterpriseHtml(cached);
      return;
    }

    loadEnterpriseAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 【实现需求：加载货物流向分析 HTML 内容，支持缓存】
  useEffect(() => {
    if (activeTab !== 'cargo') return;

    const cached = getCargoFlowCachedAnalysis();
    if (cached) {
      setCargoFlowHtml(cached);
      return;
    }

    if (!cargoFlowHtml && !cargoFlowLoading && !cargoFlowError) {
      loadCargoFlowAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 【实现需求：加载装卸货效率分析 HTML 内容，支持缓存】
  useEffect(() => {
    if (activeTab !== 'location') return;

    const cached = getLoadingEfficiencyCachedAnalysis();
    if (cached) {
      setLoadingEfficiencyHtml(cached);
      return;
    }

    if (!loadingEfficiencyHtml && !loadingEfficiencyLoading && !loadingEfficiencyError) {
      loadLoadingEfficiencyAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const selectedEnterprise = MOCK_ENTERPRISES.find(e => e.id === selectedEnterpriseId);

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="enterprise" className="data-[state=active]:bg-blue-600">
              <Building2 className="w-4 h-4 mr-1" />
              企业上下游分析
            </TabsTrigger>
            <TabsTrigger value="cargo" className="data-[state=active]:bg-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              货物流向分析
            </TabsTrigger>
            <TabsTrigger value="location" className="data-[state=active]:bg-blue-600">
              <MapPin className="w-4 h-4 mr-1" />
              装卸货效率分析
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="border-violet-500 text-violet-400">
            基于真实运单数据分析
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {/* 企业上下游分析 */}
          <TabsContent value="enterprise" className="mt-0 space-y-4">
            {/* 【实现需求：大模型生成的企业上下游分析报告，使用 iframe 渲染】 */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  企业上下游全景分析
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshEnterpriseAnalysis}
                  disabled={enterpriseLoading}
                  className="text-slate-400 hover:text-white"
                >
                  {enterpriseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {enterpriseLoading ? '加载中...' : '刷新'}
                </Button>
              </CardHeader>
              <CardContent>
                {enterpriseLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                    <span className="text-slate-400 mb-4">AI正在生成企业上下游分析报告...</span>
                    <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                      <div className="h-full bg-blue-500 rounded-full absolute animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                    </div>
                    <span className="text-slate-500 text-xs mt-2">分析数据中...</span>
                  </div>
                ) : enterpriseError ? (
                  <div className="text-center py-10">
                    <p className="text-red-400 mb-4">{enterpriseError}</p>
                    <Button onClick={() => { setEnterpriseError(''); loadEnterpriseAnalysis(); }} className="bg-blue-600 hover:bg-blue-700">
                      重试
                    </Button>
                  </div>
                ) : enterpriseHtml ? (
                  <IframeHtmlRenderer html={enterpriseHtml} title="企业上下游分析" />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400 mb-4">点击按钮生成企业上下游分析报告</p>
                    <Button onClick={loadEnterpriseAnalysis} className="bg-blue-600 hover:bg-blue-700">
                      生成分析报告
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 货物流向分析 */}
          <TabsContent value="cargo" className="mt-0 space-y-4">
            {/* 【实现需求：大模型生成的货物流向分析报告，使用 iframe 渲染】 */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  区域间货物流向全景分析
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshCargoFlowAnalysis}
                  disabled={cargoFlowLoading}
                  className="text-slate-400 hover:text-white"
                >
                  {cargoFlowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {cargoFlowLoading ? '加载中...' : '刷新'}
                </Button>
              </CardHeader>
              <CardContent>
                {cargoFlowLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                    <span className="text-slate-400 mb-4">AI正在生成货物流向分析报告...</span>
                    <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                      <div className="h-full bg-blue-500 rounded-full absolute animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                    </div>
                    <span className="text-slate-500 text-xs mt-2">分析数据中...</span>
                  </div>
                ) : cargoFlowError ? (
                  <div className="text-center py-10">
                    <p className="text-red-400 mb-4">{cargoFlowError}</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => { setCargoFlowError(''); loadCargoFlowAnalysis(); }} className="bg-blue-600 hover:bg-blue-700">
                        重试
                      </Button>
                      <Button onClick={clearAndRegenerateCargoFlow} variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                        清除缓存重新生成
                      </Button>
                    </div>
                  </div>
                ) : cargoFlowHtml ? (
                  <IframeHtmlRenderer html={cargoFlowHtml} title="货物流向分析" />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400 mb-4">点击按钮生成货物流向分析报告</p>
                    <Button onClick={loadCargoFlowAnalysis} className="bg-blue-600 hover:bg-blue-700">
                      生成分析报告
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 装卸货效率分析 */}
          <TabsContent value="location" className="mt-0 space-y-4">
            {/* 【实现需求：大模型生成的装卸货效率分析报告，使用 iframe 渲染】 */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  装卸货效率全景分析
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshLoadingEfficiencyAnalysis}
                  disabled={loadingEfficiencyLoading}
                  className="text-slate-400 hover:text-white"
                >
                  {loadingEfficiencyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {loadingEfficiencyLoading ? '加载中...' : '刷新'}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingEfficiencyLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                    <span className="text-slate-400 mb-4">AI正在生成装卸货效率分析报告...</span>
                    <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                      <div className="h-full bg-blue-500 rounded-full absolute animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                    </div>
                    <span className="text-slate-500 text-xs mt-2">分析数据中...</span>
                  </div>
                ) : loadingEfficiencyError ? (
                  <div className="text-center py-10">
                    <p className="text-red-400 mb-4">{loadingEfficiencyError}</p>
                    <Button onClick={() => { setLoadingEfficiencyError(''); loadLoadingEfficiencyAnalysis(); }} className="bg-blue-600 hover:bg-blue-700">
                      重试
                    </Button>
                  </div>
                ) : loadingEfficiencyHtml ? (
                  <IframeHtmlRenderer html={loadingEfficiencyHtml} title="装卸货效率分析" />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400 mb-4">点击按钮生成装卸货效率分析报告</p>
                    <Button onClick={loadLoadingEfficiencyAnalysis} className="bg-blue-600 hover:bg-blue-700">
                      生成分析报告
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
