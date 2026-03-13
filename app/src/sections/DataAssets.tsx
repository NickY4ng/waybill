import { useState } from 'react';
import {
  Database,
  Cloud,
  Server,
  Upload,
  Link2,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Search,
  Filter,
  Plus,
  Truck,
  Warehouse,
  Key,
  Link,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 数据资产类型
interface DataAsset {
  id: string;
  name: string;
  description: string;
  type: 'platform' | 'upload' | 'system';
  size: string;
  recordCount: number;
  lastUpdate: string;
  updateFrequency: string;
  status: 'active' | 'paused' | 'error';
  source?: string;
  tags: string[];
}

// 系统连接类型
interface SystemConnection {
  id: string;
  name: string;
  type: 'tms' | 'wms' | 'erp' | 'custom';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: string;
  dataCount?: number;
  description: string;
  apiUrl?: string;
  username?: string;
  password?: string;
}

// 初始系统连接配置
const INITIAL_CONNECTIONS: SystemConnection[] = [
  {
    id: 'tms',
    name: 'TMS运输管理系统',
    type: 'tms',
    icon: <Truck className="w-6 h-6" />,
    status: 'connected',
    lastSync: '2分钟前',
    dataCount: 15234,
    description: '实时同步运单、车辆、司机数据',
    apiUrl: 'https://tms.company.com/api',
    username: 'admin',
  },
  {
    id: 'wms',
    name: 'WMS仓储管理系统',
    type: 'wms',
    icon: <Warehouse className="w-6 h-6" />,
    status: 'connected',
    lastSync: '5分钟前',
    dataCount: 8932,
    description: '库存、出入库、库位数据整合',
    apiUrl: 'https://wms.company.com/api',
    username: 'warehouse_admin',
  },
  {
    id: 'erp',
    name: 'ERP企业资源系统',
    type: 'erp',
    icon: <Database className="w-6 h-6" />,
    status: 'syncing',
    lastSync: '同步中...',
    dataCount: 45671,
    description: '财务、采购、销售数据打通',
    apiUrl: 'https://erp.company.com/api',
    username: 'erp_user',
  },
];

// 模拟数据资产 - 只保留系统对接和上传数据
const INITIAL_DATA_ASSETS: DataAsset[] = [
  // 系统连接数据
  {
    id: '6',
    name: 'TMS运输管理系统数据',
    description: '通过大卡数字人连接的TMS系统实时数据，包含运单、调度、结算信息',
    type: 'system',
    size: '890 GB',
    recordCount: 3200000,
    lastUpdate: '2026-03-06 08:30',
    updateFrequency: '实时同步',
    status: 'active',
    source: 'TMS系统',
    tags: ['TMS', '实时', '系统对接'],
  },
  {
    id: '7',
    name: 'WMS仓储管理系统数据',
    description: '通过大卡数字人连接的WMS系统数据，包含库存、出入库、库位信息',
    type: 'system',
    size: '456 GB',
    recordCount: 1800000,
    lastUpdate: '2026-03-06 08:25',
    updateFrequency: '实时同步',
    status: 'active',
    source: 'WMS系统',
    tags: ['WMS', '实时', '仓储'],
  },
  {
    id: '8',
    name: 'ERP企业资源数据',
    description: '通过大卡数字人连接的ERP系统数据，包含财务、采购、销售信息',
    type: 'system',
    size: '1.2 TB',
    recordCount: 5600000,
    lastUpdate: '2026-03-06 08:15',
    updateFrequency: '实时同步',
    status: 'paused',
    source: 'ERP系统',
    tags: ['ERP', '实时', '财务'],
  },
  // 客户上传数据
  {
    id: '4',
    name: '客户自有运单数据2024',
    description: '客户上传的2024年度自有运单数据，用于对比分析',
    type: 'upload',
    size: '12 GB',
    recordCount: 520000,
    lastUpdate: '2026-02-28',
    updateFrequency: '手动上传',
    status: 'active',
    tags: ['上传', '2024', '自有数据'],
  },
  {
    id: '5',
    name: '客户车辆档案',
    description: '客户自有车辆的详细信息，包含车型、载重、购置时间等',
    type: 'upload',
    size: '256 MB',
    recordCount: 850,
    lastUpdate: '2026-01-15',
    updateFrequency: '手动上传',
    status: 'active',
    tags: ['上传', '车辆', '档案'],
  },
];

export function DataAssets() {
  const [dataAssets, setDataAssets] = useState<DataAsset[]>(INITIAL_DATA_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<DataAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'upload' | 'system'>('all');
  
  // 系统连接相关状态
  const [connections, setConnections] = useState<SystemConnection[]>(INITIAL_CONNECTIONS);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<SystemConnection>>({
    type: 'custom',
    status: 'disconnected',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showConnections, setShowConnections] = useState(false);

  // 过滤数据
  const filteredAssets = dataAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || asset.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // 按类型分组
  const uploadAssets = filteredAssets.filter(a => a.type === 'upload');
  const systemAssets = filteredAssets.filter(a => a.type === 'system');

  // 暂停/恢复数据
  const toggleAssetStatus = (id: string) => {
    setDataAssets(prev => prev.map(asset => {
      if (asset.id === id) {
        return {
          ...asset,
          status: asset.status === 'active' ? 'paused' : 'active'
        };
      }
      return asset;
    }));
  };

  // 删除数据
  const handleDelete = (asset: DataAsset) => {
    setAssetToDelete(asset);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      setDataAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
      setShowDeleteConfirm(false);
      setAssetToDelete(null);
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-5 h-5" />;
      case 'system': return <Server className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  // 获取类型名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'upload': return '上传数据';
      case 'system': return '系统对接';
      default: return '其他';
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-green-100 text-green-700 border-green-200';
      case 'system': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // 获取状态文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '正常使用';
      case 'paused': return '已暂停';
      case 'error': return '异常';
      default: return '未知';
    }
  };

  // 渲染数据卡片 - 超压缩版本
  const renderAssetCard = (asset: DataAsset) => (
    <Card key={asset.id} className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${getTypeColor(asset.type)}`}>
              {getTypeIcon(asset.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 text-sm truncate">{asset.name}</h3>
                {getStatusIcon(asset.status)}
              </div>
              <p className="text-xs text-slate-500 truncate">{asset.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0 ml-3">
            <span>{asset.size}</span>
            <span>{asset.recordCount.toLocaleString()}条</span>
            <span className="flex items-center gap-1">
              {asset.type === 'system' && asset.status === 'active' && (
                <RefreshCw className="w-3 h-3 text-green-500 animate-spin" />
              )}
              {asset.updateFrequency}
            </span>
            <span className="text-slate-300">|</span>
            <span>{asset.lastUpdate}</span>
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => toggleAssetStatus(asset.id)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                title={asset.status === 'active' ? '暂停接收' : '恢复接收'}
              >
                {asset.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              {asset.type === 'upload' && (
                <button
                  onClick={() => handleDelete(asset)}
                  className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setSelectedAsset(asset)}
                className="p-1 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-500"
                title="查看详情"
              >
                <FileText className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* 左侧：统计概览 */}
      <div className="w-64 flex flex-col gap-3 overflow-y-auto pb-2">
        {/* 数据资产总览 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">数据资产</h3>
                <p className="text-xs text-white/80 truncate">全量数据统一管理</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">数据总量</span>
                <span className="font-bold">2.5 TB</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">数据表数量</span>
                <span className="font-bold">{dataAssets.length} 个</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">总记录数</span>
                <span className="font-bold">1,100 万+</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 基础数据服务说明 */}
        <Card className="flex-shrink-0 border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              基础数据服务
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              平台提供行业基础数据分析服务，支撑您的业务决策。所有数据均通过安全加密传输，严格保护您的数据隐私。
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3 h-3 text-green-500" />
              <span>企业级加密存储</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>严格隔离保护</span>
            </div>
          </CardContent>
        </Card>

        {/* 分类统计 */}
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">数据来源分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {/* 系统对接 */}
            <div 
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeFilter === 'system' ? 'bg-purple-50 border border-purple-200' : 'hover:bg-slate-50'
              }`}
              onClick={() => setActiveFilter(activeFilter === 'system' ? 'all' : 'system')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">系统对接</span>
                </div>
                <Badge className="bg-purple-100 text-purple-700 text-xs">{systemAssets.length}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">通过大卡数字人连接的内部系统</p>
            </div>

            {/* 上传数据 */}
            <div 
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeFilter === 'upload' ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50'
              }`}
              onClick={() => setActiveFilter(activeFilter === 'upload' ? 'all' : 'upload')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-700">上传数据</span>
                </div>
                <Badge className="bg-green-100 text-green-700 text-xs">{uploadAssets.length}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">客户自主上传的数据文件</p>
            </div>
          </CardContent>
        </Card>

        {/* 系统连接 - 依托大卡数字人 */}
        <Card className="flex-shrink-0 border-purple-200">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              依托大卡数字人
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600">已连接系统</span>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {connections.filter(c => c.status === 'connected').length}/{connections.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        conn.status === 'connected' ? 'bg-green-500' : 
                        conn.status === 'syncing' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                      <span className="text-slate-700 truncate max-w-[80px]">{conn.name}</span>
                    </div>
                    <span className={`text-xs ${
                      conn.status === 'connected' ? 'text-green-600' : 
                      conn.status === 'syncing' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {conn.status === 'connected' ? '已连接' : 
                       conn.status === 'syncing' ? '同步中' : '未连接'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-8"
              onClick={() => setShowConnections(true)}
            >
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              管理连接
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* 右侧：数据列表 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">数据资产管理</h2>
            <p className="text-xs text-slate-500 mt-0.5">统一管理多来源数据，支撑智能分析决策</p>
          </div>
          
          {/* 数据安全提示 - 居中显示 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-md">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">数据安全保护</span>
            <span className="text-xs text-white/80">·</span>
            <span className="text-xs text-white/90">企业级加密存储</span>
            <span className="text-xs text-white/80">·</span>
            <span className="text-xs text-white/90">严格隔离保护</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="搜索数据..."
                className="pl-9 w-56 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              筛选
            </Button>
          </div>
        </div>

        {/* 数据列表 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* 系统对接 */}
          {(activeFilter === 'all' || activeFilter === 'system') && systemAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-purple-500" />
                <h3 className="font-bold text-slate-800 text-sm">系统对接</h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">{systemAssets.length}</Badge>
                <span className="text-xs text-slate-400">通过大卡数字人连接的内部系统，实时同步</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {systemAssets.map(renderAssetCard)}
              </div>
            </div>
          )}

          {/* 上传数据 */}
          {(activeFilter === 'all' || activeFilter === 'upload') && uploadAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-slate-800 text-sm">上传数据</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">{uploadAssets.length}</Badge>
                <span className="text-xs text-slate-400">客户自主上传的数据，可自由管理</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {uploadAssets.map(renderAssetCard)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据详情弹窗 */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(selectedAsset?.type || '')}`}>
                {getTypeIcon(selectedAsset?.type || '')}
              </div>
              <div>
                <DialogTitle className="text-base">{selectedAsset?.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  {getTypeName(selectedAsset?.type || '')} · {selectedAsset?.size}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">数据描述</div>
              <p className="text-sm text-slate-600">{selectedAsset?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">记录数</div>
                <div className="font-medium text-slate-800 text-sm">{selectedAsset?.recordCount.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">更新频率</div>
                <div className="font-medium text-slate-800 text-sm">{selectedAsset?.updateFrequency}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">上次更新</div>
                <div className="font-medium text-slate-800 text-sm">{selectedAsset?.lastUpdate}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                  {getStatusIcon(selectedAsset?.status || '')}
                  {getStatusText(selectedAsset?.status || '')}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">确认删除</DialogTitle>
            <DialogDescription className="text-sm">
              确定要删除数据资产 "{assetToDelete?.name}" 吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 系统连接管理弹窗 */}
      <Dialog open={showConnections} onOpenChange={setShowConnections}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              依托大卡数字人 · 连接内部系统
            </DialogTitle>
            <DialogDescription>
              通过大卡数字人打破信息孤岛，实现数据互通互联
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {/* 同步进度 */}
            {isSyncing && (
              <Card className="border-blue-200 bg-blue-50/50 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">数据同步中</span>
                    <span className="text-sm text-blue-600">{syncProgress}%</span>
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 系统连接列表 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800">已连接系统</h4>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddConnection(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加连接
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setIsSyncing(true);
                      setSyncProgress(0);
                      const interval = setInterval(() => {
                        setSyncProgress(prev => {
                          if (prev >= 100) {
                            clearInterval(interval);
                            setIsSyncing(false);
                            return 100;
                          }
                          return prev + 10;
                        });
                      }, 200);
                    }}
                    disabled={isSyncing}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? '同步中...' : '一键同步'}
                  </Button>
                </div>
              </div>
              
              {connections.map((conn) => (
                <Card key={conn.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        conn.status === 'connected' 
                          ? 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600' 
                          : conn.status === 'syncing'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {conn.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-800">{conn.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={
                              conn.status === 'connected' 
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : conn.status === 'syncing'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-500'
                            }
                          >
                            {conn.status === 'connected' ? '已连接' : conn.status === 'syncing' ? '同步中' : '未连接'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{conn.description}</p>
                        <div className="bg-slate-50 rounded-lg p-2 mb-2">
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Link className="w-3 h-3" />
                              <span className="truncate">{conn.apiUrl}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              <span>{conn.username}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            上次同步: {conn.lastSync}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            数据量: {conn.dataCount?.toLocaleString()} 条
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 数据整合价值 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-500" />
                  数据整合价值
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="font-medium text-slate-800 text-sm">数据安全</div>
                    <div className="text-xs text-slate-500 mt-0.5">企业级加密传输</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="font-medium text-slate-800 text-sm">实时同步</div>
                    <div className="text-xs text-slate-500 mt-0.5">分钟级数据更新</div>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="font-medium text-slate-800 text-sm">全景视图</div>
                    <div className="text-xs text-slate-500 mt-0.5">打破信息孤岛</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加连接弹窗 */}
      <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加系统连接</DialogTitle>
            <DialogDescription>
              配置您的内部系统连接信息，实现数据互通
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>系统名称</Label>
              <Input 
                placeholder="例如：财务管理系统"
                value={newConnection.name || ''}
                onChange={e => setNewConnection({...newConnection, name: e.target.value})}
              />
            </div>
            <div>
              <Label>系统类型</Label>
              <Select 
                value={newConnection.type} 
                onValueChange={(v: any) => setNewConnection({...newConnection, type: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择系统类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tms">TMS运输管理系统</SelectItem>
                  <SelectItem value="wms">WMS仓储管理系统</SelectItem>
                  <SelectItem value="erp">ERP企业资源系统</SelectItem>
                  <SelectItem value="custom">自定义系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>API地址</Label>
              <Input 
                placeholder="https://api.example.com"
                value={newConnection.apiUrl || ''}
                onChange={e => setNewConnection({...newConnection, apiUrl: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>用户名</Label>
                <Input 
                  placeholder="用户名"
                  value={newConnection.username || ''}
                  onChange={e => setNewConnection({...newConnection, username: e.target.value})}
                />
              </div>
              <div>
                <Label>密码</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密码"
                    value={newConnection.password || ''}
                    onChange={e => setNewConnection({...newConnection, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Input 
                placeholder="系统功能描述..."
                value={newConnection.description || ''}
                onChange={e => setNewConnection({...newConnection, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddConnection(false)}>
                取消
              </Button>
              <Button 
                onClick={() => {
                  if (newConnection.name && newConnection.apiUrl) {
                    const connection: SystemConnection = {
                      id: Date.now().toString(),
                      name: newConnection.name,
                      type: newConnection.type as 'tms' | 'wms' | 'erp' | 'custom',
                      icon: <Server className="w-6 h-6" />,
                      status: 'disconnected',
                      description: newConnection.description || '',
                      apiUrl: newConnection.apiUrl,
                      username: newConnection.username,
                      password: newConnection.password,
                    };
                    setConnections(prev => [...prev, connection]);
                    setNewConnection({ type: 'custom', status: 'disconnected' });
                    setShowAddConnection(false);
                  }
                }}
                disabled={!newConnection.name || !newConnection.apiUrl}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Link2 className="w-4 h-4 mr-2" />
                添加连接
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
