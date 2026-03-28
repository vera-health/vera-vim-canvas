"use client";

import React, {useId, useState} from "react";
import {FileText, Copy, Check, FileOutput, Loader2, AlertCircle} from "lucide-react";
import {useEhrWriter} from "@/core/contexts/EhrWriterContext";
import type {WriteStatus} from "@/core/types/ehr";

interface PatientMaterialWrapperProps {
  children: React.ReactNode;
}

export const PatientMaterialWrapper: React.FC<PatientMaterialWrapperProps> = ({children}) => {
  const contentId = useId();
  const [isCopied, setIsCopied] = useState(false);
  const ehrWriter = useEhrWriter();
  const writeStatus: WriteStatus = ehrWriter?.writeStatus ?? "idle";
  const availability = ehrWriter?.getWriteAvailability("patientInstructions") ?? "unavailable";

  const handleCopyClick = async () => {
    try {
      const contentElement = document.getElementById(contentId);
      const contentText = contentElement?.innerText?.trim() || "";
      if (!contentText) return;
      await navigator.clipboard.writeText(contentText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy patient material content:", error);
    }
  };

  const handleSendToChart = async () => {
    if (!ehrWriter || writeStatus !== "idle") return;
    try {
      const contentElement = document.getElementById(contentId);
      const contentText = contentElement?.innerText?.trim() || "";
      if (!contentText) return;
      await ehrWriter.writeToEncounter({
        patientInstructions: { generalNotes: contentText },
      });
    } catch (error) {
      console.error("Failed to send patient material to chart:", error);
    }
  };

  const sendIcon = () => {
    switch (writeStatus) {
      case "writing":
        return <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4" style={{color: "#1b779b"}} />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileOutput className="h-4 w-4 text-gray-600" />;
    }
  };

  const sendTitle = () => {
    if (availability === "unavailable") return "Not available for this EHR";
    switch (writeStatus) {
      case "writing":
        return "Sending to chart...";
      case "success":
        return "Added to patient instructions";
      case "error":
        return "Failed to send — try again";
      default:
        return "Add to patient instructions in chart";
    }
  };

  const isDisabled =
    writeStatus === "writing" ||
    writeStatus === "success" ||
    availability === "unavailable";

  return (
    <div className="mx-auto my-4 w-full max-w-2xl">
      {/* Header */}
      <div className="rounded-t-lg px-3 py-2" style={{backgroundColor: "#faf4eb"}}>
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center text-sm font-medium" style={{color: "#8a5d12"}}>
            <FileText className="mr-1.5 h-4 w-4" style={{color: "#b47818"}} />
            Patient Handout
          </span>
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1 hover:bg-gray-200 disabled:opacity-50"
              title={sendTitle()}
              type="button"
              onClick={handleSendToChart}
              disabled={isDisabled}
            >
              {sendIcon()}
            </button>
            <button
              className="rounded p-1 hover:bg-gray-200"
              title="Copy"
              type="button"
              onClick={handleCopyClick}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-gray-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-b-lg border-x border-b border-gray-200 p-4" id={contentId}>
        <div className="prose max-w-none prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400">
          {children}
        </div>
      </div>
    </div>
  );
};
