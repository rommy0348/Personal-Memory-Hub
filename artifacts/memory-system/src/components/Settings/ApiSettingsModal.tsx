import React, { useState } from "react";
import { Settings, Info, RotateCcw, Check } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useApp } from "@/context/AppContext";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROVIDERS = [
  { label: "Replit AI (默认)", baseUrl: "", model: "gpt-5.2", apiKey: "" },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "" },
  { label: "Claude (Anthropic)", baseUrl: "https://api.anthropic.com/v1", model: "claude-3-5-sonnet-20241022", apiKey: "" },
  { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat", apiKey: "" },
  { label: "Ollama (本地)", baseUrl: "http://localhost:11434/v1", model: "llama3.2", apiKey: "ollama" },
  { label: "自定义", baseUrl: "", model: "", apiKey: "" },
];

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const { apiSettings, setApiSettings } = useApp();
  const [local, setLocal] = useState({ ...apiSettings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiSettings(local);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleReset = () => {
    const defaults = { baseUrl: "", apiKey: "", model: "gpt-5.2", enabled: false };
    setLocal(defaults);
    setApiSettings(defaults);
  };

  const handlePreset = (preset: typeof PRESET_PROVIDERS[0]) => {
    setLocal(prev => ({
      ...prev,
      baseUrl: preset.baseUrl,
      model: preset.model,
      enabled: !!preset.baseUrl,
    }));
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="AI 接口配置">
      <div className="space-y-5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300 leading-relaxed">
            支持任何 OpenAI 兼容接口。留空则使用系统默认 AI（Replit AI，无需配置）。
            自定义接口时，确保目标服务支持 <code className="bg-white/10 px-1 rounded">POST /chat/completions</code>。
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">快速选择</label>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_PROVIDERS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className="text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-gray-300 hover:text-white transition-all text-center truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              API Base URL
              <span className="ml-2 text-xs text-muted-foreground font-normal">留空使用默认</span>
            </label>
            <Input
              value={local.baseUrl}
              onChange={e => setLocal(p => ({ ...p, baseUrl: e.target.value, enabled: !!e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">API Key</label>
            <Input
              type="password"
              value={local.apiKey}
              onChange={e => setLocal(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">模型名称</label>
            <Input
              value={local.model}
              onChange={e => setLocal(p => ({ ...p, model: e.target.value }))}
              placeholder="gpt-4o / claude-3-5-sonnet / deepseek-chat"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {local.enabled && local.baseUrl && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-300">
              自定义接口已启用：{local.baseUrl} — 模型：{local.model || "默认"}
            </span>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> 恢复默认
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} className="gap-1.5">
              {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {saved ? "已保存" : "保存配置"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
