import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Key, Settings, Trash2 } from 'lucide-react';

interface Account {
  id: string;
  customerId: string;
  customerName: string;
  accountName: string;
  permissions: string[];
  createdAt: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', customerId: 'C001', customerName: '北京物流有限公司', accountName: 'admin', permissions: ['全部权限'], createdAt: '2024-01-15' },
  { id: '2', customerId: 'C002', customerName: '上海运输集团', accountName: 'shanghai01', permissions: ['查询', '导出'], createdAt: '2024-02-20' },
  { id: '3', customerId: 'C003', customerName: '广州供应链公司', accountName: 'guangzhou01', permissions: ['查询'], createdAt: '2024-03-10' },
];

const PERMISSION_OPTIONS = ['查询', '导出', '新建', '删除', '全部权限'];

export function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // 新建账号表单
  const [newAccount, setNewAccount] = useState({
    customerId: '',
    customerName: '',
    accountName: '',
    password: '',
  });

  const filteredAccounts = accounts.filter(account =>
    account.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAccount = () => {
    if (!newAccount.customerId || !newAccount.customerName || !newAccount.accountName || !newAccount.password) {
      alert('请填写完整信息');
      return;
    }
    
    const account: Account = {
      id: Date.now().toString(),
      customerId: newAccount.customerId,
      customerName: newAccount.customerName,
      accountName: newAccount.accountName,
      permissions: ['查询'],
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setAccounts([...accounts, account]);
    setNewAccount({ customerId: '', customerName: '', accountName: '', password: '' });
    setIsCreateDialogOpen(false);
    alert('账号创建成功');
  };

  const handleResetPassword = () => {
    if (!selectedAccount) return;
    alert(`账号 ${selectedAccount.accountName} 的密码已重置为：123456`);
    setIsResetPasswordDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleUpdatePermissions = (permissions: string[]) => {
    if (!selectedAccount) return;
    
    setAccounts(accounts.map(acc =>
      acc.id === selectedAccount.id ? { ...acc, permissions } : acc
    ));
    setIsPermissionDialogOpen(false);
    setSelectedAccount(null);
    alert('权限更新成功');
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('确定要删除这个账号吗？')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
      alert('账号已删除');
    }
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
                placeholder="搜索客户ID、客户名称或账号名称"
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
                <TableHead>客户ID</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>账号名称</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.customerId}</TableCell>
                  <TableCell>{account.customerName}</TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {account.permissions.map((perm, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{account.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsPermissionDialogOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        权限
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建账号对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建账号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">客户ID</label>
              <Input
                placeholder="请输入客户ID"
                value={newAccount.customerId}
                onChange={(e) => setNewAccount({ ...newAccount, customerId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">客户名称</label>
              <Input
                placeholder="请输入客户名称"
                value={newAccount.customerName}
                onChange={(e) => setNewAccount({ ...newAccount, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">账号名称</label>
              <Input
                placeholder="请输入账号名称"
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">初始密码</label>
              <Input
                type="password"
                placeholder="请输入初始密码"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateAccount} className="bg-gradient-to-r from-blue-500 to-cyan-500">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              确定要重置账号 <strong>{selectedAccount?.accountName}</strong> 的密码吗？
            </p>
            <p className="text-sm text-slate-400 mt-2">重置后密码将变为：123456</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>取消</Button>
            <Button onClick={handleResetPassword} className="bg-gradient-to-r from-blue-500 to-cyan-500">确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限设置对话框 */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>权限设置 - {selectedAccount?.accountName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {PERMISSION_OPTIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300"
                  checked={selectedAccount?.permissions.includes(perm)}
                  onChange={(e) => {
                    const currentPerms = selectedAccount?.permissions || [];
                    let newPerms: string[];
                    if (e.target.checked) {
                      newPerms = [...currentPerms, perm];
                    } else {
                      newPerms = currentPerms.filter(p => p !== perm);
                    }
                    setSelectedAccount(selectedAccount ? { ...selectedAccount, permissions: newPerms } : null);
                  }}
                />
                <span>{perm}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>取消</Button>
            <Button 
              onClick={() => handleUpdatePermissions(selectedAccount?.permissions || [])}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
