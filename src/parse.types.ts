import { StyleRuleClone } from "./clone.types";

type ParseCSSResult = {
  breakpoints: number[];
};

type StyleBatch = {
  width: number;
  styleRules: StyleRuleClone[];
  isMediaRule: boolean;
};

type StyleBatchState = {
  currentBatch: StyleBatch | null;
  batches: StyleBatch[];
};

export { ParseCSSResult, StyleBatch, StyleBatchState };
