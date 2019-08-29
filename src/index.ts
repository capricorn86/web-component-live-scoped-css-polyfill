window['liveScopedCSSPolyfill'] = Object.assign(
	{},
	{
		force: false,
		renderMethod: 'auto',
		onlyScopeOnConnected: false,
		disableRules: null,
		debug: false
	},
	window['liveScopedCSSPolyfill']
);

if (
	window.customElements['polyfillWrapFlushCallback'] ||
	window['ShadyDOM'] ||
	!window['HTMLElement'].prototype.attachShadow ||
	window['liveScopedCSSPolyfill'].force
) {
	require('./patch/LiveScopedCSSPatch');
}
