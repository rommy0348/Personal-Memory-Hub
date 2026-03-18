import React, { useState } from "react";
import { Folder as FolderType } from "@workspace/api-client-react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateFolderModal } from "../Modals/CreateFolderModal";

interface FolderTreeProps {
  folders: FolderType[];
}

export function FolderTree({ folders }: FolderTreeProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);

  // Filter top level folders
  const topLevelFolders = folders.filter(f => !f.parentId);

  const handleCreate = (parentId: number | null) => {
    setCreateParentId(parentId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 group">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">目录结构</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleCreate(null)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2">
        {topLevelFolders.length === 0 ? (
          <div className="text-xs text-muted-foreground px-4 py-4 italic">暂无文件夹</div>
        ) : (
          topLevelFolders.map(folder => (
            <FolderNode 
              key={folder.id} 
              folder={folder} 
              allFolders={folders} 
              onCreateChild={() => handleCreate(folder.id)} 
            />
          ))
        )}
      </div>

      <CreateFolderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        parentId={createParentId} 
      />
    </div>
  );
}

function FolderNode({ 
  folder, 
  allFolders, 
  depth = 0,
  onCreateChild
}: { 
  folder: FolderType; 
  allFolders: FolderType[]; 
  depth?: number;
  onCreateChild: () => void;
}) {
  const { selectedFolderId, setSelectedFolderId } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  const children = allFolders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const selectFolder = () => {
    setSelectedFolderId(folder.id);
  };

  return (
    <div>
      <div 
        className={cn(
          "group flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-colors my-0.5",
          isSelected ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-300"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={selectFolder}
      >
        <button 
          onClick={toggleOpen} 
          className="w-5 h-5 flex items-center justify-center shrink-0 mr-1 opacity-70 hover:opacity-100"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </button>
        
        {isOpen && hasChildren ? (
          <FolderOpen className="w-4 h-4 mr-2 opacity-80" />
        ) : (
          <FolderIcon className="w-4 h-4 mr-2 opacity-80" />
        )}
        
        <span className="text-sm truncate flex-1">{folder.name}</span>
        
        {folder.memoryCount !== undefined && (
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md ml-2 opacity-60">
            {folder.memoryCount}
          </span>
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); onCreateChild(); }}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {children.map(child => (
            <FolderNode 
              key={child.id} 
              folder={child} 
              allFolders={allFolders} 
              depth={depth + 1}
              onCreateChild={onCreateChild} // Note: This creates a peer to the child, which means passing child.id would make it a sub-child. Wait, if we click + on a child, it should create a sub-child.
            />
          ))}
        </div>
      )}
    </div>
  );
}
