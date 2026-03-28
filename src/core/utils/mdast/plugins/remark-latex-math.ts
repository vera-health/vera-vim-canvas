import type {Extension as MicromarkExtension, Code, Construct, State} from "micromark-util-types";
import type {Extension as FromMarkdownExtension} from "mdast-util-from-markdown";

// Micromark tokenizer for \(...\)
const tokenizeLatexInlineMath: Construct["tokenize"] = function (effects, ok, nok) {
  return start;

  function start(code: Code): State | undefined {
    if (code !== 92) return nok(code); // '\'
    effects.enter("latexInlineMath" as any);
    effects.enter("latexInlineMathSequence" as any);
    effects.consume(code);

    return openParen;
  }

  function openParen(code: Code): State | undefined {
    if (code !== 40) return nok(code); // '('
    effects.consume(code);
    effects.exit("latexInlineMathSequence" as any);

    return afterOpen;
  }

  function afterOpen(code: Code): State | undefined {
    if (code === null) return nok(code);
    if (code === 92) return closeStart(code); // immediate potential close: \(\)
    effects.enter("latexInlineMathData" as any);

    return data(code);
  }

  function data(code: Code): State | undefined {
    if (code === null) return nok(code);
    if (code === 92) {
      effects.exit("latexInlineMathData" as any);

      return closeStart(code);
    }
    effects.consume(code);

    return data;
  }

  function closeStart(code: Code): State | undefined {
    if (code !== 92) return nok(code);
    effects.enter("latexInlineMathSequence" as any);
    effects.consume(code);

    return closeCheck;
  }

  function closeCheck(code: Code): State | undefined {
    if (code === 41) {
      // valid close: \)
      effects.consume(code);
      effects.exit("latexInlineMathSequence" as any);
      effects.exit("latexInlineMath" as any);

      return ok;
    }

    // False alarm: the backslash belongs to content.
    effects.exit("latexInlineMathSequence" as any);
    effects.enter("latexInlineMathData" as any);
    if (code === null) return nok(code);
    effects.consume(code);

    return data;
  }
};

export function latexInlineMath(): MicromarkExtension {
  return {
    text: {
      92: {tokenize: tokenizeLatexInlineMath},
    },
  };
}

export function latexInlineMathFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      latexInlineMath(token) {
        this.enter({type: "inlineMath", value: ""}, token);
      },
    },
    exit: {
      latexInlineMath(token) {
        const current = this.stack[this.stack.length - 1];

        if (current.type === "inlineMath") {
          let raw = this.sliceSerialize(token);

          if (raw.startsWith("\\(")) raw = raw.slice(2);
          if (raw.endsWith("\\)")) raw = raw.slice(0, -2);
          current.value = raw;
        }
        this.exit(token);
      },
    },
  };
}
