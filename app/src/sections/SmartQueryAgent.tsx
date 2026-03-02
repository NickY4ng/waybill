import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { callBailianAgent } from '@/services/bailianApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  '查询2024年10月从山西到河北的煤炭运输量',
  '展示上海港周边50公里内的物流企业分布',
  '对比G15沈海高速和G2京沪高速的货车流量',
  '分析北京到天津的钢铁运输成本',
  '查询广东省水泥运输的主要流向',
];

export function SmartQueryAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: '您好！我是智数物流AI助手。我可以帮您查询虚拟运单数据、分析物流趋势、提供选址建议等。请告诉我您的需求？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowExamples(false);

    try {
      const aiResponse = await callBailianAgent(input);
      const botResponse: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请求失败，请稍后重试';
      const botResponse: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **请求失败**\n\n${errorMessage}\n\n请检查网络连接或稍后重试。`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        content: '您好！我是智数物流AI助手。我可以帮您查询虚拟运单数据、分析物流趋势、提供选址建议等。请告诉我您的需求？',
        timestamp: new Date(),
      },
    ]);
    setShowExamples(true);
  };

  return (
    <div className="h-full w-full flex flex-col p-4">
      <Card className="flex-1 flex flex-col bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">智能问数Agent</CardTitle>
                <p className="text-sm text-slate-400">基于阿里云百炼大模型的智能助手</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                在线
              </Badge>
              <Button variant="ghost" size="icon" onClick={clearHistory} className="text-slate-400 hover:text-white">
                <History className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    <span className="text-xs opacity-50 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-slate-400 text-sm">AI正在分析数据...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {showExamples && (
            <div className="p-4 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-400">您可以这样问：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors text-left"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入您的问题，例如：查询从北京到上海的钢材运输量..."
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
