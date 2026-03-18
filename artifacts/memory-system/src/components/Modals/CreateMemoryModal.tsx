import React, { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useCreateMemory } from "@/hooks/use-api-mutations";
import { ListMemoriesLibraryType, CreateMemoryRequestLibraryType } from "@workspace/api-client-react";

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolderId?: number;
  libraryType: ListMemoriesLibraryType;
}

export function CreateMemoryModal({ isOpen, onClose, defaultFolderId, libraryType }: CreateMemoryModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const createMemory = useCreateMemory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createMemory.mutate({
      data: {
        title,
        content,
        folderId: defaultFolderId || null,
        libraryType: libraryType as CreateMemoryRequestLibraryType,
        keywords: keywords.split(/[,，\s]+/).filter(k => k.trim() !== ""),
        isImportant,
        emotionWeight: 0.5 // Default neutral
      }
    }, {
      onSuccess: () => {
        setTitle("");
        setContent("");
        setKeywords("");
        setIsImportant(false);
        onClose();
      }
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="手动添加记录">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">标题 <span className="text-red-400">*</span></label>
          <Input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="简短的标题概括..." 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">内容 <span className="text-red-400">*</span></label>
          <Textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="详细记录内容..." 
            className="min-h-[120px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">关键词标签</label>
          <Input 
            value={keywords} 
            onChange={e => setKeywords(e.target.value)} 
            placeholder="用逗号或空格分隔，如: 项目A 会议" 
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="important" 
            checked={isImportant}
            onChange={e => setIsImportant(e.target.checked)}
            className="rounded border-white/20 bg-black/20 text-primary focus:ring-primary w-4 h-4"
          />
          <label htmlFor="important" className="text-sm text-gray-300 cursor-pointer">
            标记为重要信息
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={!title.trim() || !content.trim() || createMemory.isPending}>
            {createMemory.isPending ? "保存中..." : "保存记录"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
