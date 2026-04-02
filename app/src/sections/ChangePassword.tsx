import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface ChangePasswordProps {
  onBack: () => void;
}

export function ChangePassword({ onBack }: ChangePasswordProps) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }

    // 密码复杂度验证
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError('密码必须8-20位，且包含字母和数字');
      return;
    }

    // 模拟修改密码成功
    setSuccess(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">密码修改成功</h2>
            <p className="text-slate-500">您的密码已更新，请使用新密码登录</p>
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
          返回
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">修改密码</CardTitle>
            <p className="text-sm text-slate-500 mt-1">请设置您的新密码</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">原密码</label>
                <div className="relative">
                  <Input
                    type={showPassword.old ? 'text' : 'password'}
                    placeholder="请输入原密码"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">新密码</label>
                <div className="relative">
                  <Input
                    type={showPassword.new ? 'text' : 'password'}
                    placeholder="请输入新密码"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">密码必须8-20位，且包含字母和数字</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">确认新密码</label>
                <div className="relative">
                  <Input
                    type={showPassword.confirm ? 'text' : 'password'}
                    placeholder="请再次输入新密码"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                确认修改
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
