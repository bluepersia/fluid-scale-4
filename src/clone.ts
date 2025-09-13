/** We need to convert the browser document to a JSON object.
 * This makes it easy to test the parsing without Playwright.
 */

import {
  DocumentClone,
  MediaRuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./clone.types";
import { MEDIA_RULE_TYPE, STYLE_RULE_TYPE } from "./parse";

const FLUID_PROPERTY_NAMES = new Set<string>([
  "font-size",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-indent",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "grid-template-columns",
  "grid-template-rows",
  "background-position-x",
  "background-position-y",
  "--fluid-bg-size",
  "top",
  "left",
  "right",
  "bottom",
  "column-gap",
  "row-gap",
]);

function cloneDocument(document: Document): DocumentClone {
  const result: DocumentClone = {
    styleSheets: [],
  };

  for (const styleSheet of filterAccessibleStyleSheets(document.styleSheets)) {
    const styleSheetClone: StyleSheetClone = {
      cssRules: [],
    };
    for (const rule of Array.from(styleSheet.cssRules)) {
      if (rule.type === STYLE_RULE_TYPE) {
        styleSheetClone.cssRules.push(cloneStyleRule(rule as CSSStyleRule));
      } else if (rule.type === MEDIA_RULE_TYPE) {
        const mediaRuleClone = cloneMediaRule(rule as CSSMediaRule);
        if (mediaRuleClone) {
          styleSheetClone.cssRules.push(mediaRuleClone);
        }
      }
    }
    result.styleSheets.push(styleSheetClone);
  }

  return result;
}

function filterAccessibleStyleSheets(
  styleSheets: StyleSheetList
): CSSStyleSheet[] {
  return Array.from(styleSheets).filter((sheet) => {
    try {
      sheet.cssRules;
      return true;
    } catch (error) {
      return false;
    }
  });
}

function cloneStyleRule(styleRule: CSSStyleRule): StyleRuleClone {
  const result: StyleRuleClone = {
    type: 1,
    selectorText: styleRule.selectorText,
    style: {},
  };
  for (const property of Array.from(styleRule.style)) {
    if (FLUID_PROPERTY_NAMES.has(property))
      result.style[property] = styleRule.style.getPropertyValue(property);
  }
  return result;
}

function cloneMediaRule(mediaRule: CSSMediaRule): MediaRuleClone | null {
  const mediaText = mediaRule.media.mediaText;
  // Regex explanation: matches (min-width: <number>px)
  const match = mediaText.match(/\(min-width:\s*(\d+)px\)/);

  if (match) {
    return {
      type: 4,
      minWidth: Number(match[1]),
      cssRules: Array.from(mediaRule.cssRules).map((rule) =>
        cloneStyleRule(rule as CSSStyleRule)
      ),
    } as MediaRuleClone;
  }
  return null;
}

export { cloneDocument };
