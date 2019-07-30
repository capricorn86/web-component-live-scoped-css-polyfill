window['liveScopedCSS'] = Object.assign({}, { force: false, renderMethod: null }, window['liveScopedCSS']);

if (window.customElements['polyfillWrapFlushCallback'] || window['ShadyDOM'] || !window['HTMLElement'].prototype.attachShadow || window['liveScopedCSS'].force) {
	require('./patch/LiveScopedCSSPatch');
}
