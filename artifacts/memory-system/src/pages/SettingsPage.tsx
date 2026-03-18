import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, User, Key, Palette, Globe, RotateCcw, Save,
  Sun, Moon, Check, Info, ChevronRight, Upload, Trash2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ApiSettings, UserProfile, Theme } from "@/context/AppContext";

const PRESET_PROVIDERS = [
  { label: "Replit AI", baseUrl: "", model: "gpt-5.2" },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  { label: "Claude", baseUrl: "https://api.anthropic.com/v1", model: "claude-3-5-sonnet-20241022" },
  { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { label: "Ollama", baseUrl: "http://localhost:11434/v1", model: "llama3.2" },
  { label: "自定义", baseUrl: "", model: "" },
];

type Tab = 'profile' | 'api' | 'appearance';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: '用户资料', icon: <User className="w-4 h-4" /> },
  { id: 'api', label: 'AI 接口', icon: <Key className="w-4 h-4" /> },
  { id: 'appearance', label: '外观偏好', icon: <Palette className="w-4 h-4" /> },
];

function Avatar({ profile, size = 'lg' }: { profile: UserProfile; size?: 'sm' | 'lg' }) {
  const initials = (profile.name || 'U').slice(0, 2).toUpperCase();
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-sm';
  return profile.avatarUrl ? (
    <img src={profile.avatarUrl} alt={profile.name} className={cn("rounded-full object-cover", sz)} />
  ) : (
    <div className={cn("rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white", sz)}>
      {initials}
    </div>
  );
}

