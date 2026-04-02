import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, ArrowLeft, Mail, Phone, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

// 模拟账号数据（实际应该从后端获取）
const MOCK_ACCOUNTS = [
  { email: 'beijing@logistics.com', phone: '13800138001' },
  { email: 'shanghai@transport.com', phone: '13800138002' },
  { email: 'guangzhou@supply.com', phone: '13800138003' },
  { email: 'shenzhen@cargo.com', phone: '13800138004' },
  { email: 'tianjin@port.com', phone: '13800138005' },
  { email: 'chongqing@west.com', phone: '13800138006' },
];

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入正确的邮箱地址');
      setIsLoading(false);
      return;
    }

    // 2. 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('请输入正确的手机号');
      setIsLoading(false);
      return;
    }

    // 3. 验证账号是否存在
    const accountExists = MOCK_ACCOUNTS.some(
      acc => acc.email === formData.email && acc.phone === formData.phone
    );

    if (!accountExists) {
      setError('邮箱和手机号不匹配，请检查输入信息');
      setIsLoading(false);
      return;
    }

    // 4. 校验通过，显示成功
    setSuccess(true);
    setIsLoading(false);

    // 3秒后自动返回登录页面
    setTimeout(() => {
      onBack();
    }, 3000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">密码重置成功</h2>
            <p className="text-slate-500 mb-4">新密码已发送至您的邮箱，请查收</p>
            <p className="text-xs text-slate-400">3秒后自动返回登录页面...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">忘记密码</CardTitle>
            <p className="text-sm text-slate-500 mt-1">请输入您的邮箱和手机号进行验证</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">注册邮箱 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="请输入注册邮箱"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">注册手机号 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="请输入注册手机号"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isLoading ? '验证中...' : '提交验证'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                <strong>说明：</strong>验证通过后，系统将自动重置您的密码并发送至注册邮箱，请使用新密码登录。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
