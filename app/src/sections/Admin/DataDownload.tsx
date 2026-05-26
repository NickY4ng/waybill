import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Calendar, Eye, EyeOff } from 'lucide-react';

interface DownloadRecord {
  id: string;
  accountId: string;
  cid: string;
  customerName: string;
  phone: string;
  fileName: string;
  template: string;
  downloadTime: string;
}

const MOCK_DOWNLOAD_RECORDS: DownloadRecord[] = [
  {
    id: '1',
    accountId: 'ACC001',
    cid: 'CID001',
    customerName: '诚实实业集团',
    phone: '138****8001',
    fileName: '运单数据_20260510_143022.csv',
    template: '新增车辆统计',
    downloadTime: '2026-05-10 14:30:22',
  },
  {
    id: '2',
    accountId: 'ACC002',
    cid: 'CID002',
    customerName: '北京物流公司',
    phone: '139****8002',
    fileName: '北京到河北运单_20260509_100515.csv',
    template: '保有量统计',
    downloadTime: '2026-05-09 10:05:15',
  },
  {
    id: '3',
    accountId: 'ACC003',
    cid: 'CID003',
    customerName: '上海运输公司',
    phone: '136****8003',
    fileName: '煤炭运输数据_20260508_163022.csv',
    template: '迁出统计',
    downloadTime: '2026-05-08 16:30:22',
  },
  {
    id: '4',
    accountId: 'ACC001',
    cid: 'CID001',
    customerName: '诚实实业集团',
    phone: '138****8001',
    fileName: '2024年10月数据_20260507_093022.csv',
    template: '新增车辆统计',
    downloadTime: '2026-05-07 09:30:22',
  },
  {
    id: '5',
    accountId: 'ACC004',
    cid: 'CID004',
    customerName: '广州货运公司',
    phone: '135****8004',
    fileName: '运单数据_20260506_113022.csv',
    template: '保有量统计',
    downloadTime: '2026-05-06 11:30:22',
  },
];

export function DataDownload() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [downloadData] = useState<DownloadRecord[]>(MOCK_DOWNLOAD_RECORDS);

  // 筛选数据
  const filteredData = downloadData.filter((record) => {
    const matchesSearch =
      !searchQuery ||
      record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.phone.includes(searchQuery);
    const matchesMonth = record.downloadTime.startsWith(selectedMonth);
    return matchesSearch && matchesMonth;
  });

  // 处理导出
  const handleExport = () => {
    const exportData = searchQuery ? filteredData : downloadData;
    const exportInfo = searchQuery
      ? `按搜索条件导出：${searchQuery}，共 ${exportData.length} 条记录`
      : `导出全部数据：共 ${exportData.length} 条记录`;
    alert(`${exportInfo}\n\n导出功能开发中，将生成Excel文件`);
  };

  // 解密手机号
  const maskPhone = (phone: string) => {
    if (phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  };

  // 切换手机号显示
  const [decryptedPhones, setDecryptedPhones] = useState<Set<string>>(new Set());

  const togglePhoneDecrypt = (id: string) => {
    const newDecrypted = new Set(decryptedPhones);
    if (newDecrypted.has(id)) {
      newDecrypted.delete(id);
    } else {
      newDecrypted.add(id);
    }
    setDecryptedPhones(newDecrypted);
  };

  // 显示手机号
  const displayPhone = (record: DownloadRecord) => {
    if (decryptedPhones.has(record.id)) {
      return record.phone;
    }
    return maskPhone(record.phone);
  };

  // 生成模拟CSV数据
  const generateMockCsvData = (_record: DownloadRecord): string => {
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

  // 处理文件下载
  const handleFileDownload = (record: DownloadRecord) => {
    const csvData = generateMockCsvData(record);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 筛选条件 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户名称或手机号..."
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
          {/* 数据表格 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号ID</TableHead>
                <TableHead>关联CID</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>下载文件名称</TableHead>
                <TableHead>对应模板</TableHead>
                <TableHead>下载时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{record.accountId}</TableCell>
                  <TableCell>{record.cid || '-'}</TableCell>
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
                  <TableCell>
                    <button
                      onClick={() => handleFileDownload(record)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {record.fileName}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {record.template}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{record.downloadTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 空状态 */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无下载记录</p>
            </div>
          )}

          {/* 分页 */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                共 {filteredData.length} 条记录
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
                <span className="text-sm text-slate-600">第 1 页</span>
                <Button variant="outline" size="sm" disabled>
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
