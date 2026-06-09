import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, LogOut, Truck, Menu, X, Download, FileText } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'accounts' | 'usage' | 'download' | 'logs';
  onTabChange: (tab: 'accounts' | 'usage' | 'download' | 'logs') => void;
  onLogout: () => void;
}

export function AdminLayout({ children, activeTab, onTabChange, onLogout }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'accounts' as const, label: '账号管理', icon: Users },
    { id: 'usage' as const, label: '消耗次数', icon: BarChart3 },
    { id: 'download' as const, label: '模板使用记录', icon: Download },
    { id: 'logs' as const, label: '操作日志', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 侧边栏 */}
      <div
        className={`bg-white border-r border-slate-200 transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="font-bold text-slate-800">大卡鹰眼</h1>
                <p className="text-xs text-slate-400">后台管理</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-200">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {activeTab === 'accounts' ? '账号管理' : activeTab === 'usage' ? '消耗次数统计' : activeTab === 'download' ? '模板使用记录' : '操作日志'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-slate-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
