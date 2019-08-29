window['liveScopedCSSPolyfill'] = Object.assign(
	{},
	{
		force: false,
		renderMethod: 'auto',
		onlyScopeOnConnected: false,
		disableRules: null
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
