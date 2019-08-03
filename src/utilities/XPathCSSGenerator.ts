const CSS_REGEXP = /[^{]+({[^}]*})/;
const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
	public connect(): void {
		if (!this.element.classList.contains(this.id)) {
			this.element.classList.add(this.id);
		}
	}

	/**
	 * Disconnects it.
	 */
	public disconnect(): void {
		this.element.classList.remove(this.id);
	}

	/**
	 * Updates the global style.
	 */
	public update(): void {
		const cache = (<typeof XPathCSSGenerator>this.constructor).cache;
		const styles = Array.from(this.element.shadowRoot.querySelectorAll('style'));

		let css = this.getCSS(styles);

		for (const style of styles) {
			if (!style.hasAttribute('media')) {
				style.setAttribute('media', 'max-width: 1px');
			}
		}

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

					const scopedCSS = css.replace(/{ID_PLACEHOLDER}/gm, this.id);
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
	 * Scopes CSS.
	 *
	 * @param {HTMLStyleElement} styles Styles.
	 * @return {string} Generated CSS.
	 */
	private getCSS(styles: HTMLStyleElement[]): string {
		const scoped: string[] = [];
		const animationNames = [];

		for (const style of styles) {
			let clone = style;
			if (!clone.sheet) {
				clone = <HTMLStyleElement>style.cloneNode(true);
				document.head.appendChild(clone);
			}
			if (clone.sheet['cssRules']) {
				const rules: CSSStyleRule[] = Array.from(clone.sheet['cssRules']);
				for (const rule of rules) {
					if (this.element.tagName.toLowerCase() === 'kompis-navigation') {
						console.log(rule.cssText);
					}
					if (rule instanceof CSSKeyframesRule) {
						animationNames.push(rule.name);
						scoped.push(rule.cssText);
					} else if (rule instanceof CSSMediaRule) {
						const mediaScoped = [];
						const childRules: CSSStyleRule[] = <CSSStyleRule[]>Array.from(rule.cssRules);
						for (const childRule of childRules) {
							mediaScoped.push(this.scopeRule(childRule));
						}
						scoped.push(`
							@media ${rule.conditionText}{
								${mediaScoped.join('\n')}
							}
						`);
					} else {
						scoped.push(this.scopeRule(rule));
					}
				}
			}
			if (clone !== style) {
				document.head.removeChild(clone);
			}
		}

		let css = scoped.join('\n');

		for (const name of animationNames) {
			css = css.replace(name, name + '-{ID_PLACEHOLDER}');
		}

		return scoped.join('\n');
	}

	/**
	 * Scopes a rule.
	 * @param {CSSStyleRule} rule Rule.
	 * @return {string} CSS.
	 */
	private scopeRule(rule: CSSStyleRule): string {
		const baseSelector = this.element.tagName.toLowerCase() + '.{ID_PLACEHOLDER}';
		const cssTextMatch = rule.cssText.match(CSS_REGEXP);
		const cssText = cssTextMatch ? cssTextMatch[1] : '{}';
		let selectors = [];

		if (rule.selectorText === ':host') {
			selectors.push(baseSelector);
		} else {
			const selectorTexts = rule.selectorText.split(',');
			for (let selectorText of selectorTexts) {
				selectors = selectors.concat(
					this.getXPathSelectorsFromSelectorText(this.element, selectorText.trim(), baseSelector)
				);
			}
		}

		return selectors.map(selector => selector + ' ' + cssText).join('\n');
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
		const childSelectors = selectorText.split(/[> ]+/g);
		const childSelector = childSelectors.shift();
		let selectors = [];

		if (baseElement['shadowRoot']) {
			baseElement = baseElement['shadowRoot'];
		}

		if (childSelector) {
			const elements = Array.from(baseElement.querySelectorAll(childSelector));
			const nextSelectorText = childSelectors.join(' ').trim();

			for (const element of elements) {
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
	 * Returns an unique ID.
	 * @return {string} ID.
	 */
	private static generateID(): string {
		const index = this.index;
		this.index++;
		return ABC[index] !== undefined ? ABC[index] : 'a' + index;
	}
}
