import type {VeraHeading, VeraNode} from "@/types/customAST";

import React from "react";

interface VeraHeadingRendererProps {
  node: VeraHeading;
  renderChildren: (children: VeraNode[]) => React.ReactNode;
}

export const VeraHeadingRenderer: React.FC<VeraHeadingRendererProps> = ({node, renderChildren}) => {
  const children = renderChildren(node.children);

  switch (node.depth) {
    case 1:
      return <h1 className="mb-3 text-base font-semibold leading-6">{children}</h1>;
    case 2:
      return <h2 className="mb-2 text-[15px] font-semibold leading-6">{children}</h2>;
    case 3:
      return <h3 className="mb-2 text-sm font-semibold leading-5">{children}</h3>;
    case 4:
      return <h4 className="mb-2 text-sm font-semibold leading-5">{children}</h4>;
    case 5:
      return <h5 className="mb-2 text-sm font-medium leading-5">{children}</h5>;
    case 6:
      return <h6 className="mb-2 text-sm font-medium leading-5">{children}</h6>;
  }
};
