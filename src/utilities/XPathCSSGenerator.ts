const CSS_REGEXP = /[^{]+({[^}]*})/;
const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class XPathCSSGenerator {
	private static index = 0;
	public id: string;
	private element: HTMLElement;
	private globalStyle: HTMLElement;
	private latestCSS: string = null;

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
		document.head.appendChild(this.globalStyle);
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
	}

	/**
	 * Updates the global style.
	 */
	public update(): void {
		const styles = Array.from(this.element.shadowRoot.querySelectorAll('style'));

		for (const style of styles) {
			if (!style.hasAttribute('media')) {
				style.setAttribute('media', 'max-width: 1px');
			}
		}

		const css = this.getCSS(styles);

		if (this.latestCSS !== css) {
			this.latestCSS = css;
			this.globalStyle.textContent = css;
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
