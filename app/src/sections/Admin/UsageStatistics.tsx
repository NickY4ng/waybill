import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Calendar } from 'lucide-react';

interface UsageRecord {
  id: string;
  accountId: string;
  cid: string;
  customerName: string;
  phone: string;
  month: string;
  queryCount: number;
  lastQueryTime: string;
}

const MOCK_USAGE_DATA: UsageRecord[] = [
  // 2026年4月数据
  { id: '1', accountId: 'DKYY_20250401_001', cid: 'AP001', customerName: '北京物流有限公司', phone: '13800138001', month: '202604', queryCount: 1250, lastQueryTime: '2026-04-15 18:30:00' },
  { id: '2', accountId: 'DKYY_20250401_002', cid: 'AP002', customerName: '上海运输集团', phone: '13800138002', month: '202604', queryCount: 980, lastQueryTime: '2026-04-15 16:45:00' },
  { id: '3', accountId: 'DKYY_20250401_003', cid: '', customerName: '广州供应链公司', phone: '13800138003', month: '202604', queryCount: 650, lastQueryTime: '2026-04-14 14:20:00' },
  { id: '4', accountId: 'DKYY_20250401_004', cid: 'AP004', customerName: '深圳货运代理', phone: '13800138004', month: '202604', queryCount: 420, lastQueryTime: '2026-04-13 11:30:00' },
  { id: '5', accountId: 'DKYY_20250401_005', cid: 'AP005', customerName: '天津港口物流', phone: '13800138005', month: '202604', queryCount: 380, lastQueryTime: '2026-04-12 09:15:00' },
  { id: '6', accountId: 'DKYY_20250401_006', cid: 'AP006', customerName: '重庆西部物流', phone: '13800138006', month: '202604', queryCount: 290, lastQueryTime: '2026-04-10 15:45:00' },
  { id: '7', accountId: 'DKYY_20250401_007', cid: 'AP007', customerName: '武汉长江物流', phone: '13800138007', month: '202604', queryCount: 560, lastQueryTime: '2026-04-15 12:30:00' },
  { id: '8', accountId: 'DKYY_20250401_008', cid: 'AP008', customerName: '南京货运公司', phone: '13800138008', month: '202604', queryCount: 720, lastQueryTime: '2026-04-14 10:20:00' },
  { id: '9', accountId: 'DKYY_20250401_009', cid: '', customerName: '杭州电商物流', phone: '13800138009', month: '202604', queryCount: 890, lastQueryTime: '2026-04-13 16:45:00' },
  { id: '10', accountId: 'DKYY_20250401_010', cid: 'AP010', customerName: '成都西南运输', phone: '13800138010', month: '202604', queryCount: 340, lastQueryTime: '2026-04-12 14:15:00' },
  { id: '11', accountId: 'DKYY_20250401_011', cid: 'AP011', customerName: '西安丝路物流', phone: '13800138011', month: '202604', queryCount: 480, lastQueryTime: '2026-04-11 11:30:00' },
  { id: '12', accountId: 'DKYY_20250401_012', cid: '', customerName: '青岛港务集团', phone: '13800138012', month: '202604', queryCount: 620, lastQueryTime: '2026-04-10 09:45:00' },
  
  // 2026年3月数据
  { id: '13', accountId: 'DKYY_20250401_001', cid: 'AP001', customerName: '北京物流有限公司', phone: '13800138001', month: '202603', queryCount: 1180, lastQueryTime: '2026-03-31 17:20:00' },
  { id: '14', accountId: 'DKYY_20250401_002', cid: 'AP002', customerName: '上海运输集团', phone: '13800138002', month: '202603', queryCount: 920, lastQueryTime: '2026-03-30 14:10:00' },
  { id: '15', accountId: 'DKYY_20250401_003', cid: '', customerName: '广州供应链公司', phone: '13800138003', month: '202603', queryCount: 580, lastQueryTime: '2026-03-29 16:30:00' },
  { id: '16', accountId: 'DKYY_20250401_004', cid: 'AP004', customerName: '深圳货运代理', phone: '13800138004', month: '202603', queryCount: 390, lastQueryTime: '2026-03-28 13:20:00' },
  { id: '17', accountId: 'DKYY_20250401_005', cid: 'AP005', customerName: '天津港口物流', phone: '13800138005', month: '202603', queryCount: 350, lastQueryTime: '2026-03-27 10:15:00' },
  { id: '18', accountId: 'DKYY_20250401_006', cid: 'AP006', customerName: '重庆西部物流', phone: '13800138006', month: '202603', queryCount: 260, lastQueryTime: '2026-03-26 15:40:00' },
  { id: '19', accountId: 'DKYY_20250401_007', cid: 'AP007', customerName: '武汉长江物流', phone: '13800138007', month: '202603', queryCount: 520, lastQueryTime: '2026-03-25 11:25:00' },
  { id: '20', accountId: 'DKYY_20250401_008', cid: 'AP008', customerName: '南京货运公司', phone: '13800138008', month: '202603', queryCount: 680, lastQueryTime: '2026-03-24 09:50:00' },
  
  // 2026年2月数据
  { id: '21', accountId: 'DKYY_20250401_001', cid: 'AP001', customerName: '北京物流有限公司', phone: '13800138001', month: '202602', queryCount: 980, lastQueryTime: '2026-02-28 16:30:00' },
  { id: '22', accountId: 'DKYY_20250401_002', cid: 'AP002', customerName: '上海运输集团', phone: '13800138002', month: '202602', queryCount: 850, lastQueryTime: '2026-02-27 14:20:00' },
  { id: '23', accountId: 'DKYY_20250401_003', cid: '', customerName: '广州供应链公司', phone: '13800138003', month: '202602', queryCount: 520, lastQueryTime: '2026-02-26 11:10:00' },
  { id: '24', accountId: 'DKYY_20250401_004', cid: 'AP004', customerName: '深圳货运代理', phone: '13800138004', month: '202602', queryCount: 340, lastQueryTime: '2026-02-25 10:05:00' },
  
  // 2026年1月数据
  { id: '25', accountId: 'DKYY_20250401_001', cid: 'AP001', customerName: '北京物流有限公司', phone: '13800138001', month: '202601', queryCount: 1100, lastQueryTime: '2026-01-31 15:45:00' },
  { id: '26', accountId: 'DKYY_20250401_002', cid: 'AP002', customerName: '上海运输集团', phone: '13800138002', month: '202601', queryCount: 920, lastQueryTime: '2026-01-30 13:30:00' },
  { id: '27', accountId: 'DKYY_20250401_003', cid: '', customerName: '广州供应链公司', phone: '13800138003', month: '202601', queryCount: 580, lastQueryTime: '2026-01-29 11:20:00' },
  { id: '28', accountId: 'DKYY_20250401_004', cid: 'AP004', customerName: '深圳货运代理', phone: '13800138004', month: '202601', queryCount: 380, lastQueryTime: '2026-01-28 09:15:00' },
  { id: '29', accountId: 'DKYY_20250401_005', cid: 'AP005', customerName: '天津港口物流', phone: '13800138005', month: '202601', queryCount: 320, lastQueryTime: '2026-01-27 16:40:00' },
  { id: '30', accountId: 'DKYY_20250401_006', cid: 'AP006', customerName: '重庆西部物流', phone: '13800138006', month: '202601', queryCount: 240, lastQueryTime: '2026-01-26 14:25:00' },
];

