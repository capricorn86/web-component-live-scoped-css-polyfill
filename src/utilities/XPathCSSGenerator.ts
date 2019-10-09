import CSSRuleParser from './CSSRuleParser';
import CSSRule from './css-rules/CSSRule';
import KeyframeCSSRule from './css-rules/KeyframeCSSRule';
import MediaCSSRule from './css-rules/MediaCSSRule';

const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ID_PLACEHOLDER = 'ID_PLACEHOLDER';
const ID_REGEXP = new RegExp(ID_PLACEHOLDER, 'gm');

/**
 * Utility for scoping css by finding a unique path to it.
 */
export default class XPathCSSGenerator {
	private static index = 0;
	private static cache: { [k: string]: string } = {};
	public id: string;
	private element: HTMLElement;
	private latestCacheKey: string = null;
	private disableRules: RegExp | string;
	private debug: boolean;

	/**
	 * Constructor.
	 *
	 * @param {HTMLElement} element Element.
	 * @param {object} [options] Options.
	 * @param {RegExp|string} [options.disableRules] Disable rules matching a certain RegExp.
	 * @param {boolean} [options.debug] Set to "true" to enable debugging.
	 */
	constructor(
		element: HTMLElement,
		options: { disableRules: RegExp | string; debug: boolean } = {
			disableRules: null,
			debug: false
		}
	) {
		this.element = element;
		this.disableRules = options.disableRules;
		this.debug = options.debug;
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
	 */
	public update(): void {
		const cache = (<typeof XPathCSSGenerator>this.constructor).cache;
		const styles = Array.from(this.element.shadowRoot.querySelectorAll('style'));
		const cacheKey = this.getCacheKey(this.element);

		this.disableStyles(styles);

		if (cacheKey && this.latestCacheKey !== cacheKey) {
			const cached = cache[cacheKey];

			if (!cached || cached !== this.id) {
				if (cached !== undefined) {
					if (this.id !== cached) {
						this.element.classList.remove(this.id);
						this.id = null;
					}

					if (this.debug) {
						console.log(
							'LiveScropedCSSPolyfill: Used DOM tree cache for "' + this.element.tagName.toLowerCase() + '".',
							this.element
						);
					}

					if (cached !== '') {
						if (this.id !== cached) {
							this.element.classList.add(cached);
						}

						this.id = cached;
					}
				} else {
					const css = styles.map(style => style.textContent).join('\n');
					const scoped = css ? this.getScopedCSS(css) : null;

					if (this.debug) {
						console.log(
							'LiveScropedCSSPolyfill: Generated new CSS for "' + this.element.tagName.toLowerCase() + '".',
							this.element
						);
					}

					if (scoped) {
						this.element.classList.remove(this.id);
						this.id = (<typeof XPathCSSGenerator>this.constructor).generateID();
						this.element.classList.add(this.id);

						cache[cacheKey] = this.id;

						const newStyle = document.createElement('style');

						newStyle.textContent = scoped.replace(ID_REGEXP, this.id);
						document.head.appendChild(newStyle);
					} else {
						cache[cacheKey] = '';
						this.element.classList.remove(this.id);
						this.id = null;
					}
				}
			}
		} else if (!cacheKey) {
			this.element.classList.remove(this.id);
			this.id = null;
		}

		this.latestCacheKey = cacheKey;
	}

	/**
	 * Scopes CSS and returns it.
	 *
	 * @param {string} css CSS code to scope.
	 * @return {string} Scoped CSS.
	 */
	private getScopedCSS(css: string): string {
		const animationNames = [];
		const parser = new CSSRuleParser(css, this.disableRules);
		const cache = {};
		let hasParent = false;
		let scoped = '';
		let rule;

		while ((rule = parser.next())) {
			if (hasParent && !rule.parent) {
				scoped += '}\n';
			}

			if (rule instanceof KeyframeCSSRule) {
				const newName = rule.animationName + '-' + ID_PLACEHOLDER;

				if (!animationNames.includes(rule.animationName)) {
					animationNames.push(rule.animationName);
				}

				scoped += rule.selector.replace(rule.animationName, newName) + ' {\n';
			} else if (rule instanceof MediaCSSRule) {
				scoped += rule.selector + '{\n';
			} else if (rule.parent instanceof KeyframeCSSRule) {
				scoped += rule.selector + rule.css + '\n';
			} else {
				scoped += this.getScopedRule(rule, cache) + '\n';
			}

			hasParent = !!rule.parent;
		}

		for (const name of animationNames) {
			scoped = scoped
				.replace(new RegExp('animation-name[ ]*:[ ]*' + name, 'gm'), 'animation-name: ' + name + '-' + ID_PLACEHOLDER)
				.replace(new RegExp('animation[ ]*:[ ]*' + name, 'gm'), 'animation: ' + name + '-' + ID_PLACEHOLDER);
		}

		return scoped;
	}

	/**
	 * Scopes a rule.
	 * @param {CSSStyleRule} rule Rule.
	 * @param {object} cache cache.
	 * @return {string} CSS.
	 */
	private getScopedRule(rule: CSSRule, cache: { [k: string]: Element[] }): string {
		const baseSelector = this.element.tagName.toLowerCase() + '.' + ID_PLACEHOLDER;
		let selectors = '';
		let css = rule.css;

		const selectorTexts = rule.selector.split(',');

		for (let i = 0, max = selectorTexts.length; i < max; i++) {
			let selectorText = selectorTexts[i].trim();

			if (selectorText.startsWith(':host-context')) {
				const selectorParts = selectorText.split(' ');
				const contextSelector = selectorParts[0].replace(':host-context(', '').replace(')', '');
				const elementSelector = selectorParts[1] ? selectorParts[1].trim() : null;

				if (elementSelector) {
					selectors += this.getScopedCSSForElement({
						baseElement: this.element,
						css,
						selectorText: elementSelector,
						baseSelector: contextSelector + ' ' + baseSelector,
						cache,
						walkIntoShadowRoots: true
					});
				} else {
					selectors += contextSelector + ' ' + baseSelector + ' ' + css + '\n';
				}
			} else if (selectorText.startsWith('::slotted')) {
				const shadowRoot = this.element.shadowRoot || this.element;
				const selectorWithoutSlotted = rule.selector
					.replace('::slotted', '')
					.replace('(', '')
					.replace(')', '')
					.trim();
				const slots = Array.from(shadowRoot.querySelectorAll('slot'));
				for (const slot of slots) {
					const xPathSelector = this.getXPathSelector(slot, shadowRoot);
					xPathSelector.pop();
					xPathSelector.push(selectorWithoutSlotted);
					const newCSS = baseSelector + ' > ' + xPathSelector.join(' > ') + css + '\n';
					if (!selectors.includes(newCSS)) {
						selectors += newCSS;
					}
				}
			} else if (selectorText.startsWith(':host')) {
				if (selectorText.includes('(')) {
					console.warn(
						'Found unsupported CSS rule "' +
							selectorText +
							'" in selector "' +
							rule.selector +
							'". The rule will be ignored.'
					);
				} else {
					selectors += baseSelector + ' ' + css + '\n';
				}
			} else {
				if (selectorText.includes('(') && !selectorText.includes(')') && i < max - 1) {
					selectorText += selectorTexts.splice(i + 1, 1).join('');
					max--;
				}
				selectors += this.getScopedCSSForElement({
					baseElement: this.element,
					css,
					selectorText,
					baseSelector,
					cache,
					walkIntoShadowRoots: true
				});
			}
		}

		return selectors;
	}

	/**
	 * Returns XPath elements from a selector.
	 *
	 * @param {options} options Options.
	 * @param {Element|ShadowRoot} options.baseElement Parent.
	 * @param {string} options.css CSS.
	 * @param {string} options.selectorText Selector text.
	 * @param {string} options.baseSelector Previous selector.
	 * @param {object} options.cache cache.
	 * @param {boolean} options.walkIntoShadowRoots "true" to walk into shadow roots.
	 * @return {string} CSS with XPath selector.
	 */
	private getScopedCSSForElement(options: {
		baseElement: Element | ShadowRoot;
		css: string;
		selectorText: string;
		baseSelector: string;
		cache: { [k: string]: Element[] };
		walkIntoShadowRoots: boolean;
	}): string {
		const { css, selectorText, baseSelector, cache, walkIntoShadowRoots } = options;
		const childSelectors = selectorText.replace(/ *> */g, '>').split(' ');
		const childSelector = childSelectors.shift();
		let { baseElement } = options;
		let selectors = '';

		if (walkIntoShadowRoots && baseElement['shadowRoot']) {
			baseElement = baseElement['shadowRoot'];
		}

		if (childSelector && !childSelector.startsWith('@')) {
			const selectorWithoutAttribute = !childSelector.startsWith('[')
				? childSelector.replace(/\[.+\]/g, '')
				: childSelector;
			const childSelectorElement = selectorWithoutAttribute.split(':')[0];
			const elementSelector = childSelectorElement ? childSelectorElement : childSelector;
			const cached =
				baseElement === this.element || baseElement === this.element['shadowRoot'] ? cache[elementSelector] : null;
			const elements: Element[] = cached ? cached : Array.from(baseElement.querySelectorAll(elementSelector));
			const nextSelectorText = childSelectors.join(' ').trim();

			if (baseElement === this.element || baseElement === this.element['shadowRoot']) {
				cache[elementSelector] = elements;
			}

			for (let element of elements) {
				for (let i = 0, max = childSelector.split('>').length - 1; i < max; i++) {
					if (element.parentNode && element.parentNode !== baseElement) {
						element = <Element>element.parentNode;
					}
				}

				if (childSelector === '*') {
					const xPathSelector =
						element !== baseElement ? ' > ' + this.getXPathSelector(element, baseElement).join(' > ') : '';
					const newSelector = baseSelector + xPathSelector;
					const newCSS = newSelector + css + '\n';
					if (!selectors.includes(newCSS)) {
						selectors += newCSS;
					}
				} else {
					let useChildSelector = childSelector;
					let isId = childSelector[0] === '#';
					let xPathSelector = '';
					if (!isId && element !== baseElement && element['shadowRoot'] !== baseElement) {
						const selector = this.getXPathSelector(<Element>element, baseElement);
						isId = selector[0][0] === '#';
						if (isId) {
							useChildSelector = selector[0];
						} else {
							selector.pop();
							selector.unshift('');
							xPathSelector = selector.join(' > ');
						}
					}
					const scope = isId ? ' ' : ' > ';
					const newSelector = baseSelector + xPathSelector + scope + useChildSelector;
					if (!isId && nextSelectorText) {
						const newCSS = this.getScopedCSSForElement({
							baseElement: element,
							css,
							selectorText: nextSelectorText,
							baseSelector: newSelector,
							cache,
							walkIntoShadowRoots
						});
						if (!selectors.includes(newCSS)) {
							selectors += newCSS;
						}
					} else if (!selectors.includes(newSelector)) {
						const newCSS = newSelector + css + '\n';
						if (!selectors.includes(newCSS)) {
							selectors += newCSS;
						}
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
	 * @return {string[]} XPath selector.
	 */
	private getXPathSelector(element: Element, baseElement: Element | ShadowRoot): string[] {
		let selector = [];

		if (element.id) {
			return ['#' + element.id];
		} else if (typeof element.className === 'string' && element.className && !element['shadowRoot']) {
			selector.unshift('.' + Array.prototype.slice.apply(element.classList).join('.'));
		} else if (typeof element.className === 'string' && element.className && !element['shadowRoot']) {
			selector.unshift('.' + Array.prototype.slice.apply(element.classList).join('.'));
		} else {
			selector.unshift(element.tagName.toLowerCase());
		}
		if (element.parentNode) {
			const shadowRoot = element.parentNode['shadowRoot'];

			if (shadowRoot) {
				const slotName = element.getAttribute('slot');
				const slotSelector = slotName ? 'slot[name="' + slotName + '"]' : 'slot';
				const slotElement = shadowRoot.querySelector(slotSelector);

				if (slotElement && slotElement.parentNode !== shadowRoot) {
					selector = this.getXPathSelector(slotElement.parentNode, shadowRoot).concat(selector);
				}
			}

			if (element.parentNode !== baseElement) {
				const parentSelector = this.getXPathSelector(<HTMLElement>element.parentNode, baseElement);
				selector = parentSelector.concat(selector);
			}
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
	 * Returns a cache key.
	 *
	 * @param {ShadowRoot|Element} element Element.
	 * @return {string} Cache key.
	 */
	private getCacheKey(element: Element): string {
		const structureElement = element.shadowRoot || element;
		let key = this.getElementSignature(element);

		if (structureElement.children) {
			for (let i = 0, max = structureElement.children.length; i < max; i++) {
				const child = structureElement.children[i];
				if (child.tagName === 'STYLE') {
					key += child.outerHTML;
				} else if (child.tagName !== 'SLOT') {
					key += this.getCacheKey(child);
				}
			}
		}

		return key;
	}

	/**
	 * Returns an elements signature.
	 *
	 * @param {ShadowRoot|Element} element Element.
	 * @return {string} Signature.
	 */
	private getElementSignature(element: Element): string {
		if (element['__signatureString'] === undefined) {
			let signature = element.tagName;
			if (!element.shadowRoot) {
				for (let i = 0, max = element.attributes.length; i < max; i++) {
					signature += element.attributes[i].name + '=' + element.attributes[i].value;
				}
			}
			element['__signatureString'] = signature;
		}

		return element['__signatureString'];
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
