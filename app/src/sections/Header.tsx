import { Brain, Database, Settings, User, BarChart3, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface HeaderProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

// 服务次数存储键
const SERVICE_COUNT_KEY = 'daka_service_count';

// 获取服务次数
const getServiceCount = (): number => {
  const count = localStorage.getItem(SERVICE_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
};

// 增加服务次数
export const incrementServiceCount = (): void => {
  const currentCount = getServiceCount();
  localStorage.setItem(SERVICE_COUNT_KEY, (currentCount + 1).toString());
};

export function Header({ activeModule, onModuleChange }: HeaderProps) {
  const [serviceCount, setServiceCount] = useState<number>(0);

  // 从 localStorage 读取服务次数
  useEffect(() => {
    setServiceCount(getServiceCount());
    
    // 监听 storage 变化，实现多标签页同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SERVICE_COUNT_KEY) {
        setServiceCount(getServiceCount());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const modules = [
    { id: 'query', name: '智能报表', icon: Brain },
    { id: 'data-assets', name: '数据资产', icon: Database },
    { id: 'industry-monitor', name: '行业动态监控', icon: Newspaper },
  ];

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Logo区域 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">大卡鹰眼</h1>
          <p className="text-xs text-slate-500 font-medium">智能数据决策平台</p>
        </div>
      </div>

      {/* 导航模块 */}
      <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          return (
            <Button
              key={module.id}
              variant="ghost"
              size="sm"
              onClick={() => onModuleChange(module.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 font-semibold'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
              <span>{module.name}</span>
            </Button>
          );
        })}
      </nav>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3">
        {/* 服务次数统计 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100/60 shadow-sm">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-500">已服务</span>
            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {serviceCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">次</span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
