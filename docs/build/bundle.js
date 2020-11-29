
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function t(){}function e(t){return t()}function i(){return Object.create(null)}function o(t){t.forEach(e);}function n(t){return "function"==typeof t}function s(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function a(t){t.parentNode.removeChild(t);}function r(t,e,i){null==i?t.removeAttribute(e):t.getAttribute(e)!==i&&t.setAttribute(e,i);}let l;function c(t){l=t;}function d(){if(!l)throw new Error("Function called outside component initialization");return l}function u(){const t=d();return (e,i)=>{const o=t.$$.callbacks[e];if(o){const n=function(t,e){const i=document.createEvent("CustomEvent");return i.initCustomEvent(t,!1,!1,e),i}(e,i);o.slice().forEach(e=>{e.call(t,n);});}}}const h=[],v=[],p=[],f=[],y=Promise.resolve();let m=!1;function b(t){p.push(t);}let g=!1;const w=new Set;function _(){if(!g){g=!0;do{for(let t=0;t<h.length;t+=1){const e=h[t];c(e),M(e.$$);}for(h.length=0;v.length;)v.pop()();for(let t=0;t<p.length;t+=1){const e=p[t];w.has(e)||(w.add(e),e());}p.length=0;}while(h.length);for(;f.length;)f.pop()();m=!1,g=!1,w.clear();}}function M(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(b);}}const P=new Set;function x(t,e){-1===t.$$.dirty[0]&&(h.push(t),m||(m=!0,y.then(_)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31;}function k(s,r,d,u,h,v,p=[-1]){const f=l;c(s);const y=r.props||{},m=s.$$={fragment:null,ctx:null,props:v,update:t,not_equal:h,bound:i(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(f?f.$$.context:[]),callbacks:i(),dirty:p};let g=!1;if(m.ctx=d?d(s,y,(t,e,...i)=>{const o=i.length?i[0]:e;return m.ctx&&h(m.ctx[t],m.ctx[t]=o)&&(m.bound[t]&&m.bound[t](o),g&&x(s,t)),e}):[],m.update(),g=!0,o(m.before_update),m.fragment=!!u&&u(m.ctx),r.target){if(r.hydrate){const t=function(t){return Array.from(t.childNodes)}(r.target);m.fragment&&m.fragment.l(t),t.forEach(a);}else m.fragment&&m.fragment.c();r.intro&&((w=s.$$.fragment)&&w.i&&(P.delete(w),w.i(M))),function(t,i,s){const{fragment:a,on_mount:r,on_destroy:l,after_update:c}=t.$$;a&&a.m(i,s),b(()=>{const i=r.map(e).filter(n);l?l.push(...i):o(i),t.$$.on_mount=[];}),c.forEach(b);}(s,r.target,r.anchor),_();}var w,M;c(f);}function O(t,e,i){return t(i={path:e,exports:{},require:function(t,e){return function(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */(null==e&&i.path)}},i.exports),i.exports}function C(t){if(t.__esModule)return t;var e=Object.defineProperty({},"__esModule",{value:!0});return Object.keys(t).forEach((function(i){var o=Object.getOwnPropertyDescriptor(t,i);Object.defineProperty(e,i,o.get?o:{enumerable:!0,get:function(){return t[i]}});})),e}var S=function(t,e){return (S=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e;}||function(t,e){for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);})(t,e)};var T=function(){return (T=Object.assign||function(t){for(var e,i=1,o=arguments.length;i<o;i++)for(var n in e=arguments[i])Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t}).apply(this,arguments)};var R=Object.create?function(t,e,i,o){void 0===o&&(o=i),Object.defineProperty(t,o,{enumerable:!0,get:function(){return e[i]}});}:function(t,e,i,o){void 0===o&&(o=i),t[o]=e[i];};function A(t){var e="function"==typeof Symbol&&Symbol.iterator,i=e&&t[e],o=0;if(i)return i.call(t);if(t&&"number"==typeof t.length)return {next:function(){return t&&o>=t.length&&(t=void 0),{value:t&&t[o++],done:!t}}};throw new TypeError(e?"Object is not iterable.":"Symbol.iterator is not defined.")}function z(t,e){var i="function"==typeof Symbol&&t[Symbol.iterator];if(!i)return t;var o,n,s=i.call(t),a=[];try{for(;(void 0===e||e-- >0)&&!(o=s.next()).done;)a.push(o.value);}catch(t){n={error:t};}finally{try{o&&!o.done&&(i=s.return)&&i.call(s);}finally{if(n)throw n.error}}return a}function D(t){return this instanceof D?(this.v=t,this):new D(t)}var E=Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e});}:function(t,e){t.default=e;};var U=Object.freeze({__proto__:null,__extends:function(t,e){function i(){this.constructor=t;}S(t,e),t.prototype=null===e?Object.create(e):(i.prototype=e.prototype,new i);},get __assign(){return T},__rest:function(t,e){var i={};for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&e.indexOf(o)<0&&(i[o]=t[o]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var n=0;for(o=Object.getOwnPropertySymbols(t);n<o.length;n++)e.indexOf(o[n])<0&&Object.prototype.propertyIsEnumerable.call(t,o[n])&&(i[o[n]]=t[o[n]]);}return i},__decorate:function(t,e,i,o){var n,s=arguments.length,a=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,o);else for(var r=t.length-1;r>=0;r--)(n=t[r])&&(a=(s<3?n(a):s>3?n(e,i,a):n(e,i))||a);return s>3&&a&&Object.defineProperty(e,i,a),a},__param:function(t,e){return function(i,o){e(i,o,t);}},__metadata:function(t,e){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(t,e)},__awaiter:function(t,e,i,o){return new(i||(i=Promise))((function(n,s){function a(t){try{l(o.next(t));}catch(t){s(t);}}function r(t){try{l(o.throw(t));}catch(t){s(t);}}function l(t){var e;t.done?n(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e);}))).then(a,r);}l((o=o.apply(t,e||[])).next());}))},__generator:function(t,e){var i,o,n,s,a={label:0,sent:function(){if(1&n[0])throw n[1];return n[1]},trys:[],ops:[]};return s={next:r(0),throw:r(1),return:r(2)},"function"==typeof Symbol&&(s[Symbol.iterator]=function(){return this}),s;function r(s){return function(r){return function(s){if(i)throw new TypeError("Generator is already executing.");for(;a;)try{if(i=1,o&&(n=2&s[0]?o.return:s[0]?o.throw||((n=o.return)&&n.call(o),0):o.next)&&!(n=n.call(o,s[1])).done)return n;switch(o=0,n&&(s=[2&s[0],n.value]),s[0]){case 0:case 1:n=s;break;case 4:return a.label++,{value:s[1],done:!1};case 5:a.label++,o=s[1],s=[0];continue;case 7:s=a.ops.pop(),a.trys.pop();continue;default:if(!(n=a.trys,(n=n.length>0&&n[n.length-1])||6!==s[0]&&2!==s[0])){a=0;continue}if(3===s[0]&&(!n||s[1]>n[0]&&s[1]<n[3])){a.label=s[1];break}if(6===s[0]&&a.label<n[1]){a.label=n[1],n=s;break}if(n&&a.label<n[2]){a.label=n[2],a.ops.push(s);break}n[2]&&a.ops.pop(),a.trys.pop();continue}s=e.call(t,a);}catch(t){s=[6,t],o=0;}finally{i=n=0;}if(5&s[0])throw s[1];return {value:s[0]?s[1]:void 0,done:!0}}([s,r])}}},__createBinding:R,__exportStar:function(t,e){for(var i in t)"default"===i||Object.prototype.hasOwnProperty.call(e,i)||R(e,t,i);},__values:A,__read:z,__spread:function(){for(var t=[],e=0;e<arguments.length;e++)t=t.concat(z(arguments[e]));return t},__spreadArrays:function(){for(var t=0,e=0,i=arguments.length;e<i;e++)t+=arguments[e].length;var o=Array(t),n=0;for(e=0;e<i;e++)for(var s=arguments[e],a=0,r=s.length;a<r;a++,n++)o[n]=s[a];return o},__await:D,__asyncGenerator:function(t,e,i){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o,n=i.apply(t,e||[]),s=[];return o={},a("next"),a("throw"),a("return"),o[Symbol.asyncIterator]=function(){return this},o;function a(t){n[t]&&(o[t]=function(e){return new Promise((function(i,o){s.push([t,e,i,o])>1||r(t,e);}))});}function r(t,e){try{(i=n[t](e)).value instanceof D?Promise.resolve(i.value.v).then(l,c):d(s[0][2],i);}catch(t){d(s[0][3],t);}var i;}function l(t){r("next",t);}function c(t){r("throw",t);}function d(t,e){t(e),s.shift(),s.length&&r(s[0][0],s[0][1]);}},__asyncDelegator:function(t){var e,i;return e={},o("next"),o("throw",(function(t){throw t})),o("return"),e[Symbol.iterator]=function(){return this},e;function o(o,n){e[o]=t[o]?function(e){return (i=!i)?{value:D(t[o](e)),done:"return"===o}:n?n(e):e}:n;}},__asyncValues:function(t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var e,i=t[Symbol.asyncIterator];return i?i.call(t):(t=A(t),e={},o("next"),o("throw"),o("return"),e[Symbol.asyncIterator]=function(){return this},e);function o(i){e[i]=t[i]&&function(e){return new Promise((function(o,n){(function(t,e,i,o){Promise.resolve(o).then((function(e){t({value:e,done:i});}),e);})(o,n,(e=t[i](e)).done,e.value);}))};}},__makeTemplateObject:function(t,e){return Object.defineProperty?Object.defineProperty(t,"raw",{value:e}):t.raw=e,t},__importStar:function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var i in t)"default"!==i&&Object.prototype.hasOwnProperty.call(t,i)&&R(e,t,i);return E(e,t),e},__importDefault:function(t){return t&&t.__esModule?t:{default:t}},__classPrivateFieldGet:function(t,e){if(!e.has(t))throw new TypeError("attempted to get private field on non-instance");return e.get(t)},__classPrivateFieldSet:function(t,e,i){if(!e.has(t))throw new TypeError("attempted to set private field on non-instance");return e.set(t,i),i}}),I=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.initPjs=void 0;e.initPjs=t=>{const e=(e,i)=>t.load(e,i);e.load=(e,i,o)=>{t.loadJSON(e,i).then(t=>{t&&o(t);});},e.setOnClickHandler=e=>{t.setOnClickHandler(e);};return {particlesJS:e,pJSDom:t.dom()}};})),j=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.SquareDrawer=void 0;e.SquareDrawer=class{getSidesCount(){return 4}draw(t,e,i){t.rect(-i,-i,2*i,2*i);}};})),L=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.OutModeDirection=void 0,function(t){t.bottom="bottom",t.left="left",t.right="right",t.top="top";}(e.OutModeDirection||(e.OutModeDirection={}));})),B=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MoveDirection=void 0,function(t){t.bottom="bottom",t.bottomLeft="bottom-left",t.bottomRight="bottom-right",t.left="left",t.none="none",t.right="right",t.top="top",t.topLeft="top-left",t.topRight="top-right";}(e.MoveDirection||(e.MoveDirection={}));})),H=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.RotateDirection=void 0,function(t){t.clockwise="clockwise",t.counterClockwise="counter-clockwise",t.random="random";}(e.RotateDirection||(e.RotateDirection={}));})),F=C(U),V=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(B,e),F.__exportStar(H,e);})),N=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.NumberUtils=void 0;class i{static clamp(t,e,i){return Math.min(Math.max(t,e),i)}static mix(t,e,i,o){return Math.floor((t*i+e*o)/(i+o))}static randomInRange(t,e){const i=Math.max(t,e),o=Math.min(t,e);return Math.random()*(i-o)+o}static getValue(t){const e=t.random,{enable:o,minimumValue:n}="boolean"==typeof e?{enable:e,minimumValue:0}:e;return o?i.randomInRange(n,t.value):t.value}static getDistances(t,e){const i=t.x-e.x,o=t.y-e.y;return {dx:i,dy:o,distance:Math.sqrt(i*i+o*o)}}static getDistance(t,e){return i.getDistances(t,e).distance}static getParticleBaseVelocity(t){let e;switch(t.direction){case V.MoveDirection.top:e={x:0,y:-1};break;case V.MoveDirection.topRight:e={x:.5,y:-.5};break;case V.MoveDirection.right:e={x:1,y:-0};break;case V.MoveDirection.bottomRight:e={x:.5,y:.5};break;case V.MoveDirection.bottom:e={x:0,y:1};break;case V.MoveDirection.bottomLeft:e={x:-.5,y:1};break;case V.MoveDirection.left:e={x:-1,y:0};break;case V.MoveDirection.topLeft:e={x:-.5,y:-.5};break;default:e={x:0,y:0};}return e}static rotateVelocity(t,e){return {horizontal:t.horizontal*Math.cos(e)-t.vertical*Math.sin(e),vertical:t.horizontal*Math.sin(e)+t.vertical*Math.cos(e)}}static collisionVelocity(t,e,i,o){return {horizontal:t.horizontal*(i-o)/(i+o)+2*e.horizontal*o/(i+o),vertical:t.vertical}}}e.NumberUtils=i;})),q=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Utils=void 0;class i{static isSsr(){return "undefined"==typeof window||!window}static get animate(){return i.isSsr()?t=>setTimeout(t):t=>(window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||window.setTimeout)(t)}static get cancelAnimation(){return i.isSsr()?t=>clearTimeout(t):t=>(window.cancelAnimationFrame||window.webkitCancelRequestAnimationFrame||window.mozCancelRequestAnimationFrame||window.oCancelRequestAnimationFrame||window.msCancelRequestAnimationFrame||window.clearTimeout)(t)}static isInArray(t,e){return t===e||e instanceof Array&&e.indexOf(t)>-1}static loadFont(t){return F.__awaiter(this,void 0,void 0,(function*(){try{yield document.fonts.load(`${t.weight} 36px '${t.font}'`);}catch(t){}}))}static arrayRandomIndex(t){return Math.floor(Math.random()*t.length)}static itemFromArray(t,e,o=!0){return t[void 0!==e&&o?e%t.length:i.arrayRandomIndex(t)]}static isPointInside(t,e,o,n){return i.areBoundsInside(i.calculateBounds(t,null!=o?o:0),e,n)}static areBoundsInside(t,e,i){let o=!0;return i&&i!==L.OutModeDirection.bottom||(o=t.top<e.height),!o||i&&i!==L.OutModeDirection.left||(o=t.right>0),!o||i&&i!==L.OutModeDirection.right||(o=t.left<e.width),!o||i&&i!==L.OutModeDirection.top||(o=t.bottom>0),o}static calculateBounds(t,e){return {bottom:t.y+e,left:t.x-e,right:t.x+e,top:t.y-e}}static loadImage(t){return new Promise((e,i)=>{if(!t)return void i("Error tsParticles - No image.src");const o={source:t,type:t.substr(t.length-3)},n=new Image;n.addEventListener("load",()=>{o.element=n,e(o);}),n.addEventListener("error",()=>{i("Error tsParticles - loading image: "+t);}),n.src=t;})}static downloadSvgImage(t){return F.__awaiter(this,void 0,void 0,(function*(){if(!t)throw new Error("Error tsParticles - No image.src");const e={source:t,type:t.substr(t.length-3)};if("svg"!==e.type)return i.loadImage(t);const o=yield fetch(e.source);if(!o.ok)throw new Error("Error tsParticles - Image not found");return e.svgData=yield o.text(),e}))}static deepExtend(t,...e){for(const o of e){if(null==o)continue;if("object"!=typeof o){t=o;continue}const e=Array.isArray(o);!e||"object"==typeof t&&t&&Array.isArray(t)?e||"object"==typeof t&&t&&!Array.isArray(t)||(t={}):t=[];for(const e in o){if("__proto__"===e)continue;const n=o[e],s="object"==typeof n,a=t;a[e]=s&&Array.isArray(n)?n.map(t=>i.deepExtend(a[e],t)):i.deepExtend(a[e],n);}}return t}static isDivModeEnabled(t,e){return e instanceof Array?!!e.find(e=>e.enable&&i.isInArray(t,e.mode)):i.isInArray(t,e.mode)}static divModeExecute(t,e,o){if(e instanceof Array)for(const n of e){const e=n.mode;n.enable&&i.isInArray(t,e)&&i.singleDivModeExecute(n,o);}else {const n=e.mode;e.enable&&i.isInArray(t,n)&&i.singleDivModeExecute(e,o);}}static singleDivModeExecute(t,e){const i=t.selectors;if(i instanceof Array)for(const o of i)e(o,t);else e(i,t);}static divMode(t,e){if(e&&t)return t instanceof Array?t.find(t=>i.checkSelector(e,t.selectors)):i.checkSelector(e,t.selectors)?t:void 0}static circleBounceDataFromParticle(t){return {position:t.getPosition(),radius:t.getRadius(),velocity:t.velocity,factor:{horizontal:N.NumberUtils.getValue(t.particlesOptions.bounce.horizontal),vertical:N.NumberUtils.getValue(t.particlesOptions.bounce.vertical)}}}static circleBounce(t,e){const i=t.velocity.horizontal,o=t.velocity.vertical,n=t.position,s=e.position;if(i*(s.x-n.x)+o*(s.y-n.y)>=0){const i=-Math.atan2(s.y-n.y,s.x-n.x),o=t.radius,a=e.radius,r=N.NumberUtils.rotateVelocity(t.velocity,i),l=N.NumberUtils.rotateVelocity(e.velocity,i),c=N.NumberUtils.collisionVelocity(r,l,o,a),d=N.NumberUtils.collisionVelocity(l,r,o,a),u=N.NumberUtils.rotateVelocity(c,-i),h=N.NumberUtils.rotateVelocity(d,-i);t.velocity.horizontal=u.horizontal*t.factor.horizontal,t.velocity.vertical=u.vertical*t.factor.vertical,e.velocity.horizontal=h.horizontal*e.factor.horizontal,e.velocity.vertical=h.vertical*e.factor.vertical;}}static rectBounce(t,e){const o=t.getPosition(),n=t.getRadius(),s=i.calculateBounds(o,n),a=i.rectSideBounce({min:s.left,max:s.right},{min:s.top,max:s.bottom},{min:e.left,max:e.right},{min:e.top,max:e.bottom},t.velocity.horizontal,N.NumberUtils.getValue(t.particlesOptions.bounce.horizontal));a.bounced&&(void 0!==a.velocity&&(t.velocity.horizontal=a.velocity),void 0!==a.position&&(t.position.x=a.position));const r=i.rectSideBounce({min:s.top,max:s.bottom},{min:s.left,max:s.right},{min:e.top,max:e.bottom},{min:e.left,max:e.right},t.velocity.vertical,N.NumberUtils.getValue(t.particlesOptions.bounce.vertical));r.bounced&&(void 0!==r.velocity&&(t.velocity.vertical=r.velocity),void 0!==r.position&&(t.position.y=r.position));}static rectSideBounce(t,e,i,o,n,s){const a={bounced:!1};return e.min>=o.min&&e.min<=o.max&&e.max>=o.min&&e.max<=o.max&&(t.max>=i.min&&t.max<=(i.max+i.min)/2&&n>0||t.min<=i.max&&t.min>(i.max+i.min)/2&&n<0)&&(a.velocity=n*-s,a.bounced=!0),a}static checkSelector(t,e){if(e instanceof Array){for(const i of e)if(t.matches(i))return !0;return !1}return t.matches(e)}}e.Utils=i;})),$=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Constants=void 0;class i{}e.Constants=i,i.canvasClass="tsparticles-canvas-el",i.randomColorValue="random",i.midColorValue="mid",i.touchEndEvent="touchend",i.mouseDownEvent="mousedown",i.mouseUpEvent="mouseup",i.mouseMoveEvent="mousemove",i.touchStartEvent="touchstart",i.touchMoveEvent="touchmove",i.mouseLeaveEvent="mouseleave",i.mouseOutEvent="mouseout",i.touchCancelEvent="touchcancel",i.resizeEvent="resize",i.visibilityChangeEvent="visibilitychange",i.noPolygonDataLoaded="No polygon data loaded.",i.noPolygonFound="No polygon found, you need to specify SVG url in config.";})),W=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ColorUtils=void 0;class i{static colorToRgb(t,e,o=!0){var n,s,a;if(void 0===t)return;const r="string"==typeof t?{value:t}:t;let l;if("string"==typeof r.value)l=r.value===$.Constants.randomColorValue?i.getRandomRgbColor():i.stringToRgb(r.value);else if(r.value instanceof Array){const t=q.Utils.itemFromArray(r.value,e,o);l=i.colorToRgb({value:t});}else {const t=r.value,e=null!==(n=t.rgb)&&void 0!==n?n:r.value;if(void 0!==e.r)l=e;else {const e=null!==(s=t.hsl)&&void 0!==s?s:r.value;if(void 0!==e.h&&void 0!==e.l)l=i.hslToRgb(e);else {const e=null!==(a=t.hsv)&&void 0!==a?a:r.value;void 0!==e.h&&void 0!==e.v&&(l=i.hsvToRgb(e));}}}return l}static colorToHsl(t,e,o=!0){const n=i.colorToRgb(t,e,o);return void 0!==n?i.rgbToHsl(n):n}static rgbToHsl(t){const e=t.r/255,i=t.g/255,o=t.b/255,n=Math.max(e,i,o),s=Math.min(e,i,o),a={h:0,l:(n+s)/2,s:0};return n!=s&&(a.s=a.l<.5?(n-s)/(n+s):(n-s)/(2-n-s),a.h=e===n?(i-o)/(n-s):a.h=i===n?2+(o-e)/(n-s):4+(e-i)/(n-s)),a.l*=100,a.s*=100,a.h*=60,a.h<0&&(a.h+=360),a}static stringToAlpha(t){var e;return null===(e=i.stringToRgba(t))||void 0===e?void 0:e.a}static stringToRgb(t){return i.stringToRgba(t)}static hslToRgb(t){const e={b:0,g:0,r:0},o={h:t.h/360,l:t.l/100,s:t.s/100};if(0===o.s)e.b=o.l,e.g=o.l,e.r=o.l;else {const t=o.l<.5?o.l*(1+o.s):o.l+o.s-o.l*o.s,n=2*o.l-t;e.r=i.hue2rgb(n,t,o.h+1/3),e.g=i.hue2rgb(n,t,o.h),e.b=i.hue2rgb(n,t,o.h-1/3);}return e.r=Math.floor(255*e.r),e.g=Math.floor(255*e.g),e.b=Math.floor(255*e.b),e}static hslaToRgba(t){const e=i.hslToRgb(t);return {a:t.a,b:e.b,g:e.g,r:e.r}}static hslToHsv(t){const e=t.l/100,i=e+t.s/100*Math.min(e,1-e),o=i?2*(1-e/i):0;return {h:t.h,s:100*o,v:100*i}}static hslaToHsva(t){const e=i.hslToHsv(t);return {a:t.a,h:e.h,s:e.s,v:e.v}}static hsvToHsl(t){const e=t.v/100,i=e*(1-t.s/100/2),o=0===i||1===i?0:(e-i)/Math.min(i,1-i);return {h:t.h,l:100*i,s:100*o}}static hsvaToHsla(t){const e=i.hsvToHsl(t);return {a:t.a,h:e.h,l:e.l,s:e.s}}static hsvToRgb(t){const e={b:0,g:0,r:0},i=t.h/60,o=t.s/100,n=t.v/100,s=n*o,a=s*(1-Math.abs(i%2-1));let r;if(i>=0&&i<=1?r={r:s,g:a,b:0}:i>1&&i<=2?r={r:a,g:s,b:0}:i>2&&i<=3?r={r:0,g:s,b:a}:i>3&&i<=4?r={r:0,g:a,b:s}:i>4&&i<=5?r={r:a,g:0,b:s}:i>5&&i<=6&&(r={r:s,g:0,b:a}),r){const t=n-s;e.r=Math.floor(255*(r.r+t)),e.g=Math.floor(255*(r.g+t)),e.b=Math.floor(255*(r.b+t));}return e}static hsvaToRgba(t){const e=i.hsvToRgb(t);return {a:t.a,b:e.b,g:e.g,r:e.r}}static rgbToHsv(t){const e={r:t.r/255,g:t.g/255,b:t.b/255},i=Math.max(e.r,e.g,e.b),o=i-Math.min(e.r,e.g,e.b);let n=0;i===e.r?n=(e.g-e.b)/o*60:i===e.g?n=60*(2+(e.b-e.r)/o):i===e.b&&(n=60*(4+(e.r-e.g)/o));return {h:n,s:100*(i?o/i:0),v:100*i}}static rgbaToHsva(t){const e=i.rgbToHsv(t);return {a:t.a,h:e.h,s:e.s,v:e.v}}static getRandomRgbColor(t){const e=null!=t?t:0;return {b:Math.floor(N.NumberUtils.randomInRange(e,256)),g:Math.floor(N.NumberUtils.randomInRange(e,256)),r:Math.floor(N.NumberUtils.randomInRange(e,256))}}static getStyleFromRgb(t,e){return `rgba(${t.r}, ${t.g}, ${t.b}, ${null!=e?e:1})`}static getStyleFromHsl(t,e){return `hsla(${t.h}, ${t.s}%, ${t.l}%, ${null!=e?e:1})`}static getStyleFromHsv(t,e){return i.getStyleFromHsl(i.hsvToHsl(t),e)}static mix(t,e,o,n){let s=t,a=e;return void 0===s.r&&(s=i.hslToRgb(t)),void 0===a.r&&(a=i.hslToRgb(e)),{b:N.NumberUtils.mix(s.b,a.b,o,n),g:N.NumberUtils.mix(s.g,a.g,o,n),r:N.NumberUtils.mix(s.r,a.r,o,n)}}static replaceColorSvg(t,e,o){if(!t.svgData)return "";return t.svgData.replace(/#([0-9A-F]{3,6})/gi,()=>i.getStyleFromHsl(e,o))}static getLinkColor(t,e,o){var n,s;if(o===$.Constants.randomColorValue)return i.getRandomRgbColor();if("mid"!==o)return o;{const o=null!==(n=t.getFillColor())&&void 0!==n?n:t.getStrokeColor(),a=null!==(s=null==e?void 0:e.getFillColor())&&void 0!==s?s:null==e?void 0:e.getStrokeColor();if(o&&a&&e)return i.mix(o,a,t.getRadius(),e.getRadius());{const t=null!=o?o:a;if(t)return i.hslToRgb(t)}}}static getLinkRandomColor(t,e,o){const n="string"==typeof t?t:t.value;return n===$.Constants.randomColorValue?o?i.colorToRgb({value:n}):e?$.Constants.randomColorValue:$.Constants.midColorValue:i.colorToRgb({value:n})}static hue2rgb(t,e,i){let o=i;return o<0&&(o+=1),o>1&&(o-=1),o<1/6?t+6*(e-t)*o:o<.5?e:o<2/3?t+(e-t)*(2/3-o)*6:t}static stringToRgba(t){if(t.startsWith("rgb")){const e=/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([\d.]+)\s*)?\)/i.exec(t);return e?{a:e.length>4?parseFloat(e[5]):1,b:parseInt(e[3],10),g:parseInt(e[2],10),r:parseInt(e[1],10)}:void 0}if(t.startsWith("hsl")){const e=/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(,\s*([\d.]+)\s*)?\)/i.exec(t);return e?i.hslaToRgba({a:e.length>4?parseFloat(e[5]):1,h:parseInt(e[1],10),l:parseInt(e[3],10),s:parseInt(e[2],10)}):void 0}if(t.startsWith("hsv")){const e=/hsva?\(\s*(\d+)°\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(,\s*([\d.]+)\s*)?\)/i.exec(t);return e?i.hsvaToRgba({a:e.length>4?parseFloat(e[5]):1,h:parseInt(e[1],10),s:parseInt(e[2],10),v:parseInt(e[3],10)}):void 0}{const e=/^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i,i=t.replace(e,(t,e,i,o,n)=>e+e+i+i+o+o+(void 0!==n?n+n:"")),o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(i);return o?{a:void 0!==o[4]?parseInt(o[4],16)/255:1,b:parseInt(o[3],16),g:parseInt(o[2],16),r:parseInt(o[1],16)}:void 0}}}e.ColorUtils=i;})),G=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.CanvasUtils=void 0;class i{static paintBase(t,e,i){t.save(),t.fillStyle=null!=i?i:"rgba(0,0,0,0)",t.fillRect(0,0,e.width,e.height),t.restore();}static clear(t,e){t.clearRect(0,0,e.width,e.height);}static drawLinkLine(t,e,o,n,s,a,r,l,c,d,u,h){let v=!1;if(N.NumberUtils.getDistance(o,n)<=s)i.drawLine(t,o,n),v=!0;else if(r){let e,r;const l={x:n.x-a.width,y:n.y},c=N.NumberUtils.getDistances(o,l);if(c.distance<=s){const t=o.y-c.dy/c.dx*o.x;e={x:0,y:t},r={x:a.width,y:t};}else {const t={x:n.x,y:n.y-a.height},i=N.NumberUtils.getDistances(o,t);if(i.distance<=s){const t=-(o.y-i.dy/i.dx*o.x)/(i.dy/i.dx);e={x:t,y:0},r={x:t,y:a.height};}else {const t={x:n.x-a.width,y:n.y-a.height},i=N.NumberUtils.getDistances(o,t);if(i.distance<=s){const t=o.y-i.dy/i.dx*o.x;e={x:-t/(i.dy/i.dx),y:t},r={x:e.x+a.width,y:e.y+a.height};}}}e&&r&&(i.drawLine(t,o,e),i.drawLine(t,n,r),v=!0);}if(v){if(t.lineWidth=e,l&&(t.globalCompositeOperation=c),t.strokeStyle=W.ColorUtils.getStyleFromRgb(d,u),h.enable){const e=W.ColorUtils.colorToRgb(h.color);e&&(t.shadowBlur=h.blur,t.shadowColor=W.ColorUtils.getStyleFromRgb(e));}t.stroke();}}static drawLinkTriangle(t,e,o,n,s,a,r,l){i.drawTriangle(t,e,o,n),s&&(t.globalCompositeOperation=a),t.fillStyle=W.ColorUtils.getStyleFromRgb(r,l),t.fill();}static drawConnectLine(t,e,o,n,s){t.save(),i.drawLine(t,n,s),t.lineWidth=e,t.strokeStyle=o,t.stroke(),t.restore();}static gradient(t,e,i,o){const n=Math.floor(i.getRadius()/e.getRadius()),s=e.getFillColor(),a=i.getFillColor();if(!s||!a)return;const r=e.getPosition(),l=i.getPosition(),c=W.ColorUtils.mix(s,a,e.getRadius(),i.getRadius()),d=t.createLinearGradient(r.x,r.y,l.x,l.y);return d.addColorStop(0,W.ColorUtils.getStyleFromHsl(s,o)),d.addColorStop(n>1?1:n,W.ColorUtils.getStyleFromRgb(c,o)),d.addColorStop(1,W.ColorUtils.getStyleFromHsl(a,o)),d}static drawGrabLine(t,e,o,n,s,a){t.save(),i.drawLine(t,o,n),t.strokeStyle=W.ColorUtils.getStyleFromRgb(s,a),t.lineWidth=e,t.stroke(),t.restore();}static drawLight(t,e,i){const o=t.options.interactivity.modes.light.area;e.beginPath(),e.arc(i.x,i.y,o.radius,0,2*Math.PI);const n=e.createRadialGradient(i.x,i.y,0,i.x,i.y,o.radius),s=o.gradient,a={start:W.ColorUtils.colorToRgb(s.start),stop:W.ColorUtils.colorToRgb(s.stop)};a.start&&a.stop&&(n.addColorStop(0,W.ColorUtils.getStyleFromRgb(a.start)),n.addColorStop(1,W.ColorUtils.getStyleFromRgb(a.stop)),e.fillStyle=n,e.fill());}static drawParticleShadow(t,e,i,o){const n=i.getPosition(),s=t.options.interactivity.modes.light.shadow;e.save();const a=i.getRadius(),r=i.sides,l=2*Math.PI/r,c=-i.rotate.value+Math.PI/4,d=[];for(let t=0;t<r;t++)d.push({x:n.x+a*Math.sin(c+l*t)*1,y:n.y+a*Math.cos(c+l*t)*1});const u=[],h=s.length;for(const t of d){const e=Math.atan2(o.y-t.y,o.x-t.x),i=t.x+h*Math.sin(-e-Math.PI/2),n=t.y+h*Math.cos(-e-Math.PI/2);u.push({endX:i,endY:n,startX:t.x,startY:t.y});}const v=W.ColorUtils.colorToRgb(s.color);if(!v)return;const p=W.ColorUtils.getStyleFromRgb(v);for(let t=u.length-1;t>=0;t--){const i=t==u.length-1?0:t+1;e.beginPath(),e.moveTo(u[t].startX,u[t].startY),e.lineTo(u[i].startX,u[i].startY),e.lineTo(u[i].endX,u[i].endY),e.lineTo(u[t].endX,u[t].endY),e.fillStyle=p,e.fill();}e.restore();}static drawParticle(t,e,o,n,s,a,r,l,c,d,u){const h=o.getPosition();e.save(),e.translate(h.x,h.y),e.beginPath();const v=o.rotate.value+(o.particlesOptions.rotate.path?o.pathAngle:0);0!==v&&e.rotate(v),r&&(e.globalCompositeOperation=l);const p=o.shadowColor;u.enable&&p&&(e.shadowBlur=u.blur,e.shadowColor=W.ColorUtils.getStyleFromRgb(p),e.shadowOffsetX=u.offset.x,e.shadowOffsetY=u.offset.y),s&&(e.fillStyle=s);const f=o.stroke;e.lineWidth=o.strokeWidth,a&&(e.strokeStyle=a),i.drawShape(t,e,o,c,d,n),f.width>0&&e.stroke(),o.close&&e.closePath(),o.fill&&e.fill(),e.restore(),e.save(),e.translate(h.x,h.y),0!==v&&e.rotate(v),r&&(e.globalCompositeOperation=l),i.drawShapeAfterEffect(t,e,o,c,d,n),e.restore();}static drawShape(t,e,i,o,n,s){if(!i.shape)return;const a=t.drawers.get(i.shape);a&&a.draw(e,i,o,n,s.value,t.retina.pixelRatio);}static drawShapeAfterEffect(t,e,i,o,n,s){if(!i.shape)return;const a=t.drawers.get(i.shape);(null==a?void 0:a.afterEffect)&&a.afterEffect(e,i,o,n,s.value,t.retina.pixelRatio);}static drawPlugin(t,e,i){void 0!==e.draw&&(t.save(),e.draw(t,i),t.restore());}static drawLine(t,e,i){t.beginPath(),t.moveTo(e.x,e.y),t.lineTo(i.x,i.y),t.closePath();}static drawTriangle(t,e,i,o){t.beginPath(),t.moveTo(e.x,e.y),t.lineTo(i.x,i.y),t.lineTo(o.x,o.y),t.closePath();}}e.CanvasUtils=i;})),X=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Range=void 0;e.Range=class{constructor(t,e){this.position={x:t,y:e};}};})),Y=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Circle=void 0;class i extends X.Range{constructor(t,e,i){super(t,e),this.radius=i;}contains(t){return Math.pow(t.x-this.position.x,2)+Math.pow(t.y-this.position.y,2)<=this.radius*this.radius}intersects(t){const e=t,i=t,o=this.position,n=t.position,s=Math.abs(n.x-o.x),a=Math.abs(n.y-o.y),r=this.radius;if(void 0!==i.radius){return r+i.radius>Math.sqrt(s*s+a+a)}if(void 0!==e.size){const t=e.size.width,i=e.size.height,o=Math.pow(s-t,2)+Math.pow(a-i,2);return !(s>r+t||a>r+i)&&(s<=t||a<=i||o<=r*r)}return !1}}e.Circle=i;})),J=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Rectangle=void 0;class i extends X.Range{constructor(t,e,i,o){super(t,e),this.size={height:o,width:i};}contains(t){const e=this.size.width,i=this.size.height,o=this.position;return t.x>=o.x&&t.x<=o.x+e&&t.y>=o.y&&t.y<=o.y+i}intersects(t){const e=t,i=t,o=this.size.width,n=this.size.height,s=this.position,a=t.position;if(void 0!==i.radius)return i.intersects(this);if(void 0!==e.size){const t=e.size,i=t.width,r=t.height;return a.x<s.x+o&&a.x+i>s.x&&a.y<s.y+n&&a.y+r>s.y}return !1}}e.Rectangle=i;})),Q=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.CircleWarp=void 0;class i extends Y.Circle{constructor(t,e,i,o){super(t,e,i),this.canvasSize=o,this.canvasSize={height:o.height,width:o.width};}contains(t){if(super.contains(t))return !0;const e={x:t.x-this.canvasSize.width,y:t.y};if(super.contains(e))return !0;const i={x:t.x-this.canvasSize.width,y:t.y-this.canvasSize.height};if(super.contains(i))return !0;const o={x:t.x,y:t.y-this.canvasSize.height};return super.contains(o)}intersects(t){if(super.intersects(t))return !0;const e=t,i=t,o={x:t.position.x-this.canvasSize.width,y:t.position.y-this.canvasSize.height};if(void 0!==i.radius){const t=new Y.Circle(o.x,o.y,2*i.radius);return super.intersects(t)}if(void 0!==e.size){const t=new J.Rectangle(o.x,o.y,2*e.size.width,2*e.size.height);return super.intersects(t)}return !1}}e.CircleWarp=i;})),Z=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ClickMode=void 0,function(t){t.attract="attract",t.bubble="bubble",t.push="push",t.remove="remove",t.repulse="repulse",t.pause="pause",t.trail="trail";}(e.ClickMode||(e.ClickMode={}));})),K=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.DivMode=void 0,function(t){t.bounce="bounce",t.bubble="bubble",t.repulse="repulse";}(e.DivMode||(e.DivMode={}));})),tt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.HoverMode=void 0,function(t){t.attract="attract",t.bounce="bounce",t.bubble="bubble",t.connect="connect",t.grab="grab",t.light="light",t.repulse="repulse",t.slow="slow",t.trail="trail";}(e.HoverMode||(e.HoverMode={}));})),et=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.CollisionMode=void 0,function(t){t.absorb="absorb",t.bounce="bounce",t.destroy="destroy";}(e.CollisionMode||(e.CollisionMode={}));})),it=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.OutMode=void 0,function(t){t.bounce="bounce",t.bounceHorizontal="bounce-horizontal",t.bounceVertical="bounce-vertical",t.none="none",t.out="out",t.destroy="destroy";}(e.OutMode||(e.OutMode={}));})),ot=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.SizeMode=void 0,function(t){t.precise="precise",t.percent="percent";}(e.SizeMode||(e.SizeMode={}));})),nt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ThemeMode=void 0,function(t){t.any="any",t.dark="dark",t.light="light";}(e.ThemeMode||(e.ThemeMode={}));})),st=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(Z,e),F.__exportStar(K,e),F.__exportStar(tt,e),F.__exportStar(et,e),F.__exportStar(it,e),F.__exportStar(ot,e),F.__exportStar(nt,e);})),at=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AnimationStatus=void 0,function(t){t[t.increasing=0]="increasing",t[t.decreasing=1]="decreasing";}(e.AnimationStatus||(e.AnimationStatus={}));})),rt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.DestroyType=void 0,function(t){t.none="none",t.max="max",t.min="min";}(e.DestroyType||(e.DestroyType={}));})),lt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ProcessBubbleType=void 0,function(t){t.color="color",t.opacity="opacity",t.size="size";}(e.ProcessBubbleType||(e.ProcessBubbleType={}));})),ct=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ShapeType=void 0,function(t){t.char="char",t.character="character",t.circle="circle",t.edge="edge",t.image="image",t.images="images",t.line="line",t.polygon="polygon",t.square="square",t.star="star",t.triangle="triangle";}(e.ShapeType||(e.ShapeType={}));})),dt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.StartValueType=void 0,function(t){t.max="max",t.min="min",t.random="random";}(e.StartValueType||(e.StartValueType={}));})),ut=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.DivType=void 0,function(t){t.circle="circle",t.rectangle="rectangle";}(e.DivType||(e.DivType={}));})),ht=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(rt,e),F.__exportStar(lt,e),F.__exportStar(ct,e),F.__exportStar(dt,e),F.__exportStar(ut,e);})),vt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.InteractivityDetect=void 0,function(t){t.canvas="canvas",t.parent="parent",t.window="window";}(e.InteractivityDetect||(e.InteractivityDetect={}));})),pt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(V,e),F.__exportStar(st,e),F.__exportStar(at,e),F.__exportStar(ht,e),F.__exportStar(vt,e);})),ft=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EventListeners=void 0;class i{constructor(t){this.container=t,this.canPush=!0,this.mouseMoveHandler=t=>this.mouseTouchMove(t),this.touchStartHandler=t=>this.mouseTouchMove(t),this.touchMoveHandler=t=>this.mouseTouchMove(t),this.touchEndHandler=()=>this.mouseTouchFinish(),this.mouseLeaveHandler=()=>this.mouseTouchFinish(),this.touchCancelHandler=()=>this.mouseTouchFinish(),this.touchEndClickHandler=t=>this.mouseTouchClick(t),this.mouseUpHandler=t=>this.mouseTouchClick(t),this.mouseDownHandler=()=>this.mouseDown(),this.visibilityChangeHandler=()=>this.handleVisibilityChange(),this.resizeHandler=()=>this.handleWindowResize();}static manageListener(t,e,i,o,n){if(o){let o={passive:!0};"boolean"==typeof n?o.capture=n:void 0!==n&&(o=n),t.addEventListener(e,i,o);}else {const o=n;t.removeEventListener(e,i,o);}}addListeners(){this.manageListeners(!0);}removeListeners(){this.manageListeners(!1);}manageListeners(t){const e=this.container,o=e.options,n=o.interactivity.detectsOn;let s=$.Constants.mouseLeaveEvent;n===pt.InteractivityDetect.window?(e.interactivity.element=window,s=$.Constants.mouseOutEvent):n===pt.InteractivityDetect.parent&&e.canvas.element?e.interactivity.element=e.canvas.element.parentNode:e.interactivity.element=e.canvas.element;const a=e.interactivity.element;a&&(o.interactivity.events.onHover.enable||o.interactivity.events.onClick.enable)&&(i.manageListener(a,$.Constants.mouseMoveEvent,this.mouseMoveHandler,t),i.manageListener(a,$.Constants.touchStartEvent,this.touchStartHandler,t),i.manageListener(a,$.Constants.touchMoveEvent,this.touchMoveHandler,t),o.interactivity.events.onClick.enable||i.manageListener(a,$.Constants.touchEndEvent,this.touchEndHandler,t),i.manageListener(a,s,this.mouseLeaveHandler,t),i.manageListener(a,$.Constants.touchCancelEvent,this.touchCancelHandler,t)),o.interactivity.events.onClick.enable&&a&&(i.manageListener(a,$.Constants.touchEndEvent,this.touchEndClickHandler,t),i.manageListener(a,$.Constants.mouseUpEvent,this.mouseUpHandler,t),i.manageListener(a,$.Constants.mouseDownEvent,this.mouseDownHandler,t)),o.interactivity.events.resize&&i.manageListener(window,$.Constants.resizeEvent,this.resizeHandler,t),document&&i.manageListener(document,$.Constants.visibilityChangeEvent,this.visibilityChangeHandler,t,!1);}handleWindowResize(){var t;null===(t=this.container.canvas)||void 0===t||t.windowResize();}handleVisibilityChange(){const t=this.container,e=t.options;this.mouseTouchFinish(),e.pauseOnBlur&&((null===document||void 0===document?void 0:document.hidden)?(t.pageHidden=!0,t.pause()):(t.pageHidden=!1,t.getAnimationStatus()?t.play(!0):t.draw()));}mouseDown(){const t=this.container.interactivity;if(t){const e=t.mouse;e.clicking=!0,e.downPosition=e.position;}}mouseTouchMove(t){var e,i,o;const n=this.container,s=n.options;if(void 0===(null===(e=n.interactivity)||void 0===e?void 0:e.element))return;let a;n.interactivity.mouse.inside=!0;const r=n.canvas.element;if(t.type.startsWith("mouse")){this.canPush=!0;const e=t;if(n.interactivity.element===window){if(r){const t=r.getBoundingClientRect();a={x:e.clientX-t.left,y:e.clientY-t.top};}}else if(s.interactivity.detectsOn===pt.InteractivityDetect.parent){const t=e.target,i=e.currentTarget;if(t&&i){const o=t.getBoundingClientRect(),n=i.getBoundingClientRect();a={x:e.offsetX+o.left-n.left,y:e.offsetY+o.top-n.top};}else a={x:e.offsetX||e.clientX,y:e.offsetY||e.clientY};}else e.target===n.canvas.element&&(a={x:e.offsetX||e.clientX,y:e.offsetY||e.clientY});}else {this.canPush="touchmove"!==t.type;const e=t,n=e.touches[e.touches.length-1],s=null==r?void 0:r.getBoundingClientRect();a={x:n.clientX-(null!==(i=null==s?void 0:s.left)&&void 0!==i?i:0),y:n.clientY-(null!==(o=null==s?void 0:s.top)&&void 0!==o?o:0)};}const l=n.retina.pixelRatio;a&&(a.x*=l,a.y*=l),n.interactivity.mouse.position=a,n.interactivity.status=$.Constants.mouseMoveEvent;}mouseTouchFinish(){const t=this.container.interactivity;if(void 0===t)return;const e=t.mouse;delete e.position,delete e.clickPosition,delete e.downPosition,t.status=$.Constants.mouseLeaveEvent,e.inside=!1,e.clicking=!1;}mouseTouchClick(t){const e=this.container,i=e.options,o=e.interactivity.mouse;o.inside=!0;let n=!1;const s=o.position;if(void 0!==s&&i.interactivity.events.onClick.enable){for(const[,t]of e.plugins)if(void 0!==t.clickPositionValid&&(n=t.clickPositionValid(s),n))break;n||this.doMouseTouchClick(t),o.clicking=!1;}}doMouseTouchClick(t){const e=this.container,i=e.options;if(this.canPush){const t=e.interactivity.mouse.position;if(!t)return;e.interactivity.mouse.clickPosition={x:t.x,y:t.y},e.interactivity.mouse.clickTime=(new Date).getTime();const o=i.interactivity.events.onClick;if(o.mode instanceof Array)for(const t of o.mode)this.handleClickMode(t);else this.handleClickMode(o.mode);}"touchend"===t.type&&setTimeout(()=>this.mouseTouchFinish(),500);}handleClickMode(t){const e=this.container,i=e.options,o=i.interactivity.modes.push.quantity,n=i.interactivity.modes.remove.quantity;switch(t){case pt.ClickMode.push:o>0&&(i.particles.move.enable||1===o?e.particles.push(o,e.interactivity.mouse):o>1&&e.particles.push(o));break;case pt.ClickMode.remove:e.particles.removeQuantity(n);break;case pt.ClickMode.bubble:e.bubble.clicking=!0;break;case pt.ClickMode.repulse:e.repulse.clicking=!0,e.repulse.count=0;for(const t of e.repulse.particles)t.velocity.horizontal=t.initialVelocity.horizontal,t.velocity.vertical=t.initialVelocity.vertical;e.repulse.particles=[],e.repulse.finish=!1,setTimeout(()=>{e.destroyed||(e.repulse.clicking=!1);},1e3*i.interactivity.modes.repulse.duration);break;case pt.ClickMode.attract:e.attract.clicking=!0,e.attract.count=0;for(const t of e.attract.particles)t.velocity.horizontal=t.initialVelocity.horizontal,t.velocity.vertical=t.initialVelocity.vertical;e.attract.particles=[],e.attract.finish=!1,setTimeout(()=>{e.destroyed||(e.attract.clicking=!1);},1e3*i.interactivity.modes.attract.duration);break;case pt.ClickMode.pause:e.getAnimationStatus()?e.pause():e.play();}for(const[,i]of e.plugins)i.handleClickMode&&i.handleClickMode(t);}}e.EventListeners=i;})),yt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Plugins=void 0;class i{static getPlugin(t){return i.plugins.find(e=>e.id===t)}static addPlugin(t){i.getPlugin(t.id)||i.plugins.push(t);}static getAvailablePlugins(t){const e=new Map;for(const o of i.plugins)o.needsPlugin(t.options)&&e.set(o.id,o.getPlugin(t));return e}static loadOptions(t,e){for(const o of i.plugins)o.loadOptions(t,e);}static getPreset(t){return i.presets.get(t)}static addPreset(t,e){i.getPreset(t)||i.presets.set(t,e);}static addShapeDrawer(t,e){i.getShapeDrawer(t)||i.drawers.set(t,e);}static getShapeDrawer(t){return i.drawers.get(t)}static getSupportedShapes(){return i.drawers.keys()}}e.Plugins=i,i.plugins=[],i.presets=new Map,i.drawers=new Map;})),mt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Point=void 0;e.Point=class{constructor(t,e){this.position=t,this.particle=e;}};})),bt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.QuadTree=void 0;class i{constructor(t,e){this.rectangle=t,this.capacity=e,this.points=[],this.divided=!1;}subdivide(){const t=this.rectangle.position.x,e=this.rectangle.position.y,o=this.rectangle.size.width,n=this.rectangle.size.height,s=this.capacity;this.northEast=new i(new J.Rectangle(t,e,o/2,n/2),s),this.northWest=new i(new J.Rectangle(t+o/2,e,o/2,n/2),s),this.southEast=new i(new J.Rectangle(t,e+n/2,o/2,n/2),s),this.southWest=new i(new J.Rectangle(t+o/2,e+n/2,o/2,n/2),s),this.divided=!0;}insert(t){var e,i,o,n,s;return !!this.rectangle.contains(t.position)&&(this.points.length<this.capacity?(this.points.push(t),!0):(this.divided||this.subdivide(),null!==(s=(null===(e=this.northEast)||void 0===e?void 0:e.insert(t))||(null===(i=this.northWest)||void 0===i?void 0:i.insert(t))||(null===(o=this.southEast)||void 0===o?void 0:o.insert(t))||(null===(n=this.southWest)||void 0===n?void 0:n.insert(t)))&&void 0!==s&&s))}queryCircle(t,e){return this.query(new Y.Circle(t.x,t.y,e))}queryCircleWarp(t,e,i){const o=i,n=i;return this.query(new Q.CircleWarp(t.x,t.y,e,void 0!==o.canvas?o.canvas.size:n))}queryRectangle(t,e){return this.query(new J.Rectangle(t.x,t.y,e.width,e.height))}query(t,e){var i,o,n,s;const a=null!=e?e:[];if(!t.intersects(this.rectangle))return [];for(const e of this.points)t.contains(e.position)&&a.push(e.particle);return this.divided&&(null===(i=this.northEast)||void 0===i||i.query(t,a),null===(o=this.northWest)||void 0===o||o.query(t,a),null===(n=this.southEast)||void 0===n||n.query(t,a),null===(s=this.southWest)||void 0===s||s.query(t,a)),a}}e.QuadTree=i;})),gt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(G,e),F.__exportStar(Y,e),F.__exportStar(Q,e),F.__exportStar(W,e),F.__exportStar($,e),F.__exportStar(ft,e),F.__exportStar(N,e),F.__exportStar(yt,e),F.__exportStar(mt,e),F.__exportStar(bt,e),F.__exportStar(X,e),F.__exportStar(J,e),F.__exportStar(q,e);})),wt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.TextDrawer=void 0;e.TextDrawer=class{getSidesCount(){return 12}init(t){var e;return F.__awaiter(this,void 0,void 0,(function*(){const i=t.options;if(gt.Utils.isInArray(pt.ShapeType.char,i.particles.shape.type)||gt.Utils.isInArray(pt.ShapeType.character,i.particles.shape.type)){const t=null!==(e=i.particles.shape.options[pt.ShapeType.character])&&void 0!==e?e:i.particles.shape.options[pt.ShapeType.char];if(t instanceof Array)for(const e of t)yield gt.Utils.loadFont(e);else void 0!==t&&(yield gt.Utils.loadFont(t));}}))}draw(t,e,i){const o=e.shapeData;if(void 0===o)return;const n=o.value;if(void 0===n)return;const s=e;void 0===s.text&&(s.text=n instanceof Array?gt.Utils.itemFromArray(n,e.randomIndexData):n);const a=s.text,r=o.style,l=o.weight,c=2*Math.round(i),d=o.font,u=e.fill,h=a.length*i/2;t.font=`${r} ${l} ${c}px "${d}"`;const v={x:-h,y:i/2};u?t.fillText(a,v.x,v.y):t.strokeText(a,v.x,v.y);}};})),_t=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ImageDrawer=void 0;e.ImageDrawer=class{constructor(){this.images=[];}getSidesCount(){return 12}getImages(t){const e=this.images.filter(e=>e.id===t.id);return e.length?e[0]:(this.images.push({id:t.id,images:[]}),this.getImages(t))}addImage(t,e){const i=this.getImages(t);null==i||i.images.push(e);}init(t){var e;return F.__awaiter(this,void 0,void 0,(function*(){const i=t.options.particles.shape;if(!gt.Utils.isInArray(pt.ShapeType.image,i.type)&&!gt.Utils.isInArray(pt.ShapeType.images,i.type))return;const o=null!==(e=i.options[pt.ShapeType.images])&&void 0!==e?e:i.options[pt.ShapeType.image];if(o instanceof Array)for(const e of o)yield this.loadImageShape(t,e);else yield this.loadImageShape(t,o);}))}destroy(){this.images=[];}loadImageShape(t,e){return F.__awaiter(this,void 0,void 0,(function*(){try{const i=e.replaceColor?yield gt.Utils.downloadSvgImage(e.src):yield gt.Utils.loadImage(e.src);this.addImage(t,i);}catch(t){console.warn(`tsParticles error - ${e.src} not found`);}}))}draw(t,e,i,o){var n,s;if(!t)return;const a=e.image,r=null===(n=null==a?void 0:a.data)||void 0===n?void 0:n.element;if(!r)return;const l=null!==(s=null==a?void 0:a.ratio)&&void 0!==s?s:1,c={x:-i,y:-i};(null==a?void 0:a.data.svgData)&&(null==a?void 0:a.replaceColor)||(t.globalAlpha=o),t.drawImage(r,c.x,c.y,2*i,2*i/l),(null==a?void 0:a.data.svgData)&&(null==a?void 0:a.replaceColor)||(t.globalAlpha=1);}};})),Mt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LineDrawer=void 0;e.LineDrawer=class{getSidesCount(){return 1}draw(t,e,i){t.moveTo(0,-i/2),t.lineTo(0,i/2);}};})),Pt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.CircleDrawer=void 0;e.CircleDrawer=class{getSidesCount(){return 12}draw(t,e,i){t.arc(0,0,i,0,2*Math.PI,!1);}};})),xt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.PolygonDrawerBase=void 0;e.PolygonDrawerBase=class{getSidesCount(t){var e,i;const o=t.shapeData;return null!==(i=null!==(e=null==o?void 0:o.sides)&&void 0!==e?e:null==o?void 0:o.nb_sides)&&void 0!==i?i:5}draw(t,e,i){const o=this.getCenter(e,i),n=this.getSidesData(e,i),s=n.count.numerator*n.count.denominator,a=n.count.numerator/n.count.denominator,r=180*(a-2)/a,l=Math.PI-Math.PI*r/180;if(t){t.beginPath(),t.translate(o.x,o.y),t.moveTo(0,0);for(let e=0;e<s;e++)t.lineTo(n.length,0),t.translate(n.length,0),t.rotate(l);}}};})),kt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.TriangleDrawer=void 0;class i extends xt.PolygonDrawerBase{getSidesCount(){return 3}getSidesData(t,e){return {count:{denominator:2,numerator:3},length:2*e}}getCenter(t,e){return {x:-e,y:e/1.66}}}e.TriangleDrawer=i;})),Ot=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.StarDrawer=void 0;e.StarDrawer=class{getSidesCount(t){var e,i;const o=t.shapeData;return null!==(i=null!==(e=null==o?void 0:o.sides)&&void 0!==e?e:null==o?void 0:o.nb_sides)&&void 0!==i?i:5}draw(t,e,i){var o;const n=e.shapeData,s=this.getSidesCount(e),a=null!==(o=null==n?void 0:n.inset)&&void 0!==o?o:2;t.moveTo(0,0-i);for(let e=0;e<s;e++)t.rotate(Math.PI/s),t.lineTo(0,0-i*a),t.rotate(Math.PI/s),t.lineTo(0,0-i);}};})),Ct=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.PolygonDrawer=void 0;class i extends xt.PolygonDrawerBase{getSidesData(t,e){var i,o;const n=t.shapeData,s=null!==(o=null!==(i=null==n?void 0:n.sides)&&void 0!==i?i:null==n?void 0:n.nb_sides)&&void 0!==o?o:5;return {count:{denominator:1,numerator:s},length:2.66*e/(s/3)}}getCenter(t,e){return {x:-e/(this.getSidesCount(t)/3.5),y:-e/.76}}}e.PolygonDrawer=i;})),St=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Canvas=void 0;e.Canvas=class{constructor(t){this.container=t,this.size={height:0,width:0},this.context=null,this.generatedCanvas=!1;}init(){var t,e,i,o,n,s,a,r,l,c,d,u;this.resize();const h=this.container.options,v=this.element;v&&(h.backgroundMode.enable?(this.originalStyle=gt.Utils.deepExtend({},v.style),v.style.position="fixed",v.style.zIndex=h.backgroundMode.zIndex.toString(10),v.style.top="0",v.style.left="0",v.style.width="100%",v.style.height="100%"):(v.style.position=null!==(e=null===(t=this.originalStyle)||void 0===t?void 0:t.position)&&void 0!==e?e:"",v.style.zIndex=null!==(o=null===(i=this.originalStyle)||void 0===i?void 0:i.zIndex)&&void 0!==o?o:"",v.style.top=null!==(s=null===(n=this.originalStyle)||void 0===n?void 0:n.top)&&void 0!==s?s:"",v.style.left=null!==(r=null===(a=this.originalStyle)||void 0===a?void 0:a.left)&&void 0!==r?r:"",v.style.width=null!==(c=null===(l=this.originalStyle)||void 0===l?void 0:l.width)&&void 0!==c?c:"",v.style.height=null!==(u=null===(d=this.originalStyle)||void 0===d?void 0:d.height)&&void 0!==u?u:""));const p=h.backgroundMask.cover,f=p.color,y=h.particles.move.trail,m=gt.ColorUtils.colorToRgb(f);this.coverColor=void 0!==m?{r:m.r,g:m.g,b:m.b,a:p.opacity}:void 0,this.trailFillColor=gt.ColorUtils.colorToRgb(y.fillColor),this.initBackground(),this.paint();}loadCanvas(t,e){var i;t.className||(t.className=gt.Constants.canvasClass),this.generatedCanvas&&(null===(i=this.element)||void 0===i||i.remove()),this.generatedCanvas=null!=e?e:this.generatedCanvas,this.element=t,this.originalStyle=gt.Utils.deepExtend({},this.element.style),this.size.height=t.offsetHeight,this.size.width=t.offsetWidth,this.context=this.element.getContext("2d"),this.container.retina.init(),this.initBackground();}destroy(){var t;this.generatedCanvas&&(null===(t=this.element)||void 0===t||t.remove()),this.context&&gt.CanvasUtils.clear(this.context,this.size);}resize(){this.element&&(this.element.width=this.size.width,this.element.height=this.size.height);}paint(){const t=this.container.options;this.context&&(t.backgroundMask.enable&&t.backgroundMask.cover&&this.coverColor?(gt.CanvasUtils.clear(this.context,this.size),this.paintBase(gt.ColorUtils.getStyleFromRgb(this.coverColor,this.coverColor.a))):this.paintBase());}clear(){const t=this.container.options,e=t.particles.move.trail;t.backgroundMask.enable?this.paint():e.enable&&e.length>0&&this.trailFillColor?this.paintBase(gt.ColorUtils.getStyleFromRgb(this.trailFillColor,1/e.length)):this.context&&gt.CanvasUtils.clear(this.context,this.size);}windowResize(){if(!this.element)return;const t=this.container,e=t.options,i=t.retina.pixelRatio;t.canvas.size.width=this.element.offsetWidth*i,t.canvas.size.height=this.element.offsetHeight*i,this.element.width=t.canvas.size.width,this.element.height=t.canvas.size.height,e.particles.move.enable||t.particles.redraw(),t.densityAutoParticles();for(const[,e]of t.plugins)void 0!==e.resize&&e.resize();}drawConnectLine(t,e){var i;const o=this.lineStyle(t,e);if(!o)return;const n=this.context;if(!n)return;const s=t.getPosition(),a=e.getPosition();gt.CanvasUtils.drawConnectLine(n,null!==(i=t.linksWidth)&&void 0!==i?i:this.container.retina.linksWidth,o,s,a);}drawGrabLine(t,e,i,o){var n;const s=this.container,a=s.canvas.context;if(!a)return;const r=t.getPosition();gt.CanvasUtils.drawGrabLine(a,null!==(n=t.linksWidth)&&void 0!==n?n:s.retina.linksWidth,r,o,e,i);}drawParticleShadow(t,e){this.context&&gt.CanvasUtils.drawParticleShadow(this.container,this.context,t,e);}drawLinkTriangle(t,e,i){var o;const n=this.container,s=n.options,a=e.destination,r=i.destination,l=t.particlesOptions.links.triangles,c=null!==(o=l.opacity)&&void 0!==o?o:(e.opacity+i.opacity)/2;if(c<=0)return;const d=t.getPosition(),u=a.getPosition(),h=r.getPosition(),v=this.context;if(!v)return;if(gt.NumberUtils.getDistance(d,u)>n.retina.linksDistance||gt.NumberUtils.getDistance(h,u)>n.retina.linksDistance||gt.NumberUtils.getDistance(h,d)>n.retina.linksDistance)return;let p=gt.ColorUtils.colorToRgb(l.color);if(!p){const e=t.particlesOptions.links,i=void 0!==e.id?n.particles.linksColors.get(e.id):n.particles.linksColor;p=gt.ColorUtils.getLinkColor(t,a,i);}p&&gt.CanvasUtils.drawLinkTriangle(v,d,u,h,s.backgroundMask.enable,s.backgroundMask.composite,p,c);}drawLinkLine(t,e){var i,o;const n=this.container,s=n.options,a=e.destination;let r=e.opacity;const l=t.getPosition(),c=a.getPosition(),d=this.context;if(!d)return;let u;const h=t.particlesOptions.twinkle.lines;if(h.enable){const t=h.frequency,e=gt.ColorUtils.colorToRgb(h.color);Math.random()<t&&void 0!==e&&(u=e,r=h.opacity);}if(!u){const e=t.particlesOptions.links,i=void 0!==e.id?n.particles.linksColors.get(e.id):n.particles.linksColor;u=gt.ColorUtils.getLinkColor(t,a,i);}if(!u)return;const v=null!==(i=t.linksWidth)&&void 0!==i?i:n.retina.linksWidth,p=null!==(o=t.linksDistance)&&void 0!==o?o:n.retina.linksDistance;gt.CanvasUtils.drawLinkLine(d,v,l,c,p,n.canvas.size,t.particlesOptions.links.warp,s.backgroundMask.enable,s.backgroundMask.composite,u,r,t.particlesOptions.links.shadow);}drawParticle(t,e){var i,o,n,s;if(!1===(null===(i=t.image)||void 0===i?void 0:i.loaded)||t.spawning||t.destroyed)return;const a=t.getFillColor(),r=null!==(o=t.getStrokeColor())&&void 0!==o?o:a;if(!a&&!r)return;const l=this.container,c=l.options,d=l.particles,u=t.particlesOptions,h=u.twinkle.particles,v=h.frequency,p=gt.ColorUtils.colorToRgb(h.color),f=h.enable&&Math.random()<v,y=t.getRadius(),m=f?h.opacity:null!==(n=t.bubble.opacity)&&void 0!==n?n:t.opacity.value,b=t.infecter.infectionStage,g=c.infection.stages,w=void 0!==b?g[b].color:void 0,_=gt.ColorUtils.colorToRgb(w),M=f&&void 0!==p?p:null!=_?_:a?gt.ColorUtils.hslToRgb(a):void 0,P=f&&void 0!==p?p:null!=_?_:r?gt.ColorUtils.hslToRgb(r):void 0,x=void 0!==M?gt.ColorUtils.getStyleFromRgb(M,m):void 0;if(!this.context||!x&&!P)return;const k=void 0!==P?gt.ColorUtils.getStyleFromRgb(P,null!==(s=t.stroke.opacity)&&void 0!==s?s:m):x;if(t.links.length>0){this.context.save();const e=t.links.filter(e=>l.particles.getLinkFrequency(t,e.destination)<=u.links.frequency);for(const i of e){const o=i.destination;if(u.links.triangles.enable){const n=e.map(t=>t.destination),s=o.links.filter(t=>l.particles.getLinkFrequency(o,t.destination)<=o.particlesOptions.links.frequency&&n.indexOf(t.destination)>=0);if(s.length)for(const e of s){const n=e.destination;d.getTriangleFrequency(t,o,n)>u.links.triangles.frequency||this.drawLinkTriangle(t,i,e);}}i.opacity>0&&l.retina.linksWidth>0&&this.drawLinkLine(t,i);}this.context.restore();}y>0&&gt.CanvasUtils.drawParticle(this.container,this.context,t,e,x,k,c.backgroundMask.enable,c.backgroundMask.composite,y,m,t.particlesOptions.shadow);}drawPlugin(t,e){this.context&&gt.CanvasUtils.drawPlugin(this.context,t,e);}drawLight(t){this.context&&gt.CanvasUtils.drawLight(this.container,this.context,t);}paintBase(t){this.context&&gt.CanvasUtils.paintBase(this.context,this.size,t);}lineStyle(t,e){const i=this.container.options.interactivity.modes.connect;if(this.context)return gt.CanvasUtils.gradient(this.context,t,e,i.links.opacity)}initBackground(){const t=this.container.options.background,e=this.element;if(!e)return;const i=e.style;if(t.color){const e=gt.ColorUtils.colorToRgb(t.color);e&&(i.backgroundColor=gt.ColorUtils.getStyleFromRgb(e,t.opacity));}t.image&&(i.backgroundImage=t.image),t.position&&(i.backgroundPosition=t.position),t.repeat&&(i.backgroundRepeat=t.repeat),t.size&&(i.backgroundSize=t.size);}};})),Tt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Updater=void 0;e.Updater=class{constructor(t,e){this.container=t,this.particle=e;}update(t){this.particle.destroyed||(this.updateLife(t),this.particle.destroyed||this.particle.spawning||(this.updateOpacity(t),this.updateSize(t),this.updateAngle(t),this.updateColor(t),this.updateStrokeColor(t),this.updateOutModes(t)));}updateLife(t){const e=this.particle;let i=!1;if(e.spawning&&(e.lifeDelayTime+=t.value,e.lifeDelayTime>=e.lifeDelay&&(i=!0,e.spawning=!1,e.lifeDelayTime=0,e.lifeTime=0)),-1!==e.lifeDuration&&!e.spawning&&(i?e.lifeTime=0:e.lifeTime+=t.value,e.lifeTime>=e.lifeDuration)){if(e.lifeTime=0,e.livesRemaining>0&&e.livesRemaining--,0===e.livesRemaining)return void e.destroy();const t=this.container.canvas.size;e.position.x=gt.NumberUtils.randomInRange(0,t.width),e.position.y=gt.NumberUtils.randomInRange(0,t.height),e.spawning=!0,e.lifeDelayTime=0,e.lifeTime=0;const i=e.particlesOptions.life;e.lifeDelay=1e3*gt.NumberUtils.getValue(i.delay),e.lifeDuration=1e3*gt.NumberUtils.getValue(i.duration);}}updateOpacity(t){var e,i;const o=this.particle;if(o.particlesOptions.opacity.animation.enable){switch(o.opacity.status){case pt.AnimationStatus.increasing:o.opacity.value>=o.particlesOptions.opacity.value?o.opacity.status=pt.AnimationStatus.decreasing:o.opacity.value+=(null!==(e=o.opacity.velocity)&&void 0!==e?e:0)*t.factor;break;case pt.AnimationStatus.decreasing:o.opacity.value<=o.particlesOptions.opacity.animation.minimumValue?o.opacity.status=pt.AnimationStatus.increasing:o.opacity.value-=(null!==(i=o.opacity.velocity)&&void 0!==i?i:0)*t.factor;}o.opacity.value<0&&(o.opacity.value=0);}}updateSize(t){var e,i;const o=this.container,n=this.particle,s=n.particlesOptions.size.animation,a=(null!==(e=n.size.velocity)&&void 0!==e?e:0)*t.factor,r=null!==(i=n.sizeValue)&&void 0!==i?i:o.retina.sizeValue,l=s.minimumValue*o.retina.pixelRatio;if(s.enable){switch(n.size.status){case pt.AnimationStatus.increasing:n.size.value>=r?n.size.status=pt.AnimationStatus.decreasing:n.size.value+=a;break;case pt.AnimationStatus.decreasing:n.size.value<=l?n.size.status=pt.AnimationStatus.increasing:n.size.value-=a;}switch(s.destroy){case pt.DestroyType.max:n.size.value>=r&&n.destroy();break;case pt.DestroyType.min:n.size.value<=l&&n.destroy();}n.size.value<0&&!n.destroyed&&(n.size.value=0);}}updateAngle(t){var e;const i=this.particle,o=i.particlesOptions.rotate,n=o.animation,s=(null!==(e=i.rotate.velocity)&&void 0!==e?e:0)*t.factor,a=2*Math.PI;if(o.path)i.pathAngle=Math.atan2(i.velocity.vertical,i.velocity.horizontal);else if(n.enable)switch(i.rotate.status){case pt.AnimationStatus.increasing:i.rotate.value+=s,i.rotate.value>a&&(i.rotate.value-=a);break;case pt.AnimationStatus.decreasing:default:i.rotate.value-=s,i.rotate.value<0&&(i.rotate.value+=a);}}updateColor(t){var e;const i=this.particle;void 0!==i.color.value&&i.particlesOptions.color.animation.enable&&(i.color.value.h+=(null!==(e=i.color.velocity)&&void 0!==e?e:0)*t.factor,i.color.value.h>360&&(i.color.value.h-=360));}updateStrokeColor(t){var e,i;const o=this.particle,n=o.stroke.color;"string"!=typeof n&&void 0!==n&&void 0!==o.strokeColor.value&&n.animation.enable&&(o.strokeColor.value.h+=(null!==(i=null!==(e=o.strokeColor.velocity)&&void 0!==e?e:o.color.velocity)&&void 0!==i?i:0)*t.factor,o.strokeColor.value.h>360&&(o.strokeColor.value.h-=360));}updateOutModes(t){var e,i,o,n;const s=this.particle.particlesOptions.move.outModes;this.updateOutMode(t,null!==(e=s.bottom)&&void 0!==e?e:s.default,L.OutModeDirection.bottom),this.updateOutMode(t,null!==(i=s.left)&&void 0!==i?i:s.default,L.OutModeDirection.left),this.updateOutMode(t,null!==(o=s.right)&&void 0!==o?o:s.default,L.OutModeDirection.right),this.updateOutMode(t,null!==(n=s.top)&&void 0!==n?n:s.default,L.OutModeDirection.top);}updateOutMode(t,e,i){const o=this.container,n=this.particle,s=n.particlesOptions.move.gravity;switch(e){case pt.OutMode.bounce:case pt.OutMode.bounceVertical:case pt.OutMode.bounceHorizontal:case"bounceVertical":case"bounceHorizontal":this.updateBounce(t,i,e);break;case pt.OutMode.destroy:gt.Utils.isPointInside(n.position,o.canvas.size,n.getRadius(),i)||o.particles.remove(n);break;case pt.OutMode.out:gt.Utils.isPointInside(n.position,o.canvas.size,n.getRadius(),i)||this.fixOutOfCanvasPosition(i);break;case pt.OutMode.none:if(n.particlesOptions.move.distance)return;if(s.enable){const t=n.position;(s.acceleration>=0&&t.y>o.canvas.size.height&&i===L.OutModeDirection.bottom||s.acceleration<0&&t.y<0&&i===L.OutModeDirection.top)&&o.particles.remove(n);}else gt.Utils.isPointInside(n.position,o.canvas.size,n.getRadius(),i)||o.particles.remove(n);}}fixOutOfCanvasPosition(t){const e=this.container,i=this.particle,o=i.particlesOptions.move.warp,n=e.canvas.size,s={bottom:n.height+i.getRadius()-i.offset.y,left:-i.getRadius()-i.offset.x,right:n.width+i.getRadius()+i.offset.x,top:-i.getRadius()-i.offset.y},a=i.getRadius(),r=gt.Utils.calculateBounds(i.position,a);t===L.OutModeDirection.right&&r.left>n.width-i.offset.x?(i.position.x=s.left,o||(i.position.y=Math.random()*n.height)):t===L.OutModeDirection.left&&r.right<-i.offset.x&&(i.position.x=s.right,o||(i.position.y=Math.random()*n.height)),t===L.OutModeDirection.bottom&&r.top>n.height-i.offset.y?(o||(i.position.x=Math.random()*n.width),i.position.y=s.top):t===L.OutModeDirection.top&&r.bottom<-i.offset.y&&(o||(i.position.x=Math.random()*n.width),i.position.y=s.bottom);}updateBounce(t,e,i){const o=this.container,n=this.particle;let s=!1;for(const[,i]of o.plugins)if(void 0!==i.particleBounce&&(s=i.particleBounce(n,t,e)),s)break;if(s)return;const a=n.getPosition(),r=n.offset,l=n.getRadius(),c=gt.Utils.calculateBounds(a,l),d=o.canvas.size;if(i===pt.OutMode.bounce||i===pt.OutMode.bounceHorizontal||"bounceHorizontal"===i){const t=n.velocity.horizontal;let i=!1;if(e===L.OutModeDirection.right&&c.right>=d.width&&t>0||e===L.OutModeDirection.left&&c.left<=0&&t<0){const t=gt.NumberUtils.getValue(n.particlesOptions.bounce.horizontal);n.velocity.horizontal*=-t,i=!0;}if(i){const t=r.x+l;c.right>=d.width?n.position.x=d.width-t:c.left<=0&&(n.position.x=t);}}if(i===pt.OutMode.bounce||i===pt.OutMode.bounceVertical||"bounceVertical"===i){const t=n.velocity.vertical;let i=!1;if(e===L.OutModeDirection.bottom&&c.bottom>=o.canvas.size.height&&t>0||e===L.OutModeDirection.top&&c.top<=0&&t<0){const t=gt.NumberUtils.getValue(n.particlesOptions.bounce.vertical);n.velocity.vertical*=-t,i=!0;}if(i){const t=r.y+l;c.bottom>=d.height?n.position.y=d.height-t:c.top<=0&&(n.position.y=t);}}}};})),Rt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.OptionsColor=void 0;class i{constructor(){this.value="#fff";}static create(t,e){const o=null!=t?t:new i;return void 0!==e&&o.load("string"==typeof e?{value:e}:e),o}load(t){void 0!==(null==t?void 0:t.value)&&(this.value=t.value);}}e.OptionsColor=i;})),At=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LinksShadow=void 0;e.LinksShadow=class{constructor(){this.blur=5,this.color=new Rt.OptionsColor,this.enable=!1,this.color.value="#00ff00";}load(t){void 0!==t&&(void 0!==t.blur&&(this.blur=t.blur),this.color=Rt.OptionsColor.create(this.color,t.color),void 0!==t.enable&&(this.enable=t.enable));}};})),zt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LinksTriangle=void 0;e.LinksTriangle=class{constructor(){this.enable=!1,this.frequency=1;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.frequency&&(this.frequency=t.frequency),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),Dt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Links=void 0;e.Links=class{constructor(){this.blink=!1,this.color=new Rt.OptionsColor,this.consent=!1,this.distance=100,this.enable=!1,this.frequency=1,this.opacity=1,this.shadow=new At.LinksShadow,this.triangles=new zt.LinksTriangle,this.width=1,this.warp=!1;}load(t){void 0!==t&&(void 0!==t.id&&(this.id=t.id),void 0!==t.blink&&(this.blink=t.blink),this.color=Rt.OptionsColor.create(this.color,t.color),void 0!==t.consent&&(this.consent=t.consent),void 0!==t.distance&&(this.distance=t.distance),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.frequency&&(this.frequency=t.frequency),void 0!==t.opacity&&(this.opacity=t.opacity),this.shadow.load(t.shadow),this.triangles.load(t.triangles),void 0!==t.width&&(this.width=t.width),void 0!==t.warp&&(this.warp=t.warp));}};})),Et=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Attract=void 0;e.Attract=class{constructor(){this.enable=!1,this.rotate={x:3e3,y:3e3};}get rotateX(){return this.rotate.x}set rotateX(t){this.rotate.x=t;}get rotateY(){return this.rotate.y}set rotateY(t){this.rotate.y=t;}load(t){var e,i,o,n;if(void 0===t)return;void 0!==t.enable&&(this.enable=t.enable);const s=null!==(i=null===(e=t.rotate)||void 0===e?void 0:e.x)&&void 0!==i?i:t.rotateX;void 0!==s&&(this.rotate.x=s);const a=null!==(n=null===(o=t.rotate)||void 0===o?void 0:o.y)&&void 0!==n?n:t.rotateY;void 0!==a&&(this.rotate.y=a);}};})),Ut=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Trail=void 0;e.Trail=class{constructor(){this.enable=!1,this.length=10,this.fillColor=new Rt.OptionsColor,this.fillColor.value="#000000";}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),this.fillColor=Rt.OptionsColor.create(this.fillColor,t.fillColor),void 0!==t.length&&(this.length=t.length));}};})),It=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Random=void 0;e.Random=class{constructor(){this.enable=!1,this.minimumValue=0;}load(t){t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.minimumValue&&(this.minimumValue=t.minimumValue));}};})),jt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ValueWithRandom=void 0;e.ValueWithRandom=class{constructor(){this.random=new It.Random,this.value=0;}load(t){t&&("boolean"==typeof t.random?this.random.enable=t.random:this.random.load(t.random),void 0!==t.value&&(this.value=t.value));}};})),Lt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.NoiseDelay=void 0;class i extends jt.ValueWithRandom{constructor(){super();}}e.NoiseDelay=i;})),Bt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Noise=void 0;e.Noise=class{constructor(){this.delay=new Lt.NoiseDelay,this.enable=!1;}load(t){void 0!==t&&(this.delay.load(t.delay),void 0!==t.enable&&(this.enable=t.enable));}};})),Ht=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MoveAngle=void 0;e.MoveAngle=class{constructor(){this.offset=45,this.value=90;}load(t){void 0!==t&&(void 0!==t.offset&&(this.offset=t.offset),void 0!==t.value&&(this.value=t.value));}};})),Ft=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MoveGravity=void 0;e.MoveGravity=class{constructor(){this.acceleration=9.81,this.enable=!1,this.maxSpeed=50;}load(t){t&&(void 0!==t.acceleration&&(this.acceleration=t.acceleration),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.maxSpeed&&(this.maxSpeed=t.maxSpeed));}};})),Vt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.OutModes=void 0;e.OutModes=class{constructor(){this.default=st.OutMode.out;}load(t){var e,i,o,n;t&&(void 0!==t.default&&(this.default=t.default),this.bottom=null!==(e=t.bottom)&&void 0!==e?e:t.default,this.left=null!==(i=t.left)&&void 0!==i?i:t.default,this.right=null!==(o=t.right)&&void 0!==o?o:t.default,this.top=null!==(n=t.top)&&void 0!==n?n:t.default);}};})),Nt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Move=void 0;e.Move=class{constructor(){this.angle=new Ht.MoveAngle,this.attract=new Et.Attract,this.direction=pt.MoveDirection.none,this.distance=0,this.enable=!1,this.gravity=new Ft.MoveGravity,this.noise=new Bt.Noise,this.outModes=new Vt.OutModes,this.random=!1,this.size=!1,this.speed=2,this.straight=!1,this.trail=new Ut.Trail,this.vibrate=!1,this.warp=!1;}get collisions(){return !1}set collisions(t){}get bounce(){return this.collisions}set bounce(t){this.collisions=t;}get out_mode(){return this.outMode}set out_mode(t){this.outMode=t;}get outMode(){return this.outModes.default}set outMode(t){this.outModes.default=t;}load(t){var e,i;if(void 0===t)return;void 0!==t.angle&&("number"==typeof t.angle?this.angle.value=t.angle:this.angle.load(t.angle)),this.attract.load(t.attract),void 0!==t.direction&&(this.direction=t.direction),void 0!==t.distance&&(this.distance=t.distance),void 0!==t.enable&&(this.enable=t.enable),this.gravity.load(t.gravity),this.noise.load(t.noise);const o=null!==(e=t.outMode)&&void 0!==e?e:t.out_mode;void 0===t.outModes&&void 0===o||("string"==typeof t.outModes||void 0===t.outModes&&void 0!==o?this.outModes.load({default:null!==(i=t.outModes)&&void 0!==i?i:o}):this.outModes.load(t.outModes)),void 0!==t.random&&(this.random=t.random),void 0!==t.size&&(this.size=t.size),void 0!==t.speed&&(this.speed=t.speed),void 0!==t.straight&&(this.straight=t.straight),this.trail.load(t.trail),void 0!==t.vibrate&&(this.vibrate=t.vibrate),void 0!==t.warp&&(this.warp=t.warp);}};})),qt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Density=void 0;e.Density=class{constructor(){this.enable=!1,this.area=800,this.factor=1e3;}get value_area(){return this.area}set value_area(t){this.area=t;}load(t){var e;if(void 0===t)return;void 0!==t.enable&&(this.enable=t.enable);const i=null!==(e=t.area)&&void 0!==e?e:t.value_area;void 0!==i&&(this.area=i),void 0!==t.factor&&(this.factor=t.factor);}};})),$t=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ParticlesNumber=void 0;e.ParticlesNumber=class{constructor(){this.density=new qt.Density,this.limit=0,this.value=100;}get max(){return this.limit}set max(t){this.limit=t;}load(t){var e;if(void 0===t)return;this.density.load(t.density);const i=null!==(e=t.limit)&&void 0!==e?e:t.max;void 0!==i&&(this.limit=i),void 0!==t.value&&(this.value=t.value);}};})),Wt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.OpacityAnimation=void 0;e.OpacityAnimation=class{constructor(){this.enable=!1,this.minimumValue=0,this.speed=2,this.sync=!1;}get opacity_min(){return this.minimumValue}set opacity_min(t){this.minimumValue=t;}load(t){var e;if(void 0===t)return;void 0!==t.enable&&(this.enable=t.enable);const i=null!==(e=t.minimumValue)&&void 0!==e?e:t.opacity_min;void 0!==i&&(this.minimumValue=i),void 0!==t.speed&&(this.speed=t.speed),void 0!==t.sync&&(this.sync=t.sync);}};})),Gt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Opacity=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.animation=new Wt.OpacityAnimation,this.random.minimumValue=.1,this.value=1;}get anim(){return this.animation}set anim(t){this.animation=t;}load(t){var e;t&&(super.load(t),this.animation.load(null!==(e=t.animation)&&void 0!==e?e:t.anim));}}e.Opacity=i;})),Xt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Shape=void 0;e.Shape=class{constructor(){this.options={},this.type=pt.ShapeType.circle;}get image(){var t;return null!==(t=this.options[pt.ShapeType.image])&&void 0!==t?t:this.options[pt.ShapeType.images]}set image(t){this.options[pt.ShapeType.image]=t,this.options[pt.ShapeType.images]=t;}get custom(){return this.options}set custom(t){this.options=t;}get images(){return this.image instanceof Array?this.image:[this.image]}set images(t){this.image=t;}get stroke(){return []}set stroke(t){}get character(){var t;return null!==(t=this.options[pt.ShapeType.character])&&void 0!==t?t:this.options[pt.ShapeType.char]}set character(t){this.options[pt.ShapeType.character]=t,this.options[pt.ShapeType.char]=t;}get polygon(){var t;return null!==(t=this.options[pt.ShapeType.polygon])&&void 0!==t?t:this.options[pt.ShapeType.star]}set polygon(t){this.options[pt.ShapeType.polygon]=t,this.options[pt.ShapeType.star]=t;}load(t){var e,i,o;if(void 0===t)return;const n=null!==(e=t.options)&&void 0!==e?e:t.custom;if(void 0!==n)for(const t in n){const e=n[t];void 0!==e&&(this.options[t]=gt.Utils.deepExtend(null!==(i=this.options[t])&&void 0!==i?i:{},e));}this.loadShape(t.character,pt.ShapeType.character,pt.ShapeType.char,!0),this.loadShape(t.polygon,pt.ShapeType.polygon,pt.ShapeType.star,!1),this.loadShape(null!==(o=t.image)&&void 0!==o?o:t.images,pt.ShapeType.image,pt.ShapeType.images,!0),void 0!==t.type&&(this.type=t.type);}loadShape(t,e,i,o){var n,s,a,r;void 0!==t&&(t instanceof Array?(this.options[e]instanceof Array||(this.options[e]=[],this.options[i]&&!o||(this.options[i]=[])),this.options[e]=gt.Utils.deepExtend(null!==(n=this.options[e])&&void 0!==n?n:[],t),this.options[i]&&!o||(this.options[i]=gt.Utils.deepExtend(null!==(s=this.options[i])&&void 0!==s?s:[],t))):(this.options[e]instanceof Array&&(this.options[e]={},this.options[i]&&!o||(this.options[i]={})),this.options[e]=gt.Utils.deepExtend(null!==(a=this.options[e])&&void 0!==a?a:{},t),this.options[i]&&!o||(this.options[i]=gt.Utils.deepExtend(null!==(r=this.options[i])&&void 0!==r?r:{},t))));}};})),Yt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.SizeAnimation=void 0;e.SizeAnimation=class{constructor(){this.destroy=pt.DestroyType.none,this.enable=!1,this.minimumValue=0,this.speed=5,this.startValue=pt.StartValueType.max,this.sync=!1;}get size_min(){return this.minimumValue}set size_min(t){this.minimumValue=t;}load(t){var e;if(void 0===t)return;void 0!==t.destroy&&(this.destroy=t.destroy),void 0!==t.enable&&(this.enable=t.enable);const i=null!==(e=t.minimumValue)&&void 0!==e?e:t.size_min;void 0!==i&&(this.minimumValue=i),void 0!==t.speed&&(this.speed=t.speed),void 0!==t.startValue&&(this.startValue=t.startValue),void 0!==t.sync&&(this.sync=t.sync);}};})),Jt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Size=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.animation=new Yt.SizeAnimation,this.random.minimumValue=1,this.value=3;}get anim(){return this.animation}set anim(t){this.animation=t;}load(t){var e;if(!t)return;super.load(t);const i=null!==(e=t.animation)&&void 0!==e?e:t.anim;void 0!==i&&this.animation.load(i);}}e.Size=i;})),Qt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.RotateAnimation=void 0;e.RotateAnimation=class{constructor(){this.enable=!1,this.speed=0,this.sync=!1;}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.speed&&(this.speed=t.speed),void 0!==t.sync&&(this.sync=t.sync));}};})),Zt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Rotate=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.animation=new Qt.RotateAnimation,this.direction=pt.RotateDirection.clockwise,this.path=!1;}load(t){t&&(super.load(t),void 0!==t.direction&&(this.direction=t.direction),this.animation.load(t.animation),void 0!==t.path&&(this.path=t.path));}}e.Rotate=i;})),Kt=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Shadow=void 0;e.Shadow=class{constructor(){this.blur=0,this.color=new Rt.OptionsColor,this.enable=!1,this.offset={x:0,y:0},this.color.value="#000000";}load(t){void 0!==t&&(void 0!==t.blur&&(this.blur=t.blur),this.color=Rt.OptionsColor.create(this.color,t.color),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.offset&&(void 0!==t.offset.x&&(this.offset.x=t.offset.x),void 0!==t.offset.y&&(this.offset.y=t.offset.y)));}};})),te=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ColorAnimation=void 0;e.ColorAnimation=class{constructor(){this.enable=!1,this.speed=1,this.sync=!0;}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.speed&&(this.speed=t.speed),void 0!==t.sync&&(this.sync=t.sync));}};})),ee=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AnimatableColor=void 0;class i extends Rt.OptionsColor{constructor(){super(),this.animation=new te.ColorAnimation;}static create(t,e){const o=null!=t?t:new i;return void 0!==e&&o.load("string"==typeof e?{value:e}:e),o}load(t){super.load(t),this.animation.load(null==t?void 0:t.animation);}}e.AnimatableColor=i;})),ie=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Stroke=void 0;e.Stroke=class{constructor(){this.width=0;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=ee.AnimatableColor.create(this.color,t.color)),void 0!==t.width&&(this.width=t.width),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),oe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BounceFactor=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.random.minimumValue=.1,this.value=1;}}e.BounceFactor=i;})),ne=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Bounce=void 0;e.Bounce=class{constructor(){this.horizontal=new oe.BounceFactor,this.vertical=new oe.BounceFactor;}load(t){t&&(this.horizontal.load(t.horizontal),this.vertical.load(t.vertical));}};})),se=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Collisions=void 0;e.Collisions=class{constructor(){this.bounce=new ne.Bounce,this.enable=!1,this.mode=pt.CollisionMode.bounce;}load(t){void 0!==t&&(this.bounce.load(t.bounce),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.mode&&(this.mode=t.mode));}};})),ae=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.TwinkleValues=void 0;e.TwinkleValues=class{constructor(){this.enable=!1,this.frequency=.05,this.opacity=1;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.frequency&&(this.frequency=t.frequency),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),re=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Twinkle=void 0;e.Twinkle=class{constructor(){this.lines=new ae.TwinkleValues,this.particles=new ae.TwinkleValues;}load(t){void 0!==t&&(this.lines.load(t.lines),this.particles.load(t.particles));}};})),le=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LifeDelay=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.sync=!1;}load(t){t&&(super.load(t),void 0!==t.sync&&(this.sync=t.sync));}}e.LifeDelay=i;})),ce=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LifeDuration=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.random.minimumValue=1e-4,this.sync=!1;}load(t){void 0!==t&&(super.load(t),void 0!==t.sync&&(this.sync=t.sync));}}e.LifeDuration=i;})),de=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Life=void 0;e.Life=class{constructor(){this.count=0,this.delay=new le.LifeDelay,this.duration=new ce.LifeDuration;}load(t){void 0!==t&&(void 0!==t.count&&(this.count=t.count),this.delay.load(t.delay),this.duration.load(t.duration));}};})),ue=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Particles=void 0;e.Particles=class{constructor(){this.bounce=new ne.Bounce,this.collisions=new se.Collisions,this.color=new ee.AnimatableColor,this.life=new de.Life,this.links=new Dt.Links,this.move=new Nt.Move,this.number=new $t.ParticlesNumber,this.opacity=new Gt.Opacity,this.reduceDuplicates=!1,this.rotate=new Zt.Rotate,this.shadow=new Kt.Shadow,this.shape=new Xt.Shape,this.size=new Jt.Size,this.stroke=new ie.Stroke,this.twinkle=new re.Twinkle;}get line_linked(){return this.links}set line_linked(t){this.links=t;}get lineLinked(){return this.links}set lineLinked(t){this.links=t;}load(t){var e,i,o,n,s,a,r;if(void 0===t)return;this.bounce.load(t.bounce),this.color=ee.AnimatableColor.create(this.color,t.color),this.life.load(t.life);const l=null!==(i=null!==(e=t.links)&&void 0!==e?e:t.lineLinked)&&void 0!==i?i:t.line_linked;void 0!==l&&this.links.load(l),this.move.load(t.move),this.number.load(t.number),this.opacity.load(t.opacity),void 0!==t.reduceDuplicates&&(this.reduceDuplicates=t.reduceDuplicates),this.rotate.load(t.rotate),this.shape.load(t.shape),this.size.load(t.size),this.shadow.load(t.shadow),this.twinkle.load(t.twinkle);const c=null!==(n=null===(o=t.move)||void 0===o?void 0:o.collisions)&&void 0!==n?n:null===(s=t.move)||void 0===s?void 0:s.bounce;void 0!==c&&(this.collisions.enable=c),this.collisions.load(t.collisions);const d=null!==(a=t.stroke)&&void 0!==a?a:null===(r=t.shape)||void 0===r?void 0:r.stroke;void 0!==d&&(d instanceof Array?this.stroke=d.map(t=>{const e=new ie.Stroke;return e.load(t),e}):(this.stroke instanceof Array&&(this.stroke=new ie.Stroke),this.stroke.load(d)));}};})),he=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Infecter=void 0;e.Infecter=class{constructor(t){this.container=t;}startInfection(t){t>this.container.options.infection.stages.length||t<0||(this.infectionDelay=0,this.infectionDelayStage=t);}updateInfectionStage(t){t>this.container.options.infection.stages.length||t<0||void 0!==this.infectionStage&&this.infectionStage>t||(this.infectionStage=t,this.infectionTime=0);}updateInfection(t){const e=this.container.options,i=e.infection,o=e.infection.stages,n=o.length;if(void 0!==this.infectionDelay&&void 0!==this.infectionDelayStage){const e=this.infectionDelayStage;if(e>n||e<0)return;this.infectionDelay>1e3*i.delay?(this.infectionStage=e,this.infectionTime=0,delete this.infectionDelay,delete this.infectionDelayStage):this.infectionDelay+=t;}else delete this.infectionDelay,delete this.infectionDelayStage;if(void 0!==this.infectionStage&&void 0!==this.infectionTime){const e=o[this.infectionStage];void 0!==e.duration&&e.duration>=0&&this.infectionTime>1e3*e.duration?this.nextInfectionStage():this.infectionTime+=t;}else delete this.infectionStage,delete this.infectionTime;}nextInfectionStage(){const t=this.container.options,e=t.infection.stages.length;if(!(e<=0||void 0===this.infectionStage)&&(this.infectionTime=0,e<=++this.infectionStage)){if(t.infection.cure)return delete this.infectionStage,void delete this.infectionTime;this.infectionStage=0,this.infectionTime=0;}}};})),ve=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Mover=void 0;e.Mover=class{constructor(t,e){this.container=t,this.particle=e;}move(t){const e=this.particle;e.bubble.inRange=!1,e.links=[];for(const[,i]of this.container.plugins){if(e.destroyed)break;i.particleUpdate&&i.particleUpdate(e,t);}e.destroyed||(this.moveParticle(t),this.moveParallax());}moveParticle(t){var e,i;const o=this.particle,n=o.particlesOptions;if(!n.move.enable)return;const s=this.container,a=this.getProximitySpeedFactor(),r=(null!==(e=o.moveSpeed)&&void 0!==e?e:s.retina.moveSpeed)*s.retina.reduceFactor,l=null!==(i=o.sizeValue)&&void 0!==i?i:s.retina.sizeValue,c=r/2*(n.move.size?o.getRadius()/l:1)*a*t.factor;this.applyNoise(t);const d=n.move.gravity;d.enable&&(o.velocity.vertical+=d.acceleration*t.factor/(60*c));const u={horizontal:o.velocity.horizontal*c,vertical:o.velocity.vertical*c};d.enable&&u.vertical>=d.maxSpeed&&d.maxSpeed>0&&(u.vertical=d.maxSpeed,o.velocity.vertical=u.vertical/c),o.position.x+=u.horizontal,o.position.y+=u.vertical,n.move.vibrate&&(o.position.x+=Math.sin(o.position.x*Math.cos(o.position.y)),o.position.y+=Math.cos(o.position.y*Math.sin(o.position.x)));const h=o.initialPosition,v=gt.NumberUtils.getDistance(h,o.position);o.maxDistance&&(v>=o.maxDistance&&!o.misplaced?(o.misplaced=v>o.maxDistance,o.velocity.horizontal=o.velocity.vertical/2-o.velocity.horizontal,o.velocity.vertical=o.velocity.horizontal/2-o.velocity.vertical):v<o.maxDistance&&o.misplaced?o.misplaced=!1:o.misplaced&&((o.position.x<h.x&&o.velocity.horizontal<0||o.position.x>h.x&&o.velocity.horizontal>0)&&(o.velocity.horizontal*=-Math.random()),(o.position.y<h.y&&o.velocity.vertical<0||o.position.y>h.y&&o.velocity.vertical>0)&&(o.velocity.vertical*=-Math.random())));}applyNoise(t){const e=this.particle;if(!e.particlesOptions.move.noise.enable)return;const i=this.container;if(e.lastNoiseTime<=e.noiseDelay)return void(e.lastNoiseTime+=t.value);const o=i.noise.generate(e);e.velocity.horizontal+=Math.cos(o.angle)*o.length,e.velocity.horizontal=gt.NumberUtils.clamp(e.velocity.horizontal,-1,1),e.velocity.vertical+=Math.sin(o.angle)*o.length,e.velocity.vertical=gt.NumberUtils.clamp(e.velocity.vertical,-1,1),e.lastNoiseTime-=e.noiseDelay;}moveParallax(){const t=this.container,e=t.options;if(gt.Utils.isSsr()||!e.interactivity.events.onHover.parallax.enable)return;const i=this.particle,o=e.interactivity.events.onHover.parallax.force,n=t.interactivity.mouse.position;if(!n)return;const s=window.innerHeight/2,a=window.innerWidth/2,r=e.interactivity.events.onHover.parallax.smooth,l=i.getRadius()/o,c=(n.x-a)*l,d=(n.y-s)*l;i.offset.x+=(c-i.offset.x)/r,i.offset.y+=(d-i.offset.y)/r;}getProximitySpeedFactor(){const t=this.container,e=t.options;if(!gt.Utils.isInArray(pt.HoverMode.slow,e.interactivity.events.onHover.mode))return 1;const i=this.container.interactivity.mouse.position;if(!i)return 1;const o=this.particle.getPosition(),n=gt.NumberUtils.getDistance(i,o),s=t.retina.slowModeRadius;if(n>s)return 1;return (n/s||0)/e.interactivity.modes.slow.factor}};})),pe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Particle=void 0;e.Particle=class{constructor(t,e,i,o){var n,s,a,r,l,c,d,u,h;this.id=t,this.container=e,this.links=[],this.fill=!0,this.close=!0,this.lastNoiseTime=0,this.destroyed=!1,this.misplaced=!1;const v=e.retina.pixelRatio,p=e.options,f=new ue.Particles;f.load(p.particles);const y=f.shape.type,m=f.reduceDuplicates;if(this.shape=y instanceof Array?gt.Utils.itemFromArray(y,this.id,m):y,null==o?void 0:o.shape){if(o.shape.type){const t=o.shape.type;this.shape=t instanceof Array?gt.Utils.itemFromArray(t,this.id,m):t;}const t=new Xt.Shape;if(t.load(o.shape),this.shape){const e=t.options[this.shape];e&&(this.shapeData=gt.Utils.deepExtend({},e instanceof Array?gt.Utils.itemFromArray(e,this.id,m):e));}}else {const t=f.shape.options[this.shape];t&&(this.shapeData=gt.Utils.deepExtend({},t instanceof Array?gt.Utils.itemFromArray(t,this.id,m):t));}void 0!==o&&f.load(o),void 0!==(null===(n=this.shapeData)||void 0===n?void 0:n.particles)&&f.load(null===(s=this.shapeData)||void 0===s?void 0:s.particles),this.fill=null!==(r=null===(a=this.shapeData)||void 0===a?void 0:a.fill)&&void 0!==r?r:this.fill,this.close=null!==(c=null===(l=this.shapeData)||void 0===l?void 0:l.close)&&void 0!==c?c:this.close,this.particlesOptions=f,this.noiseDelay=1e3*gt.NumberUtils.getValue(this.particlesOptions.move.noise.delay),e.retina.initParticle(this);const b=this.particlesOptions.color,g=this.particlesOptions.size,w=gt.NumberUtils.getValue(g)*e.retina.pixelRatio,_="boolean"==typeof g.random?g.random:g.random.enable;this.size={value:w},this.direction=this.particlesOptions.move.direction,this.bubble={inRange:!1},this.initialVelocity=this.calculateVelocity(),this.velocity={horizontal:this.initialVelocity.horizontal,vertical:this.initialVelocity.vertical},this.pathAngle=Math.atan2(this.initialVelocity.vertical,this.initialVelocity.horizontal);const M=this.particlesOptions.rotate;this.rotate={value:(M.random.enable?360*Math.random():M.value)*Math.PI/180};let P=M.direction;if(P===pt.RotateDirection.random){P=Math.floor(2*Math.random())>0?pt.RotateDirection.counterClockwise:pt.RotateDirection.clockwise;}switch(P){case pt.RotateDirection.counterClockwise:case"counterClockwise":this.rotate.status=pt.AnimationStatus.decreasing;break;case pt.RotateDirection.clockwise:this.rotate.status=pt.AnimationStatus.increasing;}const x=this.particlesOptions.rotate.animation;x.enable&&(this.rotate.velocity=x.speed/360*e.retina.reduceFactor,x.sync||(this.rotate.velocity*=Math.random()));const k=this.particlesOptions.size.animation;if(k.enable){if(this.size.status=pt.AnimationStatus.increasing,!_)switch(k.startValue){case pt.StartValueType.min:this.size.value=k.minimumValue*v;break;case pt.StartValueType.random:this.size.value=gt.NumberUtils.randomInRange(k.minimumValue*v,this.size.value);break;case pt.StartValueType.max:default:this.size.status=pt.AnimationStatus.decreasing;}this.size.velocity=(null!==(d=this.sizeAnimationSpeed)&&void 0!==d?d:e.retina.sizeAnimationSpeed)/100*e.retina.reduceFactor,k.sync||(this.size.velocity*=Math.random());}this.color={value:gt.ColorUtils.colorToHsl(b,this.id,m)};const O=this.particlesOptions.color.animation;O.enable&&(this.color.velocity=O.speed/100*e.retina.reduceFactor,O.sync||(this.color.velocity*=Math.random())),this.position=this.calcPosition(this.container,i),this.initialPosition={x:this.position.x,y:this.position.y},this.offset={x:0,y:0};const C=this.particlesOptions.opacity,S=C.random,T=C.value;this.opacity={value:S.enable?gt.NumberUtils.randomInRange(S.minimumValue,T):T};const R=C.animation;R.enable&&(this.opacity.status=pt.AnimationStatus.increasing,this.opacity.velocity=R.speed/100*e.retina.reduceFactor,R.sync||(this.opacity.velocity*=Math.random())),this.sides=24;let A=e.drawers.get(this.shape);A||(A=gt.Plugins.getShapeDrawer(this.shape),A&&e.drawers.set(this.shape,A));const z=null==A?void 0:A.getSidesCount;z&&(this.sides=z(this));const D=this.loadImageShape(e,A);if(D&&(this.image=D.image,this.fill=D.fill,this.close=D.close),this.stroke=this.particlesOptions.stroke instanceof Array?gt.Utils.itemFromArray(this.particlesOptions.stroke,this.id,m):this.particlesOptions.stroke,this.strokeWidth=this.stroke.width*e.retina.pixelRatio,this.strokeColor={value:null!==(u=gt.ColorUtils.colorToHsl(this.stroke.color))&&void 0!==u?u:this.color.value},"string"!=typeof this.stroke.color){const t=null===(h=this.stroke.color)||void 0===h?void 0:h.animation;t&&this.strokeColor&&(t.enable?(this.strokeColor.velocity=t.speed/100*e.retina.reduceFactor,t.sync||(this.strokeColor.velocity=this.strokeColor.velocity*Math.random())):this.strokeColor.velocity=0,t.enable&&!t.sync&&this.strokeColor.value&&(this.strokeColor.value.h=360*Math.random()));}const E=f.life;this.lifeDelay=e.retina.reduceFactor?gt.NumberUtils.getValue(E.delay)*(E.delay.sync?1:Math.random())/e.retina.reduceFactor*1e3:0,this.lifeDelayTime=0,this.lifeDuration=e.retina.reduceFactor?gt.NumberUtils.getValue(E.duration)*(E.duration.sync?1:Math.random())/e.retina.reduceFactor*1e3:0,this.lifeTime=0,this.livesRemaining=f.life.count,this.spawning=this.lifeDelay>0,this.lifeDuration<=0&&(this.lifeDuration=-1),this.livesRemaining<=0&&(this.livesRemaining=-1),this.shadowColor=gt.ColorUtils.colorToRgb(this.particlesOptions.shadow.color),this.updater=new Tt.Updater(e,this),this.infecter=new he.Infecter(e),this.mover=new ve.Mover(e,this);}move(t){this.mover.move(t);}update(t){this.updater.update(t);}draw(t){this.container.canvas.drawParticle(this,t);}getPosition(){return {x:this.position.x+this.offset.x,y:this.position.y+this.offset.y}}getRadius(){return this.bubble.radius||this.size.value}getFillColor(){var t;return null!==(t=this.bubble.color)&&void 0!==t?t:this.color.value}getStrokeColor(){var t,e;return null!==(e=null!==(t=this.bubble.color)&&void 0!==t?t:this.strokeColor.value)&&void 0!==e?e:this.color.value}destroy(){this.destroyed=!0,this.bubble.inRange=!1,this.links=[];}calcPosition(t,e){var i,o;for(const[,i]of t.plugins){const t=void 0!==i.particlePosition?i.particlePosition(e,this):void 0;if(void 0!==t)return gt.Utils.deepExtend({},t)}const n={x:null!==(i=null==e?void 0:e.x)&&void 0!==i?i:Math.random()*t.canvas.size.width,y:null!==(o=null==e?void 0:e.y)&&void 0!==o?o:Math.random()*t.canvas.size.height},s=this.particlesOptions.move.outMode;return (gt.Utils.isInArray(s,pt.OutMode.bounce)||gt.Utils.isInArray(s,pt.OutMode.bounceHorizontal))&&(n.x>t.canvas.size.width-2*this.size.value?n.x-=this.size.value:n.x<2*this.size.value&&(n.x+=this.size.value)),(gt.Utils.isInArray(s,pt.OutMode.bounce)||gt.Utils.isInArray(s,pt.OutMode.bounceVertical))&&(n.y>t.canvas.size.height-2*this.size.value?n.y-=this.size.value:n.y<2*this.size.value&&(n.y+=this.size.value)),n}calculateVelocity(){const t=gt.NumberUtils.getParticleBaseVelocity(this),e={horizontal:0,vertical:0},i=this.particlesOptions.move;let o,n=Math.PI/4;"number"==typeof i.angle?o=Math.PI/180*i.angle:(o=Math.PI/180*i.angle.value,n=Math.PI/180*i.angle.offset);const s={left:Math.sin(n+o/2)-Math.sin(n-o/2),right:Math.cos(n+o/2)-Math.cos(n-o/2)};return i.straight?(e.horizontal=t.x,e.vertical=t.y,i.random&&(e.horizontal+=gt.NumberUtils.randomInRange(s.left,s.right)/2,e.vertical+=gt.NumberUtils.randomInRange(s.left,s.right)/2)):(e.horizontal=t.x+gt.NumberUtils.randomInRange(s.left,s.right)/2,e.vertical=t.y+gt.NumberUtils.randomInRange(s.left,s.right)/2),e}loadImageShape(t,e){var i,o,n,s,a;if(this.shape!==pt.ShapeType.image&&this.shape!==pt.ShapeType.images)return;const r=e.getImages(t).images,l=this.shapeData,c=null!==(i=r.find(t=>t.source===l.src))&&void 0!==i?i:r[0],d=this.getFillColor();let u;if(!c)return;if(void 0!==c.svgData&&l.replaceColor&&d){const t=gt.ColorUtils.replaceColorSvg(c,d,this.opacity.value),e=new Blob([t],{type:"image/svg+xml"}),i=URL||window.URL||window.webkitURL||window,n=i.createObjectURL(e),s=new Image;u={data:c,loaded:!1,ratio:l.width/l.height,replaceColor:null!==(o=l.replaceColor)&&void 0!==o?o:l.replace_color,source:l.src},s.addEventListener("load",()=>{this.image&&(this.image.loaded=!0,c.element=s),i.revokeObjectURL(n);}),s.addEventListener("error",()=>{i.revokeObjectURL(n),gt.Utils.loadImage(l.src).then(t=>{this.image&&(c.element=t.element,this.image.loaded=!0);});}),s.src=n;}else u={data:c,loaded:!0,ratio:l.width/l.height,replaceColor:null!==(n=l.replaceColor)&&void 0!==n?n:l.replace_color,source:l.src};u.ratio||(u.ratio=1);return {image:u,fill:null!==(s=l.fill)&&void 0!==s?s:this.fill,close:null!==(a=l.close)&&void 0!==a?a:this.close}}};})),fe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Grabber=void 0;e.Grabber=class{constructor(t){this.container=t;}isEnabled(){const t=this.container,e=t.interactivity.mouse,i=t.options.interactivity.events;if(!i.onHover.enable||!e.position)return !1;const o=i.onHover.mode;return gt.Utils.isInArray(st.HoverMode.grab,o)}reset(){}interact(){var t;const e=this.container,i=e.options.interactivity;if(i.events.onHover.enable&&e.interactivity.status===gt.Constants.mouseMoveEvent){const o=e.interactivity.mouse.position;if(void 0===o)return;const n=e.retina.grabModeDistance,s=e.particles.quadTree.queryCircle(o,n);for(const a of s){const s=a.getPosition(),r=gt.NumberUtils.getDistance(s,o);if(r<=n){const s=i.modes.grab.links,l=s.opacity,c=l-r*l/n;if(c>0){const i=null!==(t=s.color)&&void 0!==t?t:a.particlesOptions.links.color;if(!e.particles.grabLineColor){const t=e.options.interactivity.modes.grab.links;e.particles.grabLineColor=gt.ColorUtils.getLinkRandomColor(i,t.blink,t.consent);}const n=gt.ColorUtils.getLinkColor(a,void 0,e.particles.grabLineColor);if(void 0===n)return;e.canvas.drawGrabLine(a,n,c,o);}}}}}};})),ye=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Repulser=void 0;e.Repulser=class{constructor(t){this.container=t;}isEnabled(){const t=this.container,e=t.options,i=t.interactivity.mouse,o=e.interactivity.events,n=o.onDiv,s=gt.Utils.isDivModeEnabled(pt.DivMode.repulse,n);if(!(s||o.onHover.enable&&i.position||o.onClick.enable&&i.clickPosition))return !1;const a=o.onHover.mode,r=o.onClick.mode;return gt.Utils.isInArray(pt.HoverMode.repulse,a)||gt.Utils.isInArray(pt.ClickMode.repulse,r)||s}reset(){}interact(){const t=this.container,e=t.options,i=t.interactivity.status===gt.Constants.mouseMoveEvent,o=e.interactivity.events,n=o.onHover.enable,s=o.onHover.mode,a=o.onClick.enable,r=o.onClick.mode,l=o.onDiv;i&&n&&gt.Utils.isInArray(pt.HoverMode.repulse,s)?this.hoverRepulse():a&&gt.Utils.isInArray(pt.ClickMode.repulse,r)?this.clickRepulse():gt.Utils.divModeExecute(pt.DivMode.repulse,l,(t,e)=>this.singleSelectorRepulse(t,e));}singleSelectorRepulse(t,e){const i=this.container,o=document.querySelectorAll(t);o.length&&o.forEach(t=>{const o=t,n=i.retina.pixelRatio,s={x:(o.offsetLeft+o.offsetWidth/2)*n,y:(o.offsetTop+o.offsetHeight/2)*n},a=o.offsetWidth/2*n,r=e.type===pt.DivType.circle?new gt.Circle(s.x,s.y,a):new gt.Rectangle(o.offsetLeft*n,o.offsetTop*n,o.offsetWidth*n,o.offsetHeight*n),l=i.options.interactivity.modes.repulse.divs,c=gt.Utils.divMode(l,o);this.processRepulse(s,a,r,c);});}hoverRepulse(){const t=this.container,e=t.interactivity.mouse.position;if(!e)return;const i=t.retina.repulseModeDistance;this.processRepulse(e,i,new gt.Circle(e.x,e.y,i));}processRepulse(t,e,i,o){var n;const s=this.container,a=s.particles.quadTree.query(i);for(const i of a){const{dx:a,dy:r,distance:l}=gt.NumberUtils.getDistances(i.position,t),c={x:a/l,y:r/l},d=100*(null!==(n=null==o?void 0:o.speed)&&void 0!==n?n:s.options.interactivity.modes.repulse.speed),u=gt.NumberUtils.clamp((1-Math.pow(l/e,2))*d,0,50);i.position.x=i.position.x+c.x*u,i.position.y=i.position.y+c.y*u;}}clickRepulse(){const t=this.container;if(t.repulse.finish||(t.repulse.count||(t.repulse.count=0),t.repulse.count++,t.repulse.count===t.particles.count&&(t.repulse.finish=!0)),t.repulse.clicking){const e=t.retina.repulseModeDistance,i=Math.pow(e/6,3),o=t.interactivity.mouse.clickPosition;if(void 0===o)return;const n=new gt.Circle(o.x,o.y,i),s=t.particles.quadTree.query(n);for(const e of s){const{dx:n,dy:s,distance:a}=gt.NumberUtils.getDistances(o,e.position),r=a*a,l=t.options.interactivity.modes.repulse.speed,c=-i*l/r;if(r<=i){t.repulse.particles.push(e);const i=Math.atan2(s,n);e.velocity.horizontal=c*Math.cos(i),e.velocity.vertical=c*Math.sin(i);}}}else if(!1===t.repulse.clicking){for(const e of t.repulse.particles)e.velocity.horizontal=e.initialVelocity.horizontal,e.velocity.vertical=e.initialVelocity.vertical;t.repulse.particles=[];}}};})),me=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Bubbler=void 0;class i{constructor(t){this.container=t;}static calculateBubbleValue(t,e,i,o){if(e>i){const n=t+(e-i)*o;return gt.NumberUtils.clamp(n,t,e)}if(e<i){const n=t-(i-e)*o;return gt.NumberUtils.clamp(n,e,t)}}isEnabled(){const t=this.container,e=t.options,i=t.interactivity.mouse,o=e.interactivity.events,n=o.onDiv,s=gt.Utils.isDivModeEnabled(pt.DivMode.bubble,n);if(!(s||o.onHover.enable&&i.position||o.onClick.enable&&i.clickPosition))return !1;const a=o.onHover.mode,r=o.onClick.mode;return gt.Utils.isInArray(pt.HoverMode.bubble,a)||gt.Utils.isInArray(pt.ClickMode.bubble,r)||s}reset(t,e){t.bubble.inRange&&!e||(delete t.bubble.div,delete t.bubble.opacity,delete t.bubble.radius,delete t.bubble.color);}interact(){const t=this.container.options.interactivity.events,e=t.onHover,i=t.onClick,o=e.enable,n=e.mode,s=i.enable,a=i.mode,r=t.onDiv;o&&gt.Utils.isInArray(pt.HoverMode.bubble,n)?this.hoverBubble():s&&gt.Utils.isInArray(pt.ClickMode.bubble,a)?this.clickBubble():gt.Utils.divModeExecute(pt.DivMode.bubble,r,(t,e)=>this.singleSelectorHover(t,e));}singleSelectorHover(t,e){const i=this.container,o=document.querySelectorAll(t);o.length&&o.forEach(t=>{const o=t,n=i.retina.pixelRatio,s={x:(o.offsetLeft+o.offsetWidth/2)*n,y:(o.offsetTop+o.offsetHeight/2)*n},a=o.offsetWidth/2*n,r=e.type===pt.DivType.circle?new gt.Circle(s.x,s.y,a):new gt.Rectangle(o.offsetLeft*n,o.offsetTop*n,o.offsetWidth*n,o.offsetHeight*n),l=i.particles.quadTree.query(r);for(const t of l){if(!r.contains(t.getPosition()))continue;t.bubble.inRange=!0;const e=i.options.interactivity.modes.bubble.divs,n=gt.Utils.divMode(e,o);t.bubble.div&&t.bubble.div===o||(this.reset(t,!0),t.bubble.div=o),this.hoverBubbleSize(t,1,n),this.hoverBubbleOpacity(t,1,n),this.hoverBubbleColor(t,n);}});}process(t,e,i,o){const n=this.container,s=o.bubbleObj.optValue;if(void 0===s)return;const a=n.options.interactivity.modes.bubble.duration,r=n.retina.bubbleModeDistance,l=o.particlesObj.optValue,c=o.bubbleObj.value,d=o.particlesObj.value||0,u=o.type;if(s!==l)if(n.bubble.durationEnd)c&&(u===pt.ProcessBubbleType.size&&delete t.bubble.radius,u===pt.ProcessBubbleType.opacity&&delete t.bubble.opacity);else if(e<=r){if((null!=c?c:d)!==s){const e=d-i*(d-s)/a;u===pt.ProcessBubbleType.size&&(t.bubble.radius=e),u===pt.ProcessBubbleType.opacity&&(t.bubble.opacity=e);}}else u===pt.ProcessBubbleType.size&&delete t.bubble.radius,u===pt.ProcessBubbleType.opacity&&delete t.bubble.opacity;}clickBubble(){var t;const e=this.container,i=e.options,o=e.interactivity.mouse.clickPosition;if(void 0===o)return;const n=e.retina.bubbleModeDistance,s=e.particles.quadTree.queryCircle(o,n);for(const n of s){if(!e.bubble.clicking)continue;n.bubble.inRange=!e.bubble.durationEnd;const s=n.getPosition(),a=gt.NumberUtils.getDistance(s,o),r=((new Date).getTime()-(e.interactivity.mouse.clickTime||0))/1e3;r>i.interactivity.modes.bubble.duration&&(e.bubble.durationEnd=!0),r>2*i.interactivity.modes.bubble.duration&&(e.bubble.clicking=!1,e.bubble.durationEnd=!1);const l={bubbleObj:{optValue:e.retina.bubbleModeSize,value:n.bubble.radius},particlesObj:{optValue:null!==(t=n.sizeValue)&&void 0!==t?t:e.retina.sizeValue,value:n.size.value},type:pt.ProcessBubbleType.size};this.process(n,a,r,l);const c={bubbleObj:{optValue:i.interactivity.modes.bubble.opacity,value:n.bubble.opacity},particlesObj:{optValue:n.particlesOptions.opacity.value,value:n.opacity.value},type:pt.ProcessBubbleType.opacity};this.process(n,a,r,c),e.bubble.durationEnd?delete n.bubble.color:a<=e.retina.bubbleModeDistance?this.hoverBubbleColor(n):delete n.bubble.color;}}hoverBubble(){const t=this.container,e=t.interactivity.mouse.position;if(void 0===e)return;const i=t.retina.bubbleModeDistance,o=t.particles.quadTree.queryCircle(e,i);for(const n of o){n.bubble.inRange=!0;const o=n.getPosition(),s=gt.NumberUtils.getDistance(o,e),a=1-s/i;s<=i?a>=0&&t.interactivity.status===gt.Constants.mouseMoveEvent&&(this.hoverBubbleSize(n,a),this.hoverBubbleOpacity(n,a),this.hoverBubbleColor(n)):this.reset(n),t.interactivity.status===gt.Constants.mouseLeaveEvent&&this.reset(n);}}hoverBubbleSize(t,e,o){var n;const s=this.container,a=(null==o?void 0:o.size)?o.size*s.retina.pixelRatio:s.retina.bubbleModeSize;if(void 0===a)return;const r=null!==(n=t.sizeValue)&&void 0!==n?n:s.retina.sizeValue,l=t.size.value,c=i.calculateBubbleValue(l,a,r,e);void 0!==c&&(t.bubble.radius=c);}hoverBubbleOpacity(t,e,o){var n;const s=this.container.options,a=null!==(n=null==o?void 0:o.opacity)&&void 0!==n?n:s.interactivity.modes.bubble.opacity;if(void 0===a)return;const r=t.particlesOptions.opacity.value,l=t.opacity.value,c=i.calculateBubbleValue(l,a,r,e);void 0!==c&&(t.bubble.opacity=c);}hoverBubbleColor(t,e){var i;const o=this.container.options;if(void 0===t.bubble.color){const n=null!==(i=null==e?void 0:e.color)&&void 0!==i?i:o.interactivity.modes.bubble.color;if(void 0===n)return;const s=n instanceof Array?gt.Utils.itemFromArray(n):n;t.bubble.color=gt.ColorUtils.colorToHsl(s);}}}e.Bubbler=i;})),be=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Connector=void 0;e.Connector=class{constructor(t){this.container=t;}isEnabled(){const t=this.container,e=t.interactivity.mouse,i=t.options.interactivity.events;if(!i.onHover.enable||!e.position)return !1;const o=i.onHover.mode;return gt.Utils.isInArray(st.HoverMode.connect,o)}reset(){}interact(){const t=this.container;if(t.options.interactivity.events.onHover.enable&&"mousemove"===t.interactivity.status){const e=t.interactivity.mouse.position;if(!e)return;const i=Math.abs(t.retina.connectModeRadius),o=t.particles.quadTree.queryCircle(e,i);let n=0;for(const e of o){const i=e.getPosition();for(const s of o.slice(n+1)){const o=s.getPosition(),n=Math.abs(t.retina.connectModeDistance),a=Math.abs(i.x-o.x),r=Math.abs(i.y-o.y);a<n&&r<n&&t.canvas.drawConnectLine(e,s);}++n;}}}};})),ge=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Linker=void 0;e.Linker=class{constructor(t){this.container=t;}isEnabled(t){return t.particlesOptions.links.enable}reset(){}interact(t){var e;const i=this.container,o=t.particlesOptions.links,n=o.opacity,s=null!==(e=t.linksDistance)&&void 0!==e?e:i.retina.linksDistance,a=i.canvas.size,r=o.warp,l=t.getPosition(),c=r?new gt.CircleWarp(l.x,l.y,s,a):new gt.Circle(l.x,l.y,s),d=i.particles.quadTree.query(c);for(const e of d){const c=e.particlesOptions.links;if(t===e||!c.enable||o.id!==c.id)continue;const d=e.getPosition();let u=gt.NumberUtils.getDistance(l,d);if(r&&u>s){const t={x:d.x-a.width,y:d.y};if(u=gt.NumberUtils.getDistance(l,t),u>s){const t={x:d.x-a.width,y:d.y-a.height};if(u=gt.NumberUtils.getDistance(l,t),u>s){const t={x:d.x,y:d.y-a.height};u=gt.NumberUtils.getDistance(l,t);}}}if(u>s)return;const h=(1-u/s)*n,v=t.particlesOptions.links;let p=void 0!==v.id?i.particles.linksColors.get(v.id):i.particles.linksColor;if(!p){const t=v.color;p=gt.ColorUtils.getLinkRandomColor(t,v.blink,v.consent),void 0!==v.id?i.particles.linksColors.set(v.id,p):i.particles.linksColor=p;}-1===e.links.map(t=>t.destination).indexOf(t)&&-1===t.links.map(t=>t.destination).indexOf(e)&&t.links.push({destination:e,opacity:h});}}};})),we=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Attractor=void 0;e.Attractor=class{constructor(t){this.container=t;}interact(t){var e;const i=this.container,o=i.options,n=null!==(e=t.linksDistance)&&void 0!==e?e:i.retina.linksDistance,s=t.getPosition(),a=i.particles.quadTree.queryCircle(s,n);for(const e of a){if(t===e||e.particlesOptions.move.attract.enable||e.destroyed||e.spawning)continue;const i=e.getPosition(),{dx:n,dy:a}=gt.NumberUtils.getDistances(s,i),r=o.particles.move.attract.rotate,l=n/(1e3*r.x),c=a/(1e3*r.y);t.velocity.horizontal-=l,t.velocity.vertical-=c,e.velocity.horizontal+=l,e.velocity.vertical+=c;}}isEnabled(t){return t.particlesOptions.move.attract.enable}reset(){}};})),_e=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Collider=void 0;class i{constructor(t){this.container=t;}static bounce(t,e){gt.Utils.circleBounce(gt.Utils.circleBounceDataFromParticle(t),gt.Utils.circleBounceDataFromParticle(e));}static destroy(t,e){void 0===t.getRadius()&&void 0!==e.getRadius()?t.destroy():void 0!==t.getRadius()&&void 0===e.getRadius()?e.destroy():void 0!==t.getRadius()&&void 0!==e.getRadius()&&(t.getRadius()>=e.getRadius()?e.destroy():t.destroy());}isEnabled(t){return t.particlesOptions.collisions.enable}reset(){}interact(t){const e=this.container,i=t.getPosition(),o=e.particles.quadTree.queryCircle(i,2*t.getRadius());for(const e of o){if(t===e||!e.particlesOptions.collisions.enable||t.particlesOptions.collisions.mode!==e.particlesOptions.collisions.mode||e.destroyed||e.spawning)continue;const o=e.getPosition();gt.NumberUtils.getDistance(i,o)<=t.getRadius()+e.getRadius()&&this.resolveCollision(t,e);}}resolveCollision(t,e){switch(t.particlesOptions.collisions.mode){case pt.CollisionMode.absorb:this.absorb(t,e);break;case pt.CollisionMode.bounce:i.bounce(t,e);break;case pt.CollisionMode.destroy:i.destroy(t,e);}}absorb(t,e){const i=this.container,o=i.options.fpsLimit/1e3;if(void 0===t.getRadius()&&void 0!==e.getRadius())t.destroy();else if(void 0!==t.getRadius()&&void 0===e.getRadius())e.destroy();else if(void 0!==t.getRadius()&&void 0!==e.getRadius())if(t.getRadius()>=e.getRadius()){const n=gt.NumberUtils.clamp(t.getRadius()/e.getRadius(),0,e.getRadius())*o;t.size.value+=n,e.size.value-=n,e.getRadius()<=i.retina.pixelRatio&&(e.size.value=0,e.destroy());}else {const n=gt.NumberUtils.clamp(e.getRadius()/t.getRadius(),0,t.getRadius())*o;t.size.value-=n,e.size.value+=n,t.getRadius()<=i.retina.pixelRatio&&(t.size.value=0,t.destroy());}}}e.Collider=i;})),Me=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Infecter=void 0;e.Infecter=class{constructor(t){this.container=t;}isEnabled(){return this.container.options.infection.enable}reset(){}interact(t,e){var i,o;const n=t.infecter;if(n.updateInfection(e.value),void 0===n.infectionStage)return;const s=this.container,a=s.options.infection;if(!a.enable||a.stages.length<1)return;const r=a.stages[n.infectionStage],l=s.retina.pixelRatio,c=2*t.getRadius()+r.radius*l,d=t.getPosition(),u=null!==(i=r.infectedStage)&&void 0!==i?i:n.infectionStage,h=s.particles.quadTree.queryCircle(d,c),v=r.rate,p=h.length;for(const e of h){if(e===t||e.destroyed||e.spawning||void 0!==e.infecter.infectionStage&&e.infecter.infectionStage===n.infectionStage)continue;const i=e.infecter;if(Math.random()<v/p)if(void 0===i.infectionStage)i.startInfection(u);else if(i.infectionStage<n.infectionStage)i.updateInfectionStage(u);else if(i.infectionStage>n.infectionStage){const t=a.stages[i.infectionStage],e=null!==(o=null==t?void 0:t.infectedStage)&&void 0!==o?o:i.infectionStage;n.updateInfectionStage(e);}}}};})),Pe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.TrailMaker=void 0;e.TrailMaker=class{constructor(t){this.container=t,this.delay=0;}interact(t){if(!this.container.retina.reduceFactor)return;const e=this.container,i=e.options.interactivity.modes.trail,o=1e3*i.delay/this.container.retina.reduceFactor;this.delay<o&&(this.delay+=t.value),this.delay>=o&&(e.particles.push(i.quantity,e.interactivity.mouse,i.particles),this.delay-=o);}isEnabled(){const t=this.container,e=t.options,i=t.interactivity.mouse,o=e.interactivity.events;return i.clicking&&i.inside&&!!i.position&&gt.Utils.isInArray(st.ClickMode.trail,o.onClick.mode)||i.inside&&!!i.position&&gt.Utils.isInArray(st.HoverMode.trail,o.onHover.mode)}reset(){}};})),xe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Attractor=void 0;e.Attractor=class{constructor(t){this.container=t;}isEnabled(){const t=this.container,e=t.options,i=t.interactivity.mouse,o=e.interactivity.events;if(!(o.onHover.enable&&i.position||o.onClick.enable&&i.clickPosition))return !1;const n=o.onHover.mode,s=o.onClick.mode;return gt.Utils.isInArray(pt.HoverMode.attract,n)||gt.Utils.isInArray(pt.ClickMode.attract,s)}reset(){}interact(){const t=this.container,e=t.options,i=t.interactivity.status===gt.Constants.mouseMoveEvent,o=e.interactivity.events,n=o.onHover.enable,s=o.onHover.mode,a=o.onClick.enable,r=o.onClick.mode;i&&n&&gt.Utils.isInArray(pt.HoverMode.attract,s)?this.hoverAttract():a&&gt.Utils.isInArray(pt.ClickMode.attract,r)&&this.clickAttract();}hoverAttract(){const t=this.container,e=t.interactivity.mouse.position;if(!e)return;const i=t.retina.attractModeDistance;this.processAttract(e,i,new gt.Circle(e.x,e.y,i));}processAttract(t,e,i){const o=this.container,n=o.particles.quadTree.query(i);for(const i of n){const{dx:n,dy:s,distance:a}=gt.NumberUtils.getDistances(i.position,t),r={x:n/a,y:s/a},l=o.options.interactivity.modes.attract.speed,c=gt.NumberUtils.clamp((1-Math.pow(a/e,2))*l,0,50);i.position.x=i.position.x-r.x*c,i.position.y=i.position.y-r.y*c;}}clickAttract(){const t=this.container;if(t.attract.finish||(t.attract.count||(t.attract.count=0),t.attract.count++,t.attract.count===t.particles.count&&(t.attract.finish=!0)),t.attract.clicking){const e=t.interactivity.mouse.clickPosition;if(!e)return;const i=t.retina.attractModeDistance;this.processAttract(e,i,new gt.Circle(e.x,e.y,i));}else !1===t.attract.clicking&&(t.attract.particles=[]);}};})),ke=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Lighter=void 0;e.Lighter=class{constructor(t){this.container=t;}interact(t){const e=this.container;if(e.options.interactivity.events.onHover.enable&&"mousemove"===e.interactivity.status){const i=this.container.interactivity.mouse.position;i&&e.canvas.drawParticleShadow(t,i);}}isEnabled(){const t=this.container,e=t.interactivity.mouse,i=t.options.interactivity.events;if(!i.onHover.enable||!e.position)return !1;const o=i.onHover.mode;return gt.Utils.isInArray(st.HoverMode.light,o)}reset(){}};})),Oe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Lighter=void 0;e.Lighter=class{constructor(t){this.container=t;}interact(){const t=this.container;if(t.options.interactivity.events.onHover.enable&&"mousemove"===t.interactivity.status){const e=t.interactivity.mouse.position;if(!e)return;t.canvas.drawLight(e);}}isEnabled(){const t=this.container,e=t.interactivity.mouse,i=t.options.interactivity.events;if(!i.onHover.enable||!e.position)return !1;const o=i.onHover.mode;return gt.Utils.isInArray(st.HoverMode.light,o)}reset(){}};})),Ce=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Bouncer=void 0;const i=gt,o=st;e.Bouncer=class{constructor(t){this.container=t;}isEnabled(){const t=this.container,e=t.options,n=t.interactivity.mouse,s=e.interactivity.events,a=s.onDiv;return n.position&&s.onHover.enable&&i.Utils.isInArray(st.HoverMode.bounce,s.onHover.mode)||i.Utils.isDivModeEnabled(o.DivMode.bounce,a)}interact(){const t=this.container,e=t.options.interactivity.events,n=t.interactivity.status===gt.Constants.mouseMoveEvent,s=e.onHover.enable,a=e.onHover.mode,r=e.onDiv;n&&s&&i.Utils.isInArray(st.HoverMode.bounce,a)?this.processMouseBounce():i.Utils.divModeExecute(o.DivMode.bounce,r,(t,e)=>this.singleSelectorBounce(t,e));}reset(){}processMouseBounce(){const t=this.container,e=10*t.retina.pixelRatio,o=t.interactivity.mouse.position,n=t.retina.bounceModeDistance;o&&this.processBounce(o,n,new i.Circle(o.x,o.y,n+e));}singleSelectorBounce(t,e){const o=this.container,n=document.querySelectorAll(t);n.length&&n.forEach(t=>{const n=t,s=o.retina.pixelRatio,a={x:(n.offsetLeft+n.offsetWidth/2)*s,y:(n.offsetTop+n.offsetHeight/2)*s},r=n.offsetWidth/2*s,l=10*s,c=e.type===ht.DivType.circle?new i.Circle(a.x,a.y,r+l):new i.Rectangle(n.offsetLeft*s-l,n.offsetTop*s-l,n.offsetWidth*s+2*l,n.offsetHeight*s+2*l);this.processBounce(a,r,c);});}processBounce(t,e,o){const n=this.container.particles.quadTree.query(o);for(const s of n)o instanceof i.Circle?i.Utils.circleBounce(i.Utils.circleBounceDataFromParticle(s),{position:t,radius:e,velocity:{horizontal:0,vertical:0},factor:{horizontal:0,vertical:0}}):o instanceof i.Rectangle&&i.Utils.rectBounce(s,i.Utils.calculateBounds(t,e));}};})),Se=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.InteractionManager=void 0;e.InteractionManager=class{constructor(t){this.container=t,this.externalInteractors=[new Ce.Bouncer(t),new me.Bubbler(t),new be.Connector(t),new fe.Grabber(t),new Oe.Lighter(t),new xe.Attractor(t),new ye.Repulser(t),new Pe.TrailMaker(t)],this.particleInteractors=[new we.Attractor(t),new ke.Lighter(t),new _e.Collider(t),new Me.Infecter(t),new ge.Linker(t)];}init(){}externalInteract(t){for(const e of this.externalInteractors)e.isEnabled()&&e.interact(t);}particlesInteract(t,e){for(const e of this.externalInteractors)e.reset(t);for(const i of this.particleInteractors)i.isEnabled(t)&&i.interact(t,e);}};})),Te=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Particles=void 0;e.Particles=class{constructor(t){this.container=t,this.nextId=0,this.array=[],this.linksFreq=new Map,this.trianglesFreq=new Map,this.interactionManager=new Se.InteractionManager(t);const e=this.container.canvas.size;this.linksColors=new Map,this.quadTree=new gt.QuadTree(new gt.Rectangle(-e.width/4,-e.height/4,3*e.width/2,3*e.height/2),4);}get count(){return this.array.length}init(){const t=this.container,e=t.options;this.linksFreq=new Map,this.trianglesFreq=new Map;let i=!1;for(const i of e.manualParticles){const e=i.position?{x:i.position.x*t.canvas.size.width/100,y:i.position.y*t.canvas.size.height/100}:void 0;this.addParticle(e,i.options);}for(const[,e]of t.plugins)if(void 0!==e.particlesInitialization&&(i=e.particlesInitialization()),i)break;if(!i)for(let t=this.count;t<e.particles.number.value;t++)this.addParticle();if(e.infection.enable)for(let t=0;t<e.infection.infections;t++){const t=this.array.filter(t=>void 0===t.infecter.infectionStage);gt.Utils.itemFromArray(t).infecter.startInfection(0);}this.interactionManager.init(),t.noise.init();}redraw(){this.clear(),this.init(),this.draw({value:0,factor:0});}removeAt(t,e){if(t>=0&&t<=this.count)for(const i of this.array.splice(t,null!=e?e:1))i.destroy();}remove(t){this.removeAt(this.array.indexOf(t));}update(t){const e=[];this.container.noise.update();for(const i of this.array)i.move(t),i.destroyed?e.push(i):this.quadTree.insert(new gt.Point(i.getPosition(),i));for(const t of e)this.remove(t);this.interactionManager.externalInteract(t);for(const e of this.container.particles.array)e.update(t),e.destroyed||e.spawning||this.interactionManager.particlesInteract(e,t);}draw(t){const e=this.container;e.canvas.clear();const i=this.container.canvas.size;this.quadTree=new gt.QuadTree(new gt.Rectangle(-i.width/4,-i.height/4,3*i.width/2,3*i.height/2),4),this.update(t);for(const[,i]of e.plugins)e.canvas.drawPlugin(i,t);for(const e of this.array)e.draw(t);}clear(){this.array=[];}push(t,e,i){const o=this.container,n=o.options,s=n.particles.number.limit*o.density;if(this.pushing=!0,s>0){const e=this.count+t-s;e>0&&this.removeQuantity(e);}for(let o=0;o<t;o++)this.addParticle(null==e?void 0:e.position,i);n.particles.move.enable||this.container.play(),this.pushing=!1;}addParticle(t,e){try{const i=new pe.Particle(this.nextId,this.container,t,e);return this.array.push(i),this.nextId++,i}catch(t){return void console.warn("error adding particle")}}removeQuantity(t){const e=this.container.options;this.removeAt(0,t),e.particles.move.enable||this.container.play();}getLinkFrequency(t,e){const i=`${Math.min(t.id,e.id)}_${Math.max(t.id,e.id)}`;let o=this.linksFreq.get(i);return void 0===o&&(o=Math.random(),this.linksFreq.set(i,o)),o}getTriangleFrequency(t,e,i){let[o,n,s]=[t.id,e.id,i.id];o>n&&([n,o]=[o,n]),n>s&&([s,n]=[n,s]),o>s&&([s,o]=[o,s]);const a=`${o}_${n}_${s}`;let r=this.trianglesFreq.get(a);return void 0===r&&(r=Math.random(),this.trianglesFreq.set(a,r)),r}};})),Re=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Retina=void 0;e.Retina=class{constructor(t){this.container=t;}init(){const t=this.container,e=t.options;if(e.detectRetina?this.pixelRatio=gt.Utils.isSsr()?1:window.devicePixelRatio:this.pixelRatio=1,gt.Utils.isSsr()||"undefined"==typeof matchMedia||!matchMedia)this.reduceFactor=1;else {const e=matchMedia("(prefers-reduced-motion: reduce)");e&&(this.handleMotionChange(e),e.addEventListener("change",()=>F.__awaiter(this,void 0,void 0,(function*(){this.handleMotionChange(e),yield t.refresh();}))));}const i=this.pixelRatio;if(t.canvas.element){const e=t.canvas.element;t.canvas.size.width=e.offsetWidth*i,t.canvas.size.height=e.offsetHeight*i;}const o=e.particles;this.linksDistance=o.links.distance*i,this.linksWidth=o.links.width*i,this.moveSpeed=o.move.speed*i,this.sizeValue=o.size.value*i,this.sizeAnimationSpeed=o.size.animation.speed*i;const n=e.interactivity.modes;this.connectModeDistance=n.connect.distance*i,this.connectModeRadius=n.connect.radius*i,this.grabModeDistance=n.grab.distance*i,this.repulseModeDistance=n.repulse.distance*i,this.bounceModeDistance=n.bounce.distance*i,this.attractModeDistance=n.attract.distance*i,this.slowModeRadius=n.slow.radius*i,this.bubbleModeDistance=n.bubble.distance*i,n.bubble.size&&(this.bubbleModeSize=n.bubble.size*i);}initParticle(t){const e=t.particlesOptions,i=this.pixelRatio;t.linksDistance=e.links.distance*i,t.linksWidth=e.links.width*i,t.moveSpeed=e.move.speed*i,t.sizeValue=e.size.value*i,t.sizeAnimationSpeed=e.size.animation.speed*i,t.maxDistance=e.move.distance*i;}handleMotionChange(t){const e=this.container.options;if(t.matches){const t=e.motion;this.reduceFactor=t.disable?0:t.reduce.value?1/t.reduce.factor:1;}else this.reduceFactor=1;}};})),Ae=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.FrameManager=void 0;e.FrameManager=class{constructor(t){this.container=t;}nextFrame(t){try{const e=this.container;if(void 0!==e.lastFrameTime&&t<e.lastFrameTime+1e3/e.fpsLimit)return void e.draw();const i=t-e.lastFrameTime,o={value:i,factor:60*i/1e3};e.lastFrameTime=t,e.particles.draw(o),e.getAnimationStatus()&&e.draw();}catch(t){console.error("tsParticles error in animation loop",t);}}};})),ze=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ClickEvent=void 0;e.ClickEvent=class{constructor(){this.enable=!1,this.mode=[];}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.mode&&(this.mode=t.mode));}};})),De=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.DivEvent=void 0;e.DivEvent=class{constructor(){this.selectors=[],this.enable=!1,this.mode=[],this.type=pt.DivType.circle;}get elementId(){return this.ids}set elementId(t){this.ids=t;}get el(){return this.elementId}set el(t){this.elementId=t;}get ids(){return this.selectors instanceof Array?this.selectors.map(t=>t.replace("#","")):this.selectors.replace("#","")}set ids(t){this.selectors=t instanceof Array?t.map(t=>"#"+t):"#"+t;}load(t){var e,i;if(void 0===t)return;const o=null!==(i=null!==(e=t.ids)&&void 0!==e?e:t.elementId)&&void 0!==i?i:t.el;void 0!==o&&(this.ids=o),void 0!==t.selectors&&(this.selectors=t.selectors),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.mode&&(this.mode=t.mode),void 0!==t.type&&(this.type=t.type);}};})),Ee=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Parallax=void 0;e.Parallax=class{constructor(){this.enable=!1,this.force=2,this.smooth=10;}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.force&&(this.force=t.force),void 0!==t.smooth&&(this.smooth=t.smooth));}};})),Ue=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.HoverEvent=void 0;e.HoverEvent=class{constructor(){this.enable=!1,this.mode=[],this.parallax=new Ee.Parallax;}load(t){void 0!==t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.mode&&(this.mode=t.mode),this.parallax.load(t.parallax));}};})),Ie=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Events=void 0;e.Events=class{constructor(){this.onClick=new ze.ClickEvent,this.onDiv=new De.DivEvent,this.onHover=new Ue.HoverEvent,this.resize=!0;}get onclick(){return this.onClick}set onclick(t){this.onClick=t;}get ondiv(){return this.onDiv}set ondiv(t){this.onDiv=t;}get onhover(){return this.onHover}set onhover(t){this.onHover=t;}load(t){var e,i,o;if(void 0===t)return;this.onClick.load(null!==(e=t.onClick)&&void 0!==e?e:t.onclick);const n=null!==(i=t.onDiv)&&void 0!==i?i:t.ondiv;void 0!==n&&(n instanceof Array?this.onDiv=n.map(t=>{const e=new De.DivEvent;return e.load(t),e}):(this.onDiv=new De.DivEvent,this.onDiv.load(n))),this.onHover.load(null!==(o=t.onHover)&&void 0!==o?o:t.onhover),void 0!==t.resize&&(this.resize=t.resize);}};})),je=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BubbleBase=void 0;e.BubbleBase=class{constructor(){this.distance=200,this.duration=.4;}load(t){void 0!==t&&(void 0!==t.distance&&(this.distance=t.distance),void 0!==t.duration&&(this.duration=t.duration),void 0!==t.opacity&&(this.opacity=t.opacity),void 0!==t.color&&(t.color instanceof Array?this.color=t.color.map(t=>Rt.OptionsColor.create(void 0,t)):(this.color instanceof Array&&(this.color=new Rt.OptionsColor),this.color=Rt.OptionsColor.create(this.color,t.color))),void 0!==t.size&&(this.size=t.size));}};})),Le=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BubbleDiv=void 0;class i extends je.BubbleBase{constructor(){super(),this.selectors=[];}get ids(){return this.selectors instanceof Array?this.selectors.map(t=>t.replace("#","")):this.selectors.replace("#","")}set ids(t){this.selectors=t instanceof Array?t.map(t=>"#"+t):"#"+t;}load(t){super.load(t),void 0!==t&&(void 0!==t.ids&&(this.ids=t.ids),void 0!==t.selectors&&(this.selectors=t.selectors));}}e.BubbleDiv=i;})),Be=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Bubble=void 0;class i extends je.BubbleBase{load(t){super.load(t),void 0!==t&&void 0!==t.divs&&(t.divs instanceof Array?this.divs=t.divs.map(t=>{const e=new Le.BubbleDiv;return e.load(t),e}):((this.divs instanceof Array||!this.divs)&&(this.divs=new Le.BubbleDiv),this.divs.load(t.divs)));}}e.Bubble=i;})),He=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ConnectLinks=void 0;e.ConnectLinks=class{constructor(){this.opacity=.5;}load(t){void 0!==t&&void 0!==t.opacity&&(this.opacity=t.opacity);}};})),Fe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Connect=void 0;e.Connect=class{constructor(){this.distance=80,this.links=new He.ConnectLinks,this.radius=60;}get line_linked(){return this.links}set line_linked(t){this.links=t;}get lineLinked(){return this.links}set lineLinked(t){this.links=t;}load(t){var e,i;void 0!==t&&(void 0!==t.distance&&(this.distance=t.distance),this.links.load(null!==(i=null!==(e=t.links)&&void 0!==e?e:t.lineLinked)&&void 0!==i?i:t.line_linked),void 0!==t.radius&&(this.radius=t.radius));}};})),Ve=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.GrabLinks=void 0;e.GrabLinks=class{constructor(){this.blink=!1,this.consent=!1,this.opacity=1;}load(t){void 0!==t&&(void 0!==t.blink&&(this.blink=t.blink),void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.consent&&(this.consent=t.consent),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),Ne=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Grab=void 0;e.Grab=class{constructor(){this.distance=100,this.links=new Ve.GrabLinks;}get line_linked(){return this.links}set line_linked(t){this.links=t;}get lineLinked(){return this.links}set lineLinked(t){this.links=t;}load(t){var e,i;void 0!==t&&(void 0!==t.distance&&(this.distance=t.distance),this.links.load(null!==(i=null!==(e=t.links)&&void 0!==e?e:t.lineLinked)&&void 0!==i?i:t.line_linked));}};})),qe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Remove=void 0;e.Remove=class{constructor(){this.quantity=2;}get particles_nb(){return this.quantity}set particles_nb(t){this.quantity=t;}load(t){var e;if(void 0===t)return;const i=null!==(e=t.quantity)&&void 0!==e?e:t.particles_nb;void 0!==i&&(this.quantity=i);}};})),$e=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Push=void 0;e.Push=class{constructor(){this.quantity=4;}get particles_nb(){return this.quantity}set particles_nb(t){this.quantity=t;}load(t){var e;if(void 0===t)return;const i=null!==(e=t.quantity)&&void 0!==e?e:t.particles_nb;void 0!==i&&(this.quantity=i);}};})),We=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.RepulseBase=void 0;e.RepulseBase=class{constructor(){this.distance=200,this.duration=.4,this.speed=1;}load(t){void 0!==t&&(void 0!==t.distance&&(this.distance=t.distance),void 0!==t.duration&&(this.duration=t.duration),void 0!==t.speed&&(this.speed=t.speed));}};})),Ge=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.RepulseDiv=void 0;class i extends We.RepulseBase{constructor(){super(),this.selectors=[];}get ids(){return this.selectors instanceof Array?this.selectors.map(t=>t.replace("#","")):this.selectors.replace("#","")}set ids(t){this.selectors=t instanceof Array?t.map(()=>"#"+t):"#"+t;}load(t){super.load(t),void 0!==t&&(void 0!==t.ids&&(this.ids=t.ids),void 0!==t.selectors&&(this.selectors=t.selectors));}}e.RepulseDiv=i;})),Xe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Repulse=void 0;class i extends We.RepulseBase{load(t){super.load(t),void 0!==(null==t?void 0:t.divs)&&(t.divs instanceof Array?this.divs=t.divs.map(t=>{const e=new Ge.RepulseDiv;return e.load(t),e}):((this.divs instanceof Array||!this.divs)&&(this.divs=new Ge.RepulseDiv),this.divs.load(t.divs)));}}e.Repulse=i;})),Ye=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Slow=void 0;e.Slow=class{constructor(){this.factor=3,this.radius=200;}get active(){return !1}set active(t){}load(t){void 0!==t&&(void 0!==t.factor&&(this.factor=t.factor),void 0!==t.radius&&(this.radius=t.radius));}};})),Je=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Trail=void 0;e.Trail=class{constructor(){this.delay=1,this.quantity=1;}load(t){void 0!==t&&(void 0!==t.delay&&(this.delay=t.delay),void 0!==t.quantity&&(this.quantity=t.quantity),void 0!==t.particles&&(this.particles=gt.Utils.deepExtend({},t.particles)));}};})),Qe=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Attract=void 0;e.Attract=class{constructor(){this.distance=200,this.duration=.4,this.speed=1;}load(t){void 0!==t&&(void 0!==t.distance&&(this.distance=t.distance),void 0!==t.duration&&(this.duration=t.duration),void 0!==t.speed&&(this.speed=t.speed));}};})),Ze=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LightGradient=void 0;e.LightGradient=class{constructor(){this.start=new Rt.OptionsColor,this.stop=new Rt.OptionsColor,this.start.value="#ffffff",this.stop.value="#000000";}load(t){void 0!==t&&(this.start=Rt.OptionsColor.create(this.start,t.start),this.stop=Rt.OptionsColor.create(this.stop,t.stop));}};})),Ke=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LightArea=void 0;e.LightArea=class{constructor(){this.gradient=new Ze.LightGradient,this.radius=1e3;}load(t){void 0!==t&&(this.gradient.load(t.gradient),void 0!==t.radius&&(this.radius=t.radius));}};})),ti=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LightShadow=void 0;e.LightShadow=class{constructor(){this.color=new Rt.OptionsColor,this.color.value="#000000",this.length=2e3;}load(t){void 0!==t&&(this.color=Rt.OptionsColor.create(this.color,t.color),void 0!==t.length&&(this.length=t.length));}};})),ei=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Light=void 0;e.Light=class{constructor(){this.area=new Ke.LightArea,this.shadow=new ti.LightShadow;}load(t){void 0!==t&&(this.area.load(t.area),this.shadow.load(t.shadow));}};})),ii=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Bounce=void 0;e.Bounce=class{constructor(){this.distance=200;}load(t){t&&void 0!==t.distance&&(this.distance=t.distance);}};})),oi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Modes=void 0;e.Modes=class{constructor(){this.attract=new Qe.Attract,this.bounce=new ii.Bounce,this.bubble=new Be.Bubble,this.connect=new Fe.Connect,this.grab=new Ne.Grab,this.light=new ei.Light,this.push=new $e.Push,this.remove=new qe.Remove,this.repulse=new Xe.Repulse,this.slow=new Ye.Slow,this.trail=new Je.Trail;}load(t){void 0!==t&&(this.attract.load(t.attract),this.bubble.load(t.bubble),this.connect.load(t.connect),this.grab.load(t.grab),this.light.load(t.light),this.push.load(t.push),this.remove.load(t.remove),this.repulse.load(t.repulse),this.slow.load(t.slow),this.trail.load(t.trail));}};})),ni=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Interactivity=void 0;e.Interactivity=class{constructor(){this.detectsOn=pt.InteractivityDetect.canvas,this.events=new Ie.Events,this.modes=new oi.Modes;}get detect_on(){return this.detectsOn}set detect_on(t){this.detectsOn=t;}load(t){var e,i,o;if(void 0===t)return;const n=null!==(e=t.detectsOn)&&void 0!==e?e:t.detect_on;void 0!==n&&(this.detectsOn=n),this.events.load(t.events),this.modes.load(t.modes),!0===(null===(o=null===(i=t.modes)||void 0===i?void 0:i.slow)||void 0===o?void 0:o.active)&&(this.events.onHover.mode instanceof Array?this.events.onHover.mode.indexOf(pt.HoverMode.slow)<0&&this.events.onHover.mode.push(pt.HoverMode.slow):this.events.onHover.mode!==pt.HoverMode.slow&&(this.events.onHover.mode=[this.events.onHover.mode,pt.HoverMode.slow]));}};})),si=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BackgroundMaskCover=void 0;e.BackgroundMaskCover=class{constructor(){this.color=new Rt.OptionsColor,this.opacity=1;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),ai=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BackgroundMask=void 0;e.BackgroundMask=class{constructor(){this.composite="destination-out",this.cover=new si.BackgroundMaskCover,this.enable=!1;}load(t){if(void 0!==t){if(void 0!==t.composite&&(this.composite=t.composite),void 0!==t.cover){const e=t.cover,i="string"==typeof t.cover?{color:t.cover}:t.cover;this.cover.load(void 0!==e.color?e:{color:i});}void 0!==t.enable&&(this.enable=t.enable);}}};})),ri=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Background=void 0;e.Background=class{constructor(){this.color=new Rt.OptionsColor,this.color.value="",this.image="",this.position="",this.repeat="",this.size="",this.opacity=1;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.image&&(this.image=t.image),void 0!==t.position&&(this.position=t.position),void 0!==t.repeat&&(this.repeat=t.repeat),void 0!==t.size&&(this.size=t.size),void 0!==t.opacity&&(this.opacity=t.opacity));}};})),li=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.InfectionStage=void 0;e.InfectionStage=class{constructor(){this.color=new Rt.OptionsColor,this.color.value="#ff0000",this.radius=0,this.rate=1;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),this.duration=t.duration,this.infectedStage=t.infectedStage,void 0!==t.radius&&(this.radius=t.radius),void 0!==t.rate&&(this.rate=t.rate));}};})),ci=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Infection=void 0;e.Infection=class{constructor(){this.cure=!1,this.delay=0,this.enable=!1,this.infections=0,this.stages=[];}load(t){void 0!==t&&(void 0!==t.cure&&(this.cure=t.cure),void 0!==t.delay&&(this.delay=t.delay),void 0!==t.enable&&(this.enable=t.enable),void 0!==t.infections&&(this.infections=t.infections),void 0!==t.stages&&(this.stages=t.stages.map(t=>{const e=new li.InfectionStage;return e.load(t),e})));}};})),di=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ThemeDefault=void 0;e.ThemeDefault=class{constructor(){this.mode=st.ThemeMode.any,this.value=!1;}load(t){void 0!==t&&(void 0!==t.mode&&(this.mode=t.mode),void 0!==t.value&&(this.value=t.value));}};})),ui=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Theme=void 0;e.Theme=class{constructor(){this.name="",this.default=new di.ThemeDefault;}load(t){void 0!==t&&(void 0!==t.name&&(this.name=t.name),this.default.load(t.default),void 0!==t.options&&(this.options=gt.Utils.deepExtend({},t.options)));}};})),hi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.BackgroundMode=void 0;e.BackgroundMode=class{constructor(){this.enable=!1,this.zIndex=-1;}load(t){t&&(void 0!==t.enable&&(this.enable=t.enable),void 0!==t.zIndex&&(this.zIndex=t.zIndex));}};})),vi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MotionReduce=void 0;e.MotionReduce=class{constructor(){this.factor=4,this.value=!1;}load(t){t&&(void 0!==t.factor&&(this.factor=t.factor),void 0!==t.value&&(this.value=t.value));}};})),pi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Motion=void 0;e.Motion=class{constructor(){this.disable=!1,this.reduce=new vi.MotionReduce;}load(t){t&&(void 0!==t.disable&&(this.disable=t.disable),this.reduce.load(t.reduce));}};})),fi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.ManualParticle=void 0;e.ManualParticle=class{load(t){var e,i;t&&(void 0!==t.position&&(this.position={x:null!==(e=t.position.x)&&void 0!==e?e:50,y:null!==(i=t.position.y)&&void 0!==i?i:50}),void 0!==t.options&&(this.options=gt.Utils.deepExtend({},t.options)));}};})),yi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Options=void 0;e.Options=class{constructor(){this.autoPlay=!0,this.background=new ri.Background,this.backgroundMask=new ai.BackgroundMask,this.backgroundMode=new hi.BackgroundMode,this.detectRetina=!0,this.fpsLimit=30,this.infection=new ci.Infection,this.interactivity=new ni.Interactivity,this.manualParticles=[],this.motion=new pi.Motion,this.particles=new ue.Particles,this.pauseOnBlur=!0,this.themes=[];}get fps_limit(){return this.fpsLimit}set fps_limit(t){this.fpsLimit=t;}get retina_detect(){return this.detectRetina}set retina_detect(t){this.detectRetina=t;}load(t){var e,i;if(void 0===t)return;if(void 0!==t.preset)if(t.preset instanceof Array)for(const e of t.preset)this.importPreset(e);else this.importPreset(t.preset);void 0!==t.autoPlay&&(this.autoPlay=t.autoPlay);const o=null!==(e=t.detectRetina)&&void 0!==e?e:t.retina_detect;void 0!==o&&(this.detectRetina=o);const n=null!==(i=t.fpsLimit)&&void 0!==i?i:t.fps_limit;if(void 0!==n&&(this.fpsLimit=n),void 0!==t.pauseOnBlur&&(this.pauseOnBlur=t.pauseOnBlur),this.background.load(t.background),this.backgroundMode.load(t.backgroundMode),this.backgroundMask.load(t.backgroundMask),this.infection.load(t.infection),this.interactivity.load(t.interactivity),void 0!==t.manualParticles&&(this.manualParticles=t.manualParticles.map(t=>{const e=new fi.ManualParticle;return e.load(t),e})),this.motion.load(t.motion),this.particles.load(t.particles),gt.Plugins.loadOptions(this,t),void 0!==t.themes)for(const e of t.themes){const t=new ui.Theme;t.load(e),this.themes.push(t);}}setTheme(t){if(t){const e=this.themes.find(e=>e.name===t);e&&this.load(e.options);}else {const t="undefined"!=typeof matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches;let e=this.themes.find(e=>e.default.value&&(e.default.mode===st.ThemeMode.dark&&t||e.default.mode===st.ThemeMode.light&&!t));e||(e=this.themes.find(t=>t.default.value&&t.default.mode===st.ThemeMode.any)),e&&this.load(e.options);}}importPreset(t){this.load(gt.Plugins.getPreset(t));}};})),mi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Container=void 0;e.Container=class{constructor(t,e,...i){this.id=t,this.sourceOptions=e,this.firstStart=!0,this.started=!1,this.destroyed=!1,this.paused=!0,this.lastFrameTime=0,this.pageHidden=!1,this.retina=new Re.Retina(this),this.canvas=new St.Canvas(this),this.particles=new Te.Particles(this),this.drawer=new Ae.FrameManager(this),this.noise={generate:()=>({angle:Math.random()*Math.PI*2,length:Math.random()}),init:()=>{},update:()=>{}},this.interactivity={mouse:{clicking:!1,inside:!1}},this.bubble={},this.repulse={particles:[]},this.attract={particles:[]},this.plugins=new Map,this.drawers=new Map,this.density=1,this.options=new yi.Options;for(const t of i)this.options.load(gt.Plugins.getPreset(t));const o=gt.Plugins.getSupportedShapes();for(const t of o){const e=gt.Plugins.getShapeDrawer(t);e&&this.drawers.set(t,e);}this.sourceOptions&&this.options.load(this.sourceOptions),this.fpsLimit=this.options.fpsLimit>0?this.options.fpsLimit:60,this.options.setTheme(void 0),this.eventListeners=new gt.EventListeners(this);}play(t){const e=this.paused||t;if(!this.firstStart||this.options.autoPlay){if(this.paused&&(this.paused=!1),e){for(const[,t]of this.plugins)t.play&&t.play();this.lastFrameTime=performance.now();}this.draw();}else this.firstStart=!1;}pause(){if(void 0!==this.drawAnimationFrame&&(gt.Utils.cancelAnimation(this.drawAnimationFrame),delete this.drawAnimationFrame),!this.paused){for(const[,t]of this.plugins)t.pause&&t.pause();this.pageHidden||(this.paused=!0);}}draw(){this.drawAnimationFrame=gt.Utils.animate(t=>this.drawer.nextFrame(t));}getAnimationStatus(){return !this.paused}setNoise(t,e,i){t&&("function"==typeof t?(this.noise.generate=t,e&&(this.noise.init=e),i&&(this.noise.update=i)):(t.generate&&(this.noise.generate=t.generate),t.init&&(this.noise.init=t.init),t.update&&(this.noise.update=t.update)));}densityAutoParticles(){if(!this.options.particles.number.density.enable)return;this.initDensityFactor();const t=this.options.particles.number,e=t.value,i=t.limit>0?t.limit:e,o=Math.min(e,i)*this.density,n=this.particles.count;n<o?this.particles.push(Math.abs(o-n)):n>o&&this.particles.removeQuantity(n-o);}destroy(){this.stop(),this.canvas.destroy();for(const[,t]of this.drawers)t.destroy&&t.destroy(this);for(const t of this.drawers.keys())this.drawers.delete(t);this.destroyed=!0;}exportImg(t){this.exportImage(t);}exportImage(t,e,i){var o;return null===(o=this.canvas.element)||void 0===o?void 0:o.toBlob(t,null!=e?e:"image/png",i)}exportConfiguration(){return JSON.stringify(this.options,void 0,2)}refresh(){return F.__awaiter(this,void 0,void 0,(function*(){this.stop(),yield this.start();}))}stop(){if(this.started){this.firstStart=!0,this.started=!1,this.eventListeners.removeListeners(),this.pause(),this.particles.clear(),this.canvas.clear();for(const[,t]of this.plugins)t.stop&&t.stop();for(const t of this.plugins.keys())this.plugins.delete(t);this.particles.linksColors=new Map,delete this.particles.grabLineColor,delete this.particles.linksColor;}}loadTheme(t){return F.__awaiter(this,void 0,void 0,(function*(){this.options.setTheme(t),yield this.refresh();}))}start(){return F.__awaiter(this,void 0,void 0,(function*(){if(!this.started){yield this.init(),this.started=!0,this.eventListeners.addListeners();for(const[,t]of this.plugins)void 0!==t.startAsync?yield t.startAsync():void 0!==t.start&&t.start();this.play();}}))}init(){return F.__awaiter(this,void 0,void 0,(function*(){this.retina.init(),this.canvas.init(),this.fpsLimit=this.options.fpsLimit>0?this.options.fpsLimit:60;const t=gt.Plugins.getAvailablePlugins(this);for(const[e,i]of t)this.plugins.set(e,i);for(const[,t]of this.drawers)t.init&&(yield t.init(this));for(const[,t]of this.plugins)t.init?t.init(this.options):void 0!==t.initAsync&&(yield t.initAsync(this.options));this.canvas.windowResize(),this.particles.init();}))}initDensityFactor(){const t=this.options.particles.number.density;if(!this.canvas.element||!t.enable)return;const e=this.canvas.element,i=this.retina.pixelRatio;this.density=e.width*e.height/(t.factor*i*i*t.area);}};})),bi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Loader=void 0;const i=[];class o{static dom(){return i}static domItem(t){const e=o.dom(),i=e[t];if(i&&!i.destroyed)return i;e.splice(t,1);}static load(t,e,i){return F.__awaiter(this,void 0,void 0,(function*(){const n=document.getElementById(t);if(n)return o.set(t,n,e,i)}))}static set(t,e,i,n){return F.__awaiter(this,void 0,void 0,(function*(){const s=i instanceof Array?gt.Utils.itemFromArray(i,n):i,a=o.dom(),r=a.findIndex(e=>e.id===t);if(r>=0){const t=o.domItem(r);t&&!t.destroyed&&(t.destroy(),a.splice(r,1));}let l,c;if("canvas"===e.tagName.toLowerCase())l=e,c=!1;else {const t=e.getElementsByTagName("canvas");t.length?(l=t[0],l.className||(l.className=gt.Constants.canvasClass),c=!1):(c=!0,l=document.createElement("canvas"),l.className=gt.Constants.canvasClass,l.style.width="100%",l.style.height="100%",e.appendChild(l));}const d=new mi.Container(t,s);return r>=0?a.splice(r,0,d):a.push(d),d.canvas.loadCanvas(l,c),yield d.start(),d}))}static loadJSON(t,e,i){return F.__awaiter(this,void 0,void 0,(function*(){const n=e instanceof Array?gt.Utils.itemFromArray(e,i):e,s=yield fetch(n);if(s.ok)return o.load(t,yield s.json());o.fetchError(s.status);}))}static setJSON(t,e,i){return F.__awaiter(this,void 0,void 0,(function*(){const n=yield fetch(i);if(n.ok){const i=yield n.json();return o.set(t,e,i)}o.fetchError(n.status);}))}static setOnClickHandler(t){const e=o.dom();if(0===e.length)throw new Error("Can only set click handlers after calling tsParticles.load() or tsParticles.loadJSON()");for(const i of e){const e=i.interactivity.element;if(!e)continue;const o=(e,o)=>{if(i.destroyed)return;const n=i.retina.pixelRatio,s={x:o.x*n,y:o.y*n},a=i.particles.quadTree.queryCircle(s,i.retina.sizeValue);t(e,a);},n=t=>{if(i.destroyed)return;const e=t,n={x:e.offsetX||e.clientX,y:e.offsetY||e.clientY};o(t,n);},s=()=>{i.destroyed||(c=!0,d=!1);},a=()=>{i.destroyed||(d=!0);},r=t=>{var e,n,s;if(!i.destroyed){if(c&&!d){const a=t,r=a.touches[a.touches.length-1],l=null===(e=i.canvas.element)||void 0===e?void 0:e.getBoundingClientRect(),c={x:r.clientX-(null!==(n=null==l?void 0:l.left)&&void 0!==n?n:0),y:r.clientY-(null!==(s=null==l?void 0:l.top)&&void 0!==s?s:0)};o(t,c);}c=!1,d=!1;}},l=()=>{i.destroyed||(c=!1,d=!1);};let c=!1,d=!1;e.addEventListener("click",n),e.addEventListener("touchstart",s),e.addEventListener("touchmove",a),e.addEventListener("touchend",r),e.addEventListener("touchcancel",l);}}static fetchError(t){console.error("Error tsParticles - fetch status: "+t),console.error("Error tsParticles - File config not found");}}e.Loader=o;})),gi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MainSlim=void 0;e.MainSlim=class{constructor(){this.initialized=!1;const t=new j.SquareDrawer,e=new wt.TextDrawer,i=new _t.ImageDrawer;gt.Plugins.addShapeDrawer(ht.ShapeType.line,new Mt.LineDrawer),gt.Plugins.addShapeDrawer(ht.ShapeType.circle,new Pt.CircleDrawer),gt.Plugins.addShapeDrawer(ht.ShapeType.edge,t),gt.Plugins.addShapeDrawer(ht.ShapeType.square,t),gt.Plugins.addShapeDrawer(ht.ShapeType.triangle,new kt.TriangleDrawer),gt.Plugins.addShapeDrawer(ht.ShapeType.star,new Ot.StarDrawer),gt.Plugins.addShapeDrawer(ht.ShapeType.polygon,new Ct.PolygonDrawer),gt.Plugins.addShapeDrawer(ht.ShapeType.char,e),gt.Plugins.addShapeDrawer(ht.ShapeType.character,e),gt.Plugins.addShapeDrawer(ht.ShapeType.image,i),gt.Plugins.addShapeDrawer(ht.ShapeType.images,i);}init(){this.initialized||(this.initialized=!0);}loadFromArray(t,e,i){return F.__awaiter(this,void 0,void 0,(function*(){return bi.Loader.load(t,e,i)}))}load(t,e){return F.__awaiter(this,void 0,void 0,(function*(){return bi.Loader.load(t,e)}))}set(t,e,i){return F.__awaiter(this,void 0,void 0,(function*(){return bi.Loader.set(t,e,i)}))}loadJSON(t,e,i){return bi.Loader.loadJSON(t,e,i)}setOnClickHandler(t){bi.Loader.setOnClickHandler(t);}dom(){return bi.Loader.dom()}domItem(t){return bi.Loader.domItem(t)}addShape(t,e,i,o,n){let s;s="function"==typeof e?{afterEffect:o,destroy:n,draw:e,init:i}:e,gt.Plugins.addShapeDrawer(t,s);}addPreset(t,e){gt.Plugins.addPreset(t,e);}addPlugin(t){gt.Plugins.addPlugin(t);}};})),wi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AbsorberInstance=void 0;e.AbsorberInstance=class{constructor(t,e,i,o){var n,s;this.absorbers=t,this.container=e,this.initialPosition=o,this.options=i,this.dragging=!1,this.opacity=this.options.opacity,this.size=gt.NumberUtils.getValue(i.size)*e.retina.pixelRatio,this.mass=this.size*i.size.density*e.retina.reduceFactor;const a=i.size.limit;this.limit=void 0!==a?a*e.retina.pixelRatio*e.retina.reduceFactor:a;const r="string"==typeof i.color?{value:i.color}:i.color;this.color=null!==(n=gt.ColorUtils.colorToRgb(r))&&void 0!==n?n:{b:0,g:0,r:0},this.position=null!==(s=this.initialPosition)&&void 0!==s?s:this.calcPosition();}attract(t){const e=this.options;if(e.draggable){const t=this.container.interactivity.mouse;if(t.clicking&&t.downPosition){gt.NumberUtils.getDistance(this.position,t.downPosition)<=this.size&&(this.dragging=!0);}else this.dragging=!1;this.dragging&&t.position&&(this.position.x=t.position.x,this.position.y=t.position.y);}const i=t.getPosition(),{dx:o,dy:n,distance:s}=gt.NumberUtils.getDistances(this.position,i),a=Math.atan2(o,n),r=this.mass/Math.pow(s,2)*this.container.retina.reduceFactor;if(s<this.size+t.getRadius()){const i=.033*t.getRadius()*this.container.retina.pixelRatio;this.size>t.getRadius()&&s<this.size-t.getRadius()?e.destroy?t.destroy():(t.needsNewPosition=!0,this.updateParticlePosition(t,a,r)):(e.destroy&&(t.size.value-=i),this.updateParticlePosition(t,a,r)),(void 0===this.limit||this.size<this.limit)&&(this.size+=i),this.mass+=i*this.options.size.density*this.container.retina.reduceFactor;}else this.updateParticlePosition(t,a,r);}resize(){const t=this.initialPosition;this.position=t&&gt.Utils.isPointInside(t,this.container.canvas.size)?t:this.calcPosition();}draw(t){t.translate(this.position.x,this.position.y),t.beginPath(),t.arc(0,0,this.size,0,2*Math.PI,!1),t.closePath(),t.fillStyle=gt.ColorUtils.getStyleFromRgb(this.color,this.opacity),t.fill();}calcPosition(){var t;const e=this.container,i=null!==(t=this.options.position)&&void 0!==t?t:{x:100*Math.random(),y:100*Math.random()};return {x:i.x/100*e.canvas.size.width,y:i.y/100*e.canvas.size.height}}updateParticlePosition(t,e,i){var o;if(t.destroyed)return;const n=this.container.canvas.size;if(t.needsNewPosition){const e=t.getRadius();t.position.x=Math.random()*(n.width-2*e)+e,t.position.y=Math.random()*(n.height-2*e)+e,t.needsNewPosition=!1;}if(this.options.orbits){void 0===t.orbitRadius&&(t.orbitRadius=gt.NumberUtils.getDistance(t.getPosition(),this.position)),t.orbitRadius<=this.size&&!this.options.destroy&&(t.orbitRadius=Math.random()*Math.max(n.width,n.height)),void 0===t.orbitAngle&&(t.orbitAngle=Math.random()*Math.PI*2);const e=t.orbitRadius,s=t.orbitAngle;t.velocity.horizontal=0,t.velocity.vertical=0,t.position.x=this.position.x+e*Math.cos(s),t.position.y=this.position.y+e*Math.sin(s),t.orbitRadius-=i,t.orbitAngle+=(null!==(o=t.moveSpeed)&&void 0!==o?o:this.container.retina.moveSpeed)/100*this.container.retina.reduceFactor;}else t.velocity.horizontal+=Math.sin(e)*i,t.velocity.vertical+=Math.cos(e)*i;}};})),_i=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AbsorberSize=void 0;class i extends jt.ValueWithRandom{constructor(){super(),this.density=5,this.random.minimumValue=1,this.value=50;}load(t){t&&(super.load(t),void 0!==t.density&&(this.density=t.density),void 0!==t.limit&&(this.limit=t.limit),void 0!==t.limit&&(this.limit=t.limit));}}e.AbsorberSize=i;})),Mi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Absorber=void 0;e.Absorber=class{constructor(){this.color=new Rt.OptionsColor,this.color.value="#000000",this.draggable=!1,this.opacity=1,this.destroy=!0,this.orbits=!1,this.size=new _i.AbsorberSize;}load(t){void 0!==t&&(void 0!==t.color&&(this.color=Rt.OptionsColor.create(this.color,t.color)),void 0!==t.draggable&&(this.draggable=t.draggable),void 0!==t.opacity&&(this.opacity=t.opacity),void 0!==t.position&&(this.position={x:t.position.x,y:t.position.y}),void 0!==t.size&&this.size.load(t.size),void 0!==t.destroy&&(this.destroy=t.destroy),void 0!==t.orbits&&(this.orbits=t.orbits));}};})),Pi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AbsorberClickMode=void 0,function(t){t.absorber="absorber";}(e.AbsorberClickMode||(e.AbsorberClickMode={}));})),xi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(Pi,e);})),ki=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Absorbers=void 0;e.Absorbers=class{constructor(t){this.container=t,this.array=[],this.absorbers=[],this.interactivityAbsorbers=[];}init(t){var e,i;if(!t)return;t.absorbers&&(t.absorbers instanceof Array?this.absorbers=t.absorbers.map(t=>{const e=new Mi.Absorber;return e.load(t),e}):(this.absorbers instanceof Array&&(this.absorbers=new Mi.Absorber),this.absorbers.load(t.absorbers)));const o=null===(i=null===(e=t.interactivity)||void 0===e?void 0:e.modes)||void 0===i?void 0:i.absorbers;if(o&&(o instanceof Array?this.interactivityAbsorbers=o.map(t=>{const e=new Mi.Absorber;return e.load(t),e}):(this.interactivityAbsorbers instanceof Array&&(this.interactivityAbsorbers=new Mi.Absorber),this.interactivityAbsorbers.load(o))),this.absorbers instanceof Array)for(const t of this.absorbers){const e=new wi.AbsorberInstance(this,this.container,t);this.addAbsorber(e);}else {const t=this.absorbers,e=new wi.AbsorberInstance(this,this.container,t);this.addAbsorber(e);}}particleUpdate(t){for(const e of this.array)if(e.attract(t),t.destroyed)break}draw(t){for(const e of this.array)t.save(),e.draw(t),t.restore();}stop(){this.array=[];}resize(){for(const t of this.array)t.resize();}handleClickMode(t){const e=this.container,i=this.absorbers,o=this.interactivityAbsorbers;if(t===xi.AbsorberClickMode.absorber){let t;o instanceof Array?o.length>0&&(t=gt.Utils.itemFromArray(o)):t=o;const n=null!=t?t:i instanceof Array?gt.Utils.itemFromArray(i):i,s=e.interactivity.mouse.clickPosition,a=new wi.AbsorberInstance(this,this.container,n,s);this.addAbsorber(a);}}addAbsorber(t){this.array.push(t);}removeAbsorber(t){const e=this.array.indexOf(t);e>=0&&this.array.splice(e,1);}};})),Oi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.AbsorbersPlugin=void 0;const i=new class{constructor(){this.id="absorbers";}getPlugin(t){return new ki.Absorbers(t)}needsPlugin(t){var e,i,o;if(void 0===t)return !1;const n=t.absorbers;let s=!1;return n instanceof Array?n.length&&(s=!0):(void 0!==n||(null===(o=null===(i=null===(e=t.interactivity)||void 0===e?void 0:e.events)||void 0===i?void 0:i.onClick)||void 0===o?void 0:o.mode)&&gt.Utils.isInArray(xi.AbsorberClickMode.absorber,t.interactivity.events.onClick.mode))&&(s=!0),s}loadOptions(t,e){var i,o;if(!this.needsPlugin(t)&&!this.needsPlugin(e))return;const n=t;if(null==e?void 0:e.absorbers)if((null==e?void 0:e.absorbers)instanceof Array)n.absorbers=null==e?void 0:e.absorbers.map(t=>{const e=new Mi.Absorber;return e.load(t),e});else {let t=n.absorbers;void 0===(null==t?void 0:t.load)&&(n.absorbers=t=new Mi.Absorber),t.load(null==e?void 0:e.absorbers);}const s=null===(o=null===(i=null==e?void 0:e.interactivity)||void 0===i?void 0:i.modes)||void 0===o?void 0:o.absorbers;if(s)if(s instanceof Array)n.interactivity.modes.absorbers=s.map(t=>{const e=new Mi.Absorber;return e.load(t),e});else {let t=n.interactivity.modes.absorbers;void 0===(null==t?void 0:t.load)&&(n.interactivity.modes.absorbers=t=new Mi.Absorber),t.load(s);}}};e.AbsorbersPlugin=i,F.__exportStar(xi,e);})),Ci=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmitterSize=void 0;e.EmitterSize=class{constructor(){this.mode=pt.SizeMode.percent,this.height=0,this.width=0;}load(t){void 0!==t&&(void 0!==t.mode&&(this.mode=t.mode),void 0!==t.height&&(this.height=t.height),void 0!==t.width&&(this.width=t.width));}};})),Si=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmitterInstance=void 0;e.EmitterInstance=class{constructor(t,e,i,o){var n,s,a;this.emitters=t,this.container=e,this.initialPosition=o,this.emitterOptions=gt.Utils.deepExtend({},i),this.position=null!==(n=this.initialPosition)&&void 0!==n?n:this.calcPosition();let r=gt.Utils.deepExtend({},this.emitterOptions.particles);void 0===r&&(r={}),void 0===r.move&&(r.move={}),void 0===r.move.direction&&(r.move.direction=this.emitterOptions.direction),this.particlesOptions=r,this.size=null!==(s=this.emitterOptions.size)&&void 0!==s?s:(()=>{const t=new Ci.EmitterSize;return t.load({height:0,mode:pt.SizeMode.percent,width:0}),t})(),this.lifeCount=null!==(a=this.emitterOptions.life.count)&&void 0!==a?a:-1,this.immortal=this.lifeCount<=0,this.play();}play(){if(this.container.retina.reduceFactor&&(this.lifeCount>0||this.immortal||!this.emitterOptions.life.count)){if(void 0===this.startInterval){const t=1e3*this.emitterOptions.rate.delay/this.container.retina.reduceFactor;this.startInterval=window.setInterval(()=>{this.emit();},t);}(this.lifeCount>0||this.immortal)&&this.prepareToDie();}}pause(){const t=this.startInterval;void 0!==t&&(clearInterval(t),delete this.startInterval);}resize(){const t=this.initialPosition;this.position=t&&gt.Utils.isPointInside(t,this.container.canvas.size)?t:this.calcPosition();}prepareToDie(){var t;const e=null===(t=this.emitterOptions.life)||void 0===t?void 0:t.duration;this.container.retina.reduceFactor&&(this.lifeCount>0||this.immortal)&&void 0!==e&&e>0&&window.setTimeout(()=>{var t;this.pause(),this.immortal||this.lifeCount--,this.lifeCount>0||this.immortal?(this.position=this.calcPosition(),window.setTimeout(()=>{this.play();},1e3*(null!==(t=this.emitterOptions.life.delay)&&void 0!==t?t:0)/this.container.retina.reduceFactor)):this.destroy();},1e3*e);}destroy(){this.emitters.removeEmitter(this);}calcPosition(){var t;const e=this.container,i=null!==(t=this.emitterOptions.position)&&void 0!==t?t:{x:100*Math.random(),y:100*Math.random()};return {x:i.x/100*e.canvas.size.width,y:i.y/100*e.canvas.size.height}}emit(){const t=this.container,e=this.position,i=this.size.mode===pt.SizeMode.percent?t.canvas.size.width*this.size.width/100:this.size.width,o=this.size.mode===pt.SizeMode.percent?t.canvas.size.height*this.size.height/100:this.size.height;for(let n=0;n<this.emitterOptions.rate.quantity;n++)t.particles.addParticle({x:e.x+i*(Math.random()-.5),y:e.y+o*(Math.random()-.5)},this.particlesOptions);}};})),Ti=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmitterRate=void 0;e.EmitterRate=class{constructor(){this.quantity=1,this.delay=.1;}load(t){void 0!==t&&(void 0!==t.quantity&&(this.quantity=t.quantity),void 0!==t.delay&&(this.delay=t.delay));}};})),Ri=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmitterLife=void 0;e.EmitterLife=class{load(t){void 0!==t&&(void 0!==t.count&&(this.count=t.count),void 0!==t.delay&&(this.delay=t.delay),void 0!==t.duration&&(this.duration=t.duration));}};})),Ai=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Emitter=void 0;e.Emitter=class{constructor(){this.direction=pt.MoveDirection.none,this.life=new Ri.EmitterLife,this.rate=new Ti.EmitterRate;}load(t){void 0!==t&&(void 0!==t.size&&(void 0===this.size&&(this.size=new Ci.EmitterSize),this.size.load(t.size)),void 0!==t.direction&&(this.direction=t.direction),this.life.load(t.life),void 0!==t.particles&&(this.particles=gt.Utils.deepExtend({},t.particles)),this.rate.load(t.rate),void 0!==t.position&&(this.position={x:t.position.x,y:t.position.y}));}};})),zi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmitterClickMode=void 0,function(t){t.emitter="emitter";}(e.EmitterClickMode||(e.EmitterClickMode={}));})),Di=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(zi,e);})),Ei=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Emitters=void 0;e.Emitters=class{constructor(t){this.container=t,this.array=[],this.emitters=[],this.interactivityEmitters=[];}init(t){var e,i;if(!t)return;t.emitters&&(t.emitters instanceof Array?this.emitters=t.emitters.map(t=>{const e=new Ai.Emitter;return e.load(t),e}):(this.emitters instanceof Array&&(this.emitters=new Ai.Emitter),this.emitters.load(t.emitters)));const o=null===(i=null===(e=t.interactivity)||void 0===e?void 0:e.modes)||void 0===i?void 0:i.emitters;if(o&&(o instanceof Array?this.interactivityEmitters=o.map(t=>{const e=new Ai.Emitter;return e.load(t),e}):(this.interactivityEmitters instanceof Array&&(this.interactivityEmitters=new Ai.Emitter),this.interactivityEmitters.load(o))),this.emitters instanceof Array)for(const t of this.emitters){const e=new Si.EmitterInstance(this,this.container,t);this.addEmitter(e);}else {const t=this.emitters,e=new Si.EmitterInstance(this,this.container,t);this.addEmitter(e);}}play(){for(const t of this.array)t.play();}pause(){for(const t of this.array)t.pause();}stop(){this.array=[];}handleClickMode(t){const e=this.container,i=this.emitters,o=this.interactivityEmitters;if(t===Di.EmitterClickMode.emitter){let t;o instanceof Array?o.length>0&&(t=gt.Utils.itemFromArray(o)):t=o;const n=null!=t?t:i instanceof Array?gt.Utils.itemFromArray(i):i,s=e.interactivity.mouse.clickPosition,a=new Si.EmitterInstance(this,this.container,gt.Utils.deepExtend({},n),s);this.addEmitter(a);}}resize(){for(const t of this.array)t.resize();}addEmitter(t){this.array.push(t);}removeEmitter(t){const e=this.array.indexOf(t);e>=0&&this.array.splice(e,1);}};})),Ui=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.EmittersPlugin=void 0;const i=new class{constructor(){this.id="emitters";}getPlugin(t){return new Ei.Emitters(t)}needsPlugin(t){var e,i,o;if(void 0===t)return !1;const n=t.emitters;let s=!1;return n instanceof Array?n.length&&(s=!0):(void 0!==n||(null===(o=null===(i=null===(e=t.interactivity)||void 0===e?void 0:e.events)||void 0===i?void 0:i.onClick)||void 0===o?void 0:o.mode)&&gt.Utils.isInArray(Di.EmitterClickMode.emitter,t.interactivity.events.onClick.mode))&&(s=!0),s}loadOptions(t,e){var i,o;if(!this.needsPlugin(t)&&!this.needsPlugin(e))return;const n=t;if(null==e?void 0:e.emitters)if((null==e?void 0:e.emitters)instanceof Array)n.emitters=null==e?void 0:e.emitters.map(t=>{const e=new Ai.Emitter;return e.load(t),e});else {let t=n.emitters;void 0===(null==t?void 0:t.load)&&(n.emitters=t=new Ai.Emitter),t.load(null==e?void 0:e.emitters);}const s=null===(o=null===(i=null==e?void 0:e.interactivity)||void 0===i?void 0:i.modes)||void 0===o?void 0:o.emitters;if(s)if(s instanceof Array)n.interactivity.modes.emitters=s.map(t=>{const e=new Ai.Emitter;return e.load(t),e});else {let t=n.interactivity.modes.emitters;void 0===(null==t?void 0:t.load)&&(n.interactivity.modes.emitters=t=new Ai.Emitter),t.load(s);}}};e.EmittersPlugin=i,F.__exportStar(Di,e);})),Ii=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.InlineArrangement=void 0,function(t){t.equidistant="equidistant",t.onePerPoint="one-per-point",t.perPoint="per-point",t.randomLength="random-length",t.randomPoint="random-point";}(e.InlineArrangement||(e.InlineArrangement={}));})),ji=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.MoveType=void 0,function(t){t.path="path",t.radius="radius";}(e.MoveType||(e.MoveType={}));})),Li=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Type=void 0,function(t){t.inline="inline",t.inside="inside",t.outside="outside",t.none="none";}(e.Type||(e.Type={}));})),Bi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(Ii,e),F.__exportStar(ji,e),F.__exportStar(Li,e);})),Hi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.DrawStroke=void 0;e.DrawStroke=class{constructor(){this.color=new Rt.OptionsColor,this.width=.5,this.opacity=1;}load(t){var e;void 0!==t&&(this.color=Rt.OptionsColor.create(this.color,t.color),"string"==typeof this.color.value&&(this.opacity=null!==(e=gt.ColorUtils.stringToAlpha(this.color.value))&&void 0!==e?e:this.opacity),void 0!==t.opacity&&(this.opacity=t.opacity),void 0!==t.width&&(this.width=t.width));}};})),Fi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Draw=void 0;e.Draw=class{constructor(){this.enable=!1,this.stroke=new Hi.DrawStroke;}get lineWidth(){return this.stroke.width}set lineWidth(t){this.stroke.width=t;}get lineColor(){return this.stroke.color}set lineColor(t){this.stroke.color=Rt.OptionsColor.create(this.stroke.color,t);}load(t){var e;if(void 0!==t){void 0!==t.enable&&(this.enable=t.enable);const i=null!==(e=t.stroke)&&void 0!==e?e:{color:t.lineColor,width:t.lineWidth};this.stroke.load(i);}}};})),Vi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Move=void 0;e.Move=class{constructor(){this.radius=10,this.type=Bi.MoveType.path;}load(t){void 0!==t&&(void 0!==t.radius&&(this.radius=t.radius),void 0!==t.type&&(this.type=t.type));}};})),Ni=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Inline=void 0;e.Inline=class{constructor(){this.arrangement=Bi.InlineArrangement.onePerPoint;}load(t){void 0!==t&&void 0!==t.arrangement&&(this.arrangement=t.arrangement);}};})),qi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.LocalSvg=void 0;e.LocalSvg=class{constructor(){this.path=[],this.size={height:0,width:0};}load(t){void 0!==t&&(void 0!==t.path&&(this.path=t.path),void 0!==t.size&&(void 0!==t.size.width&&(this.size.width=t.size.width),void 0!==t.size.height&&(this.size.height=t.size.height)));}};})),$i=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.PolygonMask=void 0;e.PolygonMask=class{constructor(){this.draw=new Fi.Draw,this.enable=!1,this.inline=new Ni.Inline,this.move=new Vi.Move,this.scale=1,this.type=Bi.Type.none;}get inlineArrangement(){return this.inline.arrangement}set inlineArrangement(t){this.inline.arrangement=t;}load(t){var e;if(void 0!==t){this.draw.load(t.draw);const i=null!==(e=t.inline)&&void 0!==e?e:{arrangement:t.inlineArrangement};void 0!==i&&this.inline.load(i),this.move.load(t.move),void 0!==t.scale&&(this.scale=t.scale),void 0!==t.type&&(this.type=t.type),void 0!==t.enable?this.enable=t.enable:this.enable=this.type!==Bi.Type.none,void 0!==t.url&&(this.url=t.url),void 0!==t.data&&("string"==typeof t.data?this.data=t.data:(this.data=new qi.LocalSvg,this.data.load(t.data))),void 0!==t.position&&(this.position={x:t.position.x,y:t.position.y});}}};})),Wi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.PolygonMaskInstance=void 0;class i{constructor(t){this.container=t,this.dimension={height:0,width:0},this.path2DSupported=!!window.Path2D,this.options=new $i.PolygonMask,this.polygonMaskMoveRadius=this.options.move.radius*t.retina.pixelRatio;}static polygonBounce(t){t.velocity.horizontal=t.velocity.vertical/2-t.velocity.horizontal,t.velocity.vertical=t.velocity.horizontal/2-t.velocity.vertical;}static drawPolygonMask(t,e,i){const o=gt.ColorUtils.colorToRgb(i.color);if(o){t.beginPath(),t.moveTo(e[0].x,e[0].y);for(const i of e)t.lineTo(i.x,i.y);t.closePath(),t.strokeStyle=gt.ColorUtils.getStyleFromRgb(o),t.lineWidth=i.width,t.stroke();}}static drawPolygonMaskPath(t,e,i,o){t.translate(o.x,o.y);const n=gt.ColorUtils.colorToRgb(i.color);n&&(t.strokeStyle=gt.ColorUtils.getStyleFromRgb(n,i.opacity),t.lineWidth=i.width,t.stroke(e));}static parsePaths(t,e,i){const o=[];for(const n of t){const t=n.element.pathSegList,s=t.numberOfItems,a={x:0,y:0};for(let n=0;n<s;n++){const s=t.getItem(n),r=window.SVGPathSeg;switch(s.pathSegType){case r.PATHSEG_MOVETO_ABS:case r.PATHSEG_LINETO_ABS:case r.PATHSEG_CURVETO_CUBIC_ABS:case r.PATHSEG_CURVETO_QUADRATIC_ABS:case r.PATHSEG_ARC_ABS:case r.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:case r.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:{const t=s;a.x=t.x,a.y=t.y;break}case r.PATHSEG_LINETO_HORIZONTAL_ABS:a.x=s.x;break;case r.PATHSEG_LINETO_VERTICAL_ABS:a.y=s.y;break;case r.PATHSEG_LINETO_REL:case r.PATHSEG_MOVETO_REL:case r.PATHSEG_CURVETO_CUBIC_REL:case r.PATHSEG_CURVETO_QUADRATIC_REL:case r.PATHSEG_ARC_REL:case r.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:case r.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:{const t=s;a.x+=t.x,a.y+=t.y;break}case r.PATHSEG_LINETO_HORIZONTAL_REL:a.x+=s.x;break;case r.PATHSEG_LINETO_VERTICAL_REL:a.y+=s.y;break;case r.PATHSEG_UNKNOWN:case r.PATHSEG_CLOSEPATH:continue}o.push({x:a.x*e+i.x,y:a.y*e+i.y});}}return o}initAsync(t){return F.__awaiter(this,void 0,void 0,(function*(){this.options.load(null==t?void 0:t.polygon);const e=this.options;this.polygonMaskMoveRadius=e.move.radius*this.container.retina.pixelRatio,e.enable&&(yield this.initRawData());}))}resize(){const t=this.container,e=this.options;e.enable&&e.type!==Bi.Type.none&&(this.redrawTimeout&&clearTimeout(this.redrawTimeout),this.redrawTimeout=window.setTimeout(()=>F.__awaiter(this,void 0,void 0,(function*(){yield this.initRawData(!0),t.particles.redraw();})),250));}stop(){delete this.raw,delete this.paths;}particlesInitialization(){const t=this.options;return !(!t.enable||t.type!==Bi.Type.inline||t.inline.arrangement!==Bi.InlineArrangement.onePerPoint&&t.inline.arrangement!==Bi.InlineArrangement.perPoint)&&(this.drawPoints(),!0)}particlePosition(t){var e,i;if(this.options.enable&&(null!==(i=null===(e=this.raw)||void 0===e?void 0:e.length)&&void 0!==i?i:0)>0)return gt.Utils.deepExtend({},t||this.randomPoint())}particleBounce(t){const e=this.options;if(e.enable&&e.type!==Bi.Type.none&&e.type!==Bi.Type.inline){if(!this.checkInsidePolygon(t.getPosition()))return i.polygonBounce(t),!0}else if(e.enable&&e.type===Bi.Type.inline&&t.initialPosition){if(gt.NumberUtils.getDistance(t.initialPosition,t.getPosition())>this.polygonMaskMoveRadius)return i.polygonBounce(t),!0}return !1}clickPositionValid(t){const e=this.options;return e.enable&&e.type!==Bi.Type.none&&e.type!==Bi.Type.inline&&this.checkInsidePolygon(t)}draw(t){var e;if(!(null===(e=this.paths)||void 0===e?void 0:e.length))return;const o=this.options,n=o.draw;if(!o.enable||!n.enable)return;const s=this.raw;for(const e of this.paths){const o=e.path2d,a=this.path2DSupported;t&&(a&&o&&this.offset?i.drawPolygonMaskPath(t,o,n.stroke,this.offset):s&&i.drawPolygonMask(t,s,n.stroke));}}checkInsidePolygon(t){var e,i;const o=this.container,n=this.options;if(!n.enable||n.type===Bi.Type.none||n.type===Bi.Type.inline)return !0;if(!this.raw)throw new Error(gt.Constants.noPolygonFound);const s=o.canvas.size,a=null!==(e=null==t?void 0:t.x)&&void 0!==e?e:Math.random()*s.width,r=null!==(i=null==t?void 0:t.y)&&void 0!==i?i:Math.random()*s.height;let l=!1;for(let t=0,e=this.raw.length-1;t<this.raw.length;e=t++){const i=this.raw[t],o=this.raw[e];i.y>r!=o.y>r&&a<(o.x-i.x)*(r-i.y)/(o.y-i.y)+i.x&&(l=!l);}return n.type===Bi.Type.inside?l:n.type===Bi.Type.outside&&!l}parseSvgPath(t,e){var o,n,s;const a=null!=e&&e;if(void 0!==this.paths&&!a)return this.raw;const r=this.container,l=this.options,c=(new DOMParser).parseFromString(t,"image/svg+xml"),d=c.getElementsByTagName("svg")[0];let u=d.getElementsByTagName("path");u.length||(u=c.getElementsByTagName("path")),this.paths=[];for(let t=0;t<u.length;t++){const e=u.item(t);e&&this.paths.push({element:e,length:e.getTotalLength()});}const h=r.retina.pixelRatio,v=l.scale/h;this.dimension.width=parseFloat(null!==(o=d.getAttribute("width"))&&void 0!==o?o:"0")*v,this.dimension.height=parseFloat(null!==(n=d.getAttribute("height"))&&void 0!==n?n:"0")*v;const p=null!==(s=l.position)&&void 0!==s?s:{x:50,y:50};return this.offset={x:r.canvas.size.width*p.x/(100*h)-this.dimension.width/2,y:r.canvas.size.height*p.y/(100*h)-this.dimension.height/2},i.parsePaths(this.paths,v,this.offset)}downloadSvgPath(t,e){return F.__awaiter(this,void 0,void 0,(function*(){const i=this.options,o=t||i.url,n=null!=e&&e;if(!o||void 0!==this.paths&&!n)return this.raw;const s=yield fetch(o);if(!s.ok)throw new Error("tsParticles Error - Error occurred during polygon mask download");return this.parseSvgPath(yield s.text(),e)}))}drawPoints(){if(this.raw)for(const t of this.raw)this.container.particles.addParticle({x:t.x,y:t.y});}randomPoint(){const t=this.container,e=this.options;let i;if(e.type===Bi.Type.inline)switch(e.inline.arrangement){case Bi.InlineArrangement.randomPoint:i=this.getRandomPoint();break;case Bi.InlineArrangement.randomLength:i=this.getRandomPointByLength();break;case Bi.InlineArrangement.equidistant:i=this.getEquidistantPointByIndex(t.particles.count);break;case Bi.InlineArrangement.onePerPoint:case Bi.InlineArrangement.perPoint:default:i=this.getPointByIndex(t.particles.count);}else i={x:Math.random()*t.canvas.size.width,y:Math.random()*t.canvas.size.height};return this.checkInsidePolygon(i)?i:this.randomPoint()}getRandomPoint(){if(!this.raw||!this.raw.length)throw new Error(gt.Constants.noPolygonDataLoaded);const t=gt.Utils.itemFromArray(this.raw);return {x:t.x,y:t.y}}getRandomPointByLength(){var t,e,i;const o=this.options;if(!this.raw||!this.raw.length||!(null===(t=this.paths)||void 0===t?void 0:t.length))throw new Error(gt.Constants.noPolygonDataLoaded);const n=gt.Utils.itemFromArray(this.paths),s=Math.floor(Math.random()*n.length)+1,a=n.element.getPointAtLength(s);return {x:a.x*o.scale+((null===(e=this.offset)||void 0===e?void 0:e.x)||0),y:a.y*o.scale+((null===(i=this.offset)||void 0===i?void 0:i.y)||0)}}getEquidistantPointByIndex(t){var e,i,o,n,s,a,r;const l=this.container.options,c=this.options;if(!this.raw||!this.raw.length||!(null===(e=this.paths)||void 0===e?void 0:e.length))throw new Error(gt.Constants.noPolygonDataLoaded);let d,u=0;const h=this.paths.reduce((t,e)=>t+e.length,0)/l.particles.number.value;for(const e of this.paths){const i=h*t-u;if(i<=e.length){d=e.element.getPointAtLength(i);break}u+=e.length;}return {x:(null!==(i=null==d?void 0:d.x)&&void 0!==i?i:0)*c.scale+(null!==(n=null===(o=this.offset)||void 0===o?void 0:o.x)&&void 0!==n?n:0),y:(null!==(s=null==d?void 0:d.y)&&void 0!==s?s:0)*c.scale+(null!==(r=null===(a=this.offset)||void 0===a?void 0:a.y)&&void 0!==r?r:0)}}getPointByIndex(t){if(!this.raw||!this.raw.length)throw new Error(gt.Constants.noPolygonDataLoaded);const e=this.raw[t%this.raw.length];return {x:e.x,y:e.y}}createPath2D(){var t,e;const i=this.options;if(this.path2DSupported&&(null===(t=this.paths)||void 0===t?void 0:t.length))for(const t of this.paths){const o=null===(e=t.element)||void 0===e?void 0:e.getAttribute("d");if(o){const e=new Path2D(o),n=document.createElementNS("http://www.w3.org/2000/svg","svg").createSVGMatrix(),s=new Path2D,a=n.scale(i.scale);s.addPath?(s.addPath(e,a),t.path2d=s):delete t.path2d;}else delete t.path2d;!t.path2d&&this.raw&&(t.path2d=new Path2D,t.path2d.moveTo(this.raw[0].x,this.raw[0].y),this.raw.forEach((e,i)=>{var o;i>0&&(null===(o=t.path2d)||void 0===o||o.lineTo(e.x,e.y));}),t.path2d.closePath());}}initRawData(t){return F.__awaiter(this,void 0,void 0,(function*(){const e=this.options;if(e.url)this.raw=yield this.downloadSvgPath(e.url,t);else if(e.data){const i=e.data;let o;if("string"!=typeof i){const t=i.path instanceof Array?i.path.map(t=>`<path d="${t}" />`).join(""):`<path d="${i.path}" />`;o=`<svg ${'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'} width="${i.size.width}" height="${i.size.height}">${t}</svg>`;}else o=i;this.raw=this.parseSvgPath(o,t);}this.createPath2D();}))}}e.PolygonMaskInstance=i;})),Gi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.PolygonMaskPlugin=void 0;const i=new class{constructor(){this.id="polygonMask";}getPlugin(t){return new Wi.PolygonMaskInstance(t)}needsPlugin(t){var e,i,o;return null!==(i=null===(e=null==t?void 0:t.polygon)||void 0===e?void 0:e.enable)&&void 0!==i?i:void 0!==(null===(o=null==t?void 0:t.polygon)||void 0===o?void 0:o.type)&&t.polygon.type!==Bi.Type.none}loadOptions(t,e){if(!this.needsPlugin(e))return;const i=t;let o=i.polygon;void 0===(null==o?void 0:o.load)&&(i.polygon=o=new $i.PolygonMask),o.load(null==e?void 0:e.polygon);}};e.PolygonMaskPlugin=i,F.__exportStar(Bi,e);})),Xi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.Main=void 0;class i extends gi.MainSlim{constructor(){super(),this.addPlugin(Oi.AbsorbersPlugin),this.addPlugin(Ui.EmittersPlugin),this.addPlugin(Gi.PolygonMaskPlugin);}}e.Main=i;})),Yi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0});})),Ji=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0});})),Qi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0});})),Zi=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0});})),Ki=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),F.__exportStar(Yi,e),F.__exportStar(Ji,e),F.__exportStar(Qi,e),F.__exportStar(Zi,e);})),to=O((function(t,e){Object.defineProperty(e,"__esModule",{value:!0}),e.tsParticles=e.pJSDom=e.particlesJS=e.Utils=e.Constants=e.ColorUtils=e.CanvasUtils=void 0,Object.defineProperty(e,"CanvasUtils",{enumerable:!0,get:function(){return gt.CanvasUtils}}),Object.defineProperty(e,"ColorUtils",{enumerable:!0,get:function(){return gt.ColorUtils}}),Object.defineProperty(e,"Constants",{enumerable:!0,get:function(){return gt.Constants}}),Object.defineProperty(e,"Utils",{enumerable:!0,get:function(){return gt.Utils}});const i=new Xi.Main;e.tsParticles=i,i.init();const{particlesJS:o,pJSDom:n}=I.initPjs(i);e.particlesJS=o,e.pJSDom=n,F.__exportStar(mi,e),F.__exportStar(pt,e),F.__exportStar(xi,e),F.__exportStar(Di,e),F.__exportStar(Bi,e),F.__exportStar(Ki,e);}));function eo(e){let i;return {c(){var t;t="div",i=document.createElement(t),r(i,"id",e[0]);},m(t,e){!function(t,e,i){t.insertBefore(e,i||null);}(t,i,e);},p(t,[e]){1&e&&r(i,"id",t[0]);},i:t,o:t,d(t){t&&a(i);}}}function io(t,e,i){let{options:o={}}=e,{id:n="tsparticles"}=e;const s=u();let a=n;var r;return r=()=>{if(a){const t=to.tsParticles.dom().find(t=>t.id===a);t&&t.destroy();}n?to.tsParticles.load(n,o).then(t=>{s("particlesLoaded",{particles:t}),a=n;}):s("particlesLoaded",{particles:void 0});},d().$$.after_update.push(r),t.$set=t=>{"options"in t&&i(1,o=t.options),"id"in t&&i(0,n=t.id);},[n,o]}class Particles extends class{$destroy(){!function(t,e){const i=t.$$;null!==i.fragment&&(o(i.on_destroy),i.fragment&&i.fragment.d(e),i.on_destroy=i.fragment=null,i.ctx=[]);}(this,1),this.$destroy=t;}$on(t,e){const i=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return i.push(e),()=>{const t=i.indexOf(e);-1!==t&&i.splice(t,1);}}$set(){}}{constructor(t){super(),k(this,t,io,eo,s,{options:1,id:0});}get options(){return this.$$.ctx[1]}set options(t){this.$set({options:t}),_();}get id(){return this.$$.ctx[0]}set id(t){this.$set({id:t}),_();}}

    /* src/Typewriter.svelte generated by Svelte v3.25.1 */
    const file = "src/Typewriter.svelte";

    function create_fragment(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();

    			set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === "string"
    			? /*cursor*/ ctx[0]
    			: "black");

    			attr_dev(div, "class", "svelte-1h4l63n");
    			toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			add_location(div, file, 173, 0, 4901);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*cursor*/ 1) {
    				set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === "string"
    				? /*cursor*/ ctx[0]
    				: "black");
    			}

    			if (dirty & /*cursor*/ 1) {
    				toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Typewriter", slots, ['default']);
    	let { interval = 30 } = $$props;
    	let { cascade = false } = $$props;
    	let { loop = false } = $$props;
    	let { scramble = false } = $$props;
    	let { cursor = true } = $$props;
    	let { delay = 0 } = $$props;
    	let node;
    	let elements = [];
    	const dispatch = createEventDispatcher();
    	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    	const rng = (min, max) => Math.floor(Math.random() * (max - min) + min);
    	const hasSingleTextNode = el => el.childNodes.length === 1 && el.childNodes[0].nodeType === 3;
    	const typingInterval = async () => sleep(interval[rng(0, interval.length)] || interval);

    	const randomString = (word, foundIndexes) => [...Array(word.length).keys()].map(i => {
    		const found = foundIndexes.includes(i) || word[i] == " ";
    		const letter = String.fromCharCode(65 + Math.round(Math.random() * 50));
    		return found ? word[i] : letter;
    	}).join("");

    	const getElements = parentElement => {
    		const treeWalker = document.createTreeWalker(parentElement, NodeFilter.SHOW_ELEMENT);
    		let currentNode = treeWalker.nextNode();

    		while (currentNode) {
    			const text = currentNode.textContent.split("");
    			hasSingleTextNode(currentNode) && elements.push({ currentNode, text });
    			currentNode = treeWalker.nextNode();
    		}

    		if (hasSingleTextNode(node)) {
    			const text = node.textContent.split("");
    			$$invalidate(1, node.textContent = "", node);
    			const childNode = document.createElement("p");
    			node.appendChild(childNode);
    			elements.push({ currentNode: childNode, text });
    		}
    	};

    	const typewriterEffect = async ({ currentNode, text }) => {
    		currentNode.textContent = "";
    		currentNode.classList.add("typing");

    		for (const letter of text) {
    			currentNode.textContent += letter;
    			const fullyWritten = loop && currentNode.textContent === text.join("");

    			if (fullyWritten) {
    				dispatch("done");
    				await sleep(typeof loop === "number" ? loop : 1500);

    				while (currentNode.textContent !== "") {
    					currentNode.textContent = currentNode.textContent.slice(0, -1);
    					await typingInterval();
    				}

    				return;
    			}

    			await typingInterval();
    		}

    		if (currentNode.nextSibling !== null || !cascade) currentNode.classList.length == 1
    		? currentNode.removeAttribute("class")
    		: currentNode.classList.remove("typing");
    	};

    	const loopMode = async () => {
    		while (loop) {
    			for (const { currentNode, text } of elements) {
    				const loopParagraph = document.createElement(currentNode.tagName);
    				loopParagraph.textContent = text.join("");
    				node.childNodes.forEach(el => el.remove());
    				node.appendChild(loopParagraph);
    				await typewriterEffect({ currentNode: loopParagraph, text });
    				node.childNodes.forEach(el => el.remove());
    			}
    		}
    	};

    	const nonLoopMode = async () => {
    		cascade && elements.forEach(({ currentNode }) => currentNode.textContent = "");

    		for (const element of elements) {
    			cascade
    			? await typewriterEffect(element)
    			: typewriterEffect(element);
    		}

    		if (cascade) {
    			return dispatch("done");
    		}

    		const observer = new MutationObserver(mutations => {
    				mutations.forEach(mutation => {
    					const removedTypingClass = mutation.type === "attributes";
    					const lastElementFinishedTyping = removedTypingClass && !mutation.target.classList.contains("typing");
    					lastElementFinishedTyping && dispatch("done");
    				});
    			});

    		const lastElementToFinish = elements.sort((a, b) => b.length - a.length)[0].currentNode;

    		observer.observe(lastElementToFinish, {
    			attributes: true,
    			childList: true,
    			subtree: true
    		});
    	};

    	const scrambleMode = () => {
    		elements.forEach(async element => {
    			const { currentNode, text } = element;
    			const foundIndexes = [];

    			const scrambleCount = typeof scramble == "number"
    			? scramble * 1000 / interval
    			: 100;

    			let i = 0;

    			do {
    				currentNode.textContent = randomString(currentNode.textContent, foundIndexes);

    				for (let i = 0; i < text.length; i++) {
    					const current = currentNode.textContent;

    					if (!foundIndexes.includes(i) && text[i] === current[i]) {
    						foundIndexes.push(i);
    					}
    				}

    				i += 1;
    				await sleep(interval);
    			} while (currentNode.textContent != text.join("") && i < scrambleCount);

    			dispatch("done");
    			currentNode.textContent = text.join("");
    		});
    	};

    	onMount(() => {
    		getElements(node);

    		// If mode != scramble, clear the texts
    		!scramble && elements.forEach(({ currentNode }) => currentNode.textContent = "");

    		setTimeout(
    			() => {
    				if (loop) {
    					loopMode();
    				} else if (scramble) {
    					scrambleMode();
    				} else {
    					nonLoopMode();
    				}
    			},
    			delay
    		);
    	});

    	onDestroy(() => $$invalidate(2, loop = false));
    	const writable_props = ["interval", "cascade", "loop", "scramble", "cursor", "delay"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Typewriter> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			node = $$value;
    			$$invalidate(1, node);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("interval" in $$props) $$invalidate(3, interval = $$props.interval);
    		if ("cascade" in $$props) $$invalidate(4, cascade = $$props.cascade);
    		if ("loop" in $$props) $$invalidate(2, loop = $$props.loop);
    		if ("scramble" in $$props) $$invalidate(5, scramble = $$props.scramble);
    		if ("cursor" in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ("delay" in $$props) $$invalidate(6, delay = $$props.delay);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		onDestroy,
    		interval,
    		cascade,
    		loop,
    		scramble,
    		cursor,
    		delay,
    		node,
    		elements,
    		dispatch,
    		sleep,
    		rng,
    		hasSingleTextNode,
    		typingInterval,
    		randomString,
    		getElements,
    		typewriterEffect,
    		loopMode,
    		nonLoopMode,
    		scrambleMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("interval" in $$props) $$invalidate(3, interval = $$props.interval);
    		if ("cascade" in $$props) $$invalidate(4, cascade = $$props.cascade);
    		if ("loop" in $$props) $$invalidate(2, loop = $$props.loop);
    		if ("scramble" in $$props) $$invalidate(5, scramble = $$props.scramble);
    		if ("cursor" in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ("delay" in $$props) $$invalidate(6, delay = $$props.delay);
    		if ("node" in $$props) $$invalidate(1, node = $$props.node);
    		if ("elements" in $$props) elements = $$props.elements;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cursor,
    		node,
    		loop,
    		interval,
    		cascade,
    		scramble,
    		delay,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Typewriter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			interval: 3,
    			cascade: 4,
    			loop: 2,
    			scramble: 5,
    			cursor: 0,
    			delay: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Typewriter",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get interval() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interval(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cascade() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cascade(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scramble() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scramble(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cursor() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cursor(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Header.svelte generated by Svelte v3.25.1 */
    const file$1 = "src/Header.svelte";

    // (34:4) <Typewriter scramble={15} interval={10}>
    function create_default_slot(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "BERKIN AKKAYA";
    			add_location(h1, file$1, 34, 8, 1050);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(34:4) <Typewriter scramble={15} interval={10}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let particles;
    	let t0;
    	let header;
    	let nav;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let a2;
    	let t6;
    	let typewriter;
    	let t7;
    	let footer;
    	let span;
    	let t9;
    	let a3;
    	let current;

    	particles = new Particles({
    			props: {
    				id: "particles",
    				options: /*particlesConfig*/ ctx[0]
    			},
    			$$inline: true
    		});

    	typewriter = new Typewriter({
    			props: {
    				scramble: 15,
    				interval: 10,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(particles.$$.fragment);
    			t0 = space();
    			header = element("header");
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "ABOUT";
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "PROJECTS";
    			t4 = space();
    			a2 = element("a");
    			a2.textContent = "CONTACT";
    			t6 = space();
    			create_component(typewriter.$$.fragment);
    			t7 = space();
    			footer = element("footer");
    			span = element("span");
    			span.textContent = "background by";
    			t9 = space();
    			a3 = element("a");
    			a3.textContent = "freepik";
    			attr_dev(a0, "href", "#about");
    			attr_dev(a0, "class", "svelte-1sh2u6");
    			add_location(a0, file$1, 28, 8, 878);
    			attr_dev(a1, "href", "#projects");
    			attr_dev(a1, "class", "svelte-1sh2u6");
    			add_location(a1, file$1, 29, 8, 913);
    			attr_dev(a2, "href", "#contact");
    			attr_dev(a2, "class", "svelte-1sh2u6");
    			add_location(a2, file$1, 30, 8, 954);
    			attr_dev(nav, "class", "svelte-1sh2u6");
    			add_location(nav, file$1, 27, 4, 864);
    			attr_dev(span, "class", "svelte-1sh2u6");
    			add_location(span, file$1, 38, 8, 1113);
    			attr_dev(a3, "href", "https://www.freepik.es/fotos-vectores-gratis/fondo");
    			attr_dev(a3, "class", "svelte-1sh2u6");
    			add_location(a3, file$1, 39, 8, 1148);
    			attr_dev(footer, "class", "svelte-1sh2u6");
    			add_location(footer, file$1, 37, 4, 1096);
    			attr_dev(header, "class", "header svelte-1sh2u6");
    			add_location(header, file$1, 26, 0, 836);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(particles, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t2);
    			append_dev(nav, a1);
    			append_dev(nav, t4);
    			append_dev(nav, a2);
    			append_dev(header, t6);
    			mount_component(typewriter, header, null);
    			append_dev(header, t7);
    			append_dev(header, footer);
    			append_dev(footer, span);
    			append_dev(footer, t9);
    			append_dev(footer, a3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const typewriter_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				typewriter_changes.$$scope = { dirty, ctx };
    			}

    			typewriter.$set(typewriter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(particles.$$.fragment, local);
    			transition_in(typewriter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(particles.$$.fragment, local);
    			transition_out(typewriter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(particles, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(header);
    			destroy_component(typewriter);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);

    	let particlesConfig = {
    		"particles": {
    			"number": { "value": 10 },
    			"color": { "value": "#8EFFFF" },
    			"size": { "value": 30, "random": true },
    			"line_linked": { "enable": false },
    			"shape": {
    				"type": "image",
    				"image": { "src": "img/particle.png" }
    			},
    			"move": {
    				"enable": true,
    				"speed": 1.5,
    				"random": true,
    				"out_mode": "bounce"
    			}
    		},
    		"interactivity": {
    			"events": {
    				"onhover": { "enable": false },
    				"onclick": { "enable": false },
    				"resize": true
    			}
    		},
    		"retina_detect": true
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Particles, Typewriter, particlesConfig });

    	$$self.$inject_state = $$props => {
    		if ("particlesConfig" in $$props) $$invalidate(0, particlesConfig = $$props.particlesConfig);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [particlesConfig];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Projects.svelte generated by Svelte v3.25.1 */

    const file$2 = "src/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (99:16) {:else}
    function create_else_block(ctx) {
    	let abbr;

    	const block = {
    		c: function create() {
    			abbr = element("abbr");
    			abbr.textContent = "GitHub";
    			attr_dev(abbr, "title", "Not in GitHub.");
    			attr_dev(abbr, "class", "github missing svelte-vjs9x1");
    			add_location(abbr, file$2, 99, 16, 3805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, abbr, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(abbr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(99:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:16) {#if project.github}
    function create_if_block(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("GitHub");
    			attr_dev(a, "href", a_href_value = /*project*/ ctx[2].github);
    			attr_dev(a, "class", "github svelte-vjs9x1");
    			add_location(a, file$2, 97, 16, 3712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*LoadedProjects*/ 1 && a_href_value !== (a_href_value = /*project*/ ctx[2].github)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(97:16) {#if project.github}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#each LoadedProjects as project}
    function create_each_block(ctx) {
    	let div4;
    	let a0;
    	let div0;
    	let a0_href_value;
    	let t0;
    	let div3;
    	let div1;
    	let a1;
    	let h2;
    	let t1_value = /*project*/ ctx[2].title + "";
    	let t1;
    	let a1_href_value;
    	let t2;
    	let p;
    	let t3_value = /*project*/ ctx[2].description + "";
    	let t3;
    	let t4;
    	let div2;
    	let a2;
    	let t5;
    	let a2_href_value;
    	let t6;
    	let t7;

    	function select_block_type(ctx, dirty) {
    		if (/*project*/ ctx[2].github) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			a0 = element("a");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			a1 = element("a");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			a2 = element("a");
    			t5 = text("VISIT");
    			t6 = space();
    			if_block.c();
    			t7 = space();
    			set_style(div0, "background-image", "url(" + /*project*/ ctx[2].image + ")");
    			attr_dev(div0, "class", "image svelte-vjs9x1");
    			add_location(div0, file$2, 83, 12, 3243);
    			attr_dev(a0, "href", a0_href_value = /*project*/ ctx[2].link);
    			attr_dev(a0, "class", "svelte-vjs9x1");
    			add_location(a0, file$2, 82, 8, 3207);
    			attr_dev(h2, "class", "svelte-vjs9x1");
    			add_location(h2, file$2, 89, 20, 3449);
    			attr_dev(a1, "href", a1_href_value = /*project*/ ctx[2].link);
    			attr_dev(a1, "class", "svelte-vjs9x1");
    			add_location(a1, file$2, 88, 16, 3405);
    			attr_dev(p, "class", "svelte-vjs9x1");
    			add_location(p, file$2, 91, 16, 3511);
    			attr_dev(div1, "class", "info");
    			add_location(div1, file$2, 87, 12, 3370);
    			attr_dev(a2, "href", a2_href_value = /*project*/ ctx[2].link);
    			attr_dev(a2, "class", "visit svelte-vjs9x1");
    			add_location(a2, file$2, 94, 16, 3609);
    			attr_dev(div2, "class", "buttons");
    			add_location(div2, file$2, 93, 12, 3571);
    			attr_dev(div3, "class", "right svelte-vjs9x1");
    			add_location(div3, file$2, 86, 8, 3338);
    			attr_dev(div4, "class", "project svelte-vjs9x1");
    			add_location(div4, file$2, 81, 4, 3177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, a0);
    			append_dev(a0, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, a1);
    			append_dev(a1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, a2);
    			append_dev(a2, t5);
    			append_dev(div2, t6);
    			if_block.m(div2, null);
    			append_dev(div4, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*LoadedProjects*/ 1) {
    				set_style(div0, "background-image", "url(" + /*project*/ ctx[2].image + ")");
    			}

    			if (dirty & /*LoadedProjects*/ 1 && a0_href_value !== (a0_href_value = /*project*/ ctx[2].link)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*LoadedProjects*/ 1 && t1_value !== (t1_value = /*project*/ ctx[2].title + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*LoadedProjects*/ 1 && a1_href_value !== (a1_href_value = /*project*/ ctx[2].link)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*LoadedProjects*/ 1 && t3_value !== (t3_value = /*project*/ ctx[2].description + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*LoadedProjects*/ 1 && a2_href_value !== (a2_href_value = /*project*/ ctx[2].link)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(81:4) {#each LoadedProjects as project}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let each_value = /*LoadedProjects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "PROJECTS";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "id", "head");
    			attr_dev(h1, "class", "svelte-vjs9x1");
    			add_location(h1, file$2, 78, 4, 3106);
    			attr_dev(div, "id", "projects");
    			add_location(div, file$2, 77, 0, 3082);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*LoadedProjects*/ 1) {
    				each_value = /*LoadedProjects*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);

    	const AllProjects = [
    		{
    			title: "Pomolog",
    			description: "Time Management Tool",
    			image: "img/projects/pomolog.png",
    			link: "https://pomolog-berkinakkaya.web.app/",
    			github: "https://github.com/BerkinAKKAYA/Pomolog"
    		},
    		{
    			title: "Timeline",
    			description: "Most Minimalistic Calendar",
    			image: "img/projects/timeline.png",
    			link: "http://timeline-berkin.web.app/",
    			github: "https://github.com/BerkinAKKAYA/Timeline"
    		},
    		{
    			title: "Stay in the Shadows",
    			description: "Stealth & Action Game",
    			image: "img/projects/stay-in-the-shadows.png",
    			link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.StayintheShadows",
    			github: ""
    		},
    		{
    			title: "Focused YouTube",
    			description: "YouTube with Bookmarks",
    			image: "img/projects/focused-yt.png",
    			link: "https://focused-yt.web.app/",
    			github: "https://github.com/BerkinAKKAYA/Focused-YouTube"
    		},
    		{
    			title: "Jumpy",
    			description: "Hypercasual Game",
    			image: "img/projects/jumpy.png",
    			link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.Jumpy",
    			github: "https://github.com/BerkinAKKAYA/Jumpy"
    		},
    		{
    			title: "Split",
    			description: "Hypercasual Game",
    			image: "img/projects/split.png",
    			link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.Split",
    			github: "https://github.com/BerkinAKKAYA/Split"
    		},
    		{
    			title: "svelte-image-gallery",
    			description: "Fluid Image Container for Svelte",
    			image: "https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg",
    			link: "http://npmjs.com/package/svelte-image-gallery",
    			github: "https://github.com/BerkinAKKAYA/svelte-image-gallery"
    		},
    		{
    			title: "Vueweeter",
    			description: "Realtime Social Media App",
    			image: "img/projects/vue-logo.png",
    			link: "https://berkinakkaya.github.io/vueweeter",
    			github: "https://github.com/BerkinAKKAYA/vueweeter"
    		},
    		{
    			title: "Svelte Chat",
    			description: "Chat Application Backed by Firestore",
    			image: "img/projects/svelte.png",
    			link: "https://svelte-chat-berkinakkaya.web.app",
    			github: "https://github.com/BerkinAKKAYA/svelte-chat"
    		}
    	];

    	let LoadedProjects = [];

    	document.onscroll = () => {
    		const DOC = document.documentElement;
    		const top = DOC.scrollTop;
    		const height = DOC.scrollHeight - DOC.clientHeight;
    		const percent = top / height;

    		if (percent >= 0.7) {
    			if (AllProjects.length > 0) {
    				$$invalidate(0, LoadedProjects = [...LoadedProjects, AllProjects.pop()]);
    			} else {
    				document.onscroll = null;
    			}
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ AllProjects, LoadedProjects });

    	$$self.$inject_state = $$props => {
    		if ("LoadedProjects" in $$props) $$invalidate(0, LoadedProjects = $$props.LoadedProjects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [LoadedProjects];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Info.svelte generated by Svelte v3.25.1 */
    const file$3 = "src/Info.svelte";

    // (16:0) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "placeholder");
    			attr_dev(div, "class", "svelte-8233ed");
    			add_location(div, file$3, 16, 4, 408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(16:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:0) {#if show}
    function create_if_block$1(ctx) {
    	let typewriter;
    	let current;

    	typewriter = new Typewriter({
    			props: {
    				interval: 10,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(typewriter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(typewriter, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typewriter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typewriter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(typewriter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (9:4) <Typewriter interval={10}>
    function create_default_slot$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "I study Information Security in Istanbul.\n        I created many web apps & published games\n        so far and i am passionate about doing more.";
    			attr_dev(p, "id", "info");
    			attr_dev(p, "class", "svelte-8233ed");
    			add_location(p, file$3, 9, 4, 202);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(9:4) <Typewriter interval={10}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*show*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Info", slots, []);
    	let show = false;

    	document.addEventListener("scroll", () => {
    		$$invalidate(0, show = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Typewriter, show });

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Contact.svelte generated by Svelte v3.25.1 */

    const file$4 = "src/Contact.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let span0;
    	let t4;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let span1;
    	let t7;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let span2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "CONTACT";
    			t1 = space();
    			a0 = element("a");
    			img0 = element("img");
    			t2 = space();
    			span0 = element("span");
    			span0.textContent = "github.com/BerkinAkkaya";
    			t4 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "berkin_akkaya@hotmail.com";
    			t7 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t8 = space();
    			span2 = element("span");
    			span2.textContent = "+90 538 284 8787";
    			attr_dev(h1, "class", "svelte-1r3czs3");
    			add_location(h1, file$4, 1, 4, 23);
    			if (img0.src !== (img0_src_value = "img/contact/github.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "GitHub");
    			attr_dev(img0, "class", "svelte-1r3czs3");
    			add_location(img0, file$4, 3, 8, 108);
    			attr_dev(span0, "class", "svelte-1r3czs3");
    			add_location(span0, file$4, 4, 8, 166);
    			attr_dev(a0, "class", "link svelte-1r3czs3");
    			attr_dev(a0, "href", "https://github.com/BerkinAkkaya");
    			add_location(a0, file$4, 2, 4, 44);
    			if (img1.src !== (img1_src_value = "img/contact/mail.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "GitHub");
    			attr_dev(img1, "class", "svelte-1r3czs3");
    			add_location(img1, file$4, 7, 8, 281);
    			attr_dev(span1, "class", "svelte-1r3czs3");
    			add_location(span1, file$4, 8, 8, 337);
    			attr_dev(a1, "class", "link svelte-1r3czs3");
    			attr_dev(a1, "href", "mailto:berkin_akkaya@hotmail.com");
    			add_location(a1, file$4, 6, 4, 216);
    			if (img2.src !== (img2_src_value = "img/contact/phone.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "GitHub");
    			attr_dev(img2, "class", "svelte-1r3czs3");
    			add_location(img2, file$4, 11, 8, 442);
    			attr_dev(span2, "class", "svelte-1r3czs3");
    			add_location(span2, file$4, 12, 8, 499);
    			attr_dev(a2, "class", "link svelte-1r3czs3");
    			attr_dev(a2, "href", "tel:+90-538-284-8787");
    			add_location(a2, file$4, 10, 4, 389);
    			attr_dev(div, "id", "contact");
    			attr_dev(div, "class", "svelte-1r3czs3");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			append_dev(a0, img0);
    			append_dev(a0, t2);
    			append_dev(a0, span0);
    			append_dev(div, t4);
    			append_dev(div, a1);
    			append_dev(a1, img1);
    			append_dev(a1, t5);
    			append_dev(a1, span1);
    			append_dev(div, t7);
    			append_dev(div, a2);
    			append_dev(a2, img2);
    			append_dev(a2, t8);
    			append_dev(a2, span2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.1 */

    function create_fragment$5(ctx) {
    	let header;
    	let t0;
    	let info;
    	let t1;
    	let projects;
    	let t2;
    	let contact;
    	let current;
    	header = new Header({ $$inline: true });
    	info = new Info({ $$inline: true });
    	projects = new Projects({ $$inline: true });
    	contact = new Contact({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(info.$$.fragment);
    			t1 = space();
    			create_component(projects.$$.fragment);
    			t2 = space();
    			create_component(contact.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(info, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(projects, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(contact, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(info.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(info.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(info, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(projects, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(contact, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Projects, Info, Contact });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    new App({ target: document.body });

}());
//# sourceMappingURL=bundle.js.map
