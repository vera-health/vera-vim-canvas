import type {VeraTable, VeraNode} from "@/types/customAST";

import React, {useState, useCallback} from "react";
import {useVimOS} from "@/app/page";

interface VeraTableRendererProps {
  node: VeraTable;
  renderChildren: (children: VeraNode[]) => React.ReactNode;
}

export const VeraTableRenderer: React.FC<VeraTableRendererProps> = ({node, renderChildren}) => {
  const [firstRow, ...bodyRows] = node.children;
  const vimOS = useVimOS();
  const [expanded, setExpanded] = useState(false);

  const toggleSize = useCallback(() => {
    const hub = vimOS?.hub;
    if (!hub?.setDynamicAppSize) return;
    const next = expanded ? "CLASSIC" : "LARGE";
    hub.setDynamicAppSize(next);
    setExpanded(!expanded);
  }, [vimOS, expanded]);

  const canResize = !!vimOS?.hub?.setDynamicAppSize;

  return (
    <div className="my-2">
      {canResize && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={toggleSize}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title={expanded ? "Collapse table" : "Expand table for better readability"}
          >
            {expanded ? (
              <>
                <ArrowsInIcon />
                Collapse
              </>
            ) : (
              <>
                <ArrowsOutIcon />
                Expand
              </>
            )}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className={`w-full ${expanded ? "table-auto" : "table-fixed"}`}>
          {firstRow && (
            <thead>
              <tr className="border-b border-gray-300">
                {firstRow.children.map((cell, i) => (
                  <th key={i} className="px-4 py-2 text-left font-bold whitespace-nowrap">
                    {renderChildren(cell.children)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          {bodyRows.length > 0 && (
            <tbody>
              {bodyRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-200">
                  {row.children.map((cell, j) => (
                    <td key={j} className="break-words px-4 py-2">
                      {renderChildren(cell.children)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

function ArrowsOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 2 14 2 14 6" />
      <polyline points="6 14 2 14 2 10" />
      <line x1="14" y1="2" x2="9.5" y2="6.5" />
      <line x1="2" y1="14" x2="6.5" y2="9.5" />
    </svg>
  );
}

function ArrowsInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 10 0 10 0 14" />
      <polyline points="12 6 16 6 16 2" />
      <line x1="0" y1="10" x2="4.5" y2="5.5" />
      <line x1="16" y1="6" x2="11.5" y2="10.5" />
    </svg>
  );
}
