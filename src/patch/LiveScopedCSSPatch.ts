import XPathCSSGenerator from '../utilities/XPathCSSGenerator';

const libraryRenderMethods = [
	'update', // lit-element
	'renderedCallback', //skate.js
	'render', //slimjs && hybrid.js
	'requestRender' // popular
];
const originalDefine = window.customElements.define;

window.customElements.define = function(name, componentClass) {
	const disableComponents = window['liveScopedCSSPolyfill'].disableComponents;

	if (!disableComponents || !disableComponents.includes(name)) {
		const renderMethod = window['liveScopedCSSPolyfill'].renderMethod;
		const disableRules = window['liveScopedCSSPolyfill'].disableRules;
		const scopeAttributeName = window['liveScopedCSSPolyfill'].scopeAttributeName;
		const debug = window['liveScopedCSSPolyfill'].debug;
		const onlyScopeOnConnected = window['liveScopedCSSPolyfill'].onlyScopeOnConnected === true;
		const renderMethods = renderMethod !== 'auto' ? [renderMethod] : libraryRenderMethods;
		const originalConnectedCallback = componentClass.prototype.connectedCallback;
		const originalDisconnectedCallback = componentClass.prototype.disconnectedCallback;
		const originalRemoveAttribute = componentClass.prototype.removeAttribute;

		if (!onlyScopeOnConnected) {
			for (const renderMethod of renderMethods) {
				if (componentClass.prototype[renderMethod]) {
					const originalRender = componentClass.prototype[renderMethod];

					componentClass.prototype[renderMethod] = function() {
						const result = originalRender.call(this);
						this.updateScopedCSSPolyfill();
						return result;
					};

					break;
				}
			}
		}

		componentClass.prototype.updateScopedCSSPolyfill = function() {
			if (window['ShadyDOM']) {
				window['ShadyDOM'].flush();
			}

			if (this.__xPathCSSGenerator) {
				this.__xPathCSSGenerator.update();
			}
		};

		componentClass.prototype.connectedCallback = function() {
			this.__xPathCSSGenerator = new XPathCSSGenerator(this, { disableRules, debug, scopeAttributeName });
			this.__xPathCSSGenerator.connect();
			if (originalConnectedCallback) {
				originalConnectedCallback.call(this);
			}
			if (onlyScopeOnConnected) {
				this.__xPathCSSGenerator.update();
			}
		};

		componentClass.prototype.disconnectedCallback = function() {
			this.__xPathCSSGenerator.disconnect();
			if (originalDisconnectedCallback) {
				originalDisconnectedCallback.call(this);
			}
		};

		componentClass.prototype.removeAttribute = function(name: string) {
			if (name !== scopeAttributeName) {
				originalRemoveAttribute.call(this, name);
			}
		};
	}

	originalDefine.call(this, name, componentClass);
};
