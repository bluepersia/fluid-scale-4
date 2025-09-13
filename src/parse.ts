import {
  DocumentClone,
  MediaRuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./clone.types";
import { ParseCSSResult, StyleBatch, StyleBatchState } from "./parse.types";

const STYLE_RULE_TYPE = 1;
const MEDIA_RULE_TYPE = 4;

export { MEDIA_RULE_TYPE, STYLE_RULE_TYPE };

function parseCSS(doc: DocumentClone): ParseCSSResult {
  const breakpoints: Set<number> = new Set();
  let globalBaselineWidth: number = 375;

  for (const styleSheet of doc.styleSheets) {
    for (const rule of styleSheet.cssRules) {
      if (rule.type === MEDIA_RULE_TYPE) {
        const mediaRule = rule as MediaRuleClone;
        breakpoints.add(mediaRule.minWidth);
        if (mediaRule.cssRules.length === 0)
          globalBaselineWidth = mediaRule.minWidth;
      }
    }
  }

  return {
    breakpoints: Array.from(breakpoints),
  };
}

function parseStyleSheet(
  styleSheet: StyleSheetClone,
  globalBaselineWidth: number
): void {
  const baselineMediaRule = styleSheet.cssRules.find(
    (rule) =>
      rule.type === MEDIA_RULE_TYPE &&
      (rule as MediaRuleClone).cssRules.length === 0
  ) as MediaRuleClone;

  const baselineWidth = baselineMediaRule?.minWidth ?? globalBaselineWidth;

  const batches = batchStyleSheet(styleSheet, baselineWidth);
}

function batchStyleSheet(
  styleSheet: StyleSheetClone,
  baselineWidth: number
): StyleBatch[] {
  const state: StyleBatchState = {
    currentBatch: null,
    batches: [],
  };
  for (const rule of styleSheet.cssRules) {
    if (rule.type === STYLE_RULE_TYPE) {
      state.currentBatch = batchStyleRule(state, baselineWidth);
      state.currentBatch.styleRules.push(rule as StyleRuleClone);
    } else if (rule.type === MEDIA_RULE_TYPE) {
      state.currentBatch = null;
      state.batches.push(batchMediaRule(rule as MediaRuleClone));
    }
  }
  return state.batches;
}

function batchStyleRule(
  state: StyleBatchState,
  baselineWidth: number
): StyleBatch {
  return (
    state.currentBatch || {
      width: baselineWidth,
      styleRules: [],
      isMediaRule: false,
    }
  );
}

function batchMediaRule(mediaRule: MediaRuleClone): StyleBatch {
  return {
    width: mediaRule.minWidth,
    styleRules: mediaRule.cssRules,
    isMediaRule: true,
  };
}
