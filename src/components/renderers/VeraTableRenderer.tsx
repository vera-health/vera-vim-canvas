import type {VeraTable, VeraNode} from "@/types/customAST";

import React from "react";

interface VeraTableRendererProps {
  node: VeraTable;
  renderChildren: (children: VeraNode[]) => React.ReactNode;
}

export const VeraTableRenderer: React.FC<VeraTableRendererProps> = ({node, renderChildren}) => {
  const [firstRow, ...bodyRows] = node.children;

  return (
    <table className="w-full table-fixed">
      {/* Table Header - First row with <th> tags */}
      {firstRow && (
        <thead>
          <tr className="border-b border-gray-300">
            {firstRow.children.map((cell, i) => (
              <th key={i} className="px-4 py-2 text-left font-bold">
                {renderChildren(cell.children)}
              </th>
            ))}
          </tr>
        </thead>
      )}
      {/* Table Body - Remaining rows with <td> tags */}
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
  );
};
