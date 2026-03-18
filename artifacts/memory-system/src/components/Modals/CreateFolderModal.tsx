import React, { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCreateFolder } from "@/hooks/use-api-mutations";
import { useApp } from "@/context/AppContext";

export function CreateFolderModal({ 
  isOpen, 
  onClose, 
  parentId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  parentId: number | null;
}) {
  const [name, setName] = useState("");
  const { libraryType } = useApp();
  const createFolder = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createFolder.mutate({
      data: {
        name,
        parentId,
        libraryType: libraryType as any
      }
    }, {
      onSuccess: () => {
        setName("");
        onClose();
      }
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="新建文件夹">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">文件夹名称</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="输入名称..." 
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={!name.trim() || createFolder.isPending}>
            {createFolder.isPending ? "创建中..." : "确定创建"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
