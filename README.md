# Live scoped CSS polyfill for Web Components
When I started to use Web Components I discovered that the [polyfills](https://github.com/webcomponents) provided by the [Polymer team](https://github.com/webcomponents) works great except for some problems I got with the ShadyCSS polyfill. The ShadyCSS polyfill requires some manual work to get it up and running and it does not support the dynamically changed styles.

This polyfill provide with an alternative to [@webcomponents/shadycss](https://github.com/webcomponents/polyfills/tree/master/packages/shadycss) that will add support for dynamically scoped CSS.

This library is very small and it does not extend ShadyCSS. The CSS rendering is completely synchronous, as asynchronous rendering could break functionality unexpectedly.

If you are using a standard library it will not require any manual setup. If you are using custom elements standalone, please read about "renderMethod" in the "Configuration" section.


# How to Install

### Only this polyfill

```bash
npm install web-component-live-scoped-css-polyfill
```

### All recommended polyfills

```bash
npm install core-js @webcomponents/webcomponents-platform @webcomponents/custom-elements @webcomponents/shadydom @webcomponents/template web-component-live-scoped-css-polyfill
```


# Usage


This polyfill should be added last as it is dependent on other polyfills like custom-elements to be loaded.

### Include as a package

*Note! The bellow file can be found in "node_modules/web-component-live-scoped-css-polyfill/lib/**".*

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
require('web-component-live-scoped-css-polyfill');
```


# Configuration

### Example

```html
<script>
    window.liveScopedCSS = {
        // Name of the render method that is called on each render
        renderMethod: null,

        // Forces the polyfill to be loaded
        force: false
    };
</script>
<script src="live-scoped-css-polyfill.min.js"></script>
```

### Options

| Name         | Type    | Default | Description                                                  |
| ------------ | ------- | ------- | ------------------------------------------------------------ |
| renderMethod | string  | null    | Name of the render method that is called on each render. This will be determined automatically by default (depending on which library you are using). |
| force        | boolean | false   | Forces the polyfill to be loaded and bypasses checks for if it should be loaded |

### Supported libraries

| Library     | Render method        |
| ----------- | -------------------- |
| (Popular)   | requestRender()      |
| lit-element | requestUpdate()      |
| stenciljs   | componentDidRender() |
| skate.js    | renderer()           |
| slimjs      | onRender()           |
| hybrid.js   | render()             |


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

