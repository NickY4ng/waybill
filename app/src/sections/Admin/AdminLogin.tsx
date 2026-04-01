import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

// 大脑Logo组件
function BrainLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18" className="text-cyan-400" />
      <path d="M12 4C16 4 19 7 19 11C19 15 16 18 12 18" className="text-blue-400" />
      <path d="M8 8C8 8 9 9 10 8" strokeLinecap="round" />
      <path d="M16 8C16 8 15 9 14 8" strokeLinecap="round" />
      <path d="M7 12C7 12 8.5 13 10 12" strokeLinecap="round" />
      <path d="M17 12C17 12 15.5 13 14 12" strokeLinecap="round" />
      <path d="M9 15C9 15 10.5 16 12 15C13.5 16 15 15 15 15" strokeLinecap="round" />
      <circle cx="12" cy="6" r="1" className="fill-cyan-300" />
      <circle cx="9" cy="10" r="0.8" className="fill-blue-300" />
      <circle cx="15" cy="10" r="0.8" className="fill-cyan-300" />
      <circle cx="12" cy="14" r="1" className="fill-blue-300" />
    </svg>
  );
}

// Plexus科技网络背景
function PlexusBackground() {
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    // 初始化节点
    const initialNodes = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
    }));
    setNodes(initialNodes);

    // 动画循环
    let animationId: number;
    const animate = () => {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          // 边界反弹
          if (newX <= 0 || newX >= 100) newVx = -newVx;
          if (newY <= 0 || newY >= 100) newVy = -newVy;

          // 保持在边界内
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

          return { ...node, x: newX, y: newY, vx: newVx, vy: newVy };
        })
      );
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // 计算连接线
  const connections: Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 20) {
        connections.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          opacity: 1 - distance / 20,
        });
      }
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* 深层网格 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Plexus网络 - SVG */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 连接线 */}
        {connections.map((conn, idx) => (
          <line
            key={idx}
            x1={`${conn.x1}%`}
            y1={`${conn.y1}%`}
            x2={`${conn.x2}%`}
            y2={`${conn.y2}%`}
            stroke="url(#lineGrad)"
            strokeWidth="1"
            opacity={conn.opacity * 0.6}
          />
        ))}

        {/* 节点 */}
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.id % 5 === 0 ? 3 : 2}
            fill={node.id % 5 === 0 ? '#22d3ee' : '#3b82f6'}
            opacity={node.id % 5 === 0 ? 1 : 0.8}
          >
            {node.id % 5 === 0 && (
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
            )}
          </circle>
        ))}
      </svg>

      {/* 中心数据核心 */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2">
        {/* 外环 */}
        <div className="w-64 h-64 border border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
        {/* 中环 */}
        <div className="absolute inset-8 border border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        {/* 内环 */}
        <div className="absolute inset-16 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
        {/* 核心光晕 */}
        <div className="absolute inset-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse" />
        {/* 中心点 */}
        <div className="absolute inset-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50" />
      </div>

      {/* 浮动数据标签 */}
      <div className="absolute inset-0">
        {['AI', 'DATA', 'CLOUD', 'LOGISTICS', 'SMART', 'TRACK'].map((label, i) => (
          <div
            key={label}
            className="absolute px-2 py-1 bg-blue-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-300 font-mono tracking-wider"
            style={{
              left: `${15 + (i * 12)}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 光晕装饰 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/80 to-transparent" />

      {/* 左下角品牌 */}
      <div className="absolute bottom-10 left-10 text-white">
        <h2 className="text-3xl font-light tracking-wide mb-2">
          <span className="font-bold">物流决策分析</span>智能体
        </h2>
        <p className="text-blue-300/50 text-xs tracking-[0.3em] uppercase">
          Logistics Decision Analysis Intelligence
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入账号和密码');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('admin_token', 'mock_token_' + Date.now());
        localStorage.setItem('admin_user', JSON.stringify({ username, id: '1' }));
        onLogin();
      } else {
        setError('账号或密码错误');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏Plexus科技背景 */}
      <PlexusBackground />

      {/* 右侧悬浮登录卡片 - 往左移了 */}
      <div className="absolute right-8 lg:right-16 xl:right-24 top-0 bottom-0 flex items-center justify-center">
        <div className="w-[380px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo和品牌 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
              <BrainLogo className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">大卡鹰眼</h1>
            <p className="text-sm text-slate-400">物流决策分析智能体</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">账号</label>
              <Input
                type="text"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-slate-600">记住我</span>
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700" onClick={() => alert('请联系客服')}>
                忘记密码？
              </button>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登 录'}
            </Button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">默认账号：admin / 密码：admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
