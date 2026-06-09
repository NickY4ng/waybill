import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Calendar, Eye, EyeOff, FileText } from 'lucide-react';

type TemplateCategory = '数据分析' | '数据下载' | '其他';

interface TemplateUsageRecord {
  id: string;
  accountId: string;
  cid: string;
  customerName: string;
  phone: string;
  template: string;
  category: TemplateCategory;
  useTime: string;
  fileName?: string;
  downloadTime?: string;
}

const MOCK_RECORDS: TemplateUsageRecord[] = [
  {
    id: '1',
    accountId: 'ACC001',
    cid: 'CID001',
    customerName: '诚实实业集团',
    phone: '13800138001',
    template: '新增车辆统计',
    category: '数据分析',
    useTime: '2026-05-10 14:20:00',
    fileName: '运单数据_20260510_143022.csv',
    downloadTime: '2026-05-10 14:30:22',
  },
  {
    id: '2',
    accountId: 'ACC002',
    cid: 'CID002',
    customerName: '北京物流公司',
    phone: '13900139002',
    template: '保有量统计',
    category: '数据分析',
    useTime: '2026-05-09 09:50:00',
    fileName: '北京到河北运单_20260509_100515.csv',
    downloadTime: '2026-05-09 10:05:15',
  },
  {
    id: '3',
    accountId: 'ACC003',
    cid: 'CID003',
    customerName: '上海运输公司',
    phone: '13600136003',
    template: '迁出统计',
    category: '数据分析',
    useTime: '2026-05-08 16:00:00',
    fileName: '煤炭运输数据_20260508_163022.csv',
    downloadTime: '2026-05-08 16:30:22',
  },
  {
    id: '4',
    accountId: 'ACC001',
    cid: 'CID001',
    customerName: '诚实实业集团',
    phone: '13800138001',
    template: '全国货物流向',
    category: '数据下载',
    useTime: '2026-05-07 09:00:00',
    fileName: '2024年10月数据_20260507_093022.csv',
    downloadTime: '2026-05-07 09:30:22',
  },
  {
    id: '5',
    accountId: 'ACC004',
    cid: 'CID004',
    customerName: '广州货运公司',
    phone: '13500135004',
    template: '运单数据导出',
    category: '数据下载',
    useTime: '2026-05-06 11:00:00',
    fileName: '运单数据_20260506_113022.csv',
    downloadTime: '2026-05-06 11:30:22',
  },
  {
    id: '6',
    accountId: 'ACC005',
    cid: 'CID005',
    customerName: '深圳供应链公司',
    phone: '13700137005',
    template: '运输效率分析',
    category: '数据分析',
    useTime: '2026-05-05 15:30:00',
    // 使用了模板但未触发下载
  },
  {
    id: '7',
    accountId: 'ACC002',
    cid: 'CID002',
    customerName: '北京物流公司',
    phone: '13900139002',
    template: '客户对账清单',
    category: '其他',
    useTime: '2026-05-04 08:45:00',
    // 仅查看，未下载
  },
  {
    id: '8',
    accountId: 'ACC006',
    cid: 'CID006',
    customerName: '天津港口物流',
    phone: '13800138006',
    template: '货物类型分布',
    category: '数据分析',
    useTime: '2026-05-03 10:20:00',
    fileName: '货物类型统计_20260503_145022.csv',
    downloadTime: '2026-05-03 14:50:22',
  },
  {
    id: '9',
    accountId: 'ACC003',
    cid: 'CID003',
    customerName: '上海运输公司',
    phone: '13600136003',
    template: '月度运费报表',
    category: '其他',
    useTime: '2026-05-02 13:00:00',
    // 仅在线查看，未导出
  },
  {
    id: '10',
    accountId: 'ACC007',
    cid: 'CID007',
    customerName: '重庆西部物流',
    phone: '13500135007',
    template: '路线优化建议',
    category: '数据分析',
    useTime: '2026-05-01 09:30:00',
  },
  {
    id: '11',
    accountId: 'ACC001',
    cid: 'CID001',
    customerName: '诚实实业集团',
    phone: '13800138001',
    template: '线路热力分析',
    category: '数据分析',
    useTime: '2026-04-28 14:00:00',
    fileName: '线路热力_20260428_160022.csv',
    downloadTime: '2026-04-28 16:00:22',
  },
  {
    id: '12',
    accountId: 'ACC008',
    cid: 'CID008',
    customerName: '杭州电商物流',
    phone: '13900139008',
    template: '发货量统计',
    category: '数据下载',
    useTime: '2026-04-25 10:15:00',
  },
];

