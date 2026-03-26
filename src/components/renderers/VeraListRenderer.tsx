import type {VeraList, VeraNode} from "@/types/customAST";

import React from "react";

interface VeraListRendererProps {
  node: VeraList;
  renderChildren: (children: VeraNode[]) => React.ReactNode;
}

const ListItems: React.FC<{
  items: VeraList["children"];
  renderChildren: (children: VeraNode[]) => React.ReactNode;
}> = ({items, renderChildren}) => {
  return (
    <>
      {items.map((item, i) => {
        const hasCheckbox = item.checked !== null && item.checked !== undefined;

        return (
          <li key={i} className="mb-1 ml-0 pl-2">
            {hasCheckbox && (
              <input
                disabled
                readOnly
                checked={item.checked ?? false}
                className="mr-2"
                type="checkbox"
              />
            )}
            {renderChildren(item.children)}
          </li>
        );
      })}
    </>
  );
};

export const VeraListRenderer: React.FC<VeraListRendererProps> = ({node, renderChildren}) => {
  if (node.ordered) {
    return (
      <ol className="mb-4 ml-0 list-decimal pl-6" start={node.start}>
        <ListItems items={node.children} renderChildren={renderChildren} />
      </ol>
    );
  }

  return (
    <ul className="mb-4 ml-0 list-disc pl-6">
      <ListItems items={node.children} renderChildren={renderChildren} />
    </ul>
  );
};
