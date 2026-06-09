import { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AccountManagement } from './AccountManagement';
import { UsageStatistics } from './UsageStatistics';
import { DataDownload } from './DataDownload';
import { OperationLog } from './OperationLog';

export function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'usage' | 'download' | 'logs'>('accounts');

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'accounts' && <AccountManagement />}
      {activeTab === 'usage' && <UsageStatistics />}
      {activeTab === 'download' && <DataDownload />}
      {activeTab === 'logs' && <OperationLog />}
    </AdminLayout>
  );
}
