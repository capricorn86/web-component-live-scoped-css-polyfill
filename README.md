# Live scoped CSS polyfill for Web Components
When I started to use Web Components I discovered that the [polyfills](https://github.com/webcomponents) provided by the [Polymer team](https://github.com/webcomponents) works great except for some problems I got with the ShadyCSS polyfill. The ShadyCSS polyfill requires some manual work to get it up and running and it does not support dynamically changed styles.

This polyfill provide with an alternative to [@webcomponents/shadycss](https://github.com/webcomponents/polyfills/tree/master/packages/shadycss) that will add support for dynamically scoped CSS.

If you are using a standard library it will not require any manual setup. If you are using custom elements standalone, please read about "renderMethod" in the "Configuration" section.


# How to Install

### Only this polyfill

```bash
npm install web-component-live-scoped-css-polyfill
```

### All recommended polyfills

```bash
npm install core-js @webcomponents/webcomponents-platform @webcomponents/custom-elements @webcomponents/shadydom @webcomponents/template web-component-slotchange-polyfill web-component-live-scoped-css-polyfill
```


# Usage


This polyfill should be added last as it is dependent on other polyfills like custom-elements to be loaded.

### Include as a package

*Note! The bellow file can be found here: node_modules/web-component-live-scoped-css-polyfill/lib/live-scoped-css-polyfill.min.js.*

```html
<script src="live-scoped-css-polyfill.min.js"></script>
```

### Include as a module

```javascript
require('web-component-live-scoped-css-polyfill');
```

### Include all recommended

```javascript
require('core-js/stable');
require('@webcomponents/custom-elements/src/native-shim');
require('@webcomponents/webcomponents-platform');
require('@webcomponents/custom-elements/custom-elements.min');
require('@webcomponents/shadydom');
require('@webcomponents/template');
require('web-component-slotchange-polyfill');
require('web-component-live-scoped-css-polyfill');
```


# Configuration

### Example

```html
<script>
    window.liveScopedCSSPolyfill = {
        // Name of the render method that is called on each render.
        renderMethod: 'auto',
        
        // Set to "true" if the style is not changed during render.
        onlyScopeOnConnected: false,

        // Forces the polyfill to be loaded.
        force: false,

        // Rules to disable as a RegExp or string.
        disableRules: null,

        // Set to "true" to enable debugging.
        debug: false
    };
</script>
<script src="live-scoped-css-polyfill.min.js"></script>
```

### Options

| Name                 | Type           | Default | Description                                                  |
| -------------------- | -------------- | ------- | ------------------------------------------------------------ |
| renderMethod         | string         | auto    | Name of the render method that is called on each render. This will be determined automatically by default (depending on which library you are using). |
| onlyScopeOnConnected | boolean        | false   | If this is set to "true", the "renderMethod" behavior will be disabled and scoping will only happen after the element has been connected once. This will improve performance drastically for applications not changing style during render. |
| force                | boolean        | false   | Forces the polyfill to be loaded even if the browser has native support. |
| disableRules         | string\|RegExp | null    | Rules to disable as a RegExp or string. This could be useful for rules that can be applied globally instead. Example: "*, *:before, *:after" |
| debug         | boolean | false    | Set to "true" to enable debugging. |

### Supported libraries

| Library     | Render method        |
| ----------- | -------------------- |
| (Popular)   | requestRender()      |
| lit-element | requestUpdate()      |
| stenciljs   | componentDidRender() |
| skate.js    | renderer()           |
| slimjs      | onRender()           |
| hybrid.js   | render()             |


# Known Limitations
"::slotted" is not supported at the moment.

If you have a need for a missing feature or if you have found a bug, please let me know, and I will do my best to fix it.

# Release Notes

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.1.2   | 2019-08-29 | Adds option for enabling debugging. |
| 1.1.0   | 2019-08-29 | Major performance improvements and minor bug fixes. |
| 1.0.0   | 2019-08-08 | Stable release.                                     |
| 0.0.1   | 2019-07-30 | Alpha release.                                      |



# How to Develop

### Installation

```bash
npm install
```

### Compilation

```bash
npm run compile
```

### Run watcher

```bash
npm run watch
```

### Debugging

It is possible to debug in Chrome or Firefox by forcing all polyfills to be enabled.

```html
<script>
    if (window.customElements) {
        window.customElements.forcePolyfill = true;
    }
    window.ShadyDOM = {
        force: true
    };
    window.slotChangePolyfill = {
        force: true
    };
    window.liveScopedCSSPolyfill = {
        force: true
    };
</script>
<script src="all-polyfills.js"></script>
```

