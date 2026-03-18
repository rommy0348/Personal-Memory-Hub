import React from "react";
import { Link } from "wouter";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center flex flex-col items-center glass-panel p-12 rounded-3xl max-w-md mx-4">
        <BrainCircuit className="w-16 h-16 text-primary mb-6 opacity-80" />
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">404</h1>
        <p className="text-muted-foreground mb-8">您访问的记忆区域不存在或已被归档。</p>
        <Link href="/" className="w-full">
          <Button className="w-full">返回记忆中枢</Button>
        </Link>
      </div>
    </div>
  );
}
