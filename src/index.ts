window['liveScopedCSSPolyfill'] = Object.assign(
	{},
	{ force: false, renderMethod: 'auto', disableRenderMethod: false },
	window['liveScopedCSSPolyfill']
);

if (
	window.customElements['polyfillWrapFlushCallback'] ||
	window['ShadyDOM'] ||
	!window['HTMLElement'].prototype.attachShadow ||
	window['liveScopedCSS'].force
) {
	require('./patch/LiveScopedCSSPatch');
}
