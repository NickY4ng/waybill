import { useState } from 'react';
import { Header } from './sections/Header';
import { SmartQueryAgent } from './sections/SmartQueryAgent';
import { SmartAnalysisAgent } from './sections/SmartAnalysisAgent';
import { FenceDrawer } from './sections/FenceDrawer';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [activeModule, setActiveModule] = useState('query');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header activeModule={activeModule} onModuleChange={setActiveModule} />
      
      <main className="flex-1 overflow-hidden">
        {activeModule === 'query' && (
          <div className="h-full w-full">
            <SmartQueryAgent />
          </div>
        )}
        
        {activeModule === 'analysis' && <SmartAnalysisAgent />}
        
        {activeModule === 'fence' && <FenceDrawer />}
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;
