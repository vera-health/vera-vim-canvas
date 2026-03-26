import type {VeraRoot} from "@/types/customAST";

import * as jsondiffpatch from "jsondiffpatch";

import {parseCompleteMarkdown, parsePartialMarkdown} from "./parsers";

interface CustomASTPatchEvent {
  type: "custom_ast_patch";
  patch: any; // jsondiffpatch.Delta
  sequence: number; // Sequence number for ordering
}

export class MDASTStreamProcessor {
  private buffer: string = "";
  private lastAST: VeraRoot | null = null;
  private sequence: number = 0;
  private differ = jsondiffpatch.create({arrays: {detectMove: false}});

  onChunk(chunk: string): CustomASTPatchEvent | null {
    this.buffer += chunk;

    try {
      const ast = parsePartialMarkdown(this.buffer);

      const diff = this.differ.diff(this.lastAST, ast);

      if (!diff) {
        return null;
      }

      this.sequence++;
      this.lastAST = ast;

      return {
        type: "custom_ast_patch",
        patch: diff,
        sequence: this.sequence,
      };
    } catch (error) {
      console.error("CustomAST parse error:", error);

      return null;
    }
  }

  finalize(): CustomASTPatchEvent | null {
    try {
      const ast = parseCompleteMarkdown(this.buffer);

      const diff = this.differ.diff(this.lastAST, ast);

      if (!diff) {
        return null;
      }

      this.sequence++;
      this.lastAST = ast;

      return {
        type: "custom_ast_patch",
        patch: diff,
        sequence: this.sequence,
      };
    } catch (error) {
      console.error("CustomAST final parse error:", error);

      return null;
    }
  }
}