export function DataDownload() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [records] = useState<TemplateUsageRecord[]>(MOCK_RECORDS);
  const [decryptedPhones, setDecryptedPhones] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchQuery ||
      record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.phone.includes(searchQuery) ||
      record.template.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = record.useTime.startsWith(selectedMonth);
    return matchesSearch && matchesMonth;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCategoryBadge = (category: TemplateCategory) => {
    const styles: Record<TemplateCategory, string> = {
      '数据分析': 'bg-blue-100 text-blue-700',
      '数据下载': 'bg-green-100 text-green-700',
      '其他': 'bg-slate-100 text-slate-600',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${styles[category]}`}>
        {category}
      </span>
    );
  };

  const maskPhone = (phone: string) => {
    if (phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  };

  const togglePhoneDecrypt = (id: string) => {
    setDecryptedPhones(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const displayPhone = (record: TemplateUsageRecord) => {
    return decryptedPhones.has(record.id) ? record.phone : maskPhone(record.phone);
  };

  // 生成模拟CSV数据
  const generateMockCsvData = (_record: TemplateUsageRecord): string => {
    const headers = ['运单号', '出发地', '目的地', '货物类型', '重量(吨)', '发货时间', '到达时间', '运费(元)'];
    const cities = ['北京', '上海', '广州', '深圳', '天津', '重庆', '武汉', '南京', '杭州', '成都'];
    const cargoTypes = ['电子产品', '服装', '食品', '建材', '化工', '家具', '机械设备'];

    let csv = headers.join(',') + '\n';
    const rowCount = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < rowCount; i++) {
      const fromCity = cities[Math.floor(Math.random() * cities.length)];
      let toCity = cities[Math.floor(Math.random() * cities.length)];
      while (toCity === fromCity) {
        toCity = cities[Math.floor(Math.random() * cities.length)];
      }

      const waybillNo = 'YD' + String(Date.now()).slice(-8) + String(i).padStart(4, '0');
      const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
      const weight = (Math.random() * 30 + 1).toFixed(2);
      const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const freight = Math.floor(Math.random() * 5000 + 500);

      csv += `${waybillNo},${fromCity},${toCity},${cargoType},${weight},${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]},${freight}\n`;
    }

    return csv;
  };

  const handleFileDownload = (record: TemplateUsageRecord) => {
    if (!record.fileName) return;
    const csvData = generateMockCsvData(record);
    const blob = new Blob(['﻿' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const exportData = searchQuery ? filteredRecords : records;
    alert(`导出模板使用记录：共 ${exportData.length} 条\n\n导出功能开发中，将生成Excel文件`);
  };

  // 切换月份时重置分页
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户名称、手机号或模板名称"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026-05">2026年5月</option>
                <option value="2026-04">2026年4月</option>
                <option value="2026-03">2026年3月</option>
                <option value="2026-02">2026年2月</option>
                <option value="2026-01">2026年1月</option>
              </select>
            </div>
            <div className="flex-1" />
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户名称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>模板分类</TableHead>
                <TableHead>模板名称</TableHead>
                <TableHead>使用时间</TableHead>
                <TableHead>下载文件名称</TableHead>
                <TableHead>下载时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{displayPhone(record)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePhoneDecrypt(record.id)}
                      >
                        {decryptedPhones.has(record.id) ? (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(record.category)}</TableCell>
                  <TableCell className="font-medium">{record.template}</TableCell>
                  <TableCell className="text-sm text-slate-600">{record.useTime}</TableCell>
                  <TableCell>
                    {record.fileName ? (
                      <button
                        onClick={() => handleFileDownload(record)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {record.fileName}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {record.downloadTime || <span className="text-slate-400">-</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无模板使用记录</p>
            </div>
          )}

          {filteredRecords.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                共 {filteredRecords.length} 条记录，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  上一页
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={page === currentPage ? 'bg-blue-500 text-white' : ''}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
