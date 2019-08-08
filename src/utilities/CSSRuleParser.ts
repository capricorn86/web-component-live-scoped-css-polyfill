import CSSRule from './css-rules/CSSRule';
import KeyframeCSSRule from './css-rules/KeyframeCSSRule';
import MediaCSSRule from './css-rules/MediaCSSRule';

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class CSSRuleParser {
	/**
	 * Parses CSS.
	 *
	 * @param {string} css CSS.
	 * @return {CSSRule[]} CSS rules.
	 */
	public static parse(css: string): CSSRule[] {
		const root = new CSSRule();
		const regexp = /{|}/gm;
		const stack = [root];
		let currentRule = root;
		let lastIndex = 0;
		let match;

		css = css.replace(/\/\*.*\*\//gm, '');

		while ((match = regexp.exec(css))) {
			if (match[0] === '{') {
				const selector = css.substring(lastIndex, match.index).trim();
				const newRule = this.createRule(selector, match.index);
				currentRule.children.push(newRule);
				currentRule = newRule;
				stack.push(currentRule);
			} else {
				currentRule.endIndex = match.index + 1;

				currentRule.css = css.substring(currentRule.startIndex, currentRule.endIndex).trim();

				stack.pop();
				currentRule = stack[stack.length - 1];
			}

			lastIndex = match.index + 1;
		}

		return root.children;
	}

	/**
	 * Creates a rule based on the selector.
	 *
	 * @param {string} selector CSS selector.
	 * @param {number} startIndex Start index.
	 * @return {CSSRule} CSS rule.
	 */
	public static createRule(selector: string, startIndex: number): CSSRule {
		let rule = null;
		if (selector.startsWith('@keyframes')) {
			rule = new KeyframeCSSRule();
			rule.animationName = selector.replace('@keyframes', '').trim();
		} else if (selector.startsWith('@media')) {
			rule = new MediaCSSRule();
		} else {
			rule = new CSSRule();
		}
		rule.selector = selector;
		rule.startIndex = startIndex;
		return rule;
	}
}
