"use client";

import { ChevronLeft } from "lucide-react";

const FONT = "Manrope, system-ui, sans-serif";

const sections = [
  {
    title: "When you open a patient\u2019s chart",
    body: "Vera automatically sees the patient\u2019s demographics, problem list, medications, allergies, recent labs, and vitals. Your first question is already in context\u00a0\u2014\u00a0no copy-pasting needed.",
  },
  {
    title: "During an encounter",
    body: "Vera reads your SOAP notes in progress\u00a0\u2014\u00a0chief complaint, HPI, exam, assessment, and plan. When Vera generates a patient handout, you can send it straight to the Patient Instructions field with one tap.",
  },
  {
    title: "When you place an order",
    body: "Vera detects new orders and suggests relevant questions\u00a0\u2014\u00a0contraindications, drug interactions, or related results depending on the order type.",
  },
  {
    title: "When new lab results arrive",
    body: "Vera flags new results and offers to interpret them, highlight critical values, or compare to previous labs.",
  },
  {
    title: "When you place a referral",
    body: "Vera can draft a consult summary, pull relevant history, or flag pending results the specialist should know about.",
  },
];

const extras = [
  "Dictate questions with the mic button or Ctrl+D",
  "Expand the panel for easier reading of tables",
  "Browse cited sources and evidence on any answer",
];

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid #EDF2F7" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "#687076" }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "#37475E", fontFamily: FONT }}
        >
          What can Vera do?
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-5">
          {sections.map((s) => (
            <div key={s.title}>
              <h3
                className="text-xs font-semibold"
                style={{ color: "#486081", fontFamily: FONT }}
              >
                {s.title}
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "#4A5568", fontFamily: FONT }}
              >
                {s.body}
              </p>
            </div>
          ))}

          {/* Other tools */}
          <div>
            <h3
              className="text-xs font-semibold"
              style={{ color: "#486081", fontFamily: FONT }}
            >
              Other tools
            </h3>
            <ul className="mt-1 space-y-1">
              {extras.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-1.5 text-xs leading-relaxed"
                  style={{ color: "#4A5568", fontFamily: FONT }}
                >
                  <span className="mt-px" style={{ color: "#8090A6" }}>&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
