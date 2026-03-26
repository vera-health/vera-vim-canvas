"use client";

import React from "react";
import {Pill} from "lucide-react";

interface DrugInfoWrapperProps {
  children: React.ReactNode;
}

export const DrugInfoWrapper: React.FC<DrugInfoWrapperProps> = ({children}) => {
  return (
    <div className="mx-auto my-4 w-full max-w-2xl">
      {/* Header */}
      <div className="rounded-t-lg border-b border-dashed px-3 py-2" style={{ borderColor: "#93bed0", backgroundColor: "#e3eef3" }}>
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center text-sm font-medium" style={{ color: "#155f7c" }}>
            <Pill className="mr-1.5 h-4 w-4" style={{ color: "#1b779b" }} />
            Drug Information
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-b-lg border-x border-b border-gray-200 p-4">
        <div className="prose max-w-none prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400">
          {children}
        </div>
      </div>
    </div>
  );
};
