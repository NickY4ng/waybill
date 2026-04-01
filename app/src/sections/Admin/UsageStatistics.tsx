import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Calendar, MessageSquare } from 'lucide-react';

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

const MOCK_HISTORY_DATA: QueryHistory[] = [
  { id: '1', question: '分析全国货物流向', response: '已生成深度分析报告...', timestamp: '2024-03-20 14:30' },
  { id: '2', question: '统计北京到上海的运输成本', response: '平均吨公里成本为0.35元...', timestamp: '2024-03-20 14:25' },
  { id: '3', question: '查询2024年1月煤炭运输量', response: '2024年1月煤炭运输总量为...', timestamp: '2024-03-20 14:20' },
];

export function UsageStatistics() {
  const [usageData] = useState<UsageRecord[]>(MOCK_USAGE_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UsageRecord | null>(null);

  const filteredData = usageData.filter(record =>
    record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewHistory = (record: UsageRecord) => {
    setSelectedCustomer(record);
    setIsHistoryDialogOpen(true);
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

      {/* 查询历史弹窗 */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              查询历史 - {selectedCustomer?.customerName}
              <span className="text-sm font-normal text-slate-400 ml-2">
                (共 {selectedCustomer?.queryCount} 次查询)
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {MOCK_HISTORY_DATA.map((history, index) => (
                <div key={history.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          查询 #{MOCK_HISTORY_DATA.length - index}
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
                          <p className="text-sm text-slate-600 line-clamp-3">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
