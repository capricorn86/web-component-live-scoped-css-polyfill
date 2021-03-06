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
| disableComponents         | string[] | null    | A list of web component tag names to disable the polyfill on. |
| debug         | boolean | false    | Set to "true" to enable debugging. |
| scopeAttributeName       | string | '_p'    | Sets the name of the attribute used for scoping. |

# Supported libraries

| Library     | Render method        | Support      |
| ----------- | -------------------- | ------------ |
| lit-element | update()             | Automatic    |
| stenciljs   |                      | Not possible to do automatically as the render method is private. You will have to declare componentDidRender() and manually trigger "this.updateScopedCSSPolyfill()".                   |
| skate.js    | renderedCallback()   | Automatic    |
| slimjs      | render()             | Automatic    |
| hybrid.js   | render()             | Not tested yet |
| (Popular)   | requestRender()      | Automatic    |


# Manual Update

This should only be necessary to do if your library is not supported and it is not possible to set a render method in the configuration.

```javascript
class MyComponent {
   componentDidRender() {
       this.updateScopedCSSPolyfill();
   }
}
```

# Known Limitations
Using a function argument on the ":host" selector is not supported yet (example: ":host(.special)").

If you have a need for a missing feature or if you have found a bug, please let me know, and I will do my best to fix it.

# Release Notes

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.4.3   | 2020-02-12 | Fixes issue with CSS rules for component tag name not being applied.       |
| 1.4.2   | 2019-11-29 | Fixes issue with cache key not being generated correctly, causing changes not being updated.       |
| 1.4.0   | 2019-11-01 | Uses attribute instead of class for scoping CSS to prevent collision with frameworks. (#3)       |
| 1.3.1   | 2019-11-01 | Fixes issue with attributes not being cached correctly causing class changes not being updated. (#2)       |
| 1.3.0   | 2019-10-30 | Adds support for "disableComponents" option.       |
| 1.2.6   | 2019-10-30 | Fixes issue with -moz-keyframes and -webkit-keyframe not working.       |
| 1.2.5   | 2019-10-09 | Fixes issue with ":host-context" selectors not being scoped. (#1)       |
| 1.2.1   | 2019-09-16 | Updates rules for libraries based on testing.       |
| 1.2.0   | 2019-09-12 | Adds support for "::slotted" CSS rule.              |
| 1.1.21  | 2019-09-12 | Bugfix for lit-element render method not hooked.    |
| 1.1.20  | 2019-09-12 | Bugfix for selectors inside a slot not working.     |
| 1.1.2   | 2019-08-29 | Adds option for enabling debugging.                 |
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