function ProfileTab({ profile, onChange }: { profile: UserProfile; onChange: (p: UserProfile) => void }) {
  const [local, setLocal] = useState(profile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <Avatar profile={local} size="lg" />
        <div>
          <h3 className="font-semibold text-foreground mb-1">头像</h3>
          <p className="text-sm text-muted-foreground mb-3">输入图片 URL 设置头像</p>
          <div className="flex gap-2">
            <Input
              value={local.avatarUrl}
              onChange={e => setLocal(p => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://..."
              className="w-64 text-sm"
            />
            {local.avatarUrl && (
              <Button variant="ghost" size="icon" onClick={() => setLocal(p => ({ ...p, avatarUrl: '' }))} className="shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">昵称</label>
          <Input value={local.name} onChange={e => setLocal(p => ({ ...p, name: e.target.value }))} placeholder="你的名字" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">语言偏好</label>
          <div className="flex gap-2">
            {(['zh', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLocal(p => ({ ...p, language: lang }))}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                  local.language === lang
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary/20"
                )}
              >
                {lang === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">个人简介</label>
        <Textarea
          value={local.bio}
          onChange={e => setLocal(p => ({ ...p, bio: e.target.value }))}
          placeholder="介绍一下你自己..."
          className="min-h-[80px] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">发送设置</label>
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div>
            <div className="font-medium text-sm text-foreground">Enter 直接发送</div>
            <div className="text-xs text-muted-foreground mt-0.5">Shift+Enter 换行；关闭后需点击发送按钮</div>
          </div>
          <button
            onClick={() => setLocal(p => ({ ...p, sendOnEnter: !p.sendOnEnter }))}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors shrink-0",
              local.sendOnEnter ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              local.sendOnEnter ? "left-5.5 translate-x-0" : "left-0.5 translate-x-0"
            )} style={{ transform: local.sendOnEnter ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      <Button onClick={handleSave} className="gap-2">
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "已保存" : "保存资料"}
      </Button>
    </div>
  );
}

function ApiTab({ settings, onChange }: { settings: ApiSettings; onChange: (s: ApiSettings) => void }) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { onChange(local); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const handleReset = () => { const d = { baseUrl: '', apiKey: '', model: 'gpt-5.2', enabled: false }; setLocal(d); onChange(d); };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300 dark:text-blue-300 leading-relaxed">
          支持任何 OpenAI 兼容接口。留空则使用系统默认 Replit AI。
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">快速切换</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PROVIDERS.map(p => (
            <button
              key={p.label}
              onClick={() => setLocal(prev => ({ ...prev, baseUrl: p.baseUrl, model: p.model || prev.model, enabled: !!p.baseUrl }))}
              className={cn(
                "px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-center",
                local.baseUrl === p.baseUrl && p.baseUrl
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/25 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">API Base URL</label>
          <Input value={local.baseUrl} onChange={e => setLocal(p => ({ ...p, baseUrl: e.target.value, enabled: !!e.target.value }))} placeholder="https://api.openai.com/v1" className="font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
          <Input type="password" value={local.apiKey} onChange={e => setLocal(p => ({ ...p, apiKey: e.target.value }))} placeholder="sk-..." className="font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">模型名称</label>
          <Input value={local.model} onChange={e => setLocal(p => ({ ...p, model: e.target.value }))} placeholder="gpt-4o / deepseek-chat / llama3.2" className="font-mono" />
        </div>
      </div>

      {local.enabled && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">已启用：{local.baseUrl} — {local.model}</span>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="w-4 h-4" /> 恢复默认
        </Button>
        <Button onClick={handleSave} className="gap-2">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "已保存" : "保存配置"}
        </Button>
      </div>
    </div>
  );
}

function AppearanceTab({ theme, toggleTheme, profile, onProfileChange }: {
  theme: Theme;
  toggleTheme: () => void;
  profile: UserProfile;
  onProfileChange: (p: UserProfile) => void;
}) {
  const [savedFont, setSavedFont] = useState(false);
  const [fontSize, setFontSize] = useState<UserProfile['fontSize']>(profile.fontSize);

  const handleFontSave = () => {
    onProfileChange({ ...profile, fontSize });
    setSavedFont(true);
    setTimeout(() => setSavedFont(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Theme toggle */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">主题外观</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
              theme === 'dark'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className="w-full h-20 rounded-xl bg-[#10121a] flex items-end p-2 gap-1">
              <div className="flex-1 h-12 rounded-lg bg-[#1a1d2e]" />
              <div className="w-1/3 h-16 rounded-lg bg-[#252836]" />
            </div>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">深色模式</span>
            </div>
            {theme === 'dark' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
              theme === 'light'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className="w-full h-20 rounded-xl bg-[#f5f3ef] flex items-end p-2 gap-1">
              <div className="flex-1 h-12 rounded-lg bg-white shadow-sm" />
              <div className="w-1/3 h-16 rounded-lg bg-[#ede9e0]" />
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">日间模式</span>
            </div>
            {theme === 'light' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">字体大小</label>
        <div className="flex gap-2">
          {([['sm', '小'], ['md', '中'], ['lg', '大']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFontSize(val)}
              className={cn(
                "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                fontSize === val
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleFontSave} className="gap-2">
        {savedFont ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {savedFont ? "已应用" : "应用设置"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme, apiSettings, setApiSettings, userProfile, setUserProfile } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-base font-semibold">账号设置</h1>
        {/* User avatar preview */}
        <div className="ml-auto flex items-center gap-2">
          {userProfile.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {(userProfile.name || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-muted-foreground hidden sm:block">{userProfile.name}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs (desktop) */}
        <nav className="w-56 shrink-0 border-r border-border p-3 hidden md:flex flex-col gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile tabs */}
        <div className="flex md:hidden border-b border-border bg-background shrink-0 w-full absolute z-10" style={{ top: '56px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 py-8 md:pt-8 pt-16 max-w-2xl mx-auto w-full">
          {activeTab === 'profile' && (
            <ProfileTab profile={userProfile} onChange={setUserProfile} />
          )}
          {activeTab === 'api' && (
            <ApiTab settings={apiSettings} onChange={setApiSettings} />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab theme={theme} toggleTheme={toggleTheme} profile={userProfile} onProfileChange={setUserProfile} />
          )}
        </main>
      </div>
    </div>
  );
}
