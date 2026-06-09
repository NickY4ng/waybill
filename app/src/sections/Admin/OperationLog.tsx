import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Calendar, FileText } from 'lucide-react';

type LogModule = '账号管理' | '数据查询' | '模板管理' | '数据下载' | '系统配置' | '登录认证';
type LogAction = '创建' | '编辑' | '删除' | '查看' | '下载' | '登录' | '退出' | '重置密码' | '导出' | '点击';

interface OperationLog {
  id: string;
  operator: string;
  phone: string;
  module: LogModule;
  action: LogAction;
  detail: string;
  ip: string;
  result: '成功' | '失败';
  time: string;
}

const MOCK_LOGS: OperationLog[] = [
  { id: '1', operator: '管理员', phone: '15934553044', module: '登录认证', action: '登录', detail: '管理员登录后台系统', ip: '192.168.1.100', result: '成功', time: '2026-05-15 08:30:15' },
  { id: '2', operator: '管理员', phone: '15934553044', module: '账号管理', action: '创建', detail: '新建账号：深圳供应链公司', ip: '192.168.1.100', result: '成功', time: '2026-05-15 09:12:30' },
  { id: '3', operator: '管理员', phone: '15934553044', module: '账号管理', action: '编辑', detail: '编辑账号信息：北京物流有限公司（修改有效期）', ip: '192.168.1.100', result: '成功', time: '2026-05-15 09:45:22' },
  { id: '4', operator: '张运营', phone: '18601946029', module: '账号管理', action: '重置密码', detail: '重置密码：上海运输集团', ip: '192.168.1.101', result: '成功', time: '2026-05-15 10:20:05' },
  { id: '5', operator: '张运营', phone: '18601946029', module: '数据查询', action: '查看', detail: '查询运单数据：区域=北京，时间范围2026-04-01~2026-05-15', ip: '192.168.1.101', result: '成功', time: '2026-05-15 10:35:18' },
  { id: '6', operator: '管理员', phone: '15934553044', module: '模板管理', action: '编辑', detail: '修改模板"新增车辆统计"的SQL配置', ip: '192.168.1.100', result: '成功', time: '2026-05-15 11:02:44' },
  { id: '7', operator: '李分析', phone: '13800138001', module: '数据下载', action: '下载', detail: '下载文件：运单数据_20260510_143022.csv（新增车辆统计模板）', ip: '172.17.33.50', result: '成功', time: '2026-05-15 11:30:10' },
  { id: '8', operator: '李分析', phone: '13800138001', module: '数据查询', action: '点击', detail: '点击"深度分析"按钮，触发AI分析报告生成', ip: '172.17.33.50', result: '成功', time: '2026-05-15 11:31:22' },
  { id: '9', operator: '管理员', phone: '15934553044', module: '系统配置', action: '编辑', detail: '修改系统参数：默认查询时间范围从30天改为60天', ip: '192.168.1.100', result: '成功', time: '2026-05-15 13:15:08' },
  { id: '10', operator: '张运营', phone: '18601946029', module: '账号管理', action: '创建', detail: '新建账号：杭州电商物流', ip: '192.168.1.101', result: '失败', time: '2026-05-15 14:05:33' },
  { id: '11', operator: '王经理', phone: '13800138002', module: '登录认证', action: '登录', detail: '用户登录系统', ip: '172.17.33.51', result: '失败', time: '2026-05-15 14:22:10' },
  { id: '12', operator: '王经理', phone: '13800138002', module: '登录认证', action: '登录', detail: '用户登录系统（第二次尝试）', ip: '172.17.33.51', result: '成功', time: '2026-05-15 14:23:01' },
  { id: '13', operator: '管理员', phone: '15934553044', module: '模板管理', action: '创建', detail: '创建新模板"月度运费报表"', ip: '192.168.1.100', result: '成功', time: '2026-05-15 14:50:45' },
  { id: '14', operator: '张运营', phone: '18601946029', module: '数据下载', action: '导出', detail: '导出消耗次数统计报表（2026年4月）', ip: '192.168.1.101', result: '成功', time: '2026-05-15 15:10:20' },
  { id: '15', operator: '李分析', phone: '13800138001', module: '数据查询', action: '查看', detail: '查看全国货物流向分析报告', ip: '172.17.33.50', result: '成功', time: '2026-05-15 15:30:00' },
  { id: '16', operator: '管理员', phone: '15934553044', module: '账号管理', action: '删除', detail: '删除账号：旧测试账号（已过期3个月）', ip: '192.168.1.100', result: '成功', time: '2026-05-15 16:00:55' },
  { id: '17', operator: '张运营', phone: '18601946029', module: '系统配置', action: '查看', detail: '查看系统操作日志', ip: '192.168.1.101', result: '成功', time: '2026-05-15 16:10:30' },
  { id: '18', operator: '管理员', phone: '15934553044', module: '登录认证', action: '退出', detail: '管理员退出登录', ip: '192.168.1.100', result: '成功', time: '2026-05-15 17:30:00' },
  { id: '19', operator: '管理员', phone: '15934553044', module: '登录认证', action: '登录', detail: '管理员登录后台系统', ip: '192.168.1.100', result: '成功', time: '2026-05-16 08:25:10' },
  { id: '20', operator: '管理员', phone: '15934553044', module: '模板管理', action: '编辑', detail: '修改模板"迁出统计"的数据权限范围', ip: '192.168.1.100', result: '成功', time: '2026-05-16 08:40:22' },
  { id: '21', operator: '张运营', phone: '18601946029', module: '数据下载', action: '下载', detail: '下载文件：煤炭运输数据_20260508_163022.csv', ip: '192.168.1.101', result: '成功', time: '2026-05-16 09:15:08' },
  { id: '22', operator: '李分析', phone: '13800138001', module: '数据查询', action: '点击', detail: '点击"一键分析"按钮，查询上月运单汇总', ip: '172.17.33.50', result: '成功', time: '2026-05-16 09:30:45' },
  { id: '23', operator: '管理员', phone: '15934553044', module: '系统配置', action: '编辑', detail: '修改邮件通知配置：开通到期提醒邮件', ip: '192.168.1.100', result: '失败', time: '2026-05-16 10:00:12' },
  { id: '24', operator: '管理员', phone: '15934553044', module: '系统配置', action: '编辑', detail: '修改邮件通知配置：开通到期提醒邮件（重试）', ip: '192.168.1.100', result: '成功', time: '2026-05-16 10:02:35' },
  { id: '25', operator: '张运营', phone: '18601946029', module: '账号管理', action: '查看', detail: '查看广州货运公司账号详情', ip: '192.168.1.101', result: '成功', time: '2026-05-16 10:30:00' },
];

