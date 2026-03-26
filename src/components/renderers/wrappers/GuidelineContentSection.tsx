import React from "react";

interface GuidelineContentSectionProps {
  children: React.ReactNode;
}

export const GuidelineContentSection: React.FC<GuidelineContentSectionProps> = ({children}) => {
  return (
    <div className="prose max-w-none prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400">
      {children}
    </div>
  );
};
