import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Key, Settings, CheckCircle, XCircle, Eye, EyeOff, Mail, RefreshCw, Loader2 } from 'lucide-react';

// SQL验证函数
function validateSql(sql: string): { valid: boolean; message: string } {
  if (!sql || sql.trim() === '') {
    return { valid: true, message: '使用默认权限' };
  }

  const trimmedSql = sql.trim().toUpperCase();

  // 检查是否以SELECT开头
  if (!trimmedSql.startsWith('SELECT')) {
    return { valid: false, message: 'SQL必须以SELECT开头' };
  }

  // 检查是否包含危险操作
  const dangerousKeywords = ['DELETE', 'DROP', 'TRUNCATE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
  for (const keyword of dangerousKeywords) {
    if (trimmedSql.includes(keyword)) {
      return { valid: false, message: `SQL不能包含${keyword}操作` };
    }
  }

  // 检查基本语法
  if (!trimmedSql.includes('FROM')) {
    return { valid: false, message: 'SQL缺少FROM关键字' };
  }

  // 检查引号是否成对
  const singleQuotes = (sql.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    return { valid: false, message: '单引号未闭合' };
  }

  const doubleQuotes = (sql.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) {
    return { valid: false, message: '双引号未闭合' };
  }

  return { valid: true, message: 'SQL格式正确' };
}

type AccountStatus = '正常' | '过期' | '禁用';

interface Account {
  id: string;
  accountId: string;
  cid: string;
  customerName: string;
  phone: string;
  email: string;
  status: AccountStatus;
  validStartDate: string;
  validEndDate: string;
  createdAt: string;
  createdBy: string;
  permissionSql: string;
}

type EmailType = '账号开通邮件' | '账号重置邮件' | '账号即将到期邮件' | '账号到期邮件';
type EmailStatus = '发送成功' | '发送失败';

interface EmailLog {
  id: string;
  accountId: string;
  type: EmailType;
  sendTime: string;
  status: EmailStatus;
}

const MOCK_EMAIL_LOGS: EmailLog[] = [
  { id: 'e1', accountId: '1', type: '账号开通邮件', sendTime: '2025-06-01 09:30:15', status: '发送成功' },
  { id: 'e2', accountId: '1', type: '账号重置邮件', sendTime: '2025-06-03 14:22:08', status: '发送失败' },
  { id: 'e3', accountId: '1', type: '账号即将到期邮件', sendTime: '2025-06-05 10:00:00', status: '发送成功' },
  { id: 'e4', accountId: '1', type: '账号到期邮件', sendTime: '2025-05-20 08:15:30', status: '发送成功' },
  { id: 'e5', accountId: '1', type: '账号重置邮件', sendTime: '2025-06-07 16:45:22', status: '发送失败' },
  { id: 'e6', accountId: '1', type: '账号开通邮件', sendTime: '2025-04-10 11:20:00', status: '发送成功' },
  { id: 'e7', accountId: '1', type: '账号即将到期邮件', sendTime: '2025-04-15 09:00:00', status: '发送成功' },
  { id: 'e8', accountId: '1', type: '账号到期邮件', sendTime: '2025-03-01 13:10:45', status: '发送失败' },
  { id: 'e9', accountId: '1', type: '账号重置邮件', sendTime: '2025-04-02 15:30:00', status: '发送成功' },
  { id: 'e10', accountId: '1', type: '账号开通邮件', sendTime: '2025-02-15 10:00:00', status: '发送成功' },
  { id: 'e11', accountId: '1', type: '账号即将到期邮件', sendTime: '2025-05-28 08:45:00', status: '发送失败' },
  { id: 'e12', accountId: '1', type: '账号到期邮件', sendTime: '2025-01-20 14:00:00', status: '发送成功' },
  { id: 'e13', accountId: '2', type: '账号开通邮件', sendTime: '2025-05-15 09:00:00', status: '发送成功' },
  { id: 'e14', accountId: '2', type: '账号重置邮件', sendTime: '2025-06-02 11:30:00', status: '发送失败' },
  { id: 'e15', accountId: '2', type: '账号即将到期邮件', sendTime: '2025-06-08 10:00:00', status: '发送成功' },
  { id: 'e16', accountId: '3', type: '账号开通邮件', sendTime: '2025-03-10 09:00:00', status: '发送成功' },
  { id: 'e17', accountId: '3', type: '账号到期邮件', sendTime: '2025-06-01 08:00:00', status: '发送失败' },
  { id: 'e18', accountId: '4', type: '账号开通邮件', sendTime: '2024-01-20 10:00:00', status: '发送成功' },
  { id: 'e19', accountId: '4', type: '账号到期邮件', sendTime: '2025-03-31 08:00:00', status: '发送失败' },
  { id: 'e20', accountId: '4', type: '账号重置邮件', sendTime: '2025-02-15 14:30:00', status: '发送成功' },
  { id: 'e21', accountId: '5', type: '账号开通邮件', sendTime: '2025-01-01 09:00:00', status: '发送成功' },
  { id: 'e22', accountId: '5', type: '账号到期邮件', sendTime: '2025-04-15 10:00:00', status: '发送失败' },
  { id: 'e23', accountId: '6', type: '账号开通邮件', sendTime: '2025-02-01 09:00:00', status: '发送成功' },
  { id: 'e24', accountId: '6', type: '账号即将到期邮件', sendTime: '2025-06-01 10:00:00', status: '发送失败' },
  { id: 'e25', accountId: '6', type: '账号重置邮件', sendTime: '2025-05-20 16:00:00', status: '发送成功' },
];

const MOCK_ACCOUNTS: Account[] = [
  { 
    id: '1', 
    accountId: 'DKYY_20250401_001',
    cid: 'AP001', 
    customerName: '北京物流有限公司', 
    phone: '13800138001',
    email: 'beijing@logistics.com',
    status: '正常',
    validStartDate: '2025-01-01',
    validEndDate: '2026-12-31',
    createdAt: '2024-01-15',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data' 
  },
  { 
    id: '2', 
    accountId: 'DKYY_20250401_002',
    cid: 'AP002', 
    customerName: '上海运输集团', 
    phone: '13800138002',
    email: 'shanghai@transport.com',
    status: '正常',
    validStartDate: '2025-01-01',
    validEndDate: '2026-12-31',
    createdAt: '2024-02-20',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data WHERE region = "上海"'
  },
  { 
    id: '3', 
    accountId: 'DKYY_20250401_003',
    cid: '', 
    customerName: '广州供应链公司', 
    phone: '13800138003',
    email: 'guangzhou@supply.com',
    status: '正常',
    validStartDate: '2025-03-01',
    validEndDate: '2025-12-31',
    createdAt: '2024-03-10',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data WHERE region = "广州"' 
  },
  { 
    id: '4', 
    accountId: 'DKYY_20250401_004',
    cid: 'AP004', 
    customerName: '深圳货运代理', 
    phone: '13800138004',
    email: 'shenzhen@cargo.com',
    status: '过期',
    validStartDate: '2024-01-01',
    validEndDate: '2025-03-31',
    createdAt: '2024-01-20',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data WHERE region = "深圳"' 
  },
  { 
    id: '5', 
    accountId: 'DKYY_20250401_005',
    cid: 'AP005', 
    customerName: '天津港口物流', 
    phone: '13800138005',
    email: 'tianjin@port.com',
    status: '禁用',
    validStartDate: '2025-01-01',
    validEndDate: '2026-06-30',
    createdAt: '2024-04-15',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data WHERE region = "天津"' 
  },
  { 
    id: '6', 
    accountId: 'DKYY_20250401_006',
    cid: 'AP006', 
    customerName: '重庆西部物流', 
    phone: '13800138006',
    email: 'chongqing@west.com',
    status: '正常',
    validStartDate: '2025-02-01',
    validEndDate: '2026-02-28',
    createdAt: '2024-05-20',
    createdBy: 'admin',
    permissionSql: 'SELECT * FROM waybill_data WHERE region = "重庆"' 
  },
];

export function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [decryptedPhones, setDecryptedPhones] = useState<Set<string>>(new Set());
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(MOCK_EMAIL_LOGS);
  const [isEmailLogDialogOpen, setIsEmailLogDialogOpen] = useState(false);
  const [emailLogAccount, setEmailLogAccount] = useState<Account | null>(null);
  const [emailLogPage, setEmailLogPage] = useState(1);
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());
  const pageSize = 10;
  
  // 新建账号表单
  const [newAccount, setNewAccount] = useState({
    cid: '',
    customerName: '',
    phone: '',
    email: '',
    validStartDate: '',
    validEndDate: '',
    permissionSql: '',
  });

  // 编辑账号表单
  const [editAccount, setEditAccount] = useState({
    cid: '',
    customerName: '',
    phone: '',
    email: '',
    validStartDate: '',
    validEndDate: '',
    status: '正常' as AccountStatus,
    permissionSql: '',
  });

  const filteredAccounts = accounts.filter(account =>
    account.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateAccountId = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 900 + 100);
    return `DKYY_${date}_${random}`;
  };

  const generateInitialPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateAccount = () => {
    if (!newAccount.customerName || !newAccount.phone || !newAccount.email || !newAccount.validStartDate || !newAccount.validEndDate) {
      alert('请填写完整信息');
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(newAccount.phone)) {
      alert('请输入正确的手机号');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAccount.email)) {
      alert('请输入正确的邮箱地址');
      return;
    }

    // 验证SQL
    const sqlValidation = validateSql(newAccount.permissionSql);
    if (!sqlValidation.valid) {
      alert(`SQL验证失败：${sqlValidation.message}`);
      return;
    }

    const initialPassword = generateInitialPassword();
    const account: Account = {
      id: Date.now().toString(),
      accountId: generateAccountId(),
      cid: newAccount.cid || '',
      customerName: newAccount.customerName,
      phone: newAccount.phone,
      email: newAccount.email,
      status: '正常',
      validStartDate: newAccount.validStartDate,
      validEndDate: newAccount.validEndDate,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'admin',
      permissionSql: newAccount.permissionSql || 'SELECT * FROM waybill_data',
    };

    setAccounts([...accounts, account]);
    setNewAccount({ cid: '', customerName: '', phone: '', email: '', validStartDate: '', validEndDate: '', permissionSql: '' });
    setIsCreateDialogOpen(false);
    alert(`账号创建成功！\n初始密码：${initialPassword}`);
  };

  const handleEditAccount = () => {
    if (!selectedAccount) return;

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(editAccount.phone)) {
      alert('请输入正确的手机号');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editAccount.email)) {
      alert('请输入正确的邮箱地址');
      return;
    }

    // 验证SQL
    const sqlValidation = validateSql(editAccount.permissionSql);
    if (!sqlValidation.valid) {
      alert(`SQL验证失败：${sqlValidation.message}`);
      return;
    }

    setAccounts(accounts.map(acc =>
      acc.id === selectedAccount.id 
        ? { 
            ...acc, 
            cid: editAccount.cid,
            customerName: editAccount.customerName,
            phone: editAccount.phone,
            email: editAccount.email,
            validStartDate: editAccount.validStartDate,
            validEndDate: editAccount.validEndDate,
            status: editAccount.status,
            permissionSql: editAccount.permissionSql,
          } 
        : acc
    ));
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
    alert('账号信息更新成功');
  };

  const handleResetPassword = () => {
    if (!selectedAccount) return;
    const newPassword = generateInitialPassword();
    alert(`账号 ${selectedAccount.customerName} 的密码已重置为：${newPassword}`);
    setIsResetPasswordDialogOpen(false);
    setSelectedAccount(null);
  };

  // 手机号脱敏显示
  const maskPhone = (phone: string) => {
    if (phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  };

  // 切换手机号解密状态
  const togglePhoneDecrypt = (accountId: string) => {
    const newDecrypted = new Set(decryptedPhones);
    if (newDecrypted.has(accountId)) {
      newDecrypted.delete(accountId);
    } else {
      newDecrypted.add(accountId);
    }
    setDecryptedPhones(newDecrypted);
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setEditAccount({
      cid: account.cid,
      customerName: account.customerName,
      phone: account.phone,
      email: account.email,
      validStartDate: account.validStartDate,
      validEndDate: account.validEndDate,
      status: account.status,
      permissionSql: account.permissionSql,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: AccountStatus) => {
    const statusStyles = {
      '正常': 'bg-green-100 text-green-700',
      '过期': 'bg-yellow-100 text-yellow-700',
      '禁用': 'bg-gray-100 text-gray-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  const openEmailLogDialog = (account: Account) => {
    setEmailLogAccount(account);
    setEmailLogPage(1);
    setIsEmailLogDialogOpen(true);
  };

  const handleResendEmail = async (log: EmailLog) => {
    setResendingIds(prev => new Set(prev).add(log.id));

    // 模拟发送：随机 1.5~3 秒延迟，70% 成功率
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    const success = Math.random() < 0.7;

    setEmailLogs(prev => prev.map(item =>
      item.id === log.id ? { ...item, status: success ? '发送成功' as EmailStatus : '发送失败' as EmailStatus } : item
    ));
    setResendingIds(prev => {
      const next = new Set(prev);
      next.delete(log.id);
      return next;
    });
  };

  const getEmailTypeBadge = (type: EmailType) => {
    const typeStyles: Record<EmailType, string> = {
      '账号开通邮件': 'bg-blue-100 text-blue-700',
      '账号重置邮件': 'bg-purple-100 text-purple-700',
      '账号即将到期邮件': 'bg-orange-100 text-orange-700',
      '账号到期邮件': 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${typeStyles[type]}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">账号管理</h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建账号
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户名称或手机号"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作</TableHead>
                <TableHead>账号ID</TableHead>
                <TableHead>关联CID</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>有效期开始</TableHead>
                <TableHead>有效期结束</TableHead>
                <TableHead>创建人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsResetPasswordDialogOpen(true);
                        }}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        重置密码
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEmailLogDialog(account)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        邮件发送
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{account.accountId}</TableCell>
                  <TableCell>{account.cid || '-'}</TableCell>
                  <TableCell>{account.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{decryptedPhones.has(account.id) ? account.phone : maskPhone(account.phone)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePhoneDecrypt(account.id)}
                      >
                        {decryptedPhones.has(account.id) ? (
                          <EyeOff className="w-3 h-3 text-slate-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>{account.validStartDate}</TableCell>
                  <TableCell>{account.validEndDate}</TableCell>
                  <TableCell>{account.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建账号对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建账号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">关联CID <span className="text-slate-400">(非必填)</span></label>
              <Input
                placeholder="请输入关联CID"
                value={newAccount.cid}
                onChange={(e) => setNewAccount({ ...newAccount, cid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">客户名称 <span className="text-red-500">*</span></label>
              <Input
                placeholder="请输入客户名称"
                value={newAccount.customerName}
                onChange={(e) => setNewAccount({ ...newAccount, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号 <span className="text-red-500">*</span></label>
              <Input
                placeholder="请输入手机号"
                value={newAccount.phone}
                onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
              />
              <p className="text-xs text-slate-400">手机号将作为登录账号</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱 <span className="text-red-500">*</span></label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">有效期开始 <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={newAccount.validStartDate}
                  onChange={(e) => setNewAccount({ ...newAccount, validStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">有效期结束 <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={newAccount.validEndDate}
                  onChange={(e) => setNewAccount({ ...newAccount, validEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据权限SQL配置</label>
              <textarea
                placeholder="例如：SELECT * FROM waybill_data WHERE region = '北京'"
                value={newAccount.permissionSql}
                onChange={(e) => setNewAccount({ ...newAccount, permissionSql: e.target.value })}
                className={`w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${
                  newAccount.permissionSql && !validateSql(newAccount.permissionSql).valid
                    ? 'border-red-300 bg-red-50'
                    : newAccount.permissionSql && validateSql(newAccount.permissionSql).valid
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200'
                }`}
              />
              {newAccount.permissionSql && (
                <div className={`flex items-center gap-1 text-xs ${
                  validateSql(newAccount.permissionSql).valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validateSql(newAccount.permissionSql).valid ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>{validateSql(newAccount.permissionSql).message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>{validateSql(newAccount.permissionSql).message}</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400">输入SQL查询语句来定义该账号的数据访问权限</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateAccount} className="bg-gradient-to-r from-blue-500 to-cyan-500">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑账号对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑账号 - {selectedAccount?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">关联CID</label>
              <Input
                placeholder="请输入关联CID"
                value={editAccount.cid}
                onChange={(e) => setEditAccount({ ...editAccount, cid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">客户名称 <span className="text-red-500">*</span></label>
              <Input
                placeholder="请输入客户名称"
                value={editAccount.customerName}
                onChange={(e) => setEditAccount({ ...editAccount, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号 <span className="text-red-500">*</span></label>
              <Input
                placeholder="请输入手机号"
                value={editAccount.phone}
                onChange={(e) => setEditAccount({ ...editAccount, phone: e.target.value })}
              />
              <p className="text-xs text-slate-400">手机号将作为登录账号</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱 <span className="text-red-500">*</span></label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={editAccount.email}
                onChange={(e) => setEditAccount({ ...editAccount, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">有效期开始</label>
                <Input
                  type="date"
                  value={editAccount.validStartDate}
                  onChange={(e) => setEditAccount({ ...editAccount, validStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">有效期结束</label>
                <Input
                  type="date"
                  value={editAccount.validEndDate}
                  onChange={(e) => setEditAccount({ ...editAccount, validEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">账号状态</label>
              <select
                value={editAccount.status}
                onChange={(e) => setEditAccount({ ...editAccount, status: e.target.value as AccountStatus })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="正常">正常</option>
                <option value="禁用">禁用</option>
                <option value="过期">过期</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数据权限SQL配置</label>
              <textarea
                value={editAccount.permissionSql}
                onChange={(e) => setEditAccount({ ...editAccount, permissionSql: e.target.value })}
                placeholder="例如：SELECT * FROM waybill_data WHERE region = '北京'"
                className={`w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${
                  editAccount.permissionSql && !validateSql(editAccount.permissionSql).valid
                    ? 'border-red-300 bg-red-50'
                    : editAccount.permissionSql && validateSql(editAccount.permissionSql).valid
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200'
                }`}
              />
              {editAccount.permissionSql && (
                <div className={`flex items-center gap-1 text-xs ${
                  validateSql(editAccount.permissionSql).valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validateSql(editAccount.permissionSql).valid ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>{validateSql(editAccount.permissionSql).message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>{validateSql(editAccount.permissionSql).message}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEditAccount} className="bg-gradient-to-r from-blue-500 to-cyan-500">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 邮件发送记录对话框 */}
      <Dialog open={isEmailLogDialogOpen} onOpenChange={setIsEmailLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>邮件发送记录 - {emailLogAccount?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const accountLogs = emailLogs.filter(log => log.accountId === emailLogAccount?.id);
              const totalPages = Math.max(1, Math.ceil(accountLogs.length / pageSize));
              const startIndex = (emailLogPage - 1) * pageSize;
              const pagedLogs = accountLogs.slice(startIndex, startIndex + pageSize);

              return (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮件类型</TableHead>
                        <TableHead>发送时间</TableHead>
                        <TableHead>发送状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                            暂无邮件发送记录
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{getEmailTypeBadge(log.type)}</TableCell>
                            <TableCell className="text-slate-600">{log.sendTime}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                log.status === '发送成功'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {log.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.status === '发送失败' && (
                                resendingIds.has(log.id) ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled
                                    className="text-slate-400"
                                  >
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    发送中...
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendEmail(log)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    重新发送
                                  </Button>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* 分页 */}
                  {accountLogs.length > pageSize && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-slate-500">
                        共 {accountLogs.length} 条记录，第 {emailLogPage}/{totalPages} 页
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailLogPage(p => Math.max(1, p - 1))}
                          disabled={emailLogPage <= 1}
                        >
                          上一页
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === emailLogPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEmailLogPage(page)}
                            className={page === emailLogPage ? 'bg-blue-500 text-white' : ''}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailLogPage(p => Math.min(totalPages, p + 1))}
                          disabled={emailLogPage >= totalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              确定要重置账号 <strong>{selectedAccount?.customerName}</strong> 的密码吗？
            </p>
            <p className="text-sm text-slate-400 mt-2">重置后将生成新的随机密码</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>取消</Button>
            <Button onClick={handleResetPassword} className="bg-gradient-to-r from-blue-500 to-cyan-500">确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
