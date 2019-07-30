const CSS_REGEXP = /[^{]+({[^}]*})/;
const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class XPathCSSGenerator {
	private static index = 0;
	private static cache = new Map();
	public id: string;
	public cachedId: string;
	private element: HTMLElement;
	private globalStyle: HTMLElement;

	/**
	 * Constructor.
	 */
	constructor(element: HTMLElement) {
		this.element = element;
		this.id = (<typeof XPathCSSGenerator>this.constructor).generateID();
		this.globalStyle = document.createElement('style');
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
		document.head.removeChild(this.globalStyle);
		this.element.classList.remove(this.id);
		this.element.classList.remove(this.cachedId);
	}

	/**
	 * Updates the global style.
	 */
	public update(): void {
		const cache = (<typeof XPathCSSGenerator>this.constructor).cache;
		const styles = Array.from(this.element.shadowRoot.querySelectorAll('style'));
		const css = styles.map(style => style.textContent);
		const cached = cache.get(css);

		for (const style of styles) {
			style.setAttribute('media', 'max-width: 1px');
		}

		if (this.cachedId && this.cachedId !== this.id) {
			this.element.classList.remove(this.cachedId);
		}

		if (cached) {
			if (cached.id !== this.id) {
				this.element.classList.add(cached.id);
			}

			this.cachedId = cached.id;

			document.head.removeChild(this.globalStyle);
		} else {
			const generated = this.getCSS(styles);
			this.globalStyle.textContent = generated;

			if (!Array.from(document.head.childNodes).includes(this.globalStyle)) {
				document.head.appendChild(this.globalStyle);
			}

			cache.set(css, {
				css: generated,
				id: this.id
			});
		}
	}

	/**
	 * Scopes CSS.
	 *
	 * @param {HTMLStyleElement} styles Styles.
	 * @return {string} Generated CSS.
	 */
	private getCSS(styles: HTMLStyleElement[]): string {
		const baseSelector = '.' + this.id;
		const scoped: string[] = [];

		for (const style of styles) {
			if (style.sheet['cssRules']) {
				const rules: CSSStyleRule[] = Array.from(style.sheet['cssRules']);
				for (const rule of rules) {
					const cssTextMatch = rule.cssText.match(CSS_REGEXP);
					const cssText = cssTextMatch ? cssTextMatch[1] : '{}';
					const selectors = [];

					if (rule.selectorText === ':host') {
						selectors.push(baseSelector);
					} else {
						const matchingElements = Array.from(this.element.shadowRoot.querySelectorAll(rule.selectorText));
						for (const element of matchingElements) {
							const xPathSelector =
								element.parentNode !== this.element.shadowRoot
									? ' > ' + this.getXPathSelector(<Element>element.parentNode)
									: '';
							const selector = baseSelector + xPathSelector + ' > ' + rule.selectorText;
							if (!selectors.includes(selector)) {
								selectors.push(selector);
							}
						}
					}

					const css = selectors.map(selector => selector + ' ' + cssText).join('\n');
					scoped.push(css);
				}
			}
		}

		return scoped.join('\n');
	}

	/**
	 * Returns selector by XPath.
	 *
	 * @param {Element} element Element.
	 * @param {string} [nextSelector] Next selector.
	 * @return {string} XPath selector.
	 */
	private getXPathSelector(element: Element, nextSelector: string = null): string {
		let selector = '';
		nextSelector = nextSelector ? ' > ' + nextSelector : '';

		if (element.id) {
			return element.id;
		} else if (element.className) {
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

		if (element.parentNode !== this.element.shadowRoot) {
			const parentSelector = this.getXPathSelector(<HTMLElement>element.parentNode, nextSelector);
			selector = parentSelector + ' > ' + selector;
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
