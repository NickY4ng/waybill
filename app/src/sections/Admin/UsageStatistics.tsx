import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface UsageRecord {
  id: string;
  customerId: string;
  customerName: string;
  queryCount: number;
  lastQueryTime: string;
}

interface QueryHistory {
  id: string;
  question: string;
  response: string;
  timestamp: string;
}

const MOCK_USAGE_DATA: UsageRecord[] = [
  { id: '1', customerId: 'C001', customerName: '北京物流有限公司', queryCount: 156, lastQueryTime: '2024-03-20 14:30' },
  { id: '2', customerId: 'C002', customerName: '上海运输集团', queryCount: 89, lastQueryTime: '2024-03-19 16:45' },
  { id: '3', customerId: 'C003', customerName: '广州供应链公司', queryCount: 234, lastQueryTime: '2024-03-20 09:15' },
  { id: '4', customerId: 'C004', customerName: '深圳货运代理', queryCount: 67, lastQueryTime: '2024-03-18 11:20' },
];

// 生成更多示例数据
const generateMockHistory = (): QueryHistory[] => {
  const questions = [
    '分析全国货物流向',
    '统计北京到上海的运输成本',
    '查询2024年1月煤炭运输量',
    '分析河北省钢材运输特点',
    '查询G15沈海高速货车流量',
    '统计广东省到湖南省的运单数',
    '分析天津港集装箱吞吐量',
    '查询2023年第四季度物流成本',
    '统计山东省到江苏省的煤炭运输',
    '分析长三角地区物流效率',
    '查询内蒙古到河北的煤炭运量',
    '统计2024年春节前后运输量变化',
    '分析冷链物流运输时效',
    '查询新疆到内地的农产品运输',
    '统计长江经济带物流成本',
  ];

  const responses = [
    '已生成深度分析报告，包含8个维度的全面分析。主要发现：北京到上海的货物流向呈现明显季节性特征，春节前后运输量增长35%。',
    '平均吨公里成本为0.35元，较上月下降5%。主要成本构成：燃油占45%，人工占30%，其他占25%。',
    '2024年1月煤炭运输总量为1,250万吨，同比增长12%。主要流向：山西→河北占35%，内蒙古→北京占28%。',
    '河北省钢材运输呈现"西煤东运"特征，主要线路为唐山→天津→山东。平均运输距离450公里。',
    'G15沈海高速日均货车流量为12,000辆，高峰时段为上午9-11点。货车类型以重型半挂为主，占比65%。',
    '广东省到湖南省2024年运单数为45,678单，平均运输时效为18小时。主要货类：电子产品占40%，建材占30%。',
    '天津港2024年集装箱吞吐量为2,100万TEU，同比增长8%。主要航线：日韩线占35%，东南亚线占25%。',
    '2023年第四季度物流成本指数为105.2，环比上升2.1%。主要受燃油价格上涨影响。',
    '山东省到江苏省煤炭运输量为890万吨，运输方式以铁路为主（占60%），公路为辅（占40%）。',
    '长三角地区物流效率指数为92.5，高于全国平均水平。平均装卸时长为2.5小时，准点率为89%。',
    '内蒙古到河北煤炭运量为2,340万吨，运输高峰集中在冬季供暖期（11月-次年2月）。',
    '2024年春节前后运输量呈现"节前高峰、节中低谷、节后恢复"特征。节前一周运输量增长42%。',
    '冷链物流平均运输时效为24小时，温控达标率为98.5%。主要问题：末端配送时效不稳定。',
    '新疆到内地农产品运输量为156万吨，运输距离平均3,200公里。主要货类：棉花占45%，水果占30%。',
    '长江经济带物流成本指数为102.8，低于全国平均。水运优势显著，水运成本仅为公路的1/3。',
  ];

  const history: QueryHistory[] = [];
  for (let i = 0; i < 45; i++) {
    const questionIndex = i % questions.length;
    const responseIndex = i % responses.length;
    const date = new Date('2024-03-20');
    date.setHours(date.getHours() - i * 2);
    
    history.push({
      id: (i + 1).toString(),
      question: questions[questionIndex],
      response: responses[responseIndex],
      timestamp: date.toISOString().slice(0, 16).replace('T', ' '),
    });
  }
  return history;
};

const MOCK_HISTORY_DATA: QueryHistory[] = generateMockHistory();

export function UsageStatistics() {
  const [usageData] = useState<UsageRecord[]>(MOCK_USAGE_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UsageRecord | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = usageData.filter(record =>
    record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewHistory = (record: UsageRecord) => {
    setSelectedCustomer(record);
    setCurrentPage(1);
    setIsHistoryDialogOpen(true);
  };

  // 分页计算
  const totalPages = Math.ceil(MOCK_HISTORY_DATA.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = MOCK_HISTORY_DATA.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">消耗次数统计</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户ID或客户名称"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-slate-400">至</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户ID</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>查询次数</TableHead>
                <TableHead>最后查询时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.customerId}</TableCell>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {record.queryCount} 次
                    </span>
                  </TableCell>
                  <TableCell>{record.lastQueryTime}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewHistory(record)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看历史
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 查询历史弹窗 - 增大尺寸 */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              查询历史 - {selectedCustomer?.customerName}
              <span className="text-sm font-normal text-slate-400 ml-2">
                (共 {MOCK_HISTORY_DATA.length} 条记录)
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {currentPageData.map((history, index) => (
                <div key={history.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          查询 #{startIndex + index + 1}
                        </span>
                        <span className="text-xs text-slate-400">{history.timestamp}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded border border-slate-100">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">问题：</span>
                            {history.question}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded border border-slate-100">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">回答：</span>
                            {history.response}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 分页控件 */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              第 {currentPage} / {totalPages} 页，共 {MOCK_HISTORY_DATA.length} 条记录
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一页
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
