import { useState } from 'react';
import { Header } from './sections/Header';
import { SmartQueryAgent } from './sections/SmartQueryAgent';
import { DataAssets } from './sections/DataAssets';
import { AdminPanel } from './sections/Admin';
import { AdminLogin } from './sections/Admin/AdminLogin';
import { ChangePassword } from './sections/ChangePassword';
import { ForgotPassword } from './sections/ForgotPassword';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';

function App() {
  const [activeModule, setActiveModule] = useState('query');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 忘记密码页面
  if (activeModule === 'forgot-password') {
    return (
      <>
        <ForgotPassword onBack={() => setActiveModule('query')} />
        <Toaster />
      </>
    );
  }

  // 登录页面
  if (!isLoggedIn) {
    return (
      <>
        <AdminLogin 
          onLogin={() => setIsLoggedIn(true)} 
          onForgotPassword={() => setActiveModule('forgot-password')}
        />
        <Toaster />
      </>
    );
  }

  // 后台管理模块单独渲染，不使用主布局
  if (activeModule === 'admin') {
    return (
      <>
        <AdminPanel />
        <Toaster />
      </>
    );
  }

  // 修改密码页面单独渲染
  if (activeModule === 'change-password') {
    return (
      <>
        <ChangePassword onBack={() => setActiveModule('query')} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex flex-col overflow-hidden">
      <Header activeModule={activeModule} onModuleChange={setActiveModule} />
      
      <main className="flex-1 min-h-0 p-4">
        {activeModule === 'query' && (
          <div className="h-full w-full">
            <SmartQueryAgent />
          </div>
        )}
        

        
        {activeModule === 'data-assets' && (
          <div className="h-full w-full overflow-hidden">
            <DataAssets />
          </div>
        )}
      </main>
      
      <Toaster />
      <OnboardingTutorial />
    </div>
  );
}

export default App;
