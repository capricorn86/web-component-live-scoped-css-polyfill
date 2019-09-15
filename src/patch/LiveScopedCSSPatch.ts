import XPathCSSGenerator from '../utilities/XPathCSSGenerator';

const libraryRenderMethods = [
	'requestRender', // popular
	'update', // lit-element
	'componentDidRender', // stenciljs
	'renderer', //skate.js
	'onRender', // slimjs
	'render' //hybrid.js
];
const originalDefine = window.customElements.define;

window.customElements.define = function(name, componentClass) {
	const renderMethod = window['liveScopedCSSPolyfill'].renderMethod;
	const disableRules = window['liveScopedCSSPolyfill'].disableRules;
	const debug = window['liveScopedCSSPolyfill'].debug;
	const onlyScopeOnConnected = window['liveScopedCSSPolyfill'].onlyScopeOnConnected === true;
	const renderMethods = renderMethod !== 'auto' ? [renderMethod] : libraryRenderMethods;
	const originalConnectedCallback = componentClass.prototype.connectedCallback;
	const originalDisconnectedCallback = componentClass.prototype.disconnectedCallback;
	const originalSetAttribute = componentClass.prototype.setAttribute;
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
		this.__xPathCSSGenerator = new XPathCSSGenerator(this, { disableRules, debug });
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

	componentClass.prototype.setAttribute = function(name: string, value: string) {
		if (name === 'class' && this.__xPathCSSGenerator.id) {
			const classes = value ? value.split(' ') : [];
			if (!classes.includes(this.__xPathCSSGenerator.id)) {
				value = classes.concat(this.__xPathCSSGenerator.id).join(' ');
			}
		}
		originalSetAttribute.call(this, name, value);
	};

	componentClass.prototype.removeAttribute = function(name: string) {
		if (name !== 'class') {
			originalRemoveAttribute.call(this, name);
		}
	};

	originalDefine.call(this, name, componentClass);
};
