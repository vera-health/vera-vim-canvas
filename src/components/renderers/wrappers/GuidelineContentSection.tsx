import React from "react";

interface GuidelineContentSectionProps {
  children: React.ReactNode;
}

export const GuidelineContentSection: React.FC<GuidelineContentSectionProps> = ({children}) => {
  return (
    <div className="prose max-w-none text-[13px] leading-[22px] prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400" style={{color: "var(--vera-grey-600)"}}>
      {children}
    </div>
  );
};
