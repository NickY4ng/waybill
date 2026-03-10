import { useState, useRef } from 'react';
import { Map, Circle, Square, Hexagon, MousePointer, Trash2, Layers, Ruler, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type FenceType = 'circle' | 'polygon' | 'rectangle' | null;

interface Fence {
  id: string;
  name: string;
  type: FenceType;
  center?: { lng: number; lat: number };
  radius?: number;
  points?: { lng: number; lat: number }[];
  area: number;
  createdAt: Date;
}

const MOCK_FENCE_DATA = {
  vehicles: 156,
  enterprises: 23,
  monthlyFlow: 4520,
  avgStayTime: 2.5,
  mainCargo: ['煤炭', '钢铁', '水泥'],
};

const MOCK_VEHICLE_DATA = [
  { plate: '晋C3XX1', type: '重型半挂牵引车', enterTime: '2024-10-15 08:30:00', stayTime: '3.5h', cargo: '煤炭', weight: 40000 },
  { plate: '鲁B5XX8', type: '重型半挂牵引车', enterTime: '2024-10-15 09:15:30', stayTime: '2.0h', cargo: '钢铁', weight: 35000 },
  { plate: '粤K8XX2', type: '重型仓栅式货车', enterTime: '2024-10-15 10:20:00', stayTime: '1.5h', cargo: '粮食', weight: 25000 },
  { plate: '冀E8XX3', type: '重型自卸货车', enterTime: '2024-10-15 11:00:00', stayTime: '4.0h', cargo: '钢材', weight: 45000 },
  { plate: '辽F7XX4', type: '重型半挂牵引车', enterTime: '2024-10-15 12:30:00', stayTime: '2.5h', cargo: '农产品', weight: 22000 },
];

export function FenceDrawer() {
  const [activeTool, setActiveTool] = useState<FenceType>(null);
  const [fences, setFences] = useState<Fence[]>([]);
  const [selectedFence, setSelectedFence] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newFenceName, setNewFenceName] = useState('');
  const [showDataPanel, setShowDataPanel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newFence: Fence = {
      id: Date.now().toString(),
      name: newFenceName || `围栏${fences.length + 1}`,
      type: activeTool,
      center: { lng: 116.4074 + (x - 300) / 1000, lat: 39.9042 + (y - 175) / 1000 },
      radius: activeTool === 'circle' ? 50 : undefined,
      area: activeTool === 'circle' ? Math.PI * 50 * 50 : 2500,
      createdAt: new Date(),
    };
    setFences([...fences, newFence]);
    setIsDrawing(false);
    setActiveTool(null);
    setNewFenceName('');
    setShowDataPanel(true);
  };

  const deleteFence = (id: string) => {
    setFences(fences.filter(f => f.id !== id));
    if (selectedFence === id) {
      setSelectedFence(null);
      setShowDataPanel(false);
    }
  };

  const startDrawing = (type: FenceType) => {
    setActiveTool(type);
    setIsDrawing(true);
  };

  return (
    <div className="h-full flex gap-4">
      {/* 左侧工具栏 */}
      <Card className="w-64 bg-white border-slate-200/60 shadow-sm flex flex-col">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-slate-800 text-sm flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <MousePointer className="w-4 h-4 text-white" />
            </div>
            绘制工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => startDrawing('circle')}
              className={activeTool === 'circle' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' 
                : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
              }
            >
              <Circle className="w-4 h-4 mr-1" />
              圆形
            </Button>
            <Button
              variant={activeTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => startDrawing('rectangle')}
              className={activeTool === 'rectangle' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' 
                : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
              }
            >
              <Square className="w-4 h-4 mr-1" />
              矩形
            </Button>
            <Button
              variant={activeTool === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => startDrawing('polygon')}
              className={activeTool === 'polygon' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' 
                : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
              }
            >
              <Hexagon className="w-4 h-4 mr-1" />
              多边形
            </Button>
          </div>

          {isDrawing && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Label className="text-slate-700 text-sm font-medium">围栏名称</Label>
              <Input
                value={newFenceName}
                onChange={(e) => setNewFenceName(e.target.value)}
                placeholder="输入围栏名称"
                className="bg-white border-slate-200 text-slate-700 text-sm rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500">点击地图绘制围栏</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-sm text-slate-600 mb-2 font-medium">已保存围栏 ({fences.length})</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {fences.map((fence) => (
                  <div
                    key={fence.id}
                    onClick={() => {
                      setSelectedFence(fence.id);
                      setShowDataPanel(true);
                    }}
                    className={`p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedFence === fence.id 
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 text-sm font-medium">{fence.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFence(fence.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-500 bg-white">
                        {fence.type === 'circle' ? '圆形' : fence.type === 'rectangle' ? '矩形' : '多边形'}
                      </Badge>
                      <span className="text-xs text-slate-400">{fence.area.toFixed(0)} km²</span>
                    </div>
                  </div>
                ))}
                {fences.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-4">
                    暂无围栏数据
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* 中间地图区域 */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 bg-white border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Map className="w-4 h-4 text-white" />
                </div>
                围栏绘制
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-200 text-slate-500 bg-white hover:bg-slate-50">
                  <Ruler className="w-3 h-3 mr-1" />
                  测距工具
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-500 bg-white hover:bg-slate-50">
                  <Layers className="w-3 h-3 mr-1" />
                  图层切换
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="relative h-[500px] bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-b-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                onClick={handleCanvasClick}
                className={`w-full h-full ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
              />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <rect width="100%" height="100%" fill="transparent" />
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <line x1="100" y1="250" x2="700" y2="250" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="400" y1="50" x2="400" y2="450" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="200" y1="100" x2="600" y2="400" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="600" y1="100" x2="200" y2="400" stroke="#cbd5e1" strokeWidth="2" />
                {fences.map((fence) => (
                  fence.type === 'circle' && fence.center ? (
                    <circle
                      key={fence.id}
                      cx={300 + (fence.center.lng - 116.4074) * 1000}
                      cy={175 + (fence.center.lat - 39.9042) * 1000}
                      r={fence.radius || 50}
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  ) : null
                ))}
              </svg>

              {fences.length === 0 && !isDrawing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Map className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-slate-500 mb-2">点击左侧工具开始绘制围栏</p>
                    <p className="text-xs text-slate-400">支持圆形、矩形、多边形等多种形状</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧数据面板 */}
      {showDataPanel && (
        <Card className="w-80 bg-white border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-slate-800 text-sm flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
              围栏数据分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  概览
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  车辆
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-xs text-slate-500 mb-1">车辆数</p>
                    <p className="text-xl font-bold text-blue-600">{MOCK_FENCE_DATA.vehicles}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
                    <p className="text-xs text-slate-500 mb-1">企业数</p>
                    <p className="text-xl font-bold text-purple-600">{MOCK_FENCE_DATA.enterprises}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-100">
                    <p className="text-xs text-slate-500 mb-1">月流量</p>
                    <p className="text-xl font-bold text-amber-600">{MOCK_FENCE_DATA.monthlyFlow}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-xs text-slate-500 mb-1">平均停留</p>
                    <p className="text-xl font-bold text-emerald-600">{MOCK_FENCE_DATA.avgStayTime}h</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">主要货类</p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_FENCE_DATA.mainCargo.map((cargo, index) => (
                      <Badge key={index} variant="outline" className="bg-white border-slate-200 text-slate-600">
                        {cargo}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="vehicles" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="text-slate-600 text-xs">车牌</TableHead>
                        <TableHead className="text-slate-600 text-xs">货物</TableHead>
                        <TableHead className="text-slate-600 text-xs">停留</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_VEHICLE_DATA.map((vehicle, index) => (
                        <TableRow key={index} className="border-slate-100">
                          <TableCell className="text-xs text-slate-700 font-medium">{vehicle.plate}</TableCell>
                          <TableCell className="text-xs text-slate-600">{vehicle.cargo}</TableCell>
                          <TableCell className="text-xs text-slate-600">{vehicle.stayTime}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
