import React, { useState } from "react";
import { Trash2, Star, Clock, Brain, Edit2, Save, X, StarOff } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { MemoryCard } from "@workspace/api-client-react";
import { useDeleteMemory, useUpdateMemory } from "@/hooks/use-api-mutations";
import { formatDate } from "@/lib/utils";

interface MemoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryCard;
}

const EMOTION_MAP: Record<string, string> = {
  calm: "🔵 平静",
  excited: "🔴 激动",
  positive: "🟢 积极",
  negative: "🟠 消极",
  neutral: "⚪ 中性",
};

export function MemoryDetailModal({ isOpen, onClose, memory }: MemoryDetailModalProps) {
  const deleteMutation = useDeleteMemory();
  const updateMutation = useUpdateMemory();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(memory.title);
  const [editContent, setEditContent] = useState(memory.content);
  const [editKeywords, setEditKeywords] = useState((memory.keywords || []).join(", "));
  const [editImportant, setEditImportant] = useState(memory.isImportant);

  const handleDelete = () => {
    if (confirm("确定要删除这条记录吗？此操作不可恢复。")) {
      deleteMutation.mutate({ memoryId: memory.id }, { onSuccess: () => onClose() });
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        memoryId: memory.id,
        data: {
          title: editTitle,
          content: editContent,
          keywords: editKeywords.split(/[,，\s]+/).filter(k => k.trim()),
          isImportant: editImportant,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleCancelEdit = () => {
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setEditKeywords((memory.keywords || []).join(", "));
    setEditImportant(memory.isImportant);
    setIsEditing(false);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={isEditing ? "编辑记录" : "记录详情"}>
      <div className="space-y-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-base font-semibold flex-1"
              placeholder="标题"
            />
          ) : (
            <h2 className="text-lg font-bold text-foreground pr-2 leading-tight flex-1">{memory.title}</h2>
          )}
          {!isEditing && (
            <button
              onClick={() => setEditImportant(prev => !prev)}
              className="shrink-0 mt-0.5"
              title={editImportant ? "取消重要标记" : "标记为重要"}
            >
              {editImportant
                ? <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                : <StarOff className="w-5 h-5 text-muted-foreground hover:text-yellow-400 transition-colors" />
              }
            </button>
          )}
        </div>

        {/* Meta badges */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1.5 py-0.5">
              <Brain className="w-3 h-3" />
              情感权重 {memory.emotionWeight?.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="py-0.5">
              {EMOTION_MAP[memory.emotionLabel] || "⚪ 中性"}
            </Badge>
            <div className="flex items-center text-muted-foreground text-xs gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDate(memory.createdAt)}
            </div>
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">内容</label>
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="min-h-[140px] text-[15px] leading-relaxed"
                placeholder="记录内容..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">关键词 (逗号分隔)</label>
              <Input
                value={editKeywords}
                onChange={e => setEditKeywords(e.target.value)}
                placeholder="关键词1, 关键词2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-important"
                checked={editImportant}
                onChange={e => setEditImportant(e.target.checked)}
                className="rounded border-white/20 bg-black/20 text-primary w-4 h-4"
              />
              <label htmlFor="edit-important" className="text-sm text-gray-300 cursor-pointer">标记为重要信息</label>
            </div>
          </div>
        ) : (
          <div className="bg-black/20 border border-white/[0.06] rounded-xl p-4 text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap">
            {memory.content}
          </div>
        )}

        {/* Keywords */}
        {!isEditing && memory.keywords && memory.keywords.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">关联标签</h4>
            <div className="flex flex-wrap gap-1.5">
              {memory.keywords.map((kw, i) => (
                <span key={i} className="text-xs bg-white/[0.07] text-gray-300 px-2.5 py-1 rounded-full border border-white/[0.07]">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between pt-4 border-t border-white/[0.07]">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="gap-1.5 text-muted-foreground">
                <X className="w-4 h-4" /> 取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending || !editTitle.trim() || !editContent.trim()}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "保存中..." : "保存更改"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? "删除中..." : "删除"}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5 border-white/10"
                >
                  <Edit2 className="w-4 h-4" /> 编辑
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