// 生成月份选项
const generateMonthOptions = () => {
  const options = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    options.push(`${year}${month}`);
  }
  return options;
};

const MONTH_OPTIONS = generateMonthOptions();

export function UsageStatistics() {
  const [usageData] = useState<UsageRecord[]>(MOCK_USAGE_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]);

  // 按月份筛选
  const monthFilteredData = usageData.filter(record => record.month === selectedMonth);
  
  // 再按搜索词筛选
  const filteredData = monthFilteredData.filter(record =>
    record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    alert('导出功能开发中，将生成Excel文件');
  };

  // 格式化月份显示
  const formatMonth = (monthStr: string) => {
    const year = monthStr.slice(0, 4);
    const month = monthStr.slice(4, 6);
    return `${year}年${month}月`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">消耗次数统计</h1>
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户名称或手机号"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40 p-2 border border-slate-200 rounded-lg"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              当前统计月份：<span className="font-semibold">{formatMonth(selectedMonth)}</span>
              <span className="ml-4">共 {filteredData.length} 个账号</span>
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号ID</TableHead>
                <TableHead>关联CID</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>月度</TableHead>
                <TableHead>月度总提问次数</TableHead>
                <TableHead>最后提问时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{record.accountId}</TableCell>
                  <TableCell>{record.cid || '-'}</TableCell>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>{record.phone}</TableCell>
                  <TableCell>{formatMonth(record.month)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {record.queryCount} 次
                    </span>
                  </TableCell>
                  <TableCell>{record.lastQueryTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
