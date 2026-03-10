import { useState } from 'react';
import { Download, Filter, ChevronLeft, ChevronRight, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// 模拟运单数据
const MOCK_WAYBILL_DATA = [
  {
    orderId: '6754040877461271876',
    vehicleNo: '晋C3XX1',
    vehicleType: '重型半挂牵引车',
    shipper: '宁武集团德盛煤业',
    shipperAddress: '山西省忻州市宁武县',
    consignee: '昌盛煤气化公司',
    consigneeAddress: '山西省晋中市介休市',
    goodsType: '烟煤、无烟煤、褐煤',
    weight: 40000,
    loadTime: '2024-10-03 11:21:17',
    unloadTime: '2024-10-03 20:33:12',
    totalMile: 267.3,
    totalCost: 1400,
    status: '已完成',
  },
  {
    orderId: '6956032583552911427',
    vehicleNo: '鲁B5XX8',
    vehicleType: '重型半挂牵引车',
    shipper: '青岛普朗德电气有限公司',
    shipperAddress: '山东省青岛市黄岛区',
    consignee: '青岛中集冷藏箱制造有限公司',
    consigneeAddress: '山东省青岛市黄岛区',
    goodsType: '电力设备、电器机械及器材',
    weight: 35000,
    loadTime: '2024-10-05 08:15:30',
    unloadTime: '2024-10-05 16:45:22',
    totalMile: 45.6,
    totalCost: 680,
    status: '已完成',
  },
  {
    orderId: '4269919349118435880',
    vehicleNo: '粤K8XX2',
    vehicleType: '重型仓栅式货车',
    shipper: '益锋粮油有限公司',
    shipperAddress: '广东省茂名市茂南区',
    consignee: '广东中烟工业公司湛江卷烟厂',
    consigneeAddress: '广东省湛江市霞山区',
    goodsType: '粮食、食用油',
    weight: 25000,
    loadTime: '2024-10-06 14:20:00',
    unloadTime: '2024-10-07 02:10:15',
    totalMile: 128.5,
    totalCost: 920,
    status: '运输中',
  },
  {
    orderId: '6527005084281517831',
    vehicleNo: '粤L3XX5',
    vehicleType: '重型厢式货车',
    shipper: '惠州市新骏宏鞋业有限公司',
    shipperAddress: '广东省惠州市惠东县',
    consignee: '佳联迅物流仓库',
    consigneeAddress: '广东省深圳市龙岗区',
    goodsType: '鞋帽、纺织品',
    weight: 8500,
    loadTime: '2024-10-07 09:30:45',
    unloadTime: '2024-10-07 15:20:30',
    totalMile: 98.3,
    totalCost: 450,
    status: '已完成',
  },
  {
    orderId: '7433211934911770190',
    vehicleNo: '粤J2XX7',
    vehicleType: '重型半挂牵引车',
    shipper: '珠西新材料集聚区管委会',
    shipperAddress: '广东省江门市新会区',
    consignee: '广州立邦涂料有限公司',
    consigneeAddress: '广东省广州市黄埔区',
    goodsType: '化工原料、涂料',
    weight: 32000,
    loadTime: '2024-10-08 07:45:20',
    unloadTime: '2024-10-08 14:30:00',
    totalMile: 156.8,
    totalCost: 780,
    status: '已完成',
  },
  {
    orderId: '7625030265580018368',
    vehicleNo: '豫G5XX9',
    vehicleType: '重型半挂牵引车',
    shipper: '二手旧门窗彩钢瓦',
    shipperAddress: '河南省新乡市红旗区',
    consignee: '孟电集团新型建材公司',
    consigneeAddress: '河南省新乡市辉县市',
    goodsType: '建筑材料、钢材',
    weight: 28000,
    loadTime: '2024-10-09 11:00:00',
    unloadTime: '2024-10-09 18:15:45',
    totalMile: 85.2,
    totalCost: 520,
    status: '已完成',
  },
  {
    orderId: '7500066081527248134',
    vehicleNo: '冀E8XX3',
    vehicleType: '重型自卸货车',
    shipper: '邢台钢铁有限责任公司',
    shipperAddress: '河北省邢台市信都区',
    consignee: '恒润能源云驾岭加油站',
    consigneeAddress: '河北省邯郸市武安市',
    goodsType: '钢铁、钢材',
    weight: 45000,
    loadTime: '2024-10-10 06:20:30',
    unloadTime: '2024-10-10 12:45:15',
    totalMile: 112.6,
    totalCost: 890,
    status: '已完成',
  },
  {
    orderId: '7102008798068716575',
    vehicleNo: '冀B2XX6',
    vehicleType: '重型半挂牵引车',
    shipper: '首钢京唐公司',
    shipperAddress: '河北省唐山市曹妃甸区',
    consignee: '唐县重远建材有限公司',
    consigneeAddress: '河北省保定市唐县',
    goodsType: '钢材、型材',
    weight: 38000,
    loadTime: '2024-10-11 13:10:00',
    unloadTime: '2024-10-12 01:25:30',
    totalMile: 245.8,
    totalCost: 1250,
    status: '运输中',
  },
  {
    orderId: '6666023636353243453',
    vehicleNo: '辽F7XX4',
    vehicleType: '重型半挂牵引车',
    shipper: '北方恒达物流园',
    shipperAddress: '辽宁省本溪市平山区',
    consignee: '瑞丰农产品有限公司',
    consigneeAddress: '辽宁省沈阳市沈河区',
    goodsType: '农产品、粮食',
    weight: 22000,
    loadTime: '2024-10-12 08:45:00',
    unloadTime: '2024-10-12 16:30:15',
    totalMile: 168.4,
    totalCost: 720,
    status: '已完成',
  },
  {
    orderId: '3327038080477619452',
    vehicleNo: '粤S9XX1',
    vehicleType: '重型半挂牵引车',
    shipper: '东莞港国际集装箱',
    shipperAddress: '广东省东莞市东莞市',
    consignee: '东莞市起程实业有限公司',
    consigneeAddress: '广东省东莞市虎门镇',
    goodsType: '集装箱、机械设备',
    weight: 30000,
    loadTime: '2024-10-13 10:20:45',
    unloadTime: '2024-10-13 17:15:30',
    totalMile: 45.8,
    totalCost: 380,
    status: '已完成',
  },
];

export function DataDetailTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  

  const totalRecords = 12847;
  const totalPages = Math.ceil(totalRecords / parseInt(pageSize));

  const handleExport = (format: string) => {
    alert(`正在导出${format}格式数据...`);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 bg-slate-900 border-slate-800 flex flex-col">
        <CardHeader className="pb-2 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-white">运单明细数据</CardTitle>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                共 {totalRecords.toLocaleString()} 条
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                <Filter className="w-4 h-4 mr-1" />
                高级筛选
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    <Download className="w-4 h-4 mr-1" />
                    导出数据
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={() => handleExport('Excel')} className="text-slate-300 hover:text-white">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-400" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('CSV')} className="text-slate-300 hover:text-white">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('JSON')} className="text-slate-300 hover:text-white">
                    <FileJson className="w-4 h-4 mr-2 text-yellow-400" />
                    JSON (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-800 sticky top-0">
              <TableRow className="border-slate-700 hover:bg-slate-800">
                <TableHead className="text-slate-300 w-16">序号</TableHead>
                <TableHead className="text-slate-300">运单号</TableHead>
                <TableHead className="text-slate-300">车牌号</TableHead>
                <TableHead className="text-slate-300">车型</TableHead>
                <TableHead className="text-slate-300">发货方</TableHead>
                <TableHead className="text-slate-300">收货方</TableHead>
                <TableHead className="text-slate-300">货类</TableHead>
                <TableHead className="text-slate-300">重量(kg)</TableHead>
                <TableHead className="text-slate-300">装货时间</TableHead>
                <TableHead className="text-slate-300">里程(km)</TableHead>
                <TableHead className="text-slate-300">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_WAYBILL_DATA.map((row, index) => (
                <TableRow key={row.orderId} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-slate-400">
                    {(currentPage - 1) * parseInt(pageSize) + index + 1}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-xs">{row.orderId}</TableCell>
                  <TableCell className="text-slate-300">{row.vehicleNo}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{row.vehicleType}</TableCell>
                  <TableCell className="text-slate-300">
                    <div className="max-w-[120px] truncate" title={row.shipper}>
                      {row.shipper}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{row.shipperAddress}</div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <div className="max-w-[120px] truncate" title={row.consignee}>
                      {row.consignee}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{row.consigneeAddress}</div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{row.goodsType}</TableCell>
                  <TableCell className="text-slate-300">{row.weight.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{row.loadTime}</TableCell>
                  <TableCell className="text-slate-300">{row.totalMile}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                          详情
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">运单详情</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">运单号：</span>
                              <span className="text-slate-200 font-mono">{row.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">车牌号：</span>
                              <span className="text-slate-200">{row.vehicleNo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">车型：</span>
                              <span className="text-slate-200">{row.vehicleType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">货物重量：</span>
                              <span className="text-slate-200">{row.weight.toLocaleString()} kg</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-400">装货时间：</span>
                              <span className="text-slate-200">{row.loadTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">卸货时间：</span>
                              <span className="text-slate-200">{row.unloadTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">总里程：</span>
                              <span className="text-slate-200">{row.totalMile} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">总运费：</span>
                              <span className="text-slate-200">{row.totalCost} 元</span>
                            </div>
                          </div>
                          <div className="col-span-2 border-t border-slate-700 pt-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-slate-400 mb-1">发货方</div>
                                <div className="text-slate-200">{row.shipper}</div>
                                <div className="text-slate-500 text-xs">{row.shipperAddress}</div>
                              </div>
                              <div>
                                <div className="text-slate-400 mb-1">收货方</div>
                                <div className="text-slate-200">{row.consignee}</div>
                                <div className="text-slate-500 text-xs">{row.consigneeAddress}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {/* 分页 */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              显示 {(currentPage - 1) * parseInt(pageSize) + 1} - {Math.min(currentPage * parseInt(pageSize), totalRecords)} 条，共 {totalRecords.toLocaleString()} 条
            </span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-20 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-400">条/页</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-400 px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
