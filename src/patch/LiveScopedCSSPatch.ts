import XPathCSSGenerator from '../utilities/XPathCSSGenerator';

const libraryRenderMethods = [
	'requestRender', // popular
	'requestUpdate', // lit-element
	'componentDidRender', // stenciljs
	'renderer', //skate.js
	'onRender', // slimjs
	'render' //hybrid.js
];
const originalDefine = window.customElements.define;

window.customElements.define = function(name, componentClass) {
	const renderMethod = window['liveScopedCSS'].renderMethod;
	const originalConnectedCallback = componentClass.prototype.connectedCallback;
	const originalDisconnectedCallback = componentClass.prototype.disconnectedCallback;
	const renderMethods = renderMethod ? [renderMethod] : libraryRenderMethods;

	for (const renderMethod of renderMethods) {
		if (componentClass.prototype[renderMethod]) {
			const originalRender = componentClass.prototype[renderMethod];

			componentClass.prototype[renderMethod] = function() {
				const result = originalRender.call(this);

				if (window['ShadyDOM']) {
					window['ShadyDOM'].flush();
				}

				if (this.__xPathCSSGenerator) {
					this.__xPathCSSGenerator.update();
				}

				return result;
			};

			break;
		}
	}

	componentClass.prototype.connectedCallback = function() {
		this.__xPathCSSGenerator = new XPathCSSGenerator(this);
		this.__xPathCSSGenerator.connect();

		if (originalConnectedCallback) {
			originalConnectedCallback.call(this);
		}
	};

	componentClass.prototype.disconnectedCallback = function() {
		this.__xPathCSSGenerator.disconnect();
		if (originalDisconnectedCallback) {
			originalDisconnectedCallback.call(this);
		}
	};

	originalDefine.call(this, name, componentClass);
};
