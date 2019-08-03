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
	const renderMethod = window['liveScopedCSSPolyfill'].renderMethod;
	const disableRenderMethod = window['liveScopedCSSPolyfill'].disableRenderMethod === true;
	const renderMethods = renderMethod !== 'auto' ? [renderMethod] : libraryRenderMethods;
	const originalConnectedCallback = componentClass.prototype.connectedCallback;
	const originalDisconnectedCallback = componentClass.prototype.disconnectedCallback;
	const originalAttributeChangedCallback = componentClass.prototype.attributeChangedCallback;
	const originalObservedAttributes = componentClass['observedAttributes'];
	let isObservingClass = true;

	if (!disableRenderMethod) {
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

	componentClass.prototype.attributeChangedCallback = function(
		attributeName: string,
		oldValue: string,
		newValue: string
	) {
		if (
			this.__xPathCSSGenerator &&
			this.__xPathCSSGenerator.id &&
			attributeName === 'class' &&
			(!newValue || !newValue.split(' ').includes(this.__xPathCSSGenerator.id))
		) {
			const classValue = newValue ? newValue.split(' ') : [];
			this.setAttribute('class', [this.__xPathCSSGenerator.id].concat(classValue).join(' '));
		}
		if (originalAttributeChangedCallback && (isObservingClass || attributeName !== 'class')) {
			originalAttributeChangedCallback.call(this, attributeName, oldValue, newValue);
		}
	};

	Object.defineProperty(componentClass, 'observedAttributes', {
		get: function() {
			const observedAttributes = originalObservedAttributes ? originalObservedAttributes.slice() : [];
			if (!observedAttributes.includes('class')) {
				isObservingClass = false;
				observedAttributes.push('class');
			}
			return observedAttributes;
		}
	});

	originalDefine.call(this, name, componentClass);
};
