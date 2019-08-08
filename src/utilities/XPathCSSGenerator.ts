import CSSRuleParser from './CSSRuleParser';
import CSSRule from './css-rules/CSSRule';
import KeyframeCSSRule from './css-rules/KeyframeCSSRule';

const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ID_PLACEHOLDER = 'ID_PLACEHOLDER';
const ID_REGEXP = new RegExp(ID_PLACEHOLDER, 'gm');
const HOST_PRERULE_REGEXP = /\(([^)]*)\)/;

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class XPathCSSGenerator {
	private static index = 0;
	private static cache: Map<string, string> = new Map();
	public id: string;
	private element: HTMLElement;
	private latestCSS: string = null;

	/**
	 * Constructor.
	 */
	constructor(element: HTMLElement) {
		this.element = element;
	}

	/**
	 * Connects it.
	 */
	public connect(): void {}

	/**
	 * Disconnects it.
	 */
	public disconnect(): void {
		this.element.classList.remove(this.id);
	}

	/**
	 * Updates the global style.
	 *
	 * @param {boolean} [disableStyles=true] Set to "false" to not disabling styles.
	 */
	public update(disableStyles: boolean = true): void {
		const cache = (<typeof XPathCSSGenerator>this.constructor).cache;
		const styles = Array.from(this.element.shadowRoot.querySelectorAll('style'));

		if (disableStyles) {
			this.disableStyles(styles);
		}

		const css = styles.map(style => this.getScopedCSS(style.textContent)).join('\n');

		if (css && this.latestCSS !== css) {
			const cached = cache.get(css);

			if (!cached || cached !== this.id) {
				this.element.classList.remove(this.id);

				if (cached) {
					this.id = cached;

					if (!this.element.classList.contains(this.id)) {
						this.element.classList.add(this.id);
					}
				} else {
					this.id = (<typeof XPathCSSGenerator>this.constructor).generateID();

					if (!this.element.classList.contains(this.id)) {
						this.element.classList.add(this.id);
					}

					cache.set(css, this.id);

					const scopedCSS = css.replace(ID_REGEXP, this.id);
					const newStyle = document.createElement('style');

					newStyle.textContent = scopedCSS;
					document.head.appendChild(newStyle);
				}
			}
		} else if (!css) {
			this.element.classList.remove(this.id);
			this.id = null;
		}

		this.latestCSS = css;
	}

	/**
	 * Scopes CSS and returns it.
	 *
	 * @param {string} css CSS code to scope.
	 * @return {string} Scoped CSS.
	 */
	private getScopedCSS(css: string): string {
		const scoped: string[] = [];
		const animationNames = [];

		for (const rule of CSSRuleParser.parse(css)) {
			if (rule instanceof KeyframeCSSRule) {
				animationNames.push(rule.animationName);
				scoped.push(rule.selector + rule.css);
			} else if (rule.children.length > 0) {
				scoped.push(`
						${rule.selector}{
							${rule.children.map(child => this.getScopedRule(child)).join('\n')}
						}
					`);
			} else {
				scoped.push(this.getScopedRule(rule));
			}
		}

		let scopedCSS = scoped.join('\n');

		for (const name of animationNames) {
			scopedCSS = scopedCSS.replace(new RegExp(name, 'gm'), name + '-' + ID_PLACEHOLDER);
		}

		return scopedCSS;
	}

	/**
	 * Scopes a rule.
	 * @param {CSSStyleRule} rule Rule.
	 * @return {string} CSS.
	 */
	private getScopedRule(rule: CSSRule): string {
		const baseSelector = this.element.tagName.toLowerCase() + '.' + ID_PLACEHOLDER;
		let selectors = [];

		if (rule.selector.startsWith(':host')) {
			if (rule.selector.includes('::slotted')) {
				console.warn(
					'Found unsupported CSS rule "::slotted" in selector "' + rule.selector + '". The rule will be ignored'
				);
			} else {
				const hostSelectors = rule.selector.split(',');
				const hostParts = hostSelectors.shift().split('(');
				let hostRule = hostParts[1] || '';
				if (hostRule.includes(':dir')) {
					const match = hostRule.match(HOST_PRERULE_REGEXP);
					if (match && match[1]) {
						hostRule = '[dir="' + match[1] + '"] ';
					}
				}
				selectors.push(hostRule + baseSelector);
				if (hostSelectors.length > 0) {
					for (let i = 0, max = hostSelectors.length; i < max; i++) {
						selectors = selectors.concat(
							this.getXPathSelectorsFromSelectorText(this.element, hostSelectors[i].trim(), baseSelector)
						);
					}
				}
			}
		} else {
			const selectorTexts = rule.selector.split(',');
			for (let i = 0, max = selectorTexts.length; i < max; i++) {
				let selectorText = selectorTexts[i];
				if (selectorText.includes('(') && !selectorText.includes(')') && i < max - 1) {
					selectorText += selectorTexts.splice(i + 1, 1).join('');
					max--;
				}
				selectors = selectors.concat(
					this.getXPathSelectorsFromSelectorText(this.element, selectorText.trim(), baseSelector)
				);
			}
		}

		return selectors.map(selector => selector + ' ' + rule.css).join('\n');
	}

	/**
	 * Returns XPath elements from a selector.
	 *
	 * @param {Element|ShadowRoot} baseElement Parent.
	 * @param {string} selectorText Selector text.
	 * @param {string} baseSelector Previous selector.
	 * @return {string} XPath selector.
	 */
	private getXPathSelectorsFromSelectorText(
		baseElement: Element | ShadowRoot,
		selectorText: string,
		baseSelector: string = null
	): string[] {
		const childSelectors = selectorText.replace(/ *> */g, '>').split(' ');
		const childSelector = childSelectors.shift();
		let selectors = [];

		if (baseElement['shadowRoot']) {
			baseElement = baseElement['shadowRoot'];
		}

		if (childSelector) {
			const childSelectorElement = childSelector.replace(/\[.+\]/g, '').split(':')[0];
			const elements = Array.from(
				baseElement.querySelectorAll(childSelectorElement ? childSelectorElement : childSelector)
			);
			const nextSelectorText = childSelectors.join(' ').trim();

			for (let element of elements) {
				for (let i = 0, max = childSelector.split('>').length - 1; i < max; i++) {
					if (element.parentNode && element.parentNode !== baseElement) {
						element = <Element>element.parentNode;
					}
				}
				if (childSelector === '*') {
					const xPathSelector = element !== baseElement ? ' > ' + this.getXPathSelector(element, baseElement) : '';
					const newSelector = baseSelector + xPathSelector;
					if (!selectors.includes(newSelector)) {
						selectors.push(newSelector);
					}
				} else {
					const xPathSelector =
						element.parentNode !== baseElement
							? ' > ' + this.getXPathSelector(<Element>element.parentNode, baseElement)
							: '';
					const newSelector = baseSelector + xPathSelector + ' > ' + childSelector;
					if (nextSelectorText) {
						for (const selector of this.getXPathSelectorsFromSelectorText(element, nextSelectorText, newSelector)) {
							if (!selectors.includes(selector)) {
								selectors.push(selector);
							}
						}
					} else if (!selectors.includes(newSelector)) {
						selectors.push(newSelector);
					}
				}
			}
		}

		return selectors;
	}

	/**
	 * Returns selector by XPath.
	 *
	 * @param {Element} element Element.
	 * @param {Element|ShadowRoot} baseElement Parent.
	 * @param {string} [nextSelector] Next selector.
	 * @return {string} XPath selector.
	 */
	private getXPathSelector(element: Element, baseElement: Element | ShadowRoot, nextSelector: string = null): string {
		let selector = '';
		nextSelector = nextSelector ? ' > ' + nextSelector : '';

		if (element.id) {
			return element.id;
		} else if (typeof element.className === 'string' && element.className && !element['shadowRoot']) {
			selector =
				'.' +
				element.className
					.replace(/ +/g, ' ')
					.split(' ')
					.join('.') +
				nextSelector;
		} else {
			selector = element.tagName.toLowerCase() + nextSelector;
		}

		if (element.parentNode && element.parentNode !== baseElement) {
			const shadowRoot = element.parentNode['shadowRoot'];
			let slotSelector = '';
			if (shadowRoot) {
				const slotName = element.getAttribute('slot');
				const slotElement = slotName
					? shadowRoot.querySelector('slot[name="' + slotName + '"]')
					: shadowRoot.querySelector('slot');

				if (slotElement && slotElement.parentNode !== shadowRoot) {
					slotSelector = ' > ' + this.getXPathSelector(slotElement.parentNode, shadowRoot, nextSelector);
				}
			}
			const parentSelector = this.getXPathSelector(<HTMLElement>element.parentNode, baseElement, nextSelector);
			selector = parentSelector + slotSelector + ' > ' + selector;
		}

		return selector;
	}

	/**
	 * Disables styles.
	 *
	 * @param {HTMLStyleElement[]} styles Styles.
	 */
	private disableStyles(styles: HTMLStyleElement[]): void {
		for (const style of styles) {
			if (!style.hasAttribute('media')) {
				style.setAttribute('media', 'max-width: 1px');

				if (!style['__originalRemoveAttribute']) {
					style['__originalRemoveAttribute'] = style.removeAttribute;
					style.removeAttribute = function(name) {
						if (name !== 'media') {
							this['__originalRemoveAttribute'].call(this, name);
						}
					};
				}
			}
		}
	}

	/**
	 * Returns an unique ID.
	 * @return {string} ID.
	 */
	private static generateID(): string {
		const index = this.index;
		this.index++;
		return ABC[index] !== undefined ? ABC[index] : 'a' + index;
	}
}
