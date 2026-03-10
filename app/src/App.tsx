import { useState } from 'react';
import { Header } from './sections/Header';
import { SmartQueryAgent } from './sections/SmartQueryAgent';
import { DataAssets } from './sections/DataAssets';
import { DigitalHuman } from './sections/DigitalHuman';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';

function App() {
  const [activeModule, setActiveModule] = useState('query');

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex flex-col overflow-hidden">
      <Header activeModule={activeModule} onModuleChange={setActiveModule} />
      
      <main className="flex-1 min-h-0 p-4">
        {activeModule === 'query' && (
          <div className="h-full w-full">
            <SmartQueryAgent />
          </div>
        )}
        
        {activeModule === 'industry-monitor' && (
          <div className="h-full w-full overflow-hidden">
            <DigitalHuman />
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
