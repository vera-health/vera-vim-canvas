/* eslint-disable @typescript-eslint/no-explicit-any -- micromark custom token names require `as any` casts */
import type {Extension as MicromarkExtension, Code, Construct, Effects, State, TokenizeContext} from "micromark-util-types";
import type {Extension as FromMarkdownExtension} from "mdast-util-from-markdown";

function isLineEnding(code: Code): boolean {
  return code === -5 || code === -4 || code === -3;
}

// Micromark tokenizer for \[...\]
const tokenizeLatexBlockMath: Construct["tokenize"] = function (effects, ok, nok) {
  const self = this; // eslint-disable-line @typescript-eslint/no-this-alias -- micromark tokenizer pattern requires this aliasing
  const tail = self.events[self.events.length - 1];
  const initialSize =
    tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;

  return start;

  function start(code: Code): State | undefined {
    effects.enter("latexBlockMath" as any);
    effects.enter("latexBlockMathFence" as any);
    effects.enter("latexBlockMathFenceSequence" as any);

    return sequenceOpen(code);
  }

  function sequenceOpen(code: Code): State | undefined {
    if (code !== 92) return nok(code); // '\'
    effects.consume(code);

    return sequenceOpenBracket;
  }

  function sequenceOpenBracket(code: Code): State | undefined {
    if (code !== 91) return nok(code); // '['
    effects.consume(code);
    effects.exit("latexBlockMathFenceSequence" as any);

    return openWhitespace;
  }

  function openWhitespace(code: Code): State | undefined {
    if (code === 32 || code === -2) {
      effects.consume(code);

      return openWhitespace;
    }

    return openAfter(code);
  }

  function openAfter(code: Code): State | undefined {
    if (code !== null && !isLineEnding(code)) return nok(code);
    effects.exit("latexBlockMathFence" as any);
    if (self.interrupt) return ok(code);

    return effects.attempt(nonLazyContinuation, beforeNonLazyContinuation, after)(code);
  }

  function beforeNonLazyContinuation(code: Code): State | undefined {
    return effects.attempt(
      {tokenize: tokenizeClosingFence, partial: true},
      after,
      contentStart,
    )(code);
  }

  function contentStart(code: Code): State | undefined {
    if (initialSize > 0) {
      let seen = 0;
      const contentPrefix = (prefixCode: Code): State | undefined => {
        if (seen < initialSize && (prefixCode === 32 || prefixCode === -2)) {
          seen++;
          effects.consume(prefixCode);

          return contentPrefix;
        }

        return beforeContentChunk(prefixCode);
      };

      return contentPrefix(code);
    }

    return beforeContentChunk(code);
  }

  function beforeContentChunk(code: Code): State | undefined {
    if (code === null) return after(code);
    if (isLineEnding(code)) {
      return effects.attempt(nonLazyContinuation, beforeNonLazyContinuation, after)(code);
    }
    effects.enter("latexBlockMathValue" as any);

    return contentChunk(code);
  }

  function contentChunk(code: Code): State | undefined {
    if (code === null || isLineEnding(code)) {
      effects.exit("latexBlockMathValue" as any);

      return beforeContentChunk(code);
    }
    effects.consume(code);

    return contentChunk;
  }

  function after(code: Code): State | undefined {
    effects.exit("latexBlockMath" as any);

    return ok(code);
  }

  function tokenizeClosingFence(effects2: Effects, ok2: State, nok2: State) {
    let prefix = 0;

    return beforePrefix;

    function beforePrefix(code: Code): State | undefined {
      if ((code === 32 || code === -2) && prefix < 4) {
        prefix++;
        effects2.consume(code);

        return beforePrefix;
      }

      return beforeSequenceClose(code);
    }

    function beforeSequenceClose(code: Code): State | undefined {
      effects2.enter("latexBlockMathFence" as any);
      effects2.enter("latexBlockMathFenceSequence" as any);
      if (code !== 92) return nok2(code);
      effects2.consume(code);

      return sequenceClose;
    }

    function sequenceClose(code: Code): State | undefined {
      if (code !== 93) return nok2(code);
      effects2.consume(code);
      effects2.exit("latexBlockMathFenceSequence" as any);

      return closeWhitespace;
    }

    function closeWhitespace(code: Code): State | undefined {
      if (code === 32 || code === -2) {
        effects2.consume(code);

        return closeWhitespace;
      }

      return afterSequenceClose(code);
    }

    function afterSequenceClose(code: Code): State | undefined {
      if (code !== null && !isLineEnding(code)) return nok2(code);
      effects2.exit("latexBlockMathFence" as any);

      return ok2(code);
    }
  }
};

const nonLazyContinuation: Construct = {
  tokenize: tokenizeNonLazyContinuation,
  partial: true,
};

function tokenizeNonLazyContinuation(this: TokenizeContext, effects: Effects, ok: State, nok: State) {
  const self = this; // eslint-disable-line @typescript-eslint/no-this-alias -- micromark tokenizer pattern

  return start;

  function start(code: Code): State | undefined {
    if (code === null) return ok(code);
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");

    return lineStart;
  }

  function lineStart(code: Code): State | undefined {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
  }
}

export function latexBlockMath(): MicromarkExtension {
  return {
    flow: {
      92: {
        tokenize: tokenizeLatexBlockMath,
        concrete: true,
      },
    },
  };
}

export function latexBlockMathFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      latexBlockMath(token) {
        this.enter({type: "math", value: ""}, token);
      },
    },
    exit: {
      latexBlockMath(token) {
        const current = this.stack[this.stack.length - 1];

        if (current.type === "math") {
          let raw = this.sliceSerialize(token);

          if (raw.startsWith("\\[")) raw = raw.slice(2);
          if (raw.endsWith("\\]")) raw = raw.slice(0, -2);
          current.value = raw;
        }
        this.exit(token);
      },
    },
  };
}
