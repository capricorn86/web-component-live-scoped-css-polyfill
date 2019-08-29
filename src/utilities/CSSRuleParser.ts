import CSSRule from './css-rules/CSSRule';
import KeyframeCSSRule from './css-rules/KeyframeCSSRule';
import MediaCSSRule from './css-rules/MediaCSSRule';

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class CSSRuleParser {
	private css: string;
	private disableRules: RegExp | string;
	private match: RegExpExecArray = null;
	private regexp: RegExp = /{|}/gm;
	private rootRule: CSSRule = new CSSRule();
	private currentRule: CSSRule = this.rootRule;
	private stack: CSSRule[] = [this.currentRule];
	private isDisabled = false;
	private lastIndex = 0;

	/**
	 * Constructor.
	 *
	 * @param {string} css CSS.
	 * @param {RegExp} [disableRules] Disable rules matching a certain RegExp.
	 */
	constructor(css: string, disableRules: RegExp | string = null) {
		this.css = css.replace(/\/\*.*\*\//gm, '');
		this.disableRules = disableRules;
	}

	/**
	 * Next rule.
	 *
	 * @return {CSSRule} Rule.
	 */
	public next(): CSSRule {
		let returnRule = null;

		this.match = this.regexp.exec(this.css);

		if (!this.match) {
			return null;
		}

		if (this.match[0] === '{') {
			const selector = this.css.substring(this.lastIndex, this.match.index).trim();
			this.isDisabled =
				this.disableRules &&
				((typeof this.disableRules === 'string' && selector.includes(this.disableRules)) ||
					(this.disableRules instanceof RegExp && this.disableRules.test(selector)));

			if (!this.isDisabled) {
				const newRule = this.createRule(selector, this.match.index);

				if (this.currentRule !== this.rootRule) {
					newRule.parent = this.currentRule;
					if (!this.currentRule.hasChildren) {
						returnRule = this.currentRule;
						returnRule.endIndex = this.match.index + 1;
						returnRule.hasChildren = true;
					}
				}

				this.currentRule = newRule;
				this.stack.push(this.currentRule);
			}
		} else if (!this.isDisabled) {
			if (!this.currentRule.hasChildren) {
				returnRule = this.currentRule;

				this.currentRule.endIndex = this.match.index + 1;
				this.currentRule.css = this.css.substring(this.currentRule.startIndex, this.currentRule.endIndex).trim();
			}

			this.stack.pop();
			this.currentRule = this.stack[this.stack.length - 1];
		}

		this.lastIndex = this.match.index + 1;

		if (returnRule) {
			return returnRule;
		} else if (this.currentRule) {
			return this.next();
		}

		return null;
	}

	/**
	 * Creates a rule based on the selector.
	 *
	 * @param {string} selector CSS selector.
	 * @param {number} startIndex Start index.
	 * @return {CSSRule} CSS rule.
	 */
	public createRule(selector: string, startIndex: number): CSSRule {
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