export function OperationLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-05');
  const [selectedModule, setSelectedModule] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredLogs = MOCK_LOGS.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.phone.includes(searchQuery);
    const matchesDate = log.time.startsWith(selectedDate);
    const matchesModule = selectedModule === '全部' || log.module === selectedModule;
    return matchesSearch && matchesDate && matchesModule;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modules: string[] = ['全部', '账号管理', '数据查询', '模板管理', '数据下载', '系统配置', '登录认证'];
  const actions: LogAction[] = ['创建', '编辑', '删除', '查看', '下载', '登录', '退出', '重置密码', '导出', '点击'];

  const getActionBadge = (action: LogAction) => {
    const colorMap: Record<LogAction, string> = {
      '创建': 'bg-green-100 text-green-700',
      '编辑': 'bg-blue-100 text-blue-700',
      '删除': 'bg-red-100 text-red-700',
      '查看': 'bg-slate-100 text-slate-600',
      '下载': 'bg-cyan-100 text-cyan-700',
      '登录': 'bg-indigo-100 text-indigo-700',
      '退出': 'bg-slate-100 text-slate-500',
      '重置密码': 'bg-orange-100 text-orange-700',
      '导出': 'bg-purple-100 text-purple-700',
      '点击': 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${colorMap[action]}`}>
        {action}
      </span>
    );
  };

  const getResultBadge = (result: '成功' | '失败') => {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
        result === '成功' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {result}
      </span>
    );
  };

  const handleFilterChange = (module: string) => {
    setSelectedModule(module);
    setCurrentPage(1);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索操作人、手机号或操作详情"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026-05">2026年5月</option>
                <option value="2026-04">2026年4月</option>
                <option value="2026-03">2026年3月</option>
                <option value="2026-02">2026年2月</option>
                <option value="2026-01">2026年1月</option>
              </select>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {modules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleFilterChange(mod)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedModule === mod
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">操作时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>所属模块</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead className="min-w-60">操作详情</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-slate-600 font-mono whitespace-nowrap">{log.time}</TableCell>
                  <TableCell className="font-medium">{log.operator}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{log.phone}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {log.module}
                    </span>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs truncate" title={log.detail}>{log.detail}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{log.ip}</TableCell>
                  <TableCell>{getResultBadge(log.result)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无操作日志</p>
            </div>
          )}

          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                共 {filteredLogs.length} 条日志，第 {currentPage}/{totalPages} 页
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
