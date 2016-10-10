/**
 * @license AngularJS v1.5.8
 * (c) 2010-2016 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var ELEMENT_NODE = 1;
var COMMENT_NODE = 8;

var ADD_CLASS_SUFFIX = '-add';
var REMOVE_CLASS_SUFFIX = '-remove';
var EVENT_CLASS_PREFIX = 'ng-';
var ACTIVE_CLASS_SUFFIX = '-active';
var PREPARE_CLASS_SUFFIX = '-prepare';

var NG_ANIMATE_CLASSNAME = 'ng-animate';
var NG_ANIMATE_CHILDREN_DATA = '$$ngAnimateChildren';

// Detect proper transitionend/animationend event names.
var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;

// If unprefixed events are not supported but webkit-prefixed are, use the latter.
// Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
// Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
// but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
// Register both events in case `window.onanimationend` is not supported because of that,
// do the same for `transitionend` as Safari is likely to exhibit similar behavior.
// Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
// therefore there is no reason to test anymore for other vendor prefixes:
// http://caniuse.com/#search=transition
if ((window.ontransitionend === void 0) && (window.onwebkittransitionend !== void 0)) {
  CSS_PREFIX = '-webkit-';
  TRANSITION_PROP = 'WebkitTransition';
  TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
} else {
  TRANSITION_PROP = 'transition';
  TRANSITIONEND_EVENT = 'transitionend';
}

if ((window.onanimationend === void 0) && (window.onwebkitanimationend !== void 0)) {
  CSS_PREFIX = '-webkit-';
  ANIMATION_PROP = 'WebkitAnimation';
  ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
} else {
  ANIMATION_PROP = 'animation';
  ANIMATIONEND_EVENT = 'animationend';
}

var DURATION_KEY = 'Duration';
var PROPERTY_KEY = 'Property';
var DELAY_KEY = 'Delay';
var TIMING_KEY = 'TimingFunction';
var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
var ANIMATION_PLAYSTATE_KEY = 'PlayState';
var SAFE_FAST_FORWARD_DURATION_VALUE = 9999;

var ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
var ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
var TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
var TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;

var ngMinErr = angular.$$minErr('ng');
function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr('areq', "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
  }
  return arg;
}

function mergeClasses(a,b) {
  if (!a && !b) return '';
  if (!a) return b;
  if (!b) return a;
  if (isArray(a)) a = a.join(' ');
  if (isArray(b)) b = b.join(' ');
  return a + ' ' + b;
}

function packageStyles(options) {
  var styles = {};
  if (options && (options.to || options.from)) {
    styles.to = options.to;
    styles.from = options.from;
  }
  return styles;
}

function pendClasses(classes, fix, isPrefix) {
  var className = '';
  classes = isArray(classes)
      ? classes
      : classes && isString(classes) && classes.length
          ? classes.split(/\s+/)
          : [];
  forEach(classes, function(klass, i) {
    if (klass && klass.length > 0) {
      className += (i > 0) ? ' ' : '';
      className += isPrefix ? fix + klass
                            : klass + fix;
    }
  });
  return className;
}

function removeFromArray(arr, val) {
  var index = arr.indexOf(val);
  if (val >= 0) {
    arr.splice(index, 1);
  }
}

function stripCommentsFromElement(element) {
  if (element instanceof jqLite) {
    switch (element.length) {
      case 0:
        return element;

      case 1:
        // there is no point of stripping anything if the element
        // is the only element within the jqLite wrapper.
        // (it's important that we retain the element instance.)
        if (element[0].nodeType === ELEMENT_NODE) {
          return element;
        }
        break;

      default:
        return jqLite(extractElementNode(element));
    }
  }

  if (element.nodeType === ELEMENT_NODE) {
    return jqLite(element);
  }
}

function extractElementNode(element) {
  if (!element[0]) return element;
  for (var i = 0; i < element.length; i++) {
    var elm = element[i];
    if (elm.nodeType == ELEMENT_NODE) {
      return elm;
    }
  }
}

function $$addClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.addClass(elm, className);
  });
}

function $$removeClass($$jqLite, element, className) {
  forEach(element, function(elm) {
    $$jqLite.removeClass(elm, className);
  });
}

function applyAnimationClassesFactory($$jqLite) {
  return function(element, options) {
    if (options.addClass) {
      $$addClass($$jqLite, element, options.addClass);
      options.addClass = null;
    }
    if (options.removeClass) {
      $$removeClass($$jqLite, element, options.removeClass);
      options.removeClass = null;
    }
  };
}

function prepareAnimationOptions(options) {
  options = options || {};
  if (!options.$$prepared) {
    var domOperation = options.domOperation || noop;
    options.domOperation = function() {
      options.$$domOperationFired = true;
      domOperation();
      domOperation = noop;
    };
    options.$$prepared = true;
  }
  return options;
}

function applyAnimationStyles(element, options) {
  applyAnimationFromStyles(element, options);
  applyAnimationToStyles(element, options);
}

function applyAnimationFromStyles(element, options) {
  if (options.from) {
    element.css(options.from);
    options.from = null;
  }
}

function applyAnimationToStyles(element, options) {
  if (options.to) {
    element.css(options.to);
    options.to = null;
  }
}

function mergeAnimationDetails(element, oldAnimation, newAnimation) {
  var target = oldAnimation.options || {};
  var newOptions = newAnimation.options || {};

  var toAdd = (target.addClass || '') + ' ' + (newOptions.addClass || '');
  var toRemove = (target.removeClass || '') + ' ' + (newOptions.removeClass || '');
  var classes = resolveElementClasses(element.attr('class'), toAdd, toRemove);

  if (newOptions.preparationClasses) {
    target.preparationClasses = concatWithSpace(newOptions.preparationClasses, target.preparationClasses);
    delete newOptions.preparationClasses;
  }

  // noop is basically when there is no callback; otherwise something has been set
  var realDomOperation = target.domOperation !== noop ? target.domOperation : null;

  extend(target, newOptions);

  // TODO(matsko or sreeramu): proper fix is to maintain all animation callback in array and call at last,but now only leave has the callback so no issue with this.
  if (realDomOperation) {
    target.domOperation = realDomOperation;
  }

  if (classes.addClass) {
    target.addClass = classes.addClass;
  } else {
    target.addClass = null;
  }

  if (classes.removeClass) {
    target.removeClass = classes.removeClass;
  } else {
    target.removeClass = null;
  }

  oldAnimation.addClass = target.addClass;
  oldAnimation.removeClass = target.removeClass;

  return target;
}

function resolveElementClasses(existing, toAdd, toRemove) {
  var ADD_CLASS = 1;
  var REMOVE_CLASS = -1;

  var flags = {};
  existing = splitClassesToLookup(existing);

  toAdd = splitClassesToLookup(toAdd);
  forEach(toAdd, function(value, key) {
    flags[key] = ADD_CLASS;
  });

  toRemove = splitClassesToLookup(toRemove);
  forEach(toRemove, function(value, key) {
    flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
  });

  var classes = {
    addClass: '',
    removeClass: ''
  };

  forEach(flags, function(val, klass) {
    var prop, allow;
    if (val === ADD_CLASS) {
      prop = 'addClass';
      allow = !existing[klass] || existing[klass + REMOVE_CLASS_SUFFIX];
    } else if (val === REMOVE_CLASS) {
      prop = 'removeClass';
      allow = existing[klass] || existing[klass + ADD_CLASS_SUFFIX];
    }
    if (allow) {
      if (classes[prop].length) {
        classes[prop] += ' ';
      }
      classes[prop] += klass;
    }
  });

  function splitClassesToLookup(classes) {
    if (isString(classes)) {
      classes = classes.split(' ');
    }

    var obj = {};
    forEach(classes, function(klass) {
      // sometimes the split leaves empty string values
      // incase extra spaces were applied to the options
      if (klass.length) {
        obj[klass] = true;
      }
    });
    return obj;
  }

  return classes;
}

function getDomNode(element) {
  return (element instanceof jqLite) ? element[0] : element;
}

function applyGeneratedPreparationClasses(element, event, options) {
  var classes = '';
  if (event) {
    classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
  }
  if (options.addClass) {
    classes = concatWithSpace(classes, pendClasses(options.addClass, ADD_CLASS_SUFFIX));
  }
  if (options.removeClass) {
    classes = concatWithSpace(classes, pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX));
  }
  if (classes.length) {
    options.preparationClasses = classes;
    element.addClass(classes);
  }
}

function clearGeneratedClasses(element, options) {
  if (options.preparationClasses) {
    element.removeClass(options.preparationClasses);
    options.preparationClasses = null;
  }
  if (options.activeClasses) {
    element.removeClass(options.activeClasses);
    options.activeClasses = null;
  }
}

function blockTransitions(node, duration) {
  // we use a negative delay value since it performs blocking
  // yet it doesn't kill any existing transitions running on the
  // same element which makes this safe for class-based animations
  var value = duration ? '-' + duration + 's' : '';
  applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
  return [TRANSITION_DELAY_PROP, value];
}

function blockKeyframeAnimations(node, applyBlock) {
  var value = applyBlock ? 'paused' : '';
  var key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
  applyInlineStyle(node, [key, value]);
  return [key, value];
}

function applyInlineStyle(node, styleTuple) {
  var prop = styleTuple[0];
  var value = styleTuple[1];
  node.style[prop] = value;
}

function concatWithSpace(a,b) {
  if (!a) return b;
  if (!b) return a;
  return a + ' ' + b;
}

var $$rAFSchedulerFactory = ['$$rAF', function($$rAF) {
  var queue, cancelFn;

  function scheduler(tasks) {
    // we make a copy since RAFScheduler mutates the state
    // of the passed in array variable and this would be difficult
    // to track down on the outside code
    queue = queue.concat(tasks);
    nextTick();
  }

  queue = scheduler.queue = [];

  /* waitUntilQuiet does two things:
   * 1. It will run the FINAL `fn` value only when an uncanceled RAF has passed through
   * 2. It will delay the next wave of tasks from running until the quiet `fn` has run.
   *
   * The motivation here is that animation code can request more time from the scheduler
   * before the next wave runs. This allows for certain DOM properties such as classes to
   * be resolved in time for the next animation to run.
   */
  scheduler.waitUntilQuiet = function(fn) {
    if (cancelFn) cancelFn();

    cancelFn = $$rAF(function() {
      cancelFn = null;
      fn();
      nextTick();
    });
  };

  return scheduler;

  function nextTick() {
    if (!queue.length) return;

    var items = queue.shift();
    for (var i = 0; i < items.length; i++) {
      items[i]();
    }

    if (!cancelFn) {
      $$rAF(function() {
        if (!cancelFn) nextTick();
      });
    }
  }
}];

/**
 * @ngdoc directive
 * @name ngAnimateChildren
 * @restrict AE
 * @element ANY
 *
 * @description
 *
 * ngAnimateChildren allows you to specify that children of this element should animate even if any
 * of the children's parents are currently animating. By default, when an element has an active `enter`, `leave`, or `move`
 * (structural) animation, child elements that also have an active structural animation are not animated.
 *
 * Note that even if `ngAnimteChildren` is set, no child animations will run when the parent element is removed from the DOM (`leave` animation).
 *
 *
 * @param {string} ngAnimateChildren If the value is empty, `true` or `on`,
 *     then child animations are allowed. If the value is `false`, child animations are not allowed.
 *
 * @example
 * <example module="ngAnimateChildren" name="ngAnimateChildren" deps="angular-animate.js" animations="true">
     <file name="index.html">
       <div ng-controller="mainController as main">
         <label>Show container? <input type="checkbox" ng-model="main.enterElement" /></label>
         <label>Animate children? <input type="checkbox" ng-model="main.animateChildren" /></label>
         <hr>
         <div ng-animate-children="{{main.animateChildren}}">
           <div ng-if="main.enterElement" class="container">
             List of items:
             <div ng-repeat="item in [0, 1, 2, 3]" class="item">Item {{item}}</div>
           </div>
         </div>
       </div>
     </file>
     <file name="animations.css">

      .container.ng-enter,
      .container.ng-leave {
        transition: all ease 1.5s;
      }

      .container.ng-enter,
      .container.ng-leave-active {
        opacity: 0;
      }

      .container.ng-leave,
      .container.ng-enter-active {
        opacity: 1;
      }

      .item {
        background: firebrick;
        color: #FFF;
        margin-bottom: 10px;
      }

      .item.ng-enter,
      .item.ng-leave {
        transition: transform 1.5s ease;
      }

      .item.ng-enter {
        transform: translateX(50px);
      }

      .item.ng-enter-active {
        transform: translateX(0);
      }
    </file>
    <file name="script.js">
      angular.module('ngAnimateChildren', ['ngAnimate'])
        .controller('mainController', function() {
          this.animateChildren = false;
          this.enterElement = false;
        });
    </file>
  </example>
 */
var $$AnimateChildrenDirective = ['$interpolate', function($interpolate) {
  return {
    link: function(scope, element, attrs) {
      var val = attrs.ngAnimateChildren;
      if (isString(val) && val.length === 0) { //empty attribute
        element.data(NG_ANIMATE_CHILDREN_DATA, true);
      } else {
        // Interpolate and set the value, so that it is available to
        // animations that run right after compilation
        setData($interpolate(val)(scope));
        attrs.$observe('ngAnimateChildren', setData);
      }

      function setData(value) {
        value = value === 'on' || value === 'true';
        element.data(NG_ANIMATE_CHILDREN_DATA, value);
      }
    }
  };
}];

var ANIMATE_TIMER_KEY = '$$animateCss';

/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 *
 * @description
 * The `$animateCss` service is a useful utility to trigger customized CSS-based transitions/keyframes
 * from a JavaScript-based animation or directly from a directive. The purpose of `$animateCss` is NOT
 * to side-step how `$animate` and ngAnimate work, but the goal is to allow pre-existing animations or
 * directives to create more complex animations that can be purely driven using CSS code.
 *
 * Note that only browsers that support CSS transitions and/or keyframe animations are capable of
 * rendering animations triggered via `$animateCss` (bad news for IE9 and lower).
 *
 * ## Usage
 * Once again, `$animateCss` is designed to be used inside of a registered JavaScript animation that
 * is powered by ngAnimate. It is possible to use `$animateCss` directly inside of a directive, however,
 * any automatic control over cancelling animations and/or preventing animations from being run on
 * child elements will not be handled by Angular. For this to work as expected, please use `$animate` to
 * trigger the animation and then setup a JavaScript animation that injects `$animateCss` to trigger
 * the CSS animation.
 *
 * The example below shows how we can create a folding animation on an element using `ng-if`:
 *
 * ```html
 * <!-- notice the `fold-animation` CSS class -->
 * <div ng-if="onOff" class="fold-animation">
 *   This element will go BOOM
 * </div>
 * <button ng-click="onOff=true">Fold In</button>
 * ```
 *
 * Now we create the **JavaScript animation** that will trigger the CSS transition:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * ## More Advanced Uses
 *
 * `$animateCss` is the underlying code that ngAnimate uses to power **CSS-based animations** behind the scenes. Therefore CSS hooks
 * like `.ng-EVENT`, `.ng-EVENT-active`, `.ng-EVENT-stagger` are all features that can be triggered using `$animateCss` via JavaScript code.
 *
 * This also means that just about any combination of adding classes, removing classes, setting styles, dynamically setting a keyframe animation,
 * applying a hardcoded duration or delay value, changing the animation easing or applying a stagger animation are all options that work with
 * `$animateCss`. The service itself is smart enough to figure out the combination of options and examine the element styling properties in order
 * to provide a working animation that will run in CSS.
 *
 * The example below showcases a more advanced version of the `.fold-animation` from the example above:
 *
 * ```js
 * ngModule.animation('.fold-animation', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element, doneFn) {
 *       var height = element[0].offsetHeight;
 *       return $animateCss(element, {
 *         addClass: 'red large-text pulse-twice',
 *         easing: 'ease-out',
 *         from: { height:'0px' },
 *         to: { height:height + 'px' },
 *         duration: 1 // one second
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Since we're adding/removing CSS classes then the CSS transition will also pick those up:
 *
 * ```css
 * /&#42; since a hardcoded duration value of 1 was provided in the JavaScript animation code,
 * the CSS classes below will be transitioned despite them being defined as regular CSS classes &#42;/
 * .red { background:red; }
 * .large-text { font-size:20px; }
 *
 * /&#42; we can also use a keyframe animation and $animateCss will make it work alongside the transition &#42;/
 * .pulse-twice {
 *   animation: 0.5s pulse linear 2;
 *   -webkit-animation: 0.5s pulse linear 2;
 * }
 *
 * @keyframes pulse {
 *   from { transform: scale(0.5); }
 *   to { transform: scale(1.5); }
 * }
 *
 * @-webkit-keyframes pulse {
 *   from { -webkit-transform: scale(0.5); }
 *   to { -webkit-transform: scale(1.5); }
 * }
 * ```
 *
 * Given this complex combination of CSS classes, styles and options, `$animateCss` will figure everything out and make the animation happen.
 *
 * ## How the Options are handled
 *
 * `$animateCss` is very versatile and intelligent when it comes to figuring out what configurations to apply to the element to ensure the animation
 * works with the options provided. Say for example we were adding a class that contained a keyframe value and we wanted to also animate some inline
 * styles using the `from` and `to` properties.
 *
 * ```js
 * var animator = $animateCss(element, {
 *   from: { background:'red' },
 *   to: { background:'blue' }
 * });
 * animator.start();
 * ```
 *
 * ```css
 * .rotating-animation {
 *   animation:0.5s rotate linear;
 *   -webkit-animation:0.5s rotate linear;
 * }
 *
 * @keyframes rotate {
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * }
 *
 * @-webkit-keyframes rotate {
 *   from { -webkit-transform: rotate(0deg); }
 *   to { -webkit-transform: rotate(360deg); }
 * }
 * ```
 *
 * The missing pieces here are that we do not have a transition set (within the CSS code nor within the `$animateCss` options) and the duration of the animation is
 * going to be detected from what the keyframe styles on the CSS class are. In this event, `$animateCss` will automatically create an inline transition
 * style matching the duration detected from the keyframe style (which is present in the CSS class that is being added) and then prepare both the transition
 * and keyframe animations to run in parallel on the element. Then when the animation is underway the provided `from` and `to` CSS styles will be applied
 * and spread across the transition and keyframe animation.
 *
 * ## What is returned
 *
 * `$animateCss` works in two stages: a preparation phase and an animation phase. Therefore when `$animateCss` is first called it will NOT actually
 * start the animation. All that is going on here is that the element is being prepared for the animation (which means that the generated CSS classes are
 * added and removed on the element). Once `$animateCss` is called it will return an object with the following properties:
 *
 * ```js
 * var animator = $animateCss(element, { ... });
 * ```
 *
 * Now what do the contents of our `animator` variable look like:
 *
 * ```js
 * {
 *   // starts the animation
 *   start: Function,
 *
 *   // ends (aborts) the animation
 *   end: Function
 * }
 * ```
 *
 * To actually start the animation we need to run `animation.start()` which will then return a promise that we can hook into to detect when the animation ends.
 * If we choose not to run the animation then we MUST run `animation.end()` to perform a cleanup on the element (since some CSS classes and styles may have been
 * applied to the element during the preparation phase). Note that all other properties such as duration, delay, transitions and keyframes are just properties
 * and that changing them will not reconfigure the parameters of the animation.
 *
 * ### runner.done() vs runner.then()
 * It is documented that `animation.start()` will return a promise object and this is true, however, there is also an additional method available on the
 * runner called `.done(callbackFn)`. The done method works the same as `.finally(callbackFn)`, however, it does **not trigger a digest to occur**.
 * Therefore, for performance reasons, it's always best to use `runner.done(callback)` instead of `runner.then()`, `runner.catch()` or `runner.finally()`
 * unless you really need a digest to kick off afterwards.
 *
 * Keep in mind that, to make this easier, ngAnimate has tweaked the JS animations API to recognize when a runner instance is returned from $animateCss
 * (so there is no need to call `runner.done(doneFn)` inside of your JavaScript animation code).
 * Check the {@link ngAnimate.$animateCss#usage animation code above} to see how this works.
 *
 * @param {DOMElement} element the element that will be animated
 * @param {object} options the animation-related options that will be applied during the animation
 *
 * * `event` - The DOM event (e.g. enter, leave, move). When used, a generated CSS class of `ng-EVENT` and `ng-EVENT-active` will be applied
 * to the element during the animation. Multiple events can be provided when spaces are used as a separator. (Note that this will not perform any DOM operation.)
 * * `structural` - Indicates that the `ng-` prefix will be added to the event class. Setting to `false` or omitting will turn `ng-EVENT` and
 * `ng-EVENT-active` in `EVENT` and `EVENT-active`. Unused if `event` is omitted.
 * * `easing` - The CSS easing value that will be applied to the transition or keyframe animation (or both).
 * * `transitionStyle` - The raw CSS transition style that will be used (e.g. `1s linear all`).
 * * `keyframeStyle` - The raw CSS keyframe animation style that will be used (e.g. `1s my_animation linear`).
 * * `from` - The starting CSS styles (a key/value object) that will be applied at the start of the animation.
 * * `to` - The ending CSS styles (a key/value object) that will be applied across the animation via a CSS transition.
 * * `addClass` - A space separated list of CSS classes that will be added to the element and spread across the animation.
 * * `removeClass` - A space separated list of CSS classes that will be removed from the element and spread across the animation.
 * * `duration` - A number value representing the total duration of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `0`
 * is provided then the animation will be skipped entirely.
 * * `delay` - A number value representing the total delay of the transition and/or keyframe (note that a value of 1 is 1000ms). If a value of `true` is
 * used then whatever delay value is detected from the CSS classes will be mirrored on the elements styles (e.g. by setting delay true then the style value
 * of the element will be `transition-delay: DETECTED_VALUE`). Using `true` is useful when you want the CSS classes and inline styles to all share the same
 * CSS delay value.
 * * `stagger` - A numeric time value representing the delay between successively animated elements
 * ({@link ngAnimate#css-staggering-animations Click here to learn how CSS-based staggering works in ngAnimate.})
 * * `staggerIndex` - The numeric index representing the stagger item (e.g. a value of 5 is equal to the sixth item in the stagger; therefore when a
 *   `stagger` option value of `0.1` is used then there will be a stagger delay of `600ms`)
 * * `applyClassesEarly` - Whether or not the classes being added or removed will be used when detecting the animation. This is set by `$animate` when enter/leave/move animations are fired to ensure that the CSS classes are resolved in time. (Note that this will prevent any transitions from occurring on the classes being added and removed.)
 * * `cleanupStyles` - Whether or not the provided `from` and `to` styles will be removed once
 *    the animation is closed. This is useful for when the styles are used purely for the sake of
 *    the animation and do not have a lasting visual effect on the element (e.g. a collapse and open animation).
 *    By default this value is set to `false`.
 *
 * @return {object} an object with start and end methods and details about the animation.
 *
 * * `start` - The method to start the animation. This will return a `Promise` when called.
 * * `end` - This method will cancel the animation and remove all applied CSS classes and styles.
 */
var ONE_SECOND = 1000;
var BASE_TEN = 10;

var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
var CLOSING_TIME_BUFFER = 1.5;

var DETECT_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  transitionProperty:      TRANSITION_PROP + PROPERTY_KEY,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP,
  animationIterationCount: ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY
};

var DETECT_STAGGER_CSS_PROPERTIES = {
  transitionDuration:      TRANSITION_DURATION_PROP,
  transitionDelay:         TRANSITION_DELAY_PROP,
  animationDuration:       ANIMATION_DURATION_PROP,
  animationDelay:          ANIMATION_DELAY_PROP
};

function getCssKeyframeDurationStyle(duration) {
  return [ANIMATION_DURATION_PROP, duration + 's'];
}

function getCssDelayStyle(delay, isKeyframeAnimation) {
  var prop = isKeyframeAnimation ? ANIMATION_DELAY_PROP : TRANSITION_DELAY_PROP;
  return [prop, delay + 's'];
}

function computeCssStyles($window, element, properties) {
  var styles = Object.create(null);
  var detectedStyles = $window.getComputedStyle(element) || {};
  forEach(properties, function(formalStyleName, actualStyleName) {
    var val = detectedStyles[formalStyleName];
    if (val) {
      var c = val.charAt(0);

      // only numerical-based values have a negative sign or digit as the first value
      if (c === '-' || c === '+' || c >= 0) {
        val = parseMaxTime(val);
      }

      // by setting this to null in the event that the delay is not set or is set directly as 0
      // then we can still allow for negative values to be used later on and not mistake this
      // value for being greater than any other negative value.
      if (val === 0) {
        val = null;
      }
      styles[actualStyleName] = val;
    }
  });

  return styles;
}

function parseMaxTime(str) {
  var maxValue = 0;
  var values = str.split(/\s*,\s*/);
  forEach(values, function(value) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value) || 0;
    maxValue = maxValue ? Math.max(value, maxValue) : value;
  });
  return maxValue;
}

function truthyTimingValue(val) {
  return val === 0 || val != null;
}

function getCssTransitionDurationStyle(duration, applyOnlyDuration) {
  var style = TRANSITION_PROP;
  var value = duration + 's';
  if (applyOnlyDuration) {
    style += DURATION_KEY;
  } else {
    value += ' linear all';
  }
  return [style, value];
}

function createLocalCacheLookup() {
  var cache = Object.create(null);
  return {
    flush: function() {
      cache = Object.create(null);
    },

    count: function(key) {
      var entry = cache[key];
      return entry ? entry.total : 0;
    },

    get: function(key) {
      var entry = cache[key];
      return entry && entry.value;
    },

    put: function(key, value) {
      if (!cache[key]) {
        cache[key] = { total: 1, value: value };
      } else {
        cache[key].total++;
      }
    }
  };
}

// we do not reassign an already present style value since
// if we detect the style property value again we may be
// detecting styles that were added via the `from` styles.
// We make use of `isDefined` here since an empty string
// or null value (which is what getPropertyValue will return
// for a non-existing style) will still be marked as a valid
// value for the style (a falsy value implies that the style
// is to be removed at the end of the animation). If we had a simple
// "OR" statement then it would not be enough to catch that.
function registerRestorableStyles(backup, node, properties) {
  forEach(properties, function(prop) {
    backup[prop] = isDefined(backup[prop])
        ? backup[prop]
        : node.style.getPropertyValue(prop);
  });
}

var $AnimateCssProvider = ['$animateProvider', function($animateProvider) {
  var gcsLookup = createLocalCacheLookup();
  var gcsStaggerLookup = createLocalCacheLookup();

  this.$get = ['$window', '$$jqLite', '$$AnimateRunner', '$timeout',
               '$$forceReflow', '$sniffer', '$$rAFScheduler', '$$animateQueue',
       function($window,   $$jqLite,   $$AnimateRunner,   $timeout,
                $$forceReflow,   $sniffer,   $$rAFScheduler, $$animateQueue) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    var parentCounter = 0;
    function gcsHashFn(node, extraClasses) {
      var KEY = "$$ngAnimateParentKey";
      var parentNode = node.parentNode;
      var parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
      return parentID + '-' + node.getAttribute('class') + '-' + extraClasses;
    }

    function computeCachedCssStyles(node, className, cacheKey, properties) {
      var timings = gcsLookup.get(cacheKey);

      if (!timings) {
        timings = computeCssStyles($window, node, properties);
        if (timings.animationIterationCount === 'infinite') {
          timings.animationIterationCount = 1;
        }
      }

      // we keep putting this in multiple times even though the value and the cacheKey are the same
      // because we're keeping an internal tally of how many duplicate animations are detected.
      gcsLookup.put(cacheKey, timings);
      return timings;
    }

    function computeCachedCssStaggerStyles(node, className, cacheKey, properties) {
      var stagger;

      // if we have one or more existing matches of matching elements
      // containing the same parent + CSS styles (which is how cacheKey works)
      // then staggering is possible
      if (gcsLookup.count(cacheKey) > 0) {
        stagger = gcsStaggerLookup.get(cacheKey);

        if (!stagger) {
          var staggerClassName = pendClasses(className, '-stagger');

          $$jqLite.addClass(node, staggerClassName);

          stagger = computeCssStyles($window, node, properties);

          // force the conversion of a null value to zero incase not set
          stagger.animationDuration = Math.max(stagger.animationDuration, 0);
          stagger.transitionDuration = Math.max(stagger.transitionDuration, 0);

          $$jqLite.removeClass(node, staggerClassName);

          gcsStaggerLookup.put(cacheKey, stagger);
        }
      }

      return stagger || {};
    }

    var cancelLastRAFRequest;
    var rafWaitQueue = [];
    function waitUntilQuiet(callback) {
      rafWaitQueue.push(callback);
      $$rAFScheduler.waitUntilQuiet(function() {
        gcsLookup.flush();
        gcsStaggerLookup.flush();

        // DO NOT REMOVE THIS LINE OR REFACTOR OUT THE `pageWidth` variable.
        // PLEASE EXAMINE THE `$$forceReflow` service to understand why.
        var pageWidth = $$forceReflow();

        // we use a for loop to ensure that if the queue is changed
        // during this looping then it will consider new requests
        for (var i = 0; i < rafWaitQueue.length; i++) {
          rafWaitQueue[i](pageWidth);
        }
        rafWaitQueue.length = 0;
      });
    }

    function computeTimings(node, className, cacheKey) {
      var timings = computeCachedCssStyles(node, className, cacheKey, DETECT_CSS_PROPERTIES);
      var aD = timings.animationDelay;
      var tD = timings.transitionDelay;
      timings.maxDelay = aD && tD
          ? Math.max(aD, tD)
          : (aD || tD);
      timings.maxDuration = Math.max(
          timings.animationDuration * timings.animationIterationCount,
          timings.transitionDuration);

      return timings;
    }

    return function init(element, initialOptions) {
      // all of the animation functions should create
      // a copy of the options data, however, if a
      // parent service has already created a copy then
      // we should stick to using that
      var options = initialOptions || {};
      if (!options.$$prepared) {
        options = prepareAnimationOptions(copy(options));
      }

      var restoreStyles = {};
      var node = getDomNode(element);
      if (!node
          || !node.parentNode
          || !$$animateQueue.enabled()) {
        return closeAndReturnNoopAnimator();
      }

      var temporaryStyles = [];
      var classes = element.attr('class');
      var styles = packageStyles(options);
      var animationClosed;
      var animationPaused;
      var animationCompleted;
      var runner;
      var runnerHost;
      var maxDelay;
      var maxDelayTime;
      var maxDuration;
      var maxDurationTime;
      var startTime;
      var events = [];

      if (options.duration === 0 || (!$sniffer.animations && !$sniffer.transitions)) {
        return closeAndReturnNoopAnimator();
      }

      var method = options.event && isArray(options.event)
            ? options.event.join(' ')
            : options.event;

      var isStructural = method && options.structural;
      var structuralClassName = '';
      var addRemoveClassName = '';

      if (isStructural) {
        structuralClassName = pendClasses(method, EVENT_CLASS_PREFIX, true);
      } else if (method) {
        structuralClassName = method;
      }

      if (options.addClass) {
        addRemoveClassName += pendClasses(options.addClass, ADD_CLASS_SUFFIX);
      }

      if (options.removeClass) {
        if (addRemoveClassName.length) {
          addRemoveClassName += ' ';
        }
        addRemoveClassName += pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX);
      }

      // there may be a situation where a structural animation is combined together
      // with CSS classes that need to resolve before the animation is computed.
      // However this means that there is no explicit CSS code to block the animation
      // from happening (by setting 0s none in the class name). If this is the case
      // we need to apply the classes before the first rAF so we know to continue if
      // there actually is a detected transition or keyframe animation
      if (options.applyClassesEarly && addRemoveClassName.length) {
        applyAnimationClasses(element, options);
      }

      var preparationClasses = [structuralClassName, addRemoveClassName].join(' ').trim();
      var fullClassName = classes + ' ' + preparationClasses;
      var activeClasses = pendClasses(preparationClasses, ACTIVE_CLASS_SUFFIX);
      var hasToStyles = styles.to && Object.keys(styles.to).length > 0;
      var containsKeyframeAnimation = (options.keyframeStyle || '').length > 0;

      // there is no way we can trigger an animation if no styles and
      // no classes are being applied which would then trigger a transition,
      // unless there a is raw keyframe value that is applied to the element.
      if (!containsKeyframeAnimation
           && !hasToStyles
           && !preparationClasses) {
        return closeAndReturnNoopAnimator();
      }

      var cacheKey, stagger;
      if (options.stagger > 0) {
        var staggerVal = parseFloat(options.stagger);
        stagger = {
          transitionDelay: staggerVal,
          animationDelay: staggerVal,
          transitionDuration: 0,
          animationDuration: 0
        };
      } else {
        cacheKey = gcsHashFn(node, fullClassName);
        stagger = computeCachedCssStaggerStyles(node, preparationClasses, cacheKey, DETECT_STAGGER_CSS_PROPERTIES);
      }

      if (!options.$$skipPreparationClasses) {
        $$jqLite.addClass(element, preparationClasses);
      }

      var applyOnlyDuration;

      if (options.transitionStyle) {
        var transitionStyle = [TRANSITION_PROP, options.transitionStyle];
        applyInlineStyle(node, transitionStyle);
        temporaryStyles.push(transitionStyle);
      }

      if (options.duration >= 0) {
        applyOnlyDuration = node.style[TRANSITION_PROP].length > 0;
        var durationStyle = getCssTransitionDurationStyle(options.duration, applyOnlyDuration);

        // we set the duration so that it will be picked up by getComputedStyle later
        applyInlineStyle(node, durationStyle);
        temporaryStyles.push(durationStyle);
      }

      if (options.keyframeStyle) {
        var keyframeStyle = [ANIMATION_PROP, options.keyframeStyle];
        applyInlineStyle(node, keyframeStyle);
        temporaryStyles.push(keyframeStyle);
      }

      var itemIndex = stagger
          ? options.staggerIndex >= 0
              ? options.staggerIndex
              : gcsLookup.count(cacheKey)
          : 0;

      var isFirst = itemIndex === 0;

      // this is a pre-emptive way of forcing the setup classes to be added and applied INSTANTLY
      // without causing any combination of transitions to kick in. By adding a negative delay value
      // it forces the setup class' transition to end immediately. We later then remove the negative
      // transition delay to allow for the transition to naturally do it's thing. The beauty here is
      // that if there is no transition defined then nothing will happen and this will also allow
      // other transitions to be stacked on top of each other without any chopping them out.
      if (isFirst && !options.skipBlocking) {
        blockTransitions(node, SAFE_FAST_FORWARD_DURATION_VALUE);
      }

      var timings = computeTimings(node, fullClassName, cacheKey);
      var relativeDelay = timings.maxDelay;
      maxDelay = Math.max(relativeDelay, 0);
      maxDuration = timings.maxDuration;

      var flags = {};
      flags.hasTransitions          = timings.transitionDuration > 0;
      flags.hasAnimations           = timings.animationDuration > 0;
      flags.hasTransitionAll        = flags.hasTransitions && timings.transitionProperty == 'all';
      flags.applyTransitionDuration = hasToStyles && (
                                        (flags.hasTransitions && !flags.hasTransitionAll)
                                         || (flags.hasAnimations && !flags.hasTransitions));
      flags.applyAnimationDuration  = options.duration && flags.hasAnimations;
      flags.applyTransitionDelay    = truthyTimingValue(options.delay) && (flags.applyTransitionDuration || flags.hasTransitions);
      flags.applyAnimationDelay     = truthyTimingValue(options.delay) && flags.hasAnimations;
      flags.recalculateTimingStyles = addRemoveClassName.length > 0;

      if (flags.applyTransitionDuration || flags.applyAnimationDuration) {
        maxDuration = options.duration ? parseFloat(options.duration) : maxDuration;

        if (flags.applyTransitionDuration) {
          flags.hasTransitions = true;
          timings.transitionDuration = maxDuration;
          applyOnlyDuration = node.style[TRANSITION_PROP + PROPERTY_KEY].length > 0;
          temporaryStyles.push(getCssTransitionDurationStyle(maxDuration, applyOnlyDuration));
        }

        if (flags.applyAnimationDuration) {
          flags.hasAnimations = true;
          timings.animationDuration = maxDuration;
          temporaryStyles.push(getCssKeyframeDurationStyle(maxDuration));
        }
      }

      if (maxDuration === 0 && !flags.recalculateTimingStyles) {
        return closeAndReturnNoopAnimator();
      }

      if (options.delay != null) {
        var delayStyle;
        if (typeof options.delay !== "boolean") {
          delayStyle = parseFloat(options.delay);
          // number in options.delay means we have to recalculate the delay for the closing timeout
          maxDelay = Math.max(delayStyle, 0);
        }

        if (flags.applyTransitionDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle));
        }

        if (flags.applyAnimationDelay) {
          temporaryStyles.push(getCssDelayStyle(delayStyle, true));
        }
      }

      // we need to recalculate the delay value since we used a pre-emptive negative
      // delay value and the delay value is required for the final event checking. This
      // property will ensure that this will happen after the RAF phase has passed.
      if (options.duration == null && timings.transitionDuration > 0) {
        flags.recalculateTimingStyles = flags.recalculateTimingStyles || isFirst;
      }

      maxDelayTime = maxDelay * ONE_SECOND;
      maxDurationTime = maxDuration * ONE_SECOND;
      if (!options.skipBlocking) {
        flags.blockTransition = timings.transitionDuration > 0;
        flags.blockKeyframeAnimation = timings.animationDuration > 0 &&
                                       stagger.animationDelay > 0 &&
                                       stagger.animationDuration === 0;
      }

      if (options.from) {
        if (options.cleanupStyles) {
          registerRestorableStyles(restoreStyles, node, Object.keys(options.from));
        }
        applyAnimationFromStyles(element, options);
      }

      if (flags.blockTransition || flags.blockKeyframeAnimation) {
        applyBlocking(maxDuration);
      } else if (!options.skipBlocking) {
        blockTransitions(node, false);
      }

      // TODO(matsko): for 1.5 change this code to have an animator object for better debugging
      return {
        $$willAnimate: true,
        end: endFn,
        start: function() {
          if (animationClosed) return;

          runnerHost = {
            end: endFn,
            cancel: cancelFn,
            resume: null, //this will be set during the start() phase
            pause: null
          };

          runner = new $$AnimateRunner(runnerHost);

          waitUntilQuiet(start);

          // we don't have access to pause/resume the animation
          // since it hasn't run yet. AnimateRunner will therefore
          // set noop functions for resume and pause and they will
          // later be overridden once the animation is triggered
          return runner;
        }
      };

      function endFn() {
        close();
      }

      function cancelFn() {
        close(true);
      }

      function close(rejected) { // jshint ignore:line
        // if the promise has been called already then we shouldn't close
        // the animation again
        if (animationClosed || (animationCompleted && animationPaused)) return;
        animationClosed = true;
        animationPaused = false;

        if (!options.$$skipPreparationClasses) {
          $$jqLite.removeClass(element, preparationClasses);
        }
        $$jqLite.removeClass(element, activeClasses);

        blockKeyframeAnimations(node, false);
        blockTransitions(node, false);

        forEach(temporaryStyles, function(entry) {
          // There is only one way to remove inline style properties entirely from elements.
          // By using `removeProperty` this works, but we need to convert camel-cased CSS
          // styles down to hyphenated values.
          node.style[entry[0]] = '';
        });

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);

        if (Object.keys(restoreStyles).length) {
          forEach(restoreStyles, function(value, prop) {
            value ? node.style.setProperty(prop, value)
                  : node.style.removeProperty(prop);
          });
        }

        // the reason why we have this option is to allow a synchronous closing callback
        // that is fired as SOON as the animation ends (when the CSS is removed) or if
        // the animation never takes off at all. A good example is a leave animation since
        // the element must be removed just after the animation is over or else the element
        // will appear on screen for one animation frame causing an overbearing flicker.
        if (options.onDone) {
          options.onDone();
        }

        if (events && events.length) {
          // Remove the transitionend / animationend listener(s)
          element.off(events.join(' '), onAnimationProgress);
        }

        //Cancel the fallback closing timeout and remove the timer data
        var animationTimerData = element.data(ANIMATE_TIMER_KEY);
        if (animationTimerData) {
          $timeout.cancel(animationTimerData[0].timer);
          element.removeData(ANIMATE_TIMER_KEY);
        }

        // if the preparation function fails then the promise is not setup
        if (runner) {
          runner.complete(!rejected);
        }
      }

      function applyBlocking(duration) {
        if (flags.blockTransition) {
          blockTransitions(node, duration);
        }

        if (flags.blockKeyframeAnimation) {
          blockKeyframeAnimations(node, !!duration);
        }
      }

      function closeAndReturnNoopAnimator() {
        runner = new $$AnimateRunner({
          end: endFn,
          cancel: cancelFn
        });

        // should flush the cache animation
        waitUntilQuiet(noop);
        close();

        return {
          $$willAnimate: false,
          start: function() {
            return runner;
          },
          end: endFn
        };
      }

      function onAnimationProgress(event) {
        event.stopPropagation();
        var ev = event.originalEvent || event;

        // we now always use `Date.now()` due to the recent changes with
        // event.timeStamp in Firefox, Webkit and Chrome (see #13494 for more info)
        var timeStamp = ev.$manualTimeStamp || Date.now();

        /* Firefox (or possibly just Gecko) likes to not round values up
         * when a ms measurement is used for the animation */
        var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));

        /* $manualTimeStamp is a mocked timeStamp value which is set
         * within browserTrigger(). This is only here so that tests can
         * mock animations properly. Real events fallback to event.timeStamp,
         * or, if they don't, then a timeStamp is automatically created for them.
         * We're checking to see if the timeStamp surpasses the expected delay,
         * but we're using elapsedTime instead of the timeStamp on the 2nd
         * pre-condition since animationPauseds sometimes close off early */
        if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
          // we set this flag to ensure that if the transition is paused then, when resumed,
          // the animation will automatically close itself since transitions cannot be paused.
          animationCompleted = true;
          close();
        }
      }

      function start() {
        if (animationClosed) return;
        if (!node.parentNode) {
          close();
          return;
        }

        // even though we only pause keyframe animations here the pause flag
        // will still happen when transitions are used. Only the transition will
        // not be paused since that is not possible. If the animation ends when
        // paused then it will not complete until unpaused or cancelled.
        var playPause = function(playAnimation) {
          if (!animationCompleted) {
            animationPaused = !playAnimation;
            if (timings.animationDuration) {
              var value = blockKeyframeAnimations(node, animationPaused);
              animationPaused
                  ? temporaryStyles.push(value)
                  : removeFromArray(temporaryStyles, value);
            }
          } else if (animationPaused && playAnimation) {
            animationPaused = false;
            close();
          }
        };

        // checking the stagger duration prevents an accidentally cascade of the CSS delay style
        // being inherited from the parent. If the transition duration is zero then we can safely
        // rely that the delay value is an intentional stagger delay style.
        var maxStagger = itemIndex > 0
                         && ((timings.transitionDuration && stagger.transitionDuration === 0) ||
                            (timings.animationDuration && stagger.animationDuration === 0))
                         && Math.max(stagger.animationDelay, stagger.transitionDelay);
        if (maxStagger) {
          $timeout(triggerAnimationStart,
                   Math.floor(maxStagger * itemIndex * ONE_SECOND),
                   false);
        } else {
          triggerAnimationStart();
        }

        // this will decorate the existing promise runner with pause/resume methods
        runnerHost.resume = function() {
          playPause(true);
        };

        runnerHost.pause = function() {
          playPause(false);
        };

        function triggerAnimationStart() {
          // just incase a stagger animation kicks in when the animation
          // itself was cancelled entirely
          if (animationClosed) return;

          applyBlocking(false);

          forEach(temporaryStyles, function(entry) {
            var key = entry[0];
            var value = entry[1];
            node.style[key] = value;
          });

          applyAnimationClasses(element, options);
          $$jqLite.addClass(element, activeClasses);

          if (flags.recalculateTimingStyles) {
            fullClassName = node.className + ' ' + preparationClasses;
            cacheKey = gcsHashFn(node, fullClassName);

            timings = computeTimings(node, fullClassName, cacheKey);
            relativeDelay = timings.maxDelay;
            maxDelay = Math.max(relativeDelay, 0);
            maxDuration = timings.maxDuration;

            if (maxDuration === 0) {
              close();
              return;
            }

            flags.hasTransitions = timings.transitionDuration > 0;
            flags.hasAnimations = timings.animationDuration > 0;
          }

          if (flags.applyAnimationDelay) {
            relativeDelay = typeof options.delay !== "boolean" && truthyTimingValue(options.delay)
                  ? parseFloat(options.delay)
                  : relativeDelay;

            maxDelay = Math.max(relativeDelay, 0);
            timings.animationDelay = relativeDelay;
            delayStyle = getCssDelayStyle(relativeDelay, true);
            temporaryStyles.push(delayStyle);
            node.style[delayStyle[0]] = delayStyle[1];
          }

          maxDelayTime = maxDelay * ONE_SECOND;
          maxDurationTime = maxDuration * ONE_SECOND;

          if (options.easing) {
            var easeProp, easeVal = options.easing;
            if (flags.hasTransitions) {
              easeProp = TRANSITION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
            if (flags.hasAnimations) {
              easeProp = ANIMATION_PROP + TIMING_KEY;
              temporaryStyles.push([easeProp, easeVal]);
              node.style[easeProp] = easeVal;
            }
          }

          if (timings.transitionDuration) {
            events.push(TRANSITIONEND_EVENT);
          }

          if (timings.animationDuration) {
            events.push(ANIMATIONEND_EVENT);
          }

          startTime = Date.now();
          var timerTime = maxDelayTime + CLOSING_TIME_BUFFER * maxDurationTime;
          var endTime = startTime + timerTime;

          var animationsData = element.data(ANIMATE_TIMER_KEY) || [];
          var setupFallbackTimer = true;
          if (animationsData.length) {
            var currentTimerData = animationsData[0];
            setupFallbackTimer = endTime > currentTimerData.expectedEndTime;
            if (setupFallbackTimer) {
              $timeout.cancel(currentTimerData.timer);
            } else {
              animationsData.push(close);
            }
          }

          if (setupFallbackTimer) {
            var timer = $timeout(onAnimationExpired, timerTime, false);
            animationsData[0] = {
              timer: timer,
              expectedEndTime: endTime
            };
            animationsData.push(close);
            element.data(ANIMATE_TIMER_KEY, animationsData);
          }

          if (events.length) {
            element.on(events.join(' '), onAnimationProgress);
          }

          if (options.to) {
            if (options.cleanupStyles) {
              registerRestorableStyles(restoreStyles, node, Object.keys(options.to));
            }
            applyAnimationToStyles(element, options);
          }
        }

        function onAnimationExpired() {
          var animationsData = element.data(ANIMATE_TIMER_KEY);

          // this will be false in the event that the element was
          // removed from the DOM (via a leave animation or something
          // similar)
          if (animationsData) {
            for (var i = 1; i < animationsData.length; i++) {
              animationsData[i]();
            }
            element.removeData(ANIMATE_TIMER_KEY);
          }
        }
      }
    };
  }];
}];

var $$AnimateCssDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateCssDriver');

  var NG_ANIMATE_SHIM_CLASS_NAME = 'ng-animate-shim';
  var NG_ANIMATE_ANCHOR_CLASS_NAME = 'ng-anchor';

  var NG_OUT_ANCHOR_CLASS_NAME = 'ng-anchor-out';
  var NG_IN_ANCHOR_CLASS_NAME = 'ng-anchor-in';

  function isDocumentFragment(node) {
    return node.parentNode && node.parentNode.nodeType === 11;
  }

  this.$get = ['$animateCss', '$rootScope', '$$AnimateRunner', '$rootElement', '$sniffer', '$$jqLite', '$document',
       function($animateCss,   $rootScope,   $$AnimateRunner,   $rootElement,   $sniffer,   $$jqLite,   $document) {

    // only browsers that support these properties can render animations
    if (!$sniffer.animations && !$sniffer.transitions) return noop;

    var bodyNode = $document[0].body;
    var rootNode = getDomNode($rootElement);

    var rootBodyElement = jqLite(
      // this is to avoid using something that exists outside of the body
      // we also special case the doc fragment case because our unit test code
      // appends the $rootElement to the body after the app has been bootstrapped
      isDocumentFragment(rootNode) || bodyNode.contains(rootNode) ? rootNode : bodyNode
    );

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    return function initDriverFn(animationDetails) {
      return animationDetails.from && animationDetails.to
          ? prepareFromToAnchorAnimation(animationDetails.from,
                                         animationDetails.to,
                                         animationDetails.classes,
                                         animationDetails.anchors)
          : prepareRegularAnimation(animationDetails);
    };

    function filterCssClasses(classes) {
      //remove all the `ng-` stuff
      return classes.replace(/\bng-\S+\b/g, '');
    }

    function getUniqueValues(a, b) {
      if (isString(a)) a = a.split(' ');
      if (isString(b)) b = b.split(' ');
      return a.filter(function(val) {
        return b.indexOf(val) === -1;
      }).join(' ');
    }

    function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
      var clone = jqLite(getDomNode(outAnchor).cloneNode(true));
      var startingClasses = filterCssClasses(getClassVal(clone));

      outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
      inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);

      clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);

      rootBodyElement.append(clone);

      var animatorIn, animatorOut = prepareOutAnimation();

      // the user may not end up using the `out` animation and
      // only making use of the `in` animation or vice-versa.
      // In either case we should allow this and not assume the
      // animation is over unless both animations are not used.
      if (!animatorOut) {
        animatorIn = prepareInAnimation();
        if (!animatorIn) {
          return end();
        }
      }

      var startingAnimator = animatorOut || animatorIn;

      return {
        start: function() {
          var runner;

          var currentAnimation = startingAnimator.start();
          currentAnimation.done(function() {
            currentAnimation = null;
            if (!animatorIn) {
              animatorIn = prepareInAnimation();
              if (animatorIn) {
                currentAnimation = animatorIn.start();
                currentAnimation.done(function() {
                  currentAnimation = null;
                  end();
                  runner.complete();
                });
                return currentAnimation;
              }
            }
            // in the event that there is no `in` animation
            end();
            runner.complete();
          });

          runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn
          });

          return runner;

          function endFn() {
            if (currentAnimation) {
              currentAnimation.end();
            }
          }
        }
      };

      function calculateAnchorStyles(anchor) {
        var styles = {};

        var coords = getDomNode(anchor).getBoundingClientRect();

        // we iterate directly since safari messes up and doesn't return
        // all the keys for the coords object when iterated
        forEach(['width','height','top','left'], function(key) {
          var value = coords[key];
          switch (key) {
            case 'top':
              value += bodyNode.scrollTop;
              break;
            case 'left':
              value += bodyNode.scrollLeft;
              break;
          }
          styles[key] = Math.floor(value) + 'px';
        });
        return styles;
      }

      function prepareOutAnimation() {
        var animator = $animateCss(clone, {
          addClass: NG_OUT_ANCHOR_CLASS_NAME,
          delay: true,
          from: calculateAnchorStyles(outAnchor)
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function getClassVal(element) {
        return element.attr('class') || '';
      }

      function prepareInAnimation() {
        var endingClasses = filterCssClasses(getClassVal(inAnchor));
        var toAdd = getUniqueValues(endingClasses, startingClasses);
        var toRemove = getUniqueValues(startingClasses, endingClasses);

        var animator = $animateCss(clone, {
          to: calculateAnchorStyles(inAnchor),
          addClass: NG_IN_ANCHOR_CLASS_NAME + ' ' + toAdd,
          removeClass: NG_OUT_ANCHOR_CLASS_NAME + ' ' + toRemove,
          delay: true
        });

        // read the comment within `prepareRegularAnimation` to understand
        // why this check is necessary
        return animator.$$willAnimate ? animator : null;
      }

      function end() {
        clone.remove();
        outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
        inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
      }
    }

    function prepareFromToAnchorAnimation(from, to, classes, anchors) {
      var fromAnimation = prepareRegularAnimation(from, noop);
      var toAnimation = prepareRegularAnimation(to, noop);

      var anchorAnimations = [];
      forEach(anchors, function(anchor) {
        var outElement = anchor['out'];
        var inElement = anchor['in'];
        var animator = prepareAnchoredAnimation(classes, outElement, inElement);
        if (animator) {
          anchorAnimations.push(animator);
        }
      });

      // no point in doing anything when there are no elements to animate
      if (!fromAnimation && !toAnimation && anchorAnimations.length === 0) return;

      return {
        start: function() {
          var animationRunners = [];

          if (fromAnimation) {
            animationRunners.push(fromAnimation.start());
          }

          if (toAnimation) {
            animationRunners.push(toAnimation.start());
          }

          forEach(anchorAnimations, function(animation) {
            animationRunners.push(animation.start());
          });

          var runner = new $$AnimateRunner({
            end: endFn,
            cancel: endFn // CSS-driven animations cannot be cancelled, only ended
          });

          $$AnimateRunner.all(animationRunners, function(status) {
            runner.complete(status);
          });

          return runner;

          function endFn() {
            forEach(animationRunners, function(runner) {
              runner.end();
            });
          }
        }
      };
    }

    function prepareRegularAnimation(animationDetails) {
      var element = animationDetails.element;
      var options = animationDetails.options || {};

      if (animationDetails.structural) {
        options.event = animationDetails.event;
        options.structural = true;
        options.applyClassesEarly = true;

        // we special case the leave animation since we want to ensure that
        // the element is removed as soon as the animation is over. Otherwise
        // a flicker might appear or the element may not be removed at all
        if (animationDetails.event === 'leave') {
          options.onDone = options.domOperation;
        }
      }

      // We assign the preparationClasses as the actual animation event since
      // the internals of $animateCss will just suffix the event token values
      // with `-active` to trigger the animation.
      if (options.preparationClasses) {
        options.event = concatWithSpace(options.event, options.preparationClasses);
      }

      var animator = $animateCss(element, options);

      // the driver lookup code inside of $$animation attempts to spawn a
      // driver one by one until a driver returns a.$$willAnimate animator object.
      // $animateCss will always return an object, however, it will pass in
      // a flag as a hint as to whether an animation was detected or not
      return animator.$$willAnimate ? animator : null;
    }
  }];
}];

// TODO(matsko): use caching here to speed things up for detection
// TODO(matsko): add documentation
//  by the time...

var $$AnimateJsProvider = ['$animateProvider', function($animateProvider) {
  this.$get = ['$injector', '$$AnimateRunner', '$$jqLite',
       function($injector,   $$AnimateRunner,   $$jqLite) {

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
         // $animateJs(element, 'enter');
    return function(element, event, classes, options) {
      var animationClosed = false;

      // the `classes` argument is optional and if it is not used
      // then the classes will be resolved from the element's className
      // property as well as options.addClass/options.removeClass.
      if (arguments.length === 3 && isObject(classes)) {
        options = classes;
        classes = null;
      }

      options = prepareAnimationOptions(options);
      if (!classes) {
        classes = element.attr('class') || '';
        if (options.addClass) {
          classes += ' ' + options.addClass;
        }
        if (options.removeClass) {
          classes += ' ' + options.removeClass;
        }
      }

      var classesToAdd = options.addClass;
      var classesToRemove = options.removeClass;

      // the lookupAnimations function returns a series of animation objects that are
      // matched up with one or more of the CSS classes. These animation objects are
      // defined via the module.animation factory function. If nothing is detected then
      // we don't return anything which then makes $animation query the next driver.
      var animations = lookupAnimations(classes);
      var before, after;
      if (animations.length) {
        var afterFn, beforeFn;
        if (event == 'leave') {
          beforeFn = 'leave';
          afterFn = 'afterLeave'; // TODO(matsko): get rid of this
        } else {
          beforeFn = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
          afterFn = event;
        }

        if (event !== 'enter' && event !== 'move') {
          before = packageAnimations(element, event, options, animations, beforeFn);
        }
        after  = packageAnimations(element, event, options, animations, afterFn);
      }

      // no matching animations
      if (!before && !after) return;

      function applyOptions() {
        options.domOperation();
        applyAnimationClasses(element, options);
      }

      function close() {
        animationClosed = true;
        applyOptions();
        applyAnimationStyles(element, options);
      }

      var runner;

      return {
        $$willAnimate: true,
        end: function() {
          if (runner) {
            runner.end();
          } else {
            close();
            runner = new $$AnimateRunner();
            runner.complete(true);
          }
          return runner;
        },
        start: function() {
          if (runner) {
            return runner;
          }

          runner = new $$AnimateRunner();
          var closeActiveAnimations;
          var chain = [];

          if (before) {
            chain.push(function(fn) {
              closeActiveAnimations = before(fn);
            });
          }

          if (chain.length) {
            chain.push(function(fn) {
              applyOptions();
              fn(true);
            });
          } else {
            applyOptions();
          }

          if (after) {
            chain.push(function(fn) {
              closeActiveAnimations = after(fn);
            });
          }

          runner.setHost({
            end: function() {
              endAnimations();
            },
            cancel: function() {
              endAnimations(true);
            }
          });

          $$AnimateRunner.chain(chain, onComplete);
          return runner;

          function onComplete(success) {
            close(success);
            runner.complete(success);
          }

          function endAnimations(cancelled) {
            if (!animationClosed) {
              (closeActiveAnimations || noop)(cancelled);
              onComplete(cancelled);
            }
          }
        }
      };

      function executeAnimationFn(fn, element, event, options, onDone) {
        var args;
        switch (event) {
          case 'animate':
            args = [element, options.from, options.to, onDone];
            break;

          case 'setClass':
            args = [element, classesToAdd, classesToRemove, onDone];
            break;

          case 'addClass':
            args = [element, classesToAdd, onDone];
            break;

          case 'removeClass':
            args = [element, classesToRemove, onDone];
            break;

          default:
            args = [element, onDone];
            break;
        }

        args.push(options);

        var value = fn.apply(fn, args);
        if (value) {
          if (isFunction(value.start)) {
            value = value.start();
          }

          if (value instanceof $$AnimateRunner) {
            value.done(onDone);
          } else if (isFunction(value)) {
            // optional onEnd / onCancel callback
            return value;
          }
        }

        return noop;
      }

      function groupEventedAnimations(element, event, options, animations, fnName) {
        var operations = [];
        forEach(animations, function(ani) {
          var animation = ani[fnName];
          if (!animation) return;

          // note that all of these animations will run in parallel
          operations.push(function() {
            var runner;
            var endProgressCb;

            var resolved = false;
            var onAnimationComplete = function(rejected) {
              if (!resolved) {
                resolved = true;
                (endProgressCb || noop)(rejected);
                runner.complete(!rejected);
              }
            };

            runner = new $$AnimateRunner({
              end: function() {
                onAnimationComplete();
              },
              cancel: function() {
                onAnimationComplete(true);
              }
            });

            endProgressCb = executeAnimationFn(animation, element, event, options, function(result) {
              var cancelled = result === false;
              onAnimationComplete(cancelled);
            });

            return runner;
          });
        });

        return operations;
      }

      function packageAnimations(element, event, options, animations, fnName) {
        var operations = groupEventedAnimations(element, event, options, animations, fnName);
        if (operations.length === 0) {
          var a,b;
          if (fnName === 'beforeSetClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'beforeRemoveClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'beforeAddClass');
          } else if (fnName === 'setClass') {
            a = groupEventedAnimations(element, 'removeClass', options, animations, 'removeClass');
            b = groupEventedAnimations(element, 'addClass', options, animations, 'addClass');
          }

          if (a) {
            operations = operations.concat(a);
          }
          if (b) {
            operations = operations.concat(b);
          }
        }

        if (operations.length === 0) return;

        // TODO(matsko): add documentation
        return function startAnimation(callback) {
          var runners = [];
          if (operations.length) {
            forEach(operations, function(animateFn) {
              runners.push(animateFn());
            });
          }

          runners.length ? $$AnimateRunner.all(runners, callback) : callback();

          return function endFn(reject) {
            forEach(runners, function(runner) {
              reject ? runner.cancel() : runner.end();
            });
          };
        };
      }
    };

    function lookupAnimations(classes) {
      classes = isArray(classes) ? classes : classes.split(' ');
      var matches = [], flagMap = {};
      for (var i=0; i < classes.length; i++) {
        var klass = classes[i],
            animationFactory = $animateProvider.$$registeredAnimations[klass];
        if (animationFactory && !flagMap[klass]) {
          matches.push($injector.get(animationFactory));
          flagMap[klass] = true;
        }
      }
      return matches;
    }
  }];
}];

var $$AnimateJsDriverProvider = ['$$animationProvider', function($$animationProvider) {
  $$animationProvider.drivers.push('$$animateJsDriver');
  this.$get = ['$$animateJs', '$$AnimateRunner', function($$animateJs, $$AnimateRunner) {
    return function initDriverFn(animationDetails) {
      if (animationDetails.from && animationDetails.to) {
        var fromAnimation = prepareAnimation(animationDetails.from);
        var toAnimation = prepareAnimation(animationDetails.to);
        if (!fromAnimation && !toAnimation) return;

        return {
          start: function() {
            var animationRunners = [];

            if (fromAnimation) {
              animationRunners.push(fromAnimation.start());
            }

            if (toAnimation) {
              animationRunners.push(toAnimation.start());
            }

            $$AnimateRunner.all(animationRunners, done);

            var runner = new $$AnimateRunner({
              end: endFnFactory(),
              cancel: endFnFactory()
            });

            return runner;

            function endFnFactory() {
              return function() {
                forEach(animationRunners, function(runner) {
                  // at this point we cannot cancel animations for groups just yet. 1.5+
                  runner.end();
                });
              };
            }

            function done(status) {
              runner.complete(status);
            }
          }
        };
      } else {
        return prepareAnimation(animationDetails);
      }
    };

    function prepareAnimation(animationDetails) {
      // TODO(matsko): make sure to check for grouped animations and delegate down to normal animations
      var element = animationDetails.element;
      var event = animationDetails.event;
      var options = animationDetails.options;
      var classes = animationDetails.classes;
      return $$animateJs(element, event, classes, options);
    }
  }];
}];

var NG_ANIMATE_ATTR_NAME = 'data-ng-animate';
var NG_ANIMATE_PIN_DATA = '$ngAnimatePin';
var $$AnimateQueueProvider = ['$animateProvider', function($animateProvider) {
  var PRE_DIGEST_STATE = 1;
  var RUNNING_STATE = 2;
  var ONE_SPACE = ' ';

  var rules = this.rules = {
    skip: [],
    cancel: [],
    join: []
  };

  function makeTruthyCssClassMap(classString) {
    if (!classString) {
      return null;
    }

    var keys = classString.split(ONE_SPACE);
    var map = Object.create(null);

    forEach(keys, function(key) {
      map[key] = true;
    });
    return map;
  }

  function hasMatchingClasses(newClassString, currentClassString) {
    if (newClassString && currentClassString) {
      var currentClassMap = makeTruthyCssClassMap(currentClassString);
      return newClassString.split(ONE_SPACE).some(function(className) {
        return currentClassMap[className];
      });
    }
  }

  function isAllowed(ruleType, element, currentAnimation, previousAnimation) {
    return rules[ruleType].some(function(fn) {
      return fn(element, currentAnimation, previousAnimation);
    });
  }

  function hasAnimationClasses(animation, and) {
    var a = (animation.addClass || '').length > 0;
    var b = (animation.removeClass || '').length > 0;
    return and ? a && b : a || b;
  }

  rules.join.push(function(element, newAnimation, currentAnimation) {
    // if the new animation is class-based then we can just tack that on
    return !newAnimation.structural && hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // there is no need to animate anything if no classes are being added and
    // there is no structural animation that will be triggered
    return !newAnimation.structural && !hasAnimationClasses(newAnimation);
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // why should we trigger a new structural animation if the element will
    // be removed from the DOM anyway?
    return currentAnimation.event == 'leave' && newAnimation.structural;
  });

  rules.skip.push(function(element, newAnimation, currentAnimation) {
    // if there is an ongoing current animation then don't even bother running the class-based animation
    return currentAnimation.structural && currentAnimation.state === RUNNING_STATE && !newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // there can never be two structural animations running at the same time
    return currentAnimation.structural && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // if the previous animation is already running, but the new animation will
    // be triggered, but the new animation is structural
    return currentAnimation.state === RUNNING_STATE && newAnimation.structural;
  });

  rules.cancel.push(function(element, newAnimation, currentAnimation) {
    // cancel the animation if classes added / removed in both animation cancel each other out,
    // but only if the current animation isn't structural

    if (currentAnimation.structural) return false;

    var nA = newAnimation.addClass;
    var nR = newAnimation.removeClass;
    var cA = currentAnimation.addClass;
    var cR = currentAnimation.removeClass;

    // early detection to save the global CPU shortage :)
    if ((isUndefined(nA) && isUndefined(nR)) || (isUndefined(cA) && isUndefined(cR))) {
      return false;
    }

    return hasMatchingClasses(nA, cR) || hasMatchingClasses(nR, cA);
  });

  this.$get = ['$$rAF', '$rootScope', '$rootElement', '$document', '$$HashMap',
               '$$animation', '$$AnimateRunner', '$templateRequest', '$$jqLite', '$$forceReflow',
       function($$rAF,   $rootScope,   $rootElement,   $document,   $$HashMap,
                $$animation,   $$AnimateRunner,   $templateRequest,   $$jqLite,   $$forceReflow) {

    var activeAnimationsLookup = new $$HashMap();
    var disabledElementsLookup = new $$HashMap();
    var animationsEnabled = null;

    function postDigestTaskFactory() {
      var postDigestCalled = false;
      return function(fn) {
        // we only issue a call to postDigest before
        // it has first passed. This prevents any callbacks
        // from not firing once the animation has completed
        // since it will be out of the digest cycle.
        if (postDigestCalled) {
          fn();
        } else {
          $rootScope.$$postDigest(function() {
            postDigestCalled = true;
            fn();
          });
        }
      };
    }

    // Wait until all directive and route-related templates are downloaded and
    // compiled. The $templateRequest.totalPendingRequests variable keeps track of
    // all of the remote templates being currently downloaded. If there are no
    // templates currently downloading then the watcher will still fire anyway.
    var deregisterWatch = $rootScope.$watch(
      function() { return $templateRequest.totalPendingRequests === 0; },
      function(isEmpty) {
        if (!isEmpty) return;
        deregisterWatch();

        // Now that all templates have been downloaded, $animate will wait until
        // the post digest queue is empty before enabling animations. By having two
        // calls to $postDigest calls we can ensure that the flag is enabled at the
        // very end of the post digest queue. Since all of the animations in $animate
        // use $postDigest, it's important that the code below executes at the end.
        // This basically means that the page is fully downloaded and compiled before
        // any animations are triggered.
        $rootScope.$$postDigest(function() {
          $rootScope.$$postDigest(function() {
            // we check for null directly in the event that the application already called
            // .enabled() with whatever arguments that it provided it with
            if (animationsEnabled === null) {
              animationsEnabled = true;
            }
          });
        });
      }
    );

    var callbackRegistry = Object.create(null);

    // remember that the classNameFilter is set during the provider/config
    // stage therefore we can optimize here and setup a helper function
    var classNameFilter = $animateProvider.classNameFilter();
    var isAnimatableClassName = !classNameFilter
              ? function() { return true; }
              : function(className) {
                return classNameFilter.test(className);
              };

    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function normalizeAnimationDetails(element, animation) {
      return mergeAnimationDetails(element, animation, {});
    }

    // IE9-11 has no method "contains" in SVG element and in Node.prototype. Bug #10259.
    var contains = window.Node.prototype.contains || function(arg) {
      // jshint bitwise: false
      return this === arg || !!(this.compareDocumentPosition(arg) & 16);
      // jshint bitwise: true
    };

    function findCallbacks(parent, element, event) {
      var targetNode = getDomNode(element);
      var targetParentNode = getDomNode(parent);

      var matches = [];
      var entries = callbackRegistry[event];
      if (entries) {
        forEach(entries, function(entry) {
          if (contains.call(entry.node, targetNode)) {
            matches.push(entry.callback);
          } else if (event === 'leave' && contains.call(entry.node, targetParentNode)) {
            matches.push(entry.callback);
          }
        });
      }

      return matches;
    }

    function filterFromRegistry(list, matchContainer, matchCallback) {
      var containerNode = extractElementNode(matchContainer);
      return list.filter(function(entry) {
        var isMatch = entry.node === containerNode &&
                        (!matchCallback || entry.callback === matchCallback);
        return !isMatch;
      });
    }

    function cleanupEventListeners(phase, element) {
      if (phase === 'close' && !element[0].parentNode) {
        // If the element is not attached to a parentNode, it has been removed by
        // the domOperation, and we can safely remove the event callbacks
        $animate.off(element);
      }
    }

    var $animate = {
      on: function(event, container, callback) {
        var node = extractElementNode(container);
        callbackRegistry[event] = callbackRegistry[event] || [];
        callbackRegistry[event].push({
          node: node,
          callback: callback
        });

        // Remove the callback when the element is removed from the DOM
        jqLite(container).on('$destroy', function() {
          var animationDetails = activeAnimationsLookup.get(node);

          if (!animationDetails) {
            // If there's an animation ongoing, the callback calling code will remove
            // the event listeners. If we'd remove here, the callbacks would be removed
            // before the animation ends
            $animate.off(event, container, callback);
          }
        });
      },

      off: function(event, container, callback) {
        if (arguments.length === 1 && !isString(arguments[0])) {
          container = arguments[0];
          for (var eventType in callbackRegistry) {
            callbackRegistry[eventType] = filterFromRegistry(callbackRegistry[eventType], container);
          }

          return;
        }

        var entries = callbackRegistry[event];
        if (!entries) return;

        callbackRegistry[event] = arguments.length === 1
            ? null
            : filterFromRegistry(entries, container, callback);
      },

      pin: function(element, parentElement) {
        assertArg(isElement(element), 'element', 'not an element');
        assertArg(isElement(parentElement), 'parentElement', 'not an element');
        element.data(NG_ANIMATE_PIN_DATA, parentElement);
      },

      push: function(element, event, options, domOperation) {
        options = options || {};
        options.domOperation = domOperation;
        return queueAnimation(element, event, options);
      },

      // this method has four signatures:
      //  () - global getter
      //  (bool) - global setter
      //  (element) - element getter
      //  (element, bool) - element setter<F37>
      enabled: function(element, bool) {
        var argCount = arguments.length;

        if (argCount === 0) {
          // () - Global getter
          bool = !!animationsEnabled;
        } else {
          var hasElement = isElement(element);

          if (!hasElement) {
            // (bool) - Global setter
            bool = animationsEnabled = !!element;
          } else {
            var node = getDomNode(element);

            if (argCount === 1) {
              // (element) - Element getter
              bool = !disabledElementsLookup.get(node);
            } else {
              // (element, bool) - Element setter
              disabledElementsLookup.put(node, !bool);
            }
          }
        }

        return bool;
      }
    };

    return $animate;

    function queueAnimation(element, event, initialOptions) {
      // we always make a copy of the options since
      // there should never be any side effects on
      // the input data when running `$animateCss`.
      var options = copy(initialOptions);

      var node, parent;
      element = stripCommentsFromElement(element);
      if (element) {
        node = getDomNode(element);
        parent = element.parent();
      }

      options = prepareAnimationOptions(options);

      // we create a fake runner with a working promise.
      // These methods will become available after the digest has passed
      var runner = new $$AnimateRunner();

      // this is used to trigger callbacks in postDigest mode
      var runInNextPostDigestOrNow = postDigestTaskFactory();

      if (isArray(options.addClass)) {
        options.addClass = options.addClass.join(' ');
      }

      if (options.addClass && !isString(options.addClass)) {
        options.addClass = null;
      }

      if (isArray(options.removeClass)) {
        options.removeClass = options.removeClass.join(' ');
      }

      if (options.removeClass && !isString(options.removeClass)) {
        options.removeClass = null;
      }

      if (options.from && !isObject(options.from)) {
        options.from = null;
      }

      if (options.to && !isObject(options.to)) {
        options.to = null;
      }

      // there are situations where a directive issues an animation for
      // a jqLite wrapper that contains only comment nodes... If this
      // happens then there is no way we can perform an animation
      if (!node) {
        close();
        return runner;
      }

      var className = [node.className, options.addClass, options.removeClass].join(' ');
      if (!isAnimatableClassName(className)) {
        close();
        return runner;
      }

      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      var documentHidden = $document[0].hidden;

      // this is a hard disable of all animations for the application or on
      // the element itself, therefore  there is no need to continue further
      // past this point if not enabled
      // Animations are also disabled if the document is currently hidden (page is not visible
      // to the user), because browsers slow down or do not flush calls to requestAnimationFrame
      var skipAnimations = !animationsEnabled || documentHidden || disabledElementsLookup.get(node);
      var existingAnimation = (!skipAnimations && activeAnimationsLookup.get(node)) || {};
      var hasExistingAnimation = !!existingAnimation.state;

      // there is no point in traversing the same collection of parent ancestors if a followup
      // animation will be run on the same element that already did all that checking work
      if (!skipAnimations && (!hasExistingAnimation || existingAnimation.state != PRE_DIGEST_STATE)) {
        skipAnimations = !areAnimationsAllowed(element, parent, event);
      }

      if (skipAnimations) {
        // Callbacks should fire even if the document is hidden (regression fix for issue #14120)
        if (documentHidden) notifyProgress(runner, event, 'start');
        close();
        if (documentHidden) notifyProgress(runner, event, 'close');
        return runner;
      }

      if (isStructural) {
        closeChildAnimations(element);
      }

      var newAnimation = {
        structural: isStructural,
        element: element,
        event: event,
        addClass: options.addClass,
        removeClass: options.removeClass,
        close: close,
        options: options,
        runner: runner
      };

      if (hasExistingAnimation) {
        var skipAnimationFlag = isAllowed('skip', element, newAnimation, existingAnimation);
        if (skipAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            close();
            return runner;
          } else {
            mergeAnimationDetails(element, existingAnimation, newAnimation);
            return existingAnimation.runner;
          }
        }
        var cancelAnimationFlag = isAllowed('cancel', element, newAnimation, existingAnimation);
        if (cancelAnimationFlag) {
          if (existingAnimation.state === RUNNING_STATE) {
            // this will end the animation right away and it is safe
            // to do so since the animation is already running and the
            // runner callback code will run in async
            existingAnimation.runner.end();
          } else if (existingAnimation.structural) {
            // this means that the animation is queued into a digest, but
            // hasn't started yet. Therefore it is safe to run the close
            // method which will call the runner methods in async.
            existingAnimation.close();
          } else {
            // this will merge the new animation options into existing animation options
            mergeAnimationDetails(element, existingAnimation, newAnimation);

            return existingAnimation.runner;
          }
        } else {
          // a joined animation means that this animation will take over the existing one
          // so an example would involve a leave animation taking over an enter. Then when
          // the postDigest kicks in the enter will be ignored.
          var joinAnimationFlag = isAllowed('join', element, newAnimation, existingAnimation);
          if (joinAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              normalizeAnimationDetails(element, newAnimation);
            } else {
              applyGeneratedPreparationClasses(element, isStructural ? event : null, options);

              event = newAnimation.event = existingAnimation.event;
              options = mergeAnimationDetails(element, existingAnimation, newAnimation);

              //we return the same runner since only the option values of this animation will
              //be fed into the `existingAnimation`.
              return existingAnimation.runner;
            }
          }
        }
      } else {
        // normalization in this case means that it removes redundant CSS classes that
        // already exist (addClass) or do not exist (removeClass) on the element
        normalizeAnimationDetails(element, newAnimation);
      }

      // when the options are merged and cleaned up we may end up not having to do
      // an animation at all, therefore we should check this before issuing a post
      // digest callback. Structural animations will always run no matter what.
      var isValidAnimation = newAnimation.structural;
      if (!isValidAnimation) {
        // animate (from/to) can be quickly checked first, otherwise we check if any classes are present
        isValidAnimation = (newAnimation.event === 'animate' && Object.keys(newAnimation.options.to || {}).length > 0)
                            || hasAnimationClasses(newAnimation);
      }

      if (!isValidAnimation) {
        close();
        clearElementAnimationState(element);
        return runner;
      }

      // the counter keeps track of cancelled animations
      var counter = (existingAnimation.counter || 0) + 1;
      newAnimation.counter = counter;

      markElementAnimationState(element, PRE_DIGEST_STATE, newAnimation);

      $rootScope.$$postDigest(function() {
        var animationDetails = activeAnimationsLookup.get(node);
        var animationCancelled = !animationDetails;
        animationDetails = animationDetails || {};

        // if addClass/removeClass is called before something like enter then the
        // registered parent element may not be present. The code below will ensure
        // that a final value for parent element is obtained
        var parentElement = element.parent() || [];

        // animate/structural/class-based animations all have requirements. Otherwise there
        // is no point in performing an animation. The parent node must also be set.
        var isValidAnimation = parentElement.length > 0
                                && (animationDetails.event === 'animate'
                                    || animationDetails.structural
                                    || hasAnimationClasses(animationDetails));

        // this means that the previous animation was cancelled
        // even if the follow-up animation is the same event
        if (animationCancelled || animationDetails.counter !== counter || !isValidAnimation) {
          // if another animation did not take over then we need
          // to make sure that the domOperation and options are
          // handled accordingly
          if (animationCancelled) {
            applyAnimationClasses(element, options);
            applyAnimationStyles(element, options);
          }

          // if the event changed from something like enter to leave then we do
          // it, otherwise if it's the same then the end result will be the same too
          if (animationCancelled || (isStructural && animationDetails.event !== event)) {
            options.domOperation();
            runner.end();
          }

          // in the event that the element animation was not cancelled or a follow-up animation
          // isn't allowed to animate from here then we need to clear the state of the element
          // so that any future animations won't read the expired animation data.
          if (!isValidAnimation) {
            clearElementAnimationState(element);
          }

          return;
        }

        // this combined multiple class to addClass / removeClass into a setClass event
        // so long as a structural event did not take over the animation
        event = !animationDetails.structural && hasAnimationClasses(animationDetails, true)
            ? 'setClass'
            : animationDetails.event;

        markElementAnimationState(element, RUNNING_STATE);
        var realRunner = $$animation(element, event, animationDetails.options);

        // this will update the runner's flow-control events based on
        // the `realRunner` object.
        runner.setHost(realRunner);
        notifyProgress(runner, event, 'start', {});

        realRunner.done(function(status) {
          close(!status);
          var animationDetails = activeAnimationsLookup.get(node);
          if (animationDetails && animationDetails.counter === counter) {
            clearElementAnimationState(getDomNode(element));
          }
          notifyProgress(runner, event, 'close', {});
        });
      });

      return runner;

      function notifyProgress(runner, event, phase, data) {
        runInNextPostDigestOrNow(function() {
          var callbacks = findCallbacks(parent, element, event);
          if (callbacks.length) {
            // do not optimize this call here to RAF because
            // we don't know how heavy the callback code here will
            // be and if this code is buffered then this can
            // lead to a performance regression.
            $$rAF(function() {
              forEach(callbacks, function(callback) {
                callback(element, phase, data);
              });
              cleanupEventListeners(phase, element);
            });
          } else {
            cleanupEventListeners(phase, element);
          }
        });
        runner.progress(event, phase, data);
      }

      function close(reject) { // jshint ignore:line
        clearGeneratedClasses(element, options);
        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();
        runner.complete(!reject);
      }
    }

    function closeChildAnimations(element) {
      var node = getDomNode(element);
      var children = node.querySelectorAll('[' + NG_ANIMATE_ATTR_NAME + ']');
      forEach(children, function(child) {
        var state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME));
        var animationDetails = activeAnimationsLookup.get(child);
        if (animationDetails) {
          switch (state) {
            case RUNNING_STATE:
              animationDetails.runner.end();
              /* falls through */
            case PRE_DIGEST_STATE:
              activeAnimationsLookup.remove(child);
              break;
          }
        }
      });
    }

    function clearElementAnimationState(element) {
      var node = getDomNode(element);
      node.removeAttribute(NG_ANIMATE_ATTR_NAME);
      activeAnimationsLookup.remove(node);
    }

    function isMatchingElement(nodeOrElmA, nodeOrElmB) {
      return getDomNode(nodeOrElmA) === getDomNode(nodeOrElmB);
    }

    /**
     * This fn returns false if any of the following is true:
     * a) animations on any parent element are disabled, and animations on the element aren't explicitly allowed
     * b) a parent element has an ongoing structural animation, and animateChildren is false
     * c) the element is not a child of the body
     * d) the element is not a child of the $rootElement
     */
    function areAnimationsAllowed(element, parentElement, event) {
      var bodyElement = jqLite($document[0].body);
      var bodyElementDetected = isMatchingElement(element, bodyElement) || element[0].nodeName === 'HTML';
      var rootElementDetected = isMatchingElement(element, $rootElement);
      var parentAnimationDetected = false;
      var animateChildren;
      var elementDisabled = disabledElementsLookup.get(getDomNode(element));

      var parentHost = jqLite.data(element[0], NG_ANIMATE_PIN_DATA);
      if (parentHost) {
        parentElement = parentHost;
      }

      parentElement = getDomNode(parentElement);

      while (parentElement) {
        if (!rootElementDetected) {
          // angular doesn't want to attempt to animate elements outside of the application
          // therefore we need to ensure that the rootElement is an ancestor of the current element
          rootElementDetected = isMatchingElement(parentElement, $rootElement);
        }

        if (parentElement.nodeType !== ELEMENT_NODE) {
          // no point in inspecting the #document element
          break;
        }

        var details = activeAnimationsLookup.get(parentElement) || {};
        // either an enter, leave or move animation will commence
        // therefore we can't allow any animations to take place
        // but if a parent animation is class-based then that's ok
        if (!parentAnimationDetected) {
          var parentElementDisabled = disabledElementsLookup.get(parentElement);

          if (parentElementDisabled === true && elementDisabled !== false) {
            // disable animations if the user hasn't explicitly enabled animations on the
            // current element
            elementDisabled = true;
            // element is disabled via parent element, no need to check anything else
            break;
          } else if (parentElementDisabled === false) {
            elementDisabled = false;
          }
          parentAnimationDetected = details.structural;
        }

        if (isUndefined(animateChildren) || animateChildren === true) {
          var value = jqLite.data(parentElement, NG_ANIMATE_CHILDREN_DATA);
          if (isDefined(value)) {
            animateChildren = value;
          }
        }

        // there is no need to continue traversing at this point
        if (parentAnimationDetected && animateChildren === false) break;

        if (!bodyElementDetected) {
          // we also need to ensure that the element is or will be a part of the body element
          // otherwise it is pointless to even issue an animation to be rendered
          bodyElementDetected = isMatchingElement(parentElement, bodyElement);
        }

        if (bodyElementDetected && rootElementDetected) {
          // If both body and root have been found, any other checks are pointless,
          // as no animation data should live outside the application
          break;
        }

        if (!rootElementDetected) {
          // If no rootElement is detected, check if the parentElement is pinned to another element
          parentHost = jqLite.data(parentElement, NG_ANIMATE_PIN_DATA);
          if (parentHost) {
            // The pin target element becomes the next parent element
            parentElement = getDomNode(parentHost);
            continue;
          }
        }

        parentElement = parentElement.parentNode;
      }

      var allowAnimation = (!parentAnimationDetected || animateChildren) && elementDisabled !== true;
      return allowAnimation && rootElementDetected && bodyElementDetected;
    }

    function markElementAnimationState(element, state, details) {
      details = details || {};
      details.state = state;

      var node = getDomNode(element);
      node.setAttribute(NG_ANIMATE_ATTR_NAME, state);

      var oldValue = activeAnimationsLookup.get(node);
      var newValue = oldValue
          ? extend(oldValue, details)
          : details;
      activeAnimationsLookup.put(node, newValue);
    }
  }];
}];

var $$AnimationProvider = ['$animateProvider', function($animateProvider) {
  var NG_ANIMATE_REF_ATTR = 'ng-animate-ref';

  var drivers = this.drivers = [];

  var RUNNER_STORAGE_KEY = '$$animationRunner';

  function setRunner(element, runner) {
    element.data(RUNNER_STORAGE_KEY, runner);
  }

  function removeRunner(element) {
    element.removeData(RUNNER_STORAGE_KEY);
  }

  function getRunner(element) {
    return element.data(RUNNER_STORAGE_KEY);
  }

  this.$get = ['$$jqLite', '$rootScope', '$injector', '$$AnimateRunner', '$$HashMap', '$$rAFScheduler',
       function($$jqLite,   $rootScope,   $injector,   $$AnimateRunner,   $$HashMap,   $$rAFScheduler) {

    var animationQueue = [];
    var applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

    function sortAnimations(animations) {
      var tree = { children: [] };
      var i, lookup = new $$HashMap();

      // this is done first beforehand so that the hashmap
      // is filled with a list of the elements that will be animated
      for (i = 0; i < animations.length; i++) {
        var animation = animations[i];
        lookup.put(animation.domNode, animations[i] = {
          domNode: animation.domNode,
          fn: animation.fn,
          children: []
        });
      }

      for (i = 0; i < animations.length; i++) {
        processNode(animations[i]);
      }

      return flatten(tree);

      function processNode(entry) {
        if (entry.processed) return entry;
        entry.processed = true;

        var elementNode = entry.domNode;
        var parentNode = elementNode.parentNode;
        lookup.put(elementNode, entry);

        var parentEntry;
        while (parentNode) {
          parentEntry = lookup.get(parentNode);
          if (parentEntry) {
            if (!parentEntry.processed) {
              parentEntry = processNode(parentEntry);
            }
            break;
          }
          parentNode = parentNode.parentNode;
        }

        (parentEntry || tree).children.push(entry);
        return entry;
      }

      function flatten(tree) {
        var result = [];
        var queue = [];
        var i;

        for (i = 0; i < tree.children.length; i++) {
          queue.push(tree.children[i]);
        }

        var remainingLevelEntries = queue.length;
        var nextLevelEntries = 0;
        var row = [];

        for (i = 0; i < queue.length; i++) {
          var entry = queue[i];
          if (remainingLevelEntries <= 0) {
            remainingLevelEntries = nextLevelEntries;
            nextLevelEntries = 0;
            result.push(row);
            row = [];
          }
          row.push(entry.fn);
          entry.children.forEach(function(childEntry) {
            nextLevelEntries++;
            queue.push(childEntry);
          });
          remainingLevelEntries--;
        }

        if (row.length) {
          result.push(row);
        }

        return result;
      }
    }

    // TODO(matsko): document the signature in a better way
    return function(element, event, options) {
      options = prepareAnimationOptions(options);
      var isStructural = ['enter', 'move', 'leave'].indexOf(event) >= 0;

      // there is no animation at the current moment, however
      // these runner methods will get later updated with the
      // methods leading into the driver's end/cancel methods
      // for now they just stop the animation from starting
      var runner = new $$AnimateRunner({
        end: function() { close(); },
        cancel: function() { close(true); }
      });

      if (!drivers.length) {
        close();
        return runner;
      }

      setRunner(element, runner);

      var classes = mergeClasses(element.attr('class'), mergeClasses(options.addClass, options.removeClass));
      var tempClasses = options.tempClasses;
      if (tempClasses) {
        classes += ' ' + tempClasses;
        options.tempClasses = null;
      }

      var prepareClassName;
      if (isStructural) {
        prepareClassName = 'ng-' + event + PREPARE_CLASS_SUFFIX;
        $$jqLite.addClass(element, prepareClassName);
      }

      animationQueue.push({
        // this data is used by the postDigest code and passed into
        // the driver step function
        element: element,
        classes: classes,
        event: event,
        structural: isStructural,
        options: options,
        beforeStart: beforeStart,
        close: close
      });

      element.on('$destroy', handleDestroyedElement);

      // we only want there to be one function called within the post digest
      // block. This way we can group animations for all the animations that
      // were apart of the same postDigest flush call.
      if (animationQueue.length > 1) return runner;

      $rootScope.$$postDigest(function() {
        var animations = [];
        forEach(animationQueue, function(entry) {
          // the element was destroyed early on which removed the runner
          // form its storage. This means we can't animate this element
          // at all and it already has been closed due to destruction.
          if (getRunner(entry.element)) {
            animations.push(entry);
          } else {
            entry.close();
          }
        });

        // now any future animations will be in another postDigest
        animationQueue.length = 0;

        var groupedAnimations = groupAnimations(animations);
        var toBeSortedAnimations = [];

        forEach(groupedAnimations, function(animationEntry) {
          toBeSortedAnimations.push({
            domNode: getDomNode(animationEntry.from ? animationEntry.from.element : animationEntry.element),
            fn: function triggerAnimationStart() {
              // it's important that we apply the `ng-animate` CSS class and the
              // temporary classes before we do any driver invoking since these
              // CSS classes may be required for proper CSS detection.
              animationEntry.beforeStart();

              var startAnimationFn, closeFn = animationEntry.close;

              // in the event that the element was removed before the digest runs or
              // during the RAF sequencing then we should not trigger the animation.
              var targetElement = animationEntry.anchors
                  ? (animationEntry.from.element || animationEntry.to.element)
                  : animationEntry.element;

              if (getRunner(targetElement)) {
                var operation = invokeFirstDriver(animationEntry);
                if (operation) {
                  startAnimationFn = operation.start;
                }
              }

              if (!startAnimationFn) {
                closeFn();
              } else {
                var animationRunner = startAnimationFn();
                animationRunner.done(function(status) {
                  closeFn(!status);
                });
                updateAnimationRunners(animationEntry, animationRunner);
              }
            }
          });
        });

        // we need to sort each of the animations in order of parent to child
        // relationships. This ensures that the child classes are applied at the
        // right time.
        $$rAFScheduler(sortAnimations(toBeSortedAnimations));
      });

      return runner;

      // TODO(matsko): change to reference nodes
      function getAnchorNodes(node) {
        var SELECTOR = '[' + NG_ANIMATE_REF_ATTR + ']';
        var items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
              ? [node]
              : node.querySelectorAll(SELECTOR);
        var anchors = [];
        forEach(items, function(node) {
          var attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
          if (attr && attr.length) {
            anchors.push(node);
          }
        });
        return anchors;
      }

      function groupAnimations(animations) {
        var preparedAnimations = [];
        var refLookup = {};
        forEach(animations, function(animation, index) {
          var element = animation.element;
          var node = getDomNode(element);
          var event = animation.event;
          var enterOrMove = ['enter', 'move'].indexOf(event) >= 0;
          var anchorNodes = animation.structural ? getAnchorNodes(node) : [];

          if (anchorNodes.length) {
            var direction = enterOrMove ? 'to' : 'from';

            forEach(anchorNodes, function(anchor) {
              var key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
              refLookup[key] = refLookup[key] || {};
              refLookup[key][direction] = {
                animationID: index,
                element: jqLite(anchor)
              };
            });
          } else {
            preparedAnimations.push(animation);
          }
        });

        var usedIndicesLookup = {};
        var anchorGroups = {};
        forEach(refLookup, function(operations, key) {
          var from = operations.from;
          var to = operations.to;

          if (!from || !to) {
            // only one of these is set therefore we can't have an
            // anchor animation since all three pieces are required
            var index = from ? from.animationID : to.animationID;
            var indexKey = index.toString();
            if (!usedIndicesLookup[indexKey]) {
              usedIndicesLookup[indexKey] = true;
              preparedAnimations.push(animations[index]);
            }
            return;
          }

          var fromAnimation = animations[from.animationID];
          var toAnimation = animations[to.animationID];
          var lookupKey = from.animationID.toString();
          if (!anchorGroups[lookupKey]) {
            var group = anchorGroups[lookupKey] = {
              structural: true,
              beforeStart: function() {
                fromAnimation.beforeStart();
                toAnimation.beforeStart();
              },
              close: function() {
                fromAnimation.close();
                toAnimation.close();
              },
              classes: cssClassesIntersection(fromAnimation.classes, toAnimation.classes),
              from: fromAnimation,
              to: toAnimation,
              anchors: [] // TODO(matsko): change to reference nodes
            };

            // the anchor animations require that the from and to elements both have at least
            // one shared CSS class which effectively marries the two elements together to use
            // the same animation driver and to properly sequence the anchor animation.
            if (group.classes.length) {
              preparedAnimations.push(group);
            } else {
              preparedAnimations.push(fromAnimation);
              preparedAnimations.push(toAnimation);
            }
          }

          anchorGroups[lookupKey].anchors.push({
            'out': from.element, 'in': to.element
          });
        });

        return preparedAnimations;
      }

      function cssClassesIntersection(a,b) {
        a = a.split(' ');
        b = b.split(' ');
        var matches = [];

        for (var i = 0; i < a.length; i++) {
          var aa = a[i];
          if (aa.substring(0,3) === 'ng-') continue;

          for (var j = 0; j < b.length; j++) {
            if (aa === b[j]) {
              matches.push(aa);
              break;
            }
          }
        }

        return matches.join(' ');
      }

      function invokeFirstDriver(animationDetails) {
        // we loop in reverse order since the more general drivers (like CSS and JS)
        // may attempt more elements, but custom drivers are more particular
        for (var i = drivers.length - 1; i >= 0; i--) {
          var driverName = drivers[i];
          var factory = $injector.get(driverName);
          var driver = factory(animationDetails);
          if (driver) {
            return driver;
          }
        }
      }

      function beforeStart() {
        element.addClass(NG_ANIMATE_CLASSNAME);
        if (tempClasses) {
          $$jqLite.addClass(element, tempClasses);
        }
        if (prepareClassName) {
          $$jqLite.removeClass(element, prepareClassName);
          prepareClassName = null;
        }
      }

      function updateAnimationRunners(animation, newRunner) {
        if (animation.from && animation.to) {
          update(animation.from.element);
          update(animation.to.element);
        } else {
          update(animation.element);
        }

        function update(element) {
          var runner = getRunner(element);
          if (runner) runner.setHost(newRunner);
        }
      }

      function handleDestroyedElement() {
        var runner = getRunner(element);
        if (runner && (event !== 'leave' || !options.$$domOperationFired)) {
          runner.end();
        }
      }

      function close(rejected) { // jshint ignore:line
        element.off('$destroy', handleDestroyedElement);
        removeRunner(element);

        applyAnimationClasses(element, options);
        applyAnimationStyles(element, options);
        options.domOperation();

        if (tempClasses) {
          $$jqLite.removeClass(element, tempClasses);
        }

        element.removeClass(NG_ANIMATE_CLASSNAME);
        runner.complete(!rejected);
      }
    };
  }];
}];

/**
 * @ngdoc directive
 * @name ngAnimateSwap
 * @restrict A
 * @scope
 *
 * @description
 *
 * ngAnimateSwap is a animation-oriented directive that allows for the container to
 * be removed and entered in whenever the associated expression changes. A
 * common usecase for this directive is a rotating banner or slider component which
 * contains one image being present at a time. When the active image changes
 * then the old image will perform a `leave` animation and the new element
 * will be inserted via an `enter` animation.
 *
 * @animations
 * | Animation                        | Occurs                               |
 * |----------------------------------|--------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM  |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from the DOM |
 *
 * @example
 * <example name="ngAnimateSwap-directive" module="ngAnimateSwapExample"
 *          deps="angular-animate.js"
 *          animations="true" fixBase="true">
 *   <file name="index.html">
 *     <div class="container" ng-controller="AppCtrl">
 *       <div ng-animate-swap="number" class="cell swap-animation" ng-class="colorClass(number)">
 *         {{ number }}
 *       </div>
 *     </div>
 *   </file>
 *   <file name="script.js">
 *     angular.module('ngAnimateSwapExample', ['ngAnimate'])
 *       .controller('AppCtrl', ['$scope', '$interval', function($scope, $interval) {
 *         $scope.number = 0;
 *         $interval(function() {
 *           $scope.number++;
 *         }, 1000);
 *
 *         var colors = ['red','blue','green','yellow','orange'];
 *         $scope.colorClass = function(number) {
 *           return colors[number % colors.length];
 *         };
 *       }]);
 *   </file>
 *  <file name="animations.css">
 *  .container {
 *    height:250px;
 *    width:250px;
 *    position:relative;
 *    overflow:hidden;
 *    border:2px solid black;
 *  }
 *  .container .cell {
 *    font-size:150px;
 *    text-align:center;
 *    line-height:250px;
 *    position:absolute;
 *    top:0;
 *    left:0;
 *    right:0;
 *    border-bottom:2px solid black;
 *  }
 *  .swap-animation.ng-enter, .swap-animation.ng-leave {
 *    transition:0.5s linear all;
 *  }
 *  .swap-animation.ng-enter {
 *    top:-250px;
 *  }
 *  .swap-animation.ng-enter-active {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave {
 *    top:0px;
 *  }
 *  .swap-animation.ng-leave-active {
 *    top:250px;
 *  }
 *  .red { background:red; }
 *  .green { background:green; }
 *  .blue { background:blue; }
 *  .yellow { background:yellow; }
 *  .orange { background:orange; }
 *  </file>
 * </example>
 */
var ngAnimateSwapDirective = ['$animate', '$rootScope', function($animate, $rootScope) {
  return {
    restrict: 'A',
    transclude: 'element',
    terminal: true,
    priority: 600, // we use 600 here to ensure that the directive is caught before others
    link: function(scope, $element, attrs, ctrl, $transclude) {
      var previousElement, previousScope;
      scope.$watchCollection(attrs.ngAnimateSwap || attrs['for'], function(value) {
        if (previousElement) {
          $animate.leave(previousElement);
        }
        if (previousScope) {
          previousScope.$destroy();
          previousScope = null;
        }
        if (value || value === 0) {
          previousScope = scope.$new();
          $transclude(previousScope, function(element) {
            previousElement = element;
            $animate.enter(element, null, $element);
          });
        }
      });
    }
  };
}];

/**
 * @ngdoc module
 * @name ngAnimate
 * @description
 *
 * The `ngAnimate` module provides support for CSS-based animations (keyframes and transitions) as well as JavaScript-based animations via
 * callback hooks. Animations are not enabled by default, however, by including `ngAnimate` the animation hooks are enabled for an Angular app.
 *
 * <div doc-module-components="ngAnimate"></div>
 *
 * # Usage
 * Simply put, there are two ways to make use of animations when ngAnimate is used: by using **CSS** and **JavaScript**. The former works purely based
 * using CSS (by using matching CSS selectors/styles) and the latter triggers animations that are registered via `module.animation()`. For
 * both CSS and JS animations the sole requirement is to have a matching `CSS class` that exists both in the registered animation and within
 * the HTML element that the animation will be triggered on.
 *
 * ## Directive Support
 * The following directives are "animation aware":
 *
 * | Directive                                                                                                | Supported Animations                                                     |
 * |----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
 * | {@link ng.directive:ngRepeat#animations ngRepeat}                                                        | enter, leave and move                                                    |
 * | {@link ngRoute.directive:ngView#animations ngView}                                                       | enter and leave                                                          |
 * | {@link ng.directive:ngInclude#animations ngInclude}                                                      | enter and leave                                                          |
 * | {@link ng.directive:ngSwitch#animations ngSwitch}                                                        | enter and leave                                                          |
 * | {@link ng.directive:ngIf#animations ngIf}                                                                | enter and leave                                                          |
 * | {@link ng.directive:ngClass#animations ngClass}                                                          | add and remove (the CSS class(es) present)                               |
 * | {@link ng.directive:ngShow#animations ngShow} & {@link ng.directive:ngHide#animations ngHide}            | add and remove (the ng-hide class value)                                 |
 * | {@link ng.directive:form#animation-hooks form} & {@link ng.directive:ngModel#animation-hooks ngModel}    | add and remove (dirty, pristine, valid, invalid & all other validations) |
 * | {@link module:ngMessages#animations ngMessages}                                                          | add and remove (ng-active & ng-inactive)                                 |
 * | {@link module:ngMessages#animations ngMessage}                                                           | enter and leave                                                          |
 *
 * (More information can be found by visiting each the documentation associated with each directive.)
 *
 * ## CSS-based Animations
 *
 * CSS-based animations with ngAnimate are unique since they require no JavaScript code at all. By using a CSS class that we reference between our HTML
 * and CSS code we can create an animation that will be picked up by Angular when an the underlying directive performs an operation.
 *
 * The example below shows how an `enter` animation can be made possible on an element using `ng-if`:
 *
 * ```html
 * <div ng-if="bool" class="fade">
 *    Fade me in out
 * </div>
 * <button ng-click="bool=true">Fade In!</button>
 * <button ng-click="bool=false">Fade Out!</button>
 * ```
 *
 * Notice the CSS class **fade**? We can now create the CSS transition code that references this class:
 *
 * ```css
 * /&#42; The starting CSS styles for the enter animation &#42;/
 * .fade.ng-enter {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 *
 * /&#42; The finishing CSS styles for the enter animation &#42;/
 * .fade.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * ```
 *
 * The key thing to remember here is that, depending on the animation event (which each of the directives above trigger depending on what's going on) two
 * generated CSS classes will be applied to the element; in the example above we have `.ng-enter` and `.ng-enter-active`. For CSS transitions, the transition
 * code **must** be defined within the starting CSS class (in this case `.ng-enter`). The destination class is what the transition will animate towards.
 *
 * If for example we wanted to create animations for `leave` and `move` (ngRepeat triggers move) then we can do so using the same CSS naming conventions:
 *
 * ```css
 * /&#42; now the element will fade out before it is removed from the DOM &#42;/
 * .fade.ng-leave {
 *   transition:0.5s linear all;
 *   opacity:1;
 * }
 * .fade.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * We can also make use of **CSS Keyframes** by referencing the keyframe animation within the starting CSS class:
 *
 * ```css
 * /&#42; there is no need to define anything inside of the destination
 * CSS class since the keyframe will take charge of the animation &#42;/
 * .fade.ng-leave {
 *   animation: my_fade_animation 0.5s linear;
 *   -webkit-animation: my_fade_animation 0.5s linear;
 * }
 *
 * @keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 *
 * @-webkit-keyframes my_fade_animation {
 *   from { opacity:1; }
 *   to { opacity:0; }
 * }
 * ```
 *
 * Feel free also mix transitions and keyframes together as well as any other CSS classes on the same element.
 *
 * ### CSS Class-based Animations
 *
 * Class-based animations (animations that are triggered via `ngClass`, `ngShow`, `ngHide` and some other directives) have a slightly different
 * naming convention. Class-based animations are basic enough that a standard transition or keyframe can be referenced on the class being added
 * and removed.
 *
 * For example if we wanted to do a CSS animation for `ngHide` then we place an animation on the `.ng-hide` CSS class:
 *
 * ```html
 * <div ng-show="bool" class="fade">
 *   Show and hide me
 * </div>
 * <button ng-click="bool=!bool">Toggle</button>
 *
 * <style>
 * .fade.ng-hide {
 *   transition:0.5s linear all;
 *   opacity:0;
 * }
 * </style>
 * ```
 *
 * All that is going on here with ngShow/ngHide behind the scenes is the `.ng-hide` class is added/removed (when the hidden state is valid). Since
 * ngShow and ngHide are animation aware then we can match up a transition and ngAnimate handles the rest.
 *
 * In addition the addition and removal of the CSS class, ngAnimate also provides two helper methods that we can use to further decorate the animation
 * with CSS styles.
 *
 * ```html
 * <div ng-class="{on:onOff}" class="highlight">
 *   Highlight this box
 * </div>
 * <button ng-click="onOff=!onOff">Toggle</button>
 *
 * <style>
 * .highlight {
 *   transition:0.5s linear all;
 * }
 * .highlight.on-add {
 *   background:white;
 * }
 * .highlight.on {
 *   background:yellow;
 * }
 * .highlight.on-remove {
 *   background:black;
 * }
 * </style>
 * ```
 *
 * We can also make use of CSS keyframes by placing them within the CSS classes.
 *
 *
 * ### CSS Staggering Animations
 * A Staggering animation is a collection of animations that are issued with a slight delay in between each successive operation resulting in a
 * curtain-like effect. The ngAnimate module (versions >=1.2) supports staggering animations and the stagger effect can be
 * performed by creating a **ng-EVENT-stagger** CSS class and attaching that class to the base CSS class used for
 * the animation. The style property expected within the stagger class can either be a **transition-delay** or an
 * **animation-delay** property (or both if your animation contains both transitions and keyframe animations).
 *
 * ```css
 * .my-animation.ng-enter {
 *   /&#42; standard transition code &#42;/
 *   transition: 1s linear all;
 *   opacity:0;
 * }
 * .my-animation.ng-enter-stagger {
 *   /&#42; this will have a 100ms delay between each successive leave animation &#42;/
 *   transition-delay: 0.1s;
 *
 *   /&#42; As of 1.4.4, this must always be set: it signals ngAnimate
 *     to not accidentally inherit a delay property from another CSS class &#42;/
 *   transition-duration: 0s;
 * }
 * .my-animation.ng-enter.ng-enter-active {
 *   /&#42; standard transition styles &#42;/
 *   opacity:1;
 * }
 * ```
 *
 * Staggering animations work by default in ngRepeat (so long as the CSS class is defined). Outside of ngRepeat, to use staggering animations
 * on your own, they can be triggered by firing multiple calls to the same event on $animate. However, the restrictions surrounding this
 * are that each of the elements must have the same CSS className value as well as the same parent element. A stagger operation
 * will also be reset if one or more animation frames have passed since the multiple calls to `$animate` were fired.
 *
 * The following code will issue the **ng-leave-stagger** event on the element provided:
 *
 * ```js
 * var kids = parent.children();
 *
 * $animate.leave(kids[0]); //stagger index=0
 * $animate.leave(kids[1]); //stagger index=1
 * $animate.leave(kids[2]); //stagger index=2
 * $animate.leave(kids[3]); //stagger index=3
 * $animate.leave(kids[4]); //stagger index=4
 *
 * window.requestAnimationFrame(function() {
 *   //stagger has reset itself
 *   $animate.leave(kids[5]); //stagger index=0
 *   $animate.leave(kids[6]); //stagger index=1
 *
 *   $scope.$digest();
 * });
 * ```
 *
 * Stagger animations are currently only supported within CSS-defined animations.
 *
 * ### The `ng-animate` CSS class
 *
 * When ngAnimate is animating an element it will apply the `ng-animate` CSS class to the element for the duration of the animation.
 * This is a temporary CSS class and it will be removed once the animation is over (for both JavaScript and CSS-based animations).
 *
 * Therefore, animations can be applied to an element using this temporary class directly via CSS.
 *
 * ```css
 * .zipper.ng-animate {
 *   transition:0.5s linear all;
 * }
 * .zipper.ng-enter {
 *   opacity:0;
 * }
 * .zipper.ng-enter.ng-enter-active {
 *   opacity:1;
 * }
 * .zipper.ng-leave {
 *   opacity:1;
 * }
 * .zipper.ng-leave.ng-leave-active {
 *   opacity:0;
 * }
 * ```
 *
 * (Note that the `ng-animate` CSS class is reserved and it cannot be applied on an element directly since ngAnimate will always remove
 * the CSS class once an animation has completed.)
 *
 *
 * ### The `ng-[event]-prepare` class
 *
 * This is a special class that can be used to prevent unwanted flickering / flash of content before
 * the actual animation starts. The class is added as soon as an animation is initialized, but removed
 * before the actual animation starts (after waiting for a $digest).
 * It is also only added for *structural* animations (`enter`, `move`, and `leave`).
 *
 * In practice, flickering can appear when nesting elements with structural animations such as `ngIf`
 * into elements that have class-based animations such as `ngClass`.
 *
 * ```html
 * <div ng-class="{red: myProp}">
 *   <div ng-class="{blue: myProp}">
 *     <div class="message" ng-if="myProp"></div>
 *   </div>
 * </div>
 * ```
 *
 * It is possible that during the `enter` animation, the `.message` div will be briefly visible before it starts animating.
 * In that case, you can add styles to the CSS that make sure the element stays hidden before the animation starts:
 *
 * ```css
 * .message.ng-enter-prepare {
 *   opacity: 0;
 * }
 *
 * ```
 *
 * ## JavaScript-based Animations
 *
 * ngAnimate also allows for animations to be consumed by JavaScript code. The approach is similar to CSS-based animations (where there is a shared
 * CSS class that is referenced in our HTML code) but in addition we need to register the JavaScript animation on the module. By making use of the
 * `module.animation()` module function we can register the animation.
 *
 * Let's see an example of a enter/leave animation using `ngRepeat`:
 *
 * ```html
 * <div ng-repeat="item in items" class="slide">
 *   {{ item }}
 * </div>
 * ```
 *
 * See the **slide** CSS class? Let's use that class to define an animation that we'll structure in our module code by using `module.animation`:
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     // make note that other events (like addClass/removeClass)
 *     // have different function input parameters
 *     enter: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *
 *       // remember to call doneFn so that angular
 *       // knows that the animation has concluded
 *     },
 *
 *     move: function(element, doneFn) {
 *       jQuery(element).fadeIn(1000, doneFn);
 *     },
 *
 *     leave: function(element, doneFn) {
 *       jQuery(element).fadeOut(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing about JS-based animations is that we can inject other services and make use of advanced animation libraries such as
 * greensock.js and velocity.js.
 *
 * If our animation code class-based (meaning that something like `ngClass`, `ngHide` and `ngShow` triggers it) then we can still define
 * our animations inside of the same registered animation, however, the function input arguments are a bit different:
 *
 * ```html
 * <div ng-class="color" class="colorful">
 *   this box is moody
 * </div>
 * <button ng-click="color='red'">Change to red</button>
 * <button ng-click="color='blue'">Change to blue</button>
 * <button ng-click="color='green'">Change to green</button>
 * ```
 *
 * ```js
 * myModule.animation('.colorful', [function() {
 *   return {
 *     addClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     removeClass: function(element, className, doneFn) {
 *       // do some cool animation and call the doneFn
 *     },
 *     setClass: function(element, addedClass, removedClass, doneFn) {
 *       // do some cool animation and call the doneFn
 *     }
 *   }
 * }]);
 * ```
 *
 * ## CSS + JS Animations Together
 *
 * AngularJS 1.4 and higher has taken steps to make the amalgamation of CSS and JS animations more flexible. However, unlike earlier versions of Angular,
 * defining CSS and JS animations to work off of the same CSS class will not work anymore. Therefore the example below will only result in **JS animations taking
 * charge of the animation**:
 *
 * ```html
 * <div ng-if="bool" class="slide">
 *   Slide in and out
 * </div>
 * ```
 *
 * ```js
 * myModule.animation('.slide', [function() {
 *   return {
 *     enter: function(element, doneFn) {
 *       jQuery(element).slideIn(1000, doneFn);
 *     }
 *   }
 * }]);
 * ```
 *
 * ```css
 * .slide.ng-enter {
 *   transition:0.5s linear all;
 *   transform:translateY(-100px);
 * }
 * .slide.ng-enter.ng-enter-active {
 *   transform:translateY(0);
 * }
 * ```
 *
 * Does this mean that CSS and JS animations cannot be used together? Do JS-based animations always have higher priority? We can make up for the
 * lack of CSS animations by using the `$animateCss` service to trigger our own tweaked-out, CSS-based animations directly from
 * our own JS-based animation code:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
*        // this will trigger `.slide.ng-enter` and `.slide.ng-enter-active`.
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * The nice thing here is that we can save bandwidth by sticking to our CSS-based animation code and we don't need to rely on a 3rd-party animation framework.
 *
 * The `$animateCss` service is very powerful since we can feed in all kinds of extra properties that will be evaluated and fed into a CSS transition or
 * keyframe animation. For example if we wanted to animate the height of an element while adding and removing classes then we can do so by providing that
 * data into `$animateCss` directly:
 *
 * ```js
 * myModule.animation('.slide', ['$animateCss', function($animateCss) {
 *   return {
 *     enter: function(element) {
 *       return $animateCss(element, {
 *         event: 'enter',
 *         structural: true,
 *         addClass: 'maroon-setting',
 *         from: { height:0 },
 *         to: { height: 200 }
 *       });
 *     }
 *   }
 * }]);
 * ```
 *
 * Now we can fill in the rest via our transition CSS code:
 *
 * ```css
 * /&#42; the transition tells ngAnimate to make the animation happen &#42;/
 * .slide.ng-enter { transition:0.5s linear all; }
 *
 * /&#42; this extra CSS class will be absorbed into the transition
 * since the $animateCss code is adding the class &#42;/
 * .maroon-setting { background:red; }
 * ```
 *
 * And `$animateCss` will figure out the rest. Just make sure to have the `done()` callback fire the `doneFn` function to signal when the animation is over.
 *
 * To learn more about what's possible be sure to visit the {@link ngAnimate.$animateCss $animateCss service}.
 *
 * ## Animation Anchoring (via `ng-animate-ref`)
 *
 * ngAnimate in AngularJS 1.4 comes packed with the ability to cross-animate elements between
 * structural areas of an application (like views) by pairing up elements using an attribute
 * called `ng-animate-ref`.
 *
 * Let's say for example we have two views that are managed by `ng-view` and we want to show
 * that there is a relationship between two components situated in within these views. By using the
 * `ng-animate-ref` attribute we can identify that the two components are paired together and we
 * can then attach an animation, which is triggered when the view changes.
 *
 * Say for example we have the following template code:
 *
 * ```html
 * <!-- index.html -->
 * <div ng-view class="view-animation">
 * </div>
 *
 * <!-- home.html -->
 * <a href="#/banner-page">
 *   <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * </a>
 *
 * <!-- banner-page.html -->
 * <img src="./banner.jpg" class="banner" ng-animate-ref="banner">
 * ```
 *
 * Now, when the view changes (once the link is clicked), ngAnimate will examine the
 * HTML contents to see if there is a match reference between any components in the view
 * that is leaving and the view that is entering. It will scan both the view which is being
 * removed (leave) and inserted (enter) to see if there are any paired DOM elements that
 * contain a matching ref value.
 *
 * The two images match since they share the same ref value. ngAnimate will now create a
 * transport element (which is a clone of the first image element) and it will then attempt
 * to animate to the position of the second image element in the next view. For the animation to
 * work a special CSS class called `ng-anchor` will be added to the transported element.
 *
 * We can now attach a transition onto the `.banner.ng-anchor` CSS class and then
 * ngAnimate will handle the entire transition for us as well as the addition and removal of
 * any changes of CSS classes between the elements:
 *
 * ```css
 * .banner.ng-anchor {
 *   /&#42; this animation will last for 1 second since there are
 *          two phases to the animation (an `in` and an `out` phase) &#42;/
 *   transition:0.5s linear all;
 * }
 * ```
 *
 * We also **must** include animations for the views that are being entered and removed
 * (otherwise anchoring wouldn't be possible since the new view would be inserted right away).
 *
 * ```css
 * .view-animation.ng-enter, .view-animation.ng-leave {
 *   transition:0.5s linear all;
 *   position:fixed;
 *   left:0;
 *   top:0;
 *   width:100%;
 * }
 * .view-animation.ng-enter {
 *   transform:translateX(100%);
 * }
 * .view-animation.ng-leave,
 * .view-animation.ng-enter.ng-enter-active {
 *   transform:translateX(0%);
 * }
 * .view-animation.ng-leave.ng-leave-active {
 *   transform:translateX(-100%);
 * }
 * ```
 *
 * Now we can jump back to the anchor animation. When the animation happens, there are two stages that occur:
 * an `out` and an `in` stage. The `out` stage happens first and that is when the element is animated away
 * from its origin. Once that animation is over then the `in` stage occurs which animates the
 * element to its destination. The reason why there are two animations is to give enough time
 * for the enter animation on the new element to be ready.
 *
 * The example above sets up a transition for both the in and out phases, but we can also target the out or
 * in phases directly via `ng-anchor-out` and `ng-anchor-in`.
 *
 * ```css
 * .banner.ng-anchor-out {
 *   transition: 0.5s linear all;
 *
 *   /&#42; the scale will be applied during the out animation,
 *          but will be animated away when the in animation runs &#42;/
 *   transform: scale(1.2);
 * }
 *
 * .banner.ng-anchor-in {
 *   transition: 1s linear all;
 * }
 * ```
 *
 *
 *
 *
 * ### Anchoring Demo
 *
  <example module="anchoringExample"
           name="anchoringExample"
           id="anchoringExample"
           deps="angular-animate.js;angular-route.js"
           animations="true">
    <file name="index.html">
      <a href="#/">Home</a>
      <hr />
      <div class="view-container">
        <div ng-view class="view"></div>
      </div>
    </file>
    <file name="script.js">
      angular.module('anchoringExample', ['ngAnimate', 'ngRoute'])
        .config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/', {
            templateUrl: 'home.html',
            controller: 'HomeController as home'
          });
          $routeProvider.when('/profile/:id', {
            templateUrl: 'profile.html',
            controller: 'ProfileController as profile'
          });
        }])
        .run(['$rootScope', function($rootScope) {
          $rootScope.records = [
            { id:1, title: "Miss Beulah Roob" },
            { id:2, title: "Trent Morissette" },
            { id:3, title: "Miss Ava Pouros" },
            { id:4, title: "Rod Pouros" },
            { id:5, title: "Abdul Rice" },
            { id:6, title: "Laurie Rutherford Sr." },
            { id:7, title: "Nakia McLaughlin" },
            { id:8, title: "Jordon Blanda DVM" },
            { id:9, title: "Rhoda Hand" },
            { id:10, title: "Alexandrea Sauer" }
          ];
        }])
        .controller('HomeController', [function() {
          //empty
        }])
        .controller('ProfileController', ['$rootScope', '$routeParams', function($rootScope, $routeParams) {
          var index = parseInt($routeParams.id, 10);
          var record = $rootScope.records[index - 1];

          this.title = record.title;
          this.id = record.id;
        }]);
    </file>
    <file name="home.html">
      <h2>Welcome to the home page</h1>
      <p>Please click on an element</p>
      <a class="record"
         ng-href="#/profile/{{ record.id }}"
         ng-animate-ref="{{ record.id }}"
         ng-repeat="record in records">
        {{ record.title }}
      </a>
    </file>
    <file name="profile.html">
      <div class="profile record" ng-animate-ref="{{ profile.id }}">
        {{ profile.title }}
      </div>
    </file>
    <file name="animations.css">
      .record {
        display:block;
        font-size:20px;
      }
      .profile {
        background:black;
        color:white;
        font-size:100px;
      }
      .view-container {
        position:relative;
      }
      .view-container > .view.ng-animate {
        position:absolute;
        top:0;
        left:0;
        width:100%;
        min-height:500px;
      }
      .view.ng-enter, .view.ng-leave,
      .record.ng-anchor {
        transition:0.5s linear all;
      }
      .view.ng-enter {
        transform:translateX(100%);
      }
      .view.ng-enter.ng-enter-active, .view.ng-leave {
        transform:translateX(0%);
      }
      .view.ng-leave.ng-leave-active {
        transform:translateX(-100%);
      }
      .record.ng-anchor-out {
        background:red;
      }
    </file>
  </example>
 *
 * ### How is the element transported?
 *
 * When an anchor animation occurs, ngAnimate will clone the starting element and position it exactly where the starting
 * element is located on screen via absolute positioning. The cloned element will be placed inside of the root element
 * of the application (where ng-app was defined) and all of the CSS classes of the starting element will be applied. The
 * element will then animate into the `out` and `in` animations and will eventually reach the coordinates and match
 * the dimensions of the destination element. During the entire animation a CSS class of `.ng-animate-shim` will be applied
 * to both the starting and destination elements in order to hide them from being visible (the CSS styling for the class
 * is: `visibility:hidden`). Once the anchor reaches its destination then it will be removed and the destination element
 * will become visible since the shim class will be removed.
 *
 * ### How is the morphing handled?
 *
 * CSS Anchoring relies on transitions and keyframes and the internal code is intelligent enough to figure out
 * what CSS classes differ between the starting element and the destination element. These different CSS classes
 * will be added/removed on the anchor element and a transition will be applied (the transition that is provided
 * in the anchor class). Long story short, ngAnimate will figure out what classes to add and remove which will
 * make the transition of the element as smooth and automatic as possible. Be sure to use simple CSS classes that
 * do not rely on DOM nesting structure so that the anchor element appears the same as the starting element (since
 * the cloned element is placed inside of root element which is likely close to the body element).
 *
 * Note that if the root element is on the `<html>` element then the cloned node will be placed inside of body.
 *
 *
 * ## Using $animate in your directive code
 *
 * So far we've explored how to feed in animations into an Angular application, but how do we trigger animations within our own directives in our application?
 * By injecting the `$animate` service into our directive code, we can trigger structural and class-based hooks which can then be consumed by animations. Let's
 * imagine we have a greeting box that shows and hides itself when the data changes
 *
 * ```html
 * <greeting-box active="onOrOff">Hi there</greeting-box>
 * ```
 *
 * ```js
 * ngModule.directive('greetingBox', ['$animate', function($animate) {
 *   return function(scope, element, attrs) {
 *     attrs.$observe('active', function(value) {
 *       value ? $animate.addClass(element, 'on') : $animate.removeClass(element, 'on');
 *     });
 *   });
 * }]);
 * ```
 *
 * Now the `on` CSS class is added and removed on the greeting box component. Now if we add a CSS class on top of the greeting box element
 * in our HTML code then we can trigger a CSS or JS animation to happen.
 *
 * ```css
 * /&#42; normally we would create a CSS class to reference on the element &#42;/
 * greeting-box.on { transition:0.5s linear all; background:green; color:white; }
 * ```
 *
 * The `$animate` service contains a variety of other methods like `enter`, `leave`, `animate` and `setClass`. To learn more about what's
 * possible be sure to visit the {@link ng.$animate $animate service API page}.
 *
 *
 * ## Callbacks and Promises
 *
 * When `$animate` is called it returns a promise that can be used to capture when the animation has ended. Therefore if we were to trigger
 * an animation (within our directive code) then we can continue performing directive and scope related activities after the animation has
 * ended by chaining onto the returned promise that animation method returns.
 *
 * ```js
 * // somewhere within the depths of the directive
 * $animate.enter(element, parent).then(function() {
 *   //the animation has completed
 * });
 * ```
 *
 * (Note that earlier versions of Angular prior to v1.4 required the promise code to be wrapped using `$scope.$apply(...)`. This is not the case
 * anymore.)
 *
 * In addition to the animation promise, we can also make use of animation-related callbacks within our directives and controller code by registering
 * an event listener using the `$animate` service. Let's say for example that an animation was triggered on our view
 * routing controller to hook into that:
 *
 * ```js
 * ngModule.controller('HomePageController', ['$animate', function($animate) {
 *   $animate.on('enter', ngViewElement, function(element) {
 *     // the animation for this route has completed
 *   }]);
 * }])
 * ```
 *
 * (Note that you will need to trigger a digest within the callback to get angular to notice any scope-related changes.)
 */

var copy;
var extend;
var forEach;
var isArray;
var isDefined;
var isElement;
var isFunction;
var isObject;
var isString;
var isUndefined;
var jqLite;
var noop;

/**
 * @ngdoc service
 * @name $animate
 * @kind object
 *
 * @description
 * The ngAnimate `$animate` service documentation is the same for the core `$animate` service.
 *
 * Click here {@link ng.$animate to learn more about animations with `$animate`}.
 */
angular.module('ngAnimate', [], function initAngularHelpers() {
  // Access helpers from angular core.
  // Do it inside a `config` block to ensure `window.angular` is available.
  noop        = angular.noop;
  copy        = angular.copy;
  extend      = angular.extend;
  jqLite      = angular.element;
  forEach     = angular.forEach;
  isArray     = angular.isArray;
  isString    = angular.isString;
  isObject    = angular.isObject;
  isUndefined = angular.isUndefined;
  isDefined   = angular.isDefined;
  isFunction  = angular.isFunction;
  isElement   = angular.isElement;
})
  .directive('ngAnimateSwap', ngAnimateSwapDirective)

  .directive('ngAnimateChildren', $$AnimateChildrenDirective)
  .factory('$$rAFScheduler', $$rAFSchedulerFactory)

  .provider('$$animateQueue', $$AnimateQueueProvider)
  .provider('$$animation', $$AnimationProvider)

  .provider('$animateCss', $AnimateCssProvider)
  .provider('$$animateCssDriver', $$AnimateCssDriverProvider)

  .provider('$$animateJs', $$AnimateJsProvider)
  .provider('$$animateJsDriver', $$AnimateJsDriverProvider);


})(window, window.angular);

/*
 AngularJS v1.5.5
 (c) 2010-2016 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(t,p){'use strict';var b="BUTTON A INPUT TEXTAREA SELECT DETAILS SUMMARY".split(" "),l=function(a,c){if(-1!==c.indexOf(a[0].nodeName))return!0};p.module("ngAria",["ng"]).provider("$aria",function(){function a(a,b,m,h){return function(d,f,e){var q=e.$normalize(b);!c[q]||l(f,m)||e[q]||d.$watch(e[a],function(a){a=h?!a:!!a;f.attr(b,a)})}}var c={ariaHidden:!0,ariaChecked:!0,ariaReadonly:!0,ariaDisabled:!0,ariaRequired:!0,ariaInvalid:!0,ariaValue:!0,tabindex:!0,bindKeypress:!0,bindRoleForClick:!0};
this.config=function(a){c=p.extend(c,a)};this.$get=function(){return{config:function(a){return c[a]},$$watchExpr:a}}}).directive("ngShow",["$aria",function(a){return a.$$watchExpr("ngShow","aria-hidden",[],!0)}]).directive("ngHide",["$aria",function(a){return a.$$watchExpr("ngHide","aria-hidden",[],!1)}]).directive("ngValue",["$aria",function(a){return a.$$watchExpr("ngValue","aria-checked",b,!1)}]).directive("ngChecked",["$aria",function(a){return a.$$watchExpr("ngChecked","aria-checked",b,!1)}]).directive("ngReadonly",
["$aria",function(a){return a.$$watchExpr("ngReadonly","aria-readonly",b,!1)}]).directive("ngRequired",["$aria",function(a){return a.$$watchExpr("ngRequired","aria-required",b,!1)}]).directive("ngModel",["$aria",function(a){function c(c,h,d,f){return a.config(h)&&!d.attr(c)&&(f||!l(d,b))}function g(a,c){return!c.attr("role")&&c.attr("type")===a&&"INPUT"!==c[0].nodeName}function k(a,c){var d=a.type,f=a.role;return"checkbox"===(d||f)||"menuitemcheckbox"===f?"checkbox":"radio"===(d||f)||"menuitemradio"===
f?"radio":"range"===d||"progressbar"===f||"slider"===f?"range":""}return{restrict:"A",require:"ngModel",priority:200,compile:function(b,h){var d=k(h,b);return{pre:function(a,e,c,b){"checkbox"===d&&(b.$isEmpty=function(a){return!1===a})},post:function(f,e,b,n){function h(){return n.$modelValue}function k(a){e.attr("aria-checked",b.value==n.$viewValue)}function l(){e.attr("aria-checked",!n.$isEmpty(n.$viewValue))}var m=c("tabindex","tabindex",e,!1);switch(d){case "radio":case "checkbox":g(d,e)&&e.attr("role",
d);c("aria-checked","ariaChecked",e,!1)&&f.$watch(h,"radio"===d?k:l);m&&e.attr("tabindex",0);break;case "range":g(d,e)&&e.attr("role","slider");if(a.config("ariaValue")){var p=!e.attr("aria-valuemin")&&(b.hasOwnProperty("min")||b.hasOwnProperty("ngMin")),r=!e.attr("aria-valuemax")&&(b.hasOwnProperty("max")||b.hasOwnProperty("ngMax")),s=!e.attr("aria-valuenow");p&&b.$observe("min",function(a){e.attr("aria-valuemin",a)});r&&b.$observe("max",function(a){e.attr("aria-valuemax",a)});s&&f.$watch(h,function(a){e.attr("aria-valuenow",
a)})}m&&e.attr("tabindex",0)}!b.hasOwnProperty("ngRequired")&&n.$validators.required&&c("aria-required","ariaRequired",e,!1)&&b.$observe("required",function(){e.attr("aria-required",!!b.required)});c("aria-invalid","ariaInvalid",e,!0)&&f.$watch(function(){return n.$invalid},function(a){e.attr("aria-invalid",!!a)})}}}}}]).directive("ngDisabled",["$aria",function(a){return a.$$watchExpr("ngDisabled","aria-disabled",b,!1)}]).directive("ngMessages",function(){return{restrict:"A",require:"?ngMessages",
link:function(a,b,g,k){b.attr("aria-live")||b.attr("aria-live","assertive")}}}).directive("ngClick",["$aria","$parse",function(a,c){return{restrict:"A",compile:function(g,k){var m=c(k.ngClick,null,!0);return function(c,d,f){if(!l(d,b)&&(a.config("bindRoleForClick")&&!d.attr("role")&&d.attr("role","button"),a.config("tabindex")&&!d.attr("tabindex")&&d.attr("tabindex",0),a.config("bindKeypress")&&!f.ngKeypress))d.on("keypress",function(a){function b(){m(c,{$event:a})}var d=a.which||a.keyCode;32!==d&&
13!==d||c.$apply(b)})}}}}]).directive("ngDblclick",["$aria",function(a){return function(c,g,k){!a.config("tabindex")||g.attr("tabindex")||l(g,b)||g.attr("tabindex",0)}}])})(window,window.angular);
//# sourceMappingURL=angular-aria.min.js.map

angular.module('cgBusy',[]);

//loosely modeled after angular-promise-tracker
angular.module('cgBusy').factory('_cgBusyTrackerFactory',['$timeout','$q',function($timeout,$q){

    return function(){

        var tracker = {};
        tracker.promises = [];
        tracker.delayPromise = null;
        tracker.durationPromise = null;
        tracker.delayJustFinished = false;

        tracker.reset = function(options){
            tracker.minDuration = options.minDuration;

            tracker.promises = [];
            angular.forEach(options.promises,function(p){
                if (!p || p.$cgBusyFulfilled) {
                    return;
                }
                addPromiseLikeThing(p);
            });

            if (tracker.promises.length === 0) {
                //if we have no promises then dont do the delay or duration stuff
                return;
            }

            tracker.delayJustFinished = false;
            if (options.delay) {
                tracker.delayPromise = $timeout(function(){
                    tracker.delayPromise = null;
                    tracker.delayJustFinished = true;
                },parseInt(options.delay,10));
            }
            if (options.minDuration) {
                tracker.durationPromise = $timeout(function(){
                    tracker.durationPromise = null;
                },parseInt(options.minDuration,10) + (options.delay ? parseInt(options.delay,10) : 0));
            }            
        };

        tracker.isPromise = function(promiseThing){
            var then = promiseThing && (promiseThing.then || promiseThing.$then ||
                (promiseThing.$promise && promiseThing.$promise.then));

            return typeof then !== 'undefined';            
        };

        tracker.callThen = function(promiseThing,success,error){
            var promise;
            if (promiseThing.then || promiseThing.$then){
                promise = promiseThing;
            } else if (promiseThing.$promise){
                promise = promiseThing.$promise;
            } else if (promiseThing.denodeify){
                promise = $q.when(promiseThing);
            }
                       
            var then = (promise.then || promise.$then);

            then.call(promise,success,error);
        };

        var addPromiseLikeThing = function(promise){

            if (!tracker.isPromise(promise)) {
                throw new Error('cgBusy expects a promise (or something that has a .promise or .$promise');
            }

            if (tracker.promises.indexOf(promise) !== -1){
                return;
            }
            tracker.promises.push(promise);

            tracker.callThen(promise, function(){
                promise.$cgBusyFulfilled = true;
                if (tracker.promises.indexOf(promise) === -1) {
                    return;
                }
                tracker.promises.splice(tracker.promises.indexOf(promise),1);
            },function(){
                promise.$cgBusyFulfilled = true;
                if (tracker.promises.indexOf(promise) === -1) {
                    return;
                }
                tracker.promises.splice(tracker.promises.indexOf(promise),1);
            });
        };

        tracker.active = function(){
            if (tracker.delayPromise){
                return false;
            }

            if (!tracker.delayJustFinished){
                if (tracker.durationPromise){
                    return true;
                }
                return tracker.promises.length > 0;
            } else {
                //if both delay and min duration are set, 
                //we don't want to initiate the min duration if the 
                //promise finished before the delay was complete
                tracker.delayJustFinished = false;
                if (tracker.promises.length === 0) {
                    tracker.durationPromise = null;
                }
                return tracker.promises.length > 0;
            }
        };

        return tracker;

    };
}]);

angular.module('cgBusy').value('cgBusyDefaults',{});

angular.module('cgBusy').directive('cgBusy',['$compile','$templateCache','cgBusyDefaults','$http','_cgBusyTrackerFactory',
    function($compile,$templateCache,cgBusyDefaults,$http,_cgBusyTrackerFactory){
        return {
            restrict: 'A',
            link: function(scope, element, attrs, fn) {

                //Apply position:relative to parent element if necessary
                var position = element.css('position');
                if (position === 'static' || position === '' || typeof position === 'undefined'){
                    element.css('position','relative');
                }

                var templateElement;
                var backdropElement;
                var currentTemplate;
                var templateScope;
                var backdrop;
                var tracker = _cgBusyTrackerFactory();

                var defaults = {
                    templateUrl: 'angular-busy.html',
                    delay:0,
                    minDuration:0,
                    backdrop: true,
                    message:'Please Wait...',
                    wrapperClass: 'cg-busy cg-busy-animation'
                };

                angular.extend(defaults,cgBusyDefaults);

                scope.$watchCollection(attrs.cgBusy,function(options){

                    if (!options) {
                        options = {promise:null};
                    }

                    if (angular.isString(options)) {
                        throw new Error('Invalid value for cg-busy. cgBusy no longer accepts string ids to represent promises/trackers.');
                    }

                    //is it an array (of promises) or one promise
                    if (angular.isArray(options) || tracker.isPromise(options)) {
                        options = {promise:options};
                    }

                    options = angular.extend(angular.copy(defaults),options);

                    if (!options.templateUrl){
                        options.templateUrl = defaults.templateUrl;
                    }

                    if (!angular.isArray(options.promise)){
                        options.promise = [options.promise];
                    }

                    // options.promise = angular.isArray(options.promise) ? options.promise : [options.promise];
                    // options.message = options.message ? options.message : 'Please Wait...';
                    // options.template = options.template ? options.template : cgBusyTemplateName;
                    // options.minDuration = options.minDuration ? options.minDuration : 0;
                    // options.delay = options.delay ? options.delay : 0;

                    if (!templateScope) {
                        templateScope = scope.$new();
                    }

                    templateScope.$message = options.message;

                    if (!angular.equals(tracker.promises,options.promise)) {
                        tracker.reset({
                            promises:options.promise,
                            delay:options.delay,
                            minDuration: options.minDuration
                        });
                    }

                    templateScope.$cgBusyIsActive = function() {
                        return tracker.active();
                    };


                    if (!templateElement || currentTemplate !== options.templateUrl || backdrop !== options.backdrop) {

                        if (templateElement) {
                            templateElement.remove();
                        }
                        if (backdropElement){
                            backdropElement.remove();
                        }

                        currentTemplate = options.templateUrl;
                        backdrop = options.backdrop;

                        $http.get(currentTemplate,{cache: $templateCache}).success(function(indicatorTemplate){

                            options.backdrop = typeof options.backdrop === 'undefined' ? true : options.backdrop;

                            if (options.backdrop){
                                var backdrop = '<div class="cg-busy cg-busy-backdrop cg-busy-backdrop-animation ng-hide" ng-show="$cgBusyIsActive()"></div>';
                                backdropElement = $compile(backdrop)(templateScope);
                                element.append(backdropElement);
                            }

                            var template = '<div class="'+options.wrapperClass+' ng-hide" ng-show="$cgBusyIsActive()">' + indicatorTemplate + '</div>';
                            templateElement = $compile(template)(templateScope);

                            angular.element(templateElement.children()[0])
                                .css('position','absolute')
                                .css('top',0)
                                .css('left',0)
                                .css('right',0)
                                .css('bottom',0);
                            element.append(templateElement);

                        }).error(function(data){
                            throw new Error('Template specified for cgBusy ('+options.templateUrl+') could not be loaded. ' + data);
                        });
                    }

                },true);
            }
        };
    }
]);


angular.module('cgBusy').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('angular-busy.html',
    "<div class=\"cg-busy-default-wrapper\">\n" +
    "\n" +
    "   <div class=\"cg-busy-default-sign\">\n" +
    "\n" +
    "      <div class=\"cg-busy-default-spinner\">\n" +
    "         <div class=\"bar1\"></div>\n" +
    "         <div class=\"bar2\"></div>\n" +
    "         <div class=\"bar3\"></div>\n" +
    "         <div class=\"bar4\"></div>\n" +
    "         <div class=\"bar5\"></div>\n" +
    "         <div class=\"bar6\"></div>\n" +
    "         <div class=\"bar7\"></div>\n" +
    "         <div class=\"bar8\"></div>\n" +
    "         <div class=\"bar9\"></div>\n" +
    "         <div class=\"bar10\"></div>\n" +
    "         <div class=\"bar11\"></div>\n" +
    "         <div class=\"bar12\"></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"cg-busy-default-text\">{{$message}}</div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "</div>"
  );

}]);

'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "AM",
      "PM"
    ],
    "DAY": [
      "domingo",
      "segunda-feira",
      "ter\u00e7a-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "s\u00e1bado"
    ],
    "ERANAMES": [
      "antes de Cristo",
      "depois de Cristo"
    ],
    "ERAS": [
      "a.C.",
      "d.C."
    ],
    "FIRSTDAYOFWEEK": 6,
    "MONTH": [
      "janeiro",
      "fevereiro",
      "mar\u00e7o",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro"
    ],
    "SHORTDAY": [
      "dom",
      "seg",
      "ter",
      "qua",
      "qui",
      "sex",
      "s\u00e1b"
    ],
    "SHORTMONTH": [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez"
    ],
    "STANDALONEMONTH": [
      "janeiro",
      "fevereiro",
      "mar\u00e7o",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE, d 'de' MMMM 'de' y",
    "longDate": "d 'de' MMMM 'de' y",
    "medium": "d 'de' MMM 'de' y HH:mm:ss",
    "mediumDate": "d 'de' MMM 'de' y",
    "mediumTime": "HH:mm:ss",
    "short": "dd/MM/yy HH:mm",
    "shortDate": "dd/MM/yy",
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "R$",
    "DECIMAL_SEP": ",",
    "GROUP_SEP": ".",
    "PATTERNS": [
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 3,
        "minFrac": 0,
        "minInt": 1,
        "negPre": "-",
        "negSuf": "",
        "posPre": "",
        "posSuf": ""
      },
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
        "negPre": "-\u00a4",
        "negSuf": "",
        "posPre": "\u00a4",
        "posSuf": ""
      }
    ]
  },
  "id": "pt-br",
  "localeID": "pt_BR",
  "pluralCat": function(n, opt_precision) {  if (n >= 0 && n <= 2 && n != 2) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);

/*!
 * Angular Material Design
 * https://github.com/angular/material
 * @license MIT
 * v1.1.0
 */
!function(e,t,n){"use strict";!function(){t.module("ngMaterial",["ng","ngAnimate","ngAria","material.core","material.core.gestures","material.core.layout","material.core.theming.palette","material.core.theming","material.core.animate","material.components.autocomplete","material.components.backdrop","material.components.bottomSheet","material.components.button","material.components.card","material.components.checkbox","material.components.chips","material.components.colors","material.components.content","material.components.datepicker","material.components.dialog","material.components.divider","material.components.fabActions","material.components.fabShared","material.components.fabSpeedDial","material.components.fabToolbar","material.components.gridList","material.components.icon","material.components.input","material.components.list","material.components.menu","material.components.menuBar","material.components.navBar","material.components.panel","material.components.progressCircular","material.components.progressLinear","material.components.radioButton","material.components.select","material.components.showHide","material.components.sidenav","material.components.slider","material.components.sticky","material.components.subheader","material.components.swipe","material.components.switch","material.components.tabs","material.components.toast","material.components.toolbar","material.components.tooltip","material.components.virtualRepeat","material.components.whiteframe"])}(),function(){function e(e,t){if(t.has("$swipe")){var n="You are using the ngTouch module. \nAngular Material already has mobile click, tap, and swipe support... \nngTouch is not supported with Angular Material!";e.warn(n)}}function n(e,t){e.decorator("$$rAF",["$delegate",o]),t.theme("default").primaryPalette("indigo").accentPalette("pink").warnPalette("deep-orange").backgroundPalette("grey")}function o(e){return e.throttle=function(t){var n,o,i,r;return function(){n=arguments,r=this,i=t,o||(o=!0,e(function(){i.apply(r,Array.prototype.slice.call(n)),o=!1}))}},e}t.module("material.core",["ngAnimate","material.core.animate","material.core.layout","material.core.gestures","material.core.theming"]).config(n).run(e),e.$inject=["$log","$injector"],n.$inject=["$provide","$mdThemingProvider"],o.$inject=["$delegate"]}(),function(){function e(){return{restrict:"A",link:n}}function n(e,t,n){var o=n.mdAutoFocus||n.mdAutofocus||n.mdSidenavFocus;e.$watch(o,function(e){t.toggleClass("md-autofocus",e)})}t.module("material.core").directive("mdAutofocus",e).directive("mdAutoFocus",e).directive("mdSidenavFocus",e)}(),function(){function e(){function e(e){var t="#"===e[0]?e.substr(1):e,n=t.length/3,o=t.substr(0,n),i=t.substr(n,n),r=t.substr(2*n);return 1===n&&(o+=o,i+=i,r+=r),"rgba("+parseInt(o,16)+","+parseInt(i,16)+","+parseInt(r,16)+",0.1)"}function t(e){e=e.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);var t=e&&4===e.length?"#"+("0"+parseInt(e[1],10).toString(16)).slice(-2)+("0"+parseInt(e[2],10).toString(16)).slice(-2)+("0"+parseInt(e[3],10).toString(16)).slice(-2):"";return t.toUpperCase()}function n(e){return e.replace(")",", 0.1)").replace("(","a(")}function o(e){return e?e.replace("rgba","rgb").replace(/,[^\),]+\)/,")"):"rgb(0,0,0)"}return{rgbaToHex:t,hexToRgba:e,rgbToRgba:n,rgbaToRgb:o}}t.module("material.core").factory("$mdColorUtil",e)}(),function(){function e(e,n,o){function i(e){var t=d+"-"+e,n=a(t),o=n.charAt(0).toLowerCase()+n.substring(1);return r(e)?e:r(n)?n:r(o)?o:e}function r(e){return t.isDefined(l.style[e])}function a(e){return e.replace(c,function(e,t,n,o){return o?n.toUpperCase():n})}var d=e.vendorPrefix,s=/webkit/i.test(d),c=/([:\-_]+(.))/g,l=document.createElement("div"),m={isInputKey:function(e){return e.keyCode>=31&&e.keyCode<=90},isNumPadKey:function(e){return 3===e.location&&e.keyCode>=97&&e.keyCode<=105},isNavigationKey:function(e){var t=m.KEY_CODE,n=[t.SPACE,t.ENTER,t.UP_ARROW,t.DOWN_ARROW];return n.indexOf(e.keyCode)!=-1},KEY_CODE:{COMMA:188,SEMICOLON:186,ENTER:13,ESCAPE:27,SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT_ARROW:37,UP_ARROW:38,RIGHT_ARROW:39,DOWN_ARROW:40,TAB:9,BACKSPACE:8,DELETE:46},CSS:{TRANSITIONEND:"transitionend"+(s?" webkitTransitionEnd":""),ANIMATIONEND:"animationend"+(s?" webkitAnimationEnd":""),TRANSFORM:i("transform"),TRANSFORM_ORIGIN:i("transformOrigin"),TRANSITION:i("transition"),TRANSITION_DURATION:i("transitionDuration"),ANIMATION_PLAY_STATE:i("animationPlayState"),ANIMATION_DURATION:i("animationDuration"),ANIMATION_NAME:i("animationName"),ANIMATION_TIMING:i("animationTimingFunction"),ANIMATION_DIRECTION:i("animationDirection")},MEDIA:{xs:"(max-width: 599px)","gt-xs":"(min-width: 600px)",sm:"(min-width: 600px) and (max-width: 959px)","gt-sm":"(min-width: 960px)",md:"(min-width: 960px) and (max-width: 1279px)","gt-md":"(min-width: 1280px)",lg:"(min-width: 1280px) and (max-width: 1919px)","gt-lg":"(min-width: 1920px)",xl:"(min-width: 1920px)",landscape:"(orientation: landscape)",portrait:"(orientation: portrait)",print:"print"},MEDIA_PRIORITY:["xl","gt-lg","lg","gt-md","md","gt-sm","sm","gt-xs","xs","landscape","portrait","print"]};return m}t.module("material.core").factory("$mdConstant",e),e.$inject=["$sniffer","$window","$document"]}(),function(){function e(e,n){function o(){return[].concat(v)}function i(){return v.length}function r(e){return v.length&&e>-1&&e<v.length}function a(e){return!!e&&r(u(e)+1)}function d(e){return!!e&&r(u(e)-1)}function s(e){return r(e)?v[e]:null}function c(e,t){return v.filter(function(n){return n[e]===t})}function l(e,n){return e?(t.isNumber(n)||(n=v.length),v.splice(n,0,e),u(e)):-1}function m(e){p(e)&&v.splice(u(e),1)}function u(e){return v.indexOf(e)}function p(e){return e&&u(e)>-1}function h(){return v.length?v[0]:null}function f(){return v.length?v[v.length-1]:null}function g(e,o,i,a){i=i||b;for(var d=u(o);;){if(!r(d))return null;var s=d+(e?-1:1),c=null;if(r(s)?c=v[s]:n&&(c=e?f():h(),s=u(c)),null===c||s===a)return null;if(i(c))return c;t.isUndefined(a)&&(a=s),d=s}}var b=function(){return!0};e&&!t.isArray(e)&&(e=Array.prototype.slice.call(e)),n=!!n;var v=e||[];return{items:o,count:i,inRange:r,contains:p,indexOf:u,itemAt:s,findBy:c,add:l,remove:m,first:h,last:f,next:t.bind(null,g,!1),previous:t.bind(null,g,!0),hasPrevious:d,hasNext:a}}t.module("material.core").config(["$provide",function(t){t.decorator("$mdUtil",["$delegate",function(t){return t.iterator=e,t}])}])}(),function(){function e(e,n,o){function i(e){var n=u[e];t.isUndefined(n)&&(n=u[e]=r(e));var o=h[n];return t.isUndefined(o)&&(o=a(n)),o}function r(t){return e.MEDIA[t]||("("!==t.charAt(0)?"("+t+")":t)}function a(e){var t=p[e];return t||(t=p[e]=o.matchMedia(e)),t.addListener(d),h[t.media]=!!t.matches}function d(e){n.$evalAsync(function(){h[e.media]=!!e.matches})}function s(e){return p[e]}function c(t,n){for(var o=0;o<e.MEDIA_PRIORITY.length;o++){var i=e.MEDIA_PRIORITY[o];if(p[u[i]].matches){var r=m(t,n+"-"+i);if(t[r])return t[r]}}return t[m(t,n)]}function l(n,o,i){var r=[];return n.forEach(function(n){var a=m(o,n);t.isDefined(o[a])&&r.push(o.$observe(a,t.bind(void 0,i,null)));for(var d in e.MEDIA)a=m(o,n+"-"+d),t.isDefined(o[a])&&r.push(o.$observe(a,t.bind(void 0,i,d)))}),function(){r.forEach(function(e){e()})}}function m(e,t){return f[t]||(f[t]=e.$normalize(t))}var u={},p={},h={},f={};return i.getResponsiveAttribute=c,i.getQuery=s,i.watchResponsiveAttributes=l,i}t.module("material.core").factory("$mdMedia",e),e.$inject=["$mdConstant","$rootScope","$window"]}(),function(){function e(e,n){function o(e){return e=t.isArray(e)?e:[e],e.forEach(function(t){d.forEach(function(n){e.push(n+"-"+t)})}),e}function i(e){return e=t.isArray(e)?e:[e],o(e).map(function(e){return"["+e+"]"}).join(",")}function r(e,t){e=e[0]||e;for(var n=o(t),i=0;i<n.length;i++)if(e.hasAttribute(n[i]))return!0;return!1}function a(e,t){e=e[0]||e,o(t).forEach(function(t){e.removeAttribute(t)})}var d=["data","x"];return e?n?i(e):o(e):{buildList:o,buildSelector:i,hasAttribute:r,removeAttribute:a}}t.module("material.core").config(["$provide",function(t){t.decorator("$mdUtil",["$delegate",function(t){return t.prefixer=e,t}])}])}(),function(){function o(o,r,a,d,s,c,l,m,u,p){function h(e){return e?f(e)||g(e)?e:e+"px":"0"}function f(e){return String(e).indexOf("px")>-1}function g(e){return String(e).indexOf("%")>-1}function b(e){return e[0]||e}var v=c.startSymbol(),E=c.endSymbol(),$="{{"===v&&"}}"===E,C=function(e,n,o){var i=!1;if(e&&e.length){var r=u.getComputedStyle(e[0]);i=t.isDefined(r[n])&&(!o||r[n]==o)}return i},y={dom:{},now:e.performance?t.bind(e.performance,e.performance.now):Date.now||function(){return(new Date).getTime()},bidi:function(e,n,i,r){var a=!("rtl"==o[0].dir||"rtl"==o[0].body.dir);if(0==arguments.length)return a?"ltr":"rtl";var d=t.element(e);a&&t.isDefined(i)?d.css(n,h(i)):!a&&t.isDefined(r)&&d.css(n,h(r))},bidiProperty:function(e,n,i,r){var a=!("rtl"==o[0].dir||"rtl"==o[0].body.dir),d=t.element(e);a&&t.isDefined(n)?(d.css(n,h(r)),d.css(i,"")):!a&&t.isDefined(i)&&(d.css(i,h(r)),d.css(n,""))},clientRect:function(e,t,n){var o=b(e);t=b(t||o.offsetParent||document.body);var i=o.getBoundingClientRect(),r=n?t.getBoundingClientRect():{left:0,top:0,width:0,height:0};return{left:i.left-r.left,top:i.top-r.top,width:i.width,height:i.height}},offsetRect:function(e,t){return y.clientRect(e,t,!0)},nodesToArray:function(e){e=e||[];for(var t=[],n=0;n<e.length;++n)t.push(e.item(n));return t},scrollTop:function(e){e=t.element(e||o[0].body);var i=e[0]==o[0].body?o[0].body:n,r=i?i.scrollTop+i.parentElement.scrollTop:0;return r||Math.abs(e[0].getBoundingClientRect().top)},findFocusTarget:function(e,n){function o(e,n){var o,i=e[0].querySelectorAll(n);return i&&i.length&&i.length&&t.forEach(i,function(e){e=t.element(e);var n=e.hasClass("md-autofocus");n&&(o=e)}),o}var i,r=this.prefixer("md-autofocus",!0);return i=o(e,n||r),i||n==r||(i=o(e,this.prefixer("md-auto-focus",!0)),i||(i=o(e,r))),i},disableScrollAround:function(e,n,i){function r(e){function n(e){e.preventDefault()}e=t.element(e||s);var o;return i&&i.disableScrollMask?o=e:(e=e[0],o=t.element('<div class="md-scroll-mask">  <div class="md-scroll-mask-bar"></div></div>'),e.appendChild(o[0])),o.on("wheel",n),o.on("touchmove",n),function(){o.off("wheel"),o.off("touchmove"),o[0].parentNode.removeChild(o[0]),delete y.disableScrollAround._enableScrolling}}function a(){var e=s.parentNode,t=e.style.cssText||"",n=s.style.cssText||"",o=y.scrollTop(s),i=s.clientWidth;return s.scrollHeight>s.clientHeight+1&&(d(s,{position:"fixed",width:"100%",top:-o+"px"}),e.style.overflowY="scroll"),s.clientWidth<i&&d(s,{overflow:"hidden"}),function(){s.style.cssText=n,e.style.cssText=t,s.scrollTop=o,e.scrollTop=o}}function d(e,t){for(var n in t)e.style[n]=t[n]}if(y.disableScrollAround._count=y.disableScrollAround._count||0,++y.disableScrollAround._count,y.disableScrollAround._enableScrolling)return y.disableScrollAround._enableScrolling;var s=o[0].body,c=a(),l=r(n);return y.disableScrollAround._enableScrolling=function(){--y.disableScrollAround._count||(c(),l(),delete y.disableScrollAround._enableScrolling)}},enableScrolling:function(){var e=this.disableScrollAround._enableScrolling;e&&e()},floatingScrollbars:function(){if(this.floatingScrollbars.cached===n){var e=t.element("<div><div></div></div>").css({width:"100%","z-index":-1,position:"absolute",height:"35px","overflow-y":"scroll"});e.children().css("height","60px"),o[0].body.appendChild(e[0]),this.floatingScrollbars.cached=e[0].offsetWidth==e[0].childNodes[0].offsetWidth,e.remove()}return this.floatingScrollbars.cached},forceFocus:function(t){var n=t[0]||t;document.addEventListener("click",function i(e){e.target===n&&e.$focus&&(n.focus(),e.stopImmediatePropagation(),e.preventDefault(),n.removeEventListener("click",i))},!0);var o=document.createEvent("MouseEvents");o.initMouseEvent("click",!1,!0,e,{},0,0,0,0,!1,!1,!1,!1,0,null),o.$material=!0,o.$focus=!0,n.dispatchEvent(o)},createBackdrop:function(e,t){return a(y.supplant('<md-backdrop class="{0}">',[t]))(e)},supplant:function(e,t,n){return n=n||/\{([^\{\}]*)\}/g,e.replace(n,function(e,n){var o=n.split("."),i=t;try{for(var r in o)o.hasOwnProperty(r)&&(i=i[o[r]])}catch(a){i=e}return"string"==typeof i||"number"==typeof i?i:e})},fakeNgModel:function(){return{$fake:!0,$setTouched:t.noop,$setViewValue:function(e){this.$viewValue=e,this.$render(e),this.$viewChangeListeners.forEach(function(e){e()})},$isEmpty:function(e){return 0===(""+e).length},$parsers:[],$formatters:[],$viewChangeListeners:[],$render:t.noop}},debounce:function(e,t,o,i){var a;return function(){var d=o,s=Array.prototype.slice.call(arguments);r.cancel(a),a=r(function(){a=n,e.apply(d,s)},t||10,i)}},throttle:function(e,t){var n;return function(){var o=this,i=arguments,r=y.now();(!n||r-n>t)&&(e.apply(o,i),n=r)}},time:function(e){var t=y.now();return e(),y.now()-t},valueOnUse:function(e,t,n){var o=null,i=Array.prototype.slice.call(arguments),r=i.length>3?i.slice(3):[];Object.defineProperty(e,t,{get:function(){return null===o&&(o=n.apply(e,r)),o}})},nextUid:function(){return""+i++},disconnectScope:function(e){if(e&&e.$root!==e&&!e.$$destroyed){var t=e.$parent;e.$$disconnected=!0,t.$$childHead===e&&(t.$$childHead=e.$$nextSibling),t.$$childTail===e&&(t.$$childTail=e.$$prevSibling),e.$$prevSibling&&(e.$$prevSibling.$$nextSibling=e.$$nextSibling),e.$$nextSibling&&(e.$$nextSibling.$$prevSibling=e.$$prevSibling),e.$$nextSibling=e.$$prevSibling=null}},reconnectScope:function(e){if(e&&e.$root!==e&&e.$$disconnected){var t=e,n=t.$parent;t.$$disconnected=!1,t.$$prevSibling=n.$$childTail,n.$$childHead?(n.$$childTail.$$nextSibling=t,n.$$childTail=t):n.$$childHead=n.$$childTail=t}},getClosest:function(e,n,o){if(t.isString(n)){var i=n.toUpperCase();n=function(e){return e.nodeName===i}}if(e instanceof t.element&&(e=e[0]),o&&(e=e.parentNode),!e)return null;do if(n(e))return e;while(e=e.parentNode);return null},elementContains:function(n,o){var i=e.Node&&e.Node.prototype&&Node.prototype.contains,r=i?t.bind(n,n.contains):t.bind(n,function(e){return n===o||!!(16&this.compareDocumentPosition(e))});return r(o)},extractElementByName:function(e,n,o,i){function r(e){return a(e)||(o?d(e):null)}function a(e){if(e)for(var t=0,o=e.length;t<o;t++)if(e[t].nodeName.toLowerCase()===n)return e[t];return null}function d(e){var t;if(e)for(var n=0,o=e.length;n<o;n++){var i=e[n];if(!t)for(var a=0,d=i.childNodes.length;a<d;a++)t=t||r([i.childNodes[a]])}return t}var s=r(e);return!s&&i&&l.warn(y.supplant("Unable to find node '{0}' in element '{1}'.",[n,e[0].outerHTML])),t.element(s||e)},initOptionalProperties:function(e,n,o){o=o||{},t.forEach(e.$$isolateBindings,function(i,r){if(i.optional&&t.isUndefined(e[r])){var a=t.isDefined(n[i.attrName]);e[r]=t.isDefined(o[r])?o[r]:a}})},nextTick:function(e,t,n){function o(){var e=i.queue,t=i.digest;i.queue=[],i.timeout=null,i.digest=!1,e.forEach(function(e){var t=e.scope&&e.scope.$$destroyed;t||e.callback()}),t&&d.$digest()}var i=y.nextTick,a=i.timeout,s=i.queue||[];return s.push({scope:n,callback:e}),null==t&&(t=!0),i.digest=i.digest||t,i.queue=s,a||(i.timeout=r(o,0,!1))},processTemplate:function(e){return $?e:e&&t.isString(e)?e.replace(/\{\{/g,v).replace(/}}/g,E):e},getParentWithPointerEvents:function(e){for(var t=e.parent();C(t,"pointer-events","none");)t=t.parent();return t},getNearestContentElement:function(e){for(var t=e.parent()[0];t&&t!==m[0]&&t!==document.body&&"MD-CONTENT"!==t.nodeName.toUpperCase();)t=t.parentNode;return t},checkStickySupport:function(){var e,n=t.element("<div>");o[0].body.appendChild(n[0]);for(var i=["sticky","-webkit-sticky"],r=0;r<i.length;++r)if(n.css({position:i[r],top:0,"z-index":2}),n.css("position")==i[r]){e=i[r];break}return n.remove(),e},parseAttributeBoolean:function(e,t){return""===e||!!e&&(t===!1||"false"!==e&&"0"!==e)},hasComputedStyle:C,isParentFormSubmitted:function(e){var n=y.getClosest(e,"form"),o=n?t.element(n).controller("form"):null;return!!o&&o.$submitted},animateScrollTo:function(e,t){function n(){var i=o();e.scrollTop=i,(d?i<t:i>t)&&p(n)}function o(){var e=1e3,t=y.now()-s;return i(t,r,a,e)}function i(e,t,n,o){if(e>o)return t+n;var i=(e/=o)*e,r=i*e;return t+n*(-2*r+3*i)}var r=e.scrollTop,a=t-r,d=r<t,s=y.now();p(n)}};return y.dom.animator=s(y),y}var i=0;t.module("material.core").factory("$mdUtil",o),o.$inject=["$document","$timeout","$compile","$rootScope","$$mdAnimate","$interpolate","$log","$rootElement","$window","$$rAF"],t.element.prototype.focus=t.element.prototype.focus||function(){return this.length&&this[0].focus(),this},t.element.prototype.blur=t.element.prototype.blur||function(){return this.length&&this[0].blur(),this}}(),function(){function e(){function e(){t.showWarnings=!1}var t=this;return t.showWarnings=!0,{disableWarnings:e,$get:["$$rAF","$log","$window","$interpolate",function(e,o,i,r){return n.apply(t,arguments)}]}}function n(e,n,o,i){function r(e,o,i){var r=t.element(e)[0]||e;!r||r.hasAttribute(o)&&0!==r.getAttribute(o).length||l(r,o)||(i=t.isString(i)?i.trim():"",i.length?e.attr(o,i):m&&n.warn('ARIA: Attribute "',o,'", required for accessibility, is missing on node:',r))}function a(t,n,o){e(function(){r(t,n,o())})}function d(e,t){var n=c(e)||"",o=n.indexOf(i.startSymbol())>-1;o?a(e,t,function(){return c(e)}):r(e,t,n)}function s(e,t){var n=c(e),o=n.indexOf(i.startSymbol())>-1;o||n||r(e,t,n)}function c(e){function t(t){for(;t.parentNode&&(t=t.parentNode)!==e;)if(t.getAttribute&&"true"===t.getAttribute("aria-hidden"))return!0}e=e[0]||e;for(var n,o=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,null,!1),i="";n=o.nextNode();)t(n)||(i+=n.textContent);return i.trim()||""}function l(e,t){function n(e){var t=e.currentStyle?e.currentStyle:o.getComputedStyle(e);return"none"===t.display}var i=e.hasChildNodes(),r=!1;if(i)for(var a=e.childNodes,d=0;d<a.length;d++){var s=a[d];1===s.nodeType&&s.hasAttribute(t)&&(n(s)||(r=!0))}return r}var m=this.showWarnings;return{expect:r,expectAsync:a,expectWithText:d,expectWithoutText:s}}t.module("material.core").provider("$mdAria",e),n.$inject=["$$rAF","$log","$window","$interpolate"]}(),function(){function e(e,n,o,i,r){this.compile=function(a){var d=a.templateUrl,s=a.template||"",c=a.controller,l=a.controllerAs,m=t.extend({},a.resolve||{}),u=t.extend({},a.locals||{}),p=a.transformTemplate||t.identity,h=a.bindToController;return t.forEach(m,function(e,n){t.isString(e)?m[n]=o.get(e):m[n]=o.invoke(e)}),t.extend(m,u),d?m.$template=n(d).then(function(e){return e}):m.$template=e.when(s),e.all(m).then(function(e){var n,o=p(e.$template,a),d=a.element||t.element("<div>").html(o.trim()).contents(),s=i(d);return n={locals:e,element:d,link:function(o){if(e.$scope=o,c){var i=r(c,e,!0);h&&t.extend(i.instance,e);var a=i();d.data("$ngControllerController",a),d.children().data("$ngControllerController",a),l&&(o[l]=a),n.controller=a}return s(o)}}})}}t.module("material.core").service("$mdCompiler",e),e.$inject=["$q","$templateRequest","$injector","$compile","$controller"]}(),function(){function n(){}function o(n,o,i){function r(e){return function(t,n){n.distance<this.state.options.maxDistance&&this.dispatchEvent(t,e,n)}}function a(e,t,n){var o=h[t.replace(/^\$md./,"")];if(!o)throw new Error("Failed to register element with handler "+t+". Available handlers: "+Object.keys(h).join(", "));return o.registerElement(e,n)}function s(e,o){var i=new n(e);return t.extend(i,o),h[e]=i,v}function c(){for(var e=document.createElement("div"),n=["","webkit","Moz","MS","ms","o"],o=0;o<n.length;o++){var i=n[o],r=i?i+"TouchAction":"touchAction";if(t.isDefined(e.style[r]))return r}}var m=navigator.userAgent||navigator.vendor||e.opera,u=m.match(/ipad|iphone|ipod/i),p=m.match(/android/i),g=c(),b="undefined"!=typeof e.jQuery&&t.element===e.jQuery,v={handler:s,register:a,isIos:u,isAndroid:p,isHijackingClicks:(u||p)&&!b&&!f};if(v.isHijackingClicks){var E=6;v.handler("click",{options:{maxDistance:E},onEnd:r("click")}),v.handler("focus",{options:{maxDistance:E},onEnd:function(e,t){function n(e){var t=["INPUT","SELECT","BUTTON","TEXTAREA","VIDEO","AUDIO"];return"-1"!=e.getAttribute("tabindex")&&!e.hasAttribute("DISABLED")&&(e.hasAttribute("tabindex")||e.hasAttribute("href")||e.isContentEditable||t.indexOf(e.nodeName)!=-1)}t.distance<this.state.options.maxDistance&&n(e.target)&&(this.dispatchEvent(e,"focus",t),e.target.focus())}}),v.handler("mouseup",{options:{maxDistance:E},onEnd:r("mouseup")}),v.handler("mousedown",{onStart:function(e){this.dispatchEvent(e,"mousedown")}})}return v.handler("press",{onStart:function(e,t){this.dispatchEvent(e,"$md.pressdown")},onEnd:function(e,t){this.dispatchEvent(e,"$md.pressup")}}).handler("hold",{options:{maxDistance:6,delay:500},onCancel:function(){i.cancel(this.state.timeout)},onStart:function(e,n){return this.state.registeredParent?(this.state.pos={x:n.x,y:n.y},void(this.state.timeout=i(t.bind(this,function(){this.dispatchEvent(e,"$md.hold"),this.cancel()}),this.state.options.delay,!1))):this.cancel()},onMove:function(e,t){g||"touchmove"!==e.type||e.preventDefault();var n=this.state.pos.x-t.x,o=this.state.pos.y-t.y;Math.sqrt(n*n+o*o)>this.options.maxDistance&&this.cancel()},onEnd:function(){this.onCancel()}}).handler("drag",{options:{minDistance:6,horizontal:!0,cancelMultiplier:1.5},onSetup:function(e,t){g&&(this.oldTouchAction=e[0].style[g],e[0].style[g]=t.horizontal===!1?"pan-y":"pan-x")},onCleanup:function(e){this.oldTouchAction&&(e[0].style[g]=this.oldTouchAction)},onStart:function(e){this.state.registeredParent||this.cancel()},onMove:function(e,t){var n,o;g||"touchmove"!==e.type||e.preventDefault(),this.state.dragPointer?this.dispatchDragMove(e):(this.state.options.horizontal?(n=Math.abs(t.distanceX)>this.state.options.minDistance,o=Math.abs(t.distanceY)>this.state.options.minDistance*this.state.options.cancelMultiplier):(n=Math.abs(t.distanceY)>this.state.options.minDistance,o=Math.abs(t.distanceX)>this.state.options.minDistance*this.state.options.cancelMultiplier),n?(this.state.dragPointer=d(e),l(e,this.state.dragPointer),this.dispatchEvent(e,"$md.dragstart",this.state.dragPointer)):o&&this.cancel())},dispatchDragMove:o.throttle(function(e){this.state.isRunning&&(l(e,this.state.dragPointer),this.dispatchEvent(e,"$md.drag",this.state.dragPointer))}),onEnd:function(e,t){this.state.dragPointer&&(l(e,this.state.dragPointer),this.dispatchEvent(e,"$md.dragend",this.state.dragPointer))}}).handler("swipe",{options:{minVelocity:.65,minDistance:10},onEnd:function(e,t){var n;Math.abs(t.velocityX)>this.state.options.minVelocity&&Math.abs(t.distanceX)>this.state.options.minDistance?(n="left"==t.directionX?"$md.swipeleft":"$md.swiperight",this.dispatchEvent(e,n)):Math.abs(t.velocityY)>this.state.options.minVelocity&&Math.abs(t.distanceY)>this.state.options.minDistance&&(n="up"==t.directionY?"$md.swipeup":"$md.swipedown",this.dispatchEvent(e,n))}})}function i(e){this.name=e,this.state={}}function r(){function n(e,n,o){o=o||u;var i=new t.element.Event(n);i.$material=!0,i.pointer=o,i.srcEvent=e,t.extend(i,{clientX:o.x,clientY:o.y,screenX:o.x,screenY:o.y,pageX:o.x,pageY:o.y,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey}),t.element(o.target).trigger(i)}function o(t,n,o){o=o||u;var i;"click"===n||"mouseup"==n||"mousedown"==n?(i=document.createEvent("MouseEvents"),i.initMouseEvent(n,!0,!0,e,t.detail,o.x,o.y,o.x,o.y,t.ctrlKey,t.altKey,t.shiftKey,t.metaKey,t.button,t.relatedTarget||null)):(i=document.createEvent("CustomEvent"),i.initCustomEvent(n,!0,!0,{})),i.$material=!0,i.pointer=o,i.srcEvent=t,o.target.dispatchEvent(i)}var r="undefined"!=typeof e.jQuery&&t.element===e.jQuery;return i.prototype={options:{},dispatchEvent:r?n:o,onSetup:t.noop,onCleanup:t.noop,onStart:t.noop,onMove:t.noop,onEnd:t.noop,onCancel:t.noop,start:function(e,n){if(!this.state.isRunning){var o=this.getNearestParent(e.target),i=o&&o.$mdGesture[this.name]||{};this.state={isRunning:!0,options:t.extend({},this.options,i),registeredParent:o},this.onStart(e,n)}},move:function(e,t){this.state.isRunning&&this.onMove(e,t)},end:function(e,t){this.state.isRunning&&(this.onEnd(e,t),this.state.isRunning=!1)},cancel:function(e,t){this.onCancel(e,t),this.state={}},getNearestParent:function(e){for(var t=e;t;){if((t.$mdGesture||{})[this.name])return t;t=t.parentNode}return null},registerElement:function(e,t){function n(){delete e[0].$mdGesture[o.name],e.off("$destroy",n),o.onCleanup(e,t||{})}var o=this;return e[0].$mdGesture=e[0].$mdGesture||{},e[0].$mdGesture[this.name]=t||{},e.on("$destroy",n),o.onSetup(e,t||{}),n}},i}function a(e,n){function o(e){var t=!e.clientX&&!e.clientY;t||e.$material||e.isIonicTap||c(e)||(e.preventDefault(),e.stopPropagation())}function i(e){var t=0===e.clientX&&0===e.clientY;t||e.$material||e.isIonicTap||c(e)?(g=null,"label"==e.target.tagName.toLowerCase()&&(g={x:e.x,y:e.y})):(e.preventDefault(),e.stopPropagation(),g=null)}function r(e,t){var o;for(var i in h)o=h[i],o instanceof n&&("start"===e&&o.cancel(),o[e](t,u))}function a(e){if(!u){var t=+Date.now();p&&!s(e,p)&&t-p.endTime<1500||(u=d(e),r("start",e))}}function m(e){u&&s(e,u)&&(l(e,u),r("move",e))}function f(e){u&&s(e,u)&&(l(e,u),u.endTime=+Date.now(),r("end",e),p=u,u=null)}document.contains||(document.contains=function(e){return document.body.contains(e)}),!b&&e.isHijackingClicks&&(document.addEventListener("click",i,!0),document.addEventListener("mouseup",o,!0),document.addEventListener("mousedown",o,!0),document.addEventListener("focus",o,!0),b=!0);var v="mousedown touchstart pointerdown",E="mousemove touchmove pointermove",$="mouseup mouseleave touchend touchcancel pointerup pointercancel";t.element(document).on(v,a).on(E,m).on($,f).on("$$mdGestureReset",function(){p=u=null})}function d(e){var t=m(e),n={startTime:+Date.now(),target:e.target,type:e.type.charAt(0)};return n.startX=n.x=t.pageX,n.startY=n.y=t.pageY,n}function s(e,t){return e&&t&&e.type.charAt(0)===t.type}function c(e){return g&&g.x==e.x&&g.y==e.y}function l(e,t){var n=m(e),o=t.x=n.pageX,i=t.y=n.pageY;t.distanceX=o-t.startX,t.distanceY=i-t.startY,t.distance=Math.sqrt(t.distanceX*t.distanceX+t.distanceY*t.distanceY),t.directionX=t.distanceX>0?"right":t.distanceX<0?"left":"",t.directionY=t.distanceY>0?"down":t.distanceY<0?"up":"",t.duration=+Date.now()-t.startTime,t.velocityX=t.distanceX/t.duration,t.velocityY=t.distanceY/t.duration}function m(e){return e=e.originalEvent||e,e.touches&&e.touches[0]||e.changedTouches&&e.changedTouches[0]||e}var u,p,h={},f=!1,g=null,b=!1;t.module("material.core.gestures",[]).provider("$mdGesture",n).factory("$$MdGestureHandler",r).run(a),n.prototype={skipClickHijack:function(){return f=!0},$get:["$$MdGestureHandler","$$rAF","$timeout",function(e,t,n){return new o(e,t,n)}]},o.$inject=["$$MdGestureHandler","$$rAF","$timeout"],a.$inject=["$mdGesture","$$MdGestureHandler"]}(),function(){function e(){function e(e){function n(e){return s.optionsFactory=e.options,s.methods=(e.methods||[]).concat(a),c}function o(e,t){return d[e]=t,c}function i(t,n){if(n=n||{},n.methods=n.methods||[],n.options=n.options||function(){return{}},/^cancel|hide|show$/.test(t))throw new Error("Preset '"+t+"' in "+e+" is reserved!");if(n.methods.indexOf("_options")>-1)throw new Error("Method '_options' in "+e+" is reserved!");return s.presets[t]={methods:n.methods.concat(a),optionsFactory:n.options,argOption:n.argOption},c}function r(n,o){function i(e){return e=e||{},e._options&&(e=e._options),m.show(t.extend({},l,e))}function r(e){return m.destroy(e)}function a(t,n){var i={};return i[e]=u,o.invoke(t||function(){return n},{},i)}var c,l,m=n(),u={hide:m.hide,cancel:m.cancel,show:i,destroy:r};return c=s.methods||[],l=a(s.optionsFactory,{}),t.forEach(d,function(e,t){u[t]=e}),t.forEach(s.presets,function(e,n){function o(e){this._options=t.extend({},i,e)}var i=a(e.optionsFactory,{}),r=(e.methods||[]).concat(c);if(t.extend(i,{$type:n}),t.forEach(r,function(e){o.prototype[e]=function(t){return this._options[e]=t,this}}),e.argOption){var d="show"+n.charAt(0).toUpperCase()+n.slice(1);u[d]=function(e){var t=u[n](e);return u.show(t)}}u[n]=function(n){return arguments.length&&e.argOption&&!t.isObject(n)&&!t.isArray(n)?(new o)[e.argOption](n):new o(n)}}),u}var a=["onHide","onShow","onRemove"],d={},s={presets:{}},c={setDefaults:n,addPreset:i,addMethod:o,$get:r};return c.addPreset("build",{methods:["controller","controllerAs","resolve","template","templateUrl","themable","transformTemplate","parent"]}),r.$inject=["$$interimElement","$injector"],c}function o(e,o,i,r,a,d,s,c,l,m,u){return function(){function p(e){e=e||{};var t=new b(e||{}),n=!e.skipHide&&$.length?v.cancel():o.when(!0);return n["finally"](function(){$.push(t),t.show()["catch"](function(e){return e})}),t.deferred.promise}function h(e,t){function i(n){return n.remove(e,!1,t||{})["catch"](function(e){return e}),n.deferred.promise}if(!$.length)return o.when(e);if(t=t||{},t.closeAll){var r=o.all($.reverse().map(i));return $=[],r}if(t.closeTo!==n)return o.all($.splice(t.closeTo).map(i));var a=$.pop();return i(a)}function f(e,n){var i=$.pop();return i?(i.remove(e,!0,n||{})["catch"](function(e){return e}),i.deferred.promise["catch"](t.noop)):o.when(e)}function g(e){var n=e?null:$.shift(),i=t.element(e).length?t.element(e)[0].parentNode:null;if(i){var r=$.filter(function(e){var t=e.options.element[0];return t===i});r.length>0&&(n=r[0],$.splice($.indexOf(n),1))}return n?n.remove(E,!1,{$destroy:!0}):o.when(E)}function b(u){function p(){return o(function(e,t){function n(e){M.deferred.reject(e),t(e)}u.onCompiling&&u.onCompiling(u),g(u).then(function(t){T=b(t,u),A=C(T,u,t.controller).then(e,n)},n)})}function h(e,n,i){function r(e){M.deferred.resolve(e)}function a(e){M.deferred.reject(e)}return T?(u=t.extend(u||{},i||{}),u.cancelAutoHide&&u.cancelAutoHide(),u.element.triggerHandler("$mdInterimElementRemove"),u.$destroy===!0?y(u.element,u).then(function(){n&&a(e)||r(e)}):(o.when(A)["finally"](function(){y(u.element,u).then(function(){n&&a(e)||r(e)},a)}),M.deferred.promise)):o.when(!1)}function f(e){return e=e||{},e.template&&(e.template=c.processTemplate(e.template)),t.extend({preserveScope:!1,cancelAutoHide:t.noop,scope:e.scope||r.$new(e.isolateScope),onShow:function(e,t,n){return s.enter(t,n.parent)},onRemove:function(e,t){return t&&s.leave(t)||o.when()}},e)}function g(e){var t=e.skipCompile?null:l.compile(e);return t||o(function(t){t({locals:{},link:function(){return e.element}})})}function b(e,n){t.extend(e.locals,n);var o=e.link(n.scope);return n.element=o,n.parent=E(o,n),n.themable&&m(o),o}function E(n,o){var i=o.parent;if(i=t.isFunction(i)?i(o.scope,n,o):t.isString(i)?t.element(e[0].querySelector(i)):t.element(i),!(i||{}).length){var r;return d[0]&&d[0].querySelector&&(r=d[0].querySelector(":not(svg) > body")),r||(r=d[0]),"#comment"==r.nodeName&&(r=e[0].body),t.element(r)}return i}function $(){var e,o=t.noop;u.hideDelay&&(e=a(v.hide,u.hideDelay),o=function(){a.cancel(e)}),u.cancelAutoHide=function(){o(),u.cancelAutoHide=n}}function C(e,n,i){var r=n.onShowing||t.noop,a=n.onComplete||t.noop;return r(n.scope,e,n,i),o(function(t,r){try{o.when(n.onShow(n.scope,e,n,i)).then(function(){a(n.scope,e,n),$(),t(e)},r)}catch(d){r(d.message)}})}function y(e,n){var o=n.onRemoving||t.noop;return i(function(t,r){try{var a=i.when(n.onRemove(n.scope,e,n)||!0);o(e,a),1==n.$destroy?t(e):a.then(function(){!n.preserveScope&&n.scope&&n.scope.$destroy(),t(e)},r)}catch(d){r(d)}})}var M,T,A=o.when(!0);return u=f(u),M={options:u,deferred:o.defer(),show:p,remove:h}}var v,E=!1,$=[];return v={show:p,hide:h,cancel:f,destroy:g,$injector_:u}}}return e.$get=o,o.$inject=["$document","$q","$$q","$rootScope","$timeout","$rootElement","$animate","$mdUtil","$mdCompiler","$mdTheming","$injector"],e}t.module("material.core").provider("$$interimElement",e)}(),function(){!function(){function e(e){function d(e){return e.replace(m,"").replace(u,function(e,t,n,o){return o?n.toUpperCase():n})}var m=/^((?:x|data)[\:\-_])/i,u=/([\:\-\_]+(.))/g,p=["","xs","gt-xs","sm","gt-sm","md","gt-md","lg","gt-lg","xl","print"],h=["layout","flex","flex-order","flex-offset","layout-align"],f=["show","hide","layout-padding","layout-margin"];
t.forEach(p,function(n){t.forEach(h,function(t){var o=n?t+"-"+n:t;e.directive(d(o),r(o))}),t.forEach(f,function(t){var o=n?t+"-"+n:t;e.directive(d(o),a(o))})}),e.provider("$$mdLayout",function(){return{$get:t.noop,validateAttributeValue:l,validateAttributeUsage:c,disableLayouts:function(e){A.enabled=e!==!0}}}).directive("mdLayoutCss",o).directive("ngCloak",i("ng-cloak")).directive("layoutWrap",a("layout-wrap")).directive("layoutNowrap",a("layout-nowrap")).directive("layoutNoWrap",a("layout-no-wrap")).directive("layoutFill",a("layout-fill")).directive("layoutLtMd",s("layout-lt-md",!0)).directive("layoutLtLg",s("layout-lt-lg",!0)).directive("flexLtMd",s("flex-lt-md",!0)).directive("flexLtLg",s("flex-lt-lg",!0)).directive("layoutAlignLtMd",s("layout-align-lt-md")).directive("layoutAlignLtLg",s("layout-align-lt-lg")).directive("flexOrderLtMd",s("flex-order-lt-md")).directive("flexOrderLtLg",s("flex-order-lt-lg")).directive("offsetLtMd",s("flex-offset-lt-md")).directive("offsetLtLg",s("flex-offset-lt-lg")).directive("hideLtMd",s("hide-lt-md")).directive("hideLtLg",s("hide-lt-lg")).directive("showLtMd",s("show-lt-md")).directive("showLtLg",s("show-lt-lg")).config(n)}function n(){var e=!!document.querySelector("[md-layouts-disabled]");A.enabled=!e}function o(){return A.enabled=!1,{restrict:"A",priority:"900"}}function i(e){return["$timeout",function(n){return{restrict:"A",priority:-10,compile:function(o){return A.enabled?(o.addClass(e),function(t,o){n(function(){o.removeClass(e)},10,!1)}):t.noop}}}]}function r(e){function n(t,n,o){var i=d(n,e,o),r=o.$observe(o.$normalize(e),i);i(p(e,o,"")),t.$on("$destroy",function(){r()})}return["$mdUtil","$interpolate","$log",function(o,i,r){return g=o,b=i,v=r,{restrict:"A",compile:function(o,i){var r;return A.enabled&&(c(e,i,o,v),l(e,p(e,i,""),m(o,e,i)),r=n),r||t.noop}}}]}function a(e){function n(t,n){n.addClass(e)}return["$mdUtil","$interpolate","$log",function(o,i,r){return g=o,b=i,v=r,{restrict:"A",compile:function(o,i){var r;return A.enabled&&(l(e,p(e,i,""),m(o,e,i)),n(null,o),r=n),r||t.noop}}}]}function d(e,n){var o;return function(i){var r=l(n,i||"");t.isDefined(r)&&(o&&e.removeClass(o),o=r?n+"-"+r.replace($,"-"):n,e.addClass(o))}}function s(e){var n=e.split("-");return["$log",function(o){return o.warn(e+"has been deprecated. Please use a `"+n[0]+"-gt-<xxx>` variant."),t.noop}]}function c(e,t,n,o){var i,r,a,d=n[0].nodeName.toLowerCase();switch(e.replace(E,"")){case"flex":"md-button"!=d&&"fieldset"!=d||(r="<"+d+" "+e+"></"+d+">",a="https://github.com/philipwalton/flexbugs#9-some-html-elements-cant-be-flex-containers",i="Markup '{0}' may not work as expected in IE Browsers. Consult '{1}' for details.",o.warn(g.supplant(i,[r,a])))}}function l(e,n,o){var i=n;if(!u(n)){switch(e.replace(E,"")){case"layout":h(n,y)||(n=y[0]);break;case"flex":h(n,C)||isNaN(n)&&(n="");break;case"flex-offset":case"flex-order":n&&!isNaN(+n)||(n="0");break;case"layout-align":var r=f(n);n=g.supplant("{main}-{cross}",r);break;case"layout-padding":case"layout-margin":case"layout-fill":case"layout-wrap":case"layout-nowrap":case"layout-nowrap":n=""}n!=i&&(o||t.noop)(n)}return n}function m(e,t,n){return function(e){u(e)||(n[n.$normalize(t)]=e)}}function u(e){return(e||"").indexOf(b.startSymbol())>-1}function p(e,t,n){var o=t.$normalize(e);return t[o]?t[o].replace($,"-"):n||null}function h(e,t,n){e=n&&e?e.replace($,n):e;var o=!1;return e&&t.forEach(function(t){t=n?t.replace($,n):t,o=o||t===e}),o}function f(e){var t,n={main:"start",cross:"stretch"};return e=e||"",0!=e.indexOf("-")&&0!=e.indexOf(" ")||(e="none"+e),t=e.toLowerCase().trim().replace($,"-").split("-"),t.length&&"space"===t[0]&&(t=[t[0]+"-"+t[1],t[2]]),t.length>0&&(n.main=t[0]||n.main),t.length>1&&(n.cross=t[1]||n.cross),M.indexOf(n.main)<0&&(n.main="start"),T.indexOf(n.cross)<0&&(n.cross="stretch"),n}var g,b,v,E=/(-gt)?-(sm|md|lg|print)/g,$=/\s+/g,C=["grow","initial","auto","none","noshrink","nogrow"],y=["row","column"],M=["","start","center","end","stretch","space-around","space-between"],T=["","start","center","end","stretch"],A={enabled:!0,breakpoints:[]};e(t.module("material.core.layout",["ng"]))}()}(),function(){function e(e,o){function i(e){return e&&""!==e}var r,a=[],d={};return r={notFoundError:function(t,n){e.error((n||"")+"No instance found for handle",t)},getInstances:function(){return a},get:function(e){if(!i(e))return null;var t,n,o;for(t=0,n=a.length;t<n;t++)if(o=a[t],o.$$mdHandle===e)return o;return null},register:function(e,n){function o(){var t=a.indexOf(e);t!==-1&&a.splice(t,1)}function i(){var t=d[n];t&&(t.forEach(function(t){t.resolve(e)}),delete d[n])}return n?(e.$$mdHandle=n,a.push(e),i(),o):t.noop},when:function(e){if(i(e)){var t=o.defer(),a=r.get(e);return a?t.resolve(a):(d[e]===n&&(d[e]=[]),d[e].push(t)),t.promise}return o.reject("Invalid `md-component-id` value.")}}}t.module("material.core").factory("$mdComponentRegistry",e),e.$inject=["$log","$q"]}(),function(){!function(){function e(e){function n(e){return e.hasClass("md-icon-button")?{isMenuItem:e.hasClass("md-menu-item"),fitRipple:!0,center:!0}:{isMenuItem:e.hasClass("md-menu-item"),dimBackground:!0}}return{attach:function(o,i,r){return r=t.extend(n(i),r),e.attach(o,i,r)}}}t.module("material.core").factory("$mdButtonInkRipple",e),e.$inject=["$mdInkRipple"]}()}(),function(){!function(){function e(e){function n(n,o,i){return e.attach(n,o,t.extend({center:!0,dimBackground:!1,fitRipple:!0},i))}return{attach:n}}t.module("material.core").factory("$mdCheckboxInkRipple",e),e.$inject=["$mdInkRipple"]}()}(),function(){!function(){function e(e){function n(n,o,i){return e.attach(n,o,t.extend({center:!1,dimBackground:!0,outline:!1,rippleSize:"full"},i))}return{attach:n}}t.module("material.core").factory("$mdListInkRipple",e),e.$inject=["$mdInkRipple"]}()}(),function(){function e(e,n){return{controller:t.noop,link:function(t,o,i){i.hasOwnProperty("mdInkRippleCheckbox")?n.attach(t,o):e.attach(t,o)}}}function n(){function e(){n=!0}var n=!1;return{disableInkRipple:e,$get:["$injector",function(e){function i(i,r,a){return n||r.controller("mdNoInk")?t.noop:e.instantiate(o,{$scope:i,$element:r,rippleOptions:a})}return{attach:i}}]}}function o(e,n,o,i,r,a,d){this.$window=i,this.$timeout=r,this.$mdUtil=a,this.$mdColorUtil=d,this.$scope=e,this.$element=n,this.options=o,this.mousedown=!1,this.ripples=[],this.timeout=null,this.lastRipple=null,a.valueOnUse(this,"container",this.createContainer),this.$element.addClass("md-ink-ripple"),(n.controller("mdInkRipple")||{}).createRipple=t.bind(this,this.createRipple),(n.controller("mdInkRipple")||{}).setColor=t.bind(this,this.color),this.bindEvents()}function i(e,n){(e.mousedown||e.lastRipple)&&(e.mousedown=!1,e.$mdUtil.nextTick(t.bind(e,n),!1))}function r(){return{controller:t.noop}}t.module("material.core").provider("$mdInkRipple",n).directive("mdInkRipple",e).directive("mdNoInk",r).directive("mdNoBar",r).directive("mdNoStretch",r);var a=450;e.$inject=["$mdButtonInkRipple","$mdCheckboxInkRipple"],o.$inject=["$scope","$element","rippleOptions","$window","$timeout","$mdUtil","$mdColorUtil"],o.prototype.color=function(e){function n(){var e=o.options&&o.options.colorElement?o.options.colorElement:[],t=e.length?e[0]:o.$element[0];return t?o.$window.getComputedStyle(t).color:"rgb(0,0,0)"}var o=this;return t.isDefined(e)&&(o._color=o._parseColor(e)),o._color||o._parseColor(o.inkRipple())||o._parseColor(n())},o.prototype.calculateColor=function(){return this.color()},o.prototype._parseColor=function(e,t){t=t||1;var n=this.$mdColorUtil;if(e)return 0===e.indexOf("rgba")?e.replace(/\d?\.?\d*\s*\)\s*$/,(.1*t).toString()+")"):0===e.indexOf("rgb")?n.rgbToRgba(e):0===e.indexOf("#")?n.hexToRgba(e):void 0},o.prototype.bindEvents=function(){this.$element.on("mousedown",t.bind(this,this.handleMousedown)),this.$element.on("mouseup touchend",t.bind(this,this.handleMouseup)),this.$element.on("mouseleave",t.bind(this,this.handleMouseup)),this.$element.on("touchmove",t.bind(this,this.handleTouchmove))},o.prototype.handleMousedown=function(e){if(!this.mousedown)if(e.hasOwnProperty("originalEvent")&&(e=e.originalEvent),this.mousedown=!0,this.options.center)this.createRipple(this.container.prop("clientWidth")/2,this.container.prop("clientWidth")/2);else if(e.srcElement!==this.$element[0]){var t=this.$element[0].getBoundingClientRect(),n=e.clientX-t.left,o=e.clientY-t.top;this.createRipple(n,o)}else this.createRipple(e.offsetX,e.offsetY)},o.prototype.handleMouseup=function(){i(this,this.clearRipples)},o.prototype.handleTouchmove=function(){i(this,this.deleteRipples)},o.prototype.deleteRipples=function(){for(var e=0;e<this.ripples.length;e++)this.ripples[e].remove()},o.prototype.clearRipples=function(){for(var e=0;e<this.ripples.length;e++)this.fadeInComplete(this.ripples[e])},o.prototype.createContainer=function(){var e=t.element('<div class="md-ripple-container"></div>');return this.$element.append(e),e},o.prototype.clearTimeout=function(){this.timeout&&(this.$timeout.cancel(this.timeout),this.timeout=null)},o.prototype.isRippleAllowed=function(){var e=this.$element[0];do{if(!e.tagName||"BODY"===e.tagName)break;if(e&&t.isFunction(e.hasAttribute)){if(e.hasAttribute("disabled"))return!1;if("false"===this.inkRipple()||"0"===this.inkRipple())return!1}}while(e=e.parentNode);return!0},o.prototype.inkRipple=function(){return this.$element.attr("md-ink-ripple")},o.prototype.createRipple=function(e,n){function o(e,t,n){return e?Math.max(t,n):Math.sqrt(Math.pow(t,2)+Math.pow(n,2))}if(this.isRippleAllowed()){var i=this,r=i.$mdColorUtil,d=t.element('<div class="md-ripple"></div>'),s=this.$element.prop("clientWidth"),c=this.$element.prop("clientHeight"),l=2*Math.max(Math.abs(s-e),e),m=2*Math.max(Math.abs(c-n),n),u=o(this.options.fitRipple,l,m),p=this.calculateColor();d.css({left:e+"px",top:n+"px",background:"black",width:u+"px",height:u+"px",backgroundColor:r.rgbaToRgb(p),borderColor:r.rgbaToRgb(p)}),this.lastRipple=d,this.clearTimeout(),this.timeout=this.$timeout(function(){i.clearTimeout(),i.mousedown||i.fadeInComplete(d)},.35*a,!1),this.options.dimBackground&&this.container.css({backgroundColor:p}),this.container.append(d),this.ripples.push(d),d.addClass("md-ripple-placed"),this.$mdUtil.nextTick(function(){d.addClass("md-ripple-scaled md-ripple-active"),i.$timeout(function(){i.clearRipples()},a,!1)},!1)}},o.prototype.fadeInComplete=function(e){this.lastRipple===e?this.timeout||this.mousedown||this.removeRipple(e):this.removeRipple(e)},o.prototype.removeRipple=function(e){var t=this,n=this.ripples.indexOf(e);n<0||(this.ripples.splice(this.ripples.indexOf(e),1),e.removeClass("md-ripple-active"),e.addClass("md-ripple-remove"),0===this.ripples.length&&this.container.css({backgroundColor:""}),this.$timeout(function(){t.fadeOutComplete(e)},a,!1))},o.prototype.fadeOutComplete=function(e){e.remove(),this.lastRipple=null}}(),function(){!function(){function e(e){function n(n,o,i){return e.attach(n,o,t.extend({center:!1,dimBackground:!0,outline:!1,rippleSize:"full"},i))}return{attach:n}}t.module("material.core").factory("$mdTabInkRipple",e),e.$inject=["$mdInkRipple"]}()}(),function(){t.module("material.core.theming.palette",[]).constant("$mdColorPalette",{red:{50:"#ffebee",100:"#ffcdd2",200:"#ef9a9a",300:"#e57373",400:"#ef5350",500:"#f44336",600:"#e53935",700:"#d32f2f",800:"#c62828",900:"#b71c1c",A100:"#ff8a80",A200:"#ff5252",A400:"#ff1744",A700:"#d50000",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 300 A100",contrastStrongLightColors:"400 500 600 700 A200 A400 A700"},pink:{50:"#fce4ec",100:"#f8bbd0",200:"#f48fb1",300:"#f06292",400:"#ec407a",500:"#e91e63",600:"#d81b60",700:"#c2185b",800:"#ad1457",900:"#880e4f",A100:"#ff80ab",A200:"#ff4081",A400:"#f50057",A700:"#c51162",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 A100",contrastStrongLightColors:"500 600 A200 A400 A700"},purple:{50:"#f3e5f5",100:"#e1bee7",200:"#ce93d8",300:"#ba68c8",400:"#ab47bc",500:"#9c27b0",600:"#8e24aa",700:"#7b1fa2",800:"#6a1b9a",900:"#4a148c",A100:"#ea80fc",A200:"#e040fb",A400:"#d500f9",A700:"#aa00ff",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 A100",contrastStrongLightColors:"300 400 A200 A400 A700"},"deep-purple":{50:"#ede7f6",100:"#d1c4e9",200:"#b39ddb",300:"#9575cd",400:"#7e57c2",500:"#673ab7",600:"#5e35b1",700:"#512da8",800:"#4527a0",900:"#311b92",A100:"#b388ff",A200:"#7c4dff",A400:"#651fff",A700:"#6200ea",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 A100",contrastStrongLightColors:"300 400 A200"},indigo:{50:"#e8eaf6",100:"#c5cae9",200:"#9fa8da",300:"#7986cb",400:"#5c6bc0",500:"#3f51b5",600:"#3949ab",700:"#303f9f",800:"#283593",900:"#1a237e",A100:"#8c9eff",A200:"#536dfe",A400:"#3d5afe",A700:"#304ffe",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 A100",contrastStrongLightColors:"300 400 A200 A400"},blue:{50:"#e3f2fd",100:"#bbdefb",200:"#90caf9",300:"#64b5f6",400:"#42a5f5",500:"#2196f3",600:"#1e88e5",700:"#1976d2",800:"#1565c0",900:"#0d47a1",A100:"#82b1ff",A200:"#448aff",A400:"#2979ff",A700:"#2962ff",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 300 400 A100",contrastStrongLightColors:"500 600 700 A200 A400 A700"},"light-blue":{50:"#e1f5fe",100:"#b3e5fc",200:"#81d4fa",300:"#4fc3f7",400:"#29b6f6",500:"#03a9f4",600:"#039be5",700:"#0288d1",800:"#0277bd",900:"#01579b",A100:"#80d8ff",A200:"#40c4ff",A400:"#00b0ff",A700:"#0091ea",contrastDefaultColor:"dark",contrastLightColors:"600 700 800 900 A700",contrastStrongLightColors:"600 700 800 A700"},cyan:{50:"#e0f7fa",100:"#b2ebf2",200:"#80deea",300:"#4dd0e1",400:"#26c6da",500:"#00bcd4",600:"#00acc1",700:"#0097a7",800:"#00838f",900:"#006064",A100:"#84ffff",A200:"#18ffff",A400:"#00e5ff",A700:"#00b8d4",contrastDefaultColor:"dark",contrastLightColors:"700 800 900",contrastStrongLightColors:"700 800 900"},teal:{50:"#e0f2f1",100:"#b2dfdb",200:"#80cbc4",300:"#4db6ac",400:"#26a69a",500:"#009688",600:"#00897b",700:"#00796b",800:"#00695c",900:"#004d40",A100:"#a7ffeb",A200:"#64ffda",A400:"#1de9b6",A700:"#00bfa5",contrastDefaultColor:"dark",contrastLightColors:"500 600 700 800 900",contrastStrongLightColors:"500 600 700"},green:{50:"#e8f5e9",100:"#c8e6c9",200:"#a5d6a7",300:"#81c784",400:"#66bb6a",500:"#4caf50",600:"#43a047",700:"#388e3c",800:"#2e7d32",900:"#1b5e20",A100:"#b9f6ca",A200:"#69f0ae",A400:"#00e676",A700:"#00c853",contrastDefaultColor:"dark",contrastLightColors:"500 600 700 800 900",contrastStrongLightColors:"500 600 700"},"light-green":{50:"#f1f8e9",100:"#dcedc8",200:"#c5e1a5",300:"#aed581",400:"#9ccc65",500:"#8bc34a",600:"#7cb342",700:"#689f38",800:"#558b2f",900:"#33691e",A100:"#ccff90",A200:"#b2ff59",A400:"#76ff03",A700:"#64dd17",contrastDefaultColor:"dark",contrastLightColors:"700 800 900",contrastStrongLightColors:"700 800 900"},lime:{50:"#f9fbe7",100:"#f0f4c3",200:"#e6ee9c",300:"#dce775",400:"#d4e157",500:"#cddc39",600:"#c0ca33",700:"#afb42b",800:"#9e9d24",900:"#827717",A100:"#f4ff81",A200:"#eeff41",A400:"#c6ff00",A700:"#aeea00",contrastDefaultColor:"dark",contrastLightColors:"900",contrastStrongLightColors:"900"},yellow:{50:"#fffde7",100:"#fff9c4",200:"#fff59d",300:"#fff176",400:"#ffee58",500:"#ffeb3b",600:"#fdd835",700:"#fbc02d",800:"#f9a825",900:"#f57f17",A100:"#ffff8d",A200:"#ffff00",A400:"#ffea00",A700:"#ffd600",contrastDefaultColor:"dark"},amber:{50:"#fff8e1",100:"#ffecb3",200:"#ffe082",300:"#ffd54f",400:"#ffca28",500:"#ffc107",600:"#ffb300",700:"#ffa000",800:"#ff8f00",900:"#ff6f00",A100:"#ffe57f",A200:"#ffd740",A400:"#ffc400",A700:"#ffab00",contrastDefaultColor:"dark"},orange:{50:"#fff3e0",100:"#ffe0b2",200:"#ffcc80",300:"#ffb74d",400:"#ffa726",500:"#ff9800",600:"#fb8c00",700:"#f57c00",800:"#ef6c00",900:"#e65100",A100:"#ffd180",A200:"#ffab40",A400:"#ff9100",A700:"#ff6d00",contrastDefaultColor:"dark",contrastLightColors:"800 900",contrastStrongLightColors:"800 900"},"deep-orange":{50:"#fbe9e7",100:"#ffccbc",200:"#ffab91",300:"#ff8a65",400:"#ff7043",500:"#ff5722",600:"#f4511e",700:"#e64a19",800:"#d84315",900:"#bf360c",A100:"#ff9e80",A200:"#ff6e40",A400:"#ff3d00",A700:"#dd2c00",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 300 400 A100 A200",contrastStrongLightColors:"500 600 700 800 900 A400 A700"},brown:{50:"#efebe9",100:"#d7ccc8",200:"#bcaaa4",300:"#a1887f",400:"#8d6e63",500:"#795548",600:"#6d4c41",700:"#5d4037",800:"#4e342e",900:"#3e2723",A100:"#d7ccc8",A200:"#bcaaa4",A400:"#8d6e63",A700:"#5d4037",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 A100 A200",contrastStrongLightColors:"300 400"},grey:{50:"#fafafa",100:"#f5f5f5",200:"#eeeeee",300:"#e0e0e0",400:"#bdbdbd",500:"#9e9e9e",600:"#757575",700:"#616161",800:"#424242",900:"#212121",A100:"#ffffff",A200:"#000000",A400:"#303030",A700:"#616161",contrastDefaultColor:"dark",contrastLightColors:"600 700 800 900 A200 A400 A700"},"blue-grey":{50:"#eceff1",100:"#cfd8dc",200:"#b0bec5",300:"#90a4ae",400:"#78909c",500:"#607d8b",600:"#546e7a",700:"#455a64",800:"#37474f",900:"#263238",A100:"#cfd8dc",A200:"#b0bec5",A400:"#78909c",A700:"#455a64",contrastDefaultColor:"light",contrastDarkColors:"50 100 200 300 A100 A200",contrastStrongLightColors:"400 500 700"}})}(),function(){!function(e){function t(e){var t=!!document.querySelector("[md-themes-disabled]");e.disableTheming(t)}function o(t){function o(e,t){return t=t||{},p[e]=r(e,t),m}function i(t,n){return r(t,e.extend({},p[t]||{},n))}function r(e,t){var n=w.filter(function(e){return!t[e]});if(n.length)throw new Error("Missing colors %1 in palette %2!".replace("%1",n.join(", ")).replace("%2",e));return t}function a(t,n){if(h[t])return h[t];n=n||"default";var o="string"==typeof n?h[n]:n,i=new s(t);return o&&e.forEach(o.colors,function(t,n){i.colors[n]={name:t.name,hues:e.extend({},t.hues)}}),h[t]=i,i}function s(t){function n(t){if(t=0===arguments.length||!!t,t!==o.isDark){o.isDark=t,o.foregroundPalette=o.isDark?g:f,o.foregroundShadow=o.isDark?b:v;var n=o.isDark?A:T,i=o.isDark?T:A;return e.forEach(n,function(e,t){var n=o.colors[t],r=i[t];if(n)for(var a in n.hues)n.hues[a]===r[a]&&(n.hues[a]=e[a])}),o}}var o=this;o.name=t,o.colors={},o.dark=n,n(!1),y.forEach(function(t){var n=(o.isDark?A:T)[t];o[t+"Palette"]=function(i,r){var a=o.colors[t]={name:i,hues:e.extend({},n,r)};return Object.keys(a.hues).forEach(function(e){if(!n[e])throw new Error("Invalid hue name '%1' in theme %2's %3 color %4. Available hue names: %4".replace("%1",e).replace("%2",o.name).replace("%3",i).replace("%4",Object.keys(n).join(", ")))}),Object.keys(a.hues).map(function(e){return a.hues[e]}).forEach(function(e){if(w.indexOf(e)==-1)throw new Error("Invalid hue value '%1' in theme %2's %3 color %4. Available hue values: %5".replace("%1",e).replace("%2",o.name).replace("%3",t).replace("%4",i).replace("%5",w.join(", ")))}),o},o[t+"Color"]=function(){var e=Array.prototype.slice.call(arguments);return console.warn("$mdThemingProviderTheme."+t+"Color() has been deprecated. Use $mdThemingProviderTheme."+t+"Palette() instead."),o[t+"Palette"].apply(o,e)}})}function l(t,o){function i(e){return e===n||""===e||a.THEMES[e]!==n}function r(n,r){function a(){return c=r.controller("mdTheme")||n.data("$mdThemeController"),c&&c.$mdTheme||("default"==$?"":$)}function d(e){if(e){i(e)||o.warn("Attempted to use unregistered theme '"+e+"'. Register it with $mdThemingProvider.theme().");var t=n.data("$mdThemeName");t&&n.removeClass("md-"+t+"-theme"),n.addClass("md-"+e+"-theme"),n.data("$mdThemeName",e),c&&n.data("$mdThemeController",c)}}function s(){var e=r.controller("mdTheme");return!!e&&(n.on("$destroy",e.registerChanges(function(){d(a())})),!0)}var c=r.controller("mdTheme"),l=n.attr("md-theme-watch"),m=(E||e.isDefined(l))&&"false"!=l;d(a()),(E&&!s()||!E&&m)&&n.on("$destroy",t.$watch(a,d))}var a=function(e,o){o===n&&(o=e,e=n),e===n&&(e=t),a.inherit(o,o)};return a.THEMES=e.extend({},h),a.PALETTES=e.extend({},p),a.inherit=r,a.registered=i,a.defaultTheme=function(){return $},a.generateTheme=function(e){c(h[e],e,k.nonce)},a}p={};var m,h={},E=!1,$="default";return e.extend(p,t),l.$inject=["$rootScope","$log"],m={definePalette:o,extendPalette:i,theme:a,configuration:function(){var t={defaultTheme:$,alwaysWatchTheme:E};return e.extend({},config,t)},disableTheming:function(t){k.disableTheming=e.isUndefined(t)||!!t},registerStyles:function(e){k.registeredStyles.push(e)},setNonce:function(e){k.nonce=e},generateThemesOnDemand:function(e){k.generateOnDemand=e},setDefaultTheme:function(e){$=e},alwaysWatchTheme:function(e){E=e},$get:l,_LIGHT_DEFAULT_HUES:T,_DARK_DEFAULT_HUES:A,_PALETTES:p,_THEMES:h,_parseRules:d,_rgba:u}}function i(t,n,o){return{priority:100,link:{pre:function(i,r,a){var d=[],s={registerChanges:function(t,n){return n&&(t=e.bind(n,t)),d.push(t),function(){var e=d.indexOf(t);e>-1&&d.splice(e,1)}},$setTheme:function(e){t.registered(e)||o.warn("attempted to use unregistered theme '"+e+"'"),s.$mdTheme=e,d.forEach(function(e){e()})}};r.data("$mdThemeController",s),s.$setTheme(n(a.mdTheme)(i)),a.$observe("mdTheme",s.$setTheme)}}}}function r(){return k.disableTheming=!0,{restrict:"A",priority:"900"}}function a(e){return e}function d(t,n,o){l(t,n),o=o.replace(/THEME_NAME/g,t.name);var i=[],r=t.colors[n],a=new RegExp("\\.md-"+t.name+"-theme","g"),d=new RegExp("('|\")?{{\\s*("+n+")-(color|contrast)-?(\\d\\.?\\d*)?\\s*}}(\"|')?","g"),s=/'?"?\{\{\s*([a-zA-Z]+)-(A?\d+|hue\-[0-3]|shadow|default)-?(\d\.?\d*)?(contrast)?\s*\}\}'?"?/g,c=p[r.name];return o=o.replace(s,function(e,n,o,i,r){return"foreground"===n?"shadow"==o?t.foregroundShadow:t.foregroundPalette[o]||t.foregroundPalette[1]:(0!==o.indexOf("hue")&&"default"!==o||(o=t.colors[n].hues[o]),u((p[t.colors[n].name][o]||"")[r?"contrast":"value"],i))}),e.forEach(r.hues,function(e,n){var r=o.replace(d,function(t,n,o,i,r){return u(c[e]["color"===i?"value":"contrast"],r)});if("default"!==n&&(r=r.replace(a,".md-"+t.name+"-theme.md-"+n)),"default"==t.name){var s=/((?:(?:(?: |>|\.|\w|-|:|\(|\)|\[|\]|"|'|=)+) )?)((?:(?:\w|\.|-)+)?)\.md-default-theme((?: |>|\.|\w|-|:|\(|\)|\[|\]|"|'|=)*)/g;r=r.replace(s,function(e,t,n,o){return e+", "+t+n+o})}i.push(r)}),i}function s(t,n){function o(t,n){var o=t.contrastDefaultColor,i=t.contrastLightColors||[],r=t.contrastStrongLightColors||[],a=t.contrastDarkColors||[];"string"==typeof i&&(i=i.split(" ")),"string"==typeof r&&(r=r.split(" ")),"string"==typeof a&&(a=a.split(" ")),delete t.contrastDefaultColor,delete t.contrastLightColors,delete t.contrastStrongLightColors,delete t.contrastDarkColors,e.forEach(t,function(n,d){function s(){return"light"===o?a.indexOf(d)>-1?E:r.indexOf(d)>-1?C:$:i.indexOf(d)>-1?r.indexOf(d)>-1?C:$:E}if(!e.isObject(n)){var c=m(n);if(!c)throw new Error("Color %1, in palette %2's hue %3, is invalid. Hex or rgb(a) color expected.".replace("%1",n).replace("%2",t.name).replace("%3",d));t[d]={value:c,contrast:s()}}})}var i=document.head,r=i?i.firstElementChild:null,a=!k.disableTheming&&t.has("$MD_THEME_CSS")?t.get("$MD_THEME_CSS"):"";if(a+=k.registeredStyles.join(""),r&&0!==a.length){e.forEach(p,o);var d=a.split(/\}(?!(\}|'|"|;))/).filter(function(e){return e&&e.trim().length}).map(function(e){return e.trim()+"}"}),s=new RegExp("md-("+y.join("|")+")","g");y.forEach(function(e){_[e]=""}),d.forEach(function(e){for(var t,n=(e.match(s),0);t=y[n];n++)if(e.indexOf(".md-"+t)>-1)return _[t]+=e;for(n=0;t=y[n];n++)if(e.indexOf(t)>-1)return _[t]+=e;return _[M]+=e}),k.generateOnDemand||e.forEach(n.THEMES,function(e){h[e.name]||"default"!==n.defaultTheme()&&"default"===e.name||c(e,e.name,k.nonce)})}}function c(e,t,n){var o=document.head,i=o?o.firstElementChild:null;h[t]||(y.forEach(function(t){for(var r=d(e,t,_[t]);r.length;){var a=r.shift();if(a){var s=document.createElement("style");s.setAttribute("md-theme-style",""),n&&s.setAttribute("nonce",n),s.appendChild(document.createTextNode(a)),o.insertBefore(s,i)}}}),h[e.name]=!0)}function l(e,t){if(!p[(e.colors[t]||{}).name])throw new Error("You supplied an invalid color palette for theme %1's %2 palette. Available palettes: %3".replace("%1",e.name).replace("%2",t).replace("%3",Object.keys(p).join(", ")))}function m(t){if(e.isArray(t)&&3==t.length)return t;if(/^rgb/.test(t))return t.replace(/(^\s*rgba?\(|\)\s*$)/g,"").split(",").map(function(e,t){return 3==t?parseFloat(e,10):parseInt(e,10)});if("#"==t.charAt(0)&&(t=t.substring(1)),/^([a-fA-F0-9]{3}){1,2}$/g.test(t)){var n=t.length/3,o=t.substr(0,n),i=t.substr(n,n),r=t.substr(2*n);return 1===n&&(o+=o,i+=i,r+=r),[parseInt(o,16),parseInt(i,16),parseInt(r,16)]}}function u(t,n){return t?(4==t.length&&(t=e.copy(t),n?t.pop():n=t.pop()),n&&("number"==typeof n||"string"==typeof n&&n.length)?"rgba("+t.join(",")+","+n+")":"rgb("+t.join(",")+")"):"rgb('0,0,0')"}e.module("material.core.theming",["material.core.theming.palette"]).directive("mdTheme",i).directive("mdThemable",a).directive("mdThemesDisabled",r).provider("$mdTheming",o).config(t).run(s),t.$inject=["$mdThemingProvider"];var p,h={},f={name:"dark",1:"rgba(0,0,0,0.87)",2:"rgba(0,0,0,0.54)",3:"rgba(0,0,0,0.38)",4:"rgba(0,0,0,0.12)"},g={name:"light",1:"rgba(255,255,255,1.0)",2:"rgba(255,255,255,0.7)",3:"rgba(255,255,255,0.5)",4:"rgba(255,255,255,0.12)"},b="1px 1px 0px rgba(0,0,0,0.4), -1px -1px 0px rgba(0,0,0,0.4)",v="",E=m("rgba(0,0,0,0.87)"),$=m("rgba(255,255,255,0.87)"),C=m("rgb(255,255,255)"),y=["primary","accent","warn","background"],M="primary",T={accent:{"default":"A200","hue-1":"A100","hue-2":"A400","hue-3":"A700"},background:{"default":"50","hue-1":"A100","hue-2":"100","hue-3":"300"}},A={background:{"default":"A400","hue-1":"800","hue-2":"900","hue-3":"A200"}};y.forEach(function(e){var t={"default":"500","hue-1":"300","hue-2":"800","hue-3":"A100"};T[e]||(T[e]=t),A[e]||(A[e]=t)});var w=["50","100","200","300","400","500","600","700","800","900","A100","A200","A400","A700"],k={disableTheming:!1,generateOnDemand:!1,registeredStyles:[],nonce:null};o.$inject=["$mdColorPalette"],i.$inject=["$mdTheming","$interpolate","$log"],a.$inject=["$mdTheming"];var _={};s.$inject=["$injector","$mdTheming"]}(e.angular)}(),function(){function n(n,o,i,r,a){var d;return d={translate3d:function(e,t,n,o){function i(n){return a(e,{to:n||t,addClass:o.transitionOutClass,removeClass:o.transitionInClass}).start()}return a(e,{from:t,to:n,addClass:o.transitionInClass,removeClass:o.transitionOutClass}).start().then(function(){return i})},waitTransitionEnd:function(t,n){var a=3e3;return o(function(o,d){function s(e){e&&e.target!==t[0]||(e&&i.cancel(l),t.off(r.CSS.TRANSITIONEND,s),o())}function c(n){return n=n||e.getComputedStyle(t[0]),"0s"==n.transitionDuration||!n.transition&&!n.transitionProperty}n=n||{},c(n.cachedTransitionStyles)&&(a=0);var l=i(s,n.timeout||a);t.on(r.CSS.TRANSITIONEND,s)})},calculateTransformValues:function(e,t){function n(){var t=e?e.parent():null,n=t?t.parent():null;return n?d.clientRect(n):null}var o=t.element,i=t.bounds;if(o||i){var r=o?d.clientRect(o)||n():d.copyRect(i),a=d.copyRect(e[0].getBoundingClientRect()),s=d.centerPointFor(a),c=d.centerPointFor(r);return{centerX:c.x-s.x,centerY:c.y-s.y,scaleX:Math.round(100*Math.min(.5,r.width/a.width))/100,scaleY:Math.round(100*Math.min(.5,r.height/a.height))/100}}return{centerX:0,centerY:0,scaleX:.5,scaleY:.5}},calculateZoomToOrigin:function(e,o){var i="translate3d( {centerX}px, {centerY}px, 0 ) scale( {scaleX}, {scaleY} )",r=t.bind(null,n.supplant,i);return r(d.calculateTransformValues(e,o))},calculateSlideToOrigin:function(e,o){var i="translate3d( {centerX}px, {centerY}px, 0 )",r=t.bind(null,n.supplant,i);return r(d.calculateTransformValues(e,o))},toCss:function(e){function n(e,n,i){t.forEach(n.split(" "),function(e){o[e]=i})}var o={},i="left top right bottom width height x y min-width min-height max-width max-height";return t.forEach(e,function(e,a){if(!t.isUndefined(e))if(i.indexOf(a)>=0)o[a]=e+"px";else switch(a){case"transition":n(a,r.CSS.TRANSITION,e);break;case"transform":n(a,r.CSS.TRANSFORM,e);break;case"transformOrigin":n(a,r.CSS.TRANSFORM_ORIGIN,e);break;case"font-size":o["font-size"]=e}}),o},toTransformCss:function(e,n,o){var i={};return t.forEach(r.CSS.TRANSFORM.split(" "),function(t){i[t]=e}),n&&(o=o||"all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important",i.transition=o),i},copyRect:function(e,n){return e?(n=n||{},t.forEach("left top right bottom width height".split(" "),function(t){n[t]=Math.round(e[t])}),n.width=n.width||n.right-n.left,n.height=n.height||n.bottom-n.top,n):null},clientRect:function(e){var n=t.element(e)[0].getBoundingClientRect(),o=function(e){return e&&e.width>0&&e.height>0};return o(n)?d.copyRect(n):null},centerPointFor:function(e){return e?{x:Math.round(e.left+e.width/2),y:Math.round(e.top+e.height/2)}:{x:0,y:0}}}}t.module("material.core").factory("$$mdAnimate",["$q","$timeout","$mdConstant","$animateCss",function(e,t,o,i){return function(r){return n(r,e,t,o,i)}}])}(),function(){t.version.minor>=4?t.module("material.core.animate",[]):!function(){function e(e){return e.replace(/-[a-z]/g,function(e){return e.charAt(1).toUpperCase()})}var n=t.forEach,o=t.isDefined(document.documentElement.style.WebkitAppearance),i=o?"-webkit-":"",r=(o?"webkitTransitionEnd ":"")+"transitionend",a=(o?"webkitAnimationEnd ":"")+"animationend",d=["$document",function(e){return function(){return e[0].body.clientWidth+1}}],s=["$$rAF",function(e){return function(){var t=!1;return e(function(){t=!0}),function(n){t?n():e(n)}}}],c=["$q","$$rAFMutex",function(e,o){function i(e){this.setHost(e),this._doneCallbacks=[],this._runInAnimationFrame=o(),this._state=0}var r=0,a=1,d=2;return i.prototype={setHost:function(e){this.host=e||{}},done:function(e){this._state===d?e():this._doneCallbacks.push(e)},progress:t.noop,getPromise:function(){if(!this.promise){var t=this;this.promise=e(function(e,n){t.done(function(t){t===!1?n():e()})})}return this.promise},then:function(e,t){return this.getPromise().then(e,t)},"catch":function(e){return this.getPromise()["catch"](e)},"finally":function(e){return this.getPromise()["finally"](e)},pause:function(){this.host.pause&&this.host.pause()},resume:function(){this.host.resume&&this.host.resume()},end:function(){this.host.end&&this.host.end(),this._resolve(!0)},cancel:function(){this.host.cancel&&this.host.cancel(),this._resolve(!1)},complete:function(e){var t=this;t._state===r&&(t._state=a,t._runInAnimationFrame(function(){t._resolve(e)}))},_resolve:function(e){this._state!==d&&(n(this._doneCallbacks,function(t){t(e)}),this._doneCallbacks.length=0,this._state=d)}},i.all=function(e,t){function o(n){r=r&&n,++i===e.length&&t(r)}var i=0,r=!0;n(e,function(e){e.done(o)})},i}];t.module("material.core.animate",[]).factory("$$forceReflow",d).factory("$$AnimateRunner",c).factory("$$rAFMutex",s).factory("$animateCss",["$window","$$rAF","$$AnimateRunner","$$forceReflow","$$jqLite","$timeout","$animate",function(t,d,s,c,l,m,u){function p(o,d){var c=[],l=C(o),p=l&&u.enabled(),g=!1,M=!1;p&&(d.transitionStyle&&c.push([i+"transition",d.transitionStyle]),d.keyframeStyle&&c.push([i+"animation",d.keyframeStyle]),d.delay&&c.push([i+"transition-delay",d.delay+"s"]),d.duration&&c.push([i+"transition-duration",d.duration+"s"]),g=d.keyframeStyle||d.to&&(d.duration>0||d.transitionStyle),M=!!d.addClass||!!d.removeClass,y(o,!0));var T=p&&(g||M);E(o,d);var A,w,k=!1;return{close:t.close,start:function(){function t(){if(!k)return k=!0,A&&w&&o.off(A,w),h(o,d),v(o,d),n(c,function(t){l.style[e(t[0])]=""}),u.complete(!0),u}var u=new s;return b(function(){if(y(o,!1),!T)return t();n(c,function(t){var n=t[0],o=t[1];l.style[e(n)]=o}),h(o,d);var s=f(o);if(0===s.duration)return t();var u=[];d.easing&&(s.transitionDuration&&u.push([i+"transition-timing-function",d.easing]),s.animationDuration&&u.push([i+"animation-timing-function",d.easing])),d.delay&&s.animationDelay&&u.push([i+"animation-delay",d.delay+"s"]),d.duration&&s.animationDuration&&u.push([i+"animation-duration",d.duration+"s"]),n(u,function(t){var n=t[0],o=t[1];l.style[e(n)]=o,c.push(t)});var p=s.delay,g=1e3*p,b=s.duration,v=1e3*b,E=Date.now();A=[],s.transitionDuration&&A.push(r),s.animationDuration&&A.push(a),A=A.join(" "),w=function(e){e.stopPropagation();var n=e.originalEvent||e,o=n.timeStamp||Date.now(),i=parseFloat(n.elapsedTime.toFixed(3));
Math.max(o-E,0)>=g&&i>=b&&t()},o.on(A,w),$(o,d),m(t,g+1.5*v,!1)}),u}}}function h(e,t){t.addClass&&(l.addClass(e,t.addClass),t.addClass=null),t.removeClass&&(l.removeClass(e,t.removeClass),t.removeClass=null)}function f(e){function n(e){return o?"Webkit"+e.charAt(0).toUpperCase()+e.substr(1):e}var i=C(e),r=t.getComputedStyle(i),a=g(r[n("transitionDuration")]),d=g(r[n("animationDuration")]),s=g(r[n("transitionDelay")]),c=g(r[n("animationDelay")]);d*=parseInt(r[n("animationIterationCount")],10)||1;var l=Math.max(d,a),m=Math.max(c,s);return{duration:l,delay:m,animationDuration:d,transitionDuration:a,animationDelay:c,transitionDelay:s}}function g(e){var t=0,o=(e||"").split(/\s*,\s*/);return n(o,function(e){"s"==e.charAt(e.length-1)&&(e=e.substring(0,e.length-1)),e=parseFloat(e)||0,t=t?Math.max(e,t):e}),t}function b(e){M&&M(),T.push(e),M=d(function(){M=null;for(var e=c(),t=0;t<T.length;t++)T[t](e);T.length=0})}function v(e,t){E(e,t),$(e,t)}function E(e,t){t.from&&(e.css(t.from),t.from=null)}function $(e,t){t.to&&(e.css(t.to),t.to=null)}function C(e){for(var t=0;t<e.length;t++)if(1===e[t].nodeType)return e[t]}function y(t,n){var o=C(t),r=e(i+"transition-delay");o.style[r]=n?"-9999s":""}var M,T=[];return p}])}()}(),function(){t.module("material.components.autocomplete",["material.core","material.components.icon","material.components.virtualRepeat"])}(),function(){t.module("material.components.backdrop",["material.core"]).directive("mdBackdrop",["$mdTheming","$mdUtil","$animate","$rootElement","$window","$log","$$rAF","$document",function(e,n,o,i,r,a,d,s){function c(c,m,u){function p(){var e=parseInt(h.height,10)+Math.abs(parseInt(h.top,10));m.css("height",e+"px")}o.pin&&o.pin(m,i);var h;d(function(){if(h=r.getComputedStyle(s[0].body),"fixed"===h.position){var o=n.debounce(function(){h=r.getComputedStyle(s[0].body),p()},60,null,!1);p(),t.element(r).on("resize",o),c.$on("$destroy",function(){t.element(r).off("resize",o)})}var i=m.parent();if(i.length){"BODY"===i[0].nodeName&&m.css("position","fixed");var d=r.getComputedStyle(i[0]);"static"===d.position&&a.warn(l),e.inherit(m,i)}})}var l="<md-backdrop> may not work properly in a scrolled, static-positioned parent container.";return{restrict:"E",link:c}}])}(),function(){function e(e){return{restrict:"E",link:function(t,n){n.addClass("_md"),t.$on("$destroy",function(){e.destroy()})}}}function n(e){function n(e,n,r,a,d,s,c,l){function m(o,i,c,m){if(i=r.extractElementByName(i,"md-bottom-sheet"),i.attr("tabindex","-1"),i.hasClass("ng-cloak")){var u="$mdBottomSheet: using `<md-bottom-sheet ng-cloak >` will affect the bottom-sheet opening animations.";l.warn(u,i[0])}c.disableBackdrop||(h=r.createBackdrop(o,"md-bottom-sheet-backdrop md-opaque"),h[0].tabIndex=-1,c.clickOutsideToClose&&h.on("click",function(){r.nextTick(d.cancel,!0)}),a.inherit(h,c.parent),e.enter(h,c.parent,null));var f=new p(i,c.parent);return c.bottomSheet=f,a.inherit(f.element,c.parent),c.disableParentScroll&&(c.restoreScroll=r.disableScrollAround(f.element,c.parent)),e.enter(f.element,c.parent,h).then(function(){var e=r.findFocusTarget(i)||t.element(i[0].querySelector("button")||i[0].querySelector("a")||i[0].querySelector(r.prefixer("ng-click",!0)))||h;c.escapeToClose&&(c.rootElementKeyupCallback=function(e){e.keyCode===n.KEY_CODE.ESCAPE&&r.nextTick(d.cancel,!0)},s.on("keyup",c.rootElementKeyupCallback),e&&e.focus())})}function u(t,n,o){var i=o.bottomSheet;return o.disableBackdrop||e.leave(h),e.leave(i.element).then(function(){o.disableParentScroll&&(o.restoreScroll(),delete o.restoreScroll),i.cleanup()})}function p(e,t){function a(t){e.css(n.CSS.TRANSITION_DURATION,"0ms")}function s(t){var o=t.pointer.distanceY;o<5&&(o=Math.max(-i,o/2)),e.css(n.CSS.TRANSFORM,"translate3d(0,"+(i+o)+"px,0)")}function l(t){if(t.pointer.distanceY>0&&(t.pointer.distanceY>20||Math.abs(t.pointer.velocityY)>o)){var i=e.prop("offsetHeight")-t.pointer.distanceY,a=Math.min(i/t.pointer.velocityY*.75,500);e.css(n.CSS.TRANSITION_DURATION,a+"ms"),r.nextTick(d.cancel,!0)}else e.css(n.CSS.TRANSITION_DURATION,""),e.css(n.CSS.TRANSFORM,"")}var m=c.register(t,"drag",{horizontal:!1});return t.on("$md.dragstart",a).on("$md.drag",s).on("$md.dragend",l),{element:e,cleanup:function(){m(),t.off("$md.dragstart",a),t.off("$md.drag",s),t.off("$md.dragend",l)}}}var h;return{themable:!0,onShow:m,onRemove:u,disableBackdrop:!1,escapeToClose:!0,clickOutsideToClose:!0,disableParentScroll:!0}}var o=.5,i=80;return n.$inject=["$animate","$mdConstant","$mdUtil","$mdTheming","$mdBottomSheet","$rootElement","$mdGesture","$log"],e("$mdBottomSheet").setDefaults({methods:["disableParentScroll","escapeToClose","clickOutsideToClose"],options:n})}t.module("material.components.bottomSheet",["material.core","material.components.backdrop"]).directive("mdBottomSheet",e).provider("$mdBottomSheet",n),e.$inject=["$mdBottomSheet"],n.$inject=["$$interimElementProvider"]}(),function(){function e(e){return{restrict:"E",link:function(t,n){e(n)}}}function n(e,n,o,i){function r(e){return t.isDefined(e.href)||t.isDefined(e.ngHref)||t.isDefined(e.ngLink)||t.isDefined(e.uiSref)}function a(e,t){if(r(t))return'<a class="md-button" ng-transclude></a>';var n="undefined"==typeof t.type?"button":t.type;return'<button class="md-button" type="'+n+'" ng-transclude></button>'}function d(a,d,s){n(d),e.attach(a,d),o.expectWithoutText(d,"aria-label"),r(s)&&t.isDefined(s.ngDisabled)&&a.$watch(s.ngDisabled,function(e){d.attr("tabindex",e?-1:0)}),d.on("click",function(e){s.disabled===!0&&(e.preventDefault(),e.stopImmediatePropagation())}),d.hasClass("md-no-focus")||(a.mouseActive=!1,d.on("mousedown",function(){a.mouseActive=!0,i(function(){a.mouseActive=!1},100)}).on("focus",function(){a.mouseActive===!1&&d.addClass("md-focused")}).on("blur",function(e){d.removeClass("md-focused")}))}return{restrict:"EA",replace:!0,transclude:!0,template:a,link:d}}t.module("material.components.button",["material.core"]).directive("mdButton",n).directive("a",e),e.$inject=["$mdTheming"],n.$inject=["$mdButtonInkRipple","$mdTheming","$mdAria","$timeout"]}(),function(){function e(e){return{restrict:"E",link:function(t,n,o){n.addClass("_md"),e(n)}}}t.module("material.components.card",["material.core"]).directive("mdCard",e),e.$inject=["$mdTheming"]}(),function(){function e(e,n,o,i,r,a){function d(d,s){function c(d,s,c,l){function m(e,t,n){c[e]&&d.$watch(c[e],function(e){n[e]&&s.attr(t,n[e])})}function u(e){var t=e.which||e.keyCode;t!==o.KEY_CODE.SPACE&&t!==o.KEY_CODE.ENTER||(e.preventDefault(),s.addClass("md-focused"),p(e))}function p(e){s[0].hasAttribute("disabled")||d.skipToggle||d.$apply(function(){var t=c.ngChecked?c.checked:!l.$viewValue;l.$setViewValue(t,e&&e.type),l.$render()})}function h(){s.toggleClass("md-checked",!!l.$viewValue&&!g)}function f(e){g=e!==!1,g&&s.attr("aria-checked","mixed"),s.toggleClass("md-indeterminate",g)}var g;l=l||r.fakeNgModel(),i(s),s.children().on("focus",function(){s.focus()}),r.parseAttributeBoolean(c.mdIndeterminate)&&(f(),d.$watch(c.mdIndeterminate,f)),c.ngChecked&&d.$watch(d.$eval.bind(d,c.ngChecked),l.$setViewValue.bind(l)),m("ngDisabled","tabindex",{"true":"-1","false":c.tabindex}),n.expectWithText(s,"aria-label"),e.link.pre(d,{on:t.noop,0:{}},c,[l]),d.mouseActive=!1,s.on("click",p).on("keypress",u).on("mousedown",function(){d.mouseActive=!0,a(function(){d.mouseActive=!1},100)}).on("focus",function(){d.mouseActive===!1&&s.addClass("md-focused")}).on("blur",function(){s.removeClass("md-focused")}),l.$render=h}return s.$set("tabindex",s.tabindex||"0"),s.$set("type","checkbox"),s.$set("role",s.type),{pre:function(e,t){t.on("click",function(e){this.hasAttribute("disabled")&&e.stopImmediatePropagation()})},post:c}}return e=e[0],{restrict:"E",transclude:!0,require:"?ngModel",priority:210,template:'<div class="md-container" md-ink-ripple md-ink-ripple-checkbox><div class="md-icon"></div></div><div ng-transclude class="md-label"></div>',compile:d}}t.module("material.components.checkbox",["material.core"]).directive("mdCheckbox",e),e.$inject=["inputDirective","$mdAria","$mdConstant","$mdTheming","$mdUtil","$timeout"]}(),function(){t.module("material.components.chips",["material.core","material.components.autocomplete"])}(),function(){!function(){function e(e,n,o){function i(e,t){try{t&&e.css(s(t))}catch(n){o.error(n.message)}}function a(e){var t=l(e);return d(t)}function d(t,o){o=o||!1;var i=e.PALETTES[t.palette][t.hue];return i=o?i.contrast:i.value,n.supplant("rgba({0}, {1}, {2}, {3})",[i[0],i[1],i[2],i[3]||t.opacity])}function s(e){var n={},o=e.hasOwnProperty("color");return t.forEach(e,function(e,t){var i=l(e),r=t.indexOf("background")>-1;n[t]=d(i),r&&!o&&(n.color=d(i,!0))}),n}function c(n){return t.isDefined(e.THEMES[n.split("-")[0]])}function l(n){var o=n.split("-"),i=t.isDefined(e.THEMES[o[0]]),r=i?o.splice(0,1)[0]:e.defaultTheme();return{theme:r,palette:m(o,r),hue:u(o,r),opacity:o[2]||1}}function m(t,o){var i=t.length>1&&r.indexOf(t[1])!==-1,a=t[0].replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase();if(i&&(a=t[0]+"-"+t.splice(1,1)),r.indexOf(a)===-1){var d=e.THEMES[o].colors[a];if(!d)throw new Error(n.supplant("mdColors: couldn't find '{palette}' in the palettes.",{palette:a}));a=d.name}return a}function u(t,o){var i=e.THEMES[o].colors;if("hue"===t[1]){var r=parseInt(t.splice(2,1)[0],10);if(r<1||r>3)throw new Error(n.supplant("mdColors: 'hue-{hueNumber}' is not a valid hue, can be only 'hue-1', 'hue-2' and 'hue-3'",{hueNumber:r}));if(t[1]="hue-"+r,!(t[0]in i))throw new Error(n.supplant("mdColors: 'hue-x' can only be used with [{availableThemes}], but was used with '{usedTheme}'",{availableThemes:Object.keys(i).join(", "),usedTheme:t[0]}));return i[t[0]].hues[t[1]]}return t[1]||i[t[0]in i?t[0]:"primary"].hues["default"]}return r=r||Object.keys(e.PALETTES),{applyThemeColors:i,getThemeColor:a,hasTheme:c}}function o(e,n,o,r){return{restrict:"A",require:["^?mdTheme"],compile:function(a,d){function s(){var e=d.mdColors,o=e.indexOf("::")>-1,r=!!o||i.test(d.mdColors);d.mdColors=e.replace("::","");var a=t.isDefined(d.mdColorsWatch);return!o&&!r&&(!a||n.parseAttributeBoolean(d.mdColorsWatch))}var c=s();return function(n,i,a,d){var s=d[0],l={},m=function(t){"string"!=typeof t&&(t=""),a.mdColors||(a.mdColors="{}");var o=r(a.mdColors)(n);return s&&Object.keys(o).forEach(function(n){var i=o[n];e.hasTheme(i)||(o[n]=(t||s.$mdTheme)+"-"+i)}),u(o),o},u=function(e){if(!t.equals(e,l)){var n=Object.keys(l);l.background&&!n.color&&n.push("color"),n.forEach(function(e){i.css(e,"")})}l=e},p=t.noop;s&&(p=s.registerChanges(function(t){e.applyThemeColors(i,m(t))})),n.$on("$destroy",function(){p()});try{c?n.$watch(m,t.bind(this,e.applyThemeColors,i),!0):e.applyThemeColors(i,m())}catch(h){o.error(h.message)}}}}}var i=/^{((\s|,)*?["'a-zA-Z-]+?\s*?:\s*?('|")[a-zA-Z0-9-.]*('|"))+\s*}$/,r=n;t.module("material.components.colors",["material.core"]).directive("mdColors",o).service("$mdColors",e),e.$inject=["$mdTheming","$mdUtil","$log"],o.$inject=["$mdColors","$mdUtil","$log","$parse"]}()}(),function(){function e(e){function t(e,t){this.$scope=e,this.$element=t}return{restrict:"E",controller:["$scope","$element",t],link:function(t,o){o.addClass("_md"),e(o),t.$broadcast("$mdContentLoaded",o),n(o[0])}}}function n(e){t.element(e).on("$md.pressdown",function(t){"t"===t.pointer.type&&(t.$materialScrollFixed||(t.$materialScrollFixed=!0,0===e.scrollTop?e.scrollTop=1:e.scrollHeight===e.scrollTop+e.offsetHeight&&(e.scrollTop-=1)))})}t.module("material.components.content",["material.core"]).directive("mdContent",e),e.$inject=["$mdTheming"]}(),function(){t.module("material.components.datepicker",["material.core","material.components.icon","material.components.virtualRepeat"])}(),function(){function e(e,n,o){return{restrict:"E",link:function(i,r){r.addClass("_md"),n(r),e(function(){function e(){r.toggleClass("md-content-overflow",a.scrollHeight>a.clientHeight)}var n,a=r[0].querySelector("md-dialog-content");a&&(n=a.getElementsByTagName("img"),e(),t.element(n).on("load",e)),i.$on("$destroy",function(){o.destroy(r)})})}}}function o(e){function o(e,t){return{template:['<md-dialog md-theme="{{ dialog.theme }}" aria-label="{{ dialog.ariaLabel }}" ng-class="dialog.css">','  <md-dialog-content class="md-dialog-content" role="document" tabIndex="-1">','    <h2 class="md-title">{{ dialog.title }}</h2>','    <div ng-if="::dialog.mdHtmlContent" class="md-dialog-content-body" ','        ng-bind-html="::dialog.mdHtmlContent"></div>','    <div ng-if="::!dialog.mdHtmlContent" class="md-dialog-content-body">',"      <p>{{::dialog.mdTextContent}}</p>","    </div>",'    <md-input-container md-no-float ng-if="::dialog.$type == \'prompt\'" class="md-prompt-input-container">','      <input ng-keypress="dialog.keypress($event)" md-autofocus ng-model="dialog.result"              placeholder="{{::dialog.placeholder}}">',"    </md-input-container>","  </md-dialog-content>","  <md-dialog-actions>",'    <md-button ng-if="dialog.$type === \'confirm\' || dialog.$type === \'prompt\'"               ng-click="dialog.abort()" class="md-primary">',"      {{ dialog.cancel }}","    </md-button>",'    <md-button ng-click="dialog.hide()" class="md-primary" md-autofocus="dialog.$type===\'alert\'">',"      {{ dialog.ok }}","    </md-button>","  </md-dialog-actions>","</md-dialog>"].join("").replace(/\s\s+/g,""),controller:function(){var n="prompt"==this.$type;n&&this.initialValue&&(this.result=this.initialValue),this.hide=function(){e.hide(!n||this.result)},this.abort=function(){e.cancel()},this.keypress=function(n){n.keyCode===t.KEY_CODE.ENTER&&e.hide(this.result)}},controllerAs:"dialog",bindToController:!0}}function i(e,o,i,d,s,c,l,m,u,p,h){function f(e){E(e)}function g(e,t,n,o){if(o){if(o.mdHtmlContent=o.htmlContent||n.htmlContent||"",o.mdTextContent=o.textContent||n.textContent||o.content||n.content||"",o.mdHtmlContent&&!p.has("$sanitize"))throw Error("The ngSanitize module must be loaded in order to use htmlContent.");if(o.mdHtmlContent&&o.mdTextContent)throw Error("md-dialog cannot have both `htmlContent` and `textContent`")}}function b(e,n,o,r){function a(){n[0].querySelector(".md-actions")&&u.warn("Using a class of md-actions is deprecated, please use <md-dialog-actions>.")}function d(){function e(){var e=n[0].querySelector(".dialog-close");if(!e){var o=n[0].querySelectorAll(".md-actions button, md-dialog-actions button");e=o[o.length-1]}return t.element(e)}if(o.focusOnOpen){var r=i.findFocusTarget(n)||e();r.focus()}}if(t.element(c[0].body).addClass("md-dialog-is-showing"),o.contentElement){var s=o.contentElement;t.isString(s)?(s=document.querySelector(s),o.elementInsertionSibling=s.nextElementSibling,o.elementInsertionParent=s.parentNode):(s=s[0]||s,document.contains(s)&&(o.elementInsertionSibling=s.nextElementSibling,o.elementInsertionParent=s.parentNode)),o.elementInsertionEntry=s,n=t.element(s)}var l=n.find("md-dialog");if(l.hasClass("ng-cloak")){var m="$mdDialog: using `<md-dialog ng-cloak >` will affect the dialog opening animations.";u.warn(m,n[0])}return $(o),M(l,o),y(e,n,o),C(n,o),w(n,o).then(function(){T(n,o),a(),d()})}function v(e,n,o){function i(){return k(n,o)}function d(){o.contentElement&&(o.reverseContainerStretch(),o.elementInsertionParent?o.elementInsertionSibling?o.elementInsertionParent.insertBefore(o.elementInsertionEntry,o.elementInsertionSibling):o.elementInsertionParent.appendChild(o.elementInsertionEntry):o.elementInsertionEntry.parentNode.removeChild(o.elementInsertionEntry))}function s(){t.element(c[0].body).removeClass("md-dialog-is-showing"),o.contentElement?d():n.remove(),o.$destroy||o.origin.focus()}return o.deactivateListeners(),o.unlockScreenReader(),o.hideBackdrop(o.$destroy),r&&r.parentNode&&r.parentNode.removeChild(r),a&&a.parentNode&&a.parentNode.removeChild(a),o.$destroy?s():i().then(s)}function E(e){if(!e.theme&&(e.theme=h.defaultTheme(),e.targetEvent&&e.targetEvent.target)){var n=t.element(e.targetEvent.target);e.theme=(n.controller("mdTheme")||{}).$mdTheme||e.theme}}function $(e){function o(e,o){var i=t.element(e||{});if(i&&i.length){var r={top:0,left:0,height:0,width:0},a=t.isFunction(i[0].getBoundingClientRect);return t.extend(o||{},{element:a?i:n,bounds:a?i[0].getBoundingClientRect():t.extend({},r,i[0]),focus:t.bind(i,i.focus)})}}function i(e,n){return t.isString(e)&&(e=c[0].querySelector(e)),t.element(e||n)}e.origin=t.extend({element:null,bounds:null,focus:t.noop},e.origin||{}),e.parent=i(e.parent,m),e.closeTo=o(i(e.closeTo)),e.openFrom=o(i(e.openFrom)),e.targetEvent&&(e.origin=o(e.targetEvent.target,e.origin))}function C(n,o){var r=t.element(l),a=i.debounce(function(){A(n,o)},60),s=[],c=function(){var t="alert"==o.$type?e.hide:e.cancel;i.nextTick(t,!0)};if(o.escapeToClose){var m=o.parent,u=function(e){e.keyCode===d.KEY_CODE.ESCAPE&&(e.stopPropagation(),e.preventDefault(),c())};n.on("keydown",u),m.on("keydown",u),s.push(function(){n.off("keydown",u),m.off("keydown",u)})}if(r.on("resize",a),s.push(function(){r.off("resize",a)}),o.clickOutsideToClose){var p,h=n,f=function(e){p=e.target},g=function(e){p===h[0]&&e.target===h[0]&&(e.stopPropagation(),e.preventDefault(),c())};h.on("mousedown",f),h.on("mouseup",g),s.push(function(){h.off("mousedown",f),h.off("mouseup",g)})}o.deactivateListeners=function(){s.forEach(function(e){e()}),o.deactivateListeners=null}}function y(e,t,n){n.disableParentScroll&&(n.restoreScroll=i.disableScrollAround(t,n.parent)),n.hasBackdrop&&(n.backdrop=i.createBackdrop(e,"md-dialog-backdrop md-opaque"),s.enter(n.backdrop,n.parent)),n.hideBackdrop=function(e){n.backdrop&&(e?n.backdrop.remove():s.leave(n.backdrop)),n.disableParentScroll&&(n.restoreScroll(),delete n.restoreScroll),n.hideBackdrop=null}}function M(e,t){var n="alert"===t.$type?"alertdialog":"dialog",d=e.find("md-dialog-content"),s=e.attr("id"),c="dialogContent_"+(s||i.nextUid());e.attr({role:n,tabIndex:"-1"}),0===d.length&&(d=e,s&&(c=s)),d.attr("id",c),e.attr("aria-describedby",c),t.ariaLabel?o.expect(e,"aria-label",t.ariaLabel):o.expectAsync(e,"aria-label",function(){var e=d.text().split(/\s+/);return e.length>3&&(e=e.slice(0,3).concat("...")),e.join(" ")}),r=document.createElement("div"),r.classList.add("md-dialog-focus-trap"),r.tabIndex=0,a=r.cloneNode(!1);var l=function(){e.focus()};r.addEventListener("focus",l),a.addEventListener("focus",l),e[0].parentNode.insertBefore(r,e[0]),e.after(a)}function T(e,t){function n(e){for(;e.parentNode;){if(e===document.body)return;for(var t=e.parentNode.children,i=0;i<t.length;i++)e===t[i]||_(t[i],["SCRIPT","STYLE"])||t[i].setAttribute("aria-hidden",o);n(e=e.parentNode)}}var o=!0;n(e[0]),t.unlockScreenReader=function(){o=!1,n(e[0]),t.unlockScreenReader=null}}function A(e,t){var n="fixed"==l.getComputedStyle(c[0].body).position,o=t.backdrop?l.getComputedStyle(t.backdrop[0]):null,r=o?Math.min(c[0].body.clientHeight,Math.ceil(Math.abs(parseInt(o.height,10)))):0,a={top:e.css("top"),height:e.css("height")};return e.css({top:(n?i.scrollTop(t.parent):0)+"px",height:r?r+"px":"100%"}),function(){e.css(a)}}function w(e,t){t.parent.append(e),t.reverseContainerStretch=A(e,t);var n=e.find("md-dialog"),o=i.dom.animator,r=o.calculateZoomToOrigin,a={transitionInClass:"md-transition-in",transitionOutClass:"md-transition-out"},d=o.toTransformCss(r(n,t.openFrom||t.origin)),s=o.toTransformCss("");return t.fullscreen&&n.addClass("md-dialog-fullscreen"),o.translate3d(n,d,s,a).then(function(e){return t.reverseAnimate=function(){return delete t.reverseAnimate,t.closeTo?(a={transitionInClass:"md-transition-out",transitionOutClass:"md-transition-in"},d=s,s=o.toTransformCss(r(n,t.closeTo)),o.translate3d(n,d,s,a)):e(s=o.toTransformCss(r(n,t.origin)))},t.clearAnimate=function(){return delete t.clearAnimate,o.translate3d(n,s,o.toTransformCss(""),{})},!0})}function k(e,t){return t.reverseAnimate().then(function(){t.contentElement&&t.clearAnimate()})}function _(e,t){if(t.indexOf(e.nodeName)!==-1)return!0}return{hasBackdrop:!0,isolateScope:!0,onCompiling:f,onShow:b,onShowing:g,onRemove:v,clickOutsideToClose:!1,escapeToClose:!0,targetEvent:null,contentElement:null,closeTo:null,openFrom:null,focusOnOpen:!0,disableParentScroll:!0,autoWrap:!0,fullscreen:!1,transformTemplate:function(e,t){function n(e){return t.autoWrap&&!/<\/md-dialog>/g.test(e)?"<md-dialog>"+(e||"")+"</md-dialog>":e||""}return'<div class="md-dialog-container" tabindex="-1">'+n(e)+"</div>"}}}var r,a;return o.$inject=["$mdDialog","$mdConstant"],i.$inject=["$mdDialog","$mdAria","$mdUtil","$mdConstant","$animate","$document","$window","$rootElement","$log","$injector","$mdTheming"],e("$mdDialog").setDefaults({methods:["disableParentScroll","hasBackdrop","clickOutsideToClose","escapeToClose","targetEvent","closeTo","openFrom","parent","fullscreen","contentElement"],options:i}).addPreset("alert",{methods:["title","htmlContent","textContent","content","ariaLabel","ok","theme","css"],options:o}).addPreset("confirm",{methods:["title","htmlContent","textContent","content","ariaLabel","ok","cancel","theme","css"],options:o}).addPreset("prompt",{methods:["title","htmlContent","textContent","initialValue","content","placeholder","ariaLabel","ok","cancel","theme","css"],options:o})}t.module("material.components.dialog",["material.core","material.components.backdrop"]).directive("mdDialog",e).provider("$mdDialog",o),e.$inject=["$$rAF","$mdTheming","$mdDialog"],o.$inject=["$$interimElementProvider"]}(),function(){function e(e){return{restrict:"E",link:e}}t.module("material.components.divider",["material.core"]).directive("mdDivider",e),e.$inject=["$mdTheming"]}(),function(){!function(){function e(e){return{restrict:"E",require:["^?mdFabSpeedDial","^?mdFabToolbar"],compile:function(t,n){var o=t.children(),i=e.prefixer().hasAttribute(o,"ng-repeat");i?o.addClass("md-fab-action-item"):o.wrap('<div class="md-fab-action-item">')}}}t.module("material.components.fabActions",["material.core"]).directive("mdFabActions",e),e.$inject=["$mdUtil"]}()}(),function(){!function(){function e(e,n,o,i,r,a){function d(){S.direction=S.direction||"down",S.isOpen=S.isOpen||!1,l(),n.addClass("md-animations-waiting")}function s(){var o=["click","focusin","focusout"];t.forEach(o,function(e){n.on(e,c)}),e.$on("$destroy",function(){t.forEach(o,function(e){n.off(e,c)}),h()})}function c(e){"click"==e.type&&k(e),"focusout"!=e.type||D||(D=a(function(){S.close()},100,!1)),"focusin"==e.type&&D&&(a.cancel(D),D=null)}function l(){S.currentActionIndex=-1}function m(){e.$watch("vm.direction",function(e,t){o.removeClass(n,"md-"+t),o.addClass(n,"md-"+e),l()});var t,i;e.$watch("vm.isOpen",function(e){l(),t&&i||(t=_(),i=x()),e?p():h();var r=e?"md-is-open":"",a=e?"":"md-is-open";t.attr("aria-haspopup",!0),t.attr("aria-expanded",e),i.attr("aria-hidden",!e),o.setClass(n,r,a)})}function u(){n[0].scrollHeight>0?o.addClass(n,"_md-animations-ready").then(function(){n.removeClass("md-animations-waiting")}):N<10&&(a(u,100),N+=1)}function p(){n.on("keydown",g),i.nextTick(function(){t.element(document).on("click touchend",f)})}function h(){n.off("keydown",g),t.element(document).off("click touchend",f)}function f(e){if(e.target){var t=i.getClosest(e.target,"md-fab-trigger"),n=i.getClosest(e.target,"md-fab-actions");t||n||S.close()}}function g(e){switch(e.which){case r.KEY_CODE.ESCAPE:return S.close(),e.preventDefault(),!1;case r.KEY_CODE.LEFT_ARROW:return C(e),!1;case r.KEY_CODE.UP_ARROW:return y(e),!1;case r.KEY_CODE.RIGHT_ARROW:return M(e),!1;case r.KEY_CODE.DOWN_ARROW:return T(e),!1}}function b(e){E(e,-1)}function v(e){E(e,1)}function E(e,n){var o=$();S.currentActionIndex=S.currentActionIndex+n,S.currentActionIndex=Math.min(o.length-1,S.currentActionIndex),S.currentActionIndex=Math.max(0,S.currentActionIndex);var i=t.element(o[S.currentActionIndex]).children()[0];t.element(i).attr("tabindex",0),i.focus(),e.preventDefault(),e.stopImmediatePropagation()}function $(){var e=x()[0].querySelectorAll(".md-fab-action-item");return t.forEach(e,function(e){t.element(t.element(e).children()[0]).attr("tabindex",-1)}),e}function C(e){"left"===S.direction?v(e):b(e)}function y(e){"down"===S.direction?b(e):v(e)}function M(e){"left"===S.direction?b(e):v(e)}function T(e){"up"===S.direction?b(e):v(e)}function A(e){return i.getClosest(e,"md-fab-trigger")}function w(e){return i.getClosest(e,"md-fab-actions")}function k(e){A(e.target)&&S.toggle(),w(e.target)&&S.close()}function _(){return n.find("md-fab-trigger")}function x(){return n.find("md-fab-actions")}var S=this;S.open=function(){e.$evalAsync("vm.isOpen = true")},S.close=function(){e.$evalAsync("vm.isOpen = false"),n.find("md-fab-trigger")[0].focus()},S.toggle=function(){e.$evalAsync("vm.isOpen = !vm.isOpen")},d(),s(),m();var N=0;u();var D}t.module("material.components.fabShared",["material.core"]).controller("MdFabController",e),e.$inject=["$scope","$element","$animate","$mdUtil","$mdConstant","$timeout"]}()}(),function(){!function(){function n(){function e(e,t){t.prepend('<div class="_md-css-variables"></div>')}return{restrict:"E",scope:{direction:"@?mdDirection",isOpen:"=?mdOpen"},bindToController:!0,controller:"MdFabController",controllerAs:"vm",link:e}}function o(n){function o(e){n(e,r,!1)}function i(n){if(!n.hasClass("md-animations-waiting")||n.hasClass("_md-animations-ready")){var o=n[0],i=n.controller("mdFabSpeedDial"),r=o.querySelectorAll(".md-fab-action-item"),a=o.querySelector("md-fab-trigger"),d=o.querySelector("._md-css-variables"),s=parseInt(e.getComputedStyle(d).zIndex);t.forEach(r,function(e,t){var n=e.style;n.transform=n.webkitTransform="",n.transitionDelay="",n.opacity=1,n.zIndex=r.length-t+s}),a.style.zIndex=s+r.length+1,i.isOpen||t.forEach(r,function(e,t){var n,o,r=e.style,d=(a.clientHeight-e.clientHeight)/2,s=(a.clientWidth-e.clientWidth)/2;switch(i.direction){case"up":n=e.scrollHeight*(t+1)+d,o="Y";break;case"down":n=-(e.scrollHeight*(t+1)+d),o="Y";break;case"left":n=e.scrollWidth*(t+1)+s,o="X";break;case"right":n=-(e.scrollWidth*(t+1)+s),o="X"}var c="translate"+o+"("+n+"px)";r.transform=r.webkitTransform=c})}}return{addClass:function(e,t,n){e.hasClass("md-fling")?(i(e),o(n)):n()},removeClass:function(e,t,n){i(e),o(n)}}}function i(n){function o(e){n(e,r,!1)}function i(n){var o=n[0],i=n.controller("mdFabSpeedDial"),r=o.querySelectorAll(".md-fab-action-item"),d=o.querySelector("._md-css-variables"),s=parseInt(e.getComputedStyle(d).zIndex);t.forEach(r,function(e,t){var n=e.style,o=t*a;n.opacity=i.isOpen?1:0,n.transform=n.webkitTransform=i.isOpen?"scale(1)":"scale(0)",n.transitionDelay=(i.isOpen?o:r.length-o)+"ms",n.zIndex=r.length-t+s})}var a=65;return{addClass:function(e,t,n){i(e),o(n)},removeClass:function(e,t,n){i(e),o(n)}}}var r=300;t.module("material.components.fabSpeedDial",["material.core","material.components.fabShared","material.components.fabActions"]).directive("mdFabSpeedDial",n).animation(".md-fling",o).animation(".md-scale",i).service("mdFabSpeedDialFlingAnimation",o).service("mdFabSpeedDialScaleAnimation",i),o.$inject=["$timeout"],i.$inject=["$timeout"]}()}(),function(){!function(){function n(){function e(e,t,n){t.addClass("md-fab-toolbar"),t.find("md-fab-trigger").find("button").prepend('<div class="md-fab-toolbar-background"></div>')}return{restrict:"E",transclude:!0,template:'<div class="md-fab-toolbar-wrapper">  <div class="md-fab-toolbar-content" ng-transclude></div></div>',scope:{direction:"@?mdDirection",isOpen:"=?mdOpen"},bindToController:!0,controller:"MdFabController",controllerAs:"vm",link:e}}function o(){function n(n,o,i){if(o){var r=n[0],a=n.controller("mdFabToolbar"),d=r.querySelector(".md-fab-toolbar-background"),s=r.querySelector("md-fab-trigger button"),c=r.querySelector("md-toolbar"),l=r.querySelector("md-fab-trigger button md-icon"),m=n.find("md-fab-actions").children();if(s&&d){var u=e.getComputedStyle(s).getPropertyValue("background-color"),p=r.offsetWidth,h=(r.offsetHeight,2*(p/s.offsetWidth));d.style.backgroundColor=u,d.style.borderRadius=p+"px",a.isOpen?(c.style.pointerEvents="inherit",d.style.width=s.offsetWidth+"px",d.style.height=s.offsetHeight+"px",d.style.transform="scale("+h+")",d.style.transitionDelay="0ms",l&&(l.style.transitionDelay=".3s"),t.forEach(m,function(e,t){e.style.transitionDelay=25*(m.length-t)+"ms"})):(c.style.pointerEvents="none",d.style.transform="scale(1)",d.style.top="0",n.hasClass("md-right")&&(d.style.left="0",d.style.right=null),n.hasClass("md-left")&&(d.style.right="0",d.style.left=null),d.style.transitionDelay="200ms",l&&(l.style.transitionDelay="0ms"),t.forEach(m,function(e,t){e.style.transitionDelay=200+25*t+"ms"}))}}}return{addClass:function(e,t,o){n(e,t,o),o()},removeClass:function(e,t,o){n(e,t,o),o()}}}t.module("material.components.fabToolbar",["material.core","material.components.fabShared","material.components.fabActions"]).directive("mdFabToolbar",n).animation(".md-fab-toolbar",o).service("mdFabToolbarAnimation",o)}()}(),function(){function e(e,o,i,r){function a(n,a,d,s){function c(){for(var e in o.MEDIA)r(e),r.getQuery(o.MEDIA[e]).addListener(M);return r.watchResponsiveAttributes(["md-cols","md-row-height","md-gutter"],d,m)}function l(){s.layoutDelegate=t.noop,T();for(var e in o.MEDIA)r.getQuery(o.MEDIA[e]).removeListener(M)}function m(e){null==e?s.invalidateLayout():r(e)&&s.invalidateLayout()}function u(e){var o=g(),r={tileSpans:b(o),colCount:v(),rowMode:C(),rowHeight:$(),gutter:E()};if(e||!t.equals(r,A)){var d=i(r.colCount,r.tileSpans,o).map(function(e,n){return{grid:{element:a,style:f(r.colCount,n,r.gutter,r.rowMode,r.rowHeight)},tiles:e.map(function(e,i){return{element:t.element(o[i]),style:h(e.position,e.spans,r.colCount,n,r.gutter,r.rowMode,r.rowHeight)}})}}).reflow().performance();n.mdOnLayout({$event:{performance:d}}),A=r}}function p(e){return w+e+k}function h(e,t,n,o,i,r,a){var d=1/n*100,s=(n-1)/n,c=_({share:d,gutterShare:s,gutter:i}),l={left:x({unit:c,offset:e.col,gutter:i}),width:S({unit:c,span:t.col,gutter:i}),paddingTop:"",marginTop:"",top:"",height:""};switch(r){case"fixed":l.top=x({unit:a,offset:e.row,gutter:i}),l.height=S({unit:a,span:t.row,gutter:i});break;case"ratio":var m=d/a,u=_({share:m,gutterShare:s,gutter:i});l.paddingTop=S({unit:u,span:t.row,gutter:i}),l.marginTop=x({unit:u,offset:e.row,gutter:i});break;case"fit":var p=(o-1)/o,m=1/o*100,u=_({share:m,gutterShare:p,gutter:i});l.top=x({unit:u,offset:e.row,gutter:i}),l.height=S({unit:u,span:t.row,gutter:i})}return l}function f(e,t,n,o,i){var r={};switch(o){case"fixed":r.height=S({unit:i,span:t,gutter:n}),r.paddingBottom="";break;case"ratio":var a=1===e?0:(e-1)/e,d=1/e*100,s=d*(1/i),c=_({share:s,gutterShare:a,gutter:n});r.height="",r.paddingBottom=S({unit:c,span:t,gutter:n});break;case"fit":}return r}function g(){return[].filter.call(a.children(),function(e){return"MD-GRID-TILE"==e.tagName&&!e.$$mdDestroyed})}function b(e){return[].map.call(e,function(e){var n=t.element(e).controller("mdGridTile");return{row:parseInt(r.getResponsiveAttribute(n.$attrs,"md-rowspan"),10)||1,col:parseInt(r.getResponsiveAttribute(n.$attrs,"md-colspan"),10)||1}})}function v(){var e=parseInt(r.getResponsiveAttribute(d,"md-cols"),10);if(isNaN(e))throw"md-grid-list: md-cols attribute was not found, or contained a non-numeric value";return e}function E(){return y(r.getResponsiveAttribute(d,"md-gutter")||1)}function $(){var e=r.getResponsiveAttribute(d,"md-row-height");if(!e)throw"md-grid-list: md-row-height attribute was not found";switch(C()){case"fixed":return y(e);case"ratio":var t=e.split(":");return parseFloat(t[0])/parseFloat(t[1]);case"fit":return 0}}function C(){var e=r.getResponsiveAttribute(d,"md-row-height");if(!e)throw"md-grid-list: md-row-height attribute was not found";return"fit"==e?"fit":e.indexOf(":")!==-1?"ratio":"fixed"}function y(e){return/\D$/.test(e)?e:e+"px"}a.addClass("_md"),a.attr("role","list"),s.layoutDelegate=u;var M=t.bind(s,s.invalidateLayout),T=c();n.$on("$destroy",l);var A,w=e.startSymbol(),k=e.endSymbol(),_=e(p("share")+"% - ("+p("gutter")+" * "+p("gutterShare")+")"),x=e("calc(("+p("unit")+" + "+p("gutter")+") * "+p("offset")+")"),S=e("calc(("+p("unit")+") * "+p("span")+" + ("+p("span")+" - 1) * "+p("gutter")+")");
}return{restrict:"E",controller:n,scope:{mdOnLayout:"&"},link:a}}function n(e){this.layoutInvalidated=!1,this.tilesInvalidated=!1,this.$timeout_=e.nextTick,this.layoutDelegate=t.noop}function o(e){function n(t,n){var o,a,d,s,c,l;return s=e.time(function(){a=i(t,n)}),o={layoutInfo:function(){return a},map:function(t){return c=e.time(function(){var e=o.layoutInfo();d=t(e.positioning,e.rowCount)}),o},reflow:function(t){return l=e.time(function(){var e=t||r;e(d.grid,d.tiles)}),o},performance:function(){return{tileCount:n.length,layoutTime:s,mapTime:c,reflowTime:l,totalTime:s+c+l}}}}function o(e,t){e.element.css(e.style),t.forEach(function(e){e.element.css(e.style)})}function i(e,t){function n(t,n){if(t.col>e)throw"md-grid-list: Tile at position "+n+" has a colspan ("+t.col+") that exceeds the column count ("+e+")";for(var a=0,l=0;l-a<t.col;)d>=e?o():(a=c.indexOf(0,d),a!==-1&&(l=r(a+1))!==-1?d=l+1:(a=l=0,o()));return i(a,t.col,t.row),d=a+t.col,{col:a,row:s}}function o(){d=0,s++,i(0,e,-1)}function i(e,t,n){for(var o=e;o<e+t;o++)c[o]=Math.max(c[o]+n,0)}function r(e){var t;for(t=e;t<c.length;t++)if(0!==c[t])return t;if(t===c.length)return t}function a(){for(var t=[],n=0;n<e;n++)t.push(0);return t}var d=0,s=0,c=a();return{positioning:t.map(function(e,t){return{spans:e,position:n(e,t)}}),rowCount:s+Math.max.apply(Math,c)}}var r=o;return n.animateWith=function(e){r=t.isFunction(e)?e:o},n}function i(e){function n(n,o,i,r){o.attr("role","listitem");var a=e.watchResponsiveAttributes(["md-colspan","md-rowspan"],i,t.bind(r,r.invalidateLayout));r.invalidateTiles(),n.$on("$destroy",function(){o[0].$$mdDestroyed=!0,a(),r.invalidateLayout()}),t.isDefined(n.$parent.$index)&&n.$watch(function(){return n.$parent.$index},function(e,t){e!==t&&r.invalidateTiles()})}return{restrict:"E",require:"^mdGridList",template:"<figure ng-transclude></figure>",transclude:!0,scope:{},controller:["$attrs",function(e){this.$attrs=e}],link:n}}function r(){return{template:"<figcaption ng-transclude></figcaption>",transclude:!0}}t.module("material.components.gridList",["material.core"]).directive("mdGridList",e).directive("mdGridTile",i).directive("mdGridTileFooter",r).directive("mdGridTileHeader",r).factory("$mdGridLayout",o),e.$inject=["$interpolate","$mdConstant","$mdGridLayout","$mdMedia"],n.$inject=["$mdUtil"],n.prototype={invalidateTiles:function(){this.tilesInvalidated=!0,this.invalidateLayout()},invalidateLayout:function(){this.layoutInvalidated||(this.layoutInvalidated=!0,this.$timeout_(t.bind(this,this.layout)))},layout:function(){try{this.layoutDelegate(this.tilesInvalidated)}finally{this.layoutInvalidated=!1,this.tilesInvalidated=!1}}},o.$inject=["$mdUtil"],i.$inject=["$mdMedia"]}(),function(){t.module("material.components.icon",["material.core"])}(),function(){function n(e,t){function n(t,n){e(n);var o=n[0].querySelector(r),i=n[0].querySelector(a);o&&n.addClass("md-icon-left"),i&&n.addClass("md-icon-right")}function o(e,n,o,i){var r=this;r.isErrorGetter=o.mdIsError&&t(o.mdIsError),r.delegateClick=function(){r.input.focus()},r.element=n,r.setFocused=function(e){n.toggleClass("md-input-focused",!!e)},r.setHasValue=function(e){n.toggleClass("md-input-has-value",!!e)},r.setHasPlaceholder=function(e){n.toggleClass("md-input-has-placeholder",!!e)},r.setInvalid=function(e){e?i.addClass(n,"md-input-invalid"):i.removeClass(n,"md-input-invalid")},e.$watch(function(){return r.label&&r.input},function(e){e&&!r.label.attr("for")&&r.label.attr("for",r.input.attr("id"))})}var i=["INPUT","TEXTAREA","SELECT","MD-SELECT"],r=i.reduce(function(e,t){return e.concat(["md-icon ~ "+t,".md-icon ~ "+t])},[]).join(","),a=i.reduce(function(e,t){return e.concat([t+" ~ md-icon",t+" ~ .md-icon"])},[]).join(",");return o.$inject=["$scope","$element","$attrs","$animate"],{restrict:"E",link:n,controller:o}}function o(){return{restrict:"E",require:"^?mdInputContainer",link:function(e,t,n,o){!o||n.mdNoFloat||t.hasClass("md-container-ignore")||(o.label=t,e.$on("$destroy",function(){o.label=null}))}}}function i(e,n,o,i,r){function a(a,d,s,c){function l(e){return h.setHasValue(!g.$isEmpty(e)),e}function m(){h.label&&s.$observe("required",function(e){h.label.toggleClass("md-required",e&&!E)})}function u(){h.setHasValue(d.val().length>0||(d[0].validity||{}).badInput)}function p(){function o(){d.attr("rows",1).css("height","auto").addClass("md-no-flex");var e=c();if(!$){var t=d[0].style.padding||"";$=d.css("padding",0).prop("offsetHeight"),d[0].style.padding=t}if(b&&$&&(e=Math.max(e,$*b)),v&&$){var n=$*v;n<e?(d.attr("md-no-autogrow",""),e=n):d.removeAttr("md-no-autogrow")}$&&d.attr("rows",Math.round(e/$)),d.css("height",e+"px").removeClass("md-no-flex")}function c(){var e=C.offsetHeight,t=C.scrollHeight-e;return e+Math.max(t,0)}function l(t){return e.nextTick(o),t}function m(){if(p&&(p=!1,t.element(n).off("resize",o),E&&E(),d.attr("md-no-autogrow","").off("input",o),f)){var e=g.$formatters.indexOf(l);e>-1&&g.$formatters.splice(e,1)}}function u(){function n(e){e.preventDefault(),u=!0,p=e.clientY,f=parseFloat(d.css("height"))||d.prop("offsetHeight")}function o(e){u&&(e.preventDefault(),m(),g.addClass("md-input-resized"))}function i(t){u&&d.css("height",f+(t.pointer.y-p)-e.scrollTop()+"px")}function c(e){u&&(u=!1,g.removeClass("md-input-resized"))}if(!s.hasOwnProperty("mdNoResize")){var l=t.element('<div class="md-resize-handle"></div>'),u=!1,p=null,f=0,g=h.element,b=r.register(l,"drag",{horizontal:!1});d.after(l),l.on("mousedown",n),g.on("$md.dragstart",o).on("$md.drag",i).on("$md.dragend",c),a.$on("$destroy",function(){l.off("mousedown",n).remove(),g.off("$md.dragstart",o).off("$md.drag",i).off("$md.dragend",c),b(),l=null,g=null,b=null})}}var p=!s.hasOwnProperty("mdNoAutogrow");if(u(),p){var b=s.hasOwnProperty("rows")?parseInt(s.rows):NaN,v=s.hasOwnProperty("maxRows")?parseInt(s.maxRows):NaN,E=a.$on("md-resize-textarea",o),$=null,C=d[0];if(i(function(){e.nextTick(o)},10,!1),d.on("input",o),f&&g.$formatters.push(l),b||d.attr("rows",1),t.element(n).on("resize",o),a.$on("$destroy",m),s.hasOwnProperty("mdDetectHidden")){var y=function(){var e=!1;return function(){var t=0===C.offsetHeight;t===!1&&e===!0&&o(),e=t}}();a.$watch(function(){return e.nextTick(y,!1),!0})}}}var h=c[0],f=!!c[1],g=c[1]||e.fakeNgModel(),b=c[2],v=t.isDefined(s.readonly),E=e.parseAttributeBoolean(s.mdNoAsterisk),$=d[0].tagName.toLowerCase();if(h){if("hidden"===s.type)return void d.attr("aria-hidden","true");if(h.input){if(h.input[0].contains(d[0]))return;throw new Error("<md-input-container> can only have *one* <input>, <textarea> or <md-select> child element!")}h.input=d,m();var C=t.element('<div class="md-errors-spacer">');d.after(C),h.label||o.expect(d,"aria-label",s.placeholder),d.addClass("md-input"),d.attr("id")||d.attr("id","input_"+e.nextUid()),"input"===$&&"number"===s.type&&s.min&&s.max&&!s.step?d.attr("step","any"):"textarea"===$&&p(),f||u();var y=h.isErrorGetter||function(){return g.$invalid&&(g.$touched||b&&b.$submitted)};a.$watch(y,h.setInvalid),s.ngValue&&s.$observe("value",u),g.$parsers.push(l),g.$formatters.push(l),d.on("input",u),v||d.on("focus",function(t){e.nextTick(function(){h.setFocused(!0)})}).on("blur",function(t){e.nextTick(function(){h.setFocused(!1),u()})}),a.$on("$destroy",function(){h.setFocused(!1),h.setHasValue(!1),h.input=null})}}return{restrict:"E",require:["^?mdInputContainer","?ngModel","?^form"],link:a}}function r(e,n){function o(o,i,r,a){function d(e){return c.parent?(c.text(String(i.val()||e||"").length+" / "+s),e):e}var s,c,l,m=a[0],u=a[1];n.nextTick(function(){l=t.element(u.element[0].querySelector(".md-errors-spacer")),c=t.element('<div class="md-char-counter">'),l.append(c),r.$set("ngTrim","false"),m.$formatters.push(d),m.$viewChangeListeners.push(d),i.on("input keydown keyup",function(){d()}),o.$watch(r.mdMaxlength,function(n){s=n,t.isNumber(n)&&n>0?(c.parent().length||e.enter(c,l),d()):e.leave(c)}),m.$validators["md-maxlength"]=function(e,n){return!t.isNumber(s)||s<0||(e||i.val()||n||"").length<=s}})}return{restrict:"A",require:["ngModel","^mdInputContainer"],link:o}}function a(e){function n(n,o,i,r){if(r){var a=r.element.find("label"),d=r.element.attr("md-no-float");if(a&&a.length||""===d||n.$eval(d))return void r.setHasPlaceholder(!0);if("MD-SELECT"!=o[0].nodeName){var s=t.element('<label ng-click="delegateClick()" tabindex="-1">'+i.placeholder+"</label>");i.$set("placeholder",null),r.element.addClass("md-icon-float").prepend(s),e(s)(n)}}}return{restrict:"A",require:"^^?mdInputContainer",priority:200,link:{pre:n}}}function d(e){function t(t,n,o){function i(){a=!0,e(function(){n[0].select(),a=!1},1,!1)}function r(e){a&&e.preventDefault()}if("INPUT"===n[0].nodeName||"TEXTAREA"===n[0].nodeName){var a=!1;n.on("focus",i).on("mouseup",r),t.$on("$destroy",function(){n.off("focus",i).off("mouseup",r)})}}return{restrict:"A",link:t}}function s(){function e(e,n,o,i){i&&(n.toggleClass("md-input-messages-animation",!0),n.toggleClass("md-auto-hide",!0),("false"==o.mdAutoHide||t(o))&&n.toggleClass("md-auto-hide",!1))}function t(e){return $.some(function(t){return e[t]})}return{restrict:"EA",link:e,require:"^^?mdInputContainer"}}function c(e){function t(t){function n(){for(var e=t[0];e=e.parentNode;)if(e.nodeType===Node.DOCUMENT_FRAGMENT_NODE)return!0;return!1}function o(t){return!!e.getClosest(t,"md-input-container")}function i(e){e.toggleClass("md-input-message-animation",!0)}if(o(t))i(t);else if(n())return function(e,n){o(n)&&i(t)}}return{restrict:"EA",compile:t,priority:100}}function l(e,t,n){return E(e,t,n),{addClass:function(e,t,n){p(e,n)}}}function m(e,t,n){return E(e,t,n),{enter:function(e,t){p(e,t)},leave:function(e,t){h(e,t)},addClass:function(e,t,n){"ng-hide"==t?h(e,n):n()},removeClass:function(e,t,n){"ng-hide"==t?p(e,n):n()}}}function u(e,t,n){return E(e,t,n),{enter:function(e,t){return f(e)},leave:function(e,t){return g(e)}}}function p(e,n){var o,i=[],r=v(e);t.forEach(r.children(),function(e){o=f(t.element(e)),i.push(o.start())}),C.all(i,n)}function h(e,n){var o,i=[],r=v(e);t.forEach(r.children(),function(e){o=g(t.element(e)),i.push(o.start())}),C.all(i,n)}function f(t){var n=parseInt(e.getComputedStyle(t[0]).height),o=parseInt(e.getComputedStyle(t[0]).marginTop),i=v(t),r=b(t),a=o>-n;return a||i.hasClass("md-auto-hide")&&!r.hasClass("md-input-invalid")?y(t,{}):y(t,{event:"enter",structural:!0,from:{opacity:0,"margin-top":-n+"px"},to:{opacity:1,"margin-top":"0"},duration:.3})}function g(t){var n=t[0].offsetHeight,o=e.getComputedStyle(t[0]);return 0==o.opacity?y(t,{}):y(t,{event:"leave",structural:!0,from:{opacity:1,"margin-top":0},to:{opacity:0,"margin-top":-n+"px"},duration:.3})}function b(e){var t=e.controller("mdInputContainer");return t.element}function v(e){return e.hasClass("md-input-message-animation")?t.element(M.getClosest(e,function(e){return e.classList.contains("md-input-messages-animation")})):t.element(e[0].querySelector(".md-input-messages-animation"))}function E(e,t,n){C=e,y=t,M=n}t.module("material.components.input",["material.core"]).directive("mdInputContainer",n).directive("label",o).directive("input",i).directive("textarea",i).directive("mdMaxlength",r).directive("placeholder",a).directive("ngMessages",s).directive("ngMessage",c).directive("ngMessageExp",c).directive("mdSelectOnFocus",d).animation(".md-input-invalid",l).animation(".md-input-messages-animation",m).animation(".md-input-message-animation",u).service("mdInputInvalidAnimation",l).service("mdInputMessagesAnimation",m).service("mdInputMessageAnimation",u),n.$inject=["$mdTheming","$parse"],i.$inject=["$mdUtil","$window","$mdAria","$timeout","$mdGesture"],r.$inject=["$animate","$mdUtil"],a.$inject=["$compile"],d.$inject=["$timeout"];var $=["ngIf","ngShow","ngHide","ngSwitchWhen","ngSwitchDefault"];c.$inject=["$mdUtil"];var C,y,M;l.$inject=["$$AnimateRunner","$animateCss","$mdUtil"],m.$inject=["$$AnimateRunner","$animateCss","$mdUtil"],u.$inject=["$$AnimateRunner","$animateCss","$mdUtil"]}(),function(){function e(e){return{restrict:"E",compile:function(t){return t[0].setAttribute("role","list"),e}}}function n(e,n,o,i){var r=["md-checkbox","md-switch","md-menu"];return{restrict:"E",controller:"MdListController",compile:function(a,d){function s(){for(var e,t,n=["md-switch","md-checkbox"],o=0;t=n[o];++o)if((e=a.find(t)[0])&&!e.hasAttribute("aria-label")){var i=a.find("p")[0];if(!i)return;e.setAttribute("aria-label","Toggle "+i.textContent)}}function c(){var e=t.element(E),n=e.parent().hasClass("md-secondary-container")||E.parentNode.firstElementChild!==E,o="left";n&&(o="right"),e.attr("md-position-mode")||e.attr("md-position-mode",o+" target");var i=e.children().eq(0);g(i[0])||i.attr("ng-click","$mdOpenMenu($event)"),i.attr("aria-label")||i.attr("aria-label","Open List Menu")}function l(e){if("div"==e)C=t.element('<div class="md-no-style md-list-item-inner">'),C.append(a.contents()),a.addClass("md-proxy-focus");else{C=t.element('<div class="md-button md-no-style">   <div class="md-list-item-inner"></div></div>');var n=t.element('<md-button class="md-no-style"></md-button>');n[0].setAttribute("aria-label",a[0].textContent),p(a[0],n[0]),a.hasClass("md-no-focus")&&n.addClass("md-no-focus"),C.prepend(n),C.children().eq(1).append(a.contents()),a.addClass("_md-button-wrap")}a[0].setAttribute("tabindex","-1"),a.append(C)}function m(){var e=t.element('<div class="md-secondary-container">');t.forEach($,function(t){u(t,e)}),C.append(e)}function u(n,o){if(n&&!f(n)&&n.hasAttribute("ng-click")){e.expect(n,"aria-label");var i=t.element('<md-button class="md-secondary md-icon-button">');p(n,i[0],["ng-if","ng-hide","ng-show"]),n.setAttribute("tabindex","-1"),i.append(n),n=i[0]}n&&(!g(n)||!d.ngClick&&h(n))&&t.element(n).removeClass("md-secondary"),a.addClass("md-with-secondary"),o.append(n)}function p(e,n,i){var r=o.prefixer(["ng-if","ng-click","ng-dblclick","aria-label","ng-disabled","ui-sref","href","ng-href","target","ng-attr-ui-sref","ui-sref-opts"]);i&&(r=r.concat(o.prefixer(i))),t.forEach(r,function(t){e.hasAttribute(t)&&(n.setAttribute(t,e.getAttribute(t)),e.removeAttribute(t))})}function h(e){return r.indexOf(e.nodeName.toLowerCase())!=-1}function f(e){var t=e.nodeName.toUpperCase();return"MD-BUTTON"==t||"BUTTON"==t}function g(e){for(var t=e.attributes,n=0;n<t.length;n++)if("ngClick"===d.$normalize(t[n].name))return!0;return!1}function b(e,a,d,s){function c(){p&&p.children&&!b&&t.forEach(r,function(e){t.forEach(p.querySelectorAll(e+":not(.md-secondary)"),function(e){u.push(e)})})}function l(){(1==u.length||b)&&(a.addClass("md-clickable"),b||s.attachRipple(e,t.element(a[0].querySelector(".md-no-style"))))}function m(e){var t=["md-slider"];if(!e.path)return t.indexOf(e.target.tagName.toLowerCase())!==-1;for(var n=e.path.indexOf(a.children()[0]),o=0;o<n;o++)if(t.indexOf(e.path[o].tagName.toLowerCase())!==-1)return!0}a.addClass("_md");var u=[],p=a[0].firstElementChild,h=a.hasClass("_md-button-wrap"),f=h?p.firstElementChild:p,b=f&&g(f);c(),l(),a.hasClass("md-proxy-focus")&&u.length&&t.forEach(u,function(n){n=t.element(n),e.mouseActive=!1,n.on("mousedown",function(){e.mouseActive=!0,i(function(){e.mouseActive=!1},100)}).on("focus",function(){e.mouseActive===!1&&a.addClass("md-focused"),n.on("blur",function t(){a.removeClass("md-focused"),n.off("blur",t)})})});var v=function(e){if("INPUT"!=e.target.nodeName&&"TEXTAREA"!=e.target.nodeName&&!e.target.isContentEditable){var t=e.which||e.keyCode;t==n.KEY_CODE.SPACE&&f&&(f.click(),e.preventDefault(),e.stopPropagation())}};b||u.length||f&&f.addEventListener("keypress",v),a.off("click"),a.off("keypress"),1==u.length&&f&&a.children().eq(0).on("click",function(e){if(!m(e)){var n=o.getClosest(e.target,"BUTTON");!n&&f.contains(e.target)&&t.forEach(u,function(n){e.target===n||n.contains(e.target)||("MD-MENU"===n.nodeName&&(n=n.children[0]),t.element(n).triggerHandler("click"))})}}),e.$on("$destroy",function(){f&&f.removeEventListener("keypress",v)})}var v,E,$=a[0].querySelectorAll(".md-secondary"),C=a;if(a[0].setAttribute("role","listitem"),d.ngClick||d.ngDblclick||d.ngHref||d.href||d.uiSref||d.ngAttrUiSref)l("button");else{for(var y,M=0;y=r[M];++M)if(E=a[0].querySelector(y)){v=!0;break}v?l("div"):a[0].querySelector("md-button:not(.md-secondary):not(.md-exclude)")||a.addClass("md-no-proxy")}return m(),s(),v&&"MD-MENU"===E.nodeName&&c(),b}}}function o(e,t,n){function o(e,t){var o={};n.attach(e,t,o)}var i=this;i.attachRipple=o}t.module("material.components.list",["material.core"]).controller("MdListController",o).directive("mdList",e).directive("mdListItem",n),e.$inject=["$mdTheming"],n.$inject=["$mdAria","$mdConstant","$mdUtil","$timeout"],o.$inject=["$scope","$element","$mdListInkRipple"]}(),function(){t.module("material.components.menu",["material.core","material.components.backdrop"])}(),function(){t.module("material.components.menuBar",["material.core","material.components.menu"])}(),function(){function e(e){return{restrict:"E",transclude:!0,controller:o,controllerAs:"ctrl",bindToController:!0,scope:{mdSelectedNavItem:"=?",navBarAriaLabel:"@?"},template:'<div class="md-nav-bar"><nav role="navigation"><ul class="_md-nav-bar-list" ng-transclude role="listbox"tabindex="0"ng-focus="ctrl.onFocus()"ng-blur="ctrl.onBlur()"ng-keydown="ctrl.onKeydown($event)"aria-label="{{ctrl.navBarAriaLabel}}"></ul></nav><md-nav-ink-bar></md-nav-ink-bar></div>',link:function(n,o,i,r){r.navBarAriaLabel||e.expectAsync(o,"aria-label",t.noop)}}}function o(e,t,n,o){this._$timeout=n,this._$scope=t,this._$mdConstant=o,this.mdSelectedNavItem,this.navBarAriaLabel,this._navBarEl=e[0],this._inkbar;var i=this,r=this._$scope.$watch(function(){return i._navBarEl.querySelectorAll("._md-nav-button").length},function(e){e>0&&(i._initTabs(),r())})}function i(e){return{restrict:"E",require:["mdNavItem","^mdNavBar"],controller:r,bindToController:!0,controllerAs:"ctrl",replace:!0,transclude:!0,template:'<li class="md-nav-item" role="option" aria-selected="{{ctrl.isSelected()}}"><md-button ng-if="ctrl.mdNavSref" class="_md-nav-button md-accent"ng-class="ctrl.getNgClassMap()"tabindex="-1"ui-sref="{{ctrl.mdNavSref}}"><span ng-transclude class="_md-nav-button-text"></span></md-button><md-button ng-if="ctrl.mdNavHref" class="_md-nav-button md-accent"ng-class="ctrl.getNgClassMap()"tabindex="-1"ng-href="{{ctrl.mdNavHref}}"><span ng-transclude class="_md-nav-button-text"></span></md-button><md-button ng-if="ctrl.mdNavClick" class="_md-nav-button md-accent"ng-class="ctrl.getNgClassMap()"tabindex="-1"ng-click="ctrl.mdNavClick()"><span ng-transclude class="_md-nav-button-text"></span></md-button></li>',scope:{mdNavClick:"&?",mdNavHref:"@?",mdNavSref:"@?",name:"@"},link:function(n,o,i,r){var a=r[0],d=r[1];e(function(){a.name||(a.name=t.element(o[0].querySelector("._md-nav-button-text")).text().trim());var e=t.element(o[0].querySelector("._md-nav-button"));e.on("click",function(){d.mdSelectedNavItem=a.name,n.$apply()})})}}}function r(e){this._$element=e,this.mdNavClick,this.mdNavHref,this.name,this._selected=!1,this._focused=!1;var t=!!e.attr("md-nav-click"),n=!!e.attr("md-nav-href"),o=!!e.attr("md-nav-sref");if((t?1:0)+(n?1:0)+(o?1:0)>1)throw Error("Must specify exactly one of md-nav-click, md-nav-href, md-nav-sref for nav-item directive")}t.module("material.components.navBar",["material.core"]).controller("MdNavBarController",o).directive("mdNavBar",e).controller("MdNavItemController",r).directive("mdNavItem",i),e.$inject=["$mdAria"],o.$inject=["$element","$scope","$timeout","$mdConstant"],o.prototype._initTabs=function(){this._inkbar=t.element(this._navBarEl.getElementsByTagName("md-nav-ink-bar")[0]);var e=this;this._$timeout(function(){e._updateTabs(e.mdSelectedNavItem,n)}),this._$scope.$watch("ctrl.mdSelectedNavItem",function(t,n){e._$timeout(function(){e._updateTabs(t,n)})})},o.prototype._updateTabs=function(e,t){var n=this,o=this._getTabs(),i=-1,r=-1,a=this._getTabByName(e),d=this._getTabByName(t);d&&(d.setSelected(!1),i=o.indexOf(d)),a&&(a.setSelected(!0),r=o.indexOf(a)),this._$timeout(function(){n._updateInkBarStyles(a,r,i)})},o.prototype._updateInkBarStyles=function(e,t,n){if(this._inkbar.toggleClass("_md-left",t<n).toggleClass("_md-right",t>n),this._inkbar.css({display:t<0?"none":""}),e){var o=e.getButtonEl(),i=o.offsetLeft;this._inkbar.css({left:i+"px",width:o.offsetWidth+"px"})}},o.prototype._getTabs=function(){var e=Array.prototype.slice.call(this._navBarEl.querySelectorAll(".md-nav-item"));return e.map(function(e){return t.element(e).controller("mdNavItem")})},o.prototype._getTabByName=function(e){return this._findTab(function(t){return t.getName()==e})},o.prototype._getSelectedTab=function(){return this._findTab(function(e){return e.isSelected()})},o.prototype.getFocusedTab=function(){return this._findTab(function(e){return e.hasFocus()})},o.prototype._findTab=function(e){for(var t=this._getTabs(),n=0;n<t.length;n++)if(e(t[n]))return t[n];return null},o.prototype.onFocus=function(){var e=this._getSelectedTab();e&&e.setFocused(!0)},o.prototype.onBlur=function(){var e=this.getFocusedTab();e&&e.setFocused(!1)},o.prototype._moveFocus=function(e,t){e.setFocused(!1),t.setFocused(!0)},o.prototype.onKeydown=function(e){var t=this._$mdConstant.KEY_CODE,n=this._getTabs(),o=this.getFocusedTab();if(o){var i=n.indexOf(o);switch(e.keyCode){case t.UP_ARROW:case t.LEFT_ARROW:i>0&&this._moveFocus(o,n[i-1]);break;case t.DOWN_ARROW:case t.RIGHT_ARROW:i<n.length-1&&this._moveFocus(o,n[i+1]);break;case t.SPACE:case t.ENTER:this._$timeout(function(){o.getButtonEl().click()})}}},i.$inject=["$$rAF"],r.$inject=["$element"],r.prototype.getNgClassMap=function(){return{"md-active":this._selected,"md-primary":this._selected,"md-unselected":!this._selected,"md-focused":this._focused}},r.prototype.getName=function(){return this.name},r.prototype.getButtonEl=function(){return this._$element[0].querySelector("._md-nav-button")},r.prototype.setSelected=function(e){this._selected=e},r.prototype.isSelected=function(){return this._selected},r.prototype.setFocused=function(e){this._focused=e},r.prototype.hasFocus=function(){return this._focused}}(),function(){function e(e,n,o,a){this._defaultConfigOptions={bindToController:!0,clickOutsideToClose:!1,disableParentScroll:!1,escapeToClose:!1,focusOnOpen:!0,fullscreen:!1,hasBackdrop:!1,propagateContainerEvents:!1,transformTemplate:t.bind(this,this._wrapTemplate),trapFocus:!1,zIndex:d},this._config={},this._$rootElement=e,this._$rootScope=n,this._$injector=o,this._$window=a,this.animation=r.animation,this.xPosition=i.xPosition,this.yPosition=i.yPosition}function o(e,t){this._$q=t.get("$q"),this._$mdCompiler=t.get("$mdCompiler"),this._$mdConstant=t.get("$mdConstant"),this._$mdUtil=t.get("$mdUtil"),this._$rootScope=t.get("$rootScope"),this._$animate=t.get("$animate"),this._$mdPanel=t.get("$mdPanel"),this._$log=t.get("$log"),this._$window=t.get("$window"),this._$$rAF=t.get("$$rAF"),this.id=e.id,this.config=e,this.isAttached=!1,this._panelContainer,this._panelEl,this._removeListeners=[],this._topFocusTrap,this._bottomFocusTrap,this._backdropRef,this._restoreScroll=null}function i(e){this._$window=e.get("$window"),this._isRTL="rtl"===e.get("$mdUtil").bidi(),this._absolute=!1,this._relativeToEl,this._top="",this._bottom="",this._left="",this._right="",this._translateX=[],this._translateY=[],this._positions=[],this._actualPosition}function r(e){this._$mdUtil=e.get("$mdUtil"),this._openFrom,this._closeTo,this._animationClass=""}function a(e){var n=t.isString(e)?document.querySelector(e):e;return t.element(n)}t.module("material.components.panel",["material.core","material.components.backdrop"]).service("$mdPanel",e);var d=80,s="_md-panel-hidden",c=t.element('<div class="_md-panel-focus-trap" tabindex="0"></div>');e.$inject=["$rootElement","$rootScope","$injector","$window"],e.prototype.create=function(e){var n=e||{};this._config={scope:this._$rootScope.$new(!0),attachTo:this._$rootElement},t.extend(this._config,this._defaultConfigOptions,n);var i="panel_"+this._$injector.get("$mdUtil").nextUid(),r=t.extend({id:i},this._config);return new o(r,this._$injector)},e.prototype.open=function(e){var t=this.create(e);return t.open().then(function(){return t})},e.prototype.newPanelPosition=function(){return new i(this._$injector)},e.prototype.newPanelAnimation=function(){return new r(this._$injector)},e.prototype._wrapTemplate=function(e){var t=e||"";return'<div class="md-panel-outer-wrapper">  <div class="md-panel" style="left: -9999px;">'+t+"</div></div>"},o.prototype.open=function(){var e=this;return this._$q(function(t,n){var o=e._done(t,e),i=e._simpleBind(e.show,e);e.attach().then(i).then(o)["catch"](n)})},o.prototype.close=function(){var e=this;return this._$q(function(t,n){var o=e._done(t,e),i=e._simpleBind(e.detach,e);e.hide().then(i).then(o)["catch"](n)})},o.prototype.attach=function(){if(this.isAttached&&this._panelEl)return this._$q.when(this);var e=this;return this._$q(function(n,o){var i=e._done(n,e),r=e.config.onDomAdded||t.noop,a=function(t){return e.isAttached=!0,e._addEventListeners(),t};e._$q.all([e._createBackdrop(),e._createPanel().then(a)["catch"](o)]).then(r).then(i)["catch"](o)})},o.prototype.detach=function(){if(!this.isAttached)return this._$q.when(this);var e=this,n=e.config.onDomRemoved||t.noop,o=function(){return e._removeEventListeners(),e._topFocusTrap&&e._topFocusTrap.parentNode&&e._topFocusTrap.parentNode.removeChild(e._topFocusTrap),e._bottomFocusTrap&&e._bottomFocusTrap.parentNode&&e._bottomFocusTrap.parentNode.removeChild(e._bottomFocusTrap),e._panelContainer.remove(),e.isAttached=!1,e._$q.when(e)};return this._restoreScroll&&(this._restoreScroll(),this._restoreScroll=null),this._$q(function(t,i){var r=e._done(t,e);e._$q.all([o(),!e._backdropRef||e._backdropRef.detach()]).then(n).then(r)["catch"](i)})},o.prototype.destroy=function(){this.config.scope.$destroy(),this.config.locals=null},o.prototype.show=function(){if(!this._panelContainer)return this._$q(function(e,t){t("Panel does not exist yet. Call open() or attach().")});if(!this._panelContainer.hasClass(s))return this._$q.when(this);var e=this,n=function(){return e.removeClass(s),e._animateOpen()};return this._$q(function(o,i){var r=e._done(o,e),a=e.config.onOpenComplete||t.noop;e._$q.all([e._backdropRef?e._backdropRef.show():e,n().then(function(){e._focusOnOpen()},i)]).then(a).then(r)["catch"](i)})},o.prototype.hide=function(){if(!this._panelContainer)return this._$q(function(e,t){t("Panel does not exist yet. Call open() or attach().")});if(this._panelContainer.hasClass(s))return this._$q.when(this);var e=this;return this._$q(function(n,o){var i=e._done(n,e),r=e.config.onRemoving||t.noop,d=function(){var t=e.config.origin;t&&a(t).focus()},c=function(){e.addClass(s)};e._$q.all([e._backdropRef?e._backdropRef.hide():e,e._animateClose().then(r).then(c).then(d)["catch"](o)]).then(i,o)})},o.prototype.addClass=function(e,t){if(!this._panelContainer)throw new Error("Panel does not exist yet. Call open() or attach().");t||this._panelContainer.hasClass(e)?t&&!this._panelEl.hasClass(e)&&this._panelEl.addClass(e):this._panelContainer.addClass(e)},o.prototype.removeClass=function(e,t){if(!this._panelContainer)throw new Error("Panel does not exist yet. Call open() or attach().");!t&&this._panelContainer.hasClass(e)?this._panelContainer.removeClass(e):t&&this._panelEl.hasClass(e)&&this._panelEl.removeClass(e)},o.prototype.toggleClass=function(e,t){if(!this._panelContainer)throw new Error("Panel does not exist yet. Call open() or attach().");t?this._panelEl.toggleClass(e):this._panelContainer.toggleClass(e)},o.prototype._createPanel=function(){var e=this;return this._$q(function(n,o){e.config.locals||(e.config.locals={}),e.config.locals.mdPanelRef=e,e._$mdCompiler.compile(e.config).then(function(i){e._panelContainer=i.link(e.config.scope),a(e.config.attachTo).append(e._panelContainer),e.config.disableParentScroll&&(e._restoreScroll=e._$mdUtil.disableScrollAround(null,e._panelContainer,{disableScrollMask:!0})),e._panelEl=t.element(e._panelContainer[0].querySelector(".md-panel")),e.config.panelClass&&e._panelEl.addClass(e.config.panelClass),e.config.propagateContainerEvents&&e._panelContainer.css("pointer-events","none"),e._$animate.pin&&e._$animate.pin(e._panelContainer,a(e.config.attachTo)),e._configureTrapFocus(),e._addStyles().then(function(){n(e)},o)},o)})},o.prototype._addStyles=function(){var e=this;return this._$q(function(t){e._panelContainer.css("z-index",e.config.zIndex),e._panelEl.css("z-index",e.config.zIndex+1);var n=function(){e._panelEl.css("left",""),e._panelContainer.addClass(s),t(e)};if(e.config.fullscreen)return e._panelEl.addClass("_md-panel-fullscreen"),void n();var o=e.config.position;return o?void e._$rootScope.$$postDigest(function(){e._updatePosition(!0),t(e)}):void n()})},o.prototype.updatePosition=function(e){if(!this._panelContainer)throw new Error("Panel does not exist yet. Call open() or attach().");this.config.position=e,this._updatePosition()},o.prototype._updatePosition=function(e){var t=this.config.position;if(t){t._setPanelPosition(this._panelEl),e&&this._panelContainer.addClass(s),this._panelEl.css(i.absPosition.TOP,t.getTop()),this._panelEl.css(i.absPosition.BOTTOM,t.getBottom()),this._panelEl.css(i.absPosition.LEFT,t.getLeft()),this._panelEl.css(i.absPosition.RIGHT,t.getRight());var n=this._$mdConstant.CSS.TRANSFORM;this._panelEl.css(n,t.getTransform())}},o.prototype._focusOnOpen=function(){if(this.config.focusOnOpen){var e=this;this._$rootScope.$$postDigest(function(){var t=e._$mdUtil.findFocusTarget(e._panelEl)||e._panelEl;t.focus()})}},o.prototype._createBackdrop=function(){if(this.config.hasBackdrop){if(!this._backdropRef){var e=this._$mdPanel.newPanelAnimation().openFrom(this.config.attachTo).withAnimation({open:"_md-opaque-enter",close:"_md-opaque-leave"}),t={animation:e,attachTo:this.config.attachTo,focusOnOpen:!1,panelClass:"_md-panel-backdrop",zIndex:this.config.zIndex-1};this._backdropRef=this._$mdPanel.create(t)}if(!this._backdropRef.isAttached)return this._backdropRef.attach()}},o.prototype._addEventListeners=function(){this._configureEscapeToClose(),this._configureClickOutsideToClose(),this._configureScrollListener()},o.prototype._removeEventListeners=function(){this._removeListeners&&this._removeListeners.forEach(function(e){e()}),this._removeListeners=[]},o.prototype._configureEscapeToClose=function(){if(this.config.escapeToClose){var e=a(this.config.attachTo),t=this,n=function(e){e.keyCode===t._$mdConstant.KEY_CODE.ESCAPE&&(e.stopPropagation(),e.preventDefault(),t.close())};this._panelContainer.on("keydown",n),e.on("keydown",n),this._removeListeners.push(function(){t._panelContainer.off("keydown",n),e.off("keydown",n)})}},o.prototype._configureClickOutsideToClose=function(){if(this.config.clickOutsideToClose){var e,t=this._panelContainer,n=function(t){e=t.target},o=this,i=function(n){e===t[0]&&n.target===t[0]&&(n.stopPropagation(),n.preventDefault(),o.close())};t.on("mousedown",n),t.on("mouseup",i),this._removeListeners.push(function(){t.off("mousedown",n),t.off("mouseup",i)})}},o.prototype._configureScrollListener=function(){var e=t.bind(this,this._updatePosition),n=this._$$rAF.throttle(e),o=this,i=function(){o.config.disableParentScroll||n()};this._$window.addEventListener("scroll",i,!0),this._removeListeners.push(function(){o._$window.removeEventListener("scroll",i,!0)})},o.prototype._configureTrapFocus=function(){if(this._panelEl.attr("tabIndex","-1"),this.config.trapFocus){var e=this._panelEl;this._topFocusTrap=c.clone()[0],this._bottomFocusTrap=c.clone()[0];var t=function(){e.focus()};this._topFocusTrap.addEventListener("focus",t),this._bottomFocusTrap.addEventListener("focus",t),this._removeListeners.push(this._simpleBind(function(){this._topFocusTrap.removeEventListener("focus",t),this._bottomFocusTrap.removeEventListener("focus",t)},this)),e[0].parentNode.insertBefore(this._topFocusTrap,e[0]),e.after(this._bottomFocusTrap)}},o.prototype._animateOpen=function(){this.addClass("md-panel-is-showing");var e=this.config.animation;if(!e)return this.addClass("_md-panel-shown"),
this._$q.when(this);var t=this;return this._$q(function(n){var o=t._done(n,t),i=function(){t._$log.warn("MdPanel Animations failed. Showing panel without animating."),o()};e.animateOpen(t._panelEl).then(o,i)})},o.prototype._animateClose=function(){var e=this.config.animation;if(!e)return this.removeClass("md-panel-is-showing"),this.removeClass("_md-panel-shown"),this._$q.when(this);var t=this;return this._$q(function(n){var o=function(){t.removeClass("md-panel-is-showing"),n(t)},i=function(){t._$log.warn("MdPanel Animations failed. Hiding panel without animating."),o()};e.animateClose(t._panelEl).then(o,i)})},o.prototype._simpleBind=function(e,t){return function(n){return e.apply(t,n)}},o.prototype._done=function(e,t){return function(){e(t)}},i.xPosition={CENTER:"center",ALIGN_START:"align-start",ALIGN_END:"align-end",OFFSET_START:"offset-start",OFFSET_END:"offset-end"},i.yPosition={CENTER:"center",ALIGN_TOPS:"align-tops",ALIGN_BOTTOMS:"align-bottoms",ABOVE:"above",BELOW:"below"},i.absPosition={TOP:"top",RIGHT:"right",BOTTOM:"bottom",LEFT:"left"},i.prototype.absolute=function(){return this._absolute=!0,this},i.prototype._setPosition=function(e,n){if(e===i.absPosition.RIGHT||e===i.absPosition.LEFT)this._left=this._right="";else{if(e!==i.absPosition.BOTTOM&&e!==i.absPosition.TOP){var o=Object.keys(i.absPosition).join().toLowerCase();throw new Error("Position must be one of "+o+".")}this._top=this._bottom=""}return this["_"+e]=t.isString(n)?n:"0",this},i.prototype.top=function(e){return this._setPosition(i.absPosition.TOP,e)},i.prototype.bottom=function(e){return this._setPosition(i.absPosition.BOTTOM,e)},i.prototype.start=function(e){var t=this._isRTL?i.absPosition.RIGHT:i.absPosition.LEFT;return this._setPosition(t,e)},i.prototype.end=function(e){var t=this._isRTL?i.absPosition.LEFT:i.absPosition.RIGHT;return this._setPosition(t,e)},i.prototype.left=function(e){return this._setPosition(i.absPosition.LEFT,e)},i.prototype.right=function(e){return this._setPosition(i.absPosition.RIGHT,e)},i.prototype.centerHorizontally=function(){return this._left="50%",this._right="",this._translateX=["-50%"],this},i.prototype.centerVertically=function(){return this._top="50%",this._bottom="",this._translateY=["-50%"],this},i.prototype.center=function(){return this.centerHorizontally().centerVertically()},i.prototype.relativeTo=function(e){return this._absolute=!1,this._relativeToEl=a(e),this},i.prototype.addPanelPosition=function(e,t){if(!this._relativeToEl)throw new Error("addPanelPosition can only be used with relative positioning. Set relativeTo first.");return this._validateXPosition(e),this._validateYPosition(t),this._positions.push({x:e,y:t}),this},i.prototype._validateYPosition=function(e){if(null!=e){for(var t,n=Object.keys(i.yPosition),o=[],r=0;t=n[r];r++){var a=i.yPosition[t];if(o.push(a),a===e)return}throw new Error("Panel y position only accepts the following values:\n"+o.join(" | "))}},i.prototype._validateXPosition=function(e){if(null!=e){for(var t,n=Object.keys(i.xPosition),o=[],r=0;t=n[r];r++){var a=i.xPosition[t];if(o.push(a),a===e)return}throw new Error("Panel x Position only accepts the following values:\n"+o.join(" | "))}},i.prototype.withOffsetX=function(e){return this._translateX.push(e),this},i.prototype.withOffsetY=function(e){return this._translateY.push(e),this},i.prototype.getTop=function(){return this._top},i.prototype.getBottom=function(){return this._bottom},i.prototype.getLeft=function(){return this._left},i.prototype.getRight=function(){return this._right},i.prototype.getTransform=function(){var e=this._reduceTranslateValues("translateX",this._translateX),t=this._reduceTranslateValues("translateY",this._translateY);return(e+" "+t).trim()},i.prototype._isOnscreen=function(e){var t=parseInt(this.getLeft()),n=parseInt(this.getTop()),o=t+e[0].offsetWidth,i=n+e[0].offsetHeight;return t>=0&&n>=0&&i<=this._$window.innerHeight&&o<=this._$window.innerWidth},i.prototype.getActualPosition=function(){return this._actualPosition},i.prototype._reduceTranslateValues=function(e,t){return t.map(function(t){return e+"("+t+")"}).join(" ")},i.prototype._setPanelPosition=function(e){if(!this._absolute){if(this._actualPosition)return void this._calculatePanelPosition(e,this._actualPosition);for(var t=0;t<this._positions.length&&(this._actualPosition=this._positions[t],this._calculatePanelPosition(e,this._actualPosition),!this._isOnscreen(e));t++);}},i.prototype._reverseXPosition=function(e){if(e!==i.xPosition.CENTER){var t="start",n="end";return e.indexOf(t)>-1?e.replace(t,n):e.replace(n,t)}},i.prototype._bidi=function(e){return this._isRTL?this._reverseXPosition(e):e},i.prototype._calculatePanelPosition=function(e,t){var n=e[0].getBoundingClientRect(),o=n.width,r=n.height,a=this._relativeToEl[0].getBoundingClientRect(),d=a.left,s=a.right,c=a.width;switch(this._bidi(t.x)){case i.xPosition.OFFSET_START:this._left=d-o+"px";break;case i.xPosition.ALIGN_END:this._left=s-o+"px";break;case i.xPosition.CENTER:var l=d+.5*c-.5*o;this._left=l+"px";break;case i.xPosition.ALIGN_START:this._left=d+"px";break;case i.xPosition.OFFSET_END:this._left=s+"px"}var m=a.top,u=a.bottom,p=a.height;switch(t.y){case i.yPosition.ABOVE:this._top=m-r+"px";break;case i.yPosition.ALIGN_BOTTOMS:this._top=u-r+"px";break;case i.yPosition.CENTER:var h=m+.5*p-.5*r;this._top=h+"px";break;case i.yPosition.ALIGN_TOPS:this._top=m+"px";break;case i.yPosition.BELOW:this._top=u+"px"}},r.animation={SLIDE:"md-panel-animate-slide",SCALE:"md-panel-animate-scale",FADE:"md-panel-animate-fade"},r.prototype.openFrom=function(e){return e=e.target?e.target:e,this._openFrom=this._getPanelAnimationTarget(e),this._closeTo||(this._closeTo=this._openFrom),this},r.prototype.closeTo=function(e){return this._closeTo=this._getPanelAnimationTarget(e),this},r.prototype._getPanelAnimationTarget=function(e){return t.isDefined(e.top)||t.isDefined(e.left)?{element:n,bounds:{top:e.top||0,left:e.left||0}}:this._getBoundingClientRect(a(e))},r.prototype.withAnimation=function(e){return this._animationClass=e,this},r.prototype.animateOpen=function(e){var n=this._$mdUtil.dom.animator;this._fixBounds(e);var o={},i=e[0].style.transform||"",a=n.toTransformCss(i),d=n.toTransformCss(i);switch(this._animationClass){case r.animation.SLIDE:e.css("opacity","1"),o={transitionInClass:"_md-panel-animate-enter"};var s=n.calculateSlideToOrigin(e,this._openFrom)||"";a=n.toTransformCss(s+" "+i);break;case r.animation.SCALE:o={transitionInClass:"_md-panel-animate-enter"};var c=n.calculateZoomToOrigin(e,this._openFrom)||"";a=n.toTransformCss(c+" "+i);break;case r.animation.FADE:o={transitionInClass:"_md-panel-animate-enter"};break;default:o=t.isString(this._animationClass)?{transitionInClass:this._animationClass}:{transitionInClass:this._animationClass.open,transitionOutClass:this._animationClass.close}}return n.translate3d(e,a,d,o)},r.prototype.animateClose=function(e){var n=this._$mdUtil.dom.animator,o={},i=e[0].style.transform||"",a=n.toTransformCss(i),d=n.toTransformCss(i);switch(this._animationClass){case r.animation.SLIDE:e.css("opacity","1"),o={transitionInClass:"_md-panel-animate-leave"};var s=n.calculateSlideToOrigin(e,this._closeTo)||"";d=n.toTransformCss(s+" "+i);break;case r.animation.SCALE:o={transitionInClass:"_md-panel-animate-scale-out _md-panel-animate-leave"};var c=n.calculateZoomToOrigin(e,this._closeTo)||"";d=n.toTransformCss(c+" "+i);break;case r.animation.FADE:o={transitionInClass:"_md-panel-animate-fade-out _md-panel-animate-leave"};break;default:o=t.isString(this._animationClass)?{transitionOutClass:this._animationClass}:{transitionInClass:this._animationClass.close,transitionOutClass:this._animationClass.open}}return n.translate3d(e,a,d,o)},r.prototype._fixBounds=function(e){var t=e[0].offsetWidth,n=e[0].offsetHeight;this._openFrom&&null==this._openFrom.bounds.height&&(this._openFrom.bounds.height=n),this._openFrom&&null==this._openFrom.bounds.width&&(this._openFrom.bounds.width=t),this._closeTo&&null==this._closeTo.bounds.height&&(this._closeTo.bounds.height=n),this._closeTo&&null==this._closeTo.bounds.width&&(this._closeTo.bounds.width=t)},r.prototype._getBoundingClientRect=function(e){if(e instanceof t.element)return{element:e,bounds:e[0].getBoundingClientRect()}}}(),function(){t.module("material.components.progressCircular",["material.core"])}(),function(){function e(e,n,o){function i(e,t,n){return e.attr("aria-valuemin",0),e.attr("aria-valuemax",100),e.attr("role","progressbar"),r}function r(o,i,r){function u(){r.$observe("value",function(e){var t=a(e);i.attr("aria-valuenow",t),h()!=l&&f($,t)}),r.$observe("mdBufferValue",function(e){f(E,a(e))}),r.$observe("disabled",function(e){b=e===!0||e===!1?!!e:t.isDefined(e),i.toggleClass(m,b),C.toggleClass(g,!b)}),r.$observe("mdMode",function(e){switch(g&&C.removeClass(g),e){case l:case c:case d:case s:C.addClass(g="md-mode-"+e);break;default:C.addClass(g="md-mode-"+s)}})}function p(){if(t.isUndefined(r.mdMode)){var e=t.isDefined(r.value),n=e?d:s;i.attr("md-mode",n),r.mdMode=n}}function h(){var e=(r.mdMode||"").trim();if(e)switch(e){case d:case s:case c:case l:break;default:e=s}return e}function f(e,o){if(!b&&h()){var i=n.supplant("translateX({0}%) scale({1},1)",[(o-100)/2,o/100]),r=v({transform:i});t.element(e).css(r)}}e(i);var g,b=r.hasOwnProperty("disabled"),v=n.dom.animator.toCss,E=t.element(i[0].querySelector(".md-bar1")),$=t.element(i[0].querySelector(".md-bar2")),C=t.element(i[0].querySelector(".md-container"));i.attr("md-mode",h()).toggleClass(m,b),p(),u()}function a(e){return Math.max(0,Math.min(e||0,100))}var d="determinate",s="indeterminate",c="buffer",l="query",m="_md-progress-linear-disabled";return{restrict:"E",template:'<div class="md-container"><div class="md-dashed"></div><div class="md-bar md-bar1"></div><div class="md-bar md-bar2"></div></div>',compile:i}}t.module("material.components.progressLinear",["material.core"]).directive("mdProgressLinear",e),e.$inject=["$mdTheming","$mdUtil","$log"]}(),function(){function e(e,n,o,i){function r(r,a,d,s){function c(){a.hasClass("md-focused")||a.addClass("md-focused")}function l(o){var i=o.which||o.keyCode;if(i==n.KEY_CODE.ENTER||o.currentTarget==o.target)switch(i){case n.KEY_CODE.LEFT_ARROW:case n.KEY_CODE.UP_ARROW:o.preventDefault(),m.selectPrevious(),c();break;case n.KEY_CODE.RIGHT_ARROW:case n.KEY_CODE.DOWN_ARROW:o.preventDefault(),m.selectNext(),c();break;case n.KEY_CODE.ENTER:var r=t.element(e.getClosest(a[0],"form"));r.length>0&&r.triggerHandler("submit")}}a.addClass("_md"),o(a);var m=s[0],u=s[1]||e.fakeNgModel();m.init(u),r.mouseActive=!1,a.attr({role:"radiogroup",tabIndex:a.attr("tabindex")||"0"}).on("keydown",l).on("mousedown",function(e){r.mouseActive=!0,i(function(){r.mouseActive=!1},100)}).on("focus",function(){r.mouseActive===!1&&m.$element.addClass("md-focused")}).on("blur",function(){m.$element.removeClass("md-focused")})}function a(e){this._radioButtonRenderFns=[],this.$element=e}function d(){return{init:function(e){this._ngModelCtrl=e,this._ngModelCtrl.$render=t.bind(this,this.render)},add:function(e){this._radioButtonRenderFns.push(e)},remove:function(e){var t=this._radioButtonRenderFns.indexOf(e);t!==-1&&this._radioButtonRenderFns.splice(t,1)},render:function(){this._radioButtonRenderFns.forEach(function(e){e()})},setViewValue:function(e,t){this._ngModelCtrl.$setViewValue(e,t),this.render()},getViewValue:function(){return this._ngModelCtrl.$viewValue},selectNext:function(){return s(this.$element,1)},selectPrevious:function(){return s(this.$element,-1)},setActiveDescendant:function(e){this.$element.attr("aria-activedescendant",e)},isDisabled:function(){return this.$element[0].hasAttribute("disabled")}}}function s(n,o){var i=e.iterator(n[0].querySelectorAll("md-radio-button"),!0);if(i.count()){var r=function(e){return!t.element(e).attr("disabled")},a=n[0].querySelector("md-radio-button.md-checked"),d=i[o<0?"previous":"next"](a,r)||i.first();t.element(d).triggerHandler("click")}}return a.prototype=d(),{restrict:"E",controller:["$element",a],require:["mdRadioGroup","?ngModel"],link:{pre:r}}}function n(e,t,n){function o(o,r,a,d){function s(){if(!d)throw"RadioButton: No RadioGroupController could be found.";d.add(l),a.$observe("value",l),r.on("click",c).on("$destroy",function(){d.remove(l)})}function c(e){r[0].hasAttribute("disabled")||d.isDisabled()||o.$apply(function(){d.setViewValue(a.value,e&&e.type)})}function l(){function e(e){"MD-RADIO-GROUP"!=r.parent()[0].nodeName&&r.parent()[e?"addClass":"removeClass"](i)}var t=d.getViewValue()==a.value;t!==u&&(u=t,r.attr("aria-checked",t),t?(e(!0),r.addClass(i),d.setActiveDescendant(r.attr("id"))):(e(!1),r.removeClass(i)))}function m(n,o){function i(){return a.id||"radio_"+t.nextUid()}o.ariaId=i(),n.attr({id:o.ariaId,role:"radio","aria-checked":"false"}),e.expectWithText(n,"aria-label")}var u;n(r),m(r,o),s()}var i="md-checked";return{restrict:"E",require:"^mdRadioGroup",transclude:!0,template:'<div class="md-container" md-ink-ripple md-ink-ripple-checkbox><div class="md-off"></div><div class="md-on"></div></div><div ng-transclude class="md-label"></div>',link:o}}t.module("material.components.radioButton",["material.core"]).directive("mdRadioGroup",e).directive("mdRadioButton",n),e.$inject=["$mdUtil","$mdConstant","$mdTheming","$timeout"],n.$inject=["$mdAria","$mdUtil","$mdTheming"]}(),function(){function o(e,o,i,r,a,d,s){function c(d,c){var l=t.element("<md-select-value><span></span></md-select-value>");if(l.append('<span class="md-select-icon" aria-hidden="true"></span>'),l.addClass("md-select-value"),l[0].hasAttribute("id")||l.attr("id","select_value_label_"+o.nextUid()),d.find("md-content").length||d.append(t.element("<md-content>").append(d.contents())),c.mdOnOpen&&(d.find("md-content").prepend(t.element('<div> <md-progress-circular md-mode="indeterminate" ng-if="$$loadingAsyncDone === false" md-diameter="25px"></md-progress-circular></div>')),d.find("md-option").attr("ng-show","$$loadingAsyncDone")),c.name){var m=t.element('<select class="md-visually-hidden">');m.attr({name:c.name,"aria-hidden":"true",tabindex:"-1"});var u=d.find("md-option");t.forEach(u,function(e){var n=t.element("<option>"+e.innerHTML+"</option>");e.hasAttribute("ng-value")?n.attr("ng-value",e.getAttribute("ng-value")):e.hasAttribute("value")&&n.attr("value",e.getAttribute("value")),m.append(n)}),m.append('<option ng-value="'+c.ngModel+'" selected></option>'),d.parent().append(m)}var p=o.parseAttributeBoolean(c.multiple),h=p?"multiple":"",f='<div class="md-select-menu-container" aria-hidden="true"><md-select-menu {0}>{1}</md-select-menu></div>';return f=o.supplant(f,[h,d.html()]),d.empty().append(l),d.append(f),c.tabindex||c.$set("tabindex",0),function(d,c,l,m){function u(){var e=c.attr("aria-label")||c.attr("placeholder");!e&&M&&M.label&&(e=M.label.text()),C=e,a.expect(c,"aria-label",e)}function h(){N&&(H=H||N.find("md-select-menu").controller("mdSelectMenu"),T.setLabelText(H.selectedLabels()))}function f(){if(C){var e=H.selectedLabels({mode:"aria"});c.attr("aria-label",e.length?C+": "+e:C)}}function g(){M&&M.setHasValue(H.selectedLabels().length>0||(c[0].validity||{}).badInput)}function b(){if(N=t.element(c[0].querySelector(".md-select-menu-container")),D=d,l.mdContainerClass){var e=N[0].getAttribute("class")+" "+l.mdContainerClass;N[0].setAttribute("class",e)}H=N.find("md-select-menu").controller("mdSelectMenu"),H.init(A,l.ngModel),c.on("$destroy",function(){N.remove()})}function v(e){if(i.isNavigationKey(e))e.preventDefault(),E(e);else if(i.isInputKey(e)||i.isNumPadKey(e)){e.preventDefault();var n=H.optNodeForKeyboardSearch(e);if(!n||n.hasAttribute("disabled"))return;var o=t.element(n).controller("mdOption");H.isMultiple||H.deselect(Object.keys(H.selected)[0]),H.select(o.hashKey,o.value),H.refreshViewValue()}}function E(){D._mdSelectIsOpen=!0,c.attr("aria-expanded","true"),e.show({scope:D,preserveScope:!0,skipCompile:!0,element:N,target:c[0],selectCtrl:T,preserveElement:!0,hasBackdrop:!0,loadingAsync:!!l.mdOnOpen&&(d.$eval(l.mdOnOpen)||!0)})["finally"](function(){D._mdSelectIsOpen=!1,c.focus(),c.attr("aria-expanded","false"),A.$setTouched()})}var $,C,y=!0,M=m[0],T=m[1],A=m[2],w=m[3],k=c.find("md-select-value"),_=t.isDefined(l.readonly),x=o.parseAttributeBoolean(l.mdNoAsterisk);if(M){var S=M.isErrorGetter||function(){return A.$invalid&&(A.$touched||w&&w.$submitted)};if(M.input&&c.find("md-select-header").find("input")[0]!==M.input[0])throw new Error("<md-input-container> can only have *one* child <input>, <textarea> or <select> element!");M.input=c,M.label||a.expect(c,"aria-label",c.attr("placeholder")),d.$watch(S,M.setInvalid)}var N,D,H;b(),r(c),w&&t.isDefined(l.multiple)&&o.nextTick(function(){var e=A.$modelValue||A.$viewValue;e&&w.$setPristine()});var I=A.$render;A.$render=function(){I(),h(),f(),g()},l.$observe("placeholder",A.$render),M&&M.label&&l.$observe("required",function(e){M.label.toggleClass("md-required",e&&!x)}),T.setLabelText=function(e){if(T.setIsPlaceholder(!e),l.mdSelectedText)e=s(l.mdSelectedText)(d);else{var t=l.placeholder||(M&&M.label?M.label.text():"");e=e||t||""}var n=k.children().eq(0);n.html(e)},T.setIsPlaceholder=function(e){e?(k.addClass("md-select-placeholder"),M&&M.label&&M.label.addClass("md-placeholder")):(k.removeClass("md-select-placeholder"),M&&M.label&&M.label.removeClass("md-placeholder"))},_||(c.on("focus",function(e){M&&M.setFocused(!0)}),c.on("blur",function(e){y&&(y=!1,D._mdSelectIsOpen&&e.stopImmediatePropagation()),D._mdSelectIsOpen||(M&&M.setFocused(!1),g())})),T.triggerClose=function(){s(l.mdOnClose)(d)},d.$$postDigest(function(){u(),h(),f()}),d.$watch(function(){return H.selectedLabels()},h);var O;l.$observe("ngMultiple",function(e){O&&O();var t=s(e);O=d.$watch(function(){return t(d)},function(e,t){e===n&&t===n||(e?c.attr("multiple","multiple"):c.removeAttr("multiple"),c.attr("aria-multiselectable",e?"true":"false"),N&&(H.setMultiple(e),I=A.$render,A.$render=function(){I(),h(),f(),g()},A.$render()))})}),l.$observe("disabled",function(e){t.isString(e)&&(e=!0),$!==n&&$===e||($=e,e?c.attr({"aria-disabled":"true"}).removeAttr("tabindex").off("click",E).off("keydown",v):c.attr({tabindex:l.tabindex,"aria-disabled":"false"}).on("click",E).on("keydown",v))}),l.hasOwnProperty("disabled")||l.hasOwnProperty("ngDisabled")||(c.attr({"aria-disabled":"false"}),c.on("click",E),c.on("keydown",v));var R={role:"listbox","aria-expanded":"false","aria-multiselectable":p&&!l.ngMultiple?"true":"false"};c[0].hasAttribute("id")||(R.id="select_"+o.nextUid());var L="select_container_"+o.nextUid();N.attr("id",L),R["aria-owns"]=L,c.attr(R),d.$on("$destroy",function(){e.destroy()["finally"](function(){M&&(M.setFocused(!1),M.setHasValue(!1),M.input=null),A.$setTouched()})})}}var l=i.KEY_CODE;[l.SPACE,l.ENTER,l.UP_ARROW,l.DOWN_ARROW];return{restrict:"E",require:["^?mdInputContainer","mdSelect","ngModel","?^form"],compile:c,controller:function(){}}}function i(e,o,i,r){function a(e,n,i,a){function d(e){13!=e.keyCode&&32!=e.keyCode||s(e)}function s(n){var i=o.getClosest(n.target,"md-option"),r=i&&t.element(i).data("$mdOptionController");if(i&&r){if(i.hasAttribute("disabled"))return n.stopImmediatePropagation(),!1;var a=c.hashGetter(r.value),d=t.isDefined(c.selected[a]);e.$apply(function(){c.isMultiple?d?c.deselect(a):c.select(a,r.value):d||(c.deselect(Object.keys(c.selected)[0]),c.select(a,r.value)),c.refreshViewValue()})}}var c=a[0];n.addClass("_md"),r(n),n.on("click",s),n.on("keypress",d)}function d(r,a,d){function s(){var e=m.ngModel.$modelValue||m.ngModel.$viewValue||[];if(t.isArray(e)){var n=Object.keys(m.selected),o=e.map(m.hashGetter),i=n.filter(function(e){return o.indexOf(e)===-1});i.forEach(m.deselect),o.forEach(function(t,n){m.select(t,e[n])})}}function c(){var e=m.ngModel.$viewValue||m.ngModel.$modelValue;Object.keys(m.selected).forEach(m.deselect),m.select(m.hashGetter(e),e)}var m=this;m.isMultiple=t.isDefined(a.multiple),m.selected={},m.options={},r.$watchCollection(function(){return m.options},function(){m.ngModel.$render()});var u,p;m.setMultiple=function(e){function n(e,n){return t.isArray(e||n||[])}var o=m.ngModel;p=p||o.$isEmpty,m.isMultiple=e,u&&u(),m.isMultiple?(o.$validators["md-multiple"]=n,o.$render=s,r.$watchCollection(m.modelBinding,function(e){n(e)&&s(e),m.ngModel.$setPristine()}),o.$isEmpty=function(e){return!e||0===e.length}):(delete o.$validators["md-multiple"],o.$render=c)};var h,f,g,b="",v=300;m.optNodeForKeyboardSearch=function(e){h&&clearTimeout(h),h=setTimeout(function(){h=n,b="",g=n,f=n},v);var o=e.keyCode-(i.isNumPadKey(e)?48:0);b+=String.fromCharCode(o);var r=new RegExp("^"+b,"i");f||(f=d.find("md-option"),g=new Array(f.length),t.forEach(f,function(e,t){g[t]=e.textContent.trim()}));for(var a=0;a<g.length;++a)if(r.test(g[a]))return f[a]},m.init=function(n,o){if(m.ngModel=n,m.modelBinding=o,m.ngModel.$isEmpty=function(e){return!m.options[m.hashGetter(e)]},n.$options&&n.$options.trackBy){var i={},a=e(n.$options.trackBy);m.hashGetter=function(e,t){return i.$value=e,a(t||r,i)}}else m.hashGetter=function(e){return t.isObject(e)?"object_"+(e.$$mdSelectId||(e.$$mdSelectId=++l)):e};m.setMultiple(m.isMultiple)},m.selectedLabels=function(e){e=e||{};var t=e.mode||"html",n=o.nodesToArray(d[0].querySelectorAll("md-option[selected]"));if(n.length){var i;return"html"==t?i=function(e){if(e.hasAttribute("md-option-empty"))return"";var t=e.innerHTML,n=e.querySelector(".md-ripple-container");n&&(t=t.replace(n.outerHTML,""));var o=e.querySelector(".md-container");return o&&(t=t.replace(o.outerHTML,"")),t}:"aria"==t&&(i=function(e){return e.hasAttribute("aria-label")?e.getAttribute("aria-label"):e.textContent}),n.map(i).join(", ")}return""},m.select=function(e,t){var n=m.options[e];n&&n.setSelected(!0),m.selected[e]=t},m.deselect=function(e){var t=m.options[e];t&&t.setSelected(!1),delete m.selected[e]},m.addOption=function(e,n){if(t.isDefined(m.options[e]))throw new Error('Duplicate md-option values are not allowed in a select. Duplicate value "'+n.value+'" found.');m.options[e]=n,t.isDefined(m.selected[e])&&(m.select(e,n.value),t.isDefined(m.ngModel.$modelValue)&&m.hashGetter(m.ngModel.$modelValue)===e&&m.ngModel.$validate(),m.refreshViewValue())},m.removeOption=function(e){delete m.options[e]},m.refreshViewValue=function(){var e,n=[];for(var o in m.selected)(e=m.options[o])?n.push(e.value):n.push(m.selected[o]);var i=m.ngModel.$options&&m.ngModel.$options.trackBy,r=m.isMultiple?n:n[0],a=m.ngModel.$modelValue;(i?t.equals(a,r):a==r)||(m.ngModel.$setViewValue(r),m.ngModel.$render())}}return d.$inject=["$scope","$attrs","$element"],{restrict:"E",require:["mdSelectMenu"],scope:!1,controller:d,link:{pre:a}}}function r(e,n){function o(e,n){return e.append(t.element('<div class="md-text">').append(e.contents())),e.attr("tabindex",n.tabindex||"0"),i(n)||e.attr("md-option-empty",""),r}function i(e){var t=e.value,n=e.ngValue;return t||n}function r(o,i,r,a){function d(e,t,n){if(!l.hashGetter)return void(n||o.$$postDigest(function(){d(e,t,!0)}));var i=l.hashGetter(t,o),r=l.hashGetter(e,o);c.hashKey=r,c.value=e,l.removeOption(i,c),l.addOption(r,c)}function s(){var e={role:"option","aria-selected":"false"};i[0].hasAttribute("id")||(e.id="select_option_"+n.nextUid()),i.attr(e)}var c=a[0],l=a[1];l.isMultiple&&(i.addClass("md-checkbox-enabled"),i.prepend(m.clone())),t.isDefined(r.ngValue)?o.$watch(r.ngValue,d):t.isDefined(r.value)?d(r.value):o.$watch(function(){return i.text().trim()},d),r.$observe("disabled",function(e){e?i.attr("tabindex","-1"):i.attr("tabindex","0")}),o.$$postDigest(function(){r.$observe("selected",function(e){t.isDefined(e)&&("string"==typeof e&&(e=!0),e?(l.isMultiple||l.deselect(Object.keys(l.selected)[0]),l.select(c.hashKey,c.value)):l.deselect(c.hashKey),l.refreshViewValue())})}),e.attach(o,i),s(),o.$on("$destroy",function(){l.removeOption(c.hashKey,c)})}function a(e){this.selected=!1,this.setSelected=function(t){t&&!this.selected?e.attr({selected:"selected","aria-selected":"true"}):!t&&this.selected&&(e.removeAttr("selected"),e.attr("aria-selected","false")),this.selected=t}}return a.$inject=["$element"],{restrict:"E",require:["mdOption","^^mdSelectMenu"],controller:a,compile:o}}function a(){function e(e,n){function o(){return e.parent().find("md-select-header").length}function i(){var o=e.find("label");o.length||(o=t.element("<label>"),e.prepend(o)),o.addClass("md-container-ignore"),n.label&&o.text(n.label)}o()||i()}return{restrict:"E",compile:e}}function d(){return{restrict:"E"}}function s(o){function i(o,i,l,m,u,p,h,f,g){function b(e,t,n){function o(){return h(t,{addClass:"md-leave"}).start()}function i(){t.removeClass("md-active"),t.attr("aria-hidden","true"),t[0].style.display="none",E(n),!n.$destroy&&n.restoreFocus&&n.target.focus()}return n=n||{},n.cleanupInteraction(),n.cleanupResizing(),n.hideBackdrop(),n.$destroy===!0?i():o().then(i)}function v(e,r,a){function d(e,t,n){return n.parent.append(t),u(function(e,n){try{h(t,{removeClass:"md-leave",duration:0}).start().then(s).then(e)}catch(o){n(o)}})}function s(){return u(function(t){if(a.isRemoved)return u.reject(!1);var n=$(e,r,a);n.container.element.css(y.toCss(n.container.styles)),n.dropDown.element.css(y.toCss(n.dropDown.styles)),p(function(){r.addClass("md-active"),n.dropDown.element.css(y.toCss({transform:""})),b(a.focusedNode),t()})})}function c(e,t,n){return n.disableParentScroll&&!l.getClosest(n.target,"MD-DIALOG")?n.restoreScroll=l.disableScrollAround(n.element,n.parent):n.disableParentScroll=!1,n.hasBackdrop&&(n.backdrop=l.createBackdrop(e,"md-select-backdrop md-click-catcher"),f.enter(n.backdrop,g[0].body,null,{duration:0})),function(){n.backdrop&&n.backdrop.remove(),n.disableParentScroll&&n.restoreScroll(),delete n.restoreScroll}}function b(e){e&&!e.hasAttribute("disabled")&&e.focus()}function v(e,n){var o=r.find("md-select-menu");if(!n.target)throw new Error(l.supplant(C,[n.target]));t.extend(n,{isRemoved:!1,target:t.element(n.target),parent:t.element(n.parent),selectEl:o,contentEl:r.find("md-content"),optionNodes:o[0].getElementsByTagName("md-option")})}function E(){var n=function(e,t,n){return function(){if(!n.isRemoved){var o=$(e,t,n),i=o.container,r=o.dropDown;i.element.css(y.toCss(i.styles)),r.element.css(y.toCss(r.styles))}}}(e,r,a),o=t.element(m);return o.on("resize",n),o.on("orientationchange",n),function(){o.off("resize",n),o.off("orientationchange",n)}}function T(){a.loadingAsync&&!a.isRemoved&&(e.$$loadingAsyncDone=!1,u.when(a.loadingAsync).then(function(){e.$$loadingAsyncDone=!0,delete a.loadingAsync}).then(function(){p(s)}))}function A(){function e(e){e.preventDefault(),e.stopPropagation(),a.restoreFocus=!1,l.nextTick(o.hide,!0)}function t(e){switch(e.preventDefault(),e.stopPropagation(),e.keyCode){case M.UP_ARROW:return c();case M.DOWN_ARROW:return s();case M.SPACE:case M.ENTER:var t=l.getClosest(e.target,"md-option");t&&(u.triggerHandler({type:"click",target:t}),e.preventDefault()),m(e);break;case M.TAB:case M.ESCAPE:e.stopPropagation(),e.preventDefault(),a.restoreFocus=!0,l.nextTick(o.hide,!0);break;default:if(i.isInputKey(e)||i.isNumPadKey(e)){var n=u.controller("mdSelectMenu").optNodeForKeyboardSearch(e);a.focusedNode=n||a.focusedNode,n&&n.focus()}}}function d(e){var t,o=l.nodesToArray(a.optionNodes),i=o.indexOf(a.focusedNode);do i===-1?i=0:"next"===e&&i<o.length-1?i++:"prev"===e&&i>0&&i--,t=o[i],t.hasAttribute("disabled")&&(t=n);while(!t&&i<o.length-1&&i>0);t&&t.focus(),a.focusedNode=t}function s(){d("next")}function c(){d("prev")}function m(e){function t(){var t=!1;if(e&&e.currentTarget.children.length>0){var n=e.currentTarget.children[0],o=n.scrollHeight>n.clientHeight;if(o&&n.children.length>0){var i=e.pageX-e.currentTarget.getBoundingClientRect().left;i>n.querySelector("md-option").offsetWidth&&(t=!0)}}return t}if(!(e&&"click"==e.type&&e.currentTarget!=u[0]||t())){var n=l.getClosest(e.target,"md-option");n&&n.hasAttribute&&!n.hasAttribute("disabled")&&(e.preventDefault(),e.stopPropagation(),p.isMultiple||(a.restoreFocus=!0,l.nextTick(function(){o.hide(p.ngModel.$viewValue)},!0)))}}if(!a.isRemoved){var u=a.selectEl,p=u.controller("mdSelectMenu")||{};return r.addClass("md-clickable"),a.backdrop&&a.backdrop.on("click",e),u.on("keydown",t),u.on("click",m),function(){a.backdrop&&a.backdrop.off("click",e),u.off("keydown",t),u.off("click",m),r.removeClass("md-clickable"),a.isRemoved=!0}}}return T(),v(e,a),a.hideBackdrop=c(e,r,a),d(e,r,a).then(function(e){return r.attr("aria-hidden","false"),a.alreadyOpen=!0,a.cleanupInteraction=A(),a.cleanupResizing=E(),e},a.hideBackdrop)}function E(e){var t=e.selectCtrl;if(t){var n=e.selectEl.controller("mdSelectMenu");t.setLabelText(n?n.selectedLabels():""),t.triggerClose()}}function $(n,o,i){var u,p=o[0],h=i.target[0].children[0],f=g[0].body,b=i.selectEl[0],v=i.contentEl[0],E=f.getBoundingClientRect(),$=h.getBoundingClientRect(),C=!1,y={left:E.left+c,top:c,bottom:E.height-c,right:E.width-c-(l.floatingScrollbars()?16:0)},M={top:$.top-y.top,left:$.left-y.left,right:y.right-($.left+$.width),bottom:y.bottom-($.top+$.height)},T=E.width-2*c,A=b.querySelector("md-option[selected]"),w=b.getElementsByTagName("md-option"),k=b.getElementsByTagName("md-optgroup"),_=s(o,v),x=r(i.loadingAsync);u=x?v.firstElementChild||v:A?A:k.length?k[0]:w.length?w[0]:v.firstElementChild||v,v.offsetWidth>T?v.style["max-width"]=T+"px":v.style.maxWidth=null,C&&(v.style["min-width"]=$.width+"px"),_&&b.classList.add("md-overflow");var S=u;"MD-OPTGROUP"===(S.tagName||"").toUpperCase()&&(S=w[0]||v.firstElementChild||v,u=S),i.focusedNode=S,p.style.display="block";var N=b.getBoundingClientRect(),D=d(u);if(u){var H=m.getComputedStyle(u);D.paddingLeft=parseInt(H.paddingLeft,10)||0,D.paddingRight=parseInt(H.paddingRight,10)||0}if(_){var I=v.offsetHeight/2;v.scrollTop=D.top+D.height/2-I,M.top<I?v.scrollTop=Math.min(D.top,v.scrollTop+I-M.top):M.bottom<I&&(v.scrollTop=Math.max(D.top+D.height-N.height,v.scrollTop-I+M.bottom))}var O,R,L,P,F;C?(O=$.left,R=$.top+$.height,L="50% 0",R+N.height>y.bottom&&(R=$.top-N.height,L="50% 100%")):(O=$.left+D.left-D.paddingLeft+2,R=Math.floor($.top+$.height/2-D.height/2-D.top+v.scrollTop)+2,L=D.left+$.width/2+"px "+(D.top+D.height/2-v.scrollTop)+"px 0px",P=Math.min($.width+D.paddingLeft+D.paddingRight,T),F=e.getComputedStyle(h)["font-size"]);var B=p.getBoundingClientRect(),U=Math.round(100*Math.min($.width/N.width,1))/100,j=Math.round(100*Math.min($.height/N.height,1))/100;return{container:{element:t.element(p),styles:{left:Math.floor(a(y.left,O,y.right-B.width)),top:Math.floor(a(y.top,R,y.bottom-B.height)),"min-width":P,"font-size":F}},dropDown:{element:t.element(b),styles:{transformOrigin:L,transform:i.alreadyOpen?"":l.supplant("scale({0},{1})",[U,j])}}}}var C="$mdSelect.show() expected a target element in options.target but got '{0}'!",y=l.dom.animator,M=i.KEY_CODE;return{parent:"body",themable:!0,onShow:v,onRemove:b,hasBackdrop:!0,disableParentScroll:!0}}function r(e){return e&&t.isFunction(e.then)}function a(e,t,n){return Math.max(e,Math.min(t,n))}function d(e){return e?{left:e.offsetLeft,top:e.offsetTop,width:e.offsetWidth,height:e.offsetHeight}:{left:0,top:0,width:0,height:0}}function s(e,t){var n=!1;try{var o=e[0].style.display;e[0].style.display="block",n=t.scrollHeight>t.offsetHeight,e[0].style.display=o}finally{}return n}return i.$inject=["$mdSelect","$mdConstant","$mdUtil","$window","$q","$$rAF","$animateCss","$animate","$document"],o("$mdSelect").setDefaults({methods:["target"],options:i})}var c=8,l=0,m=t.element('<div class="md-container"><div class="md-icon"></div></div>');t.module("material.components.select",["material.core","material.components.backdrop"]).directive("mdSelect",o).directive("mdSelectMenu",i).directive("mdOption",r).directive("mdOptgroup",a).directive("mdSelectHeader",d).provider("$mdSelect",s),o.$inject=["$mdSelect","$mdUtil","$mdConstant","$mdTheming","$mdAria","$compile","$parse"],i.$inject=["$parse","$mdUtil","$mdConstant","$mdTheming"],r.$inject=["$mdButtonInkRipple","$mdUtil"],s.$inject=["$$interimElementProvider"]}(),function(){function e(e,t){
return["$mdUtil","$window",function(n,o){return{restrict:"A",multiElement:!0,link:function(i,r,a){var d=i.$on("$md-resize-enable",function(){d();var s=r[0],c=s.nodeType===o.Node.ELEMENT_NODE?o.getComputedStyle(s):{};i.$watch(a[e],function(e){if(!!e===t){n.nextTick(function(){i.$broadcast("$md-resize")});var o={cachedTransitionStyles:c};n.dom.animator.waitTransitionEnd(r,o).then(function(){i.$broadcast("$md-resize")})}})})}}}]}t.module("material.components.showHide",["material.core"]).directive("ngShow",e("ngShow",!0)).directive("ngHide",e("ngHide",!1))}(),function(){function e(e,o,i,r){function a(e,n){var r=function(){return!1},a=function(){return i.when(o.supplant(c,[n||""]))};return t.extend({isLockedOpen:r,isOpen:r,toggle:a,open:a,close:a,onClose:t.noop,then:function(e){return s(n).then(e||t.noop)}},e)}function d(t,i){var a=e.get(t);return a||i?a:(r.error(o.supplant(c,[t||""])),n)}function s(t){return e.when(t)["catch"](r.error)}var c="SideNav '{0}' is not available! Did you use md-component-id='{0}'?",l={find:d,waitFor:s};return function(e,n){if(t.isUndefined(e))return l;var o=n===!0,i=l.find(e,o);return!i&&o?l.waitFor(e):!i&&t.isUndefined(n)?a(l,e):i}}function o(){return{restrict:"A",require:"^mdSidenav",link:function(e,t,n,o){}}}function i(e,o,i,r,a,d,s,c,l,m){function u(d,u,p,h){function f(e,t){d.isLockedOpen=e,e===t?u.toggleClass("md-locked-open",!!e):a[e?"addClass":"removeClass"](u,"md-locked-open"),M&&M.toggleClass("md-locked-open",!!e)}function g(e){var t=o.findFocusTarget(u)||o.findFocusTarget(u,"[md-sidenav-focus]")||u,n=u.parent();n[e?"on":"off"]("keydown",$),M&&M[e?"on":"off"]("click",C);var i=b(n,e);return e&&(A=m[0].activeElement),v(e),w=l.all([e&&M?a.enter(M,n):M?a.leave(M):l.when(!0),a[e?"removeClass":"addClass"](u,"md-closed")]).then(function(){d.isOpen&&t&&t.focus(),i&&i()})}function b(e,t){var n=u[0],o=e[0].scrollTop;if(t&&o){T={top:n.style.top,bottom:n.style.bottom,height:n.style.height};var i={top:o+"px",bottom:"auto",height:e[0].clientHeight+"px"};u.css(i),M.css(i)}if(!t&&T)return function(){n.style.top=T.top,n.style.bottom=T.bottom,n.style.height=T.height,M[0].style.top=null,M[0].style.bottom=null,M[0].style.height=null,T=null}}function v(e){var o=u.parent();e&&!y?(y=o.css("overflow"),o.css("overflow","hidden")):t.isDefined(y)&&(o.css("overflow",y),y=n)}function E(e){return d.isOpen==e?l.when(!0):(d.isOpen&&h.onCloseCb&&h.onCloseCb(),l(function(t){d.isOpen=e,o.nextTick(function(){w.then(function(e){d.isOpen||(A&&A.focus(),A=null),t(e)})})}))}function $(e){var t=e.keyCode===i.KEY_CODE.ESCAPE;return t?C(e):l.when(!0)}function C(e){return e.preventDefault(),h.close()}var y,M,T,A=null,w=l.when(!0),k=s(p.mdIsLockedOpen),_=function(){return k(d.$parent,{$media:function(t){return c.warn("$media is deprecated for is-locked-open. Use $mdMedia instead."),e(t)},$mdMedia:e})};t.isDefined(p.mdDisableBackdrop)||(M=o.createBackdrop(d,"md-sidenav-backdrop md-opaque ng-enter")),u.addClass("_md"),r(u),M&&r.inherit(M,u),u.on("$destroy",function(){M&&M.remove(),h.destroy()}),d.$on("$destroy",function(){M&&M.remove()}),d.$watch(_,f),d.$watch("isOpen",g),h.$toggleOpen=E}return{restrict:"E",scope:{isOpen:"=?mdIsOpen"},controller:"$mdSidenavController",compile:function(e){return e.addClass("md-closed"),e.attr("tabIndex","-1"),u}}}function r(e,t,n,o,i){var r=this;r.isOpen=function(){return!!e.isOpen},r.isLockedOpen=function(){return!!e.isLockedOpen},r.onClose=function(e){return r.onCloseCb=e,r},r.open=function(){return r.$toggleOpen(!0)},r.close=function(){return r.$toggleOpen(!1)},r.toggle=function(){return r.$toggleOpen(!e.isOpen)},r.$toggleOpen=function(t){return i.when(e.isOpen=t)},r.destroy=o.register(r,n.mdComponentId)}t.module("material.components.sidenav",["material.core","material.components.backdrop"]).factory("$mdSidenav",e).directive("mdSidenav",i).directive("mdSidenavFocus",o).controller("$mdSidenavController",r),e.$inject=["$mdComponentRegistry","$mdUtil","$q","$log"],i.$inject=["$mdMedia","$mdUtil","$mdConstant","$mdTheming","$animate","$compile","$parse","$log","$q","$document"],r.$inject=["$scope","$element","$attrs","$mdComponentRegistry","$q"]}(),function(){function e(){return{controller:function(){},compile:function(e){var o=e.find("md-slider");if(o){var i=o.attr("md-vertical");return i!==n&&e.attr("md-vertical",""),o.attr("flex")||o.attr("flex",""),function(e,n,o,i){function r(e){n.children().attr("disabled",e),n.find("input").attr("disabled",e)}n.addClass("_md");var a=t.noop;o.disabled?r(!0):o.ngDisabled&&(a=e.$watch(o.ngDisabled,function(e){r(e)})),e.$on("$destroy",function(){a()});var d;i.fitInputWidthToTextLength=function(e){var t=n[0].querySelector("md-input-container");if(t){var o=getComputedStyle(t),i=parseInt(o.minWidth),r=2*parseInt(o.padding);d=d||parseInt(o.maxWidth);var a=Math.max(d,i+r+i/2*e);t.style.maxWidth=a+"px"}}}}}}}function o(e,n,o,i,r,a,d,s,c,l){function m(e,n){var i=t.element(e[0].getElementsByClassName("md-slider-wrapper")),r=n.tabindex||0;return i.attr("tabindex",r),(n.disabled||n.ngDisabled)&&i.attr("tabindex",-1),i.attr("role","slider"),o.expect(e,"aria-label"),u}function u(o,m,u,p){function h(){y(),x()}function f(e){se=parseFloat(e),m.attr("aria-valuemin",e),h()}function g(e){ce=parseFloat(e),m.attr("aria-valuemax",e),h()}function b(e){le=parseFloat(e)}function v(e){me=S(parseInt(e),0,6)}function E(){m.attr("aria-disabled",!!Y())}function $(){if(ie&&!Y()&&!t.isUndefined(le)){if(le<=0){var e="Slider step value must be greater than zero when in discrete mode";throw c.error(e),new Error(e)}var o=Math.floor((ce-se)/le);ue||(ue=t.element("<canvas>").css("position","absolute"),J.append(ue),pe=ue[0].getContext("2d"));var i=M();!i||i.height||i.width||(y(),i=he),ue[0].width=i.width,ue[0].height=i.height;for(var r,a=0;a<=o;a++){var d=n.getComputedStyle(J[0]);pe.fillStyle=d.color||"black",r=Math.floor((oe?i.height:i.width)*(a/o)),pe.fillRect(oe?0:r-1,oe?r-1:0,oe?i.width:2,oe?2:i.height)}}}function C(){if(ue&&pe){var e=M();pe.clearRect(0,0,e.width,e.height)}}function y(){he=Q[0].getBoundingClientRect()}function M(){return te(),he}function T(e){if(!Y()){var t;(oe?e.keyCode===r.KEY_CODE.DOWN_ARROW:e.keyCode===r.KEY_CODE.LEFT_ARROW)?t=-le:(oe?e.keyCode===r.KEY_CODE.UP_ARROW:e.keyCode===r.KEY_CODE.RIGHT_ARROW)&&(t=le),t=re?-t:t,t&&((e.metaKey||e.ctrlKey||e.altKey)&&(t*=4),e.preventDefault(),e.stopPropagation(),o.$evalAsync(function(){_(W.$viewValue+t)}))}}function A(){$(),o.mouseActive=!0,ee.removeClass("md-focused"),l(function(){o.mouseActive=!1},100)}function w(){o.mouseActive===!1&&ee.addClass("md-focused")}function k(){ee.removeClass("md-focused"),m.removeClass("md-active"),C()}function _(e){W.$setViewValue(S(N(e)))}function x(){isNaN(W.$viewValue)&&(W.$viewValue=W.$modelValue),W.$viewValue=S(W.$viewValue);var e=z(W.$viewValue);o.modelValue=W.$viewValue,m.attr("aria-valuenow",W.$viewValue),D(e),G.text(W.$viewValue)}function S(e,n,o){if(t.isNumber(e))return n=t.isNumber(n)?n:se,o=t.isNumber(o)?o:ce,Math.max(n,Math.min(o,e))}function N(e){if(t.isNumber(e)){var n=Math.round((e-se)/le)*le+se;return n=Math.round(n*Math.pow(10,me))/Math.pow(10,me),V&&V.fitInputWidthToTextLength&&i.debounce(function(){V.fitInputWidthToTextLength(n.toString().length)},100)(),n}}function D(e){e=U(e);var t=100*e+"%",n=re?100*(1-e)+"%":t;oe?X.css("bottom",t):i.bidiProperty(X,"left","right",t),Z.css(oe?"height":"width",n),m.toggleClass(re?"md-max":"md-min",0===e),m.toggleClass(re?"md-min":"md-max",1===e)}function H(e){if(!Y()){m.addClass("md-active"),m[0].focus(),y();var t=q(j(oe?e.pointer.y:e.pointer.x)),n=S(N(t));o.$apply(function(){_(n),D(z(n))})}}function I(e){if(!Y()){m.removeClass("md-dragging");var t=q(j(oe?e.pointer.y:e.pointer.x)),n=S(N(t));o.$apply(function(){_(n),x()})}}function O(e){Y()||(fe=!0,e.stopPropagation(),m.addClass("md-dragging"),P(e))}function R(e){fe&&(e.stopPropagation(),P(e))}function L(e){fe&&(e.stopPropagation(),fe=!1)}function P(e){ie?B(oe?e.pointer.y:e.pointer.x):F(oe?e.pointer.y:e.pointer.x)}function F(e){o.$evalAsync(function(){_(q(j(e)))})}function B(e){var t=q(j(e)),n=S(N(t));D(j(e)),G.text(n)}function U(e){return Math.max(0,Math.min(e||0,1))}function j(e){var t=oe?he.top:he.left,n=oe?he.height:he.width,o=(e-t)/n;return oe||"rtl"!==i.bidi()||(o=1-o),Math.max(0,Math.min(1,oe?1-o:o))}function q(e){var t=re?1-e:e;return se+t*(ce-se)}function z(e){var t=(e-se)/(ce-se);return re?1-t:t}a(m);var W=p[0]||{$setViewValue:function(e){this.$viewValue=e,this.$viewChangeListeners.forEach(function(e){e()})},$parsers:[],$formatters:[],$viewChangeListeners:[]},V=p[1],Y=(t.element(i.getClosest(m,"_md-slider-container",!0)),u.ngDisabled?t.bind(null,s(u.ngDisabled),o.$parent):function(){return m[0].hasAttribute("disabled")}),K=t.element(m[0].querySelector(".md-thumb")),G=t.element(m[0].querySelector(".md-thumb-text")),X=K.parent(),Q=t.element(m[0].querySelector(".md-track-container")),Z=t.element(m[0].querySelector(".md-track-fill")),J=t.element(m[0].querySelector(".md-track-ticks")),ee=t.element(m[0].getElementsByClassName("md-slider-wrapper")),te=(t.element(m[0].getElementsByClassName("md-slider-content")),i.throttle(y,5e3)),ne=3,oe=t.isDefined(u.mdVertical),ie=t.isDefined(u.mdDiscrete),re=t.isDefined(u.mdInvert);t.isDefined(u.min)?u.$observe("min",f):f(0),t.isDefined(u.max)?u.$observe("max",g):g(100),t.isDefined(u.step)?u.$observe("step",b):b(1),t.isDefined(u.round)?u.$observe("round",v):v(ne);var ae=t.noop;u.ngDisabled&&(ae=o.$parent.$watch(u.ngDisabled,E)),d.register(ee,"drag",{horizontal:!oe}),o.mouseActive=!1,ee.on("keydown",T).on("mousedown",A).on("focus",w).on("blur",k).on("$md.pressdown",H).on("$md.pressup",I).on("$md.dragstart",O).on("$md.drag",R).on("$md.dragend",L),setTimeout(h,0);var de=e.throttle(h);t.element(n).on("resize",de),o.$on("$destroy",function(){t.element(n).off("resize",de)}),W.$render=x,W.$viewChangeListeners.push(x),W.$formatters.push(S),W.$formatters.push(N);var se,ce,le,me,ue,pe,he={};y();var fe=!1}return{scope:{},require:["?ngModel","?^mdSliderContainer"],template:'<div class="md-slider-wrapper"><div class="md-slider-content"><div class="md-track-container"><div class="md-track"></div><div class="md-track md-track-fill"></div><div class="md-track-ticks"></div></div><div class="md-thumb-container"><div class="md-thumb"></div><div class="md-focus-thumb"></div><div class="md-focus-ring"></div><div class="md-sign"><span class="md-thumb-text"></span></div><div class="md-disabled-thumb"></div></div></div></div>',compile:m}}t.module("material.components.slider",["material.core"]).directive("mdSlider",o).directive("mdSliderContainer",e),o.$inject=["$$rAF","$window","$mdAria","$mdUtil","$mdConstant","$mdTheming","$mdGesture","$parse","$log","$timeout"]}(),function(){function e(e,t,o,i){function r(i){function r(e,t){t.addClass("md-sticky-clone");var n={element:e,clone:t};return f.items.push(n),o.nextTick(function(){p.prepend(n.clone)}),h(),function(){f.items.forEach(function(t,n){t.element[0]===e[0]&&(f.items.splice(n,1),t.clone.remove())}),h()}}function d(){f.items.forEach(s),f.items=f.items.sort(function(e,t){return e.top<t.top?-1:1});for(var e,t=p.prop("scrollTop"),n=f.items.length-1;n>=0;n--)if(t>f.items[n].top){e=f.items[n];break}l(e)}function s(e){var t=e.element[0];for(e.top=0,e.left=0,e.right=0;t&&t!==p[0];)e.top+=t.offsetTop,e.left+=t.offsetLeft,t.offsetParent&&(e.right+=t.offsetParent.offsetWidth-t.offsetWidth-t.offsetLeft),t=t.offsetParent;e.height=e.element.prop("offsetHeight");var i=o.floatingScrollbars()?"0":n;o.bidi(e.clone,"margin-left",e.left,i),o.bidi(e.clone,"margin-right",i,e.right)}function c(){var e=p.prop("scrollTop"),t=e>(c.prevScrollTop||0);if(c.prevScrollTop=e,0===e)return void l(null);if(t){if(f.next&&f.next.top<=e)return void l(f.next);if(f.current&&f.next&&f.next.top-e<=f.next.height)return void u(f.current,e+(f.next.top-f.next.height-e))}if(!t){if(f.current&&f.prev&&e<f.current.top)return void l(f.prev);if(f.next&&f.current&&e>=f.next.top-f.current.height)return void u(f.current,e+(f.next.top-e-f.current.height))}f.current&&u(f.current,e)}function l(e){if(f.current!==e){f.current&&(u(f.current,null),m(f.current,null)),e&&m(e,"active"),f.current=e;var t=f.items.indexOf(e);f.next=f.items[t+1],f.prev=f.items[t-1],m(f.next,"next"),m(f.prev,"prev")}}function m(e,t){e&&e.state!==t&&(e.state&&(e.clone.attr("sticky-prev-state",e.state),e.element.attr("sticky-prev-state",e.state)),e.clone.attr("sticky-state",t),e.element.attr("sticky-state",t),e.state=t)}function u(t,i){t&&(null===i||i===n?t.translateY&&(t.translateY=null,t.clone.css(e.CSS.TRANSFORM,"")):(t.translateY=i,o.bidi(t.clone,e.CSS.TRANSFORM,"translate3d("+t.left+"px,"+i+"px,0)","translateY("+i+"px)")))}var p=i.$element,h=t.throttle(d);a(p),p.on("$scrollstart",h),p.on("$scroll",c);var f;return f={prev:null,current:null,next:null,items:[],add:r,refreshElements:d}}function a(e){function n(){+o.now()-r>a?(i=!1,e.triggerHandler("$scrollend")):(e.triggerHandler("$scroll"),t.throttle(n))}var i,r,a=200;e.on("scroll touchmove",function(){i||(i=!0,t.throttle(n),e.triggerHandler("$scrollstart")),e.triggerHandler("$scroll"),r=+o.now()})}var d=o.checkStickySupport();return function(e,t,n){var o=t.controller("mdContent");if(o)if(d)t.css({position:d,top:0,"z-index":2});else{var a=o.$element.data("$$sticky");a||(a=r(o),o.$element.data("$$sticky",a));var s=n||i(t.clone())(e),c=a.add(t,s);e.$on("$destroy",c)}}}t.module("material.components.sticky",["material.core","material.components.content"]).factory("$mdSticky",e),e.$inject=["$mdConstant","$$rAF","$mdUtil","$compile"]}(),function(){function e(e,n,o,i){return{restrict:"E",replace:!0,transclude:!0,template:'<div class="md-subheader _md">  <div class="md-subheader-inner">    <div class="md-subheader-content"></div>  </div></div>',link:function(r,a,d,s,c){function l(e){return t.element(e[0].querySelector(".md-subheader-content"))}o(a),a.addClass("_md"),i.prefixer().removeAttribute(a,"ng-repeat");var m=a[0].outerHTML;c(r,function(e){l(a).append(e)}),a.hasClass("md-no-sticky")||c(r,function(t){var o=n('<div class="md-subheader-wrapper">'+m+"</div>")(r);i.nextTick(function(){l(o).append(t)}),e(r,a,o)})}}}t.module("material.components.subheader",["material.core","material.components.sticky"]).directive("mdSubheader",e),e.$inject=["$mdSticky","$compile","$mdTheming","$mdUtil"]}(),function(){function e(e){function t(e){function t(t,i,r){var a=e(r[n]);i.on(o,function(e){t.$applyAsync(function(){a(t,{$event:e})})})}return{restrict:"A",link:t}}var n="md"+e,o="$md."+e.toLowerCase();return t.$inject=["$parse"],t}t.module("material.components.swipe",["material.core"]).directive("mdSwipeLeft",e("SwipeLeft")).directive("mdSwipeRight",e("SwipeRight")).directive("mdSwipeUp",e("SwipeUp")).directive("mdSwipeDown",e("SwipeDown"))}(),function(){function e(e,n,o,i,r,a,d){function s(e,s){var l=c.compile(e,s).post;return e.addClass("md-dragging"),function(e,s,c,m){function u(t){g&&g(e)||(t.stopPropagation(),s.addClass("md-dragging"),E={width:b.prop("offsetWidth")})}function p(e){if(E){e.stopPropagation(),e.srcEvent&&e.srcEvent.preventDefault();var t=e.pointer.distanceX/E.width,n=m.$viewValue?1+t:t;n=Math.max(0,Math.min(1,n)),b.css(o.CSS.TRANSFORM,"translate3d("+100*n+"%,0,0)"),E.translate=n}}function h(t){if(E){t.stopPropagation(),s.removeClass("md-dragging"),b.css(o.CSS.TRANSFORM,"");var n=m.$viewValue?E.translate<.5:E.translate>.5;n&&f(!m.$viewValue),E=null,e.skipToggle=!0,d(function(){e.skipToggle=!1},1)}}function f(t){e.$apply(function(){m.$setViewValue(t),m.$render()})}m=m||n.fakeNgModel();var g=null;null!=c.disabled?g=function(){return!0}:c.ngDisabled&&(g=i(c.ngDisabled));var b=t.element(s[0].querySelector(".md-thumb-container")),v=t.element(s[0].querySelector(".md-container"));r(function(){s.removeClass("md-dragging")}),l(e,s,c,m),g&&e.$watch(g,function(e){s.attr("tabindex",e?-1:0)}),a.register(v,"drag"),v.on("$md.dragstart",u).on("$md.drag",p).on("$md.dragend",h);var E}}var c=e[0];return{restrict:"E",priority:210,transclude:!0,template:'<div class="md-container"><div class="md-bar"></div><div class="md-thumb-container"><div class="md-thumb" md-ink-ripple md-ink-ripple-checkbox></div></div></div><div ng-transclude class="md-label"></div>',require:"?ngModel",compile:s}}t.module("material.components.switch",["material.core","material.components.checkbox"]).directive("mdSwitch",e),e.$inject=["mdCheckboxDirective","$mdUtil","$mdConstant","$parse","$$rAF","$mdGesture","$timeout"]}(),function(){t.module("material.components.tabs",["material.core","material.components.icon"])}(),function(){function e(e){return{restrict:"E",link:function(t,n){n.addClass("_md"),t.$on("$destroy",function(){e.destroy()})}}}function n(e){function n(e){i=e}function o(e,n,o,r){function a(t,a,d){i=d.textContent||d.content;var l=!r("gt-sm");return a=o.extractElementByName(a,"md-toast",!0),d.element=a,d.onSwipe=function(e,t){var i=e.type.replace("$md.",""),r=i.replace("swipe","");"down"===r&&d.position.indexOf("top")!=-1&&!l||"up"===r&&(d.position.indexOf("bottom")!=-1||l)||("left"!==r&&"right"!==r||!l)&&(a.addClass("md-"+i),o.nextTick(n.cancel))},d.openClass=s(d.position),a.addClass(d.toastClass),d.parent.addClass(d.openClass),o.hasComputedStyle(d.parent,"position","static")&&d.parent.css("position","relative"),a.on(c,d.onSwipe),a.addClass(l?"md-bottom":d.position.split(" ").map(function(e){return"md-"+e}).join(" ")),d.parent&&d.parent.addClass("md-toast-animating"),e.enter(a,d.parent).then(function(){d.parent&&d.parent.removeClass("md-toast-animating")})}function d(t,n,i){return n.off(c,i.onSwipe),i.parent&&i.parent.addClass("md-toast-animating"),i.openClass&&i.parent.removeClass(i.openClass),(1==i.$destroy?n.remove():e.leave(n)).then(function(){i.parent&&i.parent.removeClass("md-toast-animating"),o.hasComputedStyle(i.parent,"position","static")&&i.parent.css("position","")})}function s(e){return r("gt-xs")?"md-toast-open-"+(e.indexOf("top")>-1?"top":"bottom"):"md-toast-open-bottom"}var c="$md.swipeleft $md.swiperight $md.swipeup $md.swipedown";return{onShow:a,onRemove:d,toastClass:"",position:"bottom left",themable:!0,hideDelay:3e3,autoWrap:!0,transformTemplate:function(e,n){var o=n.autoWrap&&e&&!/md-toast-content/g.test(e);if(o){var i=document.createElement("md-template");i.innerHTML=e;for(var r=0;r<i.children.length;r++)if("MD-TOAST"===i.children[r].nodeName){var a=t.element('<div class="md-toast-content">');a.append(t.element(i.children[r].childNodes)),i.children[r].appendChild(a[0])}return i.innerHTML}return e||""}}}var i,r="ok",a=e("$mdToast").setDefaults({methods:["position","hideDelay","capsule","parent","position","toastClass"],options:o}).addPreset("simple",{argOption:"textContent",methods:["textContent","content","action","highlightAction","highlightClass","theme","parent"],options:["$mdToast","$mdTheming",function(e,t){return{template:'<md-toast md-theme="{{ toast.theme }}" ng-class="{\'md-capsule\': toast.capsule}">  <div class="md-toast-content">    <span class="md-toast-text" role="alert" aria-relevant="all" aria-atomic="true">      {{ toast.content }}    </span>    <md-button class="md-action" ng-if="toast.action" ng-click="toast.resolve()"         ng-class="highlightClasses">      {{ toast.action }}    </md-button>  </div></md-toast>',controller:["$scope",function(t){var n=this;n.highlightAction&&(t.highlightClasses=["md-highlight",n.highlightClass]),t.$watch(function(){return i},function(){n.content=i}),this.resolve=function(){e.hide(r)}}],theme:t.defaultTheme(),controllerAs:"toast",bindToController:!0}}]}).addMethod("updateTextContent",n).addMethod("updateContent",n);return o.$inject=["$animate","$mdToast","$mdUtil","$mdMedia"],a}t.module("material.components.toast",["material.core","material.components.button"]).directive("mdToast",e).provider("$mdToast",n),e.$inject=["$mdToast"],n.$inject=["$$interimElementProvider"]}(),function(){function e(e,n,o,i,r){var a=t.bind(null,o.supplant,"translate3d(0,{0}px,0)");return{template:"",restrict:"E",link:function(d,s,c){function l(){function i(e){var t=s.parent().find("md-content");!f&&t.length&&l(null,t),e=d.$eval(e),e===!1?g():g=u()}function l(e,t){t&&s.parent()[0]===t.parent()[0]&&(f&&f.off("scroll",$),f=t,g=u())}function m(e){var t=e?e.target.scrollTop:v;C(),b=Math.min(h/E,Math.max(0,b+t-v)),s.css(n.CSS.TRANSFORM,a([-b*E])),f.css(n.CSS.TRANSFORM,a([(h-b)*E])),v=t,o.nextTick(function(){var e=s.hasClass("md-whiteframe-z1");e&&!b?r.removeClass(s,"md-whiteframe-z1"):!e&&b&&r.addClass(s,"md-whiteframe-z1")})}function u(){return f?(f.on("scroll",$),f.attr("scroll-shrink","true"),o.nextTick(p,!1),function(){f.off("scroll",$),f.attr("scroll-shrink","false"),p()}):t.noop}function p(){h=s.prop("offsetHeight");var e=-h*E+"px";f.css({"margin-top":e,"margin-bottom":e}),m()}var h,f,g=t.noop,b=0,v=0,E=c.mdShrinkSpeedFactor||.5,$=e.throttle(m),C=o.debounce(p,5e3);d.$on("$mdContentLoaded",l),c.$observe("mdScrollShrink",i),c.ngShow&&d.$watch(c.ngShow,p),c.ngHide&&d.$watch(c.ngHide,p),d.$on("$destroy",g)}s.addClass("_md"),i(s),o.nextTick(function(){s.addClass("_md-toolbar-transitions")},!1),t.isDefined(c.mdScrollShrink)&&l()}}}t.module("material.components.toolbar",["material.core","material.components.content"]).directive("mdToolbar",e),e.$inject=["$$rAF","$mdConstant","$mdUtil","$mdTheming","$animate"]}(),function(){function e(e,n,o,i,r,a,d,s,c,l){function m(d,c,m){function b(){d.delay=d.delay||f}function v(){var e="center top";switch(d.direction){case"left":e="right center";break;case"right":e="left center";break;case"top":e="center bottom";break;case"bottom":e="center top"}S.css("transform-origin",e)}function E(e){e?A():w()}function $(){if(c[0]&&"MutationObserver"in n){var e=new MutationObserver(function(e){e.forEach(function(e){"md-visible"===e.attributeName&&(d.visibleWatcher||(d.visibleWatcher=d.$watch("visible",E))),"md-direction"===e.attributeName&&k(d.direction)})});e.observe(c[0],{attributes:!0}),m.hasOwnProperty("mdVisible")&&(d.visibleWatcher=d.$watch("visible",E))}else d.visibleWatcher=d.$watch("visible",E),d.$watch("direction",k);var t=function(){d.$destroy()};c.one("$destroy",t),x.one("$destroy",t),d.$on("$destroy",function(){T(!1),c.remove(),e&&e.disconnect()}),c.text().indexOf(l.startSymbol())>-1&&d.$watch(function(){return c.text().trim()},C)}function C(e){if((e||!x.attr("aria-label"))&&!x.text().trim()){var t=e||c.text().trim(),n=l(t)(x.scope());x.attr("aria-label",n)}}function y(){c.detach(),c.attr("role","tooltip")}function M(){function o(){T(!1)}var a=!1;if(x[0]&&"MutationObserver"in n){var s=new MutationObserver(function(e){e.some(function(e){return"disabled"===e.attributeName&&x[0].disabled})&&r.nextTick(function(){T(!1)})});s.observe(x[0],{attributes:!0})}var c=function(){l=document.activeElement===x[0]},l=!1;t.element(n).on("blur",c).on("resize",H),document.addEventListener("scroll",o,!0),d.$on("$destroy",function(){t.element(n).off("blur",c).off("resize",H),x.off(u,h).off(p,f).off("mousedown",g),f(),document.removeEventListener("scroll",o,!0),s&&s.disconnect()});var h=function(e){"focus"===e.type&&l?l=!1:d.visible||(x.on(p,f),T(!0),"touchstart"===e.type&&x.one("touchend",function(){r.nextTick(function(){i.one("touchend",f)},!1)}))},f=function(){var t=d.hasOwnProperty("autohide")?d.autohide:m.hasOwnProperty("mdAutohide");(t||a||i[0].activeElement!==x[0])&&(D&&(e.cancel(D),T.queued=!1,D=null),x.off(p,f),x.triggerHandler("blur"),T(!1)),a=!1},g=function(){a=!0};x.on("mousedown",g),x.on(u,h)}function T(t){T.queued&&T.value===!!t||!T.queued&&d.visible===!!t||(T.value=!!t,T.queued||(t?(T.queued=!0,D=e(function(){d.visible=T.value,T.queued=!1,D=null,d.visibleWatcher||E(d.visible)},d.delay)):r.nextTick(function(){d.visible=!1,d.visibleWatcher||E(!1)})))}function A(){if(c[0].textContent.trim()){if(c.css({top:0,left:0}),N.append(c),r.hasComputedStyle(c,"display","none"))return d.visible=!1,void c.detach();k(),s.addClass(S,h).then(function(){c.addClass(h)})}}function w(){s.removeClass(S,h).then(function(){c.removeClass(h),d.visible||c.detach()})}function k(){d.visible&&(v(),_())}function _(){function e(e){var t={left:e.left,top:e.top};return t.left=Math.min(t.left,N.prop("scrollWidth")-n.width-g),t.left=Math.max(t.left,g),t.top=Math.min(t.top,N.prop("scrollHeight")-n.height-g),t.top=Math.max(t.top,g),t}function t(e){return"left"===e?{left:o.left-n.width-g,top:o.top+o.height/2-n.height/2}:"right"===e?{left:o.left+o.width+g,top:o.top+o.height/2-n.height/2}:"top"===e?{left:o.left+o.width/2-n.width/2,top:o.top-n.height-g}:{left:o.left+o.width/2-n.width/2,top:o.top+o.height+g}}var n=r.offsetRect(c,N),o=r.offsetRect(x,N),i=t(d.direction),a=c.prop("offsetParent");d.direction?i=e(i):a&&i.top>a.scrollHeight-n.height-g&&(i=e(t("top"))),c.css({left:i.left+"px",top:i.top+"px"})}a(c);var x=r.getParentWithPointerEvents(c),S=t.element(c[0].getElementsByClassName("md-content")[0]),N=t.element(document.body),D=null,H=o.throttle(function(){k()});s.pin&&s.pin(c,x),b(),y(),M(),v(),$(),C()}var u="focus touchstart mouseenter",p="blur touchcancel mouseleave",h="md-show",f=0,g=8;return{restrict:"E",transclude:!0,priority:210,template:'<div class="md-content _md" ng-transclude></div>',scope:{delay:"=?mdDelay",visible:"=?mdVisible",autohide:"=?mdAutohide",direction:"@?mdDirection"},compile:function(e,t){return t.mdDirection||t.$set("mdDirection","bottom"),m}}}t.module("material.components.tooltip",["material.core"]).directive("mdTooltip",e),e.$inject=["$timeout","$window","$$rAF","$document","$mdUtil","$mdTheming","$rootElement","$animate","$q","$interpolate"]}(),function(){function e(){return{controller:o,template:n,compile:function(e,t){e.addClass("md-virtual-repeat-container").addClass(t.hasOwnProperty("mdOrientHorizontal")?"md-orient-horizontal":"md-orient-vertical")}}}function n(e){return'<div class="md-virtual-repeat-scroller"><div class="md-virtual-repeat-sizer"></div><div class="md-virtual-repeat-offsetter">'+e[0].innerHTML+"</div></div>"}function o(e,n,o,i,r,a,d,s){this.$rootScope=i,this.$scope=a,this.$element=d,this.$attrs=s,this.size=0,this.scrollSize=0,this.scrollOffset=0,this.horizontal=this.$attrs.hasOwnProperty("mdOrientHorizontal"),this.repeater=null,this.autoShrink=this.$attrs.hasOwnProperty("mdAutoShrink"),this.autoShrinkMin=parseInt(this.$attrs.mdAutoShrinkMin,10)||0,this.originalSize=null,this.offsetSize=parseInt(this.$attrs.mdOffsetSize,10)||0,this.oldElementSize=null,this.$attrs.mdTopIndex?(this.bindTopIndex=o(this.$attrs.mdTopIndex),this.topIndex=this.bindTopIndex(this.$scope),t.isDefined(this.topIndex)||(this.topIndex=0,this.bindTopIndex.assign(this.$scope,0)),this.$scope.$watch(this.bindTopIndex,t.bind(this,function(e){e!==this.topIndex&&this.scrollToIndex(e)}))):this.topIndex=0,this.scroller=d[0].querySelector(".md-virtual-repeat-scroller"),this.sizer=this.scroller.querySelector(".md-virtual-repeat-sizer"),this.offsetter=this.scroller.querySelector(".md-virtual-repeat-offsetter");var c=t.bind(this,this.updateSize);e(t.bind(this,function(){c();var e=n.debounce(c,10,null,!1),o=t.element(r);this.size||e(),o.on("resize",e),a.$on("$destroy",function(){o.off("resize",e)}),a.$emit("$md-resize-enable"),a.$on("$md-resize",c)}))}function i(e){return{controller:r,priority:1e3,require:["mdVirtualRepeat","^^mdVirtualRepeatContainer"],restrict:"A",terminal:!0,transclude:"element",compile:function(t,n){var o=n.mdVirtualRepeat,i=o.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)\s*$/),r=i[1],a=e(i[2]),d=n.mdExtraName&&e(n.mdExtraName);return function(e,t,n,o,i){o[0].link_(o[1],i,r,a,d)}}}}function r(e,n,o,i,r,a,d,s){this.$scope=e,this.$element=n,this.$attrs=o,this.$browser=i,this.$document=r,this.$rootScope=a,this.$$rAF=d,this.onDemand=s.parseAttributeBoolean(o.mdOnDemand),this.browserCheckUrlChange=i.$$checkUrlChange,this.newStartIndex=0,this.newEndIndex=0,this.newVisibleEnd=0,this.startIndex=0,this.endIndex=0,this.itemSize=e.$eval(o.mdItemSize)||null,this.isFirstRender=!0,this.isVirtualRepeatUpdating_=!1,this.itemsLength=0,this.unwatchItemSize_=t.noop,this.blocks={},this.pooledBlocks=[],e.$on("$destroy",t.bind(this,this.cleanupBlocks_))}function a(e){if(!t.isFunction(e.getItemAtIndex)||!t.isFunction(e.getLength))throw Error("When md-on-demand is enabled, the Object passed to md-virtual-repeat must implement functions getItemAtIndex() and getLength() ");this.model=e}t.module("material.components.virtualRepeat",["material.core","material.components.showHide"]).directive("mdVirtualRepeatContainer",e).directive("mdVirtualRepeat",i);var d=1533917,s=3;o.$inject=["$$rAF","$mdUtil","$parse","$rootScope","$window","$scope","$element","$attrs"],o.prototype.register=function(e){this.repeater=e,t.element(this.scroller).on("scroll wheel touchmove touchend",t.bind(this,this.handleScroll_))},o.prototype.isHorizontal=function(){return this.horizontal},o.prototype.getSize=function(){return this.size},o.prototype.setSize_=function(e){var t=this.getDimensionName_();this.size=e,this.$element[0].style[t]=e+"px"},o.prototype.unsetSize_=function(){this.$element[0].style[this.getDimensionName_()]=this.oldElementSize,this.oldElementSize=null},o.prototype.updateSize=function(){this.originalSize||(this.size=this.isHorizontal()?this.$element[0].clientWidth:this.$element[0].clientHeight,this.handleScroll_(),this.repeater&&this.repeater.containerUpdated())},o.prototype.getScrollSize=function(){return this.scrollSize},o.prototype.getDimensionName_=function(){return this.isHorizontal()?"width":"height"},o.prototype.sizeScroller_=function(e){var t=this.getDimensionName_(),n=this.isHorizontal()?"height":"width";if(this.sizer.innerHTML="",e<d)this.sizer.style[t]=e+"px";else{this.sizer.style[t]="auto",this.sizer.style[n]="auto";var o=Math.floor(e/d),i=document.createElement("div");i.style[t]="1533917px",i.style[n]="1px";for(var r=0;r<o;r++)this.sizer.appendChild(i.cloneNode(!1));i.style[t]=e-o*d+"px",this.sizer.appendChild(i)}},o.prototype.autoShrink_=function(e){var t=Math.max(e,this.autoShrinkMin*this.repeater.getItemSize());if(this.autoShrink&&t!==this.size){null===this.oldElementSize&&(this.oldElementSize=this.$element[0].style[this.getDimensionName_()]);var n=this.originalSize||this.size;if(!n||t<n)this.originalSize||(this.originalSize=this.size),this.setSize_(t);else if(null!==this.originalSize){this.unsetSize_();var o=this.originalSize;this.originalSize=null,o||this.updateSize(),this.setSize_(o||this.size)}this.repeater.containerUpdated()}},o.prototype.setScrollSize=function(e){var t=e+this.offsetSize;this.scrollSize!==t&&(this.sizeScroller_(t),this.autoShrink_(t),this.scrollSize=t)},o.prototype.getScrollOffset=function(){return this.scrollOffset},o.prototype.scrollTo=function(e){this.scroller[this.isHorizontal()?"scrollLeft":"scrollTop"]=e,this.handleScroll_()},o.prototype.scrollToIndex=function(e){var t=this.repeater.getItemSize(),n=this.repeater.itemsLength;e>n&&(e=n-1),this.scrollTo(t*e)},o.prototype.resetScroll=function(){this.scrollTo(0)},o.prototype.handleScroll_=function(){var e=t.element(document)[0],n="rtl"!=e.dir&&"rtl"!=e.body.dir;n||this.maxSize||(this.scroller.scrollLeft=this.scrollSize,this.maxSize=this.scroller.scrollLeft);var o=this.isHorizontal()?n?this.scroller.scrollLeft:this.maxSize-this.scroller.scrollLeft:this.scroller.scrollTop;if(!(o===this.scrollOffset||o>this.scrollSize-this.size)){var i=this.repeater.getItemSize();if(i){var r=Math.max(0,Math.floor(o/i)-s),a=(this.isHorizontal()?"translateX(":"translateY(")+(!this.isHorizontal()||n?r*i:-(r*i))+"px)";if(this.scrollOffset=o,this.offsetter.style.webkitTransform=a,this.offsetter.style.transform=a,this.bindTopIndex){var d=Math.floor(o/i);d!==this.topIndex&&d<this.repeater.getItemCount()&&(this.topIndex=d,this.bindTopIndex.assign(this.$scope,d),this.$rootScope.$$phase||this.$scope.$digest())}this.repeater.containerUpdated()}}},i.$inject=["$parse"],r.$inject=["$scope","$element","$attrs","$browser","$document","$rootScope","$$rAF","$mdUtil"],r.Block,r.prototype.link_=function(e,n,o,i,r){this.container=e,this.transclude=n,this.repeatName=o,this.rawRepeatListExpression=i,this.extraName=r,this.sized=!1,
this.repeatListExpression=t.bind(this,this.repeatListExpression_),this.container.register(this)},r.prototype.cleanupBlocks_=function(){t.forEach(this.pooledBlocks,function(e){e.element.remove()})},r.prototype.readItemSize_=function(){if(!this.itemSize){this.items=this.repeatListExpression(this.$scope),this.parentNode=this.$element[0].parentNode;var e=this.getBlock_(0);e.element[0].parentNode||this.parentNode.appendChild(e.element[0]),this.itemSize=e.element[0][this.container.isHorizontal()?"offsetWidth":"offsetHeight"]||null,this.blocks[0]=e,this.poolBlock_(0),this.itemSize&&this.containerUpdated()}},r.prototype.repeatListExpression_=function(e){var t=this.rawRepeatListExpression(e);if(this.onDemand&&t){var n=new a(t);return n.$$includeIndexes(this.newStartIndex,this.newVisibleEnd),n}return t},r.prototype.containerUpdated=function(){return this.itemSize?(this.sized||(this.items=this.repeatListExpression(this.$scope)),this.sized||(this.unwatchItemSize_(),this.sized=!0,this.$scope.$watchCollection(this.repeatListExpression,t.bind(this,function(e,t){this.isVirtualRepeatUpdating_||this.virtualRepeatUpdate_(e,t)}))),this.updateIndexes_(),void((this.newStartIndex!==this.startIndex||this.newEndIndex!==this.endIndex||this.container.getScrollOffset()>this.container.getScrollSize())&&(this.items instanceof a&&this.items.$$includeIndexes(this.newStartIndex,this.newEndIndex),this.virtualRepeatUpdate_(this.items,this.items)))):(this.unwatchItemSize_&&this.unwatchItemSize_!==t.noop&&this.unwatchItemSize_(),this.unwatchItemSize_=this.$scope.$watchCollection(this.repeatListExpression,t.bind(this,function(e){e&&e.length&&this.readItemSize_()})),void(this.$rootScope.$$phase||this.$scope.$digest()))},r.prototype.getItemSize=function(){return this.itemSize},r.prototype.getItemCount=function(){return this.itemsLength},r.prototype.virtualRepeatUpdate_=function(e,n){this.isVirtualRepeatUpdating_=!0;var o=e&&e.length||0,i=!1;if(this.items&&o<this.items.length&&0!==this.container.getScrollOffset()){this.items=e;var r=this.container.getScrollOffset();return this.container.resetScroll(),void this.container.scrollTo(r)}if(o!==this.itemsLength&&(i=!0,this.itemsLength=o),this.items=e,(e!==n||i)&&this.updateIndexes_(),this.parentNode=this.$element[0].parentNode,i&&this.container.setScrollSize(o*this.itemSize),this.isFirstRender){this.isFirstRender=!1;var a=this.$attrs.mdStartIndex?this.$scope.$eval(this.$attrs.mdStartIndex):this.container.topIndex;this.container.scrollToIndex(a)}Object.keys(this.blocks).forEach(function(e){var t=parseInt(e,10);(t<this.newStartIndex||t>=this.newEndIndex)&&this.poolBlock_(t)},this),this.$browser.$$checkUrlChange=t.noop;var d,s,c=[],l=[];for(d=this.newStartIndex;d<this.newEndIndex&&null==this.blocks[d];d++)s=this.getBlock_(d),this.updateBlock_(s,d),c.push(s);for(;null!=this.blocks[d];d++)this.updateBlock_(this.blocks[d],d);for(var m=d-1;d<this.newEndIndex;d++)s=this.getBlock_(d),this.updateBlock_(s,d),l.push(s);c.length&&this.parentNode.insertBefore(this.domFragmentFromBlocks_(c),this.$element[0].nextSibling),l.length&&this.parentNode.insertBefore(this.domFragmentFromBlocks_(l),this.blocks[m]&&this.blocks[m].element[0].nextSibling),this.$browser.$$checkUrlChange=this.browserCheckUrlChange,this.startIndex=this.newStartIndex,this.endIndex=this.newEndIndex,this.isVirtualRepeatUpdating_=!1},r.prototype.getBlock_=function(e){if(this.pooledBlocks.length)return this.pooledBlocks.pop();var n;return this.transclude(t.bind(this,function(t,o){n={element:t,"new":!0,scope:o},this.updateScope_(o,e),this.parentNode.appendChild(t[0])})),n},r.prototype.updateBlock_=function(e,t){this.blocks[t]=e,(e["new"]||e.scope.$index!==t||e.scope[this.repeatName]!==this.items[t])&&(e["new"]=!1,this.updateScope_(e.scope,t),this.$rootScope.$$phase||e.scope.$digest())},r.prototype.updateScope_=function(e,t){e.$index=t,e[this.repeatName]=this.items&&this.items[t],this.extraName&&(e[this.extraName(this.$scope)]=this.items[t])},r.prototype.poolBlock_=function(e){this.pooledBlocks.push(this.blocks[e]),this.parentNode.removeChild(this.blocks[e].element[0]),delete this.blocks[e]},r.prototype.domFragmentFromBlocks_=function(e){var t=this.$document[0].createDocumentFragment();return e.forEach(function(e){t.appendChild(e.element[0])}),t},r.prototype.updateIndexes_=function(){var e=this.items?this.items.length:0,t=Math.ceil(this.container.getSize()/this.itemSize);this.newStartIndex=Math.max(0,Math.min(e-t,Math.floor(this.container.getScrollOffset()/this.itemSize))),this.newVisibleEnd=this.newStartIndex+t+s,this.newEndIndex=Math.min(e,this.newVisibleEnd),this.newStartIndex=Math.max(0,this.newStartIndex-s)},a.prototype.$$includeIndexes=function(e,t){for(var n=e;n<t;n++)this.hasOwnProperty(n)||(this[n]=this.model.getItemAtIndex(n));this.length=this.model.getLength()}}(),function(){function e(e){function t(t,a,d){var s="";d.$observe("mdWhiteframe",function(t){t=parseInt(t,10)||r,t!=n&&(t>i||t<o)&&(e.warn("md-whiteframe attribute value is invalid. It should be a number between "+o+" and "+i,a[0]),t=r);var c=t==n?"":"md-whiteframe-"+t+"dp";d.$updateClass(c,s),s=c})}var n=-1,o=1,i=24,r=4;return{link:t}}t.module("material.components.whiteframe",["material.core"]).directive("mdWhiteframe",e),e.$inject=["$log"]}(),function(){function e(e,o,d,s,c,l,m,u,p,h,f){function g(){d.initOptionalProperties(e,p,{searchText:"",selectedItem:null}),c(o),C(),d.nextTick(function(){M(),E(),$(),o.on("focus",$)})}function b(){e.requireMatch&&_e&&_e.$setValidity("md-require-match",!!e.selectedItem)}function v(){function t(){var e=0,t=o.find("md-input-container");if(t.length){var n=t.find("input");e=t.prop("offsetHeight"),e-=n.prop("offsetTop"),e-=n.prop("offsetHeight"),e+=t.prop("offsetTop")}return e}function n(){var e=$e.scrollContainer.getBoundingClientRect(),t={};e.right>m.right-r&&(t.left=c.right-e.width+"px"),$e.$.scrollContainer.css(t)}if(!$e)return d.nextTick(v,!1,e);var s,c=$e.wrap.getBoundingClientRect(),l=$e.snap.getBoundingClientRect(),m=$e.root.getBoundingClientRect(),u=l.bottom-m.top,h=m.bottom-l.top,f=c.left-m.left,g=c.width,b=t();p.mdFloatingLabel&&(f+=a,g-=2*a),s={left:f+"px",minWidth:g+"px",maxWidth:Math.max(c.right-m.left,m.right-c.left)-r+"px"},u>h&&m.height-c.bottom-r<i?(s.top="auto",s.bottom=h+"px",s.maxHeight=Math.min(i,c.top-m.top-r)+"px"):(s.top=u-b+"px",s.bottom="auto",s.maxHeight=Math.min(i,m.bottom+d.scrollTop()-c.bottom-r)+"px"),$e.$.scrollContainer.css(s),d.nextTick(n,!1)}function E(){$e.$.root.length&&(c($e.$.scrollContainer),$e.$.scrollContainer.detach(),$e.$.root.append($e.$.scrollContainer),m.pin&&m.pin($e.$.scrollContainer,u))}function $(){e.autofocus&&$e.input.focus()}function C(){var n=parseInt(e.delay,10)||0;p.$observe("disabled",function(e){be.isDisabled=d.parseAttributeBoolean(e,!1)}),p.$observe("required",function(e){be.isRequired=d.parseAttributeBoolean(e,!1)}),p.$observe("readonly",function(e){be.isReadonly=d.parseAttributeBoolean(e,!1)}),e.$watch("searchText",n?d.debounce(L,n):L),e.$watch("selectedItem",N),t.element(l).on("resize",v),e.$on("$destroy",y)}function y(){if(be.hidden||d.enableScrolling(),t.element(l).off("resize",v),$e){var e=["ul","scroller","scrollContainer","input"];t.forEach(e,function(e){$e.$[e].remove()})}}function M(){$e={main:o[0],scrollContainer:o[0].querySelector(".md-virtual-repeat-container"),scroller:o[0].querySelector(".md-virtual-repeat-scroller"),ul:o.find("ul")[0],input:o.find("input")[0],wrap:o.find("md-autocomplete-wrap")[0],root:document.body},$e.li=$e.ul.getElementsByTagName("li"),$e.snap=T(),$e.$=A($e),_e=$e.$.input.controller("ngModel")}function T(){for(var e=o;e.length;e=e.parent())if(t.isDefined(e.attr("md-autocomplete-snap")))return e[0];return $e.wrap}function A(e){var n={};for(var o in e)e.hasOwnProperty(o)&&(n[o]=t.element(e[o]));return n}function w(n,o){!n&&o?(v(),$e&&d.nextTick(function(){d.disableScrollAround($e.ul),ke=k(t.element($e.wrap))},!1,e)):n&&!o&&d.nextTick(function(){d.enableScrolling(),ke&&(ke(),ke=null)},!1,e)}function k(e){function t(e){e.preventDefault()}return e.on("wheel",t),e.on("touchmove",t),function(){e.off("wheel",t),e.off("touchmove",t)}}function _(){ye=!0}function x(){Te||be.hidden||$e.input.focus(),ye=!1,be.hidden=Y()}function S(){$e.input.focus()}function N(t,n){b(),t?q(t).then(function(o){e.searchText=o,I(t,n)}):n&&e.searchText&&q(n).then(function(t){t.toString().toLowerCase()===e.searchText.toLowerCase()&&(e.searchText="")}),t!==n&&D()}function D(){t.isFunction(e.itemChange)&&e.itemChange(z(e.selectedItem))}function H(){t.isFunction(e.textChange)&&e.textChange()}function I(e,t){Me.forEach(function(n){n(e,t)})}function O(e){Me.indexOf(e)==-1&&Me.push(e)}function R(e){var t=Me.indexOf(e);t!=-1&&Me.splice(t,1)}function L(t,n){be.index=W(),t!==n&&(b(),q(e.selectedItem).then(function(o){t!==o&&(e.selectedItem=null,t!==n&&H(),te()?he():(be.matches=[],V(!1),se()))}))}function P(){Te=!1,ye||(be.hidden=Y())}function F(e){e&&(ye=!1,Te=!1),$e.input.blur()}function B(n){Te=!0,t.isString(e.searchText)||(e.searchText=""),be.hidden=Y(),be.hidden||he()}function U(t){switch(t.keyCode){case s.KEY_CODE.DOWN_ARROW:if(be.loading)return;t.stopPropagation(),t.preventDefault(),be.index=Math.min(be.index+1,be.matches.length-1),le(),se();break;case s.KEY_CODE.UP_ARROW:if(be.loading)return;t.stopPropagation(),t.preventDefault(),be.index=be.index<0?be.matches.length-1:Math.max(0,be.index-1),le(),se();break;case s.KEY_CODE.TAB:if(x(),be.hidden||be.loading||be.index<0||be.matches.length<1)return;oe(be.index);break;case s.KEY_CODE.ENTER:if(be.hidden||be.loading||be.index<0||be.matches.length<1)return;if(Z())return;t.stopPropagation(),t.preventDefault(),oe(be.index);break;case s.KEY_CODE.ESCAPE:if(t.preventDefault(),!K())return;t.stopPropagation(),re(),e.searchText&&G("clear")&&ae(),be.hidden=!0,G("blur")&&F(!0)}}function j(){return t.isNumber(e.minLength)?e.minLength:1}function q(n){function o(t){return t&&e.itemText?e.itemText(z(t)):null}return h.when(o(n)||n).then(function(e){return e&&!t.isString(e)&&f.warn("md-autocomplete: Could not resolve display value to a string. Please check the `md-item-text` attribute."),e})}function z(e){if(!e)return n;var t={};return be.itemName&&(t[be.itemName]=e),t}function W(){return e.autoselect?0:-1}function V(e){be.loading!=e&&(be.loading=e),be.hidden=Y()}function Y(){return!(!be.loading||Q())||(!!Z()||(!Te||!X()))}function K(){return G("blur")||!be.hidden||be.loading||G("clear")&&e.searchText}function G(t){return!e.escapeOptions||e.escapeOptions.toLowerCase().indexOf(t)!==-1}function X(){return te()&&Q()||pe()}function Q(){return!!be.matches.length}function Z(){return!!be.scope.selectedItem}function J(){return be.loading&&!Z()}function ee(){return q(be.matches[be.index])}function te(){return(e.searchText||"").length>=j()}function ne(e,t,n){Object.defineProperty(be,e,{get:function(){return n},set:function(e){var o=n;n=e,t(e,o)}})}function oe(t){d.nextTick(function(){q(be.matches[t]).then(function(e){var t=$e.$.input.controller("ngModel");t.$setViewValue(e),t.$render()})["finally"](function(){e.selectedItem=be.matches[t],V(!1)})},!1)}function ie(){re(),ae()}function re(){be.index=0,be.matches=[]}function ae(){V(!0),e.searchText="";var t=document.createEvent("CustomEvent");t.initCustomEvent("change",!0,!0,{value:""}),$e.input.dispatchEvent(t),$e.input.blur(),e.searchText="",$e.input.focus()}function de(n){function o(t){t&&(t=h.when(t),we++,V(!0),d.nextTick(function(){t.then(i)["finally"](function(){0===--we&&V(!1)})},!0,e))}function i(t){Ce[a]=t,(n||"")===(e.searchText||"")&&fe(t)}var r=e.$parent.$eval(Ee),a=n.toLowerCase(),s=t.isArray(r),c=!!r.then;s?i(r):c&&o(r)}function se(){ee().then(function(e){be.messages=[ce(),e]})}function ce(){if(Ae===be.matches.length)return"";switch(Ae=be.matches.length,be.matches.length){case 0:return"There are no matches available.";case 1:return"There is 1 match available.";default:return"There are "+be.matches.length+" matches available."}}function le(){if($e.li[0]){var e=$e.li[0].offsetHeight,t=e*be.index,n=t+e,o=$e.scroller.clientHeight,i=$e.scroller.scrollTop;t<i?ue(t):n>i+o&&ue(n-o)}}function me(){return 0!==we}function ue(e){$e.$.scrollContainer.controller("mdVirtualRepeatContainer").scrollTo(e)}function pe(){var e=(be.scope.searchText||"").length;return be.hasNotFound&&!Q()&&(!be.loading||me())&&e>=j()&&(Te||ye)&&!Z()}function he(){var t=e.searchText||"",n=t.toLowerCase();!e.noCache&&Ce[n]?fe(Ce[n]):de(t),be.hidden=Y()}function fe(t){be.matches=t,be.hidden=Y(),be.loading&&V(!1),e.selectOnMatch&&ge(),se(),v()}function ge(){var t=e.searchText,n=be.matches,o=n[0];1===n.length&&q(o).then(function(n){var o=t==n;e.matchInsensitive&&!o&&(o=t.toLowerCase()==n.toLowerCase()),o&&oe(0)})}var be=this,ve=e.itemsExpr.split(/ in /i),Ee=ve[1],$e=null,Ce={},ye=!1,Me=[],Te=!1,Ae=0,we=0,ke=null,_e=null;return ne("hidden",w,!0),be.scope=e,be.parent=e.$parent,be.itemName=ve[0],be.matches=[],be.loading=!1,be.hidden=!0,be.index=null,be.messages=[],be.id=d.nextUid(),be.isDisabled=null,be.isRequired=null,be.isReadonly=null,be.hasNotFound=!1,be.keydown=U,be.blur=P,be.focus=B,be.clear=ie,be.select=oe,be.listEnter=_,be.listLeave=x,be.mouseUp=S,be.getCurrentDisplayValue=ee,be.registerSelectedItemWatcher=O,be.unregisterSelectedItemWatcher=R,be.notFoundVisible=pe,be.loadingIsVisible=J,be.positionDropdown=v,g()}t.module("material.components.autocomplete").controller("MdAutocompleteCtrl",e);var o=41,i=5.5*o,r=8,a=2;e.$inject=["$scope","$element","$mdUtil","$mdConstant","$mdTheming","$window","$animate","$rootElement","$attrs","$q","$log"]}(),function(){function e(e){return{controller:"MdAutocompleteCtrl",controllerAs:"$mdAutocompleteCtrl",scope:{inputName:"@mdInputName",inputMinlength:"@mdInputMinlength",inputMaxlength:"@mdInputMaxlength",searchText:"=?mdSearchText",selectedItem:"=?mdSelectedItem",itemsExpr:"@mdItems",itemText:"&mdItemText",placeholder:"@placeholder",noCache:"=?mdNoCache",requireMatch:"=?mdRequireMatch",selectOnMatch:"=?mdSelectOnMatch",matchInsensitive:"=?mdMatchCaseInsensitive",itemChange:"&?mdSelectedItemChange",textChange:"&?mdSearchTextChange",minLength:"=?mdMinLength",delay:"=?mdDelay",autofocus:"=?mdAutofocus",floatingLabel:"@?mdFloatingLabel",autoselect:"=?mdAutoselect",menuClass:"@?mdMenuClass",inputId:"@?mdInputId",escapeOptions:"@?mdEscapeOptions"},link:function(e,t,n,o){o.hasNotFound=!!t.attr("md-has-not-found")},template:function(t,n){function o(){var e=t.find("md-item-template").detach(),n=e.length?e.html():t.html();return e.length||t.empty(),"<md-autocomplete-parent-scope md-autocomplete-replace>"+n+"</md-autocomplete-parent-scope>"}function i(){var e=t.find("md-not-found").detach(),n=e.length?e.html():"";return n?'<li ng-if="$mdAutocompleteCtrl.notFoundVisible()"                         md-autocomplete-parent-scope>'+n+"</li>":""}function r(){return n.mdFloatingLabel?'            <md-input-container ng-if="floatingLabel">              <label>{{floatingLabel}}</label>              <input type="search"                  '+(null!=c?'tabindex="'+c+'"':"")+'                  id="{{ inputId || \'fl-input-\' + $mdAutocompleteCtrl.id }}"                  name="{{inputName}}"                  autocomplete="off"                  ng-required="$mdAutocompleteCtrl.isRequired"                  ng-readonly="$mdAutocompleteCtrl.isReadonly"                  ng-minlength="inputMinlength"                  ng-maxlength="inputMaxlength"                  ng-disabled="$mdAutocompleteCtrl.isDisabled"                  ng-model="$mdAutocompleteCtrl.scope.searchText"                  ng-model-options="{ allowInvalid: true }"                  ng-keydown="$mdAutocompleteCtrl.keydown($event)"                  ng-blur="$mdAutocompleteCtrl.blur()"                  '+(null!=n.mdNoAsterisk?'md-no-asterisk="'+n.mdNoAsterisk+'"':"")+'                  ng-focus="$mdAutocompleteCtrl.focus($event)"                  aria-owns="ul-{{$mdAutocompleteCtrl.id}}"                  '+(null!=n.mdSelectOnFocus?'md-select-on-focus=""':"")+'                  aria-label="{{floatingLabel}}"                  aria-autocomplete="list"                  role="combobox"                  aria-haspopup="true"                  aria-activedescendant=""                  aria-expanded="{{!$mdAutocompleteCtrl.hidden}}"/>              <div md-autocomplete-parent-scope md-autocomplete-replace>'+s+"</div>            </md-input-container>":'            <input type="search"                '+(null!=c?'tabindex="'+c+'"':"")+'                id="{{ inputId || \'input-\' + $mdAutocompleteCtrl.id }}"                name="{{inputName}}"                ng-if="!floatingLabel"                autocomplete="off"                ng-required="$mdAutocompleteCtrl.isRequired"                ng-disabled="$mdAutocompleteCtrl.isDisabled"                ng-readonly="$mdAutocompleteCtrl.isReadonly"                ng-model="$mdAutocompleteCtrl.scope.searchText"                ng-keydown="$mdAutocompleteCtrl.keydown($event)"                ng-blur="$mdAutocompleteCtrl.blur()"                ng-focus="$mdAutocompleteCtrl.focus($event)"                placeholder="{{placeholder}}"                aria-owns="ul-{{$mdAutocompleteCtrl.id}}"                '+(null!=n.mdSelectOnFocus?'md-select-on-focus=""':"")+'                aria-label="{{placeholder}}"                aria-autocomplete="list"                role="combobox"                aria-haspopup="true"                aria-activedescendant=""                aria-expanded="{{!$mdAutocompleteCtrl.hidden}}"/>            <button                type="button"                tabindex="-1"                ng-if="$mdAutocompleteCtrl.scope.searchText && !$mdAutocompleteCtrl.isDisabled"                ng-click="$mdAutocompleteCtrl.clear($event)">              <md-icon md-svg-src="'+e.mdClose+'"></md-icon>              <span class="md-visually-hidden">Clear</span>            </button>                '}var a=i(),d=o(),s=t.html(),c=n.tabindex;return a&&t.attr("md-has-not-found",!0),t.attr("tabindex","-1"),"        <md-autocomplete-wrap            ng-class=\"{ 'md-whiteframe-z1': !floatingLabel, 'md-menu-showing': !$mdAutocompleteCtrl.hidden }\">          "+r()+'          <md-progress-linear              class="'+(n.mdFloatingLabel?"md-inline":"")+'"              ng-if="$mdAutocompleteCtrl.loadingIsVisible()"              md-mode="indeterminate"></md-progress-linear>          <md-virtual-repeat-container              md-auto-shrink              md-auto-shrink-min="1"              ng-mouseenter="$mdAutocompleteCtrl.listEnter()"              ng-mouseleave="$mdAutocompleteCtrl.listLeave()"              ng-mouseup="$mdAutocompleteCtrl.mouseUp()"              ng-hide="$mdAutocompleteCtrl.hidden"              class="md-autocomplete-suggestions-container md-whiteframe-z1"              ng-class="{ \'md-not-found\': $mdAutocompleteCtrl.notFoundVisible() }"              role="presentation">            <ul class="md-autocomplete-suggestions"                ng-class="::menuClass"                id="ul-{{$mdAutocompleteCtrl.id}}">              <li md-virtual-repeat="item in $mdAutocompleteCtrl.matches"                  ng-class="{ selected: $index === $mdAutocompleteCtrl.index }"                  ng-click="$mdAutocompleteCtrl.select($index)"                  md-extra-name="$mdAutocompleteCtrl.itemName">                  '+d+"                  </li>"+a+'            </ul>          </md-virtual-repeat-container>        </md-autocomplete-wrap>        <aria-status            class="md-visually-hidden"            role="status"            aria-live="assertive">          <p ng-repeat="message in $mdAutocompleteCtrl.messages track by $index" ng-if="message">{{message}}</p>        </aria-status>'}}}t.module("material.components.autocomplete").directive("mdAutocomplete",e),e.$inject=["$$mdSvgRegistry"]}(),function(){function e(e,t){function n(e,n,o){return function(e,n,i){function r(n,o){s[o]=e[n],e.$watch(n,function(e){t.nextTick(function(){s[o]=e})})}function a(){var t=!1,n=!1;e.$watch(function(){n||t||(t=!0,e.$$postDigest(function(){n||s.$digest(),t=n=!1}))}),s.$watch(function(){n=!0})}var d=e.$mdAutocompleteCtrl,s=d.parent.$new(),c=d.itemName;r("$index","$index"),r("item",c),a(),o(s,function(e){n.after(e)})}}return{restrict:"AE",compile:n,terminal:!0,transclude:"element"}}t.module("material.components.autocomplete").directive("mdAutocompleteParentScope",e),e.$inject=["$compile","$mdUtil"]}(),function(){function e(e,n,o){function i(i,r){var d=null,s=null,c=o.mdHighlightFlags||"",l=e.$watch(function(e){return{term:i(e),unsafeText:r(e)}},function(e,o){null!==d&&e.unsafeText===o.unsafeText||(d=t.element("<div>").text(e.unsafeText).html()),null!==s&&e.term===o.term||(s=a(e.term,c)),n.html(d.replace(s,'<span class="highlight">$&</span>'))},!0);n.on("$destroy",l)}function r(e){return e&&e.toString().replace(/[\\\^\$\*\+\?\.\(\)\|\{}\[\]]/g,"\\$&")}function a(e,t){var n="",o="";return t.indexOf("^")>=0&&(n="^"),t.indexOf("$")>=0&&(o="$"),new RegExp(n+r(e)+o,t.replace(/[\$\^]/g,""))}this.init=i}t.module("material.components.autocomplete").controller("MdHighlightCtrl",e),e.$inject=["$scope","$element","$attrs"]}(),function(){function e(e,t){return{terminal:!0,controller:"MdHighlightCtrl",compile:function(n,o){var i=t(o.mdHighlightText),r=e(n.html());return function(e,t,n,o){o.init(i,r)}}}}t.module("material.components.autocomplete").directive("mdHighlightText",e),e.$inject=["$interpolate","$parse"]}(),function(){function o(e,t,o,i,r){this.$scope=e,this.$element=t,this.$mdConstant=o,this.$timeout=i,this.$mdUtil=r,this.isEditting=!1,this.parentController=n,this.enableChipEdit=!1}t.module("material.components.chips").controller("MdChipCtrl",o),o.$inject=["$scope","$element","$mdConstant","$timeout","$mdUtil"],o.prototype.init=function(e){this.parentController=e,this.enableChipEdit=this.parentController.enableChipEdit,this.enableChipEdit&&(this.$element.on("keydown",this.chipKeyDown.bind(this)),this.$element.on("mousedown",this.chipMouseDown.bind(this)),this.getChipContent().addClass("_md-chip-content-edit-is-enabled"))},o.prototype.getChipContent=function(){var e=this.$element[0].getElementsByClassName("md-chip-content");return t.element(e[0])},o.prototype.getContentElement=function(){return t.element(this.getChipContent().children()[0])},o.prototype.getChipIndex=function(){return parseInt(this.$element.attr("index"))},o.prototype.goOutOfEditMode=function(){if(this.isEditting){this.isEditting=!1,this.$element.removeClass("_md-chip-editing"),this.getChipContent()[0].contentEditable="false";var e=this.getChipIndex(),t=this.getContentElement().text();t?(this.parentController.updateChipContents(e,this.getContentElement().text()),this.$mdUtil.nextTick(function(){this.parentController.selectedChip===e&&this.parentController.focusChip(e)}.bind(this))):this.parentController.removeChipAndFocusInput(e)}},o.prototype.selectNodeContents=function(t){var n,o;document.body.createTextRange?(n=document.body.createTextRange(),n.moveToElementText(t),n.select()):e.getSelection&&(o=e.getSelection(),n=document.createRange(),n.selectNodeContents(t),o.removeAllRanges(),o.addRange(n))},o.prototype.goInEditMode=function(){this.isEditting=!0,this.$element.addClass("_md-chip-editing"),this.getChipContent()[0].contentEditable="true",this.getChipContent().on("blur",function(){this.goOutOfEditMode()}.bind(this)),this.selectNodeContents(this.getChipContent()[0])},o.prototype.chipKeyDown=function(e){this.isEditting||e.keyCode!==this.$mdConstant.KEY_CODE.ENTER&&e.keyCode!==this.$mdConstant.KEY_CODE.SPACE?this.isEditting&&e.keyCode===this.$mdConstant.KEY_CODE.ENTER&&(e.preventDefault(),this.goOutOfEditMode()):(e.preventDefault(),this.goInEditMode())},o.prototype.chipMouseDown=function(){this.getChipIndex()==this.parentController.selectedChip&&this.enableChipEdit&&!this.isEditting&&this.goInEditMode()}}(),function(){function e(e,o){function i(n,i){return n.append(o.processTemplate(r)),function(n,o,i,r){var a=r.shift(),d=r.shift();e(o),a&&(d.init(a),t.element(o[0].querySelector(".md-chip-content")).on("blur",function(){a.resetSelectedChip(),a.$scope.$applyAsync()}))}}var r=o.processTemplate(n);return{restrict:"E",require:["^?mdChips","mdChip"],compile:i,controller:"MdChipCtrl"}}t.module("material.components.chips").directive("mdChip",e);var n='    <span ng-if="!$mdChipsCtrl.readonly" class="md-visually-hidden">      {{$mdChipsCtrl.deleteHint}}    </span>';e.$inject=["$mdTheming","$mdUtil"]}(),function(){function e(e){function t(t,n,o,i){n.on("click",function(e){t.$apply(function(){i.removeChip(t.$$replacedScope.$index)})}),e(function(){n.attr({tabindex:-1,"aria-hidden":!0}),n.find("button").attr("tabindex","-1")})}return{restrict:"A",require:"^mdChips",scope:!1,link:t}}t.module("material.components.chips").directive("mdChipRemove",e),e.$inject=["$timeout"]}(),function(){function e(e){function t(t,n,o){var i=t.$parent.$mdChipsCtrl,r=i.parent.$new(!1,i.parent);r.$$replacedScope=t,r.$chip=t.$chip,r.$index=t.$index,r.$mdChipsCtrl=i;var a=i.$scope.$eval(o.mdChipTransclude);n.html(a),e(n.contents())(r)}return{restrict:"EA",terminal:!0,link:t,scope:!1}}t.module("material.components.chips").directive("mdChipTransclude",e),e.$inject=["$compile"]}(),function(){function e(e,t,n,o,i,r){this.$timeout=i,this.$mdConstant=t,this.$scope=e,this.parent=e.$parent,this.$log=n,this.$element=o,this.ngModelCtrl=null,this.userInputNgModelCtrl=null,this.userInputElement=null,this.items=[],this.selectedChip=-1,this.hasAutocomplete=!1,this.enableChipEdit=r.parseAttributeBoolean(this.mdEnableChipEdit),this.deleteHint="Press delete to remove this chip.",this.deleteButtonLabel="Remove",this.chipBuffer="",this.useTransformChip=!1,this.useOnAdd=!1,this.useOnRemove=!1}t.module("material.components.chips").controller("MdChipsCtrl",e),e.$inject=["$scope","$mdConstant","$log","$element","$timeout","$mdUtil"],e.prototype.inputKeydown=function(e){var t=this.getChipBuffer();if(!(this.hasAutocomplete&&e.isDefaultPrevented&&e.isDefaultPrevented())){if(e.keyCode===this.$mdConstant.KEY_CODE.BACKSPACE){if(0!==this.getCursorPosition(e.target))return;return e.preventDefault(),e.stopPropagation(),void(this.items.length&&this.selectAndFocusChipSafe(this.items.length-1))}if((!this.separatorKeys||this.separatorKeys.length<1)&&(this.separatorKeys=[this.$mdConstant.KEY_CODE.ENTER]),this.separatorKeys.indexOf(e.keyCode)!==-1){if(this.hasAutocomplete&&this.requireMatch||!t)return;if(e.preventDefault(),this.hasMaxChipsReached())return;this.appendChip(t.trim()),this.resetChipBuffer()}}},e.prototype.getCursorPosition=function(e){try{if(e.selectionStart===e.selectionEnd)return e.selectionStart}catch(t){if(!e.value)return 0}},e.prototype.updateChipContents=function(e,t){e>=0&&e<this.items.length&&(this.items[e]=t,this.ngModelCtrl.$setDirty())},e.prototype.isEditingChip=function(){return!!this.$element[0].getElementsByClassName("_md-chip-editing").length},e.prototype.isRemovable=function(){return!!this.ngModelCtrl&&(this.readonly?this.removable:!t.isDefined(this.removable)||this.removable)},e.prototype.chipKeydown=function(e){if(!this.getChipBuffer()&&!this.isEditingChip())switch(e.keyCode){case this.$mdConstant.KEY_CODE.BACKSPACE:case this.$mdConstant.KEY_CODE.DELETE:if(this.selectedChip<0)return;if(e.preventDefault(),!this.isRemovable())return;this.removeAndSelectAdjacentChip(this.selectedChip);break;case this.$mdConstant.KEY_CODE.LEFT_ARROW:e.preventDefault(),this.selectedChip<0&&(this.selectedChip=this.items.length),this.items.length&&this.selectAndFocusChipSafe(this.selectedChip-1);break;case this.$mdConstant.KEY_CODE.RIGHT_ARROW:e.preventDefault(),this.selectAndFocusChipSafe(this.selectedChip+1);break;case this.$mdConstant.KEY_CODE.ESCAPE:case this.$mdConstant.KEY_CODE.TAB:if(this.selectedChip<0)return;e.preventDefault(),this.onFocus()}},e.prototype.getPlaceholder=function(){var e=this.items&&this.items.length&&(""==this.secondaryPlaceholder||this.secondaryPlaceholder);return e?this.secondaryPlaceholder:this.placeholder},e.prototype.removeAndSelectAdjacentChip=function(e){var n=this.getAdjacentChipIndex(e);this.removeChip(e),this.$timeout(t.bind(this,function(){this.selectAndFocusChipSafe(n)}))},e.prototype.resetSelectedChip=function(){this.selectedChip=-1},e.prototype.getAdjacentChipIndex=function(e){var t=this.items.length-1;return 0==t?-1:e==t?e-1:e},e.prototype.appendChip=function(e){if(this.useTransformChip&&this.transformChip){var n=this.transformChip({$chip:e});t.isDefined(n)&&(e=n)}if(t.isObject(e)){var o=this.items.some(function(n){return t.equals(e,n)});if(o)return}if(!(null==e||this.items.indexOf(e)+1)){var i=this.items.push(e);this.ngModelCtrl.$setDirty(),this.validateModel(),this.useOnAdd&&this.onAdd&&this.onAdd({$chip:e,$index:i})}},e.prototype.useTransformChipExpression=function(){this.useTransformChip=!0},e.prototype.useOnAddExpression=function(){this.useOnAdd=!0},e.prototype.useOnRemoveExpression=function(){this.useOnRemove=!0},e.prototype.useOnSelectExpression=function(){this.useOnSelect=!0},e.prototype.getChipBuffer=function(){return this.userInputElement?this.userInputNgModelCtrl?this.userInputNgModelCtrl.$viewValue:this.userInputElement[0].value:this.chipBuffer},e.prototype.resetChipBuffer=function(){this.userInputElement?this.userInputNgModelCtrl?(this.userInputNgModelCtrl.$setViewValue(""),this.userInputNgModelCtrl.$render()):this.userInputElement[0].value="":this.chipBuffer=""},e.prototype.hasMaxChipsReached=function(){return t.isString(this.maxChips)&&(this.maxChips=parseInt(this.maxChips,10)||0),this.maxChips>0&&this.items.length>=this.maxChips},e.prototype.validateModel=function(){this.ngModelCtrl.$setValidity("md-max-chips",!this.hasMaxChipsReached())},e.prototype.removeChip=function(e){var t=this.items.splice(e,1);this.ngModelCtrl.$setDirty(),this.validateModel(),t&&t.length&&this.useOnRemove&&this.onRemove&&this.onRemove({$chip:t[0],$index:e})},e.prototype.removeChipAndFocusInput=function(e){this.removeChip(e),this.onFocus()},e.prototype.selectAndFocusChipSafe=function(e){return this.items.length?e===this.items.length?this.onFocus():(e=Math.max(e,0),e=Math.min(e,this.items.length-1),this.selectChip(e),void this.focusChip(e)):(this.selectChip(-1),void this.onFocus())},e.prototype.selectChip=function(e){e>=-1&&e<=this.items.length?(this.selectedChip=e,this.useOnSelect&&this.onSelect&&this.onSelect({$chip:this.items[this.selectedChip]})):this.$log.warn("Selected Chip index out of bounds; ignoring.")},e.prototype.selectAndFocusChip=function(e){this.selectChip(e),e!=-1&&this.focusChip(e)},e.prototype.focusChip=function(e){this.$element[0].querySelector('md-chip[index="'+e+'"] .md-chip-content').focus()},e.prototype.configureNgModel=function(e){this.ngModelCtrl=e;var t=this;e.$render=function(){t.items=t.ngModelCtrl.$viewValue}},e.prototype.onFocus=function(){var e=this.$element[0].querySelector("input");e&&e.focus(),this.resetSelectedChip()},e.prototype.onInputFocus=function(){this.inputHasFocus=!0,this.resetSelectedChip()},e.prototype.onInputBlur=function(){this.inputHasFocus=!1},e.prototype.configureUserInput=function(e){this.userInputElement=e;var n=e.controller("ngModel");n!=this.ngModelCtrl&&(this.userInputNgModelCtrl=n);var o=this.$scope,i=this,r=function(e,n){o.$evalAsync(t.bind(i,n,e))};e.attr({tabindex:0}).on("keydown",function(e){r(e,i.inputKeydown)}).on("focus",function(e){r(e,i.onInputFocus)}).on("blur",function(e){r(e,i.onInputBlur)})},e.prototype.configureAutocomplete=function(e){e&&(this.hasAutocomplete=!0,e.registerSelectedItemWatcher(t.bind(this,function(e){if(e){if(this.hasMaxChipsReached())return;this.appendChip(e),this.resetChipBuffer()}})),this.$element.find("input").on("focus",t.bind(this,this.onInputFocus)).on("blur",t.bind(this,this.onInputBlur)))},e.prototype.hasFocus=function(){return this.inputHasFocus||this.selectedChip>=0}}(),function(){function e(e,t,a,d,s,c){function l(n,o){function i(e){if(o.ngModel){var t=r[0].querySelector(e);return t&&t.outerHTML}}var r=o.$mdUserTemplate;o.$mdUserTemplate=null;var l=i("md-chips>md-chip-template"),m=t.prefixer().buildList("md-chip-remove").map(function(e){
return"md-chips>*["+e+"]"}).join(","),p=i(m)||u.remove,h=l||u["default"],f=i("md-chips>md-autocomplete")||i("md-chips>input")||u.input,g=r.find("md-chip");return r[0].querySelector("md-chip-template>*[md-chip-remove]")&&d.warn("invalid placement of md-chip-remove within md-chip-template."),function(n,i,r,d){t.initOptionalProperties(n,o),e(i);var m=d[0];if(l&&(m.enableChipEdit=!1),m.chipContentsTemplate=h,m.chipRemoveTemplate=p,m.chipInputTemplate=f,m.mdCloseIcon=c.mdClose,i.attr({"aria-hidden":!0,tabindex:-1}).on("focus",function(){m.onFocus()}),o.ngModel&&(m.configureNgModel(i.controller("ngModel")),r.mdTransformChip&&m.useTransformChipExpression(),r.mdOnAppend&&m.useOnAppendExpression(),r.mdOnAdd&&m.useOnAddExpression(),r.mdOnRemove&&m.useOnRemoveExpression(),r.mdOnSelect&&m.useOnSelectExpression(),f!=u.input&&n.$watch("$mdChipsCtrl.readonly",function(e){e||t.nextTick(function(){0===f.indexOf("<md-autocomplete")&&m.configureAutocomplete(i.find("md-autocomplete").controller("mdAutocomplete")),m.configureUserInput(i.find("input"))})}),t.nextTick(function(){var e=i.find("input");e&&e.toggleClass("md-input",!0)})),g.length>0){var b=a(g.clone())(n.$parent);s(function(){i.find("md-chips-wrap").prepend(b)})}}}function m(){return{chips:t.processTemplate(n),input:t.processTemplate(o),"default":t.processTemplate(i),remove:t.processTemplate(r)}}var u=m();return{template:function(e,t){return t.$mdUserTemplate=e.clone(),u.chips},require:["mdChips"],restrict:"E",controller:"MdChipsCtrl",controllerAs:"$mdChipsCtrl",bindToController:!0,compile:l,scope:{readonly:"=readonly",removable:"=mdRemovable",placeholder:"@",mdEnableChipEdit:"@",secondaryPlaceholder:"@",maxChips:"@mdMaxChips",transformChip:"&mdTransformChip",onAppend:"&mdOnAppend",onAdd:"&mdOnAdd",onRemove:"&mdOnRemove",onSelect:"&mdOnSelect",deleteHint:"@",deleteButtonLabel:"@",separatorKeys:"=?mdSeparatorKeys",requireMatch:"=?mdRequireMatch"}}}t.module("material.components.chips").directive("mdChips",e);var n='      <md-chips-wrap          ng-keydown="$mdChipsCtrl.chipKeydown($event)"          ng-class="{ \'md-focused\': $mdChipsCtrl.hasFocus(),                       \'md-readonly\': !$mdChipsCtrl.ngModelCtrl || $mdChipsCtrl.readonly,                      \'md-removable\': $mdChipsCtrl.isRemovable() }"          class="md-chips">        <md-chip ng-repeat="$chip in $mdChipsCtrl.items"            index="{{$index}}"            ng-class="{\'md-focused\': $mdChipsCtrl.selectedChip == $index, \'md-readonly\': !$mdChipsCtrl.ngModelCtrl || $mdChipsCtrl.readonly}">          <div class="md-chip-content"              tabindex="-1"              aria-hidden="true"              ng-click="!$mdChipsCtrl.readonly && $mdChipsCtrl.focusChip($index)"              ng-focus="!$mdChipsCtrl.readonly && $mdChipsCtrl.selectChip($index)"              md-chip-transclude="$mdChipsCtrl.chipContentsTemplate"></div>          <div ng-if="$mdChipsCtrl.isRemovable()"               class="md-chip-remove-container"               md-chip-transclude="$mdChipsCtrl.chipRemoveTemplate"></div>        </md-chip>        <div class="md-chip-input-container" ng-if="!$mdChipsCtrl.readonly && $mdChipsCtrl.ngModelCtrl">          <div md-chip-transclude="$mdChipsCtrl.chipInputTemplate"></div>        </div>      </md-chips-wrap>',o='        <input            class="md-input"            tabindex="0"            placeholder="{{$mdChipsCtrl.getPlaceholder()}}"            aria-label="{{$mdChipsCtrl.getPlaceholder()}}"            ng-model="$mdChipsCtrl.chipBuffer"            ng-focus="$mdChipsCtrl.onInputFocus()"            ng-blur="$mdChipsCtrl.onInputBlur()"            ng-keydown="$mdChipsCtrl.inputKeydown($event)">',i="      <span>{{$chip}}</span>",r='      <button          class="md-chip-remove"          ng-if="$mdChipsCtrl.isRemovable()"          ng-click="$mdChipsCtrl.removeChipAndFocusInput($$replacedScope.$index)"          type="button"          aria-hidden="true"          tabindex="-1">        <md-icon md-svg-src="{{ $mdChipsCtrl.mdCloseIcon }}"></md-icon>        <span class="md-visually-hidden">          {{$mdChipsCtrl.deleteButtonLabel}}        </span>      </button>';e.$inject=["$mdTheming","$mdUtil","$compile","$log","$timeout","$$mdSvgRegistry"]}(),function(){function e(){this.selectedItem=null,this.searchText=""}t.module("material.components.chips").controller("MdContactChipsCtrl",e),e.prototype.queryContact=function(e){var n=this.contactQuery({$query:e});return this.filterSelected?n.filter(t.bind(this,this.filterSelectedContacts)):n},e.prototype.itemName=function(e){return e[this.contactName]},e.prototype.filterSelectedContacts=function(e){return this.contacts.indexOf(e)==-1}}(),function(){function e(e,t){function o(n,o){return function(n,i,r,a){t.initOptionalProperties(n,o),e(i),i.attr("tabindex","-1")}}return{template:function(e,t){return n},restrict:"E",controller:"MdContactChipsCtrl",controllerAs:"$mdContactChipsCtrl",bindToController:!0,compile:o,scope:{contactQuery:"&mdContacts",placeholder:"@",secondaryPlaceholder:"@",contactName:"@mdContactName",contactImage:"@mdContactImage",contactEmail:"@mdContactEmail",contacts:"=ngModel",requireMatch:"=?mdRequireMatch",highlightFlags:"@?mdHighlightFlags"}}}t.module("material.components.chips").directive("mdContactChips",e);var n='      <md-chips class="md-contact-chips"          ng-model="$mdContactChipsCtrl.contacts"          md-require-match="$mdContactChipsCtrl.requireMatch"          md-autocomplete-snap>          <md-autocomplete              md-menu-class="md-contact-chips-suggestions"              md-selected-item="$mdContactChipsCtrl.selectedItem"              md-search-text="$mdContactChipsCtrl.searchText"              md-items="item in $mdContactChipsCtrl.queryContact($mdContactChipsCtrl.searchText)"              md-item-text="$mdContactChipsCtrl.itemName(item)"              md-no-cache="true"              md-autoselect              placeholder="{{$mdContactChipsCtrl.contacts.length == 0 ?                  $mdContactChipsCtrl.placeholder : $mdContactChipsCtrl.secondaryPlaceholder}}">            <div class="md-contact-suggestion">              <img                   ng-src="{{item[$mdContactChipsCtrl.contactImage]}}"                  alt="{{item[$mdContactChipsCtrl.contactName]}}"                  ng-if="item[$mdContactChipsCtrl.contactImage]" />              <span class="md-contact-name" md-highlight-text="$mdContactChipsCtrl.searchText"                    md-highlight-flags="{{$mdContactChipsCtrl.highlightFlags}}">                {{item[$mdContactChipsCtrl.contactName]}}              </span>              <span class="md-contact-email" >{{item[$mdContactChipsCtrl.contactEmail]}}</span>            </div>          </md-autocomplete>          <md-chip-template>            <div class="md-contact-avatar">              <img                   ng-src="{{$chip[$mdContactChipsCtrl.contactImage]}}"                  alt="{{$chip[$mdContactChipsCtrl.contactName]}}"                  ng-if="$chip[$mdContactChipsCtrl.contactImage]" />            </div>            <div class="md-contact-name">              {{$chip[$mdContactChipsCtrl.contactName]}}            </div>          </md-chip-template>      </md-chips>';e.$inject=["$mdTheming","$mdUtil"]}(),function(){!function(){function e(){return{template:function(e,t){var n=t.hasOwnProperty("ngIf")?"":'ng-if="calendarCtrl.isInitialized"',o='<div ng-switch="calendarCtrl.currentView" '+n+'><md-calendar-year ng-switch-when="year"></md-calendar-year><md-calendar-month ng-switch-default></md-calendar-month></div>';return o},scope:{minDate:"=mdMinDate",maxDate:"=mdMaxDate",dateFilter:"=mdDateFilter",_currentView:"@mdCurrentView"},require:["ngModel","mdCalendar"],controller:n,controllerAs:"calendarCtrl",bindToController:!0,link:function(e,t,n,o){var i=o[0],r=o[1];r.configureNgModel(i)}}}function n(e,n,o,r,a,d,s,c){d(e),this.$element=e,this.$scope=n,this.dateUtil=o,this.$mdUtil=r,this.keyCode=a.KEY_CODE,this.$$rAF=s,this.today=this.dateUtil.createDateAtMidnight(),this.ngModelCtrl=null,this.currentView=this._currentView||"month",this.SELECTED_DATE_CLASS="md-calendar-selected-date",this.TODAY_CLASS="md-calendar-date-today",this.FOCUSED_DATE_CLASS="md-focus",this.id=i++,this.displayDate=null,this.selectedDate=null,this.isInitialized=!1,this.width=0,this.scrollbarWidth=0,c.tabindex||e.attr("tabindex","-1"),e.on("keydown",t.bind(this,this.handleKeyEvent))}t.module("material.components.datepicker").directive("mdCalendar",e);var o=340,i=0;n.$inject=["$element","$scope","$$mdDateUtil","$mdUtil","$mdConstant","$mdTheming","$$rAF","$attrs"],n.prototype.configureNgModel=function(e){var t=this;t.ngModelCtrl=e,t.$mdUtil.nextTick(function(){t.isInitialized=!0}),e.$render=function(){var e=this.$viewValue;t.$scope.$broadcast("md-calendar-parent-changed",e),t.selectedDate||(t.selectedDate=e),t.displayDate||(t.displayDate=t.selectedDate||t.today)}},n.prototype.setNgModelValue=function(e){var t=this.dateUtil.createDateAtMidnight(e);return this.focus(t),this.$scope.$emit("md-calendar-change",t),this.ngModelCtrl.$setViewValue(t),this.ngModelCtrl.$render(),t},n.prototype.setCurrentView=function(e,n){var o=this;o.$mdUtil.nextTick(function(){o.currentView=e,n&&(o.displayDate=t.isDate(n)?n:new Date(n))})},n.prototype.focus=function(e){if(this.dateUtil.isValidDate(e)){var t=this.$element[0].querySelector(".md-focus");t&&t.classList.remove(this.FOCUSED_DATE_CLASS);var n=this.getDateId(e,this.currentView),o=document.getElementById(n);o&&(o.classList.add(this.FOCUSED_DATE_CLASS),o.focus(),this.displayDate=e)}else{var i=this.$element[0].querySelector("[ng-switch]");i&&i.focus()}},n.prototype.getActionFromKeyEvent=function(e){var t=this.keyCode;switch(e.which){case t.ENTER:return"select";case t.RIGHT_ARROW:return"move-right";case t.LEFT_ARROW:return"move-left";case t.DOWN_ARROW:return e.metaKey?"move-page-down":"move-row-down";case t.UP_ARROW:return e.metaKey?"move-page-up":"move-row-up";case t.PAGE_DOWN:return"move-page-down";case t.PAGE_UP:return"move-page-up";case t.HOME:return"start";case t.END:return"end";default:return null}},n.prototype.handleKeyEvent=function(e){var t=this;this.$scope.$apply(function(){if(e.which==t.keyCode.ESCAPE||e.which==t.keyCode.TAB)return t.$scope.$emit("md-calendar-close"),void(e.which==t.keyCode.TAB&&e.preventDefault());var n=t.getActionFromKeyEvent(e);n&&(e.preventDefault(),e.stopPropagation(),t.$scope.$broadcast("md-calendar-parent-action",n))})},n.prototype.hideVerticalScrollbar=function(e){function t(){var t=n.width||o,i=n.scrollbarWidth,a=e.calendarScroller;r.style.width=t+"px",a.style.width=t+i+"px",a.style.paddingRight=i+"px"}var n=this,i=e.$element[0],r=i.querySelector(".md-calendar-scroll-mask");n.width>0?t():n.$$rAF(function(){var o=e.calendarScroller;n.scrollbarWidth=o.offsetWidth-o.clientWidth,n.width=i.querySelector("table").offsetWidth,t()})},n.prototype.getDateId=function(e,t){if(!t)throw new Error("A namespace for the date id has to be specified.");return["md",this.id,t,e.getFullYear(),e.getMonth(),e.getDate()].join("-")},n.prototype.updateVirtualRepeat=function(){var e=this.$scope,t=e.$on("$md-resize-enable",function(){e.$$phase||e.$apply(),t()})}}()}(),function(){!function(){function e(){return{template:'<table aria-hidden="true" class="md-calendar-day-header"><thead></thead></table><div class="md-calendar-scroll-mask"><md-virtual-repeat-container class="md-calendar-scroll-container" md-offset-size="'+(i-o)+'"><table role="grid" tabindex="0" class="md-calendar" aria-readonly="true"><tbody md-calendar-month-body role="rowgroup" md-virtual-repeat="i in monthCtrl.items" md-month-offset="$index" class="md-calendar-month" md-start-index="monthCtrl.getSelectedMonthIndex()" md-item-size="'+o+'"></tbody></table></md-virtual-repeat-container></div>',require:["^^mdCalendar","mdCalendarMonth"],controller:n,controllerAs:"monthCtrl",bindToController:!0,link:function(e,t,n,o){var i=o[0],r=o[1];r.initialize(i)}}}function n(e,t,n,o,i,r){this.$element=e,this.$scope=t,this.$animate=n,this.$q=o,this.dateUtil=i,this.dateLocale=r,this.calendarScroller=e[0].querySelector(".md-virtual-repeat-scroller"),this.firstRenderableDate=null,this.isInitialized=!1,this.isMonthTransitionInProgress=!1;var a=this;this.cellClickHandler=function(){var e=i.getTimestampFromNode(this);a.$scope.$apply(function(){a.calendarCtrl.setNgModelValue(e)})},this.headerClickHandler=function(){a.calendarCtrl.setCurrentView("year",i.getTimestampFromNode(this))}}t.module("material.components.datepicker").directive("mdCalendarMonth",e);var o=265,i=45;n.$inject=["$element","$scope","$animate","$q","$$mdDateUtil","$mdDateLocale"],n.prototype.initialize=function(e){var t=e.minDate,n=e.maxDate;if(this.calendarCtrl=e,this.items={length:2e3},n&&t){var o=this.dateUtil.getMonthDistance(t,n)+1;o=Math.max(o,1),o+=1,this.items.length=o}if(this.firstRenderableDate=this.dateUtil.incrementMonths(e.today,-this.items.length/2),t&&t>this.firstRenderableDate)this.firstRenderableDate=t;else if(n){this.items.length-2;this.firstRenderableDate=this.dateUtil.incrementMonths(n,-(this.items.length-2))}this.attachScopeListeners(),e.updateVirtualRepeat(),e.ngModelCtrl&&e.ngModelCtrl.$render()},n.prototype.getSelectedMonthIndex=function(){var e=this.calendarCtrl;return this.dateUtil.getMonthDistance(this.firstRenderableDate,e.displayDate||e.selectedDate||e.today)},n.prototype.changeSelectedDate=function(e){var t=this,n=t.calendarCtrl,o=n.selectedDate;n.selectedDate=e,this.changeDisplayDate(e).then(function(){var t=n.SELECTED_DATE_CLASS,i="month";if(o){var r=document.getElementById(n.getDateId(o,i));r&&(r.classList.remove(t),r.setAttribute("aria-selected","false"))}if(e){var a=document.getElementById(n.getDateId(e,i));a&&(a.classList.add(t),a.setAttribute("aria-selected","true"))}})},n.prototype.changeDisplayDate=function(e){if(!this.isInitialized)return this.buildWeekHeader(),this.calendarCtrl.hideVerticalScrollbar(this),this.isInitialized=!0,this.$q.when();if(!this.dateUtil.isValidDate(e)||this.isMonthTransitionInProgress)return this.$q.when();this.isMonthTransitionInProgress=!0;var t=this.animateDateChange(e);this.calendarCtrl.displayDate=e;var n=this;return t.then(function(){n.isMonthTransitionInProgress=!1}),t},n.prototype.animateDateChange=function(e){if(this.dateUtil.isValidDate(e)){var t=this.dateUtil.getMonthDistance(this.firstRenderableDate,e);this.calendarScroller.scrollTop=t*o}return this.$q.when()},n.prototype.buildWeekHeader=function(){for(var e=this.dateLocale.firstDayOfWeek,t=this.dateLocale.shortDays,n=document.createElement("tr"),o=0;o<7;o++){var i=document.createElement("th");i.textContent=t[(o+e)%7],n.appendChild(i)}this.$element.find("thead").append(n)},n.prototype.attachScopeListeners=function(){var e=this;e.$scope.$on("md-calendar-parent-changed",function(t,n){e.changeSelectedDate(n)}),e.$scope.$on("md-calendar-parent-action",t.bind(this,this.handleKeyEvent))},n.prototype.handleKeyEvent=function(e,t){var n=this.calendarCtrl,o=n.displayDate;if("select"===t)n.setNgModelValue(o);else{var i=null,r=this.dateUtil;switch(t){case"move-right":i=r.incrementDays(o,1);break;case"move-left":i=r.incrementDays(o,-1);break;case"move-page-down":i=r.incrementMonths(o,1);break;case"move-page-up":i=r.incrementMonths(o,-1);break;case"move-row-down":i=r.incrementDays(o,7);break;case"move-row-up":i=r.incrementDays(o,-7);break;case"start":i=r.getFirstDateOfMonth(o);break;case"end":i=r.getLastDateOfMonth(o)}i&&(i=this.dateUtil.clampDate(i,n.minDate,n.maxDate),this.changeDisplayDate(i).then(function(){n.focus(i)}))}}}()}(),function(){!function(){function e(e,t){var o=e('<md-icon md-svg-src="'+t.mdTabsArrow+'"></md-icon>')({})[0];return{require:["^^mdCalendar","^^mdCalendarMonth","mdCalendarMonthBody"],scope:{offset:"=mdMonthOffset"},controller:n,controllerAs:"mdMonthBodyCtrl",bindToController:!0,link:function(e,t,n,i){var r=i[0],a=i[1],d=i[2];d.calendarCtrl=r,d.monthCtrl=a,d.arrowIcon=o.cloneNode(!0),d.generateContent(),e.$watch(function(){return d.offset},function(e,t){e!==t&&d.generateContent()})}}}function n(e,t,n){this.$element=e,this.dateUtil=t,this.dateLocale=n,this.monthCtrl=null,this.calendarCtrl=null,this.offset=null,this.focusAfterAppend=null}t.module("material.components.datepicker").directive("mdCalendarMonthBody",e),e.$inject=["$compile","$$mdSvgRegistry"],n.$inject=["$element","$$mdDateUtil","$mdDateLocale"],n.prototype.generateContent=function(){var e=this.dateUtil.incrementMonths(this.monthCtrl.firstRenderableDate,this.offset);this.$element.empty(),this.$element.append(this.buildCalendarForMonth(e)),this.focusAfterAppend&&(this.focusAfterAppend.classList.add(this.calendarCtrl.FOCUSED_DATE_CLASS),this.focusAfterAppend.focus(),this.focusAfterAppend=null)},n.prototype.buildDateCell=function(e){var t=this.monthCtrl,n=this.calendarCtrl,o=document.createElement("td");if(o.tabIndex=-1,o.classList.add("md-calendar-date"),o.setAttribute("role","gridcell"),e){o.setAttribute("tabindex","-1"),o.setAttribute("aria-label",this.dateLocale.longDateFormatter(e)),o.id=n.getDateId(e,"month"),o.setAttribute("data-timestamp",e.getTime()),this.dateUtil.isSameDay(e,n.today)&&o.classList.add(n.TODAY_CLASS),this.dateUtil.isValidDate(n.selectedDate)&&this.dateUtil.isSameDay(e,n.selectedDate)&&(o.classList.add(n.SELECTED_DATE_CLASS),o.setAttribute("aria-selected","true"));var i=this.dateLocale.dates[e.getDate()];if(this.isDateEnabled(e)){var r=document.createElement("span");r.classList.add("md-calendar-date-selection-indicator"),r.textContent=i,o.appendChild(r),o.addEventListener("click",t.cellClickHandler),n.displayDate&&this.dateUtil.isSameDay(e,n.displayDate)&&(this.focusAfterAppend=o)}else o.classList.add("md-calendar-date-disabled"),o.textContent=i}return o},n.prototype.isDateEnabled=function(e){return this.dateUtil.isDateWithinRange(e,this.calendarCtrl.minDate,this.calendarCtrl.maxDate)&&(!t.isFunction(this.calendarCtrl.dateFilter)||this.calendarCtrl.dateFilter(e))},n.prototype.buildDateRow=function(e){var t=document.createElement("tr");return t.setAttribute("role","row"),t.setAttribute("aria-label",this.dateLocale.weekNumberFormatter(e)),t},n.prototype.buildCalendarForMonth=function(e){var t=this.dateUtil.isValidDate(e)?e:new Date,n=this.dateUtil.getFirstDateOfMonth(t),o=this.getLocaleDay_(n),i=this.dateUtil.getNumberOfDaysInMonth(t),r=document.createDocumentFragment(),a=1,d=this.buildDateRow(a);r.appendChild(d);var s=this.offset===this.monthCtrl.items.length-1,c=0,l=document.createElement("td"),m=document.createElement("span");if(m.textContent=this.dateLocale.monthHeaderFormatter(t),l.appendChild(m),l.classList.add("md-calendar-month-label"),this.calendarCtrl.maxDate&&n>this.calendarCtrl.maxDate?l.classList.add("md-calendar-month-label-disabled"):(l.addEventListener("click",this.monthCtrl.headerClickHandler),l.setAttribute("data-timestamp",n.getTime()),l.setAttribute("aria-label",this.dateLocale.monthFormatter(t)),l.appendChild(this.arrowIcon.cloneNode(!0))),o<=2){l.setAttribute("colspan","7");var u=this.buildDateRow();if(u.appendChild(l),r.insertBefore(u,d),s)return r}else c=3,l.setAttribute("colspan","3"),d.appendChild(l);for(var p=c;p<o;p++)d.appendChild(this.buildDateCell());for(var h=o,f=n,g=1;g<=i;g++){if(7===h){if(s)return r;h=0,a++,d=this.buildDateRow(a),r.appendChild(d)}f.setDate(g);var b=this.buildDateCell(f);d.appendChild(b),h++}for(;d.childNodes.length<7;)d.appendChild(this.buildDateCell());for(;r.childNodes.length<6;){for(var v=this.buildDateRow(),E=0;E<7;E++)v.appendChild(this.buildDateCell());r.appendChild(v)}return r},n.prototype.getLocaleDay_=function(e){return(e.getDay()+(7-this.dateLocale.firstDayOfWeek))%7}}()}(),function(){!function(){function e(){return{template:'<div class="md-calendar-scroll-mask"><md-virtual-repeat-container class="md-calendar-scroll-container"><table role="grid" tabindex="0" class="md-calendar" aria-readonly="true"><tbody md-calendar-year-body role="rowgroup" md-virtual-repeat="i in yearCtrl.items" md-year-offset="$index" class="md-calendar-year" md-start-index="yearCtrl.getFocusedYearIndex()" md-item-size="'+o+'"></tbody></table></md-virtual-repeat-container></div>',require:["^^mdCalendar","mdCalendarYear"],controller:n,controllerAs:"yearCtrl",bindToController:!0,link:function(e,t,n,o){var i=o[0],r=o[1];r.initialize(i)}}}function n(e,t,n,o,i){this.$element=e,this.$scope=t,this.$animate=n,this.$q=o,this.dateUtil=i,this.calendarScroller=e[0].querySelector(".md-virtual-repeat-scroller"),this.firstRenderableDate=null,this.isInitialized=!1,this.isMonthTransitionInProgress=!1;var r=this;this.cellClickHandler=function(){r.calendarCtrl.setCurrentView("month",i.getTimestampFromNode(this))}}t.module("material.components.datepicker").directive("mdCalendarYear",e);var o=88;n.$inject=["$element","$scope","$animate","$q","$$mdDateUtil"],n.prototype.initialize=function(e){var t=e.minDate,n=e.maxDate;if(this.calendarCtrl=e,this.items={length:400},this.firstRenderableDate=this.dateUtil.incrementYears(e.today,-(this.items.length/2)),t&&t>this.firstRenderableDate?this.firstRenderableDate=t:n&&(this.firstRenderableDate=this.dateUtil.incrementMonths(n,-(this.items.length-1))),n&&t){var o=this.dateUtil.getYearDistance(this.firstRenderableDate,n)+1;this.items.length=Math.max(o,1)}this.attachScopeListeners(),e.updateVirtualRepeat(),e.ngModelCtrl&&e.ngModelCtrl.$render()},n.prototype.getFocusedYearIndex=function(){var e=this.calendarCtrl;return this.dateUtil.getYearDistance(this.firstRenderableDate,e.displayDate||e.selectedDate||e.today)},n.prototype.changeDate=function(e){if(!this.isInitialized)return this.calendarCtrl.hideVerticalScrollbar(this),this.isInitialized=!0,this.$q.when();if(this.dateUtil.isValidDate(e)&&!this.isMonthTransitionInProgress){var t=this,n=this.animateDateChange(e);return t.isMonthTransitionInProgress=!0,t.calendarCtrl.displayDate=e,n.then(function(){t.isMonthTransitionInProgress=!1})}},n.prototype.animateDateChange=function(e){if(this.dateUtil.isValidDate(e)){var t=this.dateUtil.getYearDistance(this.firstRenderableDate,e);this.calendarScroller.scrollTop=t*o}return this.$q.when()},n.prototype.handleKeyEvent=function(e,t){var n=this.calendarCtrl,o=n.displayDate;if("select"===t)this.changeDate(o).then(function(){n.setCurrentView("month",o),n.focus(o)});else{var i=null,r=this.dateUtil;switch(t){case"move-right":i=r.incrementMonths(o,1);break;case"move-left":i=r.incrementMonths(o,-1);break;case"move-row-down":i=r.incrementMonths(o,6);break;case"move-row-up":i=r.incrementMonths(o,-6)}if(i){var a=n.minDate?r.incrementMonths(r.getFirstDateOfMonth(n.minDate),1):null,d=n.maxDate?r.getFirstDateOfMonth(n.maxDate):null;i=r.getFirstDateOfMonth(this.dateUtil.clampDate(i,a,d)),this.changeDate(i).then(function(){n.focus(i)})}}},n.prototype.attachScopeListeners=function(){var e=this;e.$scope.$on("md-calendar-parent-changed",function(t,n){e.changeDate(n)}),e.$scope.$on("md-calendar-parent-action",t.bind(e,e.handleKeyEvent))}}()}(),function(){!function(){function e(){return{require:["^^mdCalendar","^^mdCalendarYear","mdCalendarYearBody"],scope:{offset:"=mdYearOffset"},controller:n,controllerAs:"mdYearBodyCtrl",bindToController:!0,link:function(e,t,n,o){var i=o[0],r=o[1],a=o[2];a.calendarCtrl=i,a.yearCtrl=r,a.generateContent(),e.$watch(function(){return a.offset},function(e,t){e!=t&&a.generateContent()})}}}function n(e,t,n){this.$element=e,this.dateUtil=t,this.dateLocale=n,this.calendarCtrl=null,this.yearCtrl=null,this.offset=null,this.focusAfterAppend=null}t.module("material.components.datepicker").directive("mdCalendarYearBody",e),n.$inject=["$element","$$mdDateUtil","$mdDateLocale"],n.prototype.generateContent=function(){var e=this.dateUtil.incrementYears(this.yearCtrl.firstRenderableDate,this.offset);this.$element.empty(),this.$element.append(this.buildCalendarForYear(e)),this.focusAfterAppend&&(this.focusAfterAppend.classList.add(this.calendarCtrl.FOCUSED_DATE_CLASS),this.focusAfterAppend.focus(),this.focusAfterAppend=null)},n.prototype.buildMonthCell=function(e,t){var n=this.calendarCtrl,o=this.yearCtrl,i=this.buildBlankCell(),r=new Date(e,t,1);i.setAttribute("aria-label",this.dateLocale.monthFormatter(r)),i.id=n.getDateId(r,"year"),i.setAttribute("data-timestamp",r.getTime()),this.dateUtil.isSameMonthAndYear(r,n.today)&&i.classList.add(n.TODAY_CLASS),this.dateUtil.isValidDate(n.selectedDate)&&this.dateUtil.isSameMonthAndYear(r,n.selectedDate)&&(i.classList.add(n.SELECTED_DATE_CLASS),i.setAttribute("aria-selected","true"));var a=this.dateLocale.shortMonths[t];if(this.dateUtil.isMonthWithinRange(r,n.minDate,n.maxDate)){var d=document.createElement("span");d.classList.add("md-calendar-date-selection-indicator"),d.textContent=a,i.appendChild(d),i.addEventListener("click",o.cellClickHandler),n.displayDate&&this.dateUtil.isSameMonthAndYear(r,n.displayDate)&&(this.focusAfterAppend=i)}else i.classList.add("md-calendar-date-disabled"),i.textContent=a;return i},n.prototype.buildBlankCell=function(){var e=document.createElement("td");return e.tabIndex=-1,e.classList.add("md-calendar-date"),e.setAttribute("role","gridcell"),e.setAttribute("tabindex","-1"),e},n.prototype.buildCalendarForYear=function(e){var t,n=e.getFullYear(),o=document.createDocumentFragment(),i=document.createElement("tr"),r=document.createElement("td");for(r.className="md-calendar-month-label",r.textContent=n,i.appendChild(r),t=0;t<6;t++)i.appendChild(this.buildMonthCell(n,t));o.appendChild(i);var a=document.createElement("tr");for(a.appendChild(this.buildBlankCell()),t=6;t<12;t++)a.appendChild(this.buildMonthCell(n,t));return o.appendChild(a),o}}()}(),function(){!function(){t.module("material.components.datepicker").config(["$provide",function(e){function t(){this.months=null,this.shortMonths=null,this.days=null,this.shortDays=null,this.dates=null,this.firstDayOfWeek=0,this.formatDate=null,this.parseDate=null,this.monthHeaderFormatter=null,this.weekNumberFormatter=null,this.longDateFormatter=null,this.msgCalendar="",this.msgOpenCalendar=""}t.prototype.$get=function(e,t){function n(e){if(!e)return"";var n=e.toLocaleTimeString(),o=e;return 0!=e.getHours()||n.indexOf("11:")===-1&&n.indexOf("23:")===-1||(o=new Date(e.getFullYear(),e.getMonth(),e.getDate(),1,0,0)),t("date")(o,"M/d/yyyy")}function o(e){return new Date(e)}function i(e){e=e.trim();var t=/^(([a-zA-Z]{3,}|[0-9]{1,4})([ \.,]+|[\/\-])){2}([a-zA-Z]{3,}|[0-9]{1,4})$/;return t.test(e)}function r(e){return h.shortMonths[e.getMonth()]+" "+e.getFullYear()}function a(e){return h.months[e.getMonth()]+" "+e.getFullYear()}function d(e){return"Week "+e}function s(e){return[h.days[e.getDay()],h.months[e.getMonth()],h.dates[e.getDate()],e.getFullYear()].join(" ")}for(var c=e.DATETIME_FORMATS.SHORTDAY.map(function(e){return e.substring(0,1)}),l=Array(32),m=1;m<=31;m++)l[m]=m;var u="Calendar",p="Open calendar",h={months:this.months||e.DATETIME_FORMATS.MONTH,shortMonths:this.shortMonths||e.DATETIME_FORMATS.SHORTMONTH,days:this.days||e.DATETIME_FORMATS.DAY,shortDays:this.shortDays||c,dates:this.dates||l,firstDayOfWeek:this.firstDayOfWeek||0,formatDate:this.formatDate||n,parseDate:this.parseDate||o,isDateComplete:this.isDateComplete||i,monthHeaderFormatter:this.monthHeaderFormatter||r,monthFormatter:this.monthFormatter||a,weekNumberFormatter:this.weekNumberFormatter||d,longDateFormatter:this.longDateFormatter||s,msgCalendar:this.msgCalendar||u,msgOpenCalendar:this.msgOpenCalendar||p};return h},t.prototype.$get.$inject=["$locale","$filter"],e.provider("$mdDateLocale",new t)}])}()}(),function(){!function(){t.module("material.components.datepicker").factory("$$mdDateUtil",function(){function e(e){return new Date(e.getFullYear(),e.getMonth(),1)}function n(e){return new Date(e.getFullYear(),e.getMonth()+1,0).getDate()}function o(e){return new Date(e.getFullYear(),e.getMonth()+1,1)}function i(e){return new Date(e.getFullYear(),e.getMonth()-1,1)}function r(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()}function a(e,t){return e.getDate()==t.getDate()&&r(e,t)}function d(e,t){var n=o(e);return r(n,t)}function s(e,t){var n=i(e);return r(t,n)}function c(e,t){return b((e.getTime()+t.getTime())/2)}function l(t){var n=e(t);return Math.floor((n.getDay()+t.getDate()-1)/7)}function m(e,t){return new Date(e.getFullYear(),e.getMonth(),e.getDate()+t)}function u(e,t){var o=new Date(e.getFullYear(),e.getMonth()+t,1),i=n(o);return i<e.getDate()?o.setDate(i):o.setDate(e.getDate()),o}function p(e,t){return 12*(t.getFullYear()-e.getFullYear())+(t.getMonth()-e.getMonth())}function h(e){return new Date(e.getFullYear(),e.getMonth(),n(e))}function f(e){return null!=e&&e.getTime&&!isNaN(e.getTime())}function g(e){f(e)&&e.setHours(0,0,0,0)}function b(e){var n;return n=t.isUndefined(e)?new Date:new Date(e),g(n),n}function v(e,t,n){var o=b(e),i=f(t)?b(t):null,r=f(n)?b(n):null;return(!i||i<=o)&&(!r||r>=o)}function E(e,t){return u(e,12*t)}function $(e,t){return t.getFullYear()-e.getFullYear()}function C(e,t,n){var o=e;return t&&e<t&&(o=new Date(t.getTime())),n&&e>n&&(o=new Date(n.getTime())),o}function y(e){if(e&&e.hasAttribute("data-timestamp"))return Number(e.getAttribute("data-timestamp"))}function M(e,t,n){var o=e.getMonth(),i=e.getFullYear();return(!t||t.getFullYear()<i||t.getMonth()<=o)&&(!n||n.getFullYear()>i||n.getMonth()>=o)}return{getFirstDateOfMonth:e,getNumberOfDaysInMonth:n,getDateInNextMonth:o,getDateInPreviousMonth:i,isInNextMonth:d,isInPreviousMonth:s,getDateMidpoint:c,isSameMonthAndYear:r,getWeekOfMonth:l,incrementDays:m,incrementMonths:u,getLastDateOfMonth:h,isSameDay:a,getMonthDistance:p,isValidDate:f,setDateTimeToMidnight:g,createDateAtMidnight:b,isDateWithinRange:v,incrementYears:E,getYearDistance:$,clampDate:C,getTimestampFromNode:y,isMonthWithinRange:M}})}()}(),function(){!function(){function n(e,n,i){return{template:function(t,n){var o=n.mdHideIcons,i="all"===o||"calendar"===o?"":'<md-button class="md-datepicker-button md-icon-button" type="button" tabindex="-1" aria-hidden="true" ng-click="ctrl.openCalendarPane($event)"><md-icon class="md-datepicker-calendar-icon" aria-label="md-calendar" md-svg-src="'+e.mdCalendar+'"></md-icon></md-button>',r="all"===o||"triangle"===o?"":'<md-button type="button" md-no-ink class="md-datepicker-triangle-button md-icon-button" ng-click="ctrl.openCalendarPane($event)" aria-label="{{::ctrl.dateLocale.msgOpenCalendar}}"><div class="md-datepicker-expand-triangle"></div></md-button>';return""+i+'<div class="md-datepicker-input-container" ng-class="{\'md-datepicker-focused\': ctrl.isFocused}"><input class="md-datepicker-input" aria-haspopup="true" ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)">'+r+'</div><div class="md-datepicker-calendar-pane md-whiteframe-z1"><div class="md-datepicker-input-mask"><div class="md-datepicker-input-mask-opaque"></div></div><div class="md-datepicker-calendar"><md-calendar role="dialog" aria-label="{{::ctrl.dateLocale.msgCalendar}}" md-current-view="{{::ctrl.currentView}}"md-min-date="ctrl.minDate"md-max-date="ctrl.maxDate"md-date-filter="ctrl.dateFilter"ng-model="ctrl.date" ng-if="ctrl.isCalendarOpen"></md-calendar></div></div>'},require:["ngModel","mdDatepicker","?^mdInputContainer","?^form"],scope:{minDate:"=mdMinDate",maxDate:"=mdMaxDate",placeholder:"@mdPlaceholder",currentView:"@mdCurrentView",dateFilter:"=mdDateFilter",isOpen:"=?mdIsOpen",debounceInterval:"=mdDebounceInterval"},controller:o,controllerAs:"ctrl",bindToController:!0,link:function(e,o,r,a){var c=a[0],l=a[1],m=a[2],u=a[3],p=n.parseAttributeBoolean(r.mdNoAsterisk);if(l.configureNgModel(c,m),m){var h=o[0].querySelector(".md-errors-spacer");h&&o.after(t.element("<div>").append(h)),m.setHasPlaceholder(r.mdPlaceholder),m.input=o,m.element.addClass(d).toggleClass(s,"calendar"!==r.mdHideIcons&&"all"!==r.mdHideIcons),m.label?p||r.$observe("required",function(e){m.label.toggleClass("md-required",!!e)}):i.expect(o,"aria-label",r.mdPlaceholder),e.$watch(m.isErrorGetter||function(){return c.$invalid&&(c.$touched||u&&u.$submitted)},m.setInvalid)}else if(u)var f=e.$watch(function(){return u.$submitted;
},function(e){e&&(l.updateErrorState(),f())})}}}function o(e,n,o,i,r,a,d,s,c,l,m){this.$window=i,this.dateLocale=s,this.dateUtil=c,this.$mdConstant=r,this.$mdUtil=d,this.$$rAF=l,this.documentElement=t.element(document.documentElement),this.ngModelCtrl=null,this.inputElement=n[0].querySelector("input"),this.ngInputElement=t.element(this.inputElement),this.inputContainer=n[0].querySelector(".md-datepicker-input-container"),this.calendarPane=n[0].querySelector(".md-datepicker-calendar-pane"),this.calendarButton=n[0].querySelector(".md-datepicker-button"),this.inputMask=n[0].querySelector(".md-datepicker-input-mask-opaque"),this.$element=n,this.$attrs=o,this.$scope=e,this.date=null,this.isFocused=!1,this.isDisabled,this.setDisabled(n[0].disabled||t.isString(o.disabled)),this.isCalendarOpen=!1,this.openOnFocus=o.hasOwnProperty("mdOpenOnFocus"),this.mdInputContainer=null,this.calendarPaneOpenedFrom=null,this.calendarPane.id="md-date-pane"+d.nextUid(),this.bodyClickHandler=t.bind(this,this.handleBodyClick),this.windowEventName=m.isIos||m.isAndroid?"orientationchange":"resize",this.windowEventHandler=d.debounce(t.bind(this,this.closeCalendarPane),100),this.windowBlurHandler=t.bind(this,this.handleWindowBlur),o.tabindex||n.attr("tabindex","-1"),a(n),a(t.element(this.calendarPane)),this.installPropertyInterceptors(),this.attachChangeListeners(),this.attachInteractionListeners();var u=this;e.$on("$destroy",function(){u.detachCalendarPane()}),o.mdIsOpen&&e.$watch("ctrl.isOpen",function(e){e?u.openCalendarPane({target:u.inputElement}):u.closeCalendarPane()})}t.module("material.components.datepicker").directive("mdDatepicker",n),n.$inject=["$$mdSvgRegistry","$mdUtil","$mdAria"];var i=3,r="md-datepicker-invalid",a="md-datepicker-open",d="_md-datepicker-floating-label",s="_md-datepicker-has-calendar-icon",c=500,l=368,m=360;o.$inject=["$scope","$element","$attrs","$window","$mdConstant","$mdTheming","$mdUtil","$mdDateLocale","$$mdDateUtil","$$rAF","$mdGesture"],o.prototype.configureNgModel=function(e,n){this.ngModelCtrl=e,this.mdInputContainer=n;var o=this;e.$render=function(){var e=o.ngModelCtrl.$viewValue;if(e&&!(e instanceof Date))throw Error("The ng-model for md-datepicker must be a Date instance. Currently the model is a: "+typeof e);o.date=e,o.inputElement.value=o.dateLocale.formatDate(e),o.mdInputContainer&&o.mdInputContainer.setHasValue(!!e),o.resizeInputElement(),o.updateErrorState()},e.$viewChangeListeners.unshift(t.bind(this,this.updateErrorState))},o.prototype.attachChangeListeners=function(){var e=this;e.$scope.$on("md-calendar-change",function(t,n){e.ngModelCtrl.$setViewValue(n),e.date=n,e.inputElement.value=e.dateLocale.formatDate(n),e.mdInputContainer&&e.mdInputContainer.setHasValue(!!n),e.closeCalendarPane(),e.resizeInputElement(),e.updateErrorState()}),e.ngInputElement.on("input",t.bind(e,e.resizeInputElement));var n=t.isDefined(this.debounceInterval)?this.debounceInterval:c;e.ngInputElement.on("input",e.$mdUtil.debounce(e.handleInputEvent,n,e))},o.prototype.attachInteractionListeners=function(){var e=this,n=this.$scope,o=this.$mdConstant.KEY_CODE;e.ngInputElement.on("keydown",function(t){t.altKey&&t.keyCode==o.DOWN_ARROW&&(e.openCalendarPane(t),n.$digest())}),e.openOnFocus&&(e.ngInputElement.on("focus",t.bind(e,e.openCalendarPane)),t.element(e.$window).on("blur",e.windowBlurHandler),n.$on("$destroy",function(){t.element(e.$window).off("blur",e.windowBlurHandler)})),n.$on("md-calendar-close",function(){e.closeCalendarPane()})},o.prototype.installPropertyInterceptors=function(){var e=this;if(this.$attrs.ngDisabled){var t=this.$scope.$parent;t&&t.$watch(this.$attrs.ngDisabled,function(t){e.setDisabled(t)})}Object.defineProperty(this,"placeholder",{get:function(){return e.inputElement.placeholder},set:function(t){e.inputElement.placeholder=t||""}})},o.prototype.setDisabled=function(e){this.isDisabled=e,this.inputElement.disabled=e,this.calendarButton&&(this.calendarButton.disabled=e)},o.prototype.updateErrorState=function(e){var n=e||this.date;if(this.clearErrorState(),this.dateUtil.isValidDate(n)){if(n=this.dateUtil.createDateAtMidnight(n),this.dateUtil.isValidDate(this.minDate)){var o=this.dateUtil.createDateAtMidnight(this.minDate);this.ngModelCtrl.$setValidity("mindate",n>=o)}if(this.dateUtil.isValidDate(this.maxDate)){var i=this.dateUtil.createDateAtMidnight(this.maxDate);this.ngModelCtrl.$setValidity("maxdate",n<=i)}t.isFunction(this.dateFilter)&&this.ngModelCtrl.$setValidity("filtered",this.dateFilter(n))}else this.ngModelCtrl.$setValidity("valid",null==n);this.ngModelCtrl.$valid||this.inputContainer.classList.add(r)},o.prototype.clearErrorState=function(){this.inputContainer.classList.remove(r),["mindate","maxdate","filtered","valid"].forEach(function(e){this.ngModelCtrl.$setValidity(e,!0)},this)},o.prototype.resizeInputElement=function(){this.inputElement.size=this.inputElement.value.length+i},o.prototype.handleInputEvent=function(){var e=this.inputElement.value,t=e?this.dateLocale.parseDate(e):null;this.dateUtil.setDateTimeToMidnight(t);var n=""==e||this.dateUtil.isValidDate(t)&&this.dateLocale.isDateComplete(e)&&this.isDateEnabled(t);n&&(this.ngModelCtrl.$setViewValue(t),this.date=t),this.updateErrorState(t)},o.prototype.isDateEnabled=function(e){return this.dateUtil.isDateWithinRange(e,this.minDate,this.maxDate)&&(!t.isFunction(this.dateFilter)||this.dateFilter(e))},o.prototype.attachCalendarPane=function(){var e=this.calendarPane,n=document.body;e.style.transform="",this.$element.addClass(a),this.mdInputContainer&&this.mdInputContainer.element.addClass(a),t.element(n).addClass("md-datepicker-is-showing");var o=this.inputContainer.getBoundingClientRect(),i=n.getBoundingClientRect(),r=o.top-i.top,d=o.left-i.left,s=i.top<0&&0==document.body.scrollTop?-i.top:document.body.scrollTop,c=i.left<0&&0==document.body.scrollLeft?-i.left:document.body.scrollLeft,u=s+this.$window.innerHeight,p=c+this.$window.innerWidth;if(d+m>p){if(p-m>0)d=p-m;else{d=c;var h=this.$window.innerWidth/m;e.style.transform="scale("+h+")"}e.classList.add("md-datepicker-pos-adjusted")}r+l>u&&u-l>s&&(r=u-l,e.classList.add("md-datepicker-pos-adjusted")),e.style.left=d+"px",e.style.top=r+"px",document.body.appendChild(e),this.inputMask.style.left=o.width+"px",this.$$rAF(function(){e.classList.add("md-pane-open")})},o.prototype.detachCalendarPane=function(){this.$element.removeClass(a),this.mdInputContainer&&this.mdInputContainer.element.removeClass(a),t.element(document.body).removeClass("md-datepicker-is-showing"),this.calendarPane.classList.remove("md-pane-open"),this.calendarPane.classList.remove("md-datepicker-pos-adjusted"),this.isCalendarOpen&&this.$mdUtil.enableScrolling(),this.calendarPane.parentNode&&this.calendarPane.parentNode.removeChild(this.calendarPane)},o.prototype.openCalendarPane=function(t){if(!this.isCalendarOpen&&!this.isDisabled&&!this.inputFocusedOnWindowBlur){this.isCalendarOpen=this.isOpen=!0,this.calendarPaneOpenedFrom=t.target,this.$mdUtil.disableScrollAround(this.calendarPane),this.attachCalendarPane(),this.focusCalendar(),this.evalAttr("ngFocus");var n=this;this.$mdUtil.nextTick(function(){n.documentElement.on("click touchstart",n.bodyClickHandler)},!1),e.addEventListener(this.windowEventName,this.windowEventHandler)}},o.prototype.closeCalendarPane=function(){function t(){n.isCalendarOpen=n.isOpen=!1}if(this.isCalendarOpen){var n=this;n.detachCalendarPane(),n.ngModelCtrl.$setTouched(),n.evalAttr("ngBlur"),n.documentElement.off("click touchstart",n.bodyClickHandler),e.removeEventListener(n.windowEventName,n.windowEventHandler),n.calendarPaneOpenedFrom.focus(),n.calendarPaneOpenedFrom=null,n.openOnFocus?n.$mdUtil.nextTick(t):t()}},o.prototype.getCalendarCtrl=function(){return t.element(this.calendarPane.querySelector("md-calendar")).controller("mdCalendar")},o.prototype.focusCalendar=function(){var e=this;this.$mdUtil.nextTick(function(){e.getCalendarCtrl().focus()},!1)},o.prototype.setFocused=function(e){e||this.ngModelCtrl.$setTouched(),this.openOnFocus||this.evalAttr(e?"ngFocus":"ngBlur"),this.isFocused=e},o.prototype.handleBodyClick=function(e){if(this.isCalendarOpen){var t=this.$mdUtil.getClosest(e.target,"md-calendar");t||this.closeCalendarPane(),this.$scope.$digest()}},o.prototype.handleWindowBlur=function(){this.inputFocusedOnWindowBlur=document.activeElement===this.inputElement},o.prototype.evalAttr=function(e){this.$attrs[e]&&this.$scope.$parent.$eval(this.$attrs[e])}}()}(),function(){function e(e,t,n,o){function i(o,i,r){function a(){var e=i.parent();return!(!e.attr("aria-label")&&!e.text())||!(!e.parent().attr("aria-label")&&!e.parent().text())}function d(){r.mdSvgIcon||r.mdSvgSrc||(r.mdFontIcon&&i.addClass("md-font "+r.mdFontIcon),i.addClass(l))}function s(){if(!r.mdSvgIcon&&!r.mdSvgSrc){r.mdFontIcon&&(i.removeClass(c),i.addClass(r.mdFontIcon),c=r.mdFontIcon);var t=e.fontSet(r.mdFontSet);l!==t&&(i.removeClass(l),i.addClass(t),l=t)}}t(i);var c=r.mdFontIcon,l=e.fontSet(r.mdFontSet);d(),r.$observe("mdFontIcon",s),r.$observe("mdFontSet",s);var m=(i[0].getAttribute(r.$attr.mdSvgSrc),r.alt||r.mdFontIcon||r.mdSvgIcon||i.text()),u=r.$normalize(r.$attr.mdSvgIcon||r.$attr.mdSvgSrc||"");r["aria-label"]||(""===m||a()?i.text()||n.expect(i,"aria-hidden","true"):(n.expect(i,"aria-label",m),n.expect(i,"role","img"))),u&&r.$observe(u,function(t){i.empty(),t&&e(t).then(function(e){i.empty(),i.append(e)})})}return{restrict:"E",link:i}}t.module("material.components.icon").directive("mdIcon",["$mdIcon","$mdTheming","$mdAria","$sce",e])}(),function(){function n(){}function o(e,t){this.url=e,this.viewBoxSize=t||r.defaultViewBoxSize}function i(n,o,i,r,a,d){function s(e){if(e=e||"",t.isString(e)||(e=d.getTrustedUrl(e)),E[e])return i.when(l(E[e]));if(C.test(e)||y.test(e))return h(e).then(m(e));e.indexOf(":")==-1&&(e="$default:"+e);var o=n[e]?u:p;return o(e).then(m(e))}function c(e){var o=t.isUndefined(e)||!(e&&e.length);if(o)return n.defaultFontSet;var i=e;return t.forEach(n.fontSets,function(t){t.alias==e&&(i=t.fontSet||i)}),i}function l(e){var n=e.clone(),o="_cache"+a.nextUid();return n.id&&(n.id+=o),t.forEach(n.querySelectorAll("[id]"),function(e){e.id+=o}),n}function m(e){return function(t){return E[e]=f(t)?t:new g(t,n[e]),E[e].clone()}}function u(e){var t=n[e];return h(t.url).then(function(e){return new g(e,t)})}function p(e){function t(t){var n=e.slice(e.lastIndexOf(":")+1),i=t.querySelector("#"+n);return i?new g(i,d):o(e)}function o(e){var t="icon "+e+" not found";return r.warn(t),i.reject(t||e)}var a=e.substring(0,e.lastIndexOf(":"))||"$default",d=n[a];return d?h(d.url).then(t):o(e)}function h(n){function a(n){var o=y.exec(n),r=/base64/i.test(n),a=r?e.atob(o[2]):o[2];return i.when(t.element(a)[0])}function d(e){return i(function(n,i){var a=function(e){var n=t.isString(e)?e:e.message||e.data||e.statusText;r.warn(n),i(e)},d=function(o){$[e]||($[e]=t.element("<div>").append(o)[0].querySelector("svg")),n($[e])};o(e,!0).then(d,a)})}return y.test(n)?a(n):d(n)}function f(e){return t.isDefined(e.element)&&t.isDefined(e.config)}function g(e,n){e&&"svg"!=e.tagName&&(e=t.element('<svg xmlns="http://www.w3.org/2000/svg">').append(e.cloneNode(!0))[0]),e.getAttribute("xmlns")||e.setAttribute("xmlns","http://www.w3.org/2000/svg"),this.element=e,this.config=n,this.prepare()}function b(){var e=this.config?this.config.viewBoxSize:n.defaultViewBoxSize;t.forEach({fit:"",height:"100%",width:"100%",preserveAspectRatio:"xMidYMid meet",viewBox:this.element.getAttribute("viewBox")||"0 0 "+e+" "+e,focusable:!1},function(e,t){this.element.setAttribute(t,e)},this)}function v(){return this.element.cloneNode(!0)}var E={},$={},C=/[-\w@:%\+.~#?&\/\/=]{2,}\.[a-z]{2,4}\b(\/[-\w@:%\+.~#?&\/\/=]*)?/i,y=/^data:image\/svg\+xml[\s*;\w\-\=]*?(base64)?,(.*)$/i;return g.prototype={clone:v,prepare:b},s.fontSet=c,s}t.module("material.components.icon").constant("$$mdSvgRegistry",{mdTabsArrow:"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxnPjxwb2x5Z29uIHBvaW50cz0iMTUuNCw3LjQgMTQsNiA4LDEyIDE0LDE4IDE1LjQsMTYuNiAxMC44LDEyICIvPjwvZz48L3N2Zz4=",mdClose:"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxnPjxwYXRoIGQ9Ik0xOSA2LjQxbC0xLjQxLTEuNDEtNS41OSA1LjU5LTUuNTktNS41OS0xLjQxIDEuNDEgNS41OSA1LjU5LTUuNTkgNS41OSAxLjQxIDEuNDEgNS41OS01LjU5IDUuNTkgNS41OSAxLjQxLTEuNDEtNS41OS01LjU5eiIvPjwvZz48L3N2Zz4=",mdCancel:"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxnPjxwYXRoIGQ9Ik0xMiAyYy01LjUzIDAtMTAgNC40Ny0xMCAxMHM0LjQ3IDEwIDEwIDEwIDEwLTQuNDcgMTAtMTAtNC40Ny0xMC0xMC0xMHptNSAxMy41OWwtMS40MSAxLjQxLTMuNTktMy41OS0zLjU5IDMuNTktMS40MS0xLjQxIDMuNTktMy41OS0zLjU5LTMuNTkgMS40MS0xLjQxIDMuNTkgMy41OSAzLjU5LTMuNTkgMS40MSAxLjQxLTMuNTkgMy41OSAzLjU5IDMuNTl6Ii8+PC9nPjwvc3ZnPg==",mdMenu:"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0zLDZIMjFWOEgzVjZNMywxMUgyMVYxM0gzVjExTTMsMTZIMjFWMThIM1YxNloiIC8+PC9zdmc+",mdToggleArrow:"data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNDggNDgiPjxwYXRoIGQ9Ik0yNCAxNmwtMTIgMTIgMi44MyAyLjgzIDkuMTctOS4xNyA5LjE3IDkuMTcgMi44My0yLjgzeiIvPjxwYXRoIGQ9Ik0wIDBoNDh2NDhoLTQ4eiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",mdCalendar:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkgM2gtMVYxaC0ydjJIOFYxSDZ2Mkg1Yy0xLjExIDAtMS45OS45LTEuOTkgMkwzIDE5YzAgMS4xLjg5IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTZINVY4aDE0djExek03IDEwaDV2NUg3eiIvPjwvc3ZnPg=="}).provider("$mdIcon",n);var r={defaultViewBoxSize:24,defaultFontSet:"material-icons",fontSets:[]};n.prototype={icon:function(e,t,n){return e.indexOf(":")==-1&&(e="$default:"+e),r[e]=new o(t,n),this},iconSet:function(e,t,n){return r[e]=new o(t,n),this},defaultIconSet:function(e,t){var n="$default";return r[n]||(r[n]=new o(e,t)),r[n].viewBoxSize=t||r.defaultViewBoxSize,this},defaultViewBoxSize:function(e){return r.defaultViewBoxSize=e,this},fontSet:function(e,t){return r.fontSets.push({alias:e,fontSet:t||e}),this},defaultFontSet:function(e){return r.defaultFontSet=e?e:"",this},defaultIconSize:function(e){return r.defaultIconSize=e,this},$get:["$templateRequest","$q","$log","$mdUtil","$sce",function(e,t,n,o,a){return i(r,e,t,n,o,a)}]},i.$inject=["config","$templateRequest","$q","$log","$mdUtil","$sce"]}(),function(){function e(e,o,i,r,a,d,s,c){var l,m,u=a.prefixer(),p=this;this.nestLevel=parseInt(o.mdNestLevel,10)||0,this.init=function(n,o){o=o||{},l=n,m=i[0].querySelector(u.buildSelector(["ng-click","ng-mouseenter"])),m.setAttribute("aria-expanded","false"),this.isInMenuBar=o.isInMenuBar,this.nestedMenus=a.nodesToArray(l[0].querySelectorAll(".md-nested-menu")),l.on("$mdInterimElementRemove",function(){p.isOpen=!1,a.nextTick(function(){p.onIsOpenChanged(p.isOpen)})}),a.nextTick(function(){p.onIsOpenChanged(p.isOpen)});var d="menu_container_"+a.nextUid();l.attr("id",d),t.element(m).attr({"aria-owns":d,"aria-haspopup":"true"}),r.$on("$destroy",t.bind(this,function(){this.disableHoverListener(),e.destroy()})),l.on("$destroy",function(){e.destroy()})};var h,f,g=[];this.enableHoverListener=function(){g.push(s.$on("$mdMenuOpen",function(e,t){l[0].contains(t[0])&&(p.currentlyOpenMenu=t.controller("mdMenu"),p.isAlreadyOpening=!1,p.currentlyOpenMenu.registerContainerProxy(p.triggerContainerProxy.bind(p)))})),g.push(s.$on("$mdMenuClose",function(e,t){l[0].contains(t[0])&&(p.currentlyOpenMenu=n)})),f=t.element(a.nodesToArray(l[0].children[0].children)),f.on("mouseenter",p.handleMenuItemHover),f.on("mouseleave",p.handleMenuItemMouseLeave)},this.disableHoverListener=function(){for(;g.length;)g.shift()();f&&f.off("mouseenter",p.handleMenuItemHover),f&&f.off("mouseleave",p.handleMenuItemMouseLeave)},this.handleMenuItemHover=function(e){if(!p.isAlreadyOpening){var n=e.target.querySelector("md-menu")||a.getClosest(e.target,"MD-MENU");h=d(function(){if(n&&(n=t.element(n).controller("mdMenu")),p.currentlyOpenMenu&&p.currentlyOpenMenu!=n){var e=p.nestLevel+1;p.currentlyOpenMenu.close(!0,{closeTo:e}),p.isAlreadyOpening=!!n,n&&n.open()}else n&&!n.isOpen&&n.open&&(p.isAlreadyOpening=!!n,n&&n.open())},n?100:250);var o=e.currentTarget.querySelector(".md-button:not([disabled])");o&&o.focus()}},this.handleMenuItemMouseLeave=function(){h&&(d.cancel(h),h=n)},this.open=function(t){t&&t.stopPropagation(),t&&t.preventDefault(),p.isOpen||(p.enableHoverListener(),p.isOpen=!0,a.nextTick(function(){p.onIsOpenChanged(p.isOpen)}),m=m||(t?t.target:i[0]),m.setAttribute("aria-expanded","true"),r.$emit("$mdMenuOpen",i),e.show({scope:r,mdMenuCtrl:p,nestLevel:p.nestLevel,element:l,target:m,preserveElement:!0,parent:"body"})["finally"](function(){m.setAttribute("aria-expanded","false"),p.disableHoverListener()}))},r.$mdOpenMenu=this.open,this.onIsOpenChanged=function(e){e?(l.attr("aria-hidden","false"),i[0].classList.add("md-open"),t.forEach(p.nestedMenus,function(e){e.classList.remove("md-open")})):(l.attr("aria-hidden","true"),i[0].classList.remove("md-open")),r.$mdMenuIsOpen=p.isOpen},this.focusMenuContainer=function(){var e=l[0].querySelector(u.buildSelector(["md-menu-focus-target","md-autofocus"]));e||(e=l[0].querySelector(".md-button")),e.focus()},this.registerContainerProxy=function(e){this.containerProxy=e},this.triggerContainerProxy=function(e){this.containerProxy&&this.containerProxy(e)},this.destroy=function(){return p.isOpen?e.destroy():c.when(!1)},this.close=function(n,o){if(p.isOpen){p.isOpen=!1,a.nextTick(function(){p.onIsOpenChanged(p.isOpen)});var d=t.extend({},o,{skipFocus:n});if(r.$emit("$mdMenuClose",i,d),e.hide(null,o),!n){var s=p.restoreFocusTo||i.find("button")[0];s instanceof t.element&&(s=s[0]),s&&s.focus()}}},this.positionMode=function(){var e=(o.mdPositionMode||"target").split(" ");return 1==e.length&&e.push(e[0]),{left:e[0],top:e[1]}},this.offsets=function(){var e=(o.mdOffset||"0 0").split(" ").map(parseFloat);if(2==e.length)return{left:e[0],top:e[1]};if(1==e.length)return{top:e[0],left:e[0]};throw Error("Invalid offsets specified. Please follow format <x, y> or <n>")}}t.module("material.components.menu").controller("mdMenuCtrl",e),e.$inject=["$mdMenu","$attrs","$element","$scope","$mdUtil","$timeout","$rootScope","$q"]}(),function(){function e(e){function o(n){n.addClass("md-menu");var o=n.children()[0],a=e.prefixer();if(a.hasAttribute(o,"ng-click")||(o=o.querySelector(a.buildSelector(["ng-click","ng-mouseenter"]))||o),!o||"MD-BUTTON"!=o.nodeName&&"BUTTON"!=o.nodeName||o.hasAttribute("type")||o.setAttribute("type","button"),2!=n.children().length)throw Error(r+"Expected two children elements.");o&&o.setAttribute("aria-haspopup","true");var d=n[0].querySelectorAll("md-menu"),s=parseInt(n[0].getAttribute("md-nest-level"),10)||0;return d&&t.forEach(e.nodesToArray(d),function(e){e.hasAttribute("md-position-mode")||e.setAttribute("md-position-mode","cascade"),e.classList.add("_md-nested-menu"),e.setAttribute("md-nest-level",s+1)}),i}function i(e,o,i,r){var a=r[0],d=r[1]!=n,s=t.element('<div class="_md md-open-menu-container md-whiteframe-z2"></div>'),c=o.children()[1];o.addClass("_md"),c.hasAttribute("role")||c.setAttribute("role","menu"),s.append(c),o.on("$destroy",function(){s.remove()}),o.append(s),s[0].style.display="none",a.init(s,{isInMenuBar:d})}var r="Invalid HTML for md-menu: ";return{restrict:"E",require:["mdMenu","?^mdMenuBar"],controller:"mdMenuCtrl",scope:!0,compile:o}}t.module("material.components.menu").directive("mdMenu",e),e.$inject=["$mdUtil"]}(),function(){function e(e){function o(e,o,a,d,s,c,l,m,u){function p(n,o,i){return i.nestLevel?t.noop:(i.disableParentScroll&&!e.getClosest(i.target,"MD-DIALOG")?i.restoreScroll=e.disableScrollAround(i.element,i.parent):i.disableParentScroll=!1,i.hasBackdrop&&(i.backdrop=e.createBackdrop(n,"md-menu-backdrop md-click-catcher"),u.enter(i.backdrop,d[0].body)),function(){i.backdrop&&i.backdrop.remove(),i.disableParentScroll&&i.restoreScroll()})}function h(e,t,n){function o(){return m(t,{addClass:"md-leave"}).start()}function i(){t.removeClass("md-active"),v(t,n),n.alreadyOpen=!1}return n.cleanupInteraction&&n.cleanupInteraction(),n.cleanupResizing(),n.hideBackdrop(),n.$destroy===!0?i():o().then(i)}function f(n,i,r){function d(){return r.parent.append(i),i[0].style.display="",c(function(e){var t=E(i,r);i.removeClass("md-leave"),m(i,{addClass:"md-active",from:C.toCss(t),to:C.toCss({transform:""})}).start().then(e)})}function u(){if(!r.target)throw Error("$mdMenu.show() expected a target to animate from in options.target");t.extend(r,{alreadyOpen:!1,isRemoved:!1,target:t.element(r.target),parent:t.element(r.parent),menuContentEl:t.element(i[0].querySelector("md-menu-content"))})}function h(){var e=function(e,t){return l.throttle(function(){if(!r.isRemoved){var n=E(e,t);e.css(C.toCss(n))}})}(i,r);return s.addEventListener("resize",e),s.addEventListener("orientationchange",e),function(){s.removeEventListener("resize",e),s.removeEventListener("orientationchange",e)}}function f(){function t(t){var n;switch(t.keyCode){case a.KEY_CODE.ESCAPE:r.mdMenuCtrl.close(!1,{closeAll:!0}),n=!0;break;case a.KEY_CODE.UP_ARROW:g(t,r.menuContentEl,r,-1)||r.nestLevel||r.mdMenuCtrl.triggerContainerProxy(t),n=!0;break;case a.KEY_CODE.DOWN_ARROW:g(t,r.menuContentEl,r,1)||r.nestLevel||r.mdMenuCtrl.triggerContainerProxy(t),n=!0;break;case a.KEY_CODE.LEFT_ARROW:r.nestLevel?r.mdMenuCtrl.close():r.mdMenuCtrl.triggerContainerProxy(t),n=!0;break;case a.KEY_CODE.RIGHT_ARROW:var o=e.getClosest(t.target,"MD-MENU");o&&o!=r.parent[0]?t.target.click():r.mdMenuCtrl.triggerContainerProxy(t),n=!0}n&&(t.preventDefault(),t.stopImmediatePropagation())}function o(e){e.preventDefault(),e.stopPropagation(),n.$apply(function(){r.mdMenuCtrl.close(!0,{closeAll:!0})})}function d(t){function o(){n.$apply(function(){r.mdMenuCtrl.close(!0,{closeAll:!0})})}function i(e,t){if(!e)return!1;for(var n,o=0;n=t[o];++o)if($.hasAttribute(e,n))return!0;return!1}var a=t.target;do{if(a==r.menuContentEl[0])return;if((i(a,["ng-click","ng-href","ui-sref"])||"BUTTON"==a.nodeName||"MD-BUTTON"==a.nodeName)&&!i(a,["md-prevent-menu-close"])){var d=e.getClosest(a,"MD-MENU");a.hasAttribute("disabled")||d&&d!=r.parent[0]||o();break}}while(a=a.parentNode)}i.addClass("md-clickable"),r.backdrop&&r.backdrop.on("click",o),r.menuContentEl.on("keydown",t),r.menuContentEl[0].addEventListener("click",d,!0);var s=r.menuContentEl[0].querySelector($.buildSelector(["md-menu-focus-target","md-autofocus"]));if(!s){var c=r.menuContentEl[0].firstElementChild;s=c&&(c.querySelector(".md-button:not([disabled])")||c.firstElementChild)}return s&&s.focus(),function(){i.removeClass("md-clickable"),r.backdrop&&r.backdrop.off("click",o),r.menuContentEl.off("keydown",t),r.menuContentEl[0].removeEventListener("click",d,!0)}}return u(r),o.inherit(r.menuContentEl,r.target),r.cleanupResizing=h(),r.hideBackdrop=p(n,i,r),d().then(function(e){return r.alreadyOpen=!0,r.cleanupInteraction=f(),e})}function g(t,n,o,i){for(var r,a=e.getClosest(t.target,"MD-MENU-ITEM"),d=e.nodesToArray(n[0].children),s=d.indexOf(a),c=s+i;c>=0&&c<d.length;c+=i){var l=d[c].querySelector(".md-button");if(r=b(l))break}return r}function b(e){if(e&&e.getAttribute("tabindex")!=-1)return e.focus(),d[0].activeElement==e}function v(e,t){t.preserveElement?i(e).style.display="none":i(e).parentNode===i(t.parent)&&i(t.parent).removeChild(i(e))}function E(t,o){function i(e){e.top=Math.max(Math.min(e.top,v.bottom-l.offsetHeight),v.top),e.left=Math.max(Math.min(e.left,v.right-l.offsetWidth),v.left)}function a(){for(var e=0;e<m.children.length;++e)if("none"!=s.getComputedStyle(m.children[e]).display)return m.children[e]}var c,l=t[0],m=t[0].firstElementChild,u=m.getBoundingClientRect(),p=d[0].body,h=p.getBoundingClientRect(),f=s.getComputedStyle(m),g=o.target[0].querySelector($.buildSelector("md-menu-origin"))||o.target[0],b=g.getBoundingClientRect(),v={left:h.left+r,top:Math.max(h.top,0)+r,bottom:Math.max(h.bottom,Math.max(h.top,0)+h.height)-r,right:h.right-r},E={top:0,left:0,right:0,bottom:0},C={top:0,left:0,right:0,bottom:0},y=o.mdMenuCtrl.positionMode();"target"!=y.top&&"target"!=y.left&&"target-right"!=y.left||(c=a(),c&&(c=c.firstElementChild||c,c=c.querySelector($.buildSelector("md-menu-align-target"))||c,E=c.getBoundingClientRect(),C={top:parseFloat(l.style.top||0),left:parseFloat(l.style.left||0)}));var M={},T="top ";switch(y.top){case"target":M.top=C.top+b.top-E.top;break;case"cascade":M.top=b.top-parseFloat(f.paddingTop)-g.style.top;break;case"bottom":M.top=b.top+b.height;break;default:throw new Error('Invalid target mode "'+y.top+'" specified for md-menu on Y axis.')}var A="rtl"==e.bidi();switch(y.left){case"target":M.left=C.left+b.left-E.left,T+=A?"right":"left";break;case"target-left":M.left=b.left,T+="left";break;case"target-right":M.left=b.right-u.width+(u.right-E.right),T+="right";break;case"cascade":var w=A?b.left-u.width<v.left:b.right+u.width<v.right;M.left=w?b.right-g.style.left:b.left-g.style.left-u.width,T+=w?"left":"right";break;case"right":A?(M.left=b.right-b.width,T+="left"):(M.left=b.right-u.width,T+="right");break;case"left":A?(M.left=b.right-u.width,T+="right"):(M.left=b.left,T+="left");break;default:throw new Error('Invalid target mode "'+y.left+'" specified for md-menu on X axis.')}var k=o.mdMenuCtrl.offsets();M.top+=k.top,M.left+=k.left,i(M);var _=Math.round(100*Math.min(b.width/l.offsetWidth,1))/100,x=Math.round(100*Math.min(b.height/l.offsetHeight,1))/100;return{top:Math.round(M.top),left:Math.round(M.left),transform:o.alreadyOpen?n:e.supplant("scale({0},{1})",[_,x]),transformOrigin:T}}var $=e.prefixer(),C=e.dom.animator;return{parent:"body",onShow:f,onRemove:h,hasBackdrop:!0,disableParentScroll:!0,skipCompile:!0,preserveScope:!0,skipHide:!0,themable:!0}}function i(e){return e instanceof t.element&&(e=e[0]),e}var r=8;return o.$inject=["$mdUtil","$mdTheming","$mdConstant","$document","$window","$q","$$rAF","$animateCss","$animate"],e("$mdMenu").setDefaults({methods:["target"],options:o})}t.module("material.components.menu").provider("$mdMenu",e),e.$inject=["$$interimElementProvider"]}(),function(){function e(e,n,i,r,a,d,s,c){this.$element=i,this.$attrs=r,this.$mdConstant=a,this.$mdUtil=s,this.$document=d,this.$scope=e,this.$rootScope=n,this.$timeout=c;var l=this;t.forEach(o,function(e){l[e]=t.bind(l,l[e])})}t.module("material.components.menuBar").controller("MenuBarController",e);var o=["handleKeyDown","handleMenuHover","scheduleOpenHoveredMenu","cancelScheduledOpen"];e.$inject=["$scope","$rootScope","$element","$attrs","$mdConstant","$document","$mdUtil","$timeout"],e.prototype.init=function(){var e=this.$element,t=this.$mdUtil,o=this.$scope,i=this,r=[];e.on("keydown",this.handleKeyDown),this.parentToolbar=t.getClosest(e,"MD-TOOLBAR"),r.push(this.$rootScope.$on("$mdMenuOpen",function(t,n){i.getMenus().indexOf(n[0])!=-1&&(e[0].classList.add("md-open"),n[0].classList.add("md-open"),i.currentlyOpenMenu=n.controller("mdMenu"),i.currentlyOpenMenu.registerContainerProxy(i.handleKeyDown),i.enableOpenOnHover())})),r.push(this.$rootScope.$on("$mdMenuClose",function(o,r,a){var d=i.getMenus();if(d.indexOf(r[0])!=-1&&(e[0].classList.remove("md-open"),r[0].classList.remove("md-open")),e[0].contains(r[0])){for(var s=r[0];s&&d.indexOf(s)==-1;)s=t.getClosest(s,"MD-MENU",!0);s&&(a.skipFocus||s.querySelector("button:not([disabled])").focus(),i.currentlyOpenMenu=n,i.disableOpenOnHover(),i.setKeyboardMode(!0))}})),o.$on("$destroy",function(){for(;r.length;)r.shift()()}),this.setKeyboardMode(!0)},e.prototype.setKeyboardMode=function(e){e?this.$element[0].classList.add("md-keyboard-mode"):this.$element[0].classList.remove("md-keyboard-mode")},e.prototype.enableOpenOnHover=function(){if(!this.openOnHoverEnabled){this.openOnHoverEnabled=!0;var e;(e=this.parentToolbar)&&(e.dataset.mdRestoreStyle=e.getAttribute("style"),e.style.position="relative",e.style.zIndex=100),t.element(this.getMenus()).on("mouseenter",this.handleMenuHover)}},e.prototype.handleMenuHover=function(e){this.setKeyboardMode(!1),this.openOnHoverEnabled&&this.scheduleOpenHoveredMenu(e)},e.prototype.disableOpenOnHover=function(){if(this.openOnHoverEnabled){this.openOnHoverEnabled=!1;var e;(e=this.parentToolbar)&&(e.style.cssText=e.dataset.mdRestoreStyle||""),t.element(this.getMenus()).off("mouseenter",this.handleMenuHover)}},e.prototype.scheduleOpenHoveredMenu=function(e){var n=t.element(e.currentTarget),o=n.controller("mdMenu");this.setKeyboardMode(!1),this.scheduleOpenMenu(o)},e.prototype.scheduleOpenMenu=function(e){var t=this,o=this.$timeout;e!=t.currentlyOpenMenu&&(o.cancel(t.pendingMenuOpen),t.pendingMenuOpen=o(function(){t.pendingMenuOpen=n,t.currentlyOpenMenu&&t.currentlyOpenMenu.close(!0,{closeAll:!0}),e.open()},200,!1))},e.prototype.handleKeyDown=function(e){var n=this.$mdConstant.KEY_CODE,o=this.currentlyOpenMenu,i=o&&o.isOpen;this.setKeyboardMode(!0);var r,a,d;switch(e.keyCode){case n.DOWN_ARROW:o?o.focusMenuContainer():this.openFocusedMenu(),r=!0;break;case n.UP_ARROW:o&&o.close(),r=!0;break;case n.LEFT_ARROW:a=this.focusMenu(-1),i&&(d=t.element(a).controller("mdMenu"),this.scheduleOpenMenu(d)),r=!0;break;case n.RIGHT_ARROW:a=this.focusMenu(1),i&&(d=t.element(a).controller("mdMenu"),this.scheduleOpenMenu(d)),r=!0}r&&(e&&e.preventDefault&&e.preventDefault(),e&&e.stopImmediatePropagation&&e.stopImmediatePropagation())},e.prototype.focusMenu=function(e){var t=this.getMenus(),n=this.getFocusedMenuIndex();n==-1&&(n=this.getOpenMenuIndex());var o=!1;if(n==-1?(n=0,o=!0):(e<0&&n>0||e>0&&n<t.length-e)&&(n+=e,o=!0),o)return t[n].querySelector("button").focus(),t[n]},e.prototype.openFocusedMenu=function(){var e=this.getFocusedMenu();e&&t.element(e).controller("mdMenu").open()},e.prototype.getMenus=function(){var e=this.$element;return this.$mdUtil.nodesToArray(e[0].children).filter(function(e){return"MD-MENU"==e.nodeName})},e.prototype.getFocusedMenu=function(){return this.getMenus()[this.getFocusedMenuIndex()]},e.prototype.getFocusedMenuIndex=function(){var e=this.$mdUtil,t=e.getClosest(this.$document[0].activeElement,"MD-MENU");if(!t)return-1;var n=this.getMenus().indexOf(t);return n},e.prototype.getOpenMenuIndex=function(){for(var e=this.getMenus(),t=0;t<e.length;++t)if(e[t].classList.contains("md-open"))return t;return-1}}(),function(){function e(e,n){return{restrict:"E",require:"mdMenuBar",controller:"MenuBarController",compile:function(o,i){return i.ariaRole||o[0].setAttribute("role","menubar"),t.forEach(o[0].children,function(n){if("MD-MENU"==n.nodeName){n.hasAttribute("md-position-mode")||(n.setAttribute("md-position-mode","left bottom"),n.querySelector("button, a, md-button").setAttribute("role","menuitem"));var o=e.nodesToArray(n.querySelectorAll("md-menu-content"));t.forEach(o,function(e){e.classList.add("md-menu-bar-menu"),e.classList.add("md-dense"),e.hasAttribute("width")||e.setAttribute("width",5)})}}),o.find("md-menu-item").addClass("md-in-menu-bar"),function(e,t,o,i){t.addClass("_md"),n(e,t),i.init()}}}}t.module("material.components.menuBar").directive("mdMenuBar",e),e.$inject=["$mdUtil","$mdTheming"]}(),function(){function e(){return{restrict:"E",compile:function(e,t){t.role||e[0].setAttribute("role","separator")}}}t.module("material.components.menuBar").directive("mdMenuDivider",e)}(),function(){function e(e,t,n){this.$element=t,this.$attrs=n,this.$scope=e}t.module("material.components.menuBar").controller("MenuItemController",e),e.$inject=["$scope","$element","$attrs"],e.prototype.init=function(e){var t=this.$element,n=this.$attrs;this.ngModel=e,"checkbox"!=n.type&&"radio"!=n.type||(this.mode=n.type,this.iconEl=t[0].children[0],this.buttonEl=t[0].children[1],e&&this.initClickListeners())},e.prototype.clearNgAria=function(){var e=this.$element[0],n=["role","tabindex","aria-invalid","aria-checked"];t.forEach(n,function(t){e.removeAttribute(t)})},e.prototype.initClickListeners=function(){function e(){if("radio"==d){var e=a.ngValue?r.$eval(a.ngValue):a.value;return i.$modelValue==e;
}return i.$modelValue}function n(e){e?c.off("click",l):c.on("click",l)}var o=this,i=this.ngModel,r=this.$scope,a=this.$attrs,d=(this.$element,this.mode);this.handleClick=t.bind(this,this.handleClick);var s=this.iconEl,c=t.element(this.buttonEl),l=this.handleClick;a.$observe("disabled",n),n(a.disabled),i.$render=function(){o.clearNgAria(),e()?(s.style.display="",c.attr("aria-checked","true")):(s.style.display="none",c.attr("aria-checked","false"))},r.$$postDigest(i.$render)},e.prototype.handleClick=function(e){var t,n=this.mode,o=this.ngModel,i=this.$attrs;"checkbox"==n?t=!o.$modelValue:"radio"==n&&(t=i.ngValue?this.$scope.$eval(i.ngValue):i.value),o.$setViewValue(t),o.$render()}}(),function(){function e(e){return{controller:"MenuItemController",require:["mdMenuItem","?ngModel"],priority:210,compile:function(n,o){function i(e,o,i){i=i||n,i instanceof t.element&&(i=i[0]),i.hasAttribute(e)||i.setAttribute(e,o)}function r(o){var i=e.prefixer(o);t.forEach(i,function(e){if(n[0].hasAttribute(e)){var t=n[0].getAttribute(e);c[0].setAttribute(e,t),n[0].removeAttribute(e)}})}var a=o.type,d="md-in-menu-bar";if("checkbox"!=a&&"radio"!=a||!n.hasClass(d))i("role","menuitem",n[0].querySelector("md-button, button, a"));else{var s=n[0].textContent,c=t.element('<md-button type="button"></md-button>');c.html(s),c.attr("tabindex","0"),n.html(""),n.append(t.element('<md-icon md-svg-icon="check"></md-icon>')),n.append(c),n.addClass("md-indent").removeClass(d),i("role","checkbox"==a?"menuitemcheckbox":"menuitemradio",c),r("ng-disabled")}return function(e,t,n,o){var i=o[0],r=o[1];i.init(r)}}}}t.module("material.components.menuBar").directive("mdMenuItem",e),e.$inject=["$mdUtil"]}(),function(){function e(e,n,o,i,r,a){function d(a,d,c){function f(t,o,r,d,c){var l=++N,h=i.now(),f=o-t,g=m(a.mdDiameter),b=g-u(g),v=r||n.easeFn,E=d||n.duration;o===t?k.attr("d",s(o,g,b,c)):M=p(function $(n){var o=e.Math.max(0,e.Math.min((n||i.now())-h,E));k.attr("d",s(v(o,t,f,E),g,b,c)),l===N&&o<E&&(M=p($))})}function $(){f(_,x,n.easeFnIndeterminate,n.durationIndeterminate,S),S=(S+x)%100;var e=_;_=-x,x=-e}function C(){T||(T=r($,n.durationIndeterminate+50,0,!1),$(),d.addClass(E).removeAttr("aria-valuenow"))}function y(){T&&(r.cancel(T),T=null,d.removeClass(E))}var M,T,A=d[0],w=t.element(A.querySelector("svg")),k=t.element(A.querySelector("path")),_=n.startIndeterminate,x=n.endIndeterminate,S=0,N=0;o(d),d.toggleClass(v,c.hasOwnProperty("disabled")),a.mdMode===b&&C(),a.$on("$destroy",function(){y(),M&&h(M)}),a.$watchGroup(["value","mdMode",function(){var e=A.disabled;return e===!0||e===!1?e:t.isDefined(d.attr("disabled"))}],function(e,t){var n=e[1],o=e[2],i=t[2];if(o!==i&&d.toggleClass(v,!!o),o)y();else if(n!==g&&n!==b&&(n=b,c.$set("mdMode",n)),n===b)C();else{var r=l(e[0]);y(),d.attr("aria-valuenow",r),f(l(t[0]),r)}}),a.$watch("mdDiameter",function(e){var t=m(e),n=u(t),o=t/2+"px",i={width:t+"px",height:t+"px"};w[0].setAttribute("viewBox","0 0 "+t+" "+t),w.css(i).css("transform-origin",o+" "+o+" "+o),d.css(i),k.css("stroke-width",n+"px")})}function s(e,t,n,o){var i,r=3.5999,a=o||0,d=t/2,s=n/2,l=a*r,m=e*r,u=c(d,s,l),p=c(d,s,m+l),h=m<0?0:1;return i=m<0?m>=-180?0:1:m<=180?0:1,"M"+u+"A"+s+","+s+" 0 "+i+","+h+" "+p}function c(t,n,o){var i=(o-90)*f;return t+n*e.Math.cos(i)+","+(t+n*e.Math.sin(i))}function l(t){return e.Math.max(0,e.Math.min(t||0,100))}function m(e){var t=n.progressSize;if(e){var o=parseFloat(e);return e.lastIndexOf("%")===e.length-1&&(o=o/100*t),o}return t}function u(e){return n.strokeWidth/100*e}var p=e.requestAnimationFrame||t.noop,h=e.cancelAnimationFrame||t.noop,f=e.Math.PI/180,g="determinate",b="indeterminate",v="_md-progress-circular-disabled",E="md-mode-indeterminate";return{restrict:"E",scope:{value:"@",mdDiameter:"@",mdMode:"@"},template:'<svg xmlns="http://www.w3.org/2000/svg"><path fill="none"/></svg>',compile:function(e,n){if(e.attr({"aria-valuemin":0,"aria-valuemax":100,role:"progressbar"}),t.isUndefined(n.mdMode)){var o=t.isDefined(n.value),i=o?g:b;n.$set("mdMode",i)}else n.$set("mdMode",n.mdMode.trim());return d}}}t.module("material.components.progressCircular").directive("mdProgressCircular",e),e.$inject=["$window","$mdProgressCircular","$mdTheming","$mdUtil","$interval","$log"]}(),function(){function e(){function e(e,t,n,o){return n*e/o+t}function n(e,t,n,o){var i=(e/=o)*e,r=i*e;return t+n*(6*r*i+-15*i*i+10*r)}var o={progressSize:50,strokeWidth:10,duration:100,easeFn:e,durationIndeterminate:500,startIndeterminate:3,endIndeterminate:80,easeFnIndeterminate:n,easingPresets:{linearEase:e,materialEase:n}};return{configure:function(e){return o=t.extend(o,e||{})},$get:function(){return o}}}t.module("material.components.progressCircular").provider("$mdProgressCircular",e)}(),function(){function e(){function e(e,o,i,r){if(r){var a=r.getTabElementIndex(o),d=n(o,"md-tab-body").remove(),s=n(o,"md-tab-label").remove(),c=r.insertTab({scope:e,parent:e.$parent,index:a,element:o,template:d.html(),label:s.html()},a);e.select=e.select||t.noop,e.deselect=e.deselect||t.noop,e.$watch("active",function(e){e&&r.select(c.getIndex(),!0)}),e.$watch("disabled",function(){r.refreshIndex()}),e.$watch(function(){return r.getTabElementIndex(o)},function(e){c.index=e,r.updateTabOrder()}),e.$on("$destroy",function(){r.removeTab(c)})}}function n(e,n){for(var o=e[0].children,i=0,r=o.length;i<r;i++){var a=o[i];if(a.tagName===n.toUpperCase())return t.element(a)}return t.element()}return{require:"^?mdTabs",terminal:!0,compile:function(o,i){var r=n(o,"md-tab-label"),a=n(o,"md-tab-body");if(0==r.length&&(r=t.element("<md-tab-label></md-tab-label>"),i.label?r.text(i.label):r.append(o.contents()),0==a.length)){var d=o.contents().detach();a=t.element("<md-tab-body></md-tab-body>"),a.append(d)}return o.append(r),a.html()&&o.append(a),e},scope:{active:"=?mdActive",disabled:"=?ngDisabled",select:"&?mdOnSelect",deselect:"&?mdOnDeselect"}}}t.module("material.components.tabs").directive("mdTab",e)}(),function(){function e(){return{require:"^?mdTabs",link:function(e,t,n,o){o&&o.attachRipple(e,t)}}}t.module("material.components.tabs").directive("mdTabItem",e)}(),function(){function e(){return{terminal:!0}}t.module("material.components.tabs").directive("mdTabLabel",e)}(),function(){function e(e){return{restrict:"A",compile:function(t,n){var o=e(n.mdTabScroll,null,!0);return function(e,t){t.on("mousewheel",function(t){e.$apply(function(){o(e,{$event:t})})})}}}}t.module("material.components.tabs").directive("mdTabScroll",e),e.$inject=["$parse"]}(),function(){function e(e,o,i,r,a,d,s,c,l,m){function u(){le.selectedIndex=le.selectedIndex||0,p(),f(),h(),m(o),d.nextTick(function(){ue=F(),re(),te(),ae(),le.tabs[le.selectedIndex]&&le.tabs[le.selectedIndex].scope.select(),fe=!0,Y()})}function p(){var e=c.$mdTabsTemplate,n=t.element(o[0].querySelector("md-tab-data"));n.html(e),l(n.contents())(le.parent),delete c.$mdTabsTemplate}function h(){t.element(i).on("resize",I),e.$on("$destroy",v)}function f(){e.$watch("$mdTabsCtrl.selectedIndex",w)}function g(e,t){var n=c.$normalize("md-"+e);t&&V(e,t),c.$observe(n,function(t){le[e]=t})}function b(e,t){function n(t){le[e]="false"!==t}var o=c.$normalize("md-"+e);t&&V(e,t),c.hasOwnProperty(o)&&n(c[o]),c.$observe(o,n)}function v(){he=!0,t.element(i).off("resize",I)}function E(e){var n=F();t.element(n.wrapper).toggleClass("md-stretch-tabs",j()),ae()}function $(e){le.shouldCenterTabs=q()}function C(e,n){if(e!==n){var o=F();t.forEach(o.tabs,function(t){t.style.maxWidth=e+"px"}),d.nextTick(le.updateInkBarStyles)}}function y(e,t){e!==t&&(le.maxTabWidth=Q(),le.shouldCenterTabs=q(),d.nextTick(function(){le.maxTabWidth=Q(),te(le.selectedIndex)}))}function M(e){o[e?"removeClass":"addClass"]("md-no-tab-content")}function T(n){var o=F(),i=le.shouldCenterTabs?"":"-"+n+"px";t.element(o.paging).css(r.CSS.TRANSFORM,"translate3d("+i+", 0, 0)"),e.$broadcast("$mdTabsPaginationChanged")}function A(e,t){e!==t&&F().tabs[e]&&(te(),ee())}function w(t,n){t!==n&&(le.selectedIndex=W(t),le.lastSelectedIndex=n,le.updateInkBarStyles(),re(),te(t),e.$broadcast("$mdTabsChanged"),le.tabs[n]&&le.tabs[n].scope.deselect(),le.tabs[t]&&le.tabs[t].scope.select())}function k(e){var t=o[0].getElementsByTagName("md-tab");return Array.prototype.indexOf.call(t,e[0])}function _(){_.watcher||(_.watcher=e.$watch(function(){d.nextTick(function(){_.watcher&&o.prop("offsetParent")&&(_.watcher(),_.watcher=null,I())},!1)}))}function x(e){switch(e.keyCode){case r.KEY_CODE.LEFT_ARROW:e.preventDefault(),J(-1,!0);break;case r.KEY_CODE.RIGHT_ARROW:e.preventDefault(),J(1,!0);break;case r.KEY_CODE.SPACE:case r.KEY_CODE.ENTER:e.preventDefault(),me||S(le.focusIndex)}le.lastClick=!1}function S(e,t){me||(le.focusIndex=le.selectedIndex=e),le.lastClick=!0,t&&le.noSelectClick||d.nextTick(function(){le.tabs[e].element.triggerHandler("click")},!1)}function N(e){le.shouldPaginate&&(e.preventDefault(),le.offsetLeft=se(le.offsetLeft-e.wheelDelta))}function D(){var e,t,n=F(),o=n.canvas.clientWidth,i=o+le.offsetLeft;for(e=0;e<n.tabs.length&&(t=n.tabs[e],!(t.offsetLeft+t.offsetWidth>i));e++);le.offsetLeft=se(t.offsetLeft)}function H(){var e,t,n=F();for(e=0;e<n.tabs.length&&(t=n.tabs[e],!(t.offsetLeft+t.offsetWidth>=le.offsetLeft));e++);le.offsetLeft=se(t.offsetLeft+t.offsetWidth-n.canvas.clientWidth)}function I(){le.lastSelectedIndex=le.selectedIndex,le.offsetLeft=se(le.offsetLeft),d.nextTick(function(){le.updateInkBarStyles(),Y()})}function O(e){t.element(F().inkBar).toggleClass("ng-hide",e)}function R(e){o.toggleClass("md-dynamic-height",e)}function L(e){if(!he){var t=le.selectedIndex,n=le.tabs.splice(e.getIndex(),1)[0];ie(),le.selectedIndex===t&&(n.scope.deselect(),le.tabs[le.selectedIndex]&&le.tabs[le.selectedIndex].scope.select()),d.nextTick(function(){Y(),le.offsetLeft=se(le.offsetLeft)})}}function P(e,n){var o=fe,i={getIndex:function(){return le.tabs.indexOf(r)},isActive:function(){return this.getIndex()===le.selectedIndex},isLeft:function(){return this.getIndex()<le.selectedIndex},isRight:function(){return this.getIndex()>le.selectedIndex},shouldRender:function(){return!le.noDisconnect||this.isActive()},hasFocus:function(){return!le.lastClick&&le.hasFocus&&this.getIndex()===le.focusIndex},id:d.nextUid()},r=t.extend(i,e);return t.isDefined(n)?le.tabs.splice(n,0,r):le.tabs.push(r),ne(),oe(),d.nextTick(function(){Y(),o&&le.autoselect&&d.nextTick(function(){d.nextTick(function(){S(le.tabs.indexOf(r))})})}),r}function F(){var e={},t=o[0];return e.wrapper=t.querySelector("md-tabs-wrapper"),e.canvas=e.wrapper.querySelector("md-tabs-canvas"),e.paging=e.canvas.querySelector("md-pagination-wrapper"),e.inkBar=e.paging.querySelector("md-ink-bar"),e.contents=t.querySelectorAll("md-tabs-content-wrapper > md-tab-content"),e.tabs=e.paging.querySelectorAll("md-tab-item"),e.dummies=e.canvas.querySelectorAll("md-dummy-tab"),e}function B(){return le.offsetLeft>0}function U(){var e=F(),t=e.tabs[e.tabs.length-1];return t&&t.offsetLeft+t.offsetWidth>e.canvas.clientWidth+le.offsetLeft}function j(){switch(le.stretchTabs){case"always":return!0;case"never":return!1;default:return!le.shouldPaginate&&i.matchMedia("(max-width: 600px)").matches}}function q(){return le.centerTabs&&!le.shouldPaginate}function z(){if(le.noPagination||!fe)return!1;var e=o.prop("clientWidth");return t.forEach(F().dummies,function(t){e-=t.offsetWidth}),e<0}function W(e){if(e===-1)return-1;var t,n,o=Math.max(le.tabs.length-e,e);for(t=0;t<=o;t++){if(n=le.tabs[e+t],n&&n.scope.disabled!==!0)return n.getIndex();if(n=le.tabs[e-t],n&&n.scope.disabled!==!0)return n.getIndex()}return e}function V(e,t,n){Object.defineProperty(le,e,{get:function(){return n},set:function(e){var o=n;n=e,t&&t(e,o)}})}function Y(){K(),le.maxTabWidth=Q(),le.shouldPaginate=z()}function K(){var e=F();j()?t.element(e.paging).css("width",""):t.element(e.paging).css("width",G()+"px")}function G(){return X(F().dummies)}function X(e){var n=0;return t.forEach(e,function(e){n+=Math.max(e.offsetWidth,e.getBoundingClientRect().width)}),Math.ceil(n)}function Q(){return o.prop("clientWidth")}function Z(){var e=le.tabs[le.selectedIndex],t=le.tabs[le.focusIndex];le.tabs=le.tabs.sort(function(e,t){return e.index-t.index}),le.selectedIndex=le.tabs.indexOf(e),le.focusIndex=le.tabs.indexOf(t)}function J(e,t){var n,o=t?"focusIndex":"selectedIndex",i=le[o];for(n=i+e;le.tabs[n]&&le.tabs[n].scope.disabled;n+=e);le.tabs[n]&&(le[o]=n)}function ee(){F().dummies[le.focusIndex].focus()}function te(e){var t=F();if(null==e&&(e=le.focusIndex),t.tabs[e]&&!le.shouldCenterTabs){var n=t.tabs[e],o=n.offsetLeft,i=n.offsetWidth+o;le.offsetLeft=Math.max(le.offsetLeft,se(i-t.canvas.clientWidth+64)),le.offsetLeft=Math.min(le.offsetLeft,se(o))}}function ne(){pe.forEach(function(e){d.nextTick(e)}),pe=[]}function oe(){var e=!1;t.forEach(le.tabs,function(t){t.template&&(e=!0)}),le.hasContent=e}function ie(){le.selectedIndex=W(le.selectedIndex),le.focusIndex=W(le.focusIndex)}function re(){if(!le.dynamicHeight)return o.css("height","");if(!le.tabs.length)return pe.push(re);var e=F(),t=e.contents[le.selectedIndex],i=t?t.offsetHeight:0,r=e.wrapper.offsetHeight,a=i+r,c=o.prop("clientHeight");if(c!==a){"bottom"===o.attr("md-align-tabs")&&(c-=r,a-=r,o.attr("md-border-bottom")!==n&&++c),me=!0;var l={height:c+"px"},m={height:a+"px"};o.css(l),s(o,{from:l,to:m,easing:"cubic-bezier(0.35, 0, 0.25, 1)",duration:.5}).start().done(function(){o.css({transition:"none",height:""}),d.nextTick(function(){o.css("transition","")}),me=!1})}}function ae(){var e=F();if(!e.tabs[le.selectedIndex])return void t.element(e.inkBar).css({left:"auto",right:"auto"});if(!le.tabs.length)return pe.push(le.updateInkBarStyles);if(!o.prop("offsetParent"))return _();var n=le.selectedIndex,i=e.paging.offsetWidth,r=e.tabs[n],a=r.offsetLeft,s=i-a-r.offsetWidth;if(le.shouldCenterTabs){var c=X(e.tabs);i>c&&d.nextTick(ae,!1)}de(),t.element(e.inkBar).css({left:a+"px",right:s+"px"})}function de(){var e=F(),n=le.selectedIndex,o=le.lastSelectedIndex,i=t.element(e.inkBar);t.isNumber(o)&&i.toggleClass("md-left",n<o).toggleClass("md-right",n>o)}function se(e){var t=F();if(!t.tabs.length||!le.shouldPaginate)return 0;var n=t.tabs[t.tabs.length-1],o=n.offsetLeft+n.offsetWidth;return e=Math.max(0,e),e=Math.min(o-t.canvas.clientWidth,e)}function ce(e,n){var o=F(),i={colorElement:t.element(o.inkBar)};a.attach(e,n,i)}var le=this,me=!1,ue=F(),pe=[],he=!1,fe=!1;g("stretchTabs",E),V("focusIndex",A,le.selectedIndex||0),V("offsetLeft",T,0),V("hasContent",M,!1),V("maxTabWidth",C,Q()),V("shouldPaginate",y,!1),b("noInkBar",O),b("dynamicHeight",R),b("noPagination"),b("swipeContent"),b("noDisconnect"),b("autoselect"),b("noSelectClick"),b("centerTabs",$,!1),b("enableDisconnect"),le.scope=e,le.parent=e.$parent,le.tabs=[],le.lastSelectedIndex=null,le.hasFocus=!1,le.lastClick=!0,le.shouldCenterTabs=q(),le.updatePagination=d.debounce(Y,100),le.redirectFocus=ee,le.attachRipple=ce,le.insertTab=P,le.removeTab=L,le.select=S,le.scroll=N,le.nextPage=D,le.previousPage=H,le.keydown=x,le.canPageForward=U,le.canPageBack=B,le.refreshIndex=ie,le.incrementIndex=J,le.getTabElementIndex=k,le.updateInkBarStyles=d.debounce(ae,100),le.updateTabOrder=d.debounce(Z,100),u()}t.module("material.components.tabs").controller("MdTabsController",e),e.$inject=["$scope","$element","$window","$mdConstant","$mdTabInkRipple","$mdUtil","$animateCss","$attrs","$compile","$mdTheming"]}(),function(){function e(e){return{scope:{selectedIndex:"=?mdSelected"},template:function(t,n){return n.$mdTabsTemplate=t.html(),'<md-tabs-wrapper> <md-tab-data></md-tab-data> <md-prev-button tabindex="-1" role="button" aria-label="Previous Page" aria-disabled="{{!$mdTabsCtrl.canPageBack()}}" ng-class="{ \'md-disabled\': !$mdTabsCtrl.canPageBack() }" ng-if="$mdTabsCtrl.shouldPaginate" ng-click="$mdTabsCtrl.previousPage()"> <md-icon md-svg-src="'+e.mdTabsArrow+'"></md-icon> </md-prev-button> <md-next-button tabindex="-1" role="button" aria-label="Next Page" aria-disabled="{{!$mdTabsCtrl.canPageForward()}}" ng-class="{ \'md-disabled\': !$mdTabsCtrl.canPageForward() }" ng-if="$mdTabsCtrl.shouldPaginate" ng-click="$mdTabsCtrl.nextPage()"> <md-icon md-svg-src="'+e.mdTabsArrow+'"></md-icon> </md-next-button> <md-tabs-canvas tabindex="{{ $mdTabsCtrl.hasFocus ? -1 : 0 }}" aria-activedescendant="tab-item-{{$mdTabsCtrl.tabs[$mdTabsCtrl.focusIndex].id}}" ng-focus="$mdTabsCtrl.redirectFocus()" ng-class="{ \'md-paginated\': $mdTabsCtrl.shouldPaginate, \'md-center-tabs\': $mdTabsCtrl.shouldCenterTabs }" ng-keydown="$mdTabsCtrl.keydown($event)" role="tablist"> <md-pagination-wrapper ng-class="{ \'md-center-tabs\': $mdTabsCtrl.shouldCenterTabs }" md-tab-scroll="$mdTabsCtrl.scroll($event)"> <md-tab-item tabindex="-1" class="md-tab" ng-repeat="tab in $mdTabsCtrl.tabs" role="tab" aria-controls="tab-content-{{::tab.id}}" aria-selected="{{tab.isActive()}}" aria-disabled="{{tab.scope.disabled || \'false\'}}" ng-click="$mdTabsCtrl.select(tab.getIndex())" ng-class="{ \'md-active\':    tab.isActive(), \'md-focused\':   tab.hasFocus(), \'md-disabled\':  tab.scope.disabled }" ng-disabled="tab.scope.disabled" md-swipe-left="$mdTabsCtrl.nextPage()" md-swipe-right="$mdTabsCtrl.previousPage()" md-tabs-template="::tab.label" md-scope="::tab.parent"></md-tab-item> <md-ink-bar></md-ink-bar> </md-pagination-wrapper> <md-tabs-dummy-wrapper class="md-visually-hidden md-dummy-wrapper"> <md-dummy-tab class="md-tab" tabindex="-1" id="tab-item-{{::tab.id}}" role="tab" aria-controls="tab-content-{{::tab.id}}" aria-selected="{{tab.isActive()}}" aria-disabled="{{tab.scope.disabled || \'false\'}}" ng-focus="$mdTabsCtrl.hasFocus = true" ng-blur="$mdTabsCtrl.hasFocus = false" ng-repeat="tab in $mdTabsCtrl.tabs" md-tabs-template="::tab.label" md-scope="::tab.parent"></md-dummy-tab> </md-tabs-dummy-wrapper> </md-tabs-canvas> </md-tabs-wrapper> <md-tabs-content-wrapper ng-show="$mdTabsCtrl.hasContent && $mdTabsCtrl.selectedIndex >= 0" class="_md"> <md-tab-content id="tab-content-{{::tab.id}}" class="_md" role="tabpanel" aria-labelledby="tab-item-{{::tab.id}}" md-swipe-left="$mdTabsCtrl.swipeContent && $mdTabsCtrl.incrementIndex(1)" md-swipe-right="$mdTabsCtrl.swipeContent && $mdTabsCtrl.incrementIndex(-1)" ng-if="$mdTabsCtrl.hasContent" ng-repeat="(index, tab) in $mdTabsCtrl.tabs" ng-class="{ \'md-no-transition\': $mdTabsCtrl.lastSelectedIndex == null, \'md-active\':        tab.isActive(), \'md-left\':          tab.isLeft(), \'md-right\':         tab.isRight(), \'md-no-scroll\':     $mdTabsCtrl.dynamicHeight }"> <div md-tabs-template="::tab.template" md-connected-if="tab.isActive()" md-scope="::tab.parent" ng-if="$mdTabsCtrl.enableDisconnect || tab.shouldRender()"></div> </md-tab-content> </md-tabs-content-wrapper>'},controller:"MdTabsController",controllerAs:"$mdTabsCtrl",bindToController:!0}}t.module("material.components.tabs").directive("mdTabs",e),e.$inject=["$$mdSvgRegistry"]}(),function(){function e(e){return{require:"^?mdTabs",link:function(e,t,n,o){if(o){var i=new MutationObserver(function(e){o.updatePagination(),o.updateInkBarStyles()}),r={childList:!0,subtree:!0,characterData:!0};i.observe(t[0],r),e.$on("$destroy",function(){i&&i.disconnect()})}}}}t.module("material.components.tabs").directive("mdTabsDummyWrapper",e),e.$inject=["$mdUtil"]}(),function(){function e(e,t){function n(n,o,i,r){function a(){n.$watch("connected",function(e){e===!1?d():s()}),n.$on("$destroy",s)}function d(){r.enableDisconnect&&t.disconnectScope(c)}function s(){r.enableDisconnect&&t.reconnectScope(c)}if(r){var c=r.enableDisconnect?n.compileScope.$new():n.compileScope;return o.html(n.template),e(o.contents())(c),t.nextTick(a)}}return{restrict:"A",link:n,scope:{template:"=mdTabsTemplate",connected:"=?mdConnectedIf",compileScope:"=mdScope"},require:"^?mdTabs"}}t.module("material.components.tabs").directive("mdTabsTemplate",e),e.$inject=["$compile","$mdUtil"]}(),function(){t.module("material.core").constant("$MD_THEME_CSS","md-autocomplete.md-THEME_NAME-theme {  background: '{{background-A100}}'; }  md-autocomplete.md-THEME_NAME-theme[disabled]:not([md-floating-label]) {    background: '{{background-100}}'; }  md-autocomplete.md-THEME_NAME-theme button md-icon path {    fill: '{{background-600}}'; }  md-autocomplete.md-THEME_NAME-theme button:after {    background: '{{background-600-0.3}}'; }.md-autocomplete-suggestions-container.md-THEME_NAME-theme {  background: '{{background-A100}}'; }  .md-autocomplete-suggestions-container.md-THEME_NAME-theme li {    color: '{{background-900}}'; }    .md-autocomplete-suggestions-container.md-THEME_NAME-theme li .highlight {      color: '{{background-600}}'; }    .md-autocomplete-suggestions-container.md-THEME_NAME-theme li:hover, .md-autocomplete-suggestions-container.md-THEME_NAME-theme li.selected {      background: '{{background-200}}'; }md-backdrop {  background-color: '{{background-900-0.0}}'; }  md-backdrop.md-opaque.md-THEME_NAME-theme {    background-color: '{{background-900-1.0}}'; }md-bottom-sheet.md-THEME_NAME-theme {  background-color: '{{background-50}}';  border-top-color: '{{background-300}}'; }  md-bottom-sheet.md-THEME_NAME-theme.md-list md-list-item {    color: '{{foreground-1}}'; }  md-bottom-sheet.md-THEME_NAME-theme .md-subheader {    background-color: '{{background-50}}'; }  md-bottom-sheet.md-THEME_NAME-theme .md-subheader {    color: '{{foreground-1}}'; }.md-button.md-THEME_NAME-theme:not([disabled]):hover {  background-color: '{{background-500-0.2}}'; }.md-button.md-THEME_NAME-theme:not([disabled]).md-focused {  background-color: '{{background-500-0.2}}'; }.md-button.md-THEME_NAME-theme:not([disabled]).md-icon-button:hover {  background-color: transparent; }.md-button.md-THEME_NAME-theme.md-fab {  background-color: '{{accent-color}}';  color: '{{accent-contrast}}'; }  .md-button.md-THEME_NAME-theme.md-fab md-icon {    color: '{{accent-contrast}}'; }  .md-button.md-THEME_NAME-theme.md-fab:not([disabled]):hover {    background-color: '{{accent-A700}}'; }  .md-button.md-THEME_NAME-theme.md-fab:not([disabled]).md-focused {    background-color: '{{accent-A700}}'; }.md-button.md-THEME_NAME-theme.md-primary {  color: '{{primary-color}}'; }  .md-button.md-THEME_NAME-theme.md-primary.md-raised, .md-button.md-THEME_NAME-theme.md-primary.md-fab {    color: '{{primary-contrast}}';    background-color: '{{primary-color}}'; }    .md-button.md-THEME_NAME-theme.md-primary.md-raised:not([disabled]) md-icon, .md-button.md-THEME_NAME-theme.md-primary.md-fab:not([disabled]) md-icon {      color: '{{primary-contrast}}'; }    .md-button.md-THEME_NAME-theme.md-primary.md-raised:not([disabled]):hover, .md-button.md-THEME_NAME-theme.md-primary.md-fab:not([disabled]):hover {      background-color: '{{primary-600}}'; }    .md-button.md-THEME_NAME-theme.md-primary.md-raised:not([disabled]).md-focused, .md-button.md-THEME_NAME-theme.md-primary.md-fab:not([disabled]).md-focused {      background-color: '{{primary-600}}'; }  .md-button.md-THEME_NAME-theme.md-primary:not([disabled]) md-icon {    color: '{{primary-color}}'; }.md-button.md-THEME_NAME-theme.md-fab {  background-color: '{{accent-color}}';  color: '{{accent-contrast}}'; }  .md-button.md-THEME_NAME-theme.md-fab:not([disabled]) .md-icon {    color: '{{accent-contrast}}'; }  .md-button.md-THEME_NAME-theme.md-fab:not([disabled]):hover {    background-color: '{{accent-A700}}'; }  .md-button.md-THEME_NAME-theme.md-fab:not([disabled]).md-focused {    background-color: '{{accent-A700}}'; }.md-button.md-THEME_NAME-theme.md-raised {  color: '{{background-900}}';  background-color: '{{background-50}}'; }  .md-button.md-THEME_NAME-theme.md-raised:not([disabled]) md-icon {    color: '{{background-900}}'; }  .md-button.md-THEME_NAME-theme.md-raised:not([disabled]):hover {    background-color: '{{background-50}}'; }  .md-button.md-THEME_NAME-theme.md-raised:not([disabled]).md-focused {    background-color: '{{background-200}}'; }.md-button.md-THEME_NAME-theme.md-warn {  color: '{{warn-color}}'; }  .md-button.md-THEME_NAME-theme.md-warn.md-raised, .md-button.md-THEME_NAME-theme.md-warn.md-fab {    color: '{{warn-contrast}}';    background-color: '{{warn-color}}'; }    .md-button.md-THEME_NAME-theme.md-warn.md-raised:not([disabled]) md-icon, .md-button.md-THEME_NAME-theme.md-warn.md-fab:not([disabled]) md-icon {      color: '{{warn-contrast}}'; }    .md-button.md-THEME_NAME-theme.md-warn.md-raised:not([disabled]):hover, .md-button.md-THEME_NAME-theme.md-warn.md-fab:not([disabled]):hover {      background-color: '{{warn-600}}'; }    .md-button.md-THEME_NAME-theme.md-warn.md-raised:not([disabled]).md-focused, .md-button.md-THEME_NAME-theme.md-warn.md-fab:not([disabled]).md-focused {      background-color: '{{warn-600}}'; }  .md-button.md-THEME_NAME-theme.md-warn:not([disabled]) md-icon {    color: '{{warn-color}}'; }.md-button.md-THEME_NAME-theme.md-accent {  color: '{{accent-color}}'; }  .md-button.md-THEME_NAME-theme.md-accent.md-raised, .md-button.md-THEME_NAME-theme.md-accent.md-fab {    color: '{{accent-contrast}}';    background-color: '{{accent-color}}'; }    .md-button.md-THEME_NAME-theme.md-accent.md-raised:not([disabled]) md-icon, .md-button.md-THEME_NAME-theme.md-accent.md-fab:not([disabled]) md-icon {      color: '{{accent-contrast}}'; }    .md-button.md-THEME_NAME-theme.md-accent.md-raised:not([disabled]):hover, .md-button.md-THEME_NAME-theme.md-accent.md-fab:not([disabled]):hover {      background-color: '{{accent-A700}}'; }    .md-button.md-THEME_NAME-theme.md-accent.md-raised:not([disabled]).md-focused, .md-button.md-THEME_NAME-theme.md-accent.md-fab:not([disabled]).md-focused {      background-color: '{{accent-A700}}'; }  .md-button.md-THEME_NAME-theme.md-accent:not([disabled]) md-icon {    color: '{{accent-color}}'; }.md-button.md-THEME_NAME-theme[disabled], .md-button.md-THEME_NAME-theme.md-raised[disabled], .md-button.md-THEME_NAME-theme.md-fab[disabled], .md-button.md-THEME_NAME-theme.md-accent[disabled], .md-button.md-THEME_NAME-theme.md-warn[disabled] {  color: '{{foreground-3}}';  cursor: default; }  .md-button.md-THEME_NAME-theme[disabled] md-icon, .md-button.md-THEME_NAME-theme.md-raised[disabled] md-icon, .md-button.md-THEME_NAME-theme.md-fab[disabled] md-icon, .md-button.md-THEME_NAME-theme.md-accent[disabled] md-icon, .md-button.md-THEME_NAME-theme.md-warn[disabled] md-icon {    color: '{{foreground-3}}'; }.md-button.md-THEME_NAME-theme.md-raised[disabled], .md-button.md-THEME_NAME-theme.md-fab[disabled] {  background-color: '{{foreground-4}}'; }.md-button.md-THEME_NAME-theme[disabled] {  background-color: transparent; }._md a.md-THEME_NAME-theme:not(.md-button).md-primary {  color: '{{primary-color}}'; }  ._md a.md-THEME_NAME-theme:not(.md-button).md-primary:hover {    color: '{{primary-700}}'; }._md a.md-THEME_NAME-theme:not(.md-button).md-accent {  color: '{{accent-color}}'; }  ._md a.md-THEME_NAME-theme:not(.md-button).md-accent:hover {    color: '{{accent-700}}'; }._md a.md-THEME_NAME-theme:not(.md-button).md-accent {  color: '{{accent-color}}'; }  ._md a.md-THEME_NAME-theme:not(.md-button).md-accent:hover {    color: '{{accent-A700}}'; }._md a.md-THEME_NAME-theme:not(.md-button).md-warn {  color: '{{warn-color}}'; }  ._md a.md-THEME_NAME-theme:not(.md-button).md-warn:hover {    color: '{{warn-700}}'; }md-card.md-THEME_NAME-theme {  color: '{{foreground-1}}';  background-color: '{{background-hue-1}}';  border-radius: 2px; }  md-card.md-THEME_NAME-theme .md-card-image {    border-radius: 2px 2px 0 0; }  md-card.md-THEME_NAME-theme md-card-header md-card-avatar md-icon {    color: '{{background-color}}';    background-color: '{{foreground-3}}'; }  md-card.md-THEME_NAME-theme md-card-header md-card-header-text .md-subhead {    color: '{{foreground-2}}'; }  md-card.md-THEME_NAME-theme md-card-title md-card-title-text:not(:only-child) .md-subhead {    color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme .md-ripple {  color: '{{accent-A700}}'; }md-checkbox.md-THEME_NAME-theme.md-checked .md-ripple {  color: '{{background-600}}'; }md-checkbox.md-THEME_NAME-theme.md-checked.md-focused .md-container:before {  background-color: '{{accent-color-0.26}}'; }md-checkbox.md-THEME_NAME-theme .md-ink-ripple {  color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme.md-checked .md-ink-ripple {  color: '{{accent-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not(.md-checked) .md-icon {  border-color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme.md-checked .md-icon {  background-color: '{{accent-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme.md-checked .md-icon:after {  border-color: '{{accent-contrast-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary .md-ripple {  color: '{{primary-600}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-ripple {  color: '{{background-600}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary .md-ink-ripple {  color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-ink-ripple {  color: '{{primary-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary:not(.md-checked) .md-icon {  border-color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-icon {  background-color: '{{primary-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked.md-focused .md-container:before {  background-color: '{{primary-color-0.26}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-icon:after {  border-color: '{{primary-contrast-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-primary .md-indeterminate[disabled] .md-container {  color: '{{foreground-3}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn .md-ripple {  color: '{{warn-600}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn .md-ink-ripple {  color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-ink-ripple {  color: '{{warn-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn:not(.md-checked) .md-icon {  border-color: '{{foreground-2}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-icon {  background-color: '{{warn-color-0.87}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked.md-focused:not([disabled]) .md-container:before {  background-color: '{{warn-color-0.26}}'; }md-checkbox.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-icon:after {  border-color: '{{background-200}}'; }md-checkbox.md-THEME_NAME-theme[disabled]:not(.md-checked) .md-icon {  border-color: '{{foreground-3}}'; }md-checkbox.md-THEME_NAME-theme[disabled].md-checked .md-icon {  background-color: '{{foreground-3}}'; }md-checkbox.md-THEME_NAME-theme[disabled].md-checked .md-icon:after {  border-color: '{{background-200}}'; }md-checkbox.md-THEME_NAME-theme[disabled] .md-icon:after {  border-color: '{{foreground-3}}'; }md-checkbox.md-THEME_NAME-theme[disabled] .md-label {  color: '{{foreground-3}}'; }md-chips.md-THEME_NAME-theme .md-chips {  box-shadow: 0 1px '{{foreground-4}}'; }  md-chips.md-THEME_NAME-theme .md-chips.md-focused {    box-shadow: 0 2px '{{primary-color}}'; }  md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input {    color: '{{foreground-1}}'; }    md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input::-webkit-input-placeholder {      color: '{{foreground-3}}'; }    md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input:-moz-placeholder {      color: '{{foreground-3}}'; }    md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input::-moz-placeholder {      color: '{{foreground-3}}'; }    md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input:-ms-input-placeholder {      color: '{{foreground-3}}'; }    md-chips.md-THEME_NAME-theme .md-chips .md-chip-input-container input::-webkit-input-placeholder {      color: '{{foreground-3}}'; }md-chips.md-THEME_NAME-theme md-chip {  background: '{{background-300}}';  color: '{{background-800}}'; }  md-chips.md-THEME_NAME-theme md-chip md-icon {    color: '{{background-700}}'; }  md-chips.md-THEME_NAME-theme md-chip.md-focused {    background: '{{primary-color}}';    color: '{{primary-contrast}}'; }    md-chips.md-THEME_NAME-theme md-chip.md-focused md-icon {      color: '{{primary-contrast}}'; }  md-chips.md-THEME_NAME-theme md-chip._md-chip-editing {    background: transparent;    color: '{{background-800}}'; }md-chips.md-THEME_NAME-theme md-chip-remove .md-button md-icon path {  fill: '{{background-500}}'; }.md-contact-suggestion span.md-contact-email {  color: '{{background-400}}'; }md-content.md-THEME_NAME-theme {  color: '{{foreground-1}}';  background-color: '{{background-default}}'; }/** Theme styles for mdCalendar. */.md-calendar.md-THEME_NAME-theme {  background: '{{background-A100}}';  color: '{{background-A200-0.87}}'; }  .md-calendar.md-THEME_NAME-theme tr:last-child td {    border-bottom-color: '{{background-200}}'; }.md-THEME_NAME-theme .md-calendar-day-header {  background: '{{background-300}}';  color: '{{background-A200-0.87}}'; }.md-THEME_NAME-theme .md-calendar-date.md-calendar-date-today .md-calendar-date-selection-indicator {  border: 1px solid '{{primary-500}}'; }.md-THEME_NAME-theme .md-calendar-date.md-calendar-date-today.md-calendar-date-disabled {  color: '{{primary-500-0.6}}'; }.md-calendar-date.md-focus .md-THEME_NAME-theme .md-calendar-date-selection-indicator, .md-THEME_NAME-theme .md-calendar-date-selection-indicator:hover {  background: '{{background-300}}'; }.md-THEME_NAME-theme .md-calendar-date.md-calendar-selected-date .md-calendar-date-selection-indicator,.md-THEME_NAME-theme .md-calendar-date.md-focus.md-calendar-selected-date .md-calendar-date-selection-indicator {  background: '{{primary-500}}';  color: '{{primary-500-contrast}}';  border-color: transparent; }.md-THEME_NAME-theme .md-calendar-date-disabled,.md-THEME_NAME-theme .md-calendar-month-label-disabled {  color: '{{background-A200-0.435}}'; }/** Theme styles for mdDatepicker. */.md-THEME_NAME-theme .md-datepicker-input {  color: '{{foreground-1}}'; }  .md-THEME_NAME-theme .md-datepicker-input::-webkit-input-placeholder {    color: '{{foreground-3}}'; }  .md-THEME_NAME-theme .md-datepicker-input:-moz-placeholder {    color: '{{foreground-3}}'; }  .md-THEME_NAME-theme .md-datepicker-input::-moz-placeholder {    color: '{{foreground-3}}'; }  .md-THEME_NAME-theme .md-datepicker-input:-ms-input-placeholder {    color: '{{foreground-3}}'; }  .md-THEME_NAME-theme .md-datepicker-input::-webkit-input-placeholder {    color: '{{foreground-3}}'; }.md-THEME_NAME-theme .md-datepicker-input-container {  border-bottom-color: '{{foreground-4}}'; }  .md-THEME_NAME-theme .md-datepicker-input-container.md-datepicker-focused {    border-bottom-color: '{{primary-color}}'; }    .md-accent .md-THEME_NAME-theme .md-datepicker-input-container.md-datepicker-focused {      border-bottom-color: '{{accent-color}}'; }    .md-warn .md-THEME_NAME-theme .md-datepicker-input-container.md-datepicker-focused {      border-bottom-color: '{{warn-A700}}'; }  .md-THEME_NAME-theme .md-datepicker-input-container.md-datepicker-invalid {    border-bottom-color: '{{warn-A700}}'; }.md-THEME_NAME-theme .md-datepicker-calendar-pane {  border-color: '{{background-hue-1}}'; }.md-THEME_NAME-theme .md-datepicker-triangle-button .md-datepicker-expand-triangle {  border-top-color: '{{foreground-3}}'; }.md-THEME_NAME-theme .md-datepicker-triangle-button:hover .md-datepicker-expand-triangle {  border-top-color: '{{foreground-2}}'; }.md-THEME_NAME-theme .md-datepicker-open .md-datepicker-calendar-icon {  color: '{{primary-color}}'; }.md-THEME_NAME-theme .md-datepicker-open.md-accent .md-datepicker-calendar-icon, .md-accent .md-THEME_NAME-theme .md-datepicker-open .md-datepicker-calendar-icon {  color: '{{accent-color}}'; }.md-THEME_NAME-theme .md-datepicker-open.md-warn .md-datepicker-calendar-icon, .md-warn .md-THEME_NAME-theme .md-datepicker-open .md-datepicker-calendar-icon {  color: '{{warn-A700}}'; }.md-THEME_NAME-theme .md-datepicker-open .md-datepicker-input-container,.md-THEME_NAME-theme .md-datepicker-input-mask-opaque {  background: '{{background-hue-1}}'; }.md-THEME_NAME-theme .md-datepicker-calendar {  background: '{{background-A100}}'; }md-dialog.md-THEME_NAME-theme {  border-radius: 4px;  background-color: '{{background-hue-1}}';  color: '{{foreground-1}}'; }  md-dialog.md-THEME_NAME-theme.md-content-overflow .md-actions, md-dialog.md-THEME_NAME-theme.md-content-overflow md-dialog-actions {    border-top-color: '{{foreground-4}}'; }md-divider.md-THEME_NAME-theme {  border-top-color: '{{foreground-4}}'; }.layout-row > md-divider.md-THEME_NAME-theme,.layout-xs-row > md-divider.md-THEME_NAME-theme, .layout-gt-xs-row > md-divider.md-THEME_NAME-theme,.layout-sm-row > md-divider.md-THEME_NAME-theme, .layout-gt-sm-row > md-divider.md-THEME_NAME-theme,.layout-md-row > md-divider.md-THEME_NAME-theme, .layout-gt-md-row > md-divider.md-THEME_NAME-theme,.layout-lg-row > md-divider.md-THEME_NAME-theme, .layout-gt-lg-row > md-divider.md-THEME_NAME-theme,.layout-xl-row > md-divider.md-THEME_NAME-theme {  border-right-color: '{{foreground-4}}'; }md-icon.md-THEME_NAME-theme {  color: '{{foreground-2}}'; }  md-icon.md-THEME_NAME-theme.md-primary {    color: '{{primary-color}}'; }  md-icon.md-THEME_NAME-theme.md-accent {    color: '{{accent-color}}'; }  md-icon.md-THEME_NAME-theme.md-warn {    color: '{{warn-color}}'; }md-input-container.md-THEME_NAME-theme .md-input {  color: '{{foreground-1}}';  border-color: '{{foreground-4}}'; }  md-input-container.md-THEME_NAME-theme .md-input::-webkit-input-placeholder {    color: '{{foreground-3}}'; }  md-input-container.md-THEME_NAME-theme .md-input:-moz-placeholder {    color: '{{foreground-3}}'; }  md-input-container.md-THEME_NAME-theme .md-input::-moz-placeholder {    color: '{{foreground-3}}'; }  md-input-container.md-THEME_NAME-theme .md-input:-ms-input-placeholder {    color: '{{foreground-3}}'; }  md-input-container.md-THEME_NAME-theme .md-input::-webkit-input-placeholder {    color: '{{foreground-3}}'; }md-input-container.md-THEME_NAME-theme > md-icon {  color: '{{foreground-1}}'; }md-input-container.md-THEME_NAME-theme label,md-input-container.md-THEME_NAME-theme .md-placeholder {  color: '{{foreground-3}}'; }md-input-container.md-THEME_NAME-theme label.md-required:after {  color: '{{warn-A700}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-focused):not(.md-input-invalid) label.md-required:after {  color: '{{foreground-2}}'; }md-input-container.md-THEME_NAME-theme .md-input-messages-animation, md-input-container.md-THEME_NAME-theme .md-input-message-animation {  color: '{{warn-A700}}'; }  md-input-container.md-THEME_NAME-theme .md-input-messages-animation .md-char-counter, md-input-container.md-THEME_NAME-theme .md-input-message-animation .md-char-counter {    color: '{{foreground-1}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-has-value label {  color: '{{foreground-2}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused .md-input, md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-resized .md-input {  border-color: '{{primary-color}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused label,md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused md-icon {  color: '{{primary-color}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-accent .md-input {  border-color: '{{accent-color}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-accent label,md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-accent md-icon {  color: '{{accent-color}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-warn .md-input {  border-color: '{{warn-A700}}'; }md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-warn label,md-input-container.md-THEME_NAME-theme:not(.md-input-invalid).md-input-focused.md-warn md-icon {  color: '{{warn-A700}}'; }md-input-container.md-THEME_NAME-theme.md-input-invalid .md-input {  border-color: '{{warn-A700}}'; }md-input-container.md-THEME_NAME-theme.md-input-invalid label,md-input-container.md-THEME_NAME-theme.md-input-invalid .md-input-message-animation,md-input-container.md-THEME_NAME-theme.md-input-invalid .md-char-counter {  color: '{{warn-A700}}'; }md-input-container.md-THEME_NAME-theme .md-input[disabled],[disabled] md-input-container.md-THEME_NAME-theme .md-input {  border-bottom-color: transparent;  color: '{{foreground-3}}';  background-image: linear-gradient(to right, \"{{foreground-3}}\" 0%, \"{{foreground-3}}\" 33%, transparent 0%);  background-image: -ms-linear-gradient(left, transparent 0%, \"{{foreground-3}}\" 100%); }md-list.md-THEME_NAME-theme md-list-item.md-2-line .md-list-item-text h3, md-list.md-THEME_NAME-theme md-list-item.md-2-line .md-list-item-text h4,md-list.md-THEME_NAME-theme md-list-item.md-3-line .md-list-item-text h3,md-list.md-THEME_NAME-theme md-list-item.md-3-line .md-list-item-text h4 {  color: '{{foreground-1}}'; }md-list.md-THEME_NAME-theme md-list-item.md-2-line .md-list-item-text p,md-list.md-THEME_NAME-theme md-list-item.md-3-line .md-list-item-text p {  color: '{{foreground-2}}'; }md-list.md-THEME_NAME-theme .md-proxy-focus.md-focused div.md-no-style {  background-color: '{{background-100}}'; }md-list.md-THEME_NAME-theme md-list-item .md-avatar-icon {  background-color: '{{foreground-3}}';  color: '{{background-color}}'; }md-list.md-THEME_NAME-theme md-list-item > md-icon {  color: '{{foreground-2}}'; }  md-list.md-THEME_NAME-theme md-list-item > md-icon.md-highlight {    color: '{{primary-color}}'; }    md-list.md-THEME_NAME-theme md-list-item > md-icon.md-highlight.md-accent {      color: '{{accent-color}}'; }md-menu-content.md-THEME_NAME-theme {  background-color: '{{background-A100}}'; }  md-menu-content.md-THEME_NAME-theme md-menu-item {    color: '{{background-A200-0.87}}'; }    md-menu-content.md-THEME_NAME-theme md-menu-item md-icon {      color: '{{background-A200-0.54}}'; }    md-menu-content.md-THEME_NAME-theme md-menu-item .md-button[disabled] {      color: '{{background-A200-0.25}}'; }      md-menu-content.md-THEME_NAME-theme md-menu-item .md-button[disabled] md-icon {        color: '{{background-A200-0.25}}'; }  md-menu-content.md-THEME_NAME-theme md-menu-divider {    background-color: '{{background-A200-0.11}}'; }md-menu-bar.md-THEME_NAME-theme > button.md-button {  color: '{{foreground-2}}';  border-radius: 2px; }md-menu-bar.md-THEME_NAME-theme md-menu.md-open > button, md-menu-bar.md-THEME_NAME-theme md-menu > button:focus {  outline: none;  background: '{{background-200}}'; }md-menu-bar.md-THEME_NAME-theme.md-open:not(.md-keyboard-mode) md-menu:hover > button {  background-color: '{{ background-500-0.2}}'; }md-menu-bar.md-THEME_NAME-theme:not(.md-keyboard-mode):not(.md-open) md-menu button:hover,md-menu-bar.md-THEME_NAME-theme:not(.md-keyboard-mode):not(.md-open) md-menu button:focus {  background: transparent; }md-menu-content.md-THEME_NAME-theme .md-menu > .md-button:after {  color: '{{background-A200-0.54}}'; }md-menu-content.md-THEME_NAME-theme .md-menu.md-open > .md-button {  background-color: '{{ background-500-0.2}}'; }md-toolbar.md-THEME_NAME-theme.md-menu-toolbar {  background-color: '{{background-A100}}';  color: '{{background-A200}}'; }  md-toolbar.md-THEME_NAME-theme.md-menu-toolbar md-toolbar-filler {    background-color: '{{primary-color}}';    color: '{{background-A100-0.87}}'; }    md-toolbar.md-THEME_NAME-theme.md-menu-toolbar md-toolbar-filler md-icon {      color: '{{background-A100-0.87}}'; }md-nav-bar.md-THEME_NAME-theme .md-nav-bar {  background-color: transparent;  border-color: '{{foreground-4}}'; }md-nav-bar.md-THEME_NAME-theme .md-button._md-nav-button.md-unselected {  color: '{{foreground-2}}'; }md-nav-bar.md-THEME_NAME-theme md-nav-ink-bar {  color: '{{accent-color}}';  background: '{{accent-color}}'; }.md-panel {  background-color: '{{background-900-0.0}}'; }  .md-panel._md-panel-backdrop.md-THEME_NAME-theme {    background-color: '{{background-900-1.0}}'; }md-progress-circular.md-THEME_NAME-theme path {  stroke: '{{primary-color}}'; }md-progress-circular.md-THEME_NAME-theme.md-warn path {  stroke: '{{warn-color}}'; }md-progress-circular.md-THEME_NAME-theme.md-accent path {  stroke: '{{accent-color}}'; }md-progress-linear.md-THEME_NAME-theme .md-container {  background-color: '{{primary-100}}'; }md-progress-linear.md-THEME_NAME-theme .md-bar {  background-color: '{{primary-color}}'; }md-progress-linear.md-THEME_NAME-theme.md-warn .md-container {  background-color: '{{warn-100}}'; }md-progress-linear.md-THEME_NAME-theme.md-warn .md-bar {  background-color: '{{warn-color}}'; }md-progress-linear.md-THEME_NAME-theme.md-accent .md-container {  background-color: '{{accent-100}}'; }md-progress-linear.md-THEME_NAME-theme.md-accent .md-bar {  background-color: '{{accent-color}}'; }md-progress-linear.md-THEME_NAME-theme[md-mode=buffer].md-warn .md-bar1 {  background-color: '{{warn-100}}'; }md-progress-linear.md-THEME_NAME-theme[md-mode=buffer].md-warn .md-dashed:before {  background: radial-gradient(\"{{warn-100}}\" 0%, \"{{warn-100}}\" 16%, transparent 42%); }md-progress-linear.md-THEME_NAME-theme[md-mode=buffer].md-accent .md-bar1 {  background-color: '{{accent-100}}'; }md-progress-linear.md-THEME_NAME-theme[md-mode=buffer].md-accent .md-dashed:before {  background: radial-gradient(\"{{accent-100}}\" 0%, \"{{accent-100}}\" 16%, transparent 42%); }md-radio-button.md-THEME_NAME-theme .md-off {  border-color: '{{foreground-2}}'; }md-radio-button.md-THEME_NAME-theme .md-on {  background-color: '{{accent-color-0.87}}'; }md-radio-button.md-THEME_NAME-theme.md-checked .md-off {  border-color: '{{accent-color-0.87}}'; }md-radio-button.md-THEME_NAME-theme.md-checked .md-ink-ripple {  color: '{{accent-color-0.87}}'; }md-radio-button.md-THEME_NAME-theme .md-container .md-ripple {  color: '{{accent-A700}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary .md-on, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary .md-on,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary .md-on,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary .md-on {  background-color: '{{primary-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary .md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary.md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary .md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary .md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary.md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary .md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-off {  border-color: '{{primary-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary .md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary.md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary .md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary .md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary.md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary .md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary.md-checked .md-ink-ripple {  color: '{{primary-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-primary .md-container .md-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-primary .md-container .md-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-primary .md-container .md-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-primary .md-container .md-ripple {  color: '{{primary-600}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn .md-on, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn .md-on,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn .md-on,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn .md-on {  background-color: '{{warn-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn .md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn.md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn .md-checked .md-off, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn .md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn.md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn .md-checked .md-off,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-off {  border-color: '{{warn-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn .md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn.md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn .md-checked .md-ink-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn .md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn.md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn .md-checked .md-ink-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn.md-checked .md-ink-ripple {  color: '{{warn-color-0.87}}'; }md-radio-group.md-THEME_NAME-theme:not([disabled]) .md-warn .md-container .md-ripple, md-radio-group.md-THEME_NAME-theme:not([disabled]).md-warn .md-container .md-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]) .md-warn .md-container .md-ripple,md-radio-button.md-THEME_NAME-theme:not([disabled]).md-warn .md-container .md-ripple {  color: '{{warn-600}}'; }md-radio-group.md-THEME_NAME-theme[disabled],md-radio-button.md-THEME_NAME-theme[disabled] {  color: '{{foreground-3}}'; }  md-radio-group.md-THEME_NAME-theme[disabled] .md-container .md-off,  md-radio-button.md-THEME_NAME-theme[disabled] .md-container .md-off {    border-color: '{{foreground-3}}'; }  md-radio-group.md-THEME_NAME-theme[disabled] .md-container .md-on,  md-radio-button.md-THEME_NAME-theme[disabled] .md-container .md-on {    border-color: '{{foreground-3}}'; }md-radio-group.md-THEME_NAME-theme .md-checked .md-ink-ripple {  color: '{{accent-color-0.26}}'; }md-radio-group.md-THEME_NAME-theme.md-primary .md-checked:not([disabled]) .md-ink-ripple, md-radio-group.md-THEME_NAME-theme .md-checked:not([disabled]).md-primary .md-ink-ripple {  color: '{{primary-color-0.26}}'; }md-radio-group.md-THEME_NAME-theme .md-checked.md-primary .md-ink-ripple {  color: '{{warn-color-0.26}}'; }md-radio-group.md-THEME_NAME-theme.md-focused:not(:empty) .md-checked .md-container:before {  background-color: '{{accent-color-0.26}}'; }md-radio-group.md-THEME_NAME-theme.md-focused:not(:empty).md-primary .md-checked .md-container:before,md-radio-group.md-THEME_NAME-theme.md-focused:not(:empty) .md-checked.md-primary .md-container:before {  background-color: '{{primary-color-0.26}}'; }md-radio-group.md-THEME_NAME-theme.md-focused:not(:empty).md-warn .md-checked .md-container:before,md-radio-group.md-THEME_NAME-theme.md-focused:not(:empty) .md-checked.md-warn .md-container:before {  background-color: '{{warn-color-0.26}}'; }md-input-container md-select.md-THEME_NAME-theme .md-select-value span:first-child:after {  color: '{{warn-A700}}'; }md-input-container:not(.md-input-focused):not(.md-input-invalid) md-select.md-THEME_NAME-theme .md-select-value span:first-child:after {  color: '{{foreground-3}}'; }md-input-container.md-input-focused:not(.md-input-has-value) md-select.md-THEME_NAME-theme .md-select-value {  color: '{{primary-color}}'; }  md-input-container.md-input-focused:not(.md-input-has-value) md-select.md-THEME_NAME-theme .md-select-value.md-select-placeholder {    color: '{{primary-color}}'; }md-input-container.md-input-invalid md-select.md-THEME_NAME-theme .md-select-value {  color: '{{warn-A700}}' !important;  border-bottom-color: '{{warn-A700}}' !important; }md-input-container.md-input-invalid md-select.md-THEME_NAME-theme.md-no-underline .md-select-value {  border-bottom-color: transparent !important; }md-select.md-THEME_NAME-theme[disabled] .md-select-value {  border-bottom-color: transparent;  background-image: linear-gradient(to right, \"{{foreground-3}}\" 0%, \"{{foreground-3}}\" 33%, transparent 0%);  background-image: -ms-linear-gradient(left, transparent 0%, \"{{foreground-3}}\" 100%); }md-select.md-THEME_NAME-theme .md-select-value {  border-bottom-color: '{{foreground-4}}'; }  md-select.md-THEME_NAME-theme .md-select-value.md-select-placeholder {    color: '{{foreground-3}}'; }  md-select.md-THEME_NAME-theme .md-select-value span:first-child:after {    color: '{{warn-A700}}'; }md-select.md-THEME_NAME-theme.md-no-underline .md-select-value {  border-bottom-color: transparent !important; }md-select.md-THEME_NAME-theme.ng-invalid.ng-touched .md-select-value {  color: '{{warn-A700}}' !important;  border-bottom-color: '{{warn-A700}}' !important; }md-select.md-THEME_NAME-theme.ng-invalid.ng-touched.md-no-underline .md-select-value {  border-bottom-color: transparent !important; }md-select.md-THEME_NAME-theme:not([disabled]):focus .md-select-value {  border-bottom-color: '{{primary-color}}';  color: '{{ foreground-1 }}'; }  md-select.md-THEME_NAME-theme:not([disabled]):focus .md-select-value.md-select-placeholder {    color: '{{ foreground-1 }}'; }md-select.md-THEME_NAME-theme:not([disabled]):focus.md-no-underline .md-select-value {  border-bottom-color: transparent !important; }md-select.md-THEME_NAME-theme:not([disabled]):focus.md-accent .md-select-value {  border-bottom-color: '{{accent-color}}'; }md-select.md-THEME_NAME-theme:not([disabled]):focus.md-warn .md-select-value {  border-bottom-color: '{{warn-color}}'; }md-select.md-THEME_NAME-theme[disabled] .md-select-value {  color: '{{foreground-3}}'; }  md-select.md-THEME_NAME-theme[disabled] .md-select-value.md-select-placeholder {    color: '{{foreground-3}}'; }md-select-menu.md-THEME_NAME-theme md-content {  background: '{{background-A100}}'; }  md-select-menu.md-THEME_NAME-theme md-content md-optgroup {    color: '{{background-600-0.87}}'; }  md-select-menu.md-THEME_NAME-theme md-content md-option {    color: '{{background-900-0.87}}'; }    md-select-menu.md-THEME_NAME-theme md-content md-option[disabled] .md-text {      color: '{{background-400-0.87}}'; }    md-select-menu.md-THEME_NAME-theme md-content md-option:not([disabled]):focus, md-select-menu.md-THEME_NAME-theme md-content md-option:not([disabled]):hover {      background: '{{background-200}}'; }    md-select-menu.md-THEME_NAME-theme md-content md-option[selected] {      color: '{{primary-500}}'; }      md-select-menu.md-THEME_NAME-theme md-content md-option[selected]:focus {        color: '{{primary-600}}'; }      md-select-menu.md-THEME_NAME-theme md-content md-option[selected].md-accent {        color: '{{accent-color}}'; }        md-select-menu.md-THEME_NAME-theme md-content md-option[selected].md-accent:focus {          color: '{{accent-A700}}'; }.md-checkbox-enabled.md-THEME_NAME-theme .md-ripple {  color: '{{primary-600}}'; }.md-checkbox-enabled.md-THEME_NAME-theme[selected] .md-ripple {  color: '{{background-600}}'; }.md-checkbox-enabled.md-THEME_NAME-theme .md-ink-ripple {  color: '{{foreground-2}}'; }.md-checkbox-enabled.md-THEME_NAME-theme[selected] .md-ink-ripple {  color: '{{primary-color-0.87}}'; }.md-checkbox-enabled.md-THEME_NAME-theme:not(.md-checked) .md-icon {  border-color: '{{foreground-2}}'; }.md-checkbox-enabled.md-THEME_NAME-theme[selected] .md-icon {  background-color: '{{primary-color-0.87}}'; }.md-checkbox-enabled.md-THEME_NAME-theme[selected].md-focused .md-container:before {  background-color: '{{primary-color-0.26}}'; }.md-checkbox-enabled.md-THEME_NAME-theme[selected] .md-icon:after {  border-color: '{{primary-contrast-0.87}}'; }.md-checkbox-enabled.md-THEME_NAME-theme .md-indeterminate[disabled] .md-container {  color: '{{foreground-3}}'; }.md-checkbox-enabled.md-THEME_NAME-theme md-option .md-text {  color: '{{background-900-0.87}}'; }md-sidenav.md-THEME_NAME-theme, md-sidenav.md-THEME_NAME-theme md-content {  background-color: '{{background-hue-1}}'; }md-slider.md-THEME_NAME-theme .md-track {  background-color: '{{foreground-3}}'; }md-slider.md-THEME_NAME-theme .md-track-ticks {  color: '{{background-contrast}}'; }md-slider.md-THEME_NAME-theme .md-focus-ring {  background-color: '{{accent-A200-0.2}}'; }md-slider.md-THEME_NAME-theme .md-disabled-thumb {  border-color: '{{background-color}}';  background-color: '{{background-color}}'; }md-slider.md-THEME_NAME-theme.md-min .md-thumb:after {  background-color: '{{background-color}}';  border-color: '{{foreground-3}}'; }md-slider.md-THEME_NAME-theme.md-min .md-focus-ring {  background-color: '{{foreground-3-0.38}}'; }md-slider.md-THEME_NAME-theme.md-min[md-discrete] .md-thumb:after {  background-color: '{{background-contrast}}';  border-color: transparent; }md-slider.md-THEME_NAME-theme.md-min[md-discrete] .md-sign {  background-color: '{{background-400}}'; }  md-slider.md-THEME_NAME-theme.md-min[md-discrete] .md-sign:after {    border-top-color: '{{background-400}}'; }md-slider.md-THEME_NAME-theme.md-min[md-discrete][md-vertical] .md-sign:after {  border-top-color: transparent;  border-left-color: '{{background-400}}'; }md-slider.md-THEME_NAME-theme .md-track.md-track-fill {  background-color: '{{accent-color}}'; }md-slider.md-THEME_NAME-theme .md-thumb:after {  border-color: '{{accent-color}}';  background-color: '{{accent-color}}'; }md-slider.md-THEME_NAME-theme .md-sign {  background-color: '{{accent-color}}'; }  md-slider.md-THEME_NAME-theme .md-sign:after {    border-top-color: '{{accent-color}}'; }md-slider.md-THEME_NAME-theme[md-vertical] .md-sign:after {  border-top-color: transparent;  border-left-color: '{{accent-color}}'; }md-slider.md-THEME_NAME-theme .md-thumb-text {  color: '{{accent-contrast}}'; }md-slider.md-THEME_NAME-theme.md-warn .md-focus-ring {  background-color: '{{warn-200-0.38}}'; }md-slider.md-THEME_NAME-theme.md-warn .md-track.md-track-fill {  background-color: '{{warn-color}}'; }md-slider.md-THEME_NAME-theme.md-warn .md-thumb:after {  border-color: '{{warn-color}}';  background-color: '{{warn-color}}'; }md-slider.md-THEME_NAME-theme.md-warn .md-sign {  background-color: '{{warn-color}}'; }  md-slider.md-THEME_NAME-theme.md-warn .md-sign:after {    border-top-color: '{{warn-color}}'; }md-slider.md-THEME_NAME-theme.md-warn[md-vertical] .md-sign:after {  border-top-color: transparent;  border-left-color: '{{warn-color}}'; }md-slider.md-THEME_NAME-theme.md-warn .md-thumb-text {  color: '{{warn-contrast}}'; }md-slider.md-THEME_NAME-theme.md-primary .md-focus-ring {  background-color: '{{primary-200-0.38}}'; }md-slider.md-THEME_NAME-theme.md-primary .md-track.md-track-fill {  background-color: '{{primary-color}}'; }md-slider.md-THEME_NAME-theme.md-primary .md-thumb:after {  border-color: '{{primary-color}}';  background-color: '{{primary-color}}'; }md-slider.md-THEME_NAME-theme.md-primary .md-sign {  background-color: '{{primary-color}}'; }  md-slider.md-THEME_NAME-theme.md-primary .md-sign:after {    border-top-color: '{{primary-color}}'; }md-slider.md-THEME_NAME-theme.md-primary[md-vertical] .md-sign:after {  border-top-color: transparent;  border-left-color: '{{primary-color}}'; }md-slider.md-THEME_NAME-theme.md-primary .md-thumb-text {  color: '{{primary-contrast}}'; }md-slider.md-THEME_NAME-theme[disabled] .md-thumb:after {  border-color: transparent; }md-slider.md-THEME_NAME-theme[disabled]:not(.md-min) .md-thumb:after, md-slider.md-THEME_NAME-theme[disabled][md-discrete] .md-thumb:after {  background-color: '{{foreground-3}}';  border-color: transparent; }md-slider.md-THEME_NAME-theme[disabled][readonly] .md-sign {  background-color: '{{background-400}}'; }  md-slider.md-THEME_NAME-theme[disabled][readonly] .md-sign:after {    border-top-color: '{{background-400}}'; }md-slider.md-THEME_NAME-theme[disabled][readonly][md-vertical] .md-sign:after {  border-top-color: transparent;  border-left-color: '{{background-400}}'; }md-slider.md-THEME_NAME-theme[disabled][readonly] .md-disabled-thumb {  border-color: transparent;  background-color: transparent; }md-slider-container[disabled] > *:first-child:not(md-slider),md-slider-container[disabled] > *:last-child:not(md-slider) {  color: '{{foreground-3}}'; }.md-subheader.md-THEME_NAME-theme {  color: '{{ foreground-2-0.23 }}';  background-color: '{{background-default}}'; }  .md-subheader.md-THEME_NAME-theme.md-primary {    color: '{{primary-color}}'; }  .md-subheader.md-THEME_NAME-theme.md-accent {    color: '{{accent-color}}'; }  .md-subheader.md-THEME_NAME-theme.md-warn {    color: '{{warn-color}}'; }md-switch.md-THEME_NAME-theme .md-ink-ripple {  color: '{{background-500}}'; }md-switch.md-THEME_NAME-theme .md-thumb {  background-color: '{{background-50}}'; }md-switch.md-THEME_NAME-theme .md-bar {  background-color: '{{background-500}}'; }md-switch.md-THEME_NAME-theme.md-checked .md-ink-ripple {  color: '{{accent-color}}'; }md-switch.md-THEME_NAME-theme.md-checked .md-thumb {  background-color: '{{accent-color}}'; }md-switch.md-THEME_NAME-theme.md-checked .md-bar {  background-color: '{{accent-color-0.5}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-focused .md-thumb:before {  background-color: '{{accent-color-0.26}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-primary .md-ink-ripple {  color: '{{primary-color}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-primary .md-thumb {  background-color: '{{primary-color}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-primary .md-bar {  background-color: '{{primary-color-0.5}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-primary.md-focused .md-thumb:before {  background-color: '{{primary-color-0.26}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-warn .md-ink-ripple {  color: '{{warn-color}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-warn .md-thumb {  background-color: '{{warn-color}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-warn .md-bar {  background-color: '{{warn-color-0.5}}'; }md-switch.md-THEME_NAME-theme.md-checked.md-warn.md-focused .md-thumb:before {  background-color: '{{warn-color-0.26}}'; }md-switch.md-THEME_NAME-theme[disabled] .md-thumb {  background-color: '{{background-400}}'; }md-switch.md-THEME_NAME-theme[disabled] .md-bar {  background-color: '{{foreground-4}}'; }md-tabs.md-THEME_NAME-theme md-tabs-wrapper {  background-color: transparent;  border-color: '{{foreground-4}}'; }md-tabs.md-THEME_NAME-theme .md-paginator md-icon {  color: '{{primary-color}}'; }md-tabs.md-THEME_NAME-theme md-ink-bar {  color: '{{accent-color}}';  background: '{{accent-color}}'; }md-tabs.md-THEME_NAME-theme .md-tab {  color: '{{foreground-2}}'; }  md-tabs.md-THEME_NAME-theme .md-tab[disabled], md-tabs.md-THEME_NAME-theme .md-tab[disabled] md-icon {    color: '{{foreground-3}}'; }  md-tabs.md-THEME_NAME-theme .md-tab.md-active, md-tabs.md-THEME_NAME-theme .md-tab.md-active md-icon, md-tabs.md-THEME_NAME-theme .md-tab.md-focused, md-tabs.md-THEME_NAME-theme .md-tab.md-focused md-icon {    color: '{{primary-color}}'; }  md-tabs.md-THEME_NAME-theme .md-tab.md-focused {    background: '{{primary-color-0.1}}'; }  md-tabs.md-THEME_NAME-theme .md-tab .md-ripple-container {    color: '{{accent-A100}}'; }md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper {  background-color: '{{accent-color}}'; }  md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{accent-A100}}'; }    md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{accent-contrast}}'; }    md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{accent-contrast-0.1}}'; }  md-tabs.md-THEME_NAME-theme.md-accent > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-ink-bar {    color: '{{primary-600-1}}';    background: '{{primary-600-1}}'; }md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper {  background-color: '{{primary-color}}'; }  md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{primary-100}}'; }    md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{primary-contrast}}'; }    md-tabs.md-THEME_NAME-theme.md-primary > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{primary-contrast-0.1}}'; }md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper {  background-color: '{{warn-color}}'; }  md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{warn-100}}'; }    md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{warn-contrast}}'; }    md-tabs.md-THEME_NAME-theme.md-warn > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{warn-contrast-0.1}}'; }md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper {  background-color: '{{primary-color}}'; }  md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{primary-100}}'; }    md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{primary-contrast}}'; }    md-toolbar > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{primary-contrast-0.1}}'; }md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper {  background-color: '{{accent-color}}'; }  md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{accent-A100}}'; }    md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{accent-contrast}}'; }    md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{accent-contrast-0.1}}'; }  md-toolbar.md-accent > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-ink-bar {    color: '{{primary-600-1}}';    background: '{{primary-600-1}}'; }md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper {  background-color: '{{warn-color}}'; }  md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]) {    color: '{{warn-100}}'; }    md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active, md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-active md-icon, md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused, md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused md-icon {      color: '{{warn-contrast}}'; }    md-toolbar.md-warn > md-tabs.md-THEME_NAME-theme > md-tabs-wrapper > md-tabs-canvas > md-pagination-wrapper > md-tab-item:not([disabled]).md-focused {      background: '{{warn-contrast-0.1}}'; }md-toast.md-THEME_NAME-theme .md-toast-content {  background-color: #323232;  color: '{{background-50}}'; }  md-toast.md-THEME_NAME-theme .md-toast-content .md-button {    color: '{{background-50}}'; }    md-toast.md-THEME_NAME-theme .md-toast-content .md-button.md-highlight {      color: '{{accent-color}}'; }      md-toast.md-THEME_NAME-theme .md-toast-content .md-button.md-highlight.md-primary {        color: '{{primary-color}}'; }      md-toast.md-THEME_NAME-theme .md-toast-content .md-button.md-highlight.md-warn {        color: '{{warn-color}}'; }md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar) {  background-color: '{{primary-color}}';  color: '{{primary-contrast}}'; }  md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar) md-icon {    color: '{{primary-contrast}}';    fill: '{{primary-contrast}}'; }  md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar) .md-button[disabled] md-icon {    color: '{{primary-contrast-0.26}}';    fill: '{{primary-contrast-0.26}}'; }  md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar).md-accent {    background-color: '{{accent-color}}';    color: '{{accent-contrast}}'; }    md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar).md-accent .md-ink-ripple {      color: '{{accent-contrast}}'; }    md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar).md-accent md-icon {      color: '{{accent-contrast}}';      fill: '{{accent-contrast}}'; }    md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar).md-accent .md-button[disabled] md-icon {      color: '{{accent-contrast-0.26}}';      fill: '{{accent-contrast-0.26}}'; }  md-toolbar.md-THEME_NAME-theme:not(.md-menu-toolbar).md-warn {    background-color: '{{warn-color}}';    color: '{{warn-contrast}}'; }md-tooltip.md-THEME_NAME-theme {  color: '{{background-A100}}'; }  md-tooltip.md-THEME_NAME-theme .md-content {    background-color: '{{foreground-2}}'; }/*  Only used with Theme processes */html.md-THEME_NAME-theme, body.md-THEME_NAME-theme {  color: '{{foreground-1}}';  background-color: '{{background-color}}'; }");
}()}(window,window.angular),window.ngMaterial={version:{full:"1.1.0"}};
/**
 * @license AngularJS v1.5.5
 * (c) 2010-2016 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/**
 * @ngdoc module
 * @name ngRoute
 * @description
 *
 * # ngRoute
 *
 * The `ngRoute` module provides routing and deeplinking services and directives for angular apps.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 *
 * <div doc-module-components="ngRoute"></div>
 */
 /* global -ngRouteModule */
var ngRouteModule = angular.module('ngRoute', ['ng']).
                        provider('$route', $RouteProvider),
    $routeMinErr = angular.$$minErr('ngRoute');

/**
 * @ngdoc provider
 * @name $routeProvider
 *
 * @description
 *
 * Used for configuring routes.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 * ## Dependencies
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 */
function $RouteProvider() {
  function inherit(parent, extra) {
    return angular.extend(Object.create(parent), extra);
  }

  var routes = {};

  /**
   * @ngdoc method
   * @name $routeProvider#when
   *
   * @param {string} path Route path (matched against `$location.path`). If `$location.path`
   *    contains redundant trailing slash or is missing one, the route will still match and the
   *    `$location.path` will be updated to add or drop the trailing slash to exactly match the
   *    route definition.
   *
   *    * `path` can contain named groups starting with a colon: e.g. `:name`. All characters up
   *        to the next slash are matched and stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain named groups starting with a colon and ending with a star:
   *        e.g.`:name*`. All characters are eagerly stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain optional named groups with a question mark: e.g.`:name?`.
   *
   *    For example, routes like `/color/:color/largecode/:largecode*\/edit` will match
   *    `/color/brown/largecode/code/with/slashes/edit` and extract:
   *
   *    * `color: brown`
   *    * `largecode: code/with/slashes`.
   *
   *
   * @param {Object} route Mapping information to be assigned to `$route.current` on route
   *    match.
   *
   *    Object properties:
   *
   *    - `controller` – `{(string|function()=}` – Controller fn that should be associated with
   *      newly created scope or the name of a {@link angular.Module#controller registered
   *      controller} if passed as a string.
   *    - `controllerAs` – `{string=}` – An identifier name for a reference to the controller.
   *      If present, the controller will be published to scope under the `controllerAs` name.
   *    - `template` – `{string=|function()=}` – html template as a string or a function that
   *      returns an html template as a string which should be used by {@link
   *      ngRoute.directive:ngView ngView} or {@link ng.directive:ngInclude ngInclude} directives.
   *      This property takes precedence over `templateUrl`.
   *
   *      If `template` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *    - `templateUrl` – `{string=|function()=}` – path or function that returns a path to an html
   *      template that should be used by {@link ngRoute.directive:ngView ngView}.
   *
   *      If `templateUrl` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *    - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
   *      be injected into the controller. If any of these dependencies are promises, the router
   *      will wait for them all to be resolved or one to be rejected before the controller is
   *      instantiated.
   *      If all the promises are resolved successfully, the values of the resolved promises are
   *      injected and {@link ngRoute.$route#$routeChangeSuccess $routeChangeSuccess} event is
   *      fired. If any of the promises are rejected the
   *      {@link ngRoute.$route#$routeChangeError $routeChangeError} event is fired.
   *      For easier access to the resolved dependencies from the template, the `resolve` map will
   *      be available on the scope of the route, under `$resolve` (by default) or a custom name
   *      specified by the `resolveAs` property (see below). This can be particularly useful, when
   *      working with {@link angular.Module#component components} as route templates.<br />
   *      <div class="alert alert-warning">
   *        **Note:** If your scope already contains a property with this name, it will be hidden
   *        or overwritten. Make sure, you specify an appropriate name for this property, that
   *        does not collide with other properties on the scope.
   *      </div>
   *      The map object is:
   *
   *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
   *      - `factory` - `{string|function}`: If `string` then it is an alias for a service.
   *        Otherwise if function, then it is {@link auto.$injector#invoke injected}
   *        and the return value is treated as the dependency. If the result is a promise, it is
   *        resolved before its value is injected into the controller. Be aware that
   *        `ngRoute.$routeParams` will still refer to the previous route within these resolve
   *        functions.  Use `$route.current.params` to access the new route parameters, instead.
   *
   *    - `resolveAs` - `{string=}` - The name under which the `resolve` map will be available on
   *      the scope of the route. If omitted, defaults to `$resolve`.
   *
   *    - `redirectTo` – `{(string|function())=}` – value to update
   *      {@link ng.$location $location} path with and trigger route redirection.
   *
   *      If `redirectTo` is a function, it will be called with the following parameters:
   *
   *      - `{Object.<string>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route templateUrl.
   *      - `{string}` - current `$location.path()`
   *      - `{Object}` - current `$location.search()`
   *
   *      The custom `redirectTo` function is expected to return a string which will be used
   *      to update `$location.path()` and `$location.search()`.
   *
   *    - `[reloadOnSearch=true]` - `{boolean=}` - reload route when only `$location.search()`
   *      or `$location.hash()` changes.
   *
   *      If the option is set to `false` and url in the browser changes, then
   *      `$routeUpdate` event is broadcasted on the root scope.
   *
   *    - `[caseInsensitiveMatch=false]` - `{boolean=}` - match routes without being case sensitive
   *
   *      If the option is set to `true`, then the particular route can be matched without being
   *      case sensitive
   *
   * @returns {Object} self
   *
   * @description
   * Adds a new route definition to the `$route` service.
   */
  this.when = function(path, route) {
    //copy original route object to preserve params inherited from proto chain
    var routeCopy = angular.copy(route);
    if (angular.isUndefined(routeCopy.reloadOnSearch)) {
      routeCopy.reloadOnSearch = true;
    }
    if (angular.isUndefined(routeCopy.caseInsensitiveMatch)) {
      routeCopy.caseInsensitiveMatch = this.caseInsensitiveMatch;
    }
    routes[path] = angular.extend(
      routeCopy,
      path && pathRegExp(path, routeCopy)
    );

    // create redirection for trailing slashes
    if (path) {
      var redirectPath = (path[path.length - 1] == '/')
            ? path.substr(0, path.length - 1)
            : path + '/';

      routes[redirectPath] = angular.extend(
        {redirectTo: path},
        pathRegExp(redirectPath, routeCopy)
      );
    }

    return this;
  };

  /**
   * @ngdoc property
   * @name $routeProvider#caseInsensitiveMatch
   * @description
   *
   * A boolean property indicating if routes defined
   * using this provider should be matched using a case insensitive
   * algorithm. Defaults to `false`.
   */
  this.caseInsensitiveMatch = false;

   /**
    * @param path {string} path
    * @param opts {Object} options
    * @return {?Object}
    *
    * @description
    * Normalizes the given path, returning a regular expression
    * and the original path.
    *
    * Inspired by pathRexp in visionmedia/express/lib/utils.js.
    */
  function pathRegExp(path, opts) {
    var insensitive = opts.caseInsensitiveMatch,
        ret = {
          originalPath: path,
          regexp: path
        },
        keys = ret.keys = [];

    path = path
      .replace(/([().])/g, '\\$1')
      .replace(/(\/)?:(\w+)(\*\?|[\?\*])?/g, function(_, slash, key, option) {
        var optional = (option === '?' || option === '*?') ? '?' : null;
        var star = (option === '*' || option === '*?') ? '*' : null;
        keys.push({ name: key, optional: !!optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (star && '(.+?)' || '([^/]+)')
          + (optional || '')
          + ')'
          + (optional || '');
      })
      .replace(/([\/$\*])/g, '\\$1');

    ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
    return ret;
  }

  /**
   * @ngdoc method
   * @name $routeProvider#otherwise
   *
   * @description
   * Sets route definition that will be used on route change when no other route definition
   * is matched.
   *
   * @param {Object|string} params Mapping information to be assigned to `$route.current`.
   * If called with a string, the value maps to `redirectTo`.
   * @returns {Object} self
   */
  this.otherwise = function(params) {
    if (typeof params === 'string') {
      params = {redirectTo: params};
    }
    this.when(null, params);
    return this;
  };


  this.$get = ['$rootScope',
               '$location',
               '$routeParams',
               '$q',
               '$injector',
               '$templateRequest',
               '$sce',
      function($rootScope, $location, $routeParams, $q, $injector, $templateRequest, $sce) {

    /**
     * @ngdoc service
     * @name $route
     * @requires $location
     * @requires $routeParams
     *
     * @property {Object} current Reference to the current route definition.
     * The route definition contains:
     *
     *   - `controller`: The controller constructor as defined in the route definition.
     *   - `locals`: A map of locals which is used by {@link ng.$controller $controller} service for
     *     controller instantiation. The `locals` contain
     *     the resolved values of the `resolve` map. Additionally the `locals` also contain:
     *
     *     - `$scope` - The current route scope.
     *     - `$template` - The current route template HTML.
     *
     *     The `locals` will be assigned to the route scope's `$resolve` property. You can override
     *     the property name, using `resolveAs` in the route definition. See
     *     {@link ngRoute.$routeProvider $routeProvider} for more info.
     *
     * @property {Object} routes Object with all route configuration Objects as its properties.
     *
     * @description
     * `$route` is used for deep-linking URLs to controllers and views (HTML partials).
     * It watches `$location.url()` and tries to map the path to an existing route definition.
     *
     * Requires the {@link ngRoute `ngRoute`} module to be installed.
     *
     * You can define routes through {@link ngRoute.$routeProvider $routeProvider}'s API.
     *
     * The `$route` service is typically used in conjunction with the
     * {@link ngRoute.directive:ngView `ngView`} directive and the
     * {@link ngRoute.$routeParams `$routeParams`} service.
     *
     * @example
     * This example shows how changing the URL hash causes the `$route` to match a route against the
     * URL, and the `ngView` pulls in the partial.
     *
     * <example name="$route-service" module="ngRouteExample"
     *          deps="angular-route.js" fixBase="true">
     *   <file name="index.html">
     *     <div ng-controller="MainController">
     *       Choose:
     *       <a href="Book/Moby">Moby</a> |
     *       <a href="Book/Moby/ch/1">Moby: Ch1</a> |
     *       <a href="Book/Gatsby">Gatsby</a> |
     *       <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
     *       <a href="Book/Scarlet">Scarlet Letter</a><br/>
     *
     *       <div ng-view></div>
     *
     *       <hr />
     *
     *       <pre>$location.path() = {{$location.path()}}</pre>
     *       <pre>$route.current.templateUrl = {{$route.current.templateUrl}}</pre>
     *       <pre>$route.current.params = {{$route.current.params}}</pre>
     *       <pre>$route.current.scope.name = {{$route.current.scope.name}}</pre>
     *       <pre>$routeParams = {{$routeParams}}</pre>
     *     </div>
     *   </file>
     *
     *   <file name="book.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *   </file>
     *
     *   <file name="chapter.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *     Chapter Id: {{params.chapterId}}
     *   </file>
     *
     *   <file name="script.js">
     *     angular.module('ngRouteExample', ['ngRoute'])
     *
     *      .controller('MainController', function($scope, $route, $routeParams, $location) {
     *          $scope.$route = $route;
     *          $scope.$location = $location;
     *          $scope.$routeParams = $routeParams;
     *      })
     *
     *      .controller('BookController', function($scope, $routeParams) {
     *          $scope.name = "BookController";
     *          $scope.params = $routeParams;
     *      })
     *
     *      .controller('ChapterController', function($scope, $routeParams) {
     *          $scope.name = "ChapterController";
     *          $scope.params = $routeParams;
     *      })
     *
     *     .config(function($routeProvider, $locationProvider) {
     *       $routeProvider
     *        .when('/Book/:bookId', {
     *         templateUrl: 'book.html',
     *         controller: 'BookController',
     *         resolve: {
     *           // I will cause a 1 second delay
     *           delay: function($q, $timeout) {
     *             var delay = $q.defer();
     *             $timeout(delay.resolve, 1000);
     *             return delay.promise;
     *           }
     *         }
     *       })
     *       .when('/Book/:bookId/ch/:chapterId', {
     *         templateUrl: 'chapter.html',
     *         controller: 'ChapterController'
     *       });
     *
     *       // configure html5 to get links working on jsfiddle
     *       $locationProvider.html5Mode(true);
     *     });
     *
     *   </file>
     *
     *   <file name="protractor.js" type="protractor">
     *     it('should load and compile correct template', function() {
     *       element(by.linkText('Moby: Ch1')).click();
     *       var content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller\: ChapterController/);
     *       expect(content).toMatch(/Book Id\: Moby/);
     *       expect(content).toMatch(/Chapter Id\: 1/);
     *
     *       element(by.partialLinkText('Scarlet')).click();
     *
     *       content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller\: BookController/);
     *       expect(content).toMatch(/Book Id\: Scarlet/);
     *     });
     *   </file>
     * </example>
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeStart
     * @eventType broadcast on root scope
     * @description
     * Broadcasted before a route change. At this  point the route services starts
     * resolving all of the dependencies needed for the route change to occur.
     * Typically this involves fetching the view template as well as any dependencies
     * defined in `resolve` route property. Once  all of the dependencies are resolved
     * `$routeChangeSuccess` is fired.
     *
     * The route change (and the `$location` change that triggered it) can be prevented
     * by calling `preventDefault` method of the event. See {@link ng.$rootScope.Scope#$on}
     * for more details about event object.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} next Future route information.
     * @param {Route} current Current route information.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeSuccess
     * @eventType broadcast on root scope
     * @description
     * Broadcasted after a route change has happened successfully.
     * The `resolve` dependencies are now available in the `current.locals` property.
     *
     * {@link ngRoute.directive:ngView ngView} listens for the directive
     * to instantiate the controller and render the view.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} current Current route information.
     * @param {Route|Undefined} previous Previous route information, or undefined if current is
     * first route entered.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeError
     * @eventType broadcast on root scope
     * @description
     * Broadcasted if any of the resolve promises are rejected.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     * @param {Route} rejection Rejection of the promise. Usually the error of the failed promise.
     */

    /**
     * @ngdoc event
     * @name $route#$routeUpdate
     * @eventType broadcast on root scope
     * @description
     * The `reloadOnSearch` property has been set to false, and we are reusing the same
     * instance of the Controller.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current/previous route information.
     */

    var forceReload = false,
        preparedRoute,
        preparedRouteIsUpdateOnly,
        $route = {
          routes: routes,

          /**
           * @ngdoc method
           * @name $route#reload
           *
           * @description
           * Causes `$route` service to reload the current route even if
           * {@link ng.$location $location} hasn't changed.
           *
           * As a result of that, {@link ngRoute.directive:ngView ngView}
           * creates new scope and reinstantiates the controller.
           */
          reload: function() {
            forceReload = true;

            var fakeLocationEvent = {
              defaultPrevented: false,
              preventDefault: function fakePreventDefault() {
                this.defaultPrevented = true;
                forceReload = false;
              }
            };

            $rootScope.$evalAsync(function() {
              prepareRoute(fakeLocationEvent);
              if (!fakeLocationEvent.defaultPrevented) commitRoute();
            });
          },

          /**
           * @ngdoc method
           * @name $route#updateParams
           *
           * @description
           * Causes `$route` service to update the current URL, replacing
           * current route parameters with those specified in `newParams`.
           * Provided property names that match the route's path segment
           * definitions will be interpolated into the location's path, while
           * remaining properties will be treated as query params.
           *
           * @param {!Object<string, string>} newParams mapping of URL parameter names to values
           */
          updateParams: function(newParams) {
            if (this.current && this.current.$$route) {
              newParams = angular.extend({}, this.current.params, newParams);
              $location.path(interpolate(this.current.$$route.originalPath, newParams));
              // interpolate modifies newParams, only query params are left
              $location.search(newParams);
            } else {
              throw $routeMinErr('norout', 'Tried updating route when with no current route');
            }
          }
        };

    $rootScope.$on('$locationChangeStart', prepareRoute);
    $rootScope.$on('$locationChangeSuccess', commitRoute);

    return $route;

    /////////////////////////////////////////////////////

    /**
     * @param on {string} current url
     * @param route {Object} route regexp to match the url against
     * @return {?Object}
     *
     * @description
     * Check if the route matches the current url.
     *
     * Inspired by match in
     * visionmedia/express/lib/router/router.js.
     */
    function switchRouteMatcher(on, route) {
      var keys = route.keys,
          params = {};

      if (!route.regexp) return null;

      var m = route.regexp.exec(on);
      if (!m) return null;

      for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        var val = m[i];

        if (key && val) {
          params[key.name] = val;
        }
      }
      return params;
    }

    function prepareRoute($locationEvent) {
      var lastRoute = $route.current;

      preparedRoute = parseRoute();
      preparedRouteIsUpdateOnly = preparedRoute && lastRoute && preparedRoute.$$route === lastRoute.$$route
          && angular.equals(preparedRoute.pathParams, lastRoute.pathParams)
          && !preparedRoute.reloadOnSearch && !forceReload;

      if (!preparedRouteIsUpdateOnly && (lastRoute || preparedRoute)) {
        if ($rootScope.$broadcast('$routeChangeStart', preparedRoute, lastRoute).defaultPrevented) {
          if ($locationEvent) {
            $locationEvent.preventDefault();
          }
        }
      }
    }

    function commitRoute() {
      var lastRoute = $route.current;
      var nextRoute = preparedRoute;

      if (preparedRouteIsUpdateOnly) {
        lastRoute.params = nextRoute.params;
        angular.copy(lastRoute.params, $routeParams);
        $rootScope.$broadcast('$routeUpdate', lastRoute);
      } else if (nextRoute || lastRoute) {
        forceReload = false;
        $route.current = nextRoute;
        if (nextRoute) {
          if (nextRoute.redirectTo) {
            if (angular.isString(nextRoute.redirectTo)) {
              $location.path(interpolate(nextRoute.redirectTo, nextRoute.params)).search(nextRoute.params)
                       .replace();
            } else {
              $location.url(nextRoute.redirectTo(nextRoute.pathParams, $location.path(), $location.search()))
                       .replace();
            }
          }
        }

        $q.when(nextRoute).
          then(function() {
            if (nextRoute) {
              var locals = angular.extend({}, nextRoute.resolve),
                  template, templateUrl;

              angular.forEach(locals, function(value, key) {
                locals[key] = angular.isString(value) ?
                    $injector.get(value) : $injector.invoke(value, null, null, key);
              });

              if (angular.isDefined(template = nextRoute.template)) {
                if (angular.isFunction(template)) {
                  template = template(nextRoute.params);
                }
              } else if (angular.isDefined(templateUrl = nextRoute.templateUrl)) {
                if (angular.isFunction(templateUrl)) {
                  templateUrl = templateUrl(nextRoute.params);
                }
                if (angular.isDefined(templateUrl)) {
                  nextRoute.loadedTemplateUrl = $sce.valueOf(templateUrl);
                  template = $templateRequest(templateUrl);
                }
              }
              if (angular.isDefined(template)) {
                locals['$template'] = template;
              }
              return $q.all(locals);
            }
          }).
          then(function(locals) {
            // after route change
            if (nextRoute == $route.current) {
              if (nextRoute) {
                nextRoute.locals = locals;
                angular.copy(nextRoute.params, $routeParams);
              }
              $rootScope.$broadcast('$routeChangeSuccess', nextRoute, lastRoute);
            }
          }, function(error) {
            if (nextRoute == $route.current) {
              $rootScope.$broadcast('$routeChangeError', nextRoute, lastRoute, error);
            }
          });
      }
    }


    /**
     * @returns {Object} the current active route, by matching it against the URL
     */
    function parseRoute() {
      // Match a route
      var params, match;
      angular.forEach(routes, function(route, path) {
        if (!match && (params = switchRouteMatcher($location.path(), route))) {
          match = inherit(route, {
            params: angular.extend({}, $location.search(), params),
            pathParams: params});
          match.$$route = route;
        }
      });
      // No route matched; fallback to "otherwise" route
      return match || routes[null] && inherit(routes[null], {params: {}, pathParams:{}});
    }

    /**
     * @returns {string} interpolation of the redirect path with the parameters
     */
    function interpolate(string, params) {
      var result = [];
      angular.forEach((string || '').split(':'), function(segment, i) {
        if (i === 0) {
          result.push(segment);
        } else {
          var segmentMatch = segment.match(/(\w+)(?:[?*])?(.*)/);
          var key = segmentMatch[1];
          result.push(params[key]);
          result.push(segmentMatch[2] || '');
          delete params[key];
        }
      });
      return result.join('');
    }
  }];
}

ngRouteModule.provider('$routeParams', $RouteParamsProvider);


/**
 * @ngdoc service
 * @name $routeParams
 * @requires $route
 *
 * @description
 * The `$routeParams` service allows you to retrieve the current set of route parameters.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * The route parameters are a combination of {@link ng.$location `$location`}'s
 * {@link ng.$location#search `search()`} and {@link ng.$location#path `path()`}.
 * The `path` parameters are extracted when the {@link ngRoute.$route `$route`} path is matched.
 *
 * In case of parameter name collision, `path` params take precedence over `search` params.
 *
 * The service guarantees that the identity of the `$routeParams` object will remain unchanged
 * (but its properties will likely change) even when a route change occurs.
 *
 * Note that the `$routeParams` are only updated *after* a route change completes successfully.
 * This means that you cannot rely on `$routeParams` being correct in route resolve functions.
 * Instead you can use `$route.current.params` to access the new route's parameters.
 *
 * @example
 * ```js
 *  // Given:
 *  // URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
 *  // Route: /Chapter/:chapterId/Section/:sectionId
 *  //
 *  // Then
 *  $routeParams ==> {chapterId:'1', sectionId:'2', search:'moby'}
 * ```
 */
function $RouteParamsProvider() {
  this.$get = function() { return {}; };
}

ngRouteModule.directive('ngView', ngViewFactory);
ngRouteModule.directive('ngView', ngViewFillContentFactory);


/**
 * @ngdoc directive
 * @name ngView
 * @restrict ECA
 *
 * @description
 * # Overview
 * `ngView` is a directive that complements the {@link ngRoute.$route $route} service by
 * including the rendered template of the current route into the main layout (`index.html`) file.
 * Every time the current route changes, the included view changes with it according to the
 * configuration of the `$route` service.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from to the DOM  |
 *
 * The enter and leave animation occur concurrently.
 *
 * @knownIssue If `ngView` is contained in an asynchronously loaded template (e.g. in another
 *             directive's templateUrl or in a template loaded using `ngInclude`), then you need to
 *             make sure that `$route` is instantiated in time to capture the initial
 *             `$locationChangeStart` event and load the appropriate view. One way to achieve this
 *             is to have it as a dependency in a `.run` block:
 *             `myModule.run(['$route', function() {}]);`
 *
 * @scope
 * @priority 400
 * @param {string=} onload Expression to evaluate whenever the view updates.
 *
 * @param {string=} autoscroll Whether `ngView` should call {@link ng.$anchorScroll
 *                  $anchorScroll} to scroll the viewport after the view is updated.
 *
 *                  - If the attribute is not set, disable scrolling.
 *                  - If the attribute is set without value, enable scrolling.
 *                  - Otherwise enable scrolling only if the `autoscroll` attribute value evaluated
 *                    as an expression yields a truthy value.
 * @example
    <example name="ngView-directive" module="ngViewExample"
             deps="angular-route.js;angular-animate.js"
             animations="true" fixBase="true">
      <file name="index.html">
        <div ng-controller="MainCtrl as main">
          Choose:
          <a href="Book/Moby">Moby</a> |
          <a href="Book/Moby/ch/1">Moby: Ch1</a> |
          <a href="Book/Gatsby">Gatsby</a> |
          <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
          <a href="Book/Scarlet">Scarlet Letter</a><br/>

          <div class="view-animate-container">
            <div ng-view class="view-animate"></div>
          </div>
          <hr />

          <pre>$location.path() = {{main.$location.path()}}</pre>
          <pre>$route.current.templateUrl = {{main.$route.current.templateUrl}}</pre>
          <pre>$route.current.params = {{main.$route.current.params}}</pre>
          <pre>$routeParams = {{main.$routeParams}}</pre>
        </div>
      </file>

      <file name="book.html">
        <div>
          controller: {{book.name}}<br />
          Book Id: {{book.params.bookId}}<br />
        </div>
      </file>

      <file name="chapter.html">
        <div>
          controller: {{chapter.name}}<br />
          Book Id: {{chapter.params.bookId}}<br />
          Chapter Id: {{chapter.params.chapterId}}
        </div>
      </file>

      <file name="animations.css">
        .view-animate-container {
          position:relative;
          height:100px!important;
          background:white;
          border:1px solid black;
          height:40px;
          overflow:hidden;
        }

        .view-animate {
          padding:10px;
        }

        .view-animate.ng-enter, .view-animate.ng-leave {
          transition:all cubic-bezier(0.250, 0.460, 0.450, 0.940) 1.5s;

          display:block;
          width:100%;
          border-left:1px solid black;

          position:absolute;
          top:0;
          left:0;
          right:0;
          bottom:0;
          padding:10px;
        }

        .view-animate.ng-enter {
          left:100%;
        }
        .view-animate.ng-enter.ng-enter-active {
          left:0;
        }
        .view-animate.ng-leave.ng-leave-active {
          left:-100%;
        }
      </file>

      <file name="script.js">
        angular.module('ngViewExample', ['ngRoute', 'ngAnimate'])
          .config(['$routeProvider', '$locationProvider',
            function($routeProvider, $locationProvider) {
              $routeProvider
                .when('/Book/:bookId', {
                  templateUrl: 'book.html',
                  controller: 'BookCtrl',
                  controllerAs: 'book'
                })
                .when('/Book/:bookId/ch/:chapterId', {
                  templateUrl: 'chapter.html',
                  controller: 'ChapterCtrl',
                  controllerAs: 'chapter'
                });

              $locationProvider.html5Mode(true);
          }])
          .controller('MainCtrl', ['$route', '$routeParams', '$location',
            function($route, $routeParams, $location) {
              this.$route = $route;
              this.$location = $location;
              this.$routeParams = $routeParams;
          }])
          .controller('BookCtrl', ['$routeParams', function($routeParams) {
            this.name = "BookCtrl";
            this.params = $routeParams;
          }])
          .controller('ChapterCtrl', ['$routeParams', function($routeParams) {
            this.name = "ChapterCtrl";
            this.params = $routeParams;
          }]);

      </file>

      <file name="protractor.js" type="protractor">
        it('should load and compile correct template', function() {
          element(by.linkText('Moby: Ch1')).click();
          var content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller\: ChapterCtrl/);
          expect(content).toMatch(/Book Id\: Moby/);
          expect(content).toMatch(/Chapter Id\: 1/);

          element(by.partialLinkText('Scarlet')).click();

          content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller\: BookCtrl/);
          expect(content).toMatch(/Book Id\: Scarlet/);
        });
      </file>
    </example>
 */


/**
 * @ngdoc event
 * @name ngView#$viewContentLoaded
 * @eventType emit on the current ngView scope
 * @description
 * Emitted every time the ngView content is reloaded.
 */
ngViewFactory.$inject = ['$route', '$anchorScroll', '$animate'];
function ngViewFactory($route, $anchorScroll, $animate) {
  return {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentScope,
            currentElement,
            previousLeaveAnimation,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '';

        scope.$on('$routeChangeSuccess', update);
        update();

        function cleanupLastView() {
          if (previousLeaveAnimation) {
            $animate.cancel(previousLeaveAnimation);
            previousLeaveAnimation = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if (currentElement) {
            previousLeaveAnimation = $animate.leave(currentElement);
            previousLeaveAnimation.then(function() {
              previousLeaveAnimation = null;
            });
            currentElement = null;
          }
        }

        function update() {
          var locals = $route.current && $route.current.locals,
              template = locals && locals.$template;

          if (angular.isDefined(template)) {
            var newScope = scope.$new();
            var current = $route.current;

            // Note: This will also link all children of ng-view that were contained in the original
            // html. If that content contains controllers, ... they could pollute/change the scope.
            // However, using ng-view on an element with additional content does not make sense...
            // Note: We can't remove them in the cloneAttchFn of $transclude as that
            // function is called before linking the content, which would apply child
            // directives to non existing elements.
            var clone = $transclude(newScope, function(clone) {
              $animate.enter(clone, null, currentElement || $element).then(function onNgViewEnter() {
                if (angular.isDefined(autoScrollExp)
                  && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                  $anchorScroll();
                }
              });
              cleanupLastView();
            });

            currentElement = clone;
            currentScope = current.scope = newScope;
            currentScope.$emit('$viewContentLoaded');
            currentScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
    }
  };
}

// This directive is called during the $transclude call of the first `ngView` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as ngView
// is called.
ngViewFillContentFactory.$inject = ['$compile', '$controller', '$route'];
function ngViewFillContentFactory($compile, $controller, $route) {
  return {
    restrict: 'ECA',
    priority: -400,
    link: function(scope, $element) {
      var current = $route.current,
          locals = current.locals;

      $element.html(locals.$template);

      var link = $compile($element.contents());

      if (current.controller) {
        locals.$scope = scope;
        var controller = $controller(current.controller, locals);
        if (current.controllerAs) {
          scope[current.controllerAs] = controller;
        }
        $element.data('$ngControllerController', controller);
        $element.children().data('$ngControllerController', controller);
      }
      scope[current.resolveAs || '$resolve'] = locals;

      link(scope);
    }
  };
}


})(window, window.angular);

(function($){var nextId=0;var Filestyle=function(element,options){this.options=options;this.$elementFilestyle=[];this.$element=$(element)};Filestyle.prototype={clear:function(){this.$element.val("");this.$elementFilestyle.find(":text").val("");this.$elementFilestyle.find(".badge").remove()},destroy:function(){this.$element.removeAttr("style").removeData("filestyle");this.$elementFilestyle.remove()},disabled:function(value){if(value===true){if(!this.options.disabled){this.$element.attr("disabled","true");this.$elementFilestyle.find("label").attr("disabled","true");this.options.disabled=true}}else{if(value===false){if(this.options.disabled){this.$element.removeAttr("disabled");this.$elementFilestyle.find("label").removeAttr("disabled");this.options.disabled=false}}else{return this.options.disabled}}},buttonBefore:function(value){if(value===true){if(!this.options.buttonBefore){this.options.buttonBefore=true;if(this.options.input){this.$elementFilestyle.remove();this.constructor();this.pushNameFiles()}}}else{if(value===false){if(this.options.buttonBefore){this.options.buttonBefore=false;if(this.options.input){this.$elementFilestyle.remove();this.constructor();this.pushNameFiles()}}}else{return this.options.buttonBefore}}},icon:function(value){if(value===true){if(!this.options.icon){this.options.icon=true;this.$elementFilestyle.find("label").prepend(this.htmlIcon())}}else{if(value===false){if(this.options.icon){this.options.icon=false;this.$elementFilestyle.find(".icon-span-filestyle").remove()}}else{return this.options.icon}}},input:function(value){if(value===true){if(!this.options.input){this.options.input=true;if(this.options.buttonBefore){this.$elementFilestyle.append(this.htmlInput())}else{this.$elementFilestyle.prepend(this.htmlInput())}this.$elementFilestyle.find(".badge").remove();this.pushNameFiles();this.$elementFilestyle.find(".group-span-filestyle").addClass("input-group-btn")}}else{if(value===false){if(this.options.input){this.options.input=false;this.$elementFilestyle.find(":text").remove();var files=this.pushNameFiles();if(files.length>0&&this.options.badge){this.$elementFilestyle.find("label").append(' <span class="badge">'+files.length+"</span>")}this.$elementFilestyle.find(".group-span-filestyle").removeClass("input-group-btn")}}else{return this.options.input}}},size:function(value){if(value!==undefined){var btn=this.$elementFilestyle.find("label"),input=this.$elementFilestyle.find("input");btn.removeClass("btn-lg btn-sm");input.removeClass("input-lg input-sm");if(value!="nr"){btn.addClass("btn-"+value);input.addClass("input-"+value)}}else{return this.options.size}},placeholder:function(value){if(value!==undefined){this.options.placeholder=value;this.$elementFilestyle.find("input").attr("placeholder",value)}else{return this.options.placeholder}},buttonText:function(value){if(value!==undefined){this.options.buttonText=value;this.$elementFilestyle.find("label .buttonText").html(this.options.buttonText)}else{return this.options.buttonText}},buttonName:function(value){if(value!==undefined){this.options.buttonName=value;this.$elementFilestyle.find("label").attr({"class":"btn "+this.options.buttonName})}else{return this.options.buttonName}},iconName:function(value){if(value!==undefined){this.$elementFilestyle.find(".icon-span-filestyle").attr({"class":"icon-span-filestyle "+this.options.iconName})}else{return this.options.iconName}},htmlIcon:function(){if(this.options.icon){return'<span class="icon-span-filestyle '+this.options.iconName+'"></span> '}else{return""}},htmlInput:function(){if(this.options.input){return'<input type="text" class="form-control '+(this.options.size=="nr"?"":"input-"+this.options.size)+'" placeholder="'+this.options.placeholder+'" disabled> '}else{return""}},pushNameFiles:function(){var content="",files=[];if(this.$element[0].files===undefined){files[0]={name:this.$element[0]&&this.$element[0].value}}else{files=this.$element[0].files}for(var i=0;i<files.length;i++){content+=files[i].name.split("\\").pop()+", "}if(content!==""){this.$elementFilestyle.find(":text").val(content.replace(/\, $/g,""))}else{this.$elementFilestyle.find(":text").val("")}return files},constructor:function(){var _self=this,html="",id=_self.$element.attr("id"),files=[],btn="",$label;if(id===""||!id){id="filestyle-"+nextId;_self.$element.attr({id:id});nextId++}btn='<span class="group-span-filestyle '+(_self.options.input?"input-group-btn":"")+'"><label for="'+id+'" class="btn '+_self.options.buttonName+" "+(_self.options.size=="nr"?"":"btn-"+_self.options.size)+'" '+(_self.options.disabled?'disabled="true"':"")+">"+_self.htmlIcon()+'<span class="buttonText">'+_self.options.buttonText+"</span></label></span>";html=_self.options.buttonBefore?btn+_self.htmlInput():_self.htmlInput()+btn;_self.$elementFilestyle=$('<div class="bootstrap-filestyle input-group">'+html+"</div>");_self.$elementFilestyle.find(".group-span-filestyle").attr("tabindex","0").keypress(function(e){if(e.keyCode===13||e.charCode===32){_self.$elementFilestyle.find("label").click();return false}});_self.$element.css({position:"absolute",clip:"rect(0px 0px 0px 0px)"}).attr("tabindex","-1").after(_self.$elementFilestyle);if(_self.options.disabled){_self.$element.attr("disabled","true")}_self.$element.change(function(){var files=_self.pushNameFiles();if(_self.options.input==false&&_self.options.badge){if(_self.$elementFilestyle.find(".badge").length==0){_self.$elementFilestyle.find("label").append(' <span class="badge">'+files.length+"</span>")}else{if(files.length==0){_self.$elementFilestyle.find(".badge").remove()}else{_self.$elementFilestyle.find(".badge").html(files.length)}}}else{_self.$elementFilestyle.find(".badge").remove()}});if(window.navigator.userAgent.search(/firefox/i)>-1){_self.$elementFilestyle.find("label").click(function(){_self.$element.click();return false})}}};var old=$.fn.filestyle;$.fn.filestyle=function(option,value){var get="",element=this.each(function(){if($(this).attr("type")==="file"){var $this=$(this),data=$this.data("filestyle"),options=$.extend({},$.fn.filestyle.defaults,option,typeof option==="object"&&option);if(!data){$this.data("filestyle",(data=new Filestyle(this,options)));data.constructor()}if(typeof option==="string"){get=data[option](value)}}});if(typeof get!==undefined){return get}else{return element}};$.fn.filestyle.defaults={buttonText:"Choose file",iconName:"glyphicon glyphicon-folder-open",buttonName:"btn-default",size:"nr",input:true,badge:true,icon:true,buttonBefore:false,disabled:false,placeholder:""};$.fn.filestyle.noConflict=function(){$.fn.filestyle=old;return this};$(function(){$(".filestyle").each(function(){var $this=$(this),options={input:$this.attr("data-input")==="false"?false:true,icon:$this.attr("data-icon")==="false"?false:true,buttonBefore:$this.attr("data-buttonBefore")==="true"?true:false,disabled:$this.attr("data-disabled")==="true"?true:false,size:$this.attr("data-size"),buttonText:$this.attr("data-buttonText"),buttonName:$this.attr("data-buttonName"),iconName:$this.attr("data-iconName"),badge:$this.attr("data-badge")==="false"?false:true,placeholder:$this.attr("data-placeholder")};$this.filestyle(options)})})})(window.jQuery);
/*!
 * Bootstrap v3.3.6 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under the MIT license
 */
if("undefined"==typeof jQuery)throw new Error("Bootstrap's JavaScript requires jQuery");+function(a){"use strict";var b=a.fn.jquery.split(" ")[0].split(".");if(b[0]<2&&b[1]<9||1==b[0]&&9==b[1]&&b[2]<1||b[0]>2)throw new Error("Bootstrap's JavaScript requires jQuery version 1.9.1 or higher, but lower than version 3")}(jQuery),+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]};return!1}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one("bsTransitionEnd",function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b(),a.support.transition&&(a.event.special.bsTransitionEnd={bindType:a.support.transition.end,delegateType:a.support.transition.end,handle:function(b){return a(b.target).is(this)?b.handleObj.handler.apply(this,arguments):void 0}})})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var c=a(this),e=c.data("bs.alert");e||c.data("bs.alert",e=new d(this)),"string"==typeof b&&e[b].call(c)})}var c='[data-dismiss="alert"]',d=function(b){a(b).on("click",c,this.close)};d.VERSION="3.3.6",d.TRANSITION_DURATION=150,d.prototype.close=function(b){function c(){g.detach().trigger("closed.bs.alert").remove()}var e=a(this),f=e.attr("data-target");f||(f=e.attr("href"),f=f&&f.replace(/.*(?=#[^\s]*$)/,""));var g=a(f);b&&b.preventDefault(),g.length||(g=e.closest(".alert")),g.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(g.removeClass("in"),a.support.transition&&g.hasClass("fade")?g.one("bsTransitionEnd",c).emulateTransitionEnd(d.TRANSITION_DURATION):c())};var e=a.fn.alert;a.fn.alert=b,a.fn.alert.Constructor=d,a.fn.alert.noConflict=function(){return a.fn.alert=e,this},a(document).on("click.bs.alert.data-api",c,d.prototype.close)}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof b&&b;e||d.data("bs.button",e=new c(this,f)),"toggle"==b?e.toggle():b&&e.setState(b)})}var c=function(b,d){this.$element=a(b),this.options=a.extend({},c.DEFAULTS,d),this.isLoading=!1};c.VERSION="3.3.6",c.DEFAULTS={loadingText:"loading..."},c.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",null==f.resetText&&d.data("resetText",d[e]()),setTimeout(a.proxy(function(){d[e](null==f[b]?this.options[b]:f[b]),"loadingText"==b?(this.isLoading=!0,d.addClass(c).attr(c,c)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c))},this),0)},c.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");"radio"==c.prop("type")?(c.prop("checked")&&(a=!1),b.find(".active").removeClass("active"),this.$element.addClass("active")):"checkbox"==c.prop("type")&&(c.prop("checked")!==this.$element.hasClass("active")&&(a=!1),this.$element.toggleClass("active")),c.prop("checked",this.$element.hasClass("active")),a&&c.trigger("change")}else this.$element.attr("aria-pressed",!this.$element.hasClass("active")),this.$element.toggleClass("active")};var d=a.fn.button;a.fn.button=b,a.fn.button.Constructor=c,a.fn.button.noConflict=function(){return a.fn.button=d,this},a(document).on("click.bs.button.data-api",'[data-toggle^="button"]',function(c){var d=a(c.target);d.hasClass("btn")||(d=d.closest(".btn")),b.call(d,"toggle"),a(c.target).is('input[type="radio"]')||a(c.target).is('input[type="checkbox"]')||c.preventDefault()}).on("focus.bs.button.data-api blur.bs.button.data-api",'[data-toggle^="button"]',function(b){a(b.target).closest(".btn").toggleClass("focus",/^focus(in)?$/.test(b.type))})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},c.DEFAULTS,d.data(),"object"==typeof b&&b),g="string"==typeof b?b:f.slide;e||d.data("bs.carousel",e=new c(this,f)),"number"==typeof b?e.to(b):g?e[g]():f.interval&&e.pause().cycle()})}var c=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=null,this.sliding=null,this.interval=null,this.$active=null,this.$items=null,this.options.keyboard&&this.$element.on("keydown.bs.carousel",a.proxy(this.keydown,this)),"hover"==this.options.pause&&!("ontouchstart"in document.documentElement)&&this.$element.on("mouseenter.bs.carousel",a.proxy(this.pause,this)).on("mouseleave.bs.carousel",a.proxy(this.cycle,this))};c.VERSION="3.3.6",c.TRANSITION_DURATION=600,c.DEFAULTS={interval:5e3,pause:"hover",wrap:!0,keyboard:!0},c.prototype.keydown=function(a){if(!/input|textarea/i.test(a.target.tagName)){switch(a.which){case 37:this.prev();break;case 39:this.next();break;default:return}a.preventDefault()}},c.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},c.prototype.getItemIndex=function(a){return this.$items=a.parent().children(".item"),this.$items.index(a||this.$active)},c.prototype.getItemForDirection=function(a,b){var c=this.getItemIndex(b),d="prev"==a&&0===c||"next"==a&&c==this.$items.length-1;if(d&&!this.options.wrap)return b;var e="prev"==a?-1:1,f=(c+e)%this.$items.length;return this.$items.eq(f)},c.prototype.to=function(a){var b=this,c=this.getItemIndex(this.$active=this.$element.find(".item.active"));return a>this.$items.length-1||0>a?void 0:this.sliding?this.$element.one("slid.bs.carousel",function(){b.to(a)}):c==a?this.pause().cycle():this.slide(a>c?"next":"prev",this.$items.eq(a))},c.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},c.prototype.next=function(){return this.sliding?void 0:this.slide("next")},c.prototype.prev=function(){return this.sliding?void 0:this.slide("prev")},c.prototype.slide=function(b,d){var e=this.$element.find(".item.active"),f=d||this.getItemForDirection(b,e),g=this.interval,h="next"==b?"left":"right",i=this;if(f.hasClass("active"))return this.sliding=!1;var j=f[0],k=a.Event("slide.bs.carousel",{relatedTarget:j,direction:h});if(this.$element.trigger(k),!k.isDefaultPrevented()){if(this.sliding=!0,g&&this.pause(),this.$indicators.length){this.$indicators.find(".active").removeClass("active");var l=a(this.$indicators.children()[this.getItemIndex(f)]);l&&l.addClass("active")}var m=a.Event("slid.bs.carousel",{relatedTarget:j,direction:h});return a.support.transition&&this.$element.hasClass("slide")?(f.addClass(b),f[0].offsetWidth,e.addClass(h),f.addClass(h),e.one("bsTransitionEnd",function(){f.removeClass([b,h].join(" ")).addClass("active"),e.removeClass(["active",h].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger(m)},0)}).emulateTransitionEnd(c.TRANSITION_DURATION)):(e.removeClass("active"),f.addClass("active"),this.sliding=!1,this.$element.trigger(m)),g&&this.cycle(),this}};var d=a.fn.carousel;a.fn.carousel=b,a.fn.carousel.Constructor=c,a.fn.carousel.noConflict=function(){return a.fn.carousel=d,this};var e=function(c){var d,e=a(this),f=a(e.attr("data-target")||(d=e.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,""));if(f.hasClass("carousel")){var g=a.extend({},f.data(),e.data()),h=e.attr("data-slide-to");h&&(g.interval=!1),b.call(f,g),h&&f.data("bs.carousel").to(h),c.preventDefault()}};a(document).on("click.bs.carousel.data-api","[data-slide]",e).on("click.bs.carousel.data-api","[data-slide-to]",e),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var c=a(this);b.call(c,c.data())})})}(jQuery),+function(a){"use strict";function b(b){var c,d=b.attr("data-target")||(c=b.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"");return a(d)}function c(b){return this.each(function(){var c=a(this),e=c.data("bs.collapse"),f=a.extend({},d.DEFAULTS,c.data(),"object"==typeof b&&b);!e&&f.toggle&&/show|hide/.test(b)&&(f.toggle=!1),e||c.data("bs.collapse",e=new d(this,f)),"string"==typeof b&&e[b]()})}var d=function(b,c){this.$element=a(b),this.options=a.extend({},d.DEFAULTS,c),this.$trigger=a('[data-toggle="collapse"][href="#'+b.id+'"],[data-toggle="collapse"][data-target="#'+b.id+'"]'),this.transitioning=null,this.options.parent?this.$parent=this.getParent():this.addAriaAndCollapsedClass(this.$element,this.$trigger),this.options.toggle&&this.toggle()};d.VERSION="3.3.6",d.TRANSITION_DURATION=350,d.DEFAULTS={toggle:!0},d.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},d.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b,e=this.$parent&&this.$parent.children(".panel").children(".in, .collapsing");if(!(e&&e.length&&(b=e.data("bs.collapse"),b&&b.transitioning))){var f=a.Event("show.bs.collapse");if(this.$element.trigger(f),!f.isDefaultPrevented()){e&&e.length&&(c.call(e,"hide"),b||e.data("bs.collapse",null));var g=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[g](0).attr("aria-expanded",!0),this.$trigger.removeClass("collapsed").attr("aria-expanded",!0),this.transitioning=1;var h=function(){this.$element.removeClass("collapsing").addClass("collapse in")[g](""),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return h.call(this);var i=a.camelCase(["scroll",g].join("-"));this.$element.one("bsTransitionEnd",a.proxy(h,this)).emulateTransitionEnd(d.TRANSITION_DURATION)[g](this.$element[0][i])}}}},d.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse in").attr("aria-expanded",!1),this.$trigger.addClass("collapsed").attr("aria-expanded",!1),this.transitioning=1;var e=function(){this.transitioning=0,this.$element.removeClass("collapsing").addClass("collapse").trigger("hidden.bs.collapse")};return a.support.transition?void this.$element[c](0).one("bsTransitionEnd",a.proxy(e,this)).emulateTransitionEnd(d.TRANSITION_DURATION):e.call(this)}}},d.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()},d.prototype.getParent=function(){return a(this.options.parent).find('[data-toggle="collapse"][data-parent="'+this.options.parent+'"]').each(a.proxy(function(c,d){var e=a(d);this.addAriaAndCollapsedClass(b(e),e)},this)).end()},d.prototype.addAriaAndCollapsedClass=function(a,b){var c=a.hasClass("in");a.attr("aria-expanded",c),b.toggleClass("collapsed",!c).attr("aria-expanded",c)};var e=a.fn.collapse;a.fn.collapse=c,a.fn.collapse.Constructor=d,a.fn.collapse.noConflict=function(){return a.fn.collapse=e,this},a(document).on("click.bs.collapse.data-api",'[data-toggle="collapse"]',function(d){var e=a(this);e.attr("data-target")||d.preventDefault();var f=b(e),g=f.data("bs.collapse"),h=g?"toggle":e.data();c.call(f,h)})}(jQuery),+function(a){"use strict";function b(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#[A-Za-z]/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}function c(c){c&&3===c.which||(a(e).remove(),a(f).each(function(){var d=a(this),e=b(d),f={relatedTarget:this};e.hasClass("open")&&(c&&"click"==c.type&&/input|textarea/i.test(c.target.tagName)&&a.contains(e[0],c.target)||(e.trigger(c=a.Event("hide.bs.dropdown",f)),c.isDefaultPrevented()||(d.attr("aria-expanded","false"),e.removeClass("open").trigger(a.Event("hidden.bs.dropdown",f)))))}))}function d(b){return this.each(function(){var c=a(this),d=c.data("bs.dropdown");d||c.data("bs.dropdown",d=new g(this)),"string"==typeof b&&d[b].call(c)})}var e=".dropdown-backdrop",f='[data-toggle="dropdown"]',g=function(b){a(b).on("click.bs.dropdown",this.toggle)};g.VERSION="3.3.6",g.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=b(e),g=f.hasClass("open");if(c(),!g){"ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a(document.createElement("div")).addClass("dropdown-backdrop").insertAfter(a(this)).on("click",c);var h={relatedTarget:this};if(f.trigger(d=a.Event("show.bs.dropdown",h)),d.isDefaultPrevented())return;e.trigger("focus").attr("aria-expanded","true"),f.toggleClass("open").trigger(a.Event("shown.bs.dropdown",h))}return!1}},g.prototype.keydown=function(c){if(/(38|40|27|32)/.test(c.which)&&!/input|textarea/i.test(c.target.tagName)){var d=a(this);if(c.preventDefault(),c.stopPropagation(),!d.is(".disabled, :disabled")){var e=b(d),g=e.hasClass("open");if(!g&&27!=c.which||g&&27==c.which)return 27==c.which&&e.find(f).trigger("focus"),d.trigger("click");var h=" li:not(.disabled):visible a",i=e.find(".dropdown-menu"+h);if(i.length){var j=i.index(c.target);38==c.which&&j>0&&j--,40==c.which&&j<i.length-1&&j++,~j||(j=0),i.eq(j).trigger("focus")}}}};var h=a.fn.dropdown;a.fn.dropdown=d,a.fn.dropdown.Constructor=g,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=h,this},a(document).on("click.bs.dropdown.data-api",c).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",f,g.prototype.toggle).on("keydown.bs.dropdown.data-api",f,g.prototype.keydown).on("keydown.bs.dropdown.data-api",".dropdown-menu",g.prototype.keydown)}(jQuery),+function(a){"use strict";function b(b,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},c.DEFAULTS,e.data(),"object"==typeof b&&b);f||e.data("bs.modal",f=new c(this,g)),"string"==typeof b?f[b](d):g.show&&f.show(d)})}var c=function(b,c){this.options=c,this.$body=a(document.body),this.$element=a(b),this.$dialog=this.$element.find(".modal-dialog"),this.$backdrop=null,this.isShown=null,this.originalBodyPad=null,this.scrollbarWidth=0,this.ignoreBackdropClick=!1,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};c.VERSION="3.3.6",c.TRANSITION_DURATION=300,c.BACKDROP_TRANSITION_DURATION=150,c.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},c.prototype.toggle=function(a){return this.isShown?this.hide():this.show(a)},c.prototype.show=function(b){var d=this,e=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(e),this.isShown||e.isDefaultPrevented()||(this.isShown=!0,this.checkScrollbar(),this.setScrollbar(),this.$body.addClass("modal-open"),this.escape(),this.resize(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.$dialog.on("mousedown.dismiss.bs.modal",function(){d.$element.one("mouseup.dismiss.bs.modal",function(b){a(b.target).is(d.$element)&&(d.ignoreBackdropClick=!0)})}),this.backdrop(function(){var e=a.support.transition&&d.$element.hasClass("fade");d.$element.parent().length||d.$element.appendTo(d.$body),d.$element.show().scrollTop(0),d.adjustDialog(),e&&d.$element[0].offsetWidth,d.$element.addClass("in"),d.enforceFocus();var f=a.Event("shown.bs.modal",{relatedTarget:b});e?d.$dialog.one("bsTransitionEnd",function(){d.$element.trigger("focus").trigger(f)}).emulateTransitionEnd(c.TRANSITION_DURATION):d.$element.trigger("focus").trigger(f)}))},c.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),this.resize(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").off("click.dismiss.bs.modal").off("mouseup.dismiss.bs.modal"),this.$dialog.off("mousedown.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one("bsTransitionEnd",a.proxy(this.hideModal,this)).emulateTransitionEnd(c.TRANSITION_DURATION):this.hideModal())},c.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.trigger("focus")},this))},c.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keydown.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keydown.dismiss.bs.modal")},c.prototype.resize=function(){this.isShown?a(window).on("resize.bs.modal",a.proxy(this.handleUpdate,this)):a(window).off("resize.bs.modal")},c.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.$body.removeClass("modal-open"),a.resetAdjustments(),a.resetScrollbar(),a.$element.trigger("hidden.bs.modal")})},c.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},c.prototype.backdrop=function(b){var d=this,e=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var f=a.support.transition&&e;if(this.$backdrop=a(document.createElement("div")).addClass("modal-backdrop "+e).appendTo(this.$body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){return this.ignoreBackdropClick?void(this.ignoreBackdropClick=!1):void(a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus():this.hide()))},this)),f&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;f?this.$backdrop.one("bsTransitionEnd",b).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION):b()}else if(!this.isShown&&this.$backdrop){this.$backdrop.removeClass("in");var g=function(){d.removeBackdrop(),b&&b()};a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one("bsTransitionEnd",g).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION):g()}else b&&b()},c.prototype.handleUpdate=function(){this.adjustDialog()},c.prototype.adjustDialog=function(){var a=this.$element[0].scrollHeight>document.documentElement.clientHeight;this.$element.css({paddingLeft:!this.bodyIsOverflowing&&a?this.scrollbarWidth:"",paddingRight:this.bodyIsOverflowing&&!a?this.scrollbarWidth:""})},c.prototype.resetAdjustments=function(){this.$element.css({paddingLeft:"",paddingRight:""})},c.prototype.checkScrollbar=function(){var a=window.innerWidth;if(!a){var b=document.documentElement.getBoundingClientRect();a=b.right-Math.abs(b.left)}this.bodyIsOverflowing=document.body.clientWidth<a,this.scrollbarWidth=this.measureScrollbar()},c.prototype.setScrollbar=function(){var a=parseInt(this.$body.css("padding-right")||0,10);this.originalBodyPad=document.body.style.paddingRight||"",this.bodyIsOverflowing&&this.$body.css("padding-right",a+this.scrollbarWidth)},c.prototype.resetScrollbar=function(){this.$body.css("padding-right",this.originalBodyPad)},c.prototype.measureScrollbar=function(){var a=document.createElement("div");a.className="modal-scrollbar-measure",this.$body.append(a);var b=a.offsetWidth-a.clientWidth;return this.$body[0].removeChild(a),b};var d=a.fn.modal;a.fn.modal=b,a.fn.modal.Constructor=c,a.fn.modal.noConflict=function(){return a.fn.modal=d,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(c){var d=a(this),e=d.attr("href"),f=a(d.attr("data-target")||e&&e.replace(/.*(?=#[^\s]+$)/,"")),g=f.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(e)&&e},f.data(),d.data());d.is("a")&&c.preventDefault(),f.one("show.bs.modal",function(a){a.isDefaultPrevented()||f.one("hidden.bs.modal",function(){d.is(":visible")&&d.trigger("focus")})}),b.call(f,g,this)})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof b&&b;(e||!/destroy|hide/.test(b))&&(e||d.data("bs.tooltip",e=new c(this,f)),"string"==typeof b&&e[b]())})}var c=function(a,b){this.type=null,this.options=null,this.enabled=null,this.timeout=null,this.hoverState=null,this.$element=null,this.inState=null,this.init("tooltip",a,b)};c.VERSION="3.3.6",c.TRANSITION_DURATION=150,c.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1,viewport:{selector:"body",padding:0}},c.prototype.init=function(b,c,d){if(this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d),this.$viewport=this.options.viewport&&a(a.isFunction(this.options.viewport)?this.options.viewport.call(this,this.$element):this.options.viewport.selector||this.options.viewport),this.inState={click:!1,hover:!1,focus:!1},this.$element[0]instanceof document.constructor&&!this.options.selector)throw new Error("`selector` option must be specified when initializing "+this.type+" on the window.document object!");for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focusin",i="hover"==g?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},c.prototype.getDefaults=function(){return c.DEFAULTS},c.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},c.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},c.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget).data("bs."+this.type);return c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c)),b instanceof a.Event&&(c.inState["focusin"==b.type?"focus":"hover"]=!0),c.tip().hasClass("in")||"in"==c.hoverState?void(c.hoverState="in"):(clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?void(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show)):c.show())},c.prototype.isInStateTrue=function(){for(var a in this.inState)if(this.inState[a])return!0;return!1},c.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget).data("bs."+this.type);return c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c)),b instanceof a.Event&&(c.inState["focusout"==b.type?"focus":"hover"]=!1),c.isInStateTrue()?void 0:(clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?void(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide)):c.hide())},c.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){this.$element.trigger(b);var d=a.contains(this.$element[0].ownerDocument.documentElement,this.$element[0]);if(b.isDefaultPrevented()||!d)return;var e=this,f=this.tip(),g=this.getUID(this.type);this.setContent(),f.attr("id",g),this.$element.attr("aria-describedby",g),this.options.animation&&f.addClass("fade");var h="function"==typeof this.options.placement?this.options.placement.call(this,f[0],this.$element[0]):this.options.placement,i=/\s?auto?\s?/i,j=i.test(h);j&&(h=h.replace(i,"")||"top"),f.detach().css({top:0,left:0,display:"block"}).addClass(h).data("bs."+this.type,this),this.options.container?f.appendTo(this.options.container):f.insertAfter(this.$element),this.$element.trigger("inserted.bs."+this.type);var k=this.getPosition(),l=f[0].offsetWidth,m=f[0].offsetHeight;if(j){var n=h,o=this.getPosition(this.$viewport);h="bottom"==h&&k.bottom+m>o.bottom?"top":"top"==h&&k.top-m<o.top?"bottom":"right"==h&&k.right+l>o.width?"left":"left"==h&&k.left-l<o.left?"right":h,f.removeClass(n).addClass(h)}var p=this.getCalculatedOffset(h,k,l,m);this.applyPlacement(p,h);var q=function(){var a=e.hoverState;e.$element.trigger("shown.bs."+e.type),e.hoverState=null,"out"==a&&e.leave(e)};a.support.transition&&this.$tip.hasClass("fade")?f.one("bsTransitionEnd",q).emulateTransitionEnd(c.TRANSITION_DURATION):q()}},c.prototype.applyPlacement=function(b,c){var d=this.tip(),e=d[0].offsetWidth,f=d[0].offsetHeight,g=parseInt(d.css("margin-top"),10),h=parseInt(d.css("margin-left"),10);isNaN(g)&&(g=0),isNaN(h)&&(h=0),b.top+=g,b.left+=h,a.offset.setOffset(d[0],a.extend({using:function(a){d.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),d.addClass("in");var i=d[0].offsetWidth,j=d[0].offsetHeight;"top"==c&&j!=f&&(b.top=b.top+f-j);var k=this.getViewportAdjustedDelta(c,b,i,j);k.left?b.left+=k.left:b.top+=k.top;var l=/top|bottom/.test(c),m=l?2*k.left-e+i:2*k.top-f+j,n=l?"offsetWidth":"offsetHeight";d.offset(b),this.replaceArrow(m,d[0][n],l)},c.prototype.replaceArrow=function(a,b,c){this.arrow().css(c?"left":"top",50*(1-a/b)+"%").css(c?"top":"left","")},c.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},c.prototype.hide=function(b){function d(){"in"!=e.hoverState&&f.detach(),e.$element.removeAttr("aria-describedby").trigger("hidden.bs."+e.type),b&&b()}var e=this,f=a(this.$tip),g=a.Event("hide.bs."+this.type);return this.$element.trigger(g),g.isDefaultPrevented()?void 0:(f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one("bsTransitionEnd",d).emulateTransitionEnd(c.TRANSITION_DURATION):d(),this.hoverState=null,this)},c.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},c.prototype.hasContent=function(){return this.getTitle()},c.prototype.getPosition=function(b){b=b||this.$element;var c=b[0],d="BODY"==c.tagName,e=c.getBoundingClientRect();null==e.width&&(e=a.extend({},e,{width:e.right-e.left,height:e.bottom-e.top}));var f=d?{top:0,left:0}:b.offset(),g={scroll:d?document.documentElement.scrollTop||document.body.scrollTop:b.scrollTop()},h=d?{width:a(window).width(),height:a(window).height()}:null;return a.extend({},e,g,h,f)},c.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},c.prototype.getViewportAdjustedDelta=function(a,b,c,d){var e={top:0,left:0};if(!this.$viewport)return e;var f=this.options.viewport&&this.options.viewport.padding||0,g=this.getPosition(this.$viewport);if(/right|left/.test(a)){var h=b.top-f-g.scroll,i=b.top+f-g.scroll+d;h<g.top?e.top=g.top-h:i>g.top+g.height&&(e.top=g.top+g.height-i)}else{var j=b.left-f,k=b.left+f+c;j<g.left?e.left=g.left-j:k>g.right&&(e.left=g.left+g.width-k)}return e},c.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},c.prototype.getUID=function(a){do a+=~~(1e6*Math.random());while(document.getElementById(a));return a},c.prototype.tip=function(){if(!this.$tip&&(this.$tip=a(this.options.template),1!=this.$tip.length))throw new Error(this.type+" `template` option must consist of exactly 1 top-level element!");return this.$tip},c.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},c.prototype.enable=function(){this.enabled=!0},c.prototype.disable=function(){this.enabled=!1},c.prototype.toggleEnabled=function(){this.enabled=!this.enabled},c.prototype.toggle=function(b){var c=this;b&&(c=a(b.currentTarget).data("bs."+this.type),c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c))),b?(c.inState.click=!c.inState.click,c.isInStateTrue()?c.enter(c):c.leave(c)):c.tip().hasClass("in")?c.leave(c):c.enter(c)},c.prototype.destroy=function(){var a=this;clearTimeout(this.timeout),this.hide(function(){a.$element.off("."+a.type).removeData("bs."+a.type),a.$tip&&a.$tip.detach(),a.$tip=null,a.$arrow=null,a.$viewport=null})};var d=a.fn.tooltip;a.fn.tooltip=b,a.fn.tooltip.Constructor=c,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=d,this}}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof b&&b;(e||!/destroy|hide/.test(b))&&(e||d.data("bs.popover",e=new c(this,f)),"string"==typeof b&&e[b]())})}var c=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");c.VERSION="3.3.6",c.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),c.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),c.prototype.constructor=c,c.prototype.getDefaults=function(){return c.DEFAULTS},c.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content").children().detach().end()[this.options.html?"string"==typeof c?"html":"append":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},c.prototype.hasContent=function(){return this.getTitle()||this.getContent()},c.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},c.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")};var d=a.fn.popover;a.fn.popover=b,a.fn.popover.Constructor=c,a.fn.popover.noConflict=function(){return a.fn.popover=d,this}}(jQuery),+function(a){"use strict";function b(c,d){this.$body=a(document.body),this.$scrollElement=a(a(c).is(document.body)?window:c),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||"")+" .nav li > a",this.offsets=[],this.targets=[],this.activeTarget=null,this.scrollHeight=0,this.$scrollElement.on("scroll.bs.scrollspy",a.proxy(this.process,this)),this.refresh(),this.process()}function c(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})}b.VERSION="3.3.6",b.DEFAULTS={offset:10},b.prototype.getScrollHeight=function(){return this.$scrollElement[0].scrollHeight||Math.max(this.$body[0].scrollHeight,document.documentElement.scrollHeight)},b.prototype.refresh=function(){var b=this,c="offset",d=0;this.offsets=[],this.targets=[],this.scrollHeight=this.getScrollHeight(),a.isWindow(this.$scrollElement[0])||(c="position",d=this.$scrollElement.scrollTop()),this.$body.find(this.selector).map(function(){var b=a(this),e=b.data("target")||b.attr("href"),f=/^#./.test(e)&&a(e);return f&&f.length&&f.is(":visible")&&[[f[c]().top+d,e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){b.offsets.push(this[0]),b.targets.push(this[1])})},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.getScrollHeight(),d=this.options.offset+c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(this.scrollHeight!=c&&this.refresh(),b>=d)return g!=(a=f[f.length-1])&&this.activate(a);if(g&&b<e[0])return this.activeTarget=null,this.clear();for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(void 0===e[a+1]||b<e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){this.activeTarget=b,this.clear();var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");
d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate.bs.scrollspy")},b.prototype.clear=function(){a(this.selector).parentsUntil(this.options.target,".active").removeClass("active")};var d=a.fn.scrollspy;a.fn.scrollspy=c,a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=d,this},a(window).on("load.bs.scrollspy.data-api",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);c.call(b,b.data())})})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new c(this)),"string"==typeof b&&e[b]()})}var c=function(b){this.element=a(b)};c.VERSION="3.3.6",c.TRANSITION_DURATION=150,c.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a"),f=a.Event("hide.bs.tab",{relatedTarget:b[0]}),g=a.Event("show.bs.tab",{relatedTarget:e[0]});if(e.trigger(f),b.trigger(g),!g.isDefaultPrevented()&&!f.isDefaultPrevented()){var h=a(d);this.activate(b.closest("li"),c),this.activate(h,h.parent(),function(){e.trigger({type:"hidden.bs.tab",relatedTarget:b[0]}),b.trigger({type:"shown.bs.tab",relatedTarget:e[0]})})}}},c.prototype.activate=function(b,d,e){function f(){g.removeClass("active").find("> .dropdown-menu > .active").removeClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!1),b.addClass("active").find('[data-toggle="tab"]').attr("aria-expanded",!0),h?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu").length&&b.closest("li.dropdown").addClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!0),e&&e()}var g=d.find("> .active"),h=e&&a.support.transition&&(g.length&&g.hasClass("fade")||!!d.find("> .fade").length);g.length&&h?g.one("bsTransitionEnd",f).emulateTransitionEnd(c.TRANSITION_DURATION):f(),g.removeClass("in")};var d=a.fn.tab;a.fn.tab=b,a.fn.tab.Constructor=c,a.fn.tab.noConflict=function(){return a.fn.tab=d,this};var e=function(c){c.preventDefault(),b.call(a(this),"show")};a(document).on("click.bs.tab.data-api",'[data-toggle="tab"]',e).on("click.bs.tab.data-api",'[data-toggle="pill"]',e)}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof b&&b;e||d.data("bs.affix",e=new c(this,f)),"string"==typeof b&&e[b]()})}var c=function(b,d){this.options=a.extend({},c.DEFAULTS,d),this.$target=a(this.options.target).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(b),this.affixed=null,this.unpin=null,this.pinnedOffset=null,this.checkPosition()};c.VERSION="3.3.6",c.RESET="affix affix-top affix-bottom",c.DEFAULTS={offset:0,target:window},c.prototype.getState=function(a,b,c,d){var e=this.$target.scrollTop(),f=this.$element.offset(),g=this.$target.height();if(null!=c&&"top"==this.affixed)return c>e?"top":!1;if("bottom"==this.affixed)return null!=c?e+this.unpin<=f.top?!1:"bottom":a-d>=e+g?!1:"bottom";var h=null==this.affixed,i=h?e:f.top,j=h?g:b;return null!=c&&c>=e?"top":null!=d&&i+j>=a-d?"bottom":!1},c.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(c.RESET).addClass("affix");var a=this.$target.scrollTop(),b=this.$element.offset();return this.pinnedOffset=b.top-a},c.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},c.prototype.checkPosition=function(){if(this.$element.is(":visible")){var b=this.$element.height(),d=this.options.offset,e=d.top,f=d.bottom,g=Math.max(a(document).height(),a(document.body).height());"object"!=typeof d&&(f=e=d),"function"==typeof e&&(e=d.top(this.$element)),"function"==typeof f&&(f=d.bottom(this.$element));var h=this.getState(g,b,e,f);if(this.affixed!=h){null!=this.unpin&&this.$element.css("top","");var i="affix"+(h?"-"+h:""),j=a.Event(i+".bs.affix");if(this.$element.trigger(j),j.isDefaultPrevented())return;this.affixed=h,this.unpin="bottom"==h?this.getPinnedOffset():null,this.$element.removeClass(c.RESET).addClass(i).trigger(i.replace("affix","affixed")+".bs.affix")}"bottom"==h&&this.$element.offset({top:g-b-f})}};var d=a.fn.affix;a.fn.affix=b,a.fn.affix.Constructor=c,a.fn.affix.noConflict=function(){return a.fn.affix=d,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var c=a(this),d=c.data();d.offset=d.offset||{},null!=d.offsetBottom&&(d.offset.bottom=d.offsetBottom),null!=d.offsetTop&&(d.offset.top=d.offsetTop),b.call(c,d)})})}(jQuery);
/*!
 * angular-ui-mask
 * https://github.com/angular-ui/ui-mask
 * Version: 1.8.5 - 2016-06-10T16:53:59.510Z
 * License: MIT
 */


(function () { 
'use strict';
/*
 Attaches input mask onto input element
 */
angular.module('ui.mask', [])
        .value('uiMaskConfig', {
            maskDefinitions: {
                '9': /\d/,
                'A': /[a-zA-Z]/,
                '*': /[a-zA-Z0-9]/
            },
            clearOnBlur: true,
            clearOnBlurPlaceholder: false,
            escChar: '\\',
            eventsToHandle: ['input', 'keyup', 'click', 'focus'],
            addDefaultPlaceholder: true,
            allowInvalidValue: false
        })
        .provider('uiMask.Config', function() {
            var options = {};

            this.maskDefinitions = function(maskDefinitions) {
                return options.maskDefinitions = maskDefinitions;
            };
            this.clearOnBlur = function(clearOnBlur) {
                return options.clearOnBlur = clearOnBlur;
            };
            this.clearOnBlurPlaceholder = function(clearOnBlurPlaceholder) {
                return options.clearOnBlurPlaceholder = clearOnBlurPlaceholder;
            };
            this.eventsToHandle = function(eventsToHandle) {
                return options.eventsToHandle = eventsToHandle;
            };
            this.addDefaultPlaceholder = function(addDefaultPlaceholder) {
                return options.addDefaultPlaceholder = addDefaultPlaceholder;
            };
            this.allowInvalidValue = function(allowInvalidValue) {
                return options.allowInvalidValue = allowInvalidValue;
            };
            this.$get = ['uiMaskConfig', function(uiMaskConfig) {
                var tempOptions = uiMaskConfig;
                for(var prop in options) {
                    if (angular.isObject(options[prop]) && !angular.isArray(options[prop])) {
                        angular.extend(tempOptions[prop], options[prop]);
                    } else {
                        tempOptions[prop] = options[prop];
                    }
                }

                return tempOptions;
            }];
        })
        .directive('uiMask', ['uiMask.Config', function(maskConfig) {
                function isFocused (elem) {
                  return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                }

                return {
                    priority: 100,
                    require: 'ngModel',
                    restrict: 'A',
                    compile: function uiMaskCompilingFunction() {
                        var options = angular.copy(maskConfig);

                        return function uiMaskLinkingFunction(scope, iElement, iAttrs, controller) {
                            var maskProcessed = false, eventsBound = false,
                                    maskCaretMap, maskPatterns, maskPlaceholder, maskComponents,
                                    // Minimum required length of the value to be considered valid
                                    minRequiredLength,
                                    value, valueMasked, isValid,
                                    // Vars for initializing/uninitializing
                                    originalPlaceholder = iAttrs.placeholder,
                                    originalMaxlength = iAttrs.maxlength,
                                    // Vars used exclusively in eventHandler()
                                    oldValue, oldValueUnmasked, oldCaretPosition, oldSelectionLength,
                                    // Used for communicating if a backspace operation should be allowed between
                                    // keydownHandler and eventHandler
                                    preventBackspace;

                            var originalIsEmpty = controller.$isEmpty;
                            controller.$isEmpty = function(value) {
                                if (maskProcessed) {
                                    return originalIsEmpty(unmaskValue(value || ''));
                                } else {
                                    return originalIsEmpty(value);
                                }
                            };

                            function initialize(maskAttr) {
                                if (!angular.isDefined(maskAttr)) {
                                    return uninitialize();
                                }
                                processRawMask(maskAttr);
                                if (!maskProcessed) {
                                    return uninitialize();
                                }
                                initializeElement();
                                bindEventListeners();
                                return true;
                            }

                            function initPlaceholder(placeholderAttr) {
                                if ( ! placeholderAttr) {
                                    return;
                                }

                                maskPlaceholder = placeholderAttr;

                                // If the mask is processed, then we need to update the value
                                // but don't set the value if there is nothing entered into the element
                                // and there is a placeholder attribute on the element because that
                                // will only set the value as the blank maskPlaceholder
                                // and override the placeholder on the element
                                if (maskProcessed && !(iElement.val().length === 0 && angular.isDefined(iAttrs.placeholder))) {
                                    iElement.val(maskValue(unmaskValue(iElement.val())));
                                }
                            }

                            function initPlaceholderChar() {
                                return initialize(iAttrs.uiMask);
                            }

                            var modelViewValue = false;
                            iAttrs.$observe('modelViewValue', function(val) {
                                if (val === 'true') {
                                    modelViewValue = true;
                                }
                            });

                            iAttrs.$observe('allowInvalidValue', function(val) {
                                linkOptions.allowInvalidValue = val === ''
                                    ? true
                                    : !!val;
                                formatter(controller.$modelValue);
                            });

                            function formatter(fromModelValue) {
                                if (!maskProcessed) {
                                    return fromModelValue;
                                }
                                value = unmaskValue(fromModelValue || '');
                                isValid = validateValue(value);
                                controller.$setValidity('mask', isValid);

                                if (!value.length) return undefined;
                                if (isValid || linkOptions.allowInvalidValue) {
                                    return maskValue(value);
                                } else {
                                    return undefined;
                                }
                            }

                            function parser(fromViewValue) {
                                if (!maskProcessed) {
                                    return fromViewValue;
                                }
                                value = unmaskValue(fromViewValue || '');
                                isValid = validateValue(value);
                                // We have to set viewValue manually as the reformatting of the input
                                // value performed by eventHandler() doesn't happen until after
                                // this parser is called, which causes what the user sees in the input
                                // to be out-of-sync with what the controller's $viewValue is set to.
                                controller.$viewValue = value.length ? maskValue(value) : '';
                                controller.$setValidity('mask', isValid);

                                if (isValid || linkOptions.allowInvalidValue) {
                                    return modelViewValue ? controller.$viewValue : value;
                                }
                            }

                            var linkOptions = {};

                            if (iAttrs.uiOptions) {
                                linkOptions = scope.$eval('[' + iAttrs.uiOptions + ']');
                                if (angular.isObject(linkOptions[0])) {
                                    // we can't use angular.copy nor angular.extend, they lack the power to do a deep merge
                                    linkOptions = (function(original, current) {
                                        for (var i in original) {
                                            if (Object.prototype.hasOwnProperty.call(original, i)) {
                                                if (current[i] === undefined) {
                                                    current[i] = angular.copy(original[i]);
                                                } else {
                                                    if (angular.isObject(current[i]) && !angular.isArray(current[i])) {
                                                        current[i] = angular.extend({}, original[i], current[i]);
                                                    }
                                                }
                                            }
                                        }
                                        return current;
                                    })(options, linkOptions[0]);
                                } else {
                                    linkOptions = options;  //gotta be a better way to do this..
                                }
                            } else {
                                linkOptions = options;
                            }

                            iAttrs.$observe('uiMask', initialize);
                            if (angular.isDefined(iAttrs.uiMaskPlaceholder)) {
                                iAttrs.$observe('uiMaskPlaceholder', initPlaceholder);
                            }
                            else {
                                iAttrs.$observe('placeholder', initPlaceholder);
                            }
                            if (angular.isDefined(iAttrs.uiMaskPlaceholderChar)) {
                                iAttrs.$observe('uiMaskPlaceholderChar', initPlaceholderChar);
                            }

                            controller.$formatters.unshift(formatter);
                            controller.$parsers.unshift(parser);

                            function uninitialize() {
                                maskProcessed = false;
                                unbindEventListeners();

                                if (angular.isDefined(originalPlaceholder)) {
                                    iElement.attr('placeholder', originalPlaceholder);
                                } else {
                                    iElement.removeAttr('placeholder');
                                }

                                if (angular.isDefined(originalMaxlength)) {
                                    iElement.attr('maxlength', originalMaxlength);
                                } else {
                                    iElement.removeAttr('maxlength');
                                }

                                iElement.val(controller.$modelValue);
                                controller.$viewValue = controller.$modelValue;
                                return false;
                            }

                            function initializeElement() {
                                value = oldValueUnmasked = unmaskValue(controller.$modelValue || '');
                                valueMasked = oldValue = maskValue(value);
                                isValid = validateValue(value);
                                if (iAttrs.maxlength) { // Double maxlength to allow pasting new val at end of mask
                                    iElement.attr('maxlength', maskCaretMap[maskCaretMap.length - 1] * 2);
                                }
                                if ( ! originalPlaceholder && linkOptions.addDefaultPlaceholder) {
                                    iElement.attr('placeholder', maskPlaceholder);
                                }
                                var viewValue = controller.$modelValue;
                                var idx = controller.$formatters.length;
                                while(idx--) {
                                    viewValue = controller.$formatters[idx](viewValue);
                                }
                                controller.$viewValue = viewValue || '';
                                controller.$render();
                                // Not using $setViewValue so we don't clobber the model value and dirty the form
                                // without any kind of user interaction.
                            }

                            function bindEventListeners() {
                                if (eventsBound) {
                                    return;
                                }
                                iElement.bind('blur', blurHandler);
                                iElement.bind('mousedown mouseup', mouseDownUpHandler);
                                iElement.bind('keydown', keydownHandler);
                                iElement.bind(linkOptions.eventsToHandle.join(' '), eventHandler);
                                eventsBound = true;
                            }

                            function unbindEventListeners() {
                                if (!eventsBound) {
                                    return;
                                }
                                iElement.unbind('blur', blurHandler);
                                iElement.unbind('mousedown', mouseDownUpHandler);
                                iElement.unbind('mouseup', mouseDownUpHandler);
                                iElement.unbind('keydown', keydownHandler);
                                iElement.unbind('input', eventHandler);
                                iElement.unbind('keyup', eventHandler);
                                iElement.unbind('click', eventHandler);
                                iElement.unbind('focus', eventHandler);
                                eventsBound = false;
                            }

                            function validateValue(value) {
                                // Zero-length value validity is ngRequired's determination
                                return value.length ? value.length >= minRequiredLength : true;
                            }

                            function unmaskValue(value) {
                                var valueUnmasked = '',
                                    input = iElement[0],
                                    maskPatternsCopy = maskPatterns.slice(),
                                    selectionStart = oldCaretPosition,
                                    selectionEnd = selectionStart + getSelectionLength(input),
                                    valueOffset, valueDelta, tempValue = '';
                                // Preprocess by stripping mask components from value
                                value = value.toString();
                                valueOffset = 0;
                                valueDelta = value.length - maskPlaceholder.length;
                                angular.forEach(maskComponents, function(component) {
                                    var position = component.position;
                                    //Only try and replace the component if the component position is not within the selected range
                                    //If component was in selected range then it was removed with the user input so no need to try and remove that component
                                    if (!(position >= selectionStart && position < selectionEnd)) {
                                        if (position >= selectionStart) {
                                            position += valueDelta;
                                        }
                                        if (value.substring(position, position + component.value.length) === component.value) {
                                            tempValue += value.slice(valueOffset, position);// + value.slice(position + component.value.length);
                                            valueOffset = position + component.value.length;
                                        }
                                    }
                                });
                                value = tempValue + value.slice(valueOffset);
                                angular.forEach(value.split(''), function(chr) {
                                    if (maskPatternsCopy.length && maskPatternsCopy[0].test(chr)) {
                                        valueUnmasked += chr;
                                        maskPatternsCopy.shift();
                                    }
                                });

                                return valueUnmasked;
                            }

                            function maskValue(unmaskedValue) {
                                var valueMasked = '',
                                        maskCaretMapCopy = maskCaretMap.slice();

                                angular.forEach(maskPlaceholder.split(''), function(chr, i) {
                                    if (unmaskedValue.length && i === maskCaretMapCopy[0]) {
                                        valueMasked += unmaskedValue.charAt(0) || '_';
                                        unmaskedValue = unmaskedValue.substr(1);
                                        maskCaretMapCopy.shift();
                                    }
                                    else {
                                        valueMasked += chr;
                                    }
                                });
                                return valueMasked;
                            }

                            function getPlaceholderChar(i) {
                                var placeholder = angular.isDefined(iAttrs.uiMaskPlaceholder) ? iAttrs.uiMaskPlaceholder : iAttrs.placeholder,
                                    defaultPlaceholderChar;

                                if (angular.isDefined(placeholder) && placeholder[i]) {
                                    return placeholder[i];
                                } else {
                                    defaultPlaceholderChar = angular.isDefined(iAttrs.uiMaskPlaceholderChar) && iAttrs.uiMaskPlaceholderChar ? iAttrs.uiMaskPlaceholderChar : '_';
                                    return (defaultPlaceholderChar.toLowerCase() === 'space') ? ' ' : defaultPlaceholderChar[0];
                                }
                            }

                            // Generate array of mask components that will be stripped from a masked value
                            // before processing to prevent mask components from being added to the unmasked value.
                            // E.g., a mask pattern of '+7 9999' won't have the 7 bleed into the unmasked value.
                            function getMaskComponents() {
                                var maskPlaceholderChars = maskPlaceholder.split(''),
                                        maskPlaceholderCopy, components;

                                //maskCaretMap can have bad values if the input has the ui-mask attribute implemented as an obversable property, e.g. the demo page
                                if (maskCaretMap && !isNaN(maskCaretMap[0])) {
                                    //Instead of trying to manipulate the RegEx based on the placeholder characters
                                    //we can simply replace the placeholder characters based on the already built
                                    //maskCaretMap to underscores and leave the original working RegEx to get the proper
                                    //mask components
                                    angular.forEach(maskCaretMap, function(value) {
                                        maskPlaceholderChars[value] = '_';
                                    });
                                }
                                maskPlaceholderCopy = maskPlaceholderChars.join('');
                                components = maskPlaceholderCopy.replace(/[_]+/g, '_').split('_');
                                components = components.filter(function(s) {
                                    return s !== '';
                                });

                                // need a string search offset in cases where the mask contains multiple identical components
                                // E.g., a mask of 99.99.99-999.99
                                var offset = 0;
                                return components.map(function(c) {
                                    var componentPosition = maskPlaceholderCopy.indexOf(c, offset);
                                    offset = componentPosition + 1;
                                    return {
                                        value: c,
                                        position: componentPosition
                                    };
                                });
                            }

                            function processRawMask(mask) {
                                var characterCount = 0;

                                maskCaretMap = [];
                                maskPatterns = [];
                                maskPlaceholder = '';

                                if (angular.isString(mask)) {
                                    minRequiredLength = 0;

                                    var isOptional = false,
                                            numberOfOptionalCharacters = 0,
                                            splitMask = mask.split('');

                                    var inEscape = false;
                                    angular.forEach(splitMask, function(chr, i) {
                                        if (inEscape) {
                                            inEscape = false;
                                            maskPlaceholder += chr;
                                            characterCount++;
                                        }
                                        else if (linkOptions.escChar === chr) {
                                            inEscape = true;
                                        }
                                        else if (linkOptions.maskDefinitions[chr]) {
                                            maskCaretMap.push(characterCount);

                                            maskPlaceholder += getPlaceholderChar(i - numberOfOptionalCharacters);
                                            maskPatterns.push(linkOptions.maskDefinitions[chr]);

                                            characterCount++;
                                            if (!isOptional) {
                                                minRequiredLength++;
                                            }

                                            isOptional = false;
                                        }
                                        else if (chr === '?') {
                                            isOptional = true;
                                            numberOfOptionalCharacters++;
                                        }
                                        else {
                                            maskPlaceholder += chr;
                                            characterCount++;
                                        }
                                    });
                                }
                                // Caret position immediately following last position is valid.
                                maskCaretMap.push(maskCaretMap.slice().pop() + 1);

                                maskComponents = getMaskComponents();
                                maskProcessed = maskCaretMap.length > 1 ? true : false;
                            }

                            var prevValue = iElement.val();
                            function blurHandler() {
                                if (linkOptions.clearOnBlur || ((linkOptions.clearOnBlurPlaceholder) && (value.length === 0) && iAttrs.placeholder)) {
                                    oldCaretPosition = 0;
                                    oldSelectionLength = 0;
                                    if (!isValid || value.length === 0) {
                                        valueMasked = '';
                                        iElement.val('');
                                        scope.$apply(function() {
                                            //only $setViewValue when not $pristine to avoid changing $pristine state.
                                            if (!controller.$pristine) {
                                                controller.$setViewValue('');
                                            }
                                        });
                                    }
                                }
                                //Check for different value and trigger change.
                                //Check for different value and trigger change.
                                if (value !== prevValue) {
                                    // #157 Fix the bug from the trigger when backspacing exactly on the first letter (emptying the field)
                                    // and then blurring out.
                                    // Angular uses html element and calls setViewValue(element.value.trim()), setting it to the trimmed mask
                                    // when it should be empty
                                    var currentVal = iElement.val();
                                    var isTemporarilyEmpty = value === '' && currentVal && angular.isDefined(iAttrs.uiMaskPlaceholderChar) && iAttrs.uiMaskPlaceholderChar === 'space'; 
                                    if(isTemporarilyEmpty) {
                                        iElement.val('');
                                    }
                                    triggerChangeEvent(iElement[0]);
                                    if(isTemporarilyEmpty) {
                                        iElement.val(currentVal);
                                    }
                                }
                                prevValue = value;
                            }

                            function triggerChangeEvent(element) {
                                var change;
                                if (angular.isFunction(window.Event) && !element.fireEvent) {
                                    // modern browsers and Edge
                                    change = new Event('change', {
                                        view: window,
                                        bubbles: true,
                                        cancelable: false
                                    });
                                    element.dispatchEvent(change);
                                } else if ('createEvent' in document) {
                                    // older browsers
                                    change = document.createEvent('HTMLEvents');
                                    change.initEvent('change', false, true);
                                    element.dispatchEvent(change);
                                }
                                else if (element.fireEvent) {
                                    // IE <= 11
                                    element.fireEvent('onchange');
                                }
                            }

                            function mouseDownUpHandler(e) {
                                if (e.type === 'mousedown') {
                                    iElement.bind('mouseout', mouseoutHandler);
                                } else {
                                    iElement.unbind('mouseout', mouseoutHandler);
                                }
                            }

                            iElement.bind('mousedown mouseup', mouseDownUpHandler);

                            function mouseoutHandler() {
                                /*jshint validthis: true */
                                oldSelectionLength = getSelectionLength(this);
                                iElement.unbind('mouseout', mouseoutHandler);
                            }

                            function keydownHandler(e) {
                                /*jshint validthis: true */
                                var isKeyBackspace = e.which === 8,
                                    caretPos = getCaretPosition(this) - 1 || 0; //value in keydown is pre change so bump caret position back to simulate post change

                                if (isKeyBackspace) {
                                    while(caretPos >= 0) {
                                        if (isValidCaretPosition(caretPos)) {
                                            //re-adjust the caret position.
                                            //Increment to account for the initial decrement to simulate post change caret position
                                            setCaretPosition(this, caretPos + 1);
                                            break;
                                        }
                                        caretPos--;
                                    }
                                    preventBackspace = caretPos === -1;
                                }
                            }

                            function eventHandler(e) {
                                /*jshint validthis: true */
                                e = e || {};
                                // Allows more efficient minification
                                var eventWhich = e.which,
                                        eventType = e.type;

                                // Prevent shift and ctrl from mucking with old values
                                if (eventWhich === 16 || eventWhich === 91) {
                                    return;
                                }

                                var val = iElement.val(),
                                        valOld = oldValue,
                                        valMasked,
                                        valAltered = false,
                                        valUnmasked = unmaskValue(val),
                                        valUnmaskedOld = oldValueUnmasked,
                                        caretPos = getCaretPosition(this) || 0,
                                        caretPosOld = oldCaretPosition || 0,
                                        caretPosDelta = caretPos - caretPosOld,
                                        caretPosMin = maskCaretMap[0],
                                        caretPosMax = maskCaretMap[valUnmasked.length] || maskCaretMap.slice().shift(),
                                        selectionLenOld = oldSelectionLength || 0,
                                        isSelected = getSelectionLength(this) > 0,
                                        wasSelected = selectionLenOld > 0,
                                        // Case: Typing a character to overwrite a selection
                                        isAddition = (val.length > valOld.length) || (selectionLenOld && val.length > valOld.length - selectionLenOld),
                                        // Case: Delete and backspace behave identically on a selection
                                        isDeletion = (val.length < valOld.length) || (selectionLenOld && val.length === valOld.length - selectionLenOld),
                                        isSelection = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey, // Arrow key codes

                                        isKeyLeftArrow = eventWhich === 37,
                                        // Necessary due to "input" event not providing a key code
                                        isKeyBackspace = eventWhich === 8 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === -1)),
                                        isKeyDelete = eventWhich === 46 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === 0) && !wasSelected),
                                        // Handles cases where caret is moved and placed in front of invalid maskCaretMap position. Logic below
                                        // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
                                        // non-mask character. Also applied to click since users are (arguably) more likely to backspace
                                        // a character when clicking within a filled input.
                                        caretBumpBack = (isKeyLeftArrow || isKeyBackspace || eventType === 'click') && caretPos > caretPosMin;

                                oldSelectionLength = getSelectionLength(this);

                                // These events don't require any action
                                if (isSelection || (isSelected && (eventType === 'click' || eventType === 'keyup' || eventType === 'focus'))) {
                                    return;
                                }

                                if (isKeyBackspace && preventBackspace) {
                                    iElement.val(maskPlaceholder);
                                    // This shouldn't be needed but for some reason after aggressive backspacing the controller $viewValue is incorrect.
                                    // This keeps the $viewValue updated and correct.
                                    scope.$apply(function () {
                                        controller.$setViewValue(''); // $setViewValue should be run in angular context, otherwise the changes will be invisible to angular and user code.
                                    });
                                    setCaretPosition(this, caretPosOld);
                                    return;
                                }

                                // Value Handling
                                // ==============

                                // User attempted to delete but raw value was unaffected--correct this grievous offense
                                if ((eventType === 'input') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
                                    while (isKeyBackspace && caretPos > caretPosMin && !isValidCaretPosition(caretPos)) {
                                        caretPos--;
                                    }
                                    while (isKeyDelete && caretPos < caretPosMax && maskCaretMap.indexOf(caretPos) === -1) {
                                        caretPos++;
                                    }
                                    var charIndex = maskCaretMap.indexOf(caretPos);
                                    // Strip out non-mask character that user would have deleted if mask hadn't been in the way.
                                    valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);

                                    // If value has not changed, don't want to call $setViewValue, may be caused by IE raising input event due to placeholder
                                    if (valUnmasked !== valUnmaskedOld)
                                        valAltered = true;
                                }

                                // Update values
                                valMasked = maskValue(valUnmasked);

                                oldValue = valMasked;
                                oldValueUnmasked = valUnmasked;

                                //additional check to fix the problem where the viewValue is out of sync with the value of the element.
                                //better fix for commit 2a83b5fb8312e71d220a497545f999fc82503bd9 (I think)
                                if (!valAltered && val.length > valMasked.length)
                                    valAltered = true;

                                iElement.val(valMasked);

                                //we need this check.  What could happen if you don't have it is that you'll set the model value without the user
                                //actually doing anything.  Meaning, things like pristine and touched will be set.
                                if (valAltered) {
                                    scope.$apply(function () {
                                        controller.$setViewValue(valMasked); // $setViewValue should be run in angular context, otherwise the changes will be invisible to angular and user code.
                                    });
                                }

                                // Caret Repositioning
                                // ===================

                                // Ensure that typing always places caret ahead of typed character in cases where the first char of
                                // the input is a mask char and the caret is placed at the 0 position.
                                if (isAddition && (caretPos <= caretPosMin)) {
                                    caretPos = caretPosMin + 1;
                                }

                                if (caretBumpBack) {
                                    caretPos--;
                                }

                                // Make sure caret is within min and max position limits
                                caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

                                // Scoot the caret back or forth until it's in a non-mask position and within min/max position limits
                                while (!isValidCaretPosition(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax) {
                                    caretPos += caretBumpBack ? -1 : 1;
                                }

                                if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !isValidCaretPosition(caretPosOld))) {
                                    caretPos++;
                                }
                                oldCaretPosition = caretPos;
                                setCaretPosition(this, caretPos);
                            }

                            function isValidCaretPosition(pos) {
                                return maskCaretMap.indexOf(pos) > -1;
                            }

                            function getCaretPosition(input) {
                                if (!input)
                                    return 0;
                                if (input.selectionStart !== undefined) {
                                    return input.selectionStart;
                                } else if (document.selection) {
                                    if (isFocused(iElement[0])) {
                                        // Curse you IE
                                        input.focus();
                                        var selection = document.selection.createRange();
                                        selection.moveStart('character', input.value ? -input.value.length : 0);
                                        return selection.text.length;
                                    }
                                }
                                return 0;
                            }

                            function setCaretPosition(input, pos) {
                                if (!input)
                                    return 0;
                                if (input.offsetWidth === 0 || input.offsetHeight === 0) {
                                    return; // Input's hidden
                                }
                                if (input.setSelectionRange) {
                                    if (isFocused(iElement[0])) {
                                        input.focus();
                                        input.setSelectionRange(pos, pos);
                                    }
                                }
                                else if (input.createTextRange) {
                                    // Curse you IE
                                    var range = input.createTextRange();
                                    range.collapse(true);
                                    range.moveEnd('character', pos);
                                    range.moveStart('character', pos);
                                    range.select();
                                }
                            }

                            function getSelectionLength(input) {
                                if (!input)
                                    return 0;
                                if (input.selectionStart !== undefined) {
                                    return (input.selectionEnd - input.selectionStart);
                                }
                                if (document.selection) {
                                    return (document.selection.createRange().text.length);
                                }
                                return 0;
                            }

                            // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
                            if (!Array.prototype.indexOf) {
                                Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
                                    if (this === null) {
                                        throw new TypeError();
                                    }
                                    var t = Object(this);
                                    var len = t.length >>> 0;
                                    if (len === 0) {
                                        return -1;
                                    }
                                    var n = 0;
                                    if (arguments.length > 1) {
                                        n = Number(arguments[1]);
                                        if (n !== n) { // shortcut for verifying if it's NaN
                                            n = 0;
                                        } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                                            n = (n > 0 || -1) * Math.floor(Math.abs(n));
                                        }
                                    }
                                    if (n >= len) {
                                        return -1;
                                    }
                                    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
                                    for (; k < len; k++) {
                                        if (k in t && t[k] === searchElement) {
                                            return k;
                                        }
                                    }
                                    return -1;
                                };
                            }

                        };
                    }
                };
            }
        ]);

}());
/**
 * angular-mask
 * Personalized input masks for AngularJS
 * @version v1.2.3
 * @link http://github.com/assisrafael/angular-input-masks
 * @license MIT
 */
(function (angular) {

    var StringMask = (function () {
        var tokens = {
            '0': {pattern: /\d/, default: '0'},
            '9': {pattern: /\d/, optional: true},
            '#': {pattern: /\d/, optional: true, recursive: true},
            'S': {pattern: /[a-zA-Z]/},
            '$': {escape: true}
        };
        var isEscaped = function (pattern, pos) {
            var count = 0;
            var i = pos - 1;
            var token = {escape: true};
            while (i >= 0 && token && token.escape) {
                token = tokens[pattern.charAt(i)];
                count += token && token.escape ? 1 : 0;
                i--;
            }
            return count > 0 && count % 2 === 1;
        };
        var calcOptionalNumbersToUse = function (pattern, value) {
            var numbersInP = pattern.replace(/[^0]/g, '').length;
            var numbersInV = value.replace(/[^\d]/g, '').length;
            return numbersInV - numbersInP;
        };
        var concatChar = function (text, character, options) {
            if (options.reverse)
                return character + text;
            return text + character;
        };
        var hasMoreTokens = function (pattern, pos, inc) {
            var pc = pattern.charAt(pos);
            var token = tokens[pc];
            if (pc === '')
                return false;
            return token && !token.escape ? true : hasMoreTokens(pattern, pos + inc, inc);
        };
        var insertChar = function (text, char, position) {
            var t = text.split('');
            t.splice(position >= 0 ? position : 0, 0, char);
            return t.join('');
        };
        var StringMask = function (pattern, opt) {
            this.options = opt || {};
            this.options = {
                reverse: this.options.reverse || false,
                usedefaults: this.options.usedefaults || this.options.reverse
            };
            this.pattern = pattern;

            StringMask.prototype.process = function proccess(value) {
                if (!value)
                    return '';
                value = value + '';
                var pattern2 = this.pattern;
                var valid = true;
                var formatted = '';
                var valuePos = this.options.reverse ? value.length - 1 : 0;
                var optionalNumbersToUse = calcOptionalNumbersToUse(pattern2, value);
                var escapeNext = false;
                var recursive = [];
                var inRecursiveMode = false;

                var steps = {
                    start: this.options.reverse ? pattern2.length - 1 : 0,
                    end: this.options.reverse ? -1 : pattern2.length,
                    inc: this.options.reverse ? -1 : 1
                };

                var continueCondition = function (options) {
                    if (!inRecursiveMode && hasMoreTokens(pattern2, i, steps.inc)) {
                        return true;
                    } else if (!inRecursiveMode) {
                        inRecursiveMode = recursive.length > 0;
                    }

                    if (inRecursiveMode) {
                        var pc = recursive.shift();
                        recursive.push(pc);
                        if (options.reverse && valuePos >= 0) {
                            i++;
                            pattern2 = insertChar(pattern2, pc, i);
                            return true;
                        } else if (!options.reverse && valuePos < value.length) {
                            pattern2 = insertChar(pattern2, pc, i);
                            return true;
                        }
                    }
                    return i < pattern2.length && i >= 0;
                };

                for (var i = steps.start; continueCondition(this.options); i = i + steps.inc) {
                    var pc = pattern2.charAt(i);
                    var vc = value.charAt(valuePos);
                    var token = tokens[pc];
                    if (!inRecursiveMode || vc) {
                        if (this.options.reverse && isEscaped(pattern2, i)) {
                            formatted = concatChar(formatted, pc, this.options);
                            i = i + steps.inc;
                            continue;
                        } else if (!this.options.reverse && escapeNext) {
                            formatted = concatChar(formatted, pc, this.options);
                            escapeNext = false;
                            continue;
                        } else if (!this.options.reverse && token && token.escape) {
                            escapeNext = true;
                            continue;
                        }
                    }

                    if (!inRecursiveMode && token && token.recursive) {
                        recursive.push(pc);
                    } else if (inRecursiveMode && !vc) {
                        if (!token || !token.recursive)
                            formatted = concatChar(formatted, pc, this.options);
                        continue;
                    } else if (recursive.length > 0 && token && !token.recursive) {
                        // Recursive tokens most be the last tokens of the pattern
                        valid = false;
                        continue;
                    } else if (!inRecursiveMode && recursive.length > 0 && !vc) {
                        continue;
                    }

                    if (!token) {
                        formatted = concatChar(formatted, pc, this.options);
                        if (!inRecursiveMode && recursive.length) {
                            recursive.push(pc);
                        }
                    } else if (token.optional) {
                        if (token.pattern.test(vc) && optionalNumbersToUse) {
                            formatted = concatChar(formatted, vc, this.options);
                            valuePos = valuePos + steps.inc;
                            optionalNumbersToUse--;
                        } else if (recursive.length > 0 && vc) {
                            valid = false;
                            break;
                        }
                    } else if (token.pattern.test(vc)) {
                        formatted = concatChar(formatted, vc, this.options);
                        valuePos = valuePos + steps.inc;
                    } else if (!vc && token.default && this.options.usedefaults) {
                        formatted = concatChar(formatted, token.default, this.options);
                    } else {
                        valid = false;
                        break;
                    }
                }

                return {result: formatted, valid: valid};
            };

            StringMask.prototype.apply = function (value) {
                return this.process(value).result;
            };

            StringMask.prototype.validate = function (value) {
                return this.process(value).valid;
            };
        };

        StringMask.process = function (value, pattern, options) {
            return new StringMask(pattern, options).process(value);
        };

        StringMask.apply = function (value, pattern, options) {
            return new StringMask(pattern, options).apply(value);
        };

        StringMask.validate = function (value, pattern, options) {
            return new StringMask(pattern, options).validate(value);
        };

        return StringMask;
    }());

    /** Used to determine if values are of the language type Object */
    var objectTypes = {
        'boolean': false,
        'function': true,
        'object': true,
        'number': false,
        'string': false,
        'undefined': false
    };

    if (objectTypes[typeof module]) {
        module.exports = StringMask;
    }

    /**
     * br-validations
     * A library of validations applicable to several Brazilian data like I.E., CNPJ, CPF and others
     * @version v0.2.1
     * @link http://github.com/the-darc/br-validations
     * @license MIT
     */
    (function () {
        var root = this;
        var CNPJ = {};

        CNPJ.validate = function (c) {
            var b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            c = c.replace(/[^\d]/g, '').split('');
            if (c.length !== 14) {
                return false;
            }

            for (var i = 0, n = 0; i < 12; i++) {
                n += c[i] * b[i + 1];
            }
            n = 11 - n % 11;
            n = n >= 10 ? 0 : n;
            if (parseInt(c[12]) !== n) {
                return false;
            }

            for (i = 0, n = 0; i <= 12; i++) {
                n += c[i] * b[i];
            }
            n = 11 - n % 11;
            n = n >= 10 ? 0 : n;
            if (parseInt(c[13]) !== n) {
                return false;
            }
            return true;
        };


        var CPF = {};

        CPF.validate = function (cpf) {
            cpf = cpf.replace(/[^\d]+/g, '');
            if (cpf === '' || cpf === '00000000000' || cpf.length !== 11) {
                return false;
            }
            function validateDigit(digit) {
                var add = 0;
                var init = digit - 9;
                for (var i = 0; i < 9; i++) {
                    add += parseInt(cpf.charAt(i + init)) * (i + 1);
                }
                return (add % 11) % 10 === parseInt(cpf.charAt(digit));
            }
            return validateDigit(9) && validateDigit(10);
        };

        var IE = function (uf) {
            if (!(this instanceof IE)) {
                return new IE(uf);
            }

            this.rules = IErules[uf] || [];
            this.rule;
            IE.prototype._defineRule = function (value) {
                this.rule = undefined;
                for (var r = 0; r < this.rules.length && this.rule === undefined; r++) {
                    var str = value.replace(/[^\d]/g, '');
                    var ruleCandidate = this.rules[r];
                    if (str.length === ruleCandidate.chars && (!ruleCandidate.match || ruleCandidate.match.test(value))) {
                        this.rule = ruleCandidate;
                    }
                }
                return !!this.rule;
            };

            IE.prototype.validate = function (value) {
                if (!value || !this._defineRule(value)) {
                    return false;
                }
                return this.rule.validate(value);
            };
        };

        var IErules = {};

        var algorithmSteps = {
            handleStr: {
                onlyNumbers: function (str) {
                    return str.replace(/[^\d]/g, '').split('');
                },
                mgSpec: function (str) {
                    var s = str.replace(/[^\d]/g, '');
                    s = s.substr(0, 3) + '0' + s.substr(3, s.length);
                    return s.split('');
                }
            },
            sum: {
                normalSum: function (handledStr, pesos) {
                    var nums = handledStr;
                    var sum = 0;
                    for (var i = 0; i < pesos.length; i++) {
                        sum += parseInt(nums[i]) * pesos[i];
                    }
                    return sum;
                },
                individualSum: function (handledStr, pesos) {
                    var nums = handledStr;
                    var sum = 0;
                    for (var i = 0; i < pesos.length; i++) {
                        var mult = parseInt(nums[i]) * pesos[i];
                        sum += mult % 10 + parseInt(mult / 10);
                    }
                    return sum;
                },
                apSpec: function (handledStr, pesos) {
                    var sum = this.normalSum(handledStr, pesos);
                    var ref = handledStr.join('');
                    if (ref >= '030000010' && ref <= '030170009') {
                        return sum + 5;
                    }
                    if (ref >= '030170010' && ref <= '030190229') {
                        return sum + 9;
                    }
                    return sum;
                }
            },
            rest: {
                mod11: function (sum) {
                    return sum % 11;
                },
                mod10: function (sum) {
                    return sum % 10;
                },
                mod9: function (sum) {
                    return sum % 9;
                }
            },
            expectedDV: {
                minusRestOf11: function (rest) {
                    return rest < 2 ? 0 : 11 - rest;
                },
                minusRestOf11v2: function (rest) {
                    return rest < 2 ? 11 - rest - 10 : 11 - rest;
                },
                minusRestOf10: function (rest) {
                    return rest < 1 ? 0 : 10 - rest;
                },
                mod10: function (rest) {
                    return rest % 10;
                },
                goSpec: function (rest, handledStr) {
                    var ref = handledStr.join('');
                    if (rest === 1) {
                        return ref >= '101031050' && ref <= '101199979' ? 1 : 0;
                    }
                    return rest === 0 ? 0 : 11 - rest;
                },
                apSpec: function (rest, handledStr) {
                    var ref = handledStr.join('');
                    if (rest === 0) {
                        return ref >= '030170010' && ref <= '030190229' ? 1 : 0;
                    }
                    return rest === 1 ? 0 : 11 - rest;
                },
                voidFn: function (rest) {
                    return rest;
                }
            }
        };


        /**
         * options {
         *     pesos: Array of values used to operate in sum step
         *     dvPos: Position of the DV to validate considering the handledStr
         *     algorithmSteps: The four DV's validation algorithm steps names
         * }
         */
        function validateDV(value, options) {
            var steps = options.algorithmSteps;

            // Step 01: Handle String
            var handledStr = algorithmSteps.handleStr[steps[0]](value);

            // Step 02: Sum chars
            var sum = algorithmSteps.sum[steps[1]](handledStr, options.pesos);

            // Step 03: Rest calculation
            var rest = algorithmSteps.rest[steps[2]](sum);

            // Fixed Step: Get current DV
            var currentDV = parseInt(handledStr[options.dvpos]);

            // Step 04: Expected DV calculation
            var expectedDV = algorithmSteps.expectedDV[steps[3]](rest, handledStr);

            // Fixed step: DV verification
            return currentDV === expectedDV;
        }

        function validateIE(value, rule) {
            if (rule.match && !rule.match.test(value)) {
                return false;
            }
            for (var i = 0; i < rule.dvs.length; i++) {
                // console.log('>> >> dv'+i);
                if (!validateDV(value, rule.dvs[i])) {
                    return false;
                }
            }
            return true;
        }

        IErules.PE = [{
                //mask: new StringMask('0000000-00'),
                chars: 9,
                dvs: [{
                        dvpos: 7,
                        pesos: [8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                // mask: new StringMask('00.0.000.0000000-0'),
                chars: 14,
                pesos: [[1, 2, 3, 4, 5, 9, 8, 7, 6, 5, 4, 3, 2]],
                dvs: [{
                        dvpos: 13,
                        pesos: [5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11v2']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.RS = [{
                // mask: new StringMask('000/0000000'),
                chars: 10,
                dvs: [{
                        dvpos: 9,
                        pesos: [2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.AC = [{
                // mask: new StringMask('00.000.000/000-00'),
                chars: 13,
                match: /^01/,
                dvs: [{
                        dvpos: 11,
                        pesos: [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 12,
                        pesos: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.MG = [{
                // mask: new StringMask('000.000.000/0000'),
                chars: 13,
                dvs: [{
                        dvpos: 12,
                        pesos: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
                        algorithmSteps: ['mgSpec', 'individualSum', 'mod10', 'minusRestOf10']
                    }, {
                        dvpos: 12,
                        pesos: [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.SP = [{
                // mask: new StringMask('000.000.000.000'),
                chars: 12,
                match: /^[0-9]/,
                dvs: [{
                        dvpos: 8,
                        pesos: [1, 3, 4, 5, 6, 7, 8, 10],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'mod10']
                    }, {
                        dvpos: 11,
                        pesos: [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'mod10']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                // mask: new StringMask('P-00000000.0/000')
                chars: 12,
                match: /^P/i,
                dvs: [{
                        dvpos: 8,
                        pesos: [1, 3, 4, 5, 6, 7, 8, 10],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'mod10']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.DF = [{
                // mask: new StringMask('00000000000-00'),
                chars: 13,
                dvs: [{
                        dvpos: 11,
                        pesos: [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 12,
                        pesos: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.ES = [{
                // mask: new StringMask('000.000.00-0')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.BA = [{
                // mask: new StringMask('000000-00')
                chars: 8,
                match: /^[0123458]/,
                dvs: [{
                        dvpos: 7,
                        pesos: [7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod10', 'minusRestOf10']
                    }, {
                        dvpos: 6,
                        pesos: [8, 7, 6, 5, 4, 3, 0, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod10', 'minusRestOf10']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                chars: 8,
                match: /^[679]/,
                dvs: [{
                        dvpos: 7,
                        pesos: [7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 6,
                        pesos: [8, 7, 6, 5, 4, 3, 0, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                // mask: new StringMask('0000000-00')
                chars: 9,
                match: /^[0-9][0123458]/,
                dvs: [{
                        dvpos: 8,
                        pesos: [8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod10', 'minusRestOf10']
                    }, {
                        dvpos: 7,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 0, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod10', 'minusRestOf10']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                chars: 9,
                match: /^[0-9][679]/,
                dvs: [{
                        dvpos: 8,
                        pesos: [8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 7,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 0, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.AM = [{
                //mask: new StringMask('00.000.000-0')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.RN = [{
                // {mask: new StringMask('00.000.000-0')
                chars: 9,
                match: /^20/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }, {
                // {mask: new StringMask('00.0.000.000-0'), chars: 10}
                chars: 10,
                match: /^20/,
                dvs: [{
                        dvpos: 8,
                        pesos: [10, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.RO = [{
                // mask: new StringMask('0000000000000-0')
                chars: 14,
                dvs: [{
                        dvpos: 13,
                        pesos: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.PR = [{
                // mask: new StringMask('00000000-00')
                chars: 10,
                dvs: [{
                        dvpos: 8,
                        pesos: [3, 2, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }, {
                        dvpos: 9,
                        pesos: [4, 3, 2, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.SC = [{
                // {mask: new StringMask('000.000.000'), uf: 'SANTA CATARINA'}
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.RJ = [{
                // {mask: new StringMask('00.000.00-0'), uf: 'RIO DE JANEIRO'}
                chars: 8,
                dvs: [{
                        dvpos: 7,
                        pesos: [2, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.PA = [{
                // {mask: new StringMask('00-000000-0')
                chars: 9,
                match: /^15/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.SE = [{
                // {mask: new StringMask('00000000-0')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.PB = [{
                // {mask: new StringMask('00000000-0')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.CE = [{
                // {mask: new StringMask('00000000-0')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.PI = [{
                // {mask: new StringMask('000000000')
                chars: 9,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.MA = [{
                // {mask: new StringMask('000000000')
                chars: 9,
                match: /^12/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.MT = [{
                // {mask: new StringMask('0000000000-0')
                chars: 11,
                dvs: [{
                        dvpos: 10,
                        pesos: [3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.MS = [{
                // {mask: new StringMask('000000000')
                chars: 9,
                match: /^28/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.TO = [{
                // {mask: new StringMask('00000000000'),
                chars: 11,
                match: /^[0-9]{2}((0[123])|(99))/,
                dvs: [{
                        dvpos: 10,
                        pesos: [9, 8, 0, 0, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.AL = [{
                // {mask: new StringMask('000000000')
                chars: 9,
                match: /^24[03578]/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'minusRestOf11']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.RR = [{
                // {mask: new StringMask('00000000-0')
                chars: 9,
                match: /^24/,
                dvs: [{
                        dvpos: 8,
                        pesos: [1, 2, 3, 4, 5, 6, 7, 8],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod9', 'voidFn']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.GO = [{
                // {mask: new StringMask('00.000.000-0')
                chars: 9,
                match: /^1[015]/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'normalSum', 'mod11', 'goSpec']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        IErules.AP = [{
                // {mask: new StringMask('000000000')
                chars: 9,
                match: /^03/,
                dvs: [{
                        dvpos: 8,
                        pesos: [9, 8, 7, 6, 5, 4, 3, 2],
                        algorithmSteps: ['onlyNumbers', 'apSpec', 'mod11', 'apSpec']
                    }],
                validate: function (value) {
                    return validateIE(value, this);
                }
            }];

        var BrV = {
            ie: IE,
            cpf: CPF,
            cnpj: CNPJ
        };
        var objectTypes = {
            'function': true,
            'object': true
        };
        if (objectTypes[typeof module]) {
            module.exports = BrV;
        } else {
            root.BrV = BrV;
        }
    }.call(this));
    (function () {
        'use strict';

        function maxValidator(ctrl, value, limit) {
            var max = parseFloat(limit);
            var validity = ctrl.$isEmpty(value) || isNaN(max) || value <= max;
            ctrl.$setValidity('max', validity);
            return value;
        }

        function minValidator(ctrl, value, limit) {
            var min = parseFloat(limit);
            var validity = ctrl.$isEmpty(value) || isNaN(min) || value >= min;
            ctrl.$setValidity('min', validity);
            return value;
        }

        var cnpjPattern = new StringMask('00.000.000\/0000-00');
        var cpfPattern = new StringMask('000.000.000-00');

        function numberViewMask(decimals, decimalDelimiter, thousandsDelimiter) {
            var mask = '#' + thousandsDelimiter + '##0';

            if (decimals > 0) {
                mask += decimalDelimiter;
                for (var i = 0; i < decimals; i++) {
                    mask += '0';
                }
            }

            return new StringMask(mask, {
                reverse: true
            });
        }

        function numberModelMask(decimals) {
            var mask = '###0';

            if (decimals > 0) {
                mask += '.';
                for (var i = 0; i < decimals; i++) {
                    mask += '0';
                }
            }

            return new StringMask(mask, {
                reverse: true
            });
        }

        function clearDelimitersAndLeadingZeros(value) {
            var cleanValue = value.replace(/^0*/, '');
            cleanValue = cleanValue.replace(/[^0-9]/g, '');
            return cleanValue;
        }

        function clearDelimitersAndLeading(value) {
            var cleanValue = value.replace(/[^0-9]/g, '');
            return cleanValue;
        }

        function preparePercentageToFormatter(value, decimals) {
            return clearDelimitersAndLeadingZeros((parseFloat(value) * 100).toFixed(decimals));
        }

        function prepareNumberToFormatter(value, decimals) {
            return clearDelimitersAndLeadingZeros((parseFloat(value)).toFixed(decimals));
        }

        function validateBrPhoneNumber(ctrl, value) {
            var valid = ctrl.$isEmpty(value) || value.length === 10 || value.length === 11;
            ctrl.$setValidity('br-phone-number', valid);
            return value;
        }

        function validateCPF(ctrl, value) {
            var valid = ctrl.$isEmpty(value) || BrV.cpf.validate(value);
            ctrl.$setValidity('cpf', valid);
            return value;
        }

        function validateCNPJ(ctrl, value) {
            var valid = ctrl.$isEmpty(value) || BrV.cnpj.validate(value);
            ctrl.$setValidity('cnpj', valid);
            return value;
        }

        function validateCPForCNPJ(ctrl, value) {
            if (!value || value.length <= 11) {
                validateCNPJ(ctrl, '');
                return validateCPF(ctrl, value);
            } else {
                validateCPF(ctrl, '');
                return validateCNPJ(ctrl, value);
            }
        }

        function uiBrCpfMask() {
            function applyCpfMask(value) {
                if (!value) {
                    return value;
                }
                var formatedValue = cpfPattern.apply(value);
                return formatedValue.trim().replace(/[^0-9]$/, '');
            }

            return {
                restrict: 'A',
                require: '?ngModel',
                link: function (scope, element, attrs, ctrl) {
                    if (!ctrl) {
                        return;
                    }

                    ctrl.$formatters.push(function (value) {
                        return applyCpfMask(validateCPF(ctrl, value));
                    });

                    ctrl.$parsers.push(function (value) {
                        if (!value) {
                            return value;
                        }

                        var actualNumber = value.replace(/[^\d]/g, '');
                        var formatedValue = applyCpfMask(actualNumber);

                        if (ctrl.$viewValue !== formatedValue) {
                            ctrl.$setViewValue(formatedValue);
                            ctrl.$render();
                        }

                        return formatedValue.replace(/[^\d]+/g, '');
                    });

                    ctrl.$parsers.push(function (value) {
                        return validateCPF(ctrl, value);
                    });
                }
            };
        }

        function uiBrCnpjMask() {
            function applyCnpjMask(value) {
                if (!value) {
                    return value;
                }
                var formatedValue = cnpjPattern.apply(value);
                return formatedValue.trim().replace(/[^0-9]$/, '');
            }
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function (scope, element, attrs, ctrl) {
                    if (!ctrl) {
                        return;
                    }

                    ctrl.$formatters.push(function (value) {
                        return applyCnpjMask(validateCNPJ(ctrl, value));
                    });

                    ctrl.$parsers.push(function (value) {
                        if (!value) {
                            return value;
                        }

                        var actualNumber = value.replace(/[^\d]+/g, '');
                        var formatedValue = applyCnpjMask(actualNumber);

                        if (ctrl.$viewValue !== formatedValue) {
                            ctrl.$setViewValue(formatedValue);
                            ctrl.$render();
                        }

                        return formatedValue.replace(/[^\d]+/g, '');
                    });

                    ctrl.$parsers.push(function (value) {
                        return validateCNPJ(ctrl, value);
                    });
                }
            };
        }

        function uiBrCpfCnpjMask() {
            function applyCpfCnpjMask(value) {
                if (!value) {
                    return value;
                }
                var formatedValue;
                if (value.length > 11) {
                    formatedValue = cnpjPattern.apply(value);
                } else {
                    formatedValue = cpfPattern.apply(value);
                }
                return formatedValue.trim().replace(/[^0-9]$/, '');
            }
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function (scope, element, attrs, ctrl) {
                    if (!ctrl) {
                        return;
                    }

                    ctrl.$formatters.push(function (value) {
                        return applyCpfCnpjMask(validateCPForCNPJ(ctrl, value));
                    });

                    ctrl.$parsers.push(function (value) {
                        if (!value) {
                            return value;
                        }

                        var actualNumber = value.replace(/[^\d]+/g, '');
                        var formatedValue = applyCpfCnpjMask(actualNumber);

                        if (ctrl.$viewValue !== formatedValue) {
                            ctrl.$setViewValue(formatedValue);
                            ctrl.$render();
                        }

                        return formatedValue.replace(/[^\d]+/g, '');
                    });

                    ctrl.$parsers.push(function (value) {
                        return validateCPForCNPJ(ctrl, value);
                    });
                }
            };
        }

        angular.module('ui.utils.masks', [])
                .directive('uiPercentageMask', ['$locale', '$parse', function ($locale, $parse) {
                        return {
                            restrict: 'A',
                            require: '?ngModel',
                            link: function (scope, element, attrs, ctrl) {
                                var decimalDelimiter = $locale.NUMBER_FORMATS.DECIMAL_SEP,
                                        thousandsDelimiter = $locale.NUMBER_FORMATS.GROUP_SEP,
                                        decimals = parseInt(attrs.uiPercentageMask);

                                if (!ctrl) {
                                    return;
                                }

                                if (angular.isDefined(attrs.uiHideGroupSep)) {
                                    thousandsDelimiter = '';
                                }

                                if (isNaN(decimals)) {
                                    decimals = 2;
                                }
                                var numberDecimals = decimals + 2;
                                var viewMask = numberViewMask(decimals, decimalDelimiter, thousandsDelimiter),
                                        modelMask = numberModelMask(numberDecimals);

                                ctrl.$formatters.push(function (value) {
                                    if (!value) {
                                        return value;
                                    }

                                    var valueToFormat = preparePercentageToFormatter(value, decimals);
                                    return viewMask.apply(valueToFormat) + ' %';
                                });

                                function parse(value) {
                                    if (!value) {
                                        return value;
                                    }
                                    var valueToFormat = "";
                                    if (decimals == 0) {
                                        valueToFormat = clearDelimitersAndLeading(value);
                                    } else {
                                        valueToFormat = clearDelimitersAndLeadingZeros(value) || '0';
                                    }
                                    if (value.length > 1 && value.indexOf('%') === -1) {
                                        valueToFormat = valueToFormat.slice(0, valueToFormat.length - 1);
                                    }
                                    var formatedValue = viewMask.apply(valueToFormat) + ' %';
                                    var actualNumber = parseFloat(modelMask.apply(valueToFormat));

                                    if (ctrl.$viewValue !== formatedValue) {
                                        ctrl.$setViewValue(formatedValue);
                                        ctrl.$render();
                                    }

                                    return actualNumber;
                                }

                                ctrl.$parsers.push(parse);

                                if (attrs.uiPercentageMask) {
                                    scope.$watch(attrs.uiPercentageMask, function (decimals) {
                                        if (isNaN(decimals)) {
                                            decimals = 2;
                                        }
                                        numberDecimals = decimals + 2;
                                        viewMask = numberViewMask(decimals, decimalDelimiter, thousandsDelimiter);
                                        modelMask = numberModelMask(numberDecimals);

                                        parse(ctrl.$viewValue || '');
                                    });
                                }

                                if (attrs.min) {
                                    ctrl.$parsers.push(function (value) {
                                        var min = $parse(attrs.min)(scope);
                                        return minValidator(ctrl, value, min);
                                    });

                                    scope.$watch('min', function (value) {
                                        minValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }

                                if (attrs.max) {
                                    ctrl.$parsers.push(function (value) {
                                        var max = $parse(attrs.max)(scope);
                                        return maxValidator(ctrl, value, max);
                                    });

                                    scope.$watch('max', function (value) {
                                        maxValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }
                            }
                        };
                    }])
                .directive('uiNumberMask', ['$locale', '$parse', function ($locale, $parse) {
                        return {
                            restrict: 'A',
                            require: '?ngModel',
                            link: function (scope, element, attrs, ctrl) {
                                var decimalDelimiter = $locale.NUMBER_FORMATS.DECIMAL_SEP,
                                        thousandsDelimiter = $locale.NUMBER_FORMATS.GROUP_SEP,
                                        decimals = $parse(attrs.uiNumberMask)(scope);

                                if (!ctrl) {
                                    return;
                                }

                                if (angular.isDefined(attrs.uiHideGroupSep)) {
                                    thousandsDelimiter = '';
                                }

                                if (isNaN(decimals)) {
                                    decimals = 2;
                                }
                                var viewMask = numberViewMask(decimals, decimalDelimiter, thousandsDelimiter),
                                        modelMask = numberModelMask(decimals);

                                function parse(value) {
                                    if (!value) {
                                        return value;
                                    }
                                    var valueToFormat = "";
                                    if (decimals === 0) {
                                        valueToFormat = clearDelimitersAndLeading(value);
                                    } else {
                                        valueToFormat = clearDelimitersAndLeadingZeros(value) || '0';
                                    }
                                    var formatedValue = viewMask.apply(valueToFormat);
                                    var actualNumber = parseFloat(modelMask.apply(valueToFormat));

                                    if (angular.isDefined(attrs.uiNegativeNumber)) {
                                        var isNegative = (value[0] === '-'),
                                                needsToInvertSign = (value.slice(-1) === '-');

                                        //only apply the minus sign if it is negative or(exclusive) needs to be negative
                                        if (needsToInvertSign ^ isNegative) {
                                            actualNumber *= -1;
                                            formatedValue = '-' + formatedValue;
                                        }
                                    }

                                    if (ctrl.$viewValue !== formatedValue) {
                                        ctrl.$setViewValue(formatedValue);
                                        ctrl.$render();
                                    }

                                    return actualNumber;
                                }

                                ctrl.$formatters.push(function (value) {
                                    var prefix = '';
                                    if (angular.isDefined(attrs.uiNegativeNumber) && value < 0) {
                                        prefix = '-';
                                    }

                                    if (!value) {
                                        return value;
                                    }

                                    var valueToFormat = prepareNumberToFormatter(value, decimals);
                                    return prefix + viewMask.apply(valueToFormat);
                                });

                                ctrl.$parsers.push(parse);

                                if (attrs.uiNumberMask) {
                                    scope.$watch(attrs.uiNumberMask, function (decimals) {
                                        if (isNaN(decimals)) {
                                            decimals = 2;
                                        }
                                        viewMask = numberViewMask(decimals, decimalDelimiter, thousandsDelimiter);
                                        modelMask = numberModelMask(decimals);

                                        parse(ctrl.$viewValue || '');
                                    });
                                }

                                if (attrs.min) {
                                    ctrl.$parsers.push(function (value) {
                                        var min = $parse(attrs.min)(scope);
                                        return minValidator(ctrl, value, min);
                                    });

                                    scope.$watch(attrs.min, function (value) {
                                        minValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }

                                if (attrs.max) {
                                    ctrl.$parsers.push(function (value) {
                                        var max = $parse(attrs.max)(scope);
                                        return maxValidator(ctrl, value, max);
                                    });

                                    scope.$watch(attrs.max, function (value) {
                                        maxValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }
                            }
                        };
                    }])
                .directive('uiBrCpfMask', [uiBrCpfMask])
                .directive('uiBrCnpjMask', [uiBrCnpjMask])
                .directive('uiBrCpfcnpjMask', [uiBrCpfCnpjMask])
                // deprecated: will be removed in the next major version
                .directive('uiCpfMask', [uiBrCpfMask])
                // deprecated: will be removed in the next major version
                .directive('uiCnpjMask', [uiBrCnpjMask])
                // deprecated: will be removed in the next major version
                .directive('uiCpfcnpjMask', [uiBrCpfCnpjMask])
                .directive('uiMoneyMask', ['$locale', '$parse', function ($locale, $parse) {
                        return {
                            restrict: 'A',
                            require: '?ngModel',
                            link: function (scope, element, attrs, ctrl) {
                                var decimalDelimiter = $locale.NUMBER_FORMATS.DECIMAL_SEP,
                                        thousandsDelimiter = $locale.NUMBER_FORMATS.GROUP_SEP,
                                        currencySym = $locale.NUMBER_FORMATS.CURRENCY_SYM,
                                        decimals = parseInt(attrs.uiMoneyMask);

                                if (!ctrl) {
                                    return;
                                }

                                if (angular.isDefined(attrs.uiHideGroupSep)) {
                                    thousandsDelimiter = '';
                                }

                                if (isNaN(decimals)) {
                                    decimals = 2;
                                }
                                var decimalsPattern = decimals > 0 ? decimalDelimiter + new Array(decimals + 1).join('0') : '';
                                var maskPattern = currencySym + ' #' + thousandsDelimiter + '##0' + decimalsPattern;
                                var moneyMask = new StringMask(maskPattern, {reverse: true});

                                ctrl.$formatters.push(function (value) {
                                    if (!value) {
                                        return value;
                                    }

                                    return moneyMask.apply(value.toFixed(decimals).replace(/[^\d]+/g, ''));
                                });

                                function parse(value) {
                                    if (!value) {
                                        return value;
                                    }

                                    var actualNumber = value.replace(/[^\d]+/g, '');
                                    actualNumber = actualNumber.replace(/^[0]+([1-9])/, '$1');
                                    var formatedValue = moneyMask.apply(actualNumber);

                                    if (value !== formatedValue) {
                                        ctrl.$setViewValue(formatedValue);
                                        ctrl.$render();
                                    }

                                    return formatedValue ? parseInt(formatedValue.replace(/[^\d]+/g, '')) / Math.pow(10, decimals) : null;
                                }

                                ctrl.$parsers.push(parse);

                                if (attrs.uiMoneyMask) {
                                    scope.$watch(attrs.uiMoneyMask, function (decimals) {
                                        if (isNaN(decimals)) {
                                            decimals = 2;
                                        }
                                        decimalsPattern = decimals > 0 ? decimalDelimiter + new Array(decimals + 1).join('0') : '';
                                        maskPattern = currencySym + ' #' + thousandsDelimiter + '##0' + decimalsPattern;
                                        moneyMask = new StringMask(maskPattern, {reverse: true});

                                        parse(ctrl.$viewValue || '');
                                    });
                                }

                                if (attrs.min) {
                                    ctrl.$parsers.push(function (value) {
                                        var min = $parse(attrs.min)(scope);
                                        return minValidator(ctrl, value, min);
                                    });

                                    scope.$watch(attrs.min, function (value) {
                                        minValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }

                                if (attrs.max) {
                                    ctrl.$parsers.push(function (value) {
                                        var max = $parse(attrs.max)(scope);
                                        return maxValidator(ctrl, value, max);
                                    });

                                    scope.$watch(attrs.max, function (value) {
                                        maxValidator(ctrl, ctrl.$modelValue, value);
                                    });
                                }
                            }
                        };
                    }])
                .directive('uiBrPhoneNumber', function () {
                    /**
                     * FIXME: all numbers will have 9 digits after 2016.
                     * see http://portal.embratel.com.br/embratel/9-digito/
                     */
                    var phoneMask8D = new StringMask('(00) 0000-0000'),
                            phoneMask9D = new StringMask('(00) 00000-0000');

                    function clearValue(value) {
                        if (!value) {
                            return value;
                        }

                        return value.replace(/[^0-9]/g, '');
                    }

                    function applyPhoneMask(value) {
                        if (!value) {
                            return value;
                        }

                        var formatedValue;
                        if (value.length < 11) {
                            formatedValue = phoneMask8D.apply(value);
                        } else {
                            formatedValue = phoneMask9D.apply(value);
                        }

                        return formatedValue.trim().replace(/[^0-9]$/, '');
                    }

                    return {
                        restrict: 'A',
                        require: '?ngModel',
                        link: function (scope, element, attrs, ctrl) {
                            if (!ctrl) {
                                return;
                            }

                            ctrl.$formatters.push(function (value) {
                                return applyPhoneMask(validateBrPhoneNumber(ctrl, value));
                            });

                            ctrl.$parsers.push(function (value) {
                                if (!value) {
                                    return value;
                                }

                                var cleanValue = clearValue(value);
                                var formatedValue = applyPhoneMask(cleanValue);

                                if (ctrl.$viewValue !== formatedValue) {
                                    ctrl.$setViewValue(formatedValue);
                                    ctrl.$render();
                                }

                                return clearValue(formatedValue);
                            });

                            ctrl.$parsers.push(function (value) {
                                return validateBrPhoneNumber(ctrl, value);
                            });
                        }
                    };
                })
                .directive('uiBrCepMask', function () {
                    var cepMask = new StringMask('00000-000');

                    function clearValue(value) {
                        if (!value) {
                            return value;
                        }

                        return value.replace(/[^0-9]/g, '');
                    }

                    function applyCepMask(value, ctrl) {
                        if (!value) {
                            ctrl.$setValidity('cep', true);
                            return value;
                        }
                        var processed = cepMask.process(value);
                        ctrl.$setValidity('cep', processed.valid);
                        var formatedValue = processed.result;
                        return formatedValue.trim().replace(/[^0-9]$/, '');
                    }

                    return {
                        restrict: 'A',
                        require: '?ngModel',
                        link: function (scope, element, attrs, ctrl) {
                            if (!ctrl) {
                                return;
                            }

                            ctrl.$formatters.push(function (value) {
                                return applyCepMask(value, ctrl);
                            });

                            ctrl.$parsers.push(function (value) {
                                if (!value) {
                                    return applyCepMask(value, ctrl);
                                }

                                var cleanValue = clearValue(value);
                                var formatedValue = applyCepMask(cleanValue, ctrl);

                                if (ctrl.$viewValue !== formatedValue) {
                                    ctrl.$setViewValue(formatedValue);
                                    ctrl.$render();
                                }

                                return clearValue(formatedValue);
                            });
                        }
                    };
                })
                .directive('uiBrIeMask', ['$parse', function ($parse) {

                        var ieMasks = {
                            'AC': [{mask: new StringMask('00.000.000/000-00')}],
                            'AL': [{mask: new StringMask('000000000')}],
                            'AM': [{mask: new StringMask('00.000.000-0')}],
                            'AP': [{mask: new StringMask('000000000')}],
                            'BA': [{chars: 8, mask: new StringMask('000000-00')},
                                {mask: new StringMask('0000000-00')}],
                            'CE': [{mask: new StringMask('00000000-0')}],
                            'DF': [{mask: new StringMask('00000000000-00')}],
                            'ES': [{mask: new StringMask('00000000-0')}],
                            'GO': [{mask: new StringMask('00.000.000-0')}],
                            'MA': [{mask: new StringMask('000000000')}],
                            'MG': [{mask: new StringMask('000.000.000/0000')}],
                            'MS': [{mask: new StringMask('000000000')}],
                            'MT': [{mask: new StringMask('0000000000-0')}],
                            'PA': [{mask: new StringMask('00-000000-0')}],
                            'PB': [{mask: new StringMask('00000000-0')}],
                            'PE': [{chars: 9, mask: new StringMask('0000000-00')},
                                {mask: new StringMask('00.0.000.0000000-0')}],
                            'PI': [{mask: new StringMask('000000000')}],
                            'PR': [{mask: new StringMask('000.00000-00')}],
                            'RJ': [{mask: new StringMask('00.000.00-0')}],
                            'RN': [{chars: 9, mask: new StringMask('00.000.000-0')},
                                {mask: new StringMask('00.0.000.000-0')}],
                            'RO': [{mask: new StringMask('0000000000000-0')}],
                            'RR': [{mask: new StringMask('00000000-0')}],
                            'RS': [{mask: new StringMask('000/0000000')}],
                            'SC': [{mask: new StringMask('000.000.000')}],
                            'SE': [{mask: new StringMask('00000000-0')}],
                            'SP': [{mask: new StringMask('000.000.000.000')},
                                {mask: new StringMask('-00000000.0/000')}],
                            'TO': [{mask: new StringMask('00000000000')}]
                        };

                        function clearValue(value) {
                            if (!value) {
                                return value;
                            }
                            return value.replace(/[^0-9]/g, '');
                        }

                        function getMask(uf, value) {
                            if (!uf || !ieMasks[uf]) {
                                return undefined;
                            }
                            var _uf = uf.toUpperCase();
                            if (_uf === 'SP' && /^P/i.test(value)) {
                                return ieMasks.SP[1].mask;
                            }
                            var masks = ieMasks[uf];
                            var i = 0;
                            while (masks[i].chars && masks[i].chars < clearValue(value).length && i < masks.length - 1) {
                                i++;
                            }
                            return masks[i].mask;
                        }

                        function applyIEMask(value, uf, ctrl) {
                            var mask = getMask(uf, value);
                            if (!value || !mask) {
                                ctrl.$setValidity('ie', true);
                                return value;
                            }
                            var processed = mask.process(clearValue(value));
                            ctrl.$setValidity('ie', BrV.ie(uf).validate(value));
                            var formatedValue = processed.result;
                            if (uf && uf.toUpperCase() === 'SP' && /^p/i.test(value)) {
                                return 'P' + (formatedValue ? formatedValue.trim().replace(/[^0-9]$/, '') : '');
                            }
                            if (!formatedValue) {
                                return formatedValue;
                            }
                            return formatedValue.trim().replace(/[^0-9]$/, '');
                        }

                        return {
                            restrict: 'A',
                            require: '?ngModel',
                            link: function (scope, element, attrs, ctrl) {
                                var state = $parse(attrs.uiBrIeMask)(scope);

                                if (!ctrl) {
                                    return;
                                }

                                scope.$watch(attrs.uiBrIeMask, function (newState) {
                                    state = newState;
                                    applyIEMask(ctrl.$viewValue, state, ctrl);
                                });

                                ctrl.$formatters.push(function (value) {
                                    return applyIEMask(value, state, ctrl);
                                });

                                ctrl.$parsers.push(function (value) {
                                    if (!value) {
                                        return applyIEMask(value, state, ctrl);
                                    }

                                    var formatedValue = applyIEMask(value, state, ctrl);

                                    if (ctrl.$viewValue !== formatedValue) {
                                        ctrl.$setViewValue(formatedValue);
                                        ctrl.$render();
                                    }

                                    if (state && state.toUpperCase() === 'SP' && /^p/i.test(value)) {
                                        return 'P' + clearValue(formatedValue);
                                    }
                                    return clearValue(formatedValue);
                                });
                            }
                        };
                    }]);
    })();

})(angular);

/* ========================================================================
 * Bootstrap: popover.js v3.3.6
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.3.6'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 1.3.3 - 2016-05-22
 * License: MIT
 */angular.module("ui.bootstrap",["ui.bootstrap.tpls","ui.bootstrap.collapse","ui.bootstrap.accordion","ui.bootstrap.alert","ui.bootstrap.buttons","ui.bootstrap.carousel","ui.bootstrap.dateparser","ui.bootstrap.isClass","ui.bootstrap.datepicker","ui.bootstrap.position","ui.bootstrap.datepickerPopup","ui.bootstrap.debounce","ui.bootstrap.dropdown","ui.bootstrap.stackedMap","ui.bootstrap.modal","ui.bootstrap.paging","ui.bootstrap.pager","ui.bootstrap.pagination","ui.bootstrap.tooltip","ui.bootstrap.popover","ui.bootstrap.progressbar","ui.bootstrap.rating","ui.bootstrap.tabs","ui.bootstrap.timepicker","ui.bootstrap.typeahead"]),angular.module("ui.bootstrap.tpls",["uib/template/accordion/accordion-group.html","uib/template/accordion/accordion.html","uib/template/alert/alert.html","uib/template/carousel/carousel.html","uib/template/carousel/slide.html","uib/template/datepicker/datepicker.html","uib/template/datepicker/day.html","uib/template/datepicker/month.html","uib/template/datepicker/year.html","uib/template/datepickerPopup/popup.html","uib/template/modal/backdrop.html","uib/template/modal/window.html","uib/template/pager/pager.html","uib/template/pagination/pagination.html","uib/template/tooltip/tooltip-html-popup.html","uib/template/tooltip/tooltip-popup.html","uib/template/tooltip/tooltip-template-popup.html","uib/template/popover/popover-html.html","uib/template/popover/popover-template.html","uib/template/popover/popover.html","uib/template/progressbar/bar.html","uib/template/progressbar/progress.html","uib/template/progressbar/progressbar.html","uib/template/rating/rating.html","uib/template/tabs/tab.html","uib/template/tabs/tabset.html","uib/template/timepicker/timepicker.html","uib/template/typeahead/typeahead-match.html","uib/template/typeahead/typeahead-popup.html"]),angular.module("ui.bootstrap.collapse",[]).directive("uibCollapse",["$animate","$q","$parse","$injector",function(a,b,c,d){var e=d.has("$animateCss")?d.get("$animateCss"):null;return{link:function(d,f,g){function h(){f.hasClass("collapse")&&f.hasClass("in")||b.resolve(l(d)).then(function(){f.removeClass("collapse").addClass("collapsing").attr("aria-expanded",!0).attr("aria-hidden",!1),e?e(f,{addClass:"in",easing:"ease",to:{height:f[0].scrollHeight+"px"}}).start()["finally"](i):a.addClass(f,"in",{to:{height:f[0].scrollHeight+"px"}}).then(i)})}function i(){f.removeClass("collapsing").addClass("collapse").css({height:"auto"}),m(d)}function j(){return f.hasClass("collapse")||f.hasClass("in")?void b.resolve(n(d)).then(function(){f.css({height:f[0].scrollHeight+"px"}).removeClass("collapse").addClass("collapsing").attr("aria-expanded",!1).attr("aria-hidden",!0),e?e(f,{removeClass:"in",to:{height:"0"}}).start()["finally"](k):a.removeClass(f,"in",{to:{height:"0"}}).then(k)}):k()}function k(){f.css({height:"0"}),f.removeClass("collapsing").addClass("collapse"),o(d)}var l=c(g.expanding),m=c(g.expanded),n=c(g.collapsing),o=c(g.collapsed);d.$eval(g.uibCollapse)||f.addClass("in").addClass("collapse").attr("aria-expanded",!0).attr("aria-hidden",!1).css({height:"auto"}),d.$watch(g.uibCollapse,function(a){a?j():h()})}}}]),angular.module("ui.bootstrap.accordion",["ui.bootstrap.collapse"]).constant("uibAccordionConfig",{closeOthers:!0}).controller("UibAccordionController",["$scope","$attrs","uibAccordionConfig",function(a,b,c){this.groups=[],this.closeOthers=function(d){var e=angular.isDefined(b.closeOthers)?a.$eval(b.closeOthers):c.closeOthers;e&&angular.forEach(this.groups,function(a){a!==d&&(a.isOpen=!1)})},this.addGroup=function(a){var b=this;this.groups.push(a),a.$on("$destroy",function(c){b.removeGroup(a)})},this.removeGroup=function(a){var b=this.groups.indexOf(a);-1!==b&&this.groups.splice(b,1)}}]).directive("uibAccordion",function(){return{controller:"UibAccordionController",controllerAs:"accordion",transclude:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/accordion/accordion.html"}}}).directive("uibAccordionGroup",function(){return{require:"^uibAccordion",transclude:!0,replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/accordion/accordion-group.html"},scope:{heading:"@",panelClass:"@?",isOpen:"=?",isDisabled:"=?"},controller:function(){this.setHeading=function(a){this.heading=a}},link:function(a,b,c,d){d.addGroup(a),a.openClass=c.openClass||"panel-open",a.panelClass=c.panelClass||"panel-default",a.$watch("isOpen",function(c){b.toggleClass(a.openClass,!!c),c&&d.closeOthers(a)}),a.toggleOpen=function(b){a.isDisabled||b&&32!==b.which||(a.isOpen=!a.isOpen)};var e="accordiongroup-"+a.$id+"-"+Math.floor(1e4*Math.random());a.headingId=e+"-tab",a.panelId=e+"-panel"}}}).directive("uibAccordionHeading",function(){return{transclude:!0,template:"",replace:!0,require:"^uibAccordionGroup",link:function(a,b,c,d,e){d.setHeading(e(a,angular.noop))}}}).directive("uibAccordionTransclude",function(){function a(){return"uib-accordion-header,data-uib-accordion-header,x-uib-accordion-header,uib\\:accordion-header,[uib-accordion-header],[data-uib-accordion-header],[x-uib-accordion-header]"}return{require:"^uibAccordionGroup",link:function(b,c,d,e){b.$watch(function(){return e[d.uibAccordionTransclude]},function(b){if(b){var d=angular.element(c[0].querySelector(a()));d.html(""),d.append(b)}})}}}),angular.module("ui.bootstrap.alert",[]).controller("UibAlertController",["$scope","$attrs","$interpolate","$timeout",function(a,b,c,d){a.closeable=!!b.close;var e=angular.isDefined(b.dismissOnTimeout)?c(b.dismissOnTimeout)(a.$parent):null;e&&d(function(){a.close()},parseInt(e,10))}]).directive("uibAlert",function(){return{controller:"UibAlertController",controllerAs:"alert",templateUrl:function(a,b){return b.templateUrl||"uib/template/alert/alert.html"},transclude:!0,replace:!0,scope:{type:"@",close:"&"}}}),angular.module("ui.bootstrap.buttons",[]).constant("uibButtonConfig",{activeClass:"active",toggleEvent:"click"}).controller("UibButtonsController",["uibButtonConfig",function(a){this.activeClass=a.activeClass||"active",this.toggleEvent=a.toggleEvent||"click"}]).directive("uibBtnRadio",["$parse",function(a){return{require:["uibBtnRadio","ngModel"],controller:"UibButtonsController",controllerAs:"buttons",link:function(b,c,d,e){var f=e[0],g=e[1],h=a(d.uibUncheckable);c.find("input").css({display:"none"}),g.$render=function(){c.toggleClass(f.activeClass,angular.equals(g.$modelValue,b.$eval(d.uibBtnRadio)))},c.on(f.toggleEvent,function(){if(!d.disabled){var a=c.hasClass(f.activeClass);a&&!angular.isDefined(d.uncheckable)||b.$apply(function(){g.$setViewValue(a?null:b.$eval(d.uibBtnRadio)),g.$render()})}}),d.uibUncheckable&&b.$watch(h,function(a){d.$set("uncheckable",a?"":void 0)})}}}]).directive("uibBtnCheckbox",function(){return{require:["uibBtnCheckbox","ngModel"],controller:"UibButtonsController",controllerAs:"button",link:function(a,b,c,d){function e(){return g(c.btnCheckboxTrue,!0)}function f(){return g(c.btnCheckboxFalse,!1)}function g(b,c){return angular.isDefined(b)?a.$eval(b):c}var h=d[0],i=d[1];b.find("input").css({display:"none"}),i.$render=function(){b.toggleClass(h.activeClass,angular.equals(i.$modelValue,e()))},b.on(h.toggleEvent,function(){c.disabled||a.$apply(function(){i.$setViewValue(b.hasClass(h.activeClass)?f():e()),i.$render()})})}}}),angular.module("ui.bootstrap.carousel",[]).controller("UibCarouselController",["$scope","$element","$interval","$timeout","$animate",function(a,b,c,d,e){function f(){for(;t.length;)t.shift()}function g(a){for(var b=0;b<q.length;b++)q[b].slide.active=b===a}function h(c,d,i){if(!u){if(angular.extend(c,{direction:i}),angular.extend(q[s].slide||{},{direction:i}),e.enabled(b)&&!a.$currentTransition&&q[d].element&&p.slides.length>1){q[d].element.data(r,c.direction);var j=p.getCurrentIndex();angular.isNumber(j)&&q[j].element&&q[j].element.data(r,c.direction),a.$currentTransition=!0,e.on("addClass",q[d].element,function(b,c){if("close"===c&&(a.$currentTransition=null,e.off("addClass",b),t.length)){var d=t.pop().slide,g=d.index,i=g>p.getCurrentIndex()?"next":"prev";f(),h(d,g,i)}})}a.active=c.index,s=c.index,g(d),l()}}function i(a){for(var b=0;b<q.length;b++)if(q[b].slide===a)return b}function j(){n&&(c.cancel(n),n=null)}function k(b){b.length||(a.$currentTransition=null,f())}function l(){j();var b=+a.interval;!isNaN(b)&&b>0&&(n=c(m,b))}function m(){var b=+a.interval;o&&!isNaN(b)&&b>0&&q.length?a.next():a.pause()}var n,o,p=this,q=p.slides=a.slides=[],r="uib-slideDirection",s=a.active,t=[],u=!1;p.addSlide=function(b,c){q.push({slide:b,element:c}),q.sort(function(a,b){return+a.slide.index-+b.slide.index}),(b.index===a.active||1===q.length&&!angular.isNumber(a.active))&&(a.$currentTransition&&(a.$currentTransition=null),s=b.index,a.active=b.index,g(s),p.select(q[i(b)]),1===q.length&&a.play())},p.getCurrentIndex=function(){for(var a=0;a<q.length;a++)if(q[a].slide.index===s)return a},p.next=a.next=function(){var b=(p.getCurrentIndex()+1)%q.length;return 0===b&&a.noWrap()?void a.pause():p.select(q[b],"next")},p.prev=a.prev=function(){var b=p.getCurrentIndex()-1<0?q.length-1:p.getCurrentIndex()-1;return a.noWrap()&&b===q.length-1?void a.pause():p.select(q[b],"prev")},p.removeSlide=function(b){var c=i(b),d=t.indexOf(q[c]);-1!==d&&t.splice(d,1),q.splice(c,1),q.length>0&&s===c?c>=q.length?(s=q.length-1,a.active=s,g(s),p.select(q[q.length-1])):(s=c,a.active=s,g(s),p.select(q[c])):s>c&&(s--,a.active=s),0===q.length&&(s=null,a.active=null,f())},p.select=a.select=function(b,c){var d=i(b.slide);void 0===c&&(c=d>p.getCurrentIndex()?"next":"prev"),b.slide.index===s||a.$currentTransition?b&&b.slide.index!==s&&a.$currentTransition&&t.push(q[d]):h(b.slide,d,c)},a.indexOfSlide=function(a){return+a.slide.index},a.isActive=function(b){return a.active===b.slide.index},a.isPrevDisabled=function(){return 0===a.active&&a.noWrap()},a.isNextDisabled=function(){return a.active===q.length-1&&a.noWrap()},a.pause=function(){a.noPause||(o=!1,j())},a.play=function(){o||(o=!0,l())},a.$on("$destroy",function(){u=!0,j()}),a.$watch("noTransition",function(a){e.enabled(b,!a)}),a.$watch("interval",l),a.$watchCollection("slides",k),a.$watch("active",function(a){if(angular.isNumber(a)&&s!==a){for(var b=0;b<q.length;b++)if(q[b].slide.index===a){a=b;break}var c=q[a];c&&(g(a),p.select(q[a]),s=a)}})}]).directive("uibCarousel",function(){return{transclude:!0,replace:!0,controller:"UibCarouselController",controllerAs:"carousel",templateUrl:function(a,b){return b.templateUrl||"uib/template/carousel/carousel.html"},scope:{active:"=",interval:"=",noTransition:"=",noPause:"=",noWrap:"&"}}}).directive("uibSlide",function(){return{require:"^uibCarousel",transclude:!0,replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/carousel/slide.html"},scope:{actual:"=?",index:"=?"},link:function(a,b,c,d){d.addSlide(a,b),a.$on("$destroy",function(){d.removeSlide(a)})}}}).animation(".item",["$animateCss",function(a){function b(a,b,c){a.removeClass(b),c&&c()}var c="uib-slideDirection";return{beforeAddClass:function(d,e,f){if("active"===e){var g=!1,h=d.data(c),i="next"===h?"left":"right",j=b.bind(this,d,i+" "+h,f);return d.addClass(h),a(d,{addClass:i}).start().done(j),function(){g=!0}}f()},beforeRemoveClass:function(d,e,f){if("active"===e){var g=!1,h=d.data(c),i="next"===h?"left":"right",j=b.bind(this,d,i,f);return a(d,{addClass:i}).start().done(j),function(){g=!0}}f()}}}]),angular.module("ui.bootstrap.dateparser",[]).service("uibDateParser",["$log","$locale","dateFilter","orderByFilter",function(a,b,c,d){function e(a,b){var c=[],e=a.split(""),f=a.indexOf("'");if(f>-1){var g=!1;a=a.split("");for(var h=f;h<a.length;h++)g?("'"===a[h]&&(h+1<a.length&&"'"===a[h+1]?(a[h+1]="$",e[h+1]=""):(e[h]="",g=!1)),a[h]="$"):"'"===a[h]&&(a[h]="$",e[h]="",g=!0);a=a.join("")}return angular.forEach(n,function(d){var f=a.indexOf(d.key);if(f>-1){a=a.split(""),e[f]="("+d.regex+")",a[f]="$";for(var g=f+1,h=f+d.key.length;h>g;g++)e[g]="",a[g]="$";a=a.join(""),c.push({index:f,key:d.key,apply:d[b],matcher:d.regex})}}),{regex:new RegExp("^"+e.join("")+"$"),map:d(c,"index")}}function f(a,b,c){return 1>c?!1:1===b&&c>28?29===c&&(a%4===0&&a%100!==0||a%400===0):3===b||5===b||8===b||10===b?31>c:!0}function g(a){return parseInt(a,10)}function h(a,b){return a&&b?l(a,b):a}function i(a,b){return a&&b?l(a,b,!0):a}function j(a,b){a=a.replace(/:/g,"");var c=Date.parse("Jan 01, 1970 00:00:00 "+a)/6e4;return isNaN(c)?b:c}function k(a,b){return a=new Date(a.getTime()),a.setMinutes(a.getMinutes()+b),a}function l(a,b,c){c=c?-1:1;var d=a.getTimezoneOffset(),e=j(b,d);return k(a,c*(e-d))}var m,n,o=/[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;this.init=function(){m=b.id,this.parsers={},this.formatters={},n=[{key:"yyyy",regex:"\\d{4}",apply:function(a){this.year=+a},formatter:function(a){var b=new Date;return b.setFullYear(Math.abs(a.getFullYear())),c(b,"yyyy")}},{key:"yy",regex:"\\d{2}",apply:function(a){a=+a,this.year=69>a?a+2e3:a+1900},formatter:function(a){var b=new Date;return b.setFullYear(Math.abs(a.getFullYear())),c(b,"yy")}},{key:"y",regex:"\\d{1,4}",apply:function(a){this.year=+a},formatter:function(a){var b=new Date;return b.setFullYear(Math.abs(a.getFullYear())),c(b,"y")}},{key:"M!",regex:"0?[1-9]|1[0-2]",apply:function(a){this.month=a-1},formatter:function(a){var b=a.getMonth();return/^[0-9]$/.test(b)?c(a,"MM"):c(a,"M")}},{key:"MMMM",regex:b.DATETIME_FORMATS.MONTH.join("|"),apply:function(a){this.month=b.DATETIME_FORMATS.MONTH.indexOf(a)},formatter:function(a){return c(a,"MMMM")}},{key:"MMM",regex:b.DATETIME_FORMATS.SHORTMONTH.join("|"),apply:function(a){this.month=b.DATETIME_FORMATS.SHORTMONTH.indexOf(a)},formatter:function(a){return c(a,"MMM")}},{key:"MM",regex:"0[1-9]|1[0-2]",apply:function(a){this.month=a-1},formatter:function(a){return c(a,"MM")}},{key:"M",regex:"[1-9]|1[0-2]",apply:function(a){this.month=a-1},formatter:function(a){return c(a,"M")}},{key:"d!",regex:"[0-2]?[0-9]{1}|3[0-1]{1}",apply:function(a){this.date=+a},formatter:function(a){var b=a.getDate();return/^[1-9]$/.test(b)?c(a,"dd"):c(a,"d")}},{key:"dd",regex:"[0-2][0-9]{1}|3[0-1]{1}",apply:function(a){this.date=+a},formatter:function(a){return c(a,"dd")}},{key:"d",regex:"[1-2]?[0-9]{1}|3[0-1]{1}",apply:function(a){this.date=+a},formatter:function(a){return c(a,"d")}},{key:"EEEE",regex:b.DATETIME_FORMATS.DAY.join("|"),formatter:function(a){return c(a,"EEEE")}},{key:"EEE",regex:b.DATETIME_FORMATS.SHORTDAY.join("|"),formatter:function(a){return c(a,"EEE")}},{key:"HH",regex:"(?:0|1)[0-9]|2[0-3]",apply:function(a){this.hours=+a},formatter:function(a){return c(a,"HH")}},{key:"hh",regex:"0[0-9]|1[0-2]",apply:function(a){this.hours=+a},formatter:function(a){return c(a,"hh")}},{key:"H",regex:"1?[0-9]|2[0-3]",apply:function(a){this.hours=+a},formatter:function(a){return c(a,"H")}},{key:"h",regex:"[0-9]|1[0-2]",apply:function(a){this.hours=+a},formatter:function(a){return c(a,"h")}},{key:"mm",regex:"[0-5][0-9]",apply:function(a){this.minutes=+a},formatter:function(a){return c(a,"mm")}},{key:"m",regex:"[0-9]|[1-5][0-9]",apply:function(a){this.minutes=+a},formatter:function(a){return c(a,"m")}},{key:"sss",regex:"[0-9][0-9][0-9]",apply:function(a){this.milliseconds=+a},formatter:function(a){return c(a,"sss")}},{key:"ss",regex:"[0-5][0-9]",apply:function(a){this.seconds=+a},formatter:function(a){return c(a,"ss")}},{key:"s",regex:"[0-9]|[1-5][0-9]",apply:function(a){this.seconds=+a},formatter:function(a){return c(a,"s")}},{key:"a",regex:b.DATETIME_FORMATS.AMPMS.join("|"),apply:function(a){12===this.hours&&(this.hours=0),"PM"===a&&(this.hours+=12)},formatter:function(a){return c(a,"a")}},{key:"Z",regex:"[+-]\\d{4}",apply:function(a){var b=a.match(/([+-])(\d{2})(\d{2})/),c=b[1],d=b[2],e=b[3];this.hours+=g(c+d),this.minutes+=g(c+e)},formatter:function(a){return c(a,"Z")}},{key:"ww",regex:"[0-4][0-9]|5[0-3]",formatter:function(a){return c(a,"ww")}},{key:"w",regex:"[0-9]|[1-4][0-9]|5[0-3]",formatter:function(a){return c(a,"w")}},{key:"GGGG",regex:b.DATETIME_FORMATS.ERANAMES.join("|").replace(/\s/g,"\\s"),formatter:function(a){return c(a,"GGGG")}},{key:"GGG",regex:b.DATETIME_FORMATS.ERAS.join("|"),formatter:function(a){return c(a,"GGG")}},{key:"GG",regex:b.DATETIME_FORMATS.ERAS.join("|"),formatter:function(a){return c(a,"GG")}},{key:"G",regex:b.DATETIME_FORMATS.ERAS.join("|"),formatter:function(a){return c(a,"G")}}]},this.init(),this.filter=function(a,c){if(!angular.isDate(a)||isNaN(a)||!c)return"";c=b.DATETIME_FORMATS[c]||c,b.id!==m&&this.init(),this.formatters[c]||(this.formatters[c]=e(c,"formatter"));var d=this.formatters[c],f=d.map,g=c;return f.reduce(function(b,c,d){var e=g.match(new RegExp("(.*)"+c.key));e&&angular.isString(e[1])&&(b+=e[1],g=g.replace(e[1]+c.key,""));var h=d===f.length-1?g:"";return c.apply?b+c.apply.call(null,a)+h:b+h},"")},this.parse=function(c,d,g){if(!angular.isString(c)||!d)return c;d=b.DATETIME_FORMATS[d]||d,d=d.replace(o,"\\$&"),b.id!==m&&this.init(),this.parsers[d]||(this.parsers[d]=e(d,"apply"));var h=this.parsers[d],i=h.regex,j=h.map,k=c.match(i),l=!1;if(k&&k.length){var n,p;angular.isDate(g)&&!isNaN(g.getTime())?n={year:g.getFullYear(),month:g.getMonth(),date:g.getDate(),hours:g.getHours(),minutes:g.getMinutes(),seconds:g.getSeconds(),milliseconds:g.getMilliseconds()}:(g&&a.warn("dateparser:","baseDate is not a valid date"),n={year:1900,month:0,date:1,hours:0,minutes:0,seconds:0,milliseconds:0});for(var q=1,r=k.length;r>q;q++){var s=j[q-1];"Z"===s.matcher&&(l=!0),s.apply&&s.apply.call(n,k[q])}var t=l?Date.prototype.setUTCFullYear:Date.prototype.setFullYear,u=l?Date.prototype.setUTCHours:Date.prototype.setHours;return f(n.year,n.month,n.date)&&(!angular.isDate(g)||isNaN(g.getTime())||l?(p=new Date(0),t.call(p,n.year,n.month,n.date),u.call(p,n.hours||0,n.minutes||0,n.seconds||0,n.milliseconds||0)):(p=new Date(g),t.call(p,n.year,n.month,n.date),u.call(p,n.hours,n.minutes,n.seconds,n.milliseconds))),p}},this.toTimezone=h,this.fromTimezone=i,this.timezoneToOffset=j,this.addDateMinutes=k,this.convertTimezoneToLocal=l}]),angular.module("ui.bootstrap.isClass",[]).directive("uibIsClass",["$animate",function(a){var b=/^\s*([\s\S]+?)\s+on\s+([\s\S]+?)\s*$/,c=/^\s*([\s\S]+?)\s+for\s+([\s\S]+?)\s*$/;return{restrict:"A",compile:function(d,e){function f(a,b,c){i.push(a),j.push({scope:a,element:b}),o.forEach(function(b,c){g(b,a)}),a.$on("$destroy",h)}function g(b,d){var e=b.match(c),f=d.$eval(e[1]),g=e[2],h=k[b];if(!h){var i=function(b){var c=null;j.some(function(a){var d=a.scope.$eval(m);return d===b?(c=a,!0):void 0}),h.lastActivated!==c&&(h.lastActivated&&a.removeClass(h.lastActivated.element,f),c&&a.addClass(c.element,f),h.lastActivated=c)};k[b]=h={lastActivated:null,scope:d,watchFn:i,compareWithExp:g,watcher:d.$watch(g,i)}}h.watchFn(d.$eval(g))}function h(a){var b=a.targetScope,c=i.indexOf(b);if(i.splice(c,1),j.splice(c,1),i.length){var d=i[0];angular.forEach(k,function(a){a.scope===b&&(a.watcher=d.$watch(a.compareWithExp,a.watchFn),a.scope=d)})}else k={}}var i=[],j=[],k={},l=e.uibIsClass.match(b),m=l[2],n=l[1],o=n.split(",");return f}}}]),angular.module("ui.bootstrap.datepicker",["ui.bootstrap.dateparser","ui.bootstrap.isClass"]).value("$datepickerSuppressError",!1).value("$datepickerLiteralWarning",!0).constant("uibDatepickerConfig",{datepickerMode:"day",formatDay:"dd",formatMonth:"MMMM",formatYear:"yyyy",formatDayHeader:"EEE",formatDayTitle:"MMMM yyyy",formatMonthTitle:"yyyy",maxDate:null,maxMode:"year",minDate:null,minMode:"day",ngModelOptions:{},shortcutPropagation:!1,showWeeks:!0,yearColumns:5,yearRows:4}).controller("UibDatepickerController",["$scope","$attrs","$parse","$interpolate","$locale","$log","dateFilter","uibDatepickerConfig","$datepickerLiteralWarning","$datepickerSuppressError","uibDateParser",function(a,b,c,d,e,f,g,h,i,j,k){function l(b){a.datepickerMode=b,a.datepickerOptions.datepickerMode=b}var m=this,n={$setViewValue:angular.noop},o={},p=[];!!b.datepickerOptions;a.datepickerOptions||(a.datepickerOptions={}),this.modes=["day","month","year"],["customClass","dateDisabled","datepickerMode","formatDay","formatDayHeader","formatDayTitle","formatMonth","formatMonthTitle","formatYear","maxDate","maxMode","minDate","minMode","showWeeks","shortcutPropagation","startingDay","yearColumns","yearRows"].forEach(function(b){switch(b){case"customClass":case"dateDisabled":a[b]=a.datepickerOptions[b]||angular.noop;break;case"datepickerMode":a.datepickerMode=angular.isDefined(a.datepickerOptions.datepickerMode)?a.datepickerOptions.datepickerMode:h.datepickerMode;break;case"formatDay":case"formatDayHeader":case"formatDayTitle":case"formatMonth":case"formatMonthTitle":case"formatYear":m[b]=angular.isDefined(a.datepickerOptions[b])?d(a.datepickerOptions[b])(a.$parent):h[b];break;case"showWeeks":case"shortcutPropagation":case"yearColumns":case"yearRows":m[b]=angular.isDefined(a.datepickerOptions[b])?a.datepickerOptions[b]:h[b];break;case"startingDay":angular.isDefined(a.datepickerOptions.startingDay)?m.startingDay=a.datepickerOptions.startingDay:angular.isNumber(h.startingDay)?m.startingDay=h.startingDay:m.startingDay=(e.DATETIME_FORMATS.FIRSTDAYOFWEEK+8)%7;break;case"maxDate":case"minDate":a.$watch("datepickerOptions."+b,function(a){a?angular.isDate(a)?m[b]=k.fromTimezone(new Date(a),o.timezone):(i&&f.warn("Literal date support has been deprecated, please switch to date object usage"),m[b]=new Date(g(a,"medium"))):m[b]=h[b]?k.fromTimezone(new Date(h[b]),o.timezone):null,m.refreshView()});break;case"maxMode":case"minMode":a.datepickerOptions[b]?a.$watch(function(){return a.datepickerOptions[b]},function(c){m[b]=a[b]=angular.isDefined(c)?c:datepickerOptions[b],("minMode"===b&&m.modes.indexOf(a.datepickerOptions.datepickerMode)<m.modes.indexOf(m[b])||"maxMode"===b&&m.modes.indexOf(a.datepickerOptions.datepickerMode)>m.modes.indexOf(m[b]))&&(a.datepickerMode=m[b],a.datepickerOptions.datepickerMode=m[b])}):m[b]=a[b]=h[b]||null}}),a.uniqueId="datepicker-"+a.$id+"-"+Math.floor(1e4*Math.random()),a.disabled=angular.isDefined(b.disabled)||!1,angular.isDefined(b.ngDisabled)&&p.push(a.$parent.$watch(b.ngDisabled,function(b){a.disabled=b,m.refreshView()})),a.isActive=function(b){return 0===m.compare(b.date,m.activeDate)?(a.activeDateId=b.uid,!0):!1},this.init=function(b){n=b,o=b.$options||h.ngModelOptions,a.datepickerOptions.initDate?(m.activeDate=k.fromTimezone(a.datepickerOptions.initDate,o.timezone)||new Date,a.$watch("datepickerOptions.initDate",function(a){a&&(n.$isEmpty(n.$modelValue)||n.$invalid)&&(m.activeDate=k.fromTimezone(a,o.timezone),m.refreshView())})):m.activeDate=new Date;var c=n.$modelValue?new Date(n.$modelValue):new Date;this.activeDate=isNaN(c)?k.fromTimezone(new Date,o.timezone):k.fromTimezone(c,o.timezone),n.$render=function(){m.render()}},this.render=function(){if(n.$viewValue){var a=new Date(n.$viewValue),b=!isNaN(a);b?this.activeDate=k.fromTimezone(a,o.timezone):j||f.error('Datepicker directive: "ng-model" value must be a Date object')}this.refreshView()},this.refreshView=function(){if(this.element){a.selectedDt=null,this._refreshView(),a.activeDt&&(a.activeDateId=a.activeDt.uid);var b=n.$viewValue?new Date(n.$viewValue):null;b=k.fromTimezone(b,o.timezone),n.$setValidity("dateDisabled",!b||this.element&&!this.isDisabled(b))}},this.createDateObject=function(b,c){var d=n.$viewValue?new Date(n.$viewValue):null;d=k.fromTimezone(d,o.timezone);var e=new Date;e=k.fromTimezone(e,o.timezone);var f=this.compare(b,e),g={date:b,label:k.filter(b,c),selected:d&&0===this.compare(b,d),disabled:this.isDisabled(b),past:0>f,current:0===f,future:f>0,customClass:this.customClass(b)||null};return d&&0===this.compare(b,d)&&(a.selectedDt=g),m.activeDate&&0===this.compare(g.date,m.activeDate)&&(a.activeDt=g),g},this.isDisabled=function(b){return a.disabled||this.minDate&&this.compare(b,this.minDate)<0||this.maxDate&&this.compare(b,this.maxDate)>0||a.dateDisabled&&a.dateDisabled({date:b,mode:a.datepickerMode})},this.customClass=function(b){return a.customClass({date:b,mode:a.datepickerMode})},this.split=function(a,b){for(var c=[];a.length>0;)c.push(a.splice(0,b));return c},a.select=function(b){if(a.datepickerMode===m.minMode){var c=n.$viewValue?k.fromTimezone(new Date(n.$viewValue),o.timezone):new Date(0,0,0,0,0,0,0);c.setFullYear(b.getFullYear(),b.getMonth(),b.getDate()),c=k.toTimezone(c,o.timezone),n.$setViewValue(c),n.$render()}else m.activeDate=b,l(m.modes[m.modes.indexOf(a.datepickerMode)-1]),a.$emit("uib:datepicker.mode");a.$broadcast("uib:datepicker.focus")},a.move=function(a){var b=m.activeDate.getFullYear()+a*(m.step.years||0),c=m.activeDate.getMonth()+a*(m.step.months||0);m.activeDate.setFullYear(b,c,1),m.refreshView()},a.toggleMode=function(b){b=b||1,a.datepickerMode===m.maxMode&&1===b||a.datepickerMode===m.minMode&&-1===b||(l(m.modes[m.modes.indexOf(a.datepickerMode)+b]),a.$emit("uib:datepicker.mode"))},a.keys={13:"enter",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down"};var q=function(){m.element[0].focus()};a.$on("uib:datepicker.focus",q),a.keydown=function(b){var c=a.keys[b.which];if(c&&!b.shiftKey&&!b.altKey&&!a.disabled)if(b.preventDefault(),m.shortcutPropagation||b.stopPropagation(),"enter"===c||"space"===c){if(m.isDisabled(m.activeDate))return;a.select(m.activeDate)}else!b.ctrlKey||"up"!==c&&"down"!==c?(m.handleKeyDown(c,b),m.refreshView()):a.toggleMode("up"===c?1:-1)},a.$on("$destroy",function(){for(;p.length;)p.shift()()})}]).controller("UibDaypickerController",["$scope","$element","dateFilter",function(a,b,c){function d(a,b){return 1!==b||a%4!==0||a%100===0&&a%400!==0?f[b]:29}function e(a){var b=new Date(a);b.setDate(b.getDate()+4-(b.getDay()||7));var c=b.getTime();return b.setMonth(0),b.setDate(1),Math.floor(Math.round((c-b)/864e5)/7)+1}var f=[31,28,31,30,31,30,31,31,30,31,30,31];this.step={months:1},this.element=b,this.init=function(b){angular.extend(b,this),a.showWeeks=b.showWeeks,b.refreshView()},this.getDates=function(a,b){for(var c,d=new Array(b),e=new Date(a),f=0;b>f;)c=new Date(e),d[f++]=c,e.setDate(e.getDate()+1);return d},this._refreshView=function(){var b=this.activeDate.getFullYear(),d=this.activeDate.getMonth(),f=new Date(this.activeDate);f.setFullYear(b,d,1);var g=this.startingDay-f.getDay(),h=g>0?7-g:-g,i=new Date(f);h>0&&i.setDate(-h+1);for(var j=this.getDates(i,42),k=0;42>k;k++)j[k]=angular.extend(this.createDateObject(j[k],this.formatDay),{secondary:j[k].getMonth()!==d,uid:a.uniqueId+"-"+k});a.labels=new Array(7);for(var l=0;7>l;l++)a.labels[l]={abbr:c(j[l].date,this.formatDayHeader),full:c(j[l].date,"EEEE")};if(a.title=c(this.activeDate,this.formatDayTitle),a.rows=this.split(j,7),a.showWeeks){a.weekNumbers=[];for(var m=(11-this.startingDay)%7,n=a.rows.length,o=0;n>o;o++)a.weekNumbers.push(e(a.rows[o][m].date))}},this.compare=function(a,b){var c=new Date(a.getFullYear(),a.getMonth(),a.getDate()),d=new Date(b.getFullYear(),b.getMonth(),b.getDate());return c.setFullYear(a.getFullYear()),d.setFullYear(b.getFullYear()),c-d},this.handleKeyDown=function(a,b){var c=this.activeDate.getDate();if("left"===a)c-=1;else if("up"===a)c-=7;else if("right"===a)c+=1;else if("down"===a)c+=7;else if("pageup"===a||"pagedown"===a){var e=this.activeDate.getMonth()+("pageup"===a?-1:1);this.activeDate.setMonth(e,1),c=Math.min(d(this.activeDate.getFullYear(),this.activeDate.getMonth()),c)}else"home"===a?c=1:"end"===a&&(c=d(this.activeDate.getFullYear(),this.activeDate.getMonth()));this.activeDate.setDate(c)}}]).controller("UibMonthpickerController",["$scope","$element","dateFilter",function(a,b,c){this.step={years:1},this.element=b,this.init=function(a){angular.extend(a,this),a.refreshView()},this._refreshView=function(){for(var b,d=new Array(12),e=this.activeDate.getFullYear(),f=0;12>f;f++)b=new Date(this.activeDate),b.setFullYear(e,f,1),d[f]=angular.extend(this.createDateObject(b,this.formatMonth),{uid:a.uniqueId+"-"+f});a.title=c(this.activeDate,this.formatMonthTitle),a.rows=this.split(d,3)},this.compare=function(a,b){var c=new Date(a.getFullYear(),a.getMonth()),d=new Date(b.getFullYear(),b.getMonth());return c.setFullYear(a.getFullYear()),d.setFullYear(b.getFullYear()),c-d},this.handleKeyDown=function(a,b){var c=this.activeDate.getMonth();if("left"===a)c-=1;else if("up"===a)c-=3;else if("right"===a)c+=1;else if("down"===a)c+=3;else if("pageup"===a||"pagedown"===a){var d=this.activeDate.getFullYear()+("pageup"===a?-1:1);this.activeDate.setFullYear(d)}else"home"===a?c=0:"end"===a&&(c=11);this.activeDate.setMonth(c)}}]).controller("UibYearpickerController",["$scope","$element","dateFilter",function(a,b,c){function d(a){return parseInt((a-1)/f,10)*f+1}var e,f;this.element=b,this.yearpickerInit=function(){e=this.yearColumns,f=this.yearRows*e,this.step={years:f}},this._refreshView=function(){for(var b,c=new Array(f),g=0,h=d(this.activeDate.getFullYear());f>g;g++)b=new Date(this.activeDate),b.setFullYear(h+g,0,1),c[g]=angular.extend(this.createDateObject(b,this.formatYear),{uid:a.uniqueId+"-"+g});a.title=[c[0].label,c[f-1].label].join(" - "),a.rows=this.split(c,e),a.columns=e},this.compare=function(a,b){return a.getFullYear()-b.getFullYear()},this.handleKeyDown=function(a,b){var c=this.activeDate.getFullYear();"left"===a?c-=1:"up"===a?c-=e:"right"===a?c+=1:"down"===a?c+=e:"pageup"===a||"pagedown"===a?c+=("pageup"===a?-1:1)*f:"home"===a?c=d(this.activeDate.getFullYear()):"end"===a&&(c=d(this.activeDate.getFullYear())+f-1),this.activeDate.setFullYear(c)}}]).directive("uibDatepicker",function(){return{replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/datepicker/datepicker.html"},scope:{datepickerOptions:"=?"},require:["uibDatepicker","^ngModel"],controller:"UibDatepickerController",controllerAs:"datepicker",link:function(a,b,c,d){var e=d[0],f=d[1];e.init(f)}}}).directive("uibDaypicker",function(){return{replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/datepicker/day.html"},require:["^uibDatepicker","uibDaypicker"],controller:"UibDaypickerController",link:function(a,b,c,d){var e=d[0],f=d[1];f.init(e)}}}).directive("uibMonthpicker",function(){return{replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/datepicker/month.html"},require:["^uibDatepicker","uibMonthpicker"],controller:"UibMonthpickerController",link:function(a,b,c,d){var e=d[0],f=d[1];f.init(e)}}}).directive("uibYearpicker",function(){return{replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/datepicker/year.html"},require:["^uibDatepicker","uibYearpicker"],controller:"UibYearpickerController",link:function(a,b,c,d){var e=d[0];angular.extend(e,d[1]),e.yearpickerInit(),e.refreshView()}}}),angular.module("ui.bootstrap.position",[]).factory("$uibPosition",["$document","$window",function(a,b){var c,d,e={normal:/(auto|scroll)/,hidden:/(auto|scroll|hidden)/},f={auto:/\s?auto?\s?/i,primary:/^(top|bottom|left|right)$/,secondary:/^(top|bottom|left|right|center)$/,vertical:/^(top|bottom)$/},g=/(HTML|BODY)/;return{getRawNode:function(a){return a.nodeName?a:a[0]||a},parseStyle:function(a){return a=parseFloat(a),isFinite(a)?a:0},offsetParent:function(c){function d(a){return"static"===(b.getComputedStyle(a).position||"static")}c=this.getRawNode(c);for(var e=c.offsetParent||a[0].documentElement;e&&e!==a[0].documentElement&&d(e);)e=e.offsetParent;return e||a[0].documentElement},scrollbarWidth:function(e){if(e){if(angular.isUndefined(d)){var f=a.find("body");f.addClass("uib-position-body-scrollbar-measure"),d=b.innerWidth-f[0].clientWidth,d=isFinite(d)?d:0,f.removeClass("uib-position-body-scrollbar-measure")}return d}if(angular.isUndefined(c)){var g=angular.element('<div class="uib-position-scrollbar-measure"></div>');a.find("body").append(g),c=g[0].offsetWidth-g[0].clientWidth,c=isFinite(c)?c:0,g.remove()}return c},scrollbarPadding:function(a){a=this.getRawNode(a);var c=b.getComputedStyle(a),d=this.parseStyle(c.paddingRight),e=this.parseStyle(c.paddingBottom),f=this.scrollParent(a,!1,!0),h=this.scrollbarWidth(f,g.test(f.tagName));return{scrollbarWidth:h,widthOverflow:f.scrollWidth>f.clientWidth,right:d+h,originalRight:d,heightOverflow:f.scrollHeight>f.clientHeight,
bottom:e+h,originalBottom:e}},isScrollable:function(a,c){a=this.getRawNode(a);var d=c?e.hidden:e.normal,f=b.getComputedStyle(a);return d.test(f.overflow+f.overflowY+f.overflowX)},scrollParent:function(c,d,f){c=this.getRawNode(c);var g=d?e.hidden:e.normal,h=a[0].documentElement,i=b.getComputedStyle(c);if(f&&g.test(i.overflow+i.overflowY+i.overflowX))return c;var j="absolute"===i.position,k=c.parentElement||h;if(k===h||"fixed"===i.position)return h;for(;k.parentElement&&k!==h;){var l=b.getComputedStyle(k);if(j&&"static"!==l.position&&(j=!1),!j&&g.test(l.overflow+l.overflowY+l.overflowX))break;k=k.parentElement}return k},position:function(c,d){c=this.getRawNode(c);var e=this.offset(c);if(d){var f=b.getComputedStyle(c);e.top-=this.parseStyle(f.marginTop),e.left-=this.parseStyle(f.marginLeft)}var g=this.offsetParent(c),h={top:0,left:0};return g!==a[0].documentElement&&(h=this.offset(g),h.top+=g.clientTop-g.scrollTop,h.left+=g.clientLeft-g.scrollLeft),{width:Math.round(angular.isNumber(e.width)?e.width:c.offsetWidth),height:Math.round(angular.isNumber(e.height)?e.height:c.offsetHeight),top:Math.round(e.top-h.top),left:Math.round(e.left-h.left)}},offset:function(c){c=this.getRawNode(c);var d=c.getBoundingClientRect();return{width:Math.round(angular.isNumber(d.width)?d.width:c.offsetWidth),height:Math.round(angular.isNumber(d.height)?d.height:c.offsetHeight),top:Math.round(d.top+(b.pageYOffset||a[0].documentElement.scrollTop)),left:Math.round(d.left+(b.pageXOffset||a[0].documentElement.scrollLeft))}},viewportOffset:function(c,d,e){c=this.getRawNode(c),e=e!==!1;var f=c.getBoundingClientRect(),g={top:0,left:0,bottom:0,right:0},h=d?a[0].documentElement:this.scrollParent(c),i=h.getBoundingClientRect();if(g.top=i.top+h.clientTop,g.left=i.left+h.clientLeft,h===a[0].documentElement&&(g.top+=b.pageYOffset,g.left+=b.pageXOffset),g.bottom=g.top+h.clientHeight,g.right=g.left+h.clientWidth,e){var j=b.getComputedStyle(h);g.top+=this.parseStyle(j.paddingTop),g.bottom-=this.parseStyle(j.paddingBottom),g.left+=this.parseStyle(j.paddingLeft),g.right-=this.parseStyle(j.paddingRight)}return{top:Math.round(f.top-g.top),bottom:Math.round(g.bottom-f.bottom),left:Math.round(f.left-g.left),right:Math.round(g.right-f.right)}},parsePlacement:function(a){var b=f.auto.test(a);return b&&(a=a.replace(f.auto,"")),a=a.split("-"),a[0]=a[0]||"top",f.primary.test(a[0])||(a[0]="top"),a[1]=a[1]||"center",f.secondary.test(a[1])||(a[1]="center"),b?a[2]=!0:a[2]=!1,a},positionElements:function(a,c,d,e){a=this.getRawNode(a),c=this.getRawNode(c);var g=angular.isDefined(c.offsetWidth)?c.offsetWidth:c.prop("offsetWidth"),h=angular.isDefined(c.offsetHeight)?c.offsetHeight:c.prop("offsetHeight");d=this.parsePlacement(d);var i=e?this.offset(a):this.position(a),j={top:0,left:0,placement:""};if(d[2]){var k=this.viewportOffset(a,e),l=b.getComputedStyle(c),m={width:g+Math.round(Math.abs(this.parseStyle(l.marginLeft)+this.parseStyle(l.marginRight))),height:h+Math.round(Math.abs(this.parseStyle(l.marginTop)+this.parseStyle(l.marginBottom)))};if(d[0]="top"===d[0]&&m.height>k.top&&m.height<=k.bottom?"bottom":"bottom"===d[0]&&m.height>k.bottom&&m.height<=k.top?"top":"left"===d[0]&&m.width>k.left&&m.width<=k.right?"right":"right"===d[0]&&m.width>k.right&&m.width<=k.left?"left":d[0],d[1]="top"===d[1]&&m.height-i.height>k.bottom&&m.height-i.height<=k.top?"bottom":"bottom"===d[1]&&m.height-i.height>k.top&&m.height-i.height<=k.bottom?"top":"left"===d[1]&&m.width-i.width>k.right&&m.width-i.width<=k.left?"right":"right"===d[1]&&m.width-i.width>k.left&&m.width-i.width<=k.right?"left":d[1],"center"===d[1])if(f.vertical.test(d[0])){var n=i.width/2-g/2;k.left+n<0&&m.width-i.width<=k.right?d[1]="left":k.right+n<0&&m.width-i.width<=k.left&&(d[1]="right")}else{var o=i.height/2-m.height/2;k.top+o<0&&m.height-i.height<=k.bottom?d[1]="top":k.bottom+o<0&&m.height-i.height<=k.top&&(d[1]="bottom")}}switch(d[0]){case"top":j.top=i.top-h;break;case"bottom":j.top=i.top+i.height;break;case"left":j.left=i.left-g;break;case"right":j.left=i.left+i.width}switch(d[1]){case"top":j.top=i.top;break;case"bottom":j.top=i.top+i.height-h;break;case"left":j.left=i.left;break;case"right":j.left=i.left+i.width-g;break;case"center":f.vertical.test(d[0])?j.left=i.left+i.width/2-g/2:j.top=i.top+i.height/2-h/2}return j.top=Math.round(j.top),j.left=Math.round(j.left),j.placement="center"===d[1]?d[0]:d[0]+"-"+d[1],j},positionArrow:function(a,c){a=this.getRawNode(a);var d=a.querySelector(".tooltip-inner, .popover-inner");if(d){var e=angular.element(d).hasClass("tooltip-inner"),g=e?a.querySelector(".tooltip-arrow"):a.querySelector(".arrow");if(g){var h={top:"",bottom:"",left:"",right:""};if(c=this.parsePlacement(c),"center"===c[1])return void angular.element(g).css(h);var i="border-"+c[0]+"-width",j=b.getComputedStyle(g)[i],k="border-";k+=f.vertical.test(c[0])?c[0]+"-"+c[1]:c[1]+"-"+c[0],k+="-radius";var l=b.getComputedStyle(e?d:a)[k];switch(c[0]){case"top":h.bottom=e?"0":"-"+j;break;case"bottom":h.top=e?"0":"-"+j;break;case"left":h.right=e?"0":"-"+j;break;case"right":h.left=e?"0":"-"+j}h[c[1]]=l,angular.element(g).css(h)}}}}}]),angular.module("ui.bootstrap.datepickerPopup",["ui.bootstrap.datepicker","ui.bootstrap.position"]).value("$datepickerPopupLiteralWarning",!0).constant("uibDatepickerPopupConfig",{altInputFormats:[],appendToBody:!1,clearText:"Clear",closeOnDateSelection:!0,closeText:"Done",currentText:"Today",datepickerPopup:"yyyy-MM-dd",datepickerPopupTemplateUrl:"uib/template/datepickerPopup/popup.html",datepickerTemplateUrl:"uib/template/datepicker/datepicker.html",html5Types:{date:"yyyy-MM-dd","datetime-local":"yyyy-MM-ddTHH:mm:ss.sss",month:"yyyy-MM"},onOpenFocus:!0,showButtonBar:!0,placement:"auto bottom-left"}).controller("UibDatepickerPopupController",["$scope","$element","$attrs","$compile","$log","$parse","$window","$document","$rootScope","$uibPosition","dateFilter","uibDateParser","uibDatepickerPopupConfig","$timeout","uibDatepickerConfig","$datepickerPopupLiteralWarning",function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p){function q(b){var c=l.parse(b,w,a.date);if(isNaN(c))for(var d=0;d<I.length;d++)if(c=l.parse(b,I[d],a.date),!isNaN(c))return c;return c}function r(a){if(angular.isNumber(a)&&(a=new Date(a)),!a)return null;if(angular.isDate(a)&&!isNaN(a))return a;if(angular.isString(a)){var b=q(a);if(!isNaN(b))return l.toTimezone(b,J)}return F.$options&&F.$options.allowInvalid?a:void 0}function s(a,b){var d=a||b;return c.ngRequired||d?(angular.isNumber(d)&&(d=new Date(d)),d?angular.isDate(d)&&!isNaN(d)?!0:angular.isString(d)?!isNaN(q(b)):!1:!0):!0}function t(c){if(a.isOpen||!a.disabled){var d=H[0],e=b[0].contains(c.target),f=void 0!==d.contains&&d.contains(c.target);!a.isOpen||e||f||a.$apply(function(){a.isOpen=!1})}}function u(c){27===c.which&&a.isOpen?(c.preventDefault(),c.stopPropagation(),a.$apply(function(){a.isOpen=!1}),b[0].focus()):40!==c.which||a.isOpen||(c.preventDefault(),c.stopPropagation(),a.$apply(function(){a.isOpen=!0}))}function v(){if(a.isOpen){var d=angular.element(H[0].querySelector(".uib-datepicker-popup")),e=c.popupPlacement?c.popupPlacement:m.placement,f=j.positionElements(b,d,e,y);d.css({top:f.top+"px",left:f.left+"px"}),d.hasClass("uib-position-measure")&&d.removeClass("uib-position-measure")}}var w,x,y,z,A,B,C,D,E,F,G,H,I,J,K=!1,L=[];this.init=function(e){if(F=e,G=e.$options,x=angular.isDefined(c.closeOnDateSelection)?a.$parent.$eval(c.closeOnDateSelection):m.closeOnDateSelection,y=angular.isDefined(c.datepickerAppendToBody)?a.$parent.$eval(c.datepickerAppendToBody):m.appendToBody,z=angular.isDefined(c.onOpenFocus)?a.$parent.$eval(c.onOpenFocus):m.onOpenFocus,A=angular.isDefined(c.datepickerPopupTemplateUrl)?c.datepickerPopupTemplateUrl:m.datepickerPopupTemplateUrl,B=angular.isDefined(c.datepickerTemplateUrl)?c.datepickerTemplateUrl:m.datepickerTemplateUrl,I=angular.isDefined(c.altInputFormats)?a.$parent.$eval(c.altInputFormats):m.altInputFormats,a.showButtonBar=angular.isDefined(c.showButtonBar)?a.$parent.$eval(c.showButtonBar):m.showButtonBar,m.html5Types[c.type]?(w=m.html5Types[c.type],K=!0):(w=c.uibDatepickerPopup||m.datepickerPopup,c.$observe("uibDatepickerPopup",function(a,b){var c=a||m.datepickerPopup;if(c!==w&&(w=c,F.$modelValue=null,!w))throw new Error("uibDatepickerPopup must have a date format specified.")})),!w)throw new Error("uibDatepickerPopup must have a date format specified.");if(K&&c.uibDatepickerPopup)throw new Error("HTML5 date input types do not support custom formats.");C=angular.element("<div uib-datepicker-popup-wrap><div uib-datepicker></div></div>"),G?(J=G.timezone,a.ngModelOptions=angular.copy(G),a.ngModelOptions.timezone=null,a.ngModelOptions.updateOnDefault===!0&&(a.ngModelOptions.updateOn=a.ngModelOptions.updateOn?a.ngModelOptions.updateOn+" default":"default"),C.attr("ng-model-options","ngModelOptions")):J=null,C.attr({"ng-model":"date","ng-change":"dateSelection(date)","template-url":A}),D=angular.element(C.children()[0]),D.attr("template-url",B),a.datepickerOptions||(a.datepickerOptions={}),K&&"month"===c.type&&(a.datepickerOptions.datepickerMode="month",a.datepickerOptions.minMode="month"),D.attr("datepicker-options","datepickerOptions"),K?F.$formatters.push(function(b){return a.date=l.fromTimezone(b,J),b}):(F.$$parserName="date",F.$validators.date=s,F.$parsers.unshift(r),F.$formatters.push(function(b){return F.$isEmpty(b)?(a.date=b,b):(angular.isNumber(b)&&(b=new Date(b)),a.date=l.fromTimezone(b,J),l.filter(a.date,w))})),F.$viewChangeListeners.push(function(){a.date=q(F.$viewValue)}),b.on("keydown",u),H=d(C)(a),C.remove(),y?h.find("body").append(H):b.after(H),a.$on("$destroy",function(){for(a.isOpen===!0&&(i.$$phase||a.$apply(function(){a.isOpen=!1})),H.remove(),b.off("keydown",u),h.off("click",t),E&&E.off("scroll",v),angular.element(g).off("resize",v);L.length;)L.shift()()})},a.getText=function(b){return a[b+"Text"]||m[b+"Text"]},a.isDisabled=function(b){"today"===b&&(b=l.fromTimezone(new Date,J));var c={};return angular.forEach(["minDate","maxDate"],function(b){a.datepickerOptions[b]?angular.isDate(a.datepickerOptions[b])?c[b]=l.fromTimezone(new Date(a.datepickerOptions[b]),J):(p&&e.warn("Literal date support has been deprecated, please switch to date object usage"),c[b]=new Date(k(a.datepickerOptions[b],"medium"))):c[b]=null}),a.datepickerOptions&&c.minDate&&a.compare(b,c.minDate)<0||c.maxDate&&a.compare(b,c.maxDate)>0},a.compare=function(a,b){return new Date(a.getFullYear(),a.getMonth(),a.getDate())-new Date(b.getFullYear(),b.getMonth(),b.getDate())},a.dateSelection=function(c){angular.isDefined(c)&&(a.date=c);var d=a.date?l.filter(a.date,w):null;b.val(d),F.$setViewValue(d),x&&(a.isOpen=!1,b[0].focus())},a.keydown=function(c){27===c.which&&(c.stopPropagation(),a.isOpen=!1,b[0].focus())},a.select=function(b,c){if(c.stopPropagation(),"today"===b){var d=new Date;angular.isDate(a.date)?(b=new Date(a.date),b.setFullYear(d.getFullYear(),d.getMonth(),d.getDate())):b=new Date(d.setHours(0,0,0,0))}a.dateSelection(b)},a.close=function(c){c.stopPropagation(),a.isOpen=!1,b[0].focus()},a.disabled=angular.isDefined(c.disabled)||!1,c.ngDisabled&&L.push(a.$parent.$watch(f(c.ngDisabled),function(b){a.disabled=b})),a.$watch("isOpen",function(d){d?a.disabled?a.isOpen=!1:n(function(){v(),z&&a.$broadcast("uib:datepicker.focus"),h.on("click",t);var d=c.popupPlacement?c.popupPlacement:m.placement;y||j.parsePlacement(d)[2]?(E=E||angular.element(j.scrollParent(b)),E&&E.on("scroll",v)):E=null,angular.element(g).on("resize",v)},0,!1):(h.off("click",t),E&&E.off("scroll",v),angular.element(g).off("resize",v))}),a.$on("uib:datepicker.mode",function(){n(v,0,!1)})}]).directive("uibDatepickerPopup",function(){return{require:["ngModel","uibDatepickerPopup"],controller:"UibDatepickerPopupController",scope:{datepickerOptions:"=?",isOpen:"=?",currentText:"@",clearText:"@",closeText:"@"},link:function(a,b,c,d){var e=d[0],f=d[1];f.init(e)}}}).directive("uibDatepickerPopupWrap",function(){return{replace:!0,transclude:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/datepickerPopup/popup.html"}}}),angular.module("ui.bootstrap.debounce",[]).factory("$$debounce",["$timeout",function(a){return function(b,c){var d;return function(){var e=this,f=Array.prototype.slice.call(arguments);d&&a.cancel(d),d=a(function(){b.apply(e,f)},c)}}}]),angular.module("ui.bootstrap.dropdown",["ui.bootstrap.position"]).constant("uibDropdownConfig",{appendToOpenClass:"uib-dropdown-open",openClass:"open"}).service("uibDropdownService",["$document","$rootScope",function(a,b){var c=null;this.open=function(b,f){c||(a.on("click",d),f.on("keydown",e)),c&&c!==b&&(c.isOpen=!1),c=b},this.close=function(b,f){c===b&&(c=null,a.off("click",d),f.off("keydown",e))};var d=function(a){if(c&&!(a&&"disabled"===c.getAutoClose()||a&&3===a.which)){var d=c.getToggleElement();if(!(a&&d&&d[0].contains(a.target))){var e=c.getDropdownElement();a&&"outsideClick"===c.getAutoClose()&&e&&e[0].contains(a.target)||(c.isOpen=!1,b.$$phase||c.$apply())}}},e=function(a){27===a.which?(a.stopPropagation(),c.focusToggleElement(),d()):c.isKeynavEnabled()&&-1!==[38,40].indexOf(a.which)&&c.isOpen&&(a.preventDefault(),a.stopPropagation(),c.focusDropdownEntry(a.which))}}]).controller("UibDropdownController",["$scope","$element","$attrs","$parse","uibDropdownConfig","uibDropdownService","$animate","$uibPosition","$document","$compile","$templateRequest",function(a,b,c,d,e,f,g,h,i,j,k){var l,m,n=this,o=a.$new(),p=e.appendToOpenClass,q=e.openClass,r=angular.noop,s=c.onToggle?d(c.onToggle):angular.noop,t=!1,u=null,v=!1,w=i.find("body");b.addClass("dropdown"),this.init=function(){if(c.isOpen&&(m=d(c.isOpen),r=m.assign,a.$watch(m,function(a){o.isOpen=!!a})),angular.isDefined(c.dropdownAppendTo)){var e=d(c.dropdownAppendTo)(o);e&&(u=angular.element(e))}t=angular.isDefined(c.dropdownAppendToBody),v=angular.isDefined(c.keyboardNav),t&&!u&&(u=w),u&&n.dropdownMenu&&(u.append(n.dropdownMenu),b.on("$destroy",function(){n.dropdownMenu.remove()}))},this.toggle=function(a){return o.isOpen=arguments.length?!!a:!o.isOpen,angular.isFunction(r)&&r(o,o.isOpen),o.isOpen},this.isOpen=function(){return o.isOpen},o.getToggleElement=function(){return n.toggleElement},o.getAutoClose=function(){return c.autoClose||"always"},o.getElement=function(){return b},o.isKeynavEnabled=function(){return v},o.focusDropdownEntry=function(a){var c=n.dropdownMenu?angular.element(n.dropdownMenu).find("a"):b.find("ul").eq(0).find("a");switch(a){case 40:angular.isNumber(n.selectedOption)?n.selectedOption=n.selectedOption===c.length-1?n.selectedOption:n.selectedOption+1:n.selectedOption=0;break;case 38:angular.isNumber(n.selectedOption)?n.selectedOption=0===n.selectedOption?0:n.selectedOption-1:n.selectedOption=c.length-1}c[n.selectedOption].focus()},o.getDropdownElement=function(){return n.dropdownMenu},o.focusToggleElement=function(){n.toggleElement&&n.toggleElement[0].focus()},o.$watch("isOpen",function(c,d){if(u&&n.dropdownMenu){var e,i,m,v=h.positionElements(b,n.dropdownMenu,"bottom-left",!0);if(e={top:v.top+"px",display:c?"block":"none"},i=n.dropdownMenu.hasClass("dropdown-menu-right"),i?(e.left="auto",m=h.scrollbarWidth(!0),e.right=window.innerWidth-m-(v.left+b.prop("offsetWidth"))+"px"):(e.left=v.left+"px",e.right="auto"),!t){var w=h.offset(u);e.top=v.top-w.top+"px",i?e.right=window.innerWidth-(v.left-w.left+b.prop("offsetWidth"))+"px":e.left=v.left-w.left+"px"}n.dropdownMenu.css(e)}var x=u?u:b,y=x.hasClass(u?p:q);if(y===!c&&g[c?"addClass":"removeClass"](x,u?p:q).then(function(){angular.isDefined(c)&&c!==d&&s(a,{open:!!c})}),c)n.dropdownMenuTemplateUrl&&k(n.dropdownMenuTemplateUrl).then(function(a){l=o.$new(),j(a.trim())(l,function(a){var b=a;n.dropdownMenu.replaceWith(b),n.dropdownMenu=b})}),o.focusToggleElement(),f.open(o,b);else{if(n.dropdownMenuTemplateUrl){l&&l.$destroy();var z=angular.element('<ul class="dropdown-menu"></ul>');n.dropdownMenu.replaceWith(z),n.dropdownMenu=z}f.close(o,b),n.selectedOption=null}angular.isFunction(r)&&r(a,c)})}]).directive("uibDropdown",function(){return{controller:"UibDropdownController",link:function(a,b,c,d){d.init()}}}).directive("uibDropdownMenu",function(){return{restrict:"A",require:"?^uibDropdown",link:function(a,b,c,d){if(d&&!angular.isDefined(c.dropdownNested)){b.addClass("dropdown-menu");var e=c.templateUrl;e&&(d.dropdownMenuTemplateUrl=e),d.dropdownMenu||(d.dropdownMenu=b)}}}}).directive("uibDropdownToggle",function(){return{require:"?^uibDropdown",link:function(a,b,c,d){if(d){b.addClass("dropdown-toggle"),d.toggleElement=b;var e=function(e){e.preventDefault(),b.hasClass("disabled")||c.disabled||a.$apply(function(){d.toggle()})};b.bind("click",e),b.attr({"aria-haspopup":!0,"aria-expanded":!1}),a.$watch(d.isOpen,function(a){b.attr("aria-expanded",!!a)}),a.$on("$destroy",function(){b.unbind("click",e)})}}}}),angular.module("ui.bootstrap.stackedMap",[]).factory("$$stackedMap",function(){return{createNew:function(){var a=[];return{add:function(b,c){a.push({key:b,value:c})},get:function(b){for(var c=0;c<a.length;c++)if(b===a[c].key)return a[c]},keys:function(){for(var b=[],c=0;c<a.length;c++)b.push(a[c].key);return b},top:function(){return a[a.length-1]},remove:function(b){for(var c=-1,d=0;d<a.length;d++)if(b===a[d].key){c=d;break}return a.splice(c,1)[0]},removeTop:function(){return a.splice(a.length-1,1)[0]},length:function(){return a.length}}}}}),angular.module("ui.bootstrap.modal",["ui.bootstrap.stackedMap","ui.bootstrap.position"]).factory("$$multiMap",function(){return{createNew:function(){var a={};return{entries:function(){return Object.keys(a).map(function(b){return{key:b,value:a[b]}})},get:function(b){return a[b]},hasKey:function(b){return!!a[b]},keys:function(){return Object.keys(a)},put:function(b,c){a[b]||(a[b]=[]),a[b].push(c)},remove:function(b,c){var d=a[b];if(d){var e=d.indexOf(c);-1!==e&&d.splice(e,1),d.length||delete a[b]}}}}}}).provider("$uibResolve",function(){var a=this;this.resolver=null,this.setResolver=function(a){this.resolver=a},this.$get=["$injector","$q",function(b,c){var d=a.resolver?b.get(a.resolver):null;return{resolve:function(a,e,f,g){if(d)return d.resolve(a,e,f,g);var h=[];return angular.forEach(a,function(a){angular.isFunction(a)||angular.isArray(a)?h.push(c.resolve(b.invoke(a))):angular.isString(a)?h.push(c.resolve(b.get(a))):h.push(c.resolve(a))}),c.all(h).then(function(b){var c={},d=0;return angular.forEach(a,function(a,e){c[e]=b[d++]}),c})}}}]}).directive("uibModalBackdrop",["$animate","$injector","$uibModalStack",function(a,b,c){function d(b,d,e){e.modalInClass&&(a.addClass(d,e.modalInClass),b.$on(c.NOW_CLOSING_EVENT,function(c,f){var g=f();b.modalOptions.animation?a.removeClass(d,e.modalInClass).then(g):g()}))}return{replace:!0,templateUrl:"uib/template/modal/backdrop.html",compile:function(a,b){return a.addClass(b.backdropClass),d}}}]).directive("uibModalWindow",["$uibModalStack","$q","$animateCss","$document",function(a,b,c,d){return{scope:{index:"@"},replace:!0,transclude:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/modal/window.html"},link:function(e,f,g){f.addClass(g.windowClass||""),f.addClass(g.windowTopClass||""),e.size=g.size,e.close=function(b){var c=a.getTop();c&&c.value.backdrop&&"static"!==c.value.backdrop&&b.target===b.currentTarget&&(b.preventDefault(),b.stopPropagation(),a.dismiss(c.key,"backdrop click"))},f.on("click",e.close),e.$isRendered=!0;var h=b.defer();g.$observe("modalRender",function(a){"true"===a&&h.resolve()}),h.promise.then(function(){var h=null;g.modalInClass&&(h=c(f,{addClass:g.modalInClass}).start(),e.$on(a.NOW_CLOSING_EVENT,function(a,b){var d=b();c(f,{removeClass:g.modalInClass}).start().then(d)})),b.when(h).then(function(){var b=a.getTop();if(b&&a.modalRendered(b.key),!d[0].activeElement||!f[0].contains(d[0].activeElement)){var c=f[0].querySelector("[autofocus]");c?c.focus():f[0].focus()}})})}}}]).directive("uibModalAnimationClass",function(){return{compile:function(a,b){b.modalAnimation&&a.addClass(b.uibModalAnimationClass)}}}).directive("uibModalTransclude",function(){return{link:function(a,b,c,d,e){e(a.$parent,function(a){b.empty(),b.append(a)})}}}).factory("$uibModalStack",["$animate","$animateCss","$document","$compile","$rootScope","$q","$$multiMap","$$stackedMap","$uibPosition",function(a,b,c,d,e,f,g,h,i){function j(a){return!!(a.offsetWidth||a.offsetHeight||a.getClientRects().length)}function k(){for(var a=-1,b=v.keys(),c=0;c<b.length;c++)v.get(b[c]).value.backdrop&&(a=c);return a>-1&&y>a&&(a=y),a}function l(a,b){var c=v.get(a).value,d=c.appendTo;v.remove(a),z=v.top(),z&&(y=parseInt(z.value.modalDomEl.attr("index"),10)),o(c.modalDomEl,c.modalScope,function(){var b=c.openedClass||u;w.remove(b,a);var e=w.hasKey(b);d.toggleClass(b,e),!e&&t&&t.heightOverflow&&t.scrollbarWidth&&(t.originalRight?d.css({paddingRight:t.originalRight+"px"}):d.css({paddingRight:""}),t=null),m(!0)},c.closedDeferred),n(),b&&b.focus?b.focus():d.focus&&d.focus()}function m(a){var b;v.length()>0&&(b=v.top().value,b.modalDomEl.toggleClass(b.windowTopClass||"",a))}function n(){if(r&&-1===k()){var a=s;o(r,s,function(){a=null}),r=void 0,s=void 0}}function o(b,c,d,e){function g(){g.done||(g.done=!0,a.leave(b).then(function(){b.remove(),e&&e.resolve()}),c.$destroy(),d&&d())}var h,i=null,j=function(){return h||(h=f.defer(),i=h.promise),function(){h.resolve()}};return c.$broadcast(x.NOW_CLOSING_EVENT,j),f.when(i).then(g)}function p(a){if(a.isDefaultPrevented())return a;var b=v.top();if(b)switch(a.which){case 27:b.value.keyboard&&(a.preventDefault(),e.$apply(function(){x.dismiss(b.key,"escape key press")}));break;case 9:var c=x.loadFocusElementList(b),d=!1;a.shiftKey?(x.isFocusInFirstItem(a,c)||x.isModalFocused(a,b))&&(d=x.focusLastFocusableElement(c)):x.isFocusInLastItem(a,c)&&(d=x.focusFirstFocusableElement(c)),d&&(a.preventDefault(),a.stopPropagation())}}function q(a,b,c){return!a.value.modalScope.$broadcast("modal.closing",b,c).defaultPrevented}var r,s,t,u="modal-open",v=h.createNew(),w=g.createNew(),x={NOW_CLOSING_EVENT:"modal.stack.now-closing"},y=0,z=null,A="a[href], area[href], input:not([disabled]), button:not([disabled]),select:not([disabled]), textarea:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable=true]";return e.$watch(k,function(a){s&&(s.index=a)}),c.on("keydown",p),e.$on("$destroy",function(){c.off("keydown",p)}),x.open=function(b,f){var g=c[0].activeElement,h=f.openedClass||u;m(!1),z=v.top(),v.add(b,{deferred:f.deferred,renderDeferred:f.renderDeferred,closedDeferred:f.closedDeferred,modalScope:f.scope,backdrop:f.backdrop,keyboard:f.keyboard,openedClass:f.openedClass,windowTopClass:f.windowTopClass,animation:f.animation,appendTo:f.appendTo}),w.put(h,b);var j=f.appendTo,l=k();if(!j.length)throw new Error("appendTo element not found. Make sure that the element passed is in DOM.");l>=0&&!r&&(s=e.$new(!0),s.modalOptions=f,s.index=l,r=angular.element('<div uib-modal-backdrop="modal-backdrop"></div>'),r.attr("backdrop-class",f.backdropClass),f.animation&&r.attr("modal-animation","true"),d(r)(s),a.enter(r,j),t=i.scrollbarPadding(j),t.heightOverflow&&t.scrollbarWidth&&j.css({paddingRight:t.right+"px"})),y=z?parseInt(z.value.modalDomEl.attr("index"),10)+1:0;var n=angular.element('<div uib-modal-window="modal-window"></div>');n.attr({"template-url":f.windowTemplateUrl,"window-class":f.windowClass,"window-top-class":f.windowTopClass,size:f.size,index:y,animate:"animate"}).html(f.content),f.animation&&n.attr("modal-animation","true"),j.addClass(h),a.enter(d(n)(f.scope),j),v.top().value.modalDomEl=n,v.top().value.modalOpener=g},x.close=function(a,b){var c=v.get(a);return c&&q(c,b,!0)?(c.value.modalScope.$$uibDestructionScheduled=!0,c.value.deferred.resolve(b),l(a,c.value.modalOpener),!0):!c},x.dismiss=function(a,b){var c=v.get(a);return c&&q(c,b,!1)?(c.value.modalScope.$$uibDestructionScheduled=!0,c.value.deferred.reject(b),l(a,c.value.modalOpener),!0):!c},x.dismissAll=function(a){for(var b=this.getTop();b&&this.dismiss(b.key,a);)b=this.getTop()},x.getTop=function(){return v.top()},x.modalRendered=function(a){var b=v.get(a);b&&b.value.renderDeferred.resolve()},x.focusFirstFocusableElement=function(a){return a.length>0?(a[0].focus(),!0):!1},x.focusLastFocusableElement=function(a){return a.length>0?(a[a.length-1].focus(),!0):!1},x.isModalFocused=function(a,b){if(a&&b){var c=b.value.modalDomEl;if(c&&c.length)return(a.target||a.srcElement)===c[0]}return!1},x.isFocusInFirstItem=function(a,b){return b.length>0?(a.target||a.srcElement)===b[0]:!1},x.isFocusInLastItem=function(a,b){return b.length>0?(a.target||a.srcElement)===b[b.length-1]:!1},x.loadFocusElementList=function(a){if(a){var b=a.value.modalDomEl;if(b&&b.length){var c=b[0].querySelectorAll(A);return c?Array.prototype.filter.call(c,function(a){return j(a)}):c}}},x}]).provider("$uibModal",function(){var a={options:{animation:!0,backdrop:!0,keyboard:!0},$get:["$rootScope","$q","$document","$templateRequest","$controller","$uibResolve","$uibModalStack",function(b,c,d,e,f,g,h){function i(a){return a.template?c.when(a.template):e(angular.isFunction(a.templateUrl)?a.templateUrl():a.templateUrl)}var j={},k=null;return j.getPromiseChain=function(){return k},j.open=function(e){function j(){return r}var l=c.defer(),m=c.defer(),n=c.defer(),o=c.defer(),p={result:l.promise,opened:m.promise,closed:n.promise,rendered:o.promise,close:function(a){return h.close(p,a)},dismiss:function(a){return h.dismiss(p,a)}};if(e=angular.extend({},a.options,e),e.resolve=e.resolve||{},e.appendTo=e.appendTo||d.find("body").eq(0),!e.template&&!e.templateUrl)throw new Error("One of template or templateUrl options is required.");var q,r=c.all([i(e),g.resolve(e.resolve,{},null,null)]);return q=k=c.all([k]).then(j,j).then(function(a){var c=e.scope||b,d=c.$new();d.$close=p.close,d.$dismiss=p.dismiss,d.$on("$destroy",function(){d.$$uibDestructionScheduled||d.$dismiss("$uibUnscheduledDestruction")});var g,i,j={};e.controller&&(j.$scope=d,j.$scope.$resolve={},j.$uibModalInstance=p,angular.forEach(a[1],function(a,b){j[b]=a,j.$scope.$resolve[b]=a}),i=f(e.controller,j,!0,e.controllerAs),e.controllerAs&&e.bindToController&&(g=i.instance,g.$close=d.$close,g.$dismiss=d.$dismiss,angular.extend(g,{$resolve:j.$scope.$resolve},c)),g=i(),angular.isFunction(g.$onInit)&&g.$onInit()),h.open(p,{scope:d,deferred:l,renderDeferred:o,closedDeferred:n,content:a[0],animation:e.animation,backdrop:e.backdrop,keyboard:e.keyboard,backdropClass:e.backdropClass,windowTopClass:e.windowTopClass,windowClass:e.windowClass,windowTemplateUrl:e.windowTemplateUrl,size:e.size,openedClass:e.openedClass,appendTo:e.appendTo}),m.resolve(!0)},function(a){m.reject(a),l.reject(a)})["finally"](function(){k===q&&(k=null)}),p},j}]};return a}),angular.module("ui.bootstrap.paging",[]).factory("uibPaging",["$parse",function(a){return{create:function(b,c,d){b.setNumPages=d.numPages?a(d.numPages).assign:angular.noop,b.ngModelCtrl={$setViewValue:angular.noop},b._watchers=[],b.init=function(a,e){b.ngModelCtrl=a,b.config=e,a.$render=function(){b.render()},d.itemsPerPage?b._watchers.push(c.$parent.$watch(d.itemsPerPage,function(a){b.itemsPerPage=parseInt(a,10),c.totalPages=b.calculateTotalPages(),b.updatePage()})):b.itemsPerPage=e.itemsPerPage,c.$watch("totalItems",function(a,d){(angular.isDefined(a)||a!==d)&&(c.totalPages=b.calculateTotalPages(),b.updatePage())})},b.calculateTotalPages=function(){var a=b.itemsPerPage<1?1:Math.ceil(c.totalItems/b.itemsPerPage);return Math.max(a||0,1)},b.render=function(){c.page=parseInt(b.ngModelCtrl.$viewValue,10)||1},c.selectPage=function(a,d){d&&d.preventDefault();var e=!c.ngDisabled||!d;e&&c.page!==a&&a>0&&a<=c.totalPages&&(d&&d.target&&d.target.blur(),b.ngModelCtrl.$setViewValue(a),b.ngModelCtrl.$render())},c.getText=function(a){return c[a+"Text"]||b.config[a+"Text"]},c.noPrevious=function(){return 1===c.page},c.noNext=function(){return c.page===c.totalPages},b.updatePage=function(){b.setNumPages(c.$parent,c.totalPages),c.page>c.totalPages?c.selectPage(c.totalPages):b.ngModelCtrl.$render()},c.$on("$destroy",function(){for(;b._watchers.length;)b._watchers.shift()()})}}}]),angular.module("ui.bootstrap.pager",["ui.bootstrap.paging"]).controller("UibPagerController",["$scope","$attrs","uibPaging","uibPagerConfig",function(a,b,c,d){a.align=angular.isDefined(b.align)?a.$parent.$eval(b.align):d.align,c.create(this,a,b)}]).constant("uibPagerConfig",{itemsPerPage:10,previousText:"« Previous",nextText:"Next »",align:!0}).directive("uibPager",["uibPagerConfig",function(a){return{scope:{totalItems:"=",previousText:"@",nextText:"@",ngDisabled:"="},require:["uibPager","?ngModel"],controller:"UibPagerController",controllerAs:"pager",templateUrl:function(a,b){return b.templateUrl||"uib/template/pager/pager.html"},replace:!0,link:function(b,c,d,e){var f=e[0],g=e[1];g&&f.init(g,a)}}}]),angular.module("ui.bootstrap.pagination",["ui.bootstrap.paging"]).controller("UibPaginationController",["$scope","$attrs","$parse","uibPaging","uibPaginationConfig",function(a,b,c,d,e){function f(a,b,c){return{number:a,text:b,active:c}}function g(a,b){var c=[],d=1,e=b,g=angular.isDefined(i)&&b>i;g&&(j?(d=Math.max(a-Math.floor(i/2),1),e=d+i-1,e>b&&(e=b,d=e-i+1)):(d=(Math.ceil(a/i)-1)*i+1,e=Math.min(d+i-1,b)));for(var h=d;e>=h;h++){var n=f(h,m(h),h===a);c.push(n)}if(g&&i>0&&(!j||k||l)){if(d>1){if(!l||d>3){var o=f(d-1,"...",!1);c.unshift(o)}if(l){if(3===d){var p=f(2,"2",!1);c.unshift(p)}var q=f(1,"1",!1);c.unshift(q)}}if(b>e){if(!l||b-2>e){var r=f(e+1,"...",!1);c.push(r)}if(l){if(e===b-2){var s=f(b-1,b-1,!1);c.push(s)}var t=f(b,b,!1);c.push(t)}}}return c}var h=this,i=angular.isDefined(b.maxSize)?a.$parent.$eval(b.maxSize):e.maxSize,j=angular.isDefined(b.rotate)?a.$parent.$eval(b.rotate):e.rotate,k=angular.isDefined(b.forceEllipses)?a.$parent.$eval(b.forceEllipses):e.forceEllipses,l=angular.isDefined(b.boundaryLinkNumbers)?a.$parent.$eval(b.boundaryLinkNumbers):e.boundaryLinkNumbers,m=angular.isDefined(b.pageLabel)?function(c){return a.$parent.$eval(b.pageLabel,{$page:c})}:angular.identity;a.boundaryLinks=angular.isDefined(b.boundaryLinks)?a.$parent.$eval(b.boundaryLinks):e.boundaryLinks,a.directionLinks=angular.isDefined(b.directionLinks)?a.$parent.$eval(b.directionLinks):e.directionLinks,d.create(this,a,b),b.maxSize&&h._watchers.push(a.$parent.$watch(c(b.maxSize),function(a){i=parseInt(a,10),h.render()}));var n=this.render;this.render=function(){n(),a.page>0&&a.page<=a.totalPages&&(a.pages=g(a.page,a.totalPages))}}]).constant("uibPaginationConfig",{itemsPerPage:10,boundaryLinks:!1,boundaryLinkNumbers:!1,directionLinks:!0,firstText:"First",previousText:"Previous",nextText:"Next",lastText:"Last",rotate:!0,forceEllipses:!1}).directive("uibPagination",["$parse","uibPaginationConfig",function(a,b){return{scope:{totalItems:"=",firstText:"@",previousText:"@",nextText:"@",lastText:"@",ngDisabled:"="},require:["uibPagination","?ngModel"],controller:"UibPaginationController",controllerAs:"pagination",templateUrl:function(a,b){return b.templateUrl||"uib/template/pagination/pagination.html"},replace:!0,link:function(a,c,d,e){var f=e[0],g=e[1];g&&f.init(g,b)}}}]),angular.module("ui.bootstrap.tooltip",["ui.bootstrap.position","ui.bootstrap.stackedMap"]).provider("$uibTooltip",function(){function a(a){var b=/[A-Z]/g,c="-";return a.replace(b,function(a,b){return(b?c:"")+a.toLowerCase()})}var b={placement:"top",placementClassPrefix:"",animation:!0,popupDelay:0,popupCloseDelay:0,useContentExp:!1},c={mouseenter:"mouseleave",click:"click",outsideClick:"outsideClick",focus:"blur",none:""},d={};this.options=function(a){angular.extend(d,a)},this.setTriggers=function(a){angular.extend(c,a)},this.$get=["$window","$compile","$timeout","$document","$uibPosition","$interpolate","$rootScope","$parse","$$stackedMap",function(e,f,g,h,i,j,k,l,m){function n(a){if(27===a.which){var b=o.top();b&&(b.value.close(),o.removeTop(),b=null)}}var o=m.createNew();return h.on("keypress",n),k.$on("$destroy",function(){h.off("keypress",n)}),function(e,k,m,n){function p(a){var b=(a||n.trigger||m).split(" "),d=b.map(function(a){
return c[a]||a});return{show:b,hide:d}}n=angular.extend({},b,d,n);var q=a(e),r=j.startSymbol(),s=j.endSymbol(),t="<div "+q+'-popup uib-title="'+r+"title"+s+'" '+(n.useContentExp?'content-exp="contentExp()" ':'content="'+r+"content"+s+'" ')+'placement="'+r+"placement"+s+'" popup-class="'+r+"popupClass"+s+'" animation="animation" is-open="isOpen" origin-scope="origScope" class="uib-position-measure"></div>';return{compile:function(a,b){var c=f(t);return function(a,b,d,f){function j(){N.isOpen?q():m()}function m(){M&&!a.$eval(d[k+"Enable"])||(u(),x(),N.popupDelay?G||(G=g(r,N.popupDelay,!1)):r())}function q(){s(),N.popupCloseDelay?H||(H=g(t,N.popupCloseDelay,!1)):t()}function r(){return s(),u(),N.content?(v(),void N.$evalAsync(function(){N.isOpen=!0,y(!0),S()})):angular.noop}function s(){G&&(g.cancel(G),G=null),I&&(g.cancel(I),I=null)}function t(){N&&N.$evalAsync(function(){N&&(N.isOpen=!1,y(!1),N.animation?F||(F=g(w,150,!1)):w())})}function u(){H&&(g.cancel(H),H=null),F&&(g.cancel(F),F=null)}function v(){D||(E=N.$new(),D=c(E,function(a){K?h.find("body").append(a):b.after(a)}),z())}function w(){s(),u(),A(),D&&(D.remove(),D=null),E&&(E.$destroy(),E=null)}function x(){N.title=d[k+"Title"],Q?N.content=Q(a):N.content=d[e],N.popupClass=d[k+"Class"],N.placement=angular.isDefined(d[k+"Placement"])?d[k+"Placement"]:n.placement;var b=i.parsePlacement(N.placement);J=b[1]?b[0]+"-"+b[1]:b[0];var c=parseInt(d[k+"PopupDelay"],10),f=parseInt(d[k+"PopupCloseDelay"],10);N.popupDelay=isNaN(c)?n.popupDelay:c,N.popupCloseDelay=isNaN(f)?n.popupCloseDelay:f}function y(b){P&&angular.isFunction(P.assign)&&P.assign(a,b)}function z(){R.length=0,Q?(R.push(a.$watch(Q,function(a){N.content=a,!a&&N.isOpen&&t()})),R.push(E.$watch(function(){O||(O=!0,E.$$postDigest(function(){O=!1,N&&N.isOpen&&S()}))}))):R.push(d.$observe(e,function(a){N.content=a,!a&&N.isOpen?t():S()})),R.push(d.$observe(k+"Title",function(a){N.title=a,N.isOpen&&S()})),R.push(d.$observe(k+"Placement",function(a){N.placement=a?a:n.placement,N.isOpen&&S()}))}function A(){R.length&&(angular.forEach(R,function(a){a()}),R.length=0)}function B(a){N&&N.isOpen&&D&&(b[0].contains(a.target)||D[0].contains(a.target)||q())}function C(){var a=d[k+"Trigger"];T(),L=p(a),"none"!==L.show&&L.show.forEach(function(a,c){"outsideClick"===a?(b.on("click",j),h.on("click",B)):a===L.hide[c]?b.on(a,j):a&&(b.on(a,m),b.on(L.hide[c],q)),b.on("keypress",function(a){27===a.which&&q()})})}var D,E,F,G,H,I,J,K=angular.isDefined(n.appendToBody)?n.appendToBody:!1,L=p(void 0),M=angular.isDefined(d[k+"Enable"]),N=a.$new(!0),O=!1,P=angular.isDefined(d[k+"IsOpen"])?l(d[k+"IsOpen"]):!1,Q=n.useContentExp?l(d[e]):!1,R=[],S=function(){D&&D.html()&&(I||(I=g(function(){var a=i.positionElements(b,D,N.placement,K);D.css({top:a.top+"px",left:a.left+"px"}),D.hasClass(a.placement.split("-")[0])||(D.removeClass(J.split("-")[0]),D.addClass(a.placement.split("-")[0])),D.hasClass(n.placementClassPrefix+a.placement)||(D.removeClass(n.placementClassPrefix+J),D.addClass(n.placementClassPrefix+a.placement)),D.hasClass("uib-position-measure")?(i.positionArrow(D,a.placement),D.removeClass("uib-position-measure")):J!==a.placement&&i.positionArrow(D,a.placement),J=a.placement,I=null},0,!1)))};N.origScope=a,N.isOpen=!1,o.add(N,{close:t}),N.contentExp=function(){return N.content},d.$observe("disabled",function(a){a&&s(),a&&N.isOpen&&t()}),P&&a.$watch(P,function(a){N&&!a===N.isOpen&&j()});var T=function(){L.show.forEach(function(a){"outsideClick"===a?b.off("click",j):(b.off(a,m),b.off(a,j))}),L.hide.forEach(function(a){"outsideClick"===a?h.off("click",B):b.off(a,q)})};C();var U=a.$eval(d[k+"Animation"]);N.animation=angular.isDefined(U)?!!U:n.animation;var V,W=k+"AppendToBody";V=W in d&&void 0===d[W]?!0:a.$eval(d[W]),K=angular.isDefined(V)?V:K,a.$on("$destroy",function(){T(),w(),o.remove(N),N=null})}}}}}]}).directive("uibTooltipTemplateTransclude",["$animate","$sce","$compile","$templateRequest",function(a,b,c,d){return{link:function(e,f,g){var h,i,j,k=e.$eval(g.tooltipTemplateTranscludeScope),l=0,m=function(){i&&(i.remove(),i=null),h&&(h.$destroy(),h=null),j&&(a.leave(j).then(function(){i=null}),i=j,j=null)};e.$watch(b.parseAsResourceUrl(g.uibTooltipTemplateTransclude),function(b){var g=++l;b?(d(b,!0).then(function(d){if(g===l){var e=k.$new(),i=d,n=c(i)(e,function(b){m(),a.enter(b,f)});h=e,j=n,h.$emit("$includeContentLoaded",b)}},function(){g===l&&(m(),e.$emit("$includeContentError",b))}),e.$emit("$includeContentRequested",b)):m()}),e.$on("$destroy",m)}}}]).directive("uibTooltipClasses",["$uibPosition",function(a){return{restrict:"A",link:function(b,c,d){if(b.placement){var e=a.parsePlacement(b.placement);c.addClass(e[0])}b.popupClass&&c.addClass(b.popupClass),b.animation()&&c.addClass(d.tooltipAnimationClass)}}}]).directive("uibTooltipPopup",function(){return{replace:!0,scope:{content:"@",placement:"@",popupClass:"@",animation:"&",isOpen:"&"},templateUrl:"uib/template/tooltip/tooltip-popup.html"}}).directive("uibTooltip",["$uibTooltip",function(a){return a("uibTooltip","tooltip","mouseenter")}]).directive("uibTooltipTemplatePopup",function(){return{replace:!0,scope:{contentExp:"&",placement:"@",popupClass:"@",animation:"&",isOpen:"&",originScope:"&"},templateUrl:"uib/template/tooltip/tooltip-template-popup.html"}}).directive("uibTooltipTemplate",["$uibTooltip",function(a){return a("uibTooltipTemplate","tooltip","mouseenter",{useContentExp:!0})}]).directive("uibTooltipHtmlPopup",function(){return{replace:!0,scope:{contentExp:"&",placement:"@",popupClass:"@",animation:"&",isOpen:"&"},templateUrl:"uib/template/tooltip/tooltip-html-popup.html"}}).directive("uibTooltipHtml",["$uibTooltip",function(a){return a("uibTooltipHtml","tooltip","mouseenter",{useContentExp:!0})}]),angular.module("ui.bootstrap.popover",["ui.bootstrap.tooltip"]).directive("uibPopoverTemplatePopup",function(){return{replace:!0,scope:{uibTitle:"@",contentExp:"&",placement:"@",popupClass:"@",animation:"&",isOpen:"&",originScope:"&"},templateUrl:"uib/template/popover/popover-template.html"}}).directive("uibPopoverTemplate",["$uibTooltip",function(a){return a("uibPopoverTemplate","popover","click",{useContentExp:!0})}]).directive("uibPopoverHtmlPopup",function(){return{replace:!0,scope:{contentExp:"&",uibTitle:"@",placement:"@",popupClass:"@",animation:"&",isOpen:"&"},templateUrl:"uib/template/popover/popover-html.html"}}).directive("uibPopoverHtml",["$uibTooltip",function(a){return a("uibPopoverHtml","popover","click",{useContentExp:!0})}]).directive("uibPopoverPopup",function(){return{replace:!0,scope:{uibTitle:"@",content:"@",placement:"@",popupClass:"@",animation:"&",isOpen:"&"},templateUrl:"uib/template/popover/popover.html"}}).directive("uibPopover",["$uibTooltip",function(a){return a("uibPopover","popover","click")}]),angular.module("ui.bootstrap.progressbar",[]).constant("uibProgressConfig",{animate:!0,max:100}).controller("UibProgressController",["$scope","$attrs","uibProgressConfig",function(a,b,c){function d(){return angular.isDefined(a.maxParam)?a.maxParam:c.max}var e=this,f=angular.isDefined(b.animate)?a.$parent.$eval(b.animate):c.animate;this.bars=[],a.max=d(),this.addBar=function(a,b,c){f||b.css({transition:"none"}),this.bars.push(a),a.max=d(),a.title=c&&angular.isDefined(c.title)?c.title:"progressbar",a.$watch("value",function(b){a.recalculatePercentage()}),a.recalculatePercentage=function(){var b=e.bars.reduce(function(a,b){return b.percent=+(100*b.value/b.max).toFixed(2),a+b.percent},0);b>100&&(a.percent-=b-100)},a.$on("$destroy",function(){b=null,e.removeBar(a)})},this.removeBar=function(a){this.bars.splice(this.bars.indexOf(a),1),this.bars.forEach(function(a){a.recalculatePercentage()})},a.$watch("maxParam",function(a){e.bars.forEach(function(a){a.max=d(),a.recalculatePercentage()})})}]).directive("uibProgress",function(){return{replace:!0,transclude:!0,controller:"UibProgressController",require:"uibProgress",scope:{maxParam:"=?max"},templateUrl:"uib/template/progressbar/progress.html"}}).directive("uibBar",function(){return{replace:!0,transclude:!0,require:"^uibProgress",scope:{value:"=",type:"@"},templateUrl:"uib/template/progressbar/bar.html",link:function(a,b,c,d){d.addBar(a,b,c)}}}).directive("uibProgressbar",function(){return{replace:!0,transclude:!0,controller:"UibProgressController",scope:{value:"=",maxParam:"=?max",type:"@"},templateUrl:"uib/template/progressbar/progressbar.html",link:function(a,b,c,d){d.addBar(a,angular.element(b.children()[0]),{title:c.title})}}}),angular.module("ui.bootstrap.rating",[]).constant("uibRatingConfig",{max:5,stateOn:null,stateOff:null,enableReset:!0,titles:["one","two","three","four","five"]}).controller("UibRatingController",["$scope","$attrs","uibRatingConfig",function(a,b,c){var d={$setViewValue:angular.noop},e=this;this.init=function(e){d=e,d.$render=this.render,d.$formatters.push(function(a){return angular.isNumber(a)&&a<<0!==a&&(a=Math.round(a)),a}),this.stateOn=angular.isDefined(b.stateOn)?a.$parent.$eval(b.stateOn):c.stateOn,this.stateOff=angular.isDefined(b.stateOff)?a.$parent.$eval(b.stateOff):c.stateOff,this.enableReset=angular.isDefined(b.enableReset)?a.$parent.$eval(b.enableReset):c.enableReset;var f=angular.isDefined(b.titles)?a.$parent.$eval(b.titles):c.titles;this.titles=angular.isArray(f)&&f.length>0?f:c.titles;var g=angular.isDefined(b.ratingStates)?a.$parent.$eval(b.ratingStates):new Array(angular.isDefined(b.max)?a.$parent.$eval(b.max):c.max);a.range=this.buildTemplateObjects(g)},this.buildTemplateObjects=function(a){for(var b=0,c=a.length;c>b;b++)a[b]=angular.extend({index:b},{stateOn:this.stateOn,stateOff:this.stateOff,title:this.getTitle(b)},a[b]);return a},this.getTitle=function(a){return a>=this.titles.length?a+1:this.titles[a]},a.rate=function(b){if(!a.readonly&&b>=0&&b<=a.range.length){var c=e.enableReset&&d.$viewValue===b?0:b;d.$setViewValue(c),d.$render()}},a.enter=function(b){a.readonly||(a.value=b),a.onHover({value:b})},a.reset=function(){a.value=d.$viewValue,a.onLeave()},a.onKeydown=function(b){/(37|38|39|40)/.test(b.which)&&(b.preventDefault(),b.stopPropagation(),a.rate(a.value+(38===b.which||39===b.which?1:-1)))},this.render=function(){a.value=d.$viewValue,a.title=e.getTitle(a.value-1)}}]).directive("uibRating",function(){return{require:["uibRating","ngModel"],scope:{readonly:"=?readOnly",onHover:"&",onLeave:"&"},controller:"UibRatingController",templateUrl:"uib/template/rating/rating.html",replace:!0,link:function(a,b,c,d){var e=d[0],f=d[1];e.init(f)}}}),angular.module("ui.bootstrap.tabs",[]).controller("UibTabsetController",["$scope",function(a){function b(a){for(var b=0;b<d.tabs.length;b++)if(d.tabs[b].index===a)return b}var c,d=this;d.tabs=[],d.select=function(a,f){if(!e){var g=b(c),h=d.tabs[g];if(h){if(h.tab.onDeselect({$event:f,$selectedIndex:a}),f&&f.isDefaultPrevented())return;h.tab.active=!1}var i=d.tabs[a];i?(i.tab.onSelect({$event:f}),i.tab.active=!0,d.active=i.index,c=i.index):!i&&angular.isDefined(c)&&(d.active=null,c=null)}},d.addTab=function(a){if(d.tabs.push({tab:a,index:a.index}),d.tabs.sort(function(a,b){return a.index>b.index?1:a.index<b.index?-1:0}),a.index===d.active||!angular.isDefined(d.active)&&1===d.tabs.length){var c=b(a.index);d.select(c)}},d.removeTab=function(a){for(var b,c=0;c<d.tabs.length;c++)if(d.tabs[c].tab===a){b=c;break}if(d.tabs[b].index===d.active){var e=b===d.tabs.length-1?b-1:b+1%d.tabs.length;d.select(e)}d.tabs.splice(b,1)},a.$watch("tabset.active",function(a){angular.isDefined(a)&&a!==c&&d.select(b(a))});var e;a.$on("$destroy",function(){e=!0})}]).directive("uibTabset",function(){return{transclude:!0,replace:!0,scope:{},bindToController:{active:"=?",type:"@"},controller:"UibTabsetController",controllerAs:"tabset",templateUrl:function(a,b){return b.templateUrl||"uib/template/tabs/tabset.html"},link:function(a,b,c){a.vertical=angular.isDefined(c.vertical)?a.$parent.$eval(c.vertical):!1,a.justified=angular.isDefined(c.justified)?a.$parent.$eval(c.justified):!1}}}).directive("uibTab",["$parse",function(a){return{require:"^uibTabset",replace:!0,templateUrl:function(a,b){return b.templateUrl||"uib/template/tabs/tab.html"},transclude:!0,scope:{heading:"@",index:"=?",classes:"@?",onSelect:"&select",onDeselect:"&deselect"},controller:function(){},controllerAs:"tab",link:function(b,c,d,e,f){b.disabled=!1,d.disable&&b.$parent.$watch(a(d.disable),function(a){b.disabled=!!a}),angular.isUndefined(d.index)&&(e.tabs&&e.tabs.length?b.index=Math.max.apply(null,e.tabs.map(function(a){return a.index}))+1:b.index=0),angular.isUndefined(d.classes)&&(b.classes=""),b.select=function(a){if(!b.disabled){for(var c,d=0;d<e.tabs.length;d++)if(e.tabs[d].tab===b){c=d;break}e.select(c,a)}},e.addTab(b),b.$on("$destroy",function(){e.removeTab(b)}),b.$transcludeFn=f}}}]).directive("uibTabHeadingTransclude",function(){return{restrict:"A",require:"^uibTab",link:function(a,b){a.$watch("headingElement",function(a){a&&(b.html(""),b.append(a))})}}}).directive("uibTabContentTransclude",function(){function a(a){return a.tagName&&(a.hasAttribute("uib-tab-heading")||a.hasAttribute("data-uib-tab-heading")||a.hasAttribute("x-uib-tab-heading")||"uib-tab-heading"===a.tagName.toLowerCase()||"data-uib-tab-heading"===a.tagName.toLowerCase()||"x-uib-tab-heading"===a.tagName.toLowerCase()||"uib:tab-heading"===a.tagName.toLowerCase())}return{restrict:"A",require:"^uibTabset",link:function(b,c,d){var e=b.$eval(d.uibTabContentTransclude).tab;e.$transcludeFn(e.$parent,function(b){angular.forEach(b,function(b){a(b)?e.headingElement=b:c.append(b)})})}}}),angular.module("ui.bootstrap.timepicker",[]).constant("uibTimepickerConfig",{hourStep:1,minuteStep:1,secondStep:1,showMeridian:!0,showSeconds:!1,meridians:null,readonlyInput:!1,mousewheel:!0,arrowkeys:!0,showSpinners:!0,templateUrl:"uib/template/timepicker/timepicker.html"}).controller("UibTimepickerController",["$scope","$element","$attrs","$parse","$log","$locale","uibTimepickerConfig",function(a,b,c,d,e,f,g){function h(){var b=+a.hours,c=a.showMeridian?b>0&&13>b:b>=0&&24>b;return c&&""!==a.hours?(a.showMeridian&&(12===b&&(b=0),a.meridian===v[1]&&(b+=12)),b):void 0}function i(){var b=+a.minutes,c=b>=0&&60>b;return c&&""!==a.minutes?b:void 0}function j(){var b=+a.seconds;return b>=0&&60>b?b:void 0}function k(a,b){return null===a?"":angular.isDefined(a)&&a.toString().length<2&&!b?"0"+a:a.toString()}function l(a){m(),u.$setViewValue(new Date(s)),n(a)}function m(){u.$setValidity("time",!0),a.invalidHours=!1,a.invalidMinutes=!1,a.invalidSeconds=!1}function n(b){if(u.$modelValue){var c=s.getHours(),d=s.getMinutes(),e=s.getSeconds();a.showMeridian&&(c=0===c||12===c?12:c%12),a.hours="h"===b?c:k(c,!w),"m"!==b&&(a.minutes=k(d)),a.meridian=s.getHours()<12?v[0]:v[1],"s"!==b&&(a.seconds=k(e)),a.meridian=s.getHours()<12?v[0]:v[1]}else a.hours=null,a.minutes=null,a.seconds=null,a.meridian=v[0]}function o(a){s=q(s,a),l()}function p(a,b){return q(a,60*b)}function q(a,b){var c=new Date(a.getTime()+1e3*b),d=new Date(a);return d.setHours(c.getHours(),c.getMinutes(),c.getSeconds()),d}function r(){return(null===a.hours||""===a.hours)&&(null===a.minutes||""===a.minutes)&&(!a.showSeconds||a.showSeconds&&(null===a.seconds||""===a.seconds))}var s=new Date,t=[],u={$setViewValue:angular.noop},v=angular.isDefined(c.meridians)?a.$parent.$eval(c.meridians):g.meridians||f.DATETIME_FORMATS.AMPMS,w=angular.isDefined(c.padHours)?a.$parent.$eval(c.padHours):!0;a.tabindex=angular.isDefined(c.tabindex)?c.tabindex:0,b.removeAttr("tabindex"),this.init=function(b,d){u=b,u.$render=this.render,u.$formatters.unshift(function(a){return a?new Date(a):null});var e=d.eq(0),f=d.eq(1),h=d.eq(2),i=angular.isDefined(c.mousewheel)?a.$parent.$eval(c.mousewheel):g.mousewheel;i&&this.setupMousewheelEvents(e,f,h);var j=angular.isDefined(c.arrowkeys)?a.$parent.$eval(c.arrowkeys):g.arrowkeys;j&&this.setupArrowkeyEvents(e,f,h),a.readonlyInput=angular.isDefined(c.readonlyInput)?a.$parent.$eval(c.readonlyInput):g.readonlyInput,this.setupInputEvents(e,f,h)};var x=g.hourStep;c.hourStep&&t.push(a.$parent.$watch(d(c.hourStep),function(a){x=+a}));var y=g.minuteStep;c.minuteStep&&t.push(a.$parent.$watch(d(c.minuteStep),function(a){y=+a}));var z;t.push(a.$parent.$watch(d(c.min),function(a){var b=new Date(a);z=isNaN(b)?void 0:b}));var A;t.push(a.$parent.$watch(d(c.max),function(a){var b=new Date(a);A=isNaN(b)?void 0:b}));var B=!1;c.ngDisabled&&t.push(a.$parent.$watch(d(c.ngDisabled),function(a){B=a})),a.noIncrementHours=function(){var a=p(s,60*x);return B||a>A||s>a&&z>a},a.noDecrementHours=function(){var a=p(s,60*-x);return B||z>a||a>s&&a>A},a.noIncrementMinutes=function(){var a=p(s,y);return B||a>A||s>a&&z>a},a.noDecrementMinutes=function(){var a=p(s,-y);return B||z>a||a>s&&a>A},a.noIncrementSeconds=function(){var a=q(s,C);return B||a>A||s>a&&z>a},a.noDecrementSeconds=function(){var a=q(s,-C);return B||z>a||a>s&&a>A},a.noToggleMeridian=function(){return s.getHours()<12?B||p(s,720)>A:B||p(s,-720)<z};var C=g.secondStep;c.secondStep&&t.push(a.$parent.$watch(d(c.secondStep),function(a){C=+a})),a.showSeconds=g.showSeconds,c.showSeconds&&t.push(a.$parent.$watch(d(c.showSeconds),function(b){a.showSeconds=!!b})),a.showMeridian=g.showMeridian,c.showMeridian&&t.push(a.$parent.$watch(d(c.showMeridian),function(b){if(a.showMeridian=!!b,u.$error.time){var c=h(),d=i();angular.isDefined(c)&&angular.isDefined(d)&&(s.setHours(c),l())}else n()})),this.setupMousewheelEvents=function(b,c,d){var e=function(a){a.originalEvent&&(a=a.originalEvent);var b=a.wheelDelta?a.wheelDelta:-a.deltaY;return a.detail||b>0};b.bind("mousewheel wheel",function(b){B||a.$apply(e(b)?a.incrementHours():a.decrementHours()),b.preventDefault()}),c.bind("mousewheel wheel",function(b){B||a.$apply(e(b)?a.incrementMinutes():a.decrementMinutes()),b.preventDefault()}),d.bind("mousewheel wheel",function(b){B||a.$apply(e(b)?a.incrementSeconds():a.decrementSeconds()),b.preventDefault()})},this.setupArrowkeyEvents=function(b,c,d){b.bind("keydown",function(b){B||(38===b.which?(b.preventDefault(),a.incrementHours(),a.$apply()):40===b.which&&(b.preventDefault(),a.decrementHours(),a.$apply()))}),c.bind("keydown",function(b){B||(38===b.which?(b.preventDefault(),a.incrementMinutes(),a.$apply()):40===b.which&&(b.preventDefault(),a.decrementMinutes(),a.$apply()))}),d.bind("keydown",function(b){B||(38===b.which?(b.preventDefault(),a.incrementSeconds(),a.$apply()):40===b.which&&(b.preventDefault(),a.decrementSeconds(),a.$apply()))})},this.setupInputEvents=function(b,c,d){if(a.readonlyInput)return a.updateHours=angular.noop,a.updateMinutes=angular.noop,void(a.updateSeconds=angular.noop);var e=function(b,c,d){u.$setViewValue(null),u.$setValidity("time",!1),angular.isDefined(b)&&(a.invalidHours=b),angular.isDefined(c)&&(a.invalidMinutes=c),angular.isDefined(d)&&(a.invalidSeconds=d)};a.updateHours=function(){var a=h(),b=i();u.$setDirty(),angular.isDefined(a)&&angular.isDefined(b)?(s.setHours(a),s.setMinutes(b),z>s||s>A?e(!0):l("h")):e(!0)},b.bind("blur",function(b){u.$setTouched(),r()?m():null===a.hours||""===a.hours?e(!0):!a.invalidHours&&a.hours<10&&a.$apply(function(){a.hours=k(a.hours,!w)})}),a.updateMinutes=function(){var a=i(),b=h();u.$setDirty(),angular.isDefined(a)&&angular.isDefined(b)?(s.setHours(b),s.setMinutes(a),z>s||s>A?e(void 0,!0):l("m")):e(void 0,!0)},c.bind("blur",function(b){u.$setTouched(),r()?m():null===a.minutes?e(void 0,!0):!a.invalidMinutes&&a.minutes<10&&a.$apply(function(){a.minutes=k(a.minutes)})}),a.updateSeconds=function(){var a=j();u.$setDirty(),angular.isDefined(a)?(s.setSeconds(a),l("s")):e(void 0,void 0,!0)},d.bind("blur",function(b){r()?m():!a.invalidSeconds&&a.seconds<10&&a.$apply(function(){a.seconds=k(a.seconds)})})},this.render=function(){var b=u.$viewValue;isNaN(b)?(u.$setValidity("time",!1),e.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.')):(b&&(s=b),z>s||s>A?(u.$setValidity("time",!1),a.invalidHours=!0,a.invalidMinutes=!0):m(),n())},a.showSpinners=angular.isDefined(c.showSpinners)?a.$parent.$eval(c.showSpinners):g.showSpinners,a.incrementHours=function(){a.noIncrementHours()||o(60*x*60)},a.decrementHours=function(){a.noDecrementHours()||o(60*-x*60)},a.incrementMinutes=function(){a.noIncrementMinutes()||o(60*y)},a.decrementMinutes=function(){a.noDecrementMinutes()||o(60*-y)},a.incrementSeconds=function(){a.noIncrementSeconds()||o(C)},a.decrementSeconds=function(){a.noDecrementSeconds()||o(-C)},a.toggleMeridian=function(){var b=i(),c=h();a.noToggleMeridian()||(angular.isDefined(b)&&angular.isDefined(c)?o(720*(s.getHours()<12?60:-60)):a.meridian=a.meridian===v[0]?v[1]:v[0])},a.blur=function(){u.$setTouched()},a.$on("$destroy",function(){for(;t.length;)t.shift()()})}]).directive("uibTimepicker",["uibTimepickerConfig",function(a){return{require:["uibTimepicker","?^ngModel"],controller:"UibTimepickerController",controllerAs:"timepicker",replace:!0,scope:{},templateUrl:function(b,c){return c.templateUrl||a.templateUrl},link:function(a,b,c,d){var e=d[0],f=d[1];f&&e.init(f,b.find("input"))}}}]),angular.module("ui.bootstrap.typeahead",["ui.bootstrap.debounce","ui.bootstrap.position"]).factory("uibTypeaheadParser",["$parse",function(a){var b=/^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;return{parse:function(c){var d=c.match(b);if(!d)throw new Error('Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_" but got "'+c+'".');return{itemName:d[3],source:a(d[4]),viewMapper:a(d[2]||d[1]),modelMapper:a(d[1])}}}}]).controller("UibTypeaheadController",["$scope","$element","$attrs","$compile","$parse","$q","$timeout","$document","$window","$rootScope","$$debounce","$uibPosition","uibTypeaheadParser",function(a,b,c,d,e,f,g,h,i,j,k,l,m){function n(){O.moveInProgress||(O.moveInProgress=!0,O.$digest()),Z()}function o(){O.position=E?l.offset(b):l.position(b),O.position.top+=b.prop("offsetHeight")}var p,q,r=[9,13,27,38,40],s=200,t=a.$eval(c.typeaheadMinLength);t||0===t||(t=1),a.$watch(c.typeaheadMinLength,function(a){t=a||0===a?a:1});var u=a.$eval(c.typeaheadWaitMs)||0,v=a.$eval(c.typeaheadEditable)!==!1;a.$watch(c.typeaheadEditable,function(a){v=a!==!1});var w,x,y=e(c.typeaheadLoading).assign||angular.noop,z=c.typeaheadShouldSelect?e(c.typeaheadShouldSelect):function(a,b){var c=b.$event;return 13===c.which||9===c.which},A=e(c.typeaheadOnSelect),B=angular.isDefined(c.typeaheadSelectOnBlur)?a.$eval(c.typeaheadSelectOnBlur):!1,C=e(c.typeaheadNoResults).assign||angular.noop,D=c.typeaheadInputFormatter?e(c.typeaheadInputFormatter):void 0,E=c.typeaheadAppendToBody?a.$eval(c.typeaheadAppendToBody):!1,F=c.typeaheadAppendTo?a.$eval(c.typeaheadAppendTo):null,G=a.$eval(c.typeaheadFocusFirst)!==!1,H=c.typeaheadSelectOnExact?a.$eval(c.typeaheadSelectOnExact):!1,I=e(c.typeaheadIsOpen).assign||angular.noop,J=a.$eval(c.typeaheadShowHint)||!1,K=e(c.ngModel),L=e(c.ngModel+"($$$p)"),M=function(b,c){return angular.isFunction(K(a))&&q&&q.$options&&q.$options.getterSetter?L(b,{$$$p:c}):K.assign(b,c)},N=m.parse(c.uibTypeahead),O=a.$new(),P=a.$on("$destroy",function(){O.$destroy()});O.$on("$destroy",P);var Q="typeahead-"+O.$id+"-"+Math.floor(1e4*Math.random());b.attr({"aria-autocomplete":"list","aria-expanded":!1,"aria-owns":Q});var R,S;J&&(R=angular.element("<div></div>"),R.css("position","relative"),b.after(R),S=b.clone(),S.attr("placeholder",""),S.attr("tabindex","-1"),S.val(""),S.css({position:"absolute",top:"0px",left:"0px","border-color":"transparent","box-shadow":"none",opacity:1,background:"none 0% 0% / auto repeat scroll padding-box border-box rgb(255, 255, 255)",color:"#999"}),b.css({position:"relative","vertical-align":"top","background-color":"transparent"}),R.append(S),S.after(b));var T=angular.element("<div uib-typeahead-popup></div>");T.attr({id:Q,matches:"matches",active:"activeIdx",select:"select(activeIdx, evt)","move-in-progress":"moveInProgress",query:"query",position:"position","assign-is-open":"assignIsOpen(isOpen)",debounce:"debounceUpdate"}),angular.isDefined(c.typeaheadTemplateUrl)&&T.attr("template-url",c.typeaheadTemplateUrl),angular.isDefined(c.typeaheadPopupTemplateUrl)&&T.attr("popup-template-url",c.typeaheadPopupTemplateUrl);var U=function(){J&&S.val("")},V=function(){O.matches=[],O.activeIdx=-1,b.attr("aria-expanded",!1),U()},W=function(a){return Q+"-option-"+a};O.$watch("activeIdx",function(a){0>a?b.removeAttr("aria-activedescendant"):b.attr("aria-activedescendant",W(a))});var X=function(a,b){return O.matches.length>b&&a?a.toUpperCase()===O.matches[b].label.toUpperCase():!1},Y=function(c,d){var e={$viewValue:c};y(a,!0),C(a,!1),f.when(N.source(a,e)).then(function(f){var g=c===p.$viewValue;if(g&&w)if(f&&f.length>0){O.activeIdx=G?0:-1,C(a,!1),O.matches.length=0;for(var h=0;h<f.length;h++)e[N.itemName]=f[h],O.matches.push({id:W(h),label:N.viewMapper(O,e),model:f[h]});if(O.query=c,o(),b.attr("aria-expanded",!0),H&&1===O.matches.length&&X(c,0)&&(angular.isNumber(O.debounceUpdate)||angular.isObject(O.debounceUpdate)?k(function(){O.select(0,d)},angular.isNumber(O.debounceUpdate)?O.debounceUpdate:O.debounceUpdate["default"]):O.select(0,d)),J){var i=O.matches[0].label;angular.isString(c)&&c.length>0&&i.slice(0,c.length).toUpperCase()===c.toUpperCase()?S.val(c+i.slice(c.length)):S.val("")}}else V(),C(a,!0);g&&y(a,!1)},function(){V(),y(a,!1),C(a,!0)})};E&&(angular.element(i).on("resize",n),h.find("body").on("scroll",n));var Z=k(function(){O.matches.length&&o(),O.moveInProgress=!1},s);O.moveInProgress=!1,O.query=void 0;var $,_=function(a){$=g(function(){Y(a)},u)},aa=function(){$&&g.cancel($)};V(),O.assignIsOpen=function(b){I(a,b)},O.select=function(d,e){var f,h,i={};x=!0,i[N.itemName]=h=O.matches[d].model,f=N.modelMapper(a,i),M(a,f),p.$setValidity("editable",!0),p.$setValidity("parse",!0),A(a,{$item:h,$model:f,$label:N.viewMapper(a,i),$event:e}),V(),O.$eval(c.typeaheadFocusOnSelect)!==!1&&g(function(){b[0].focus()},0,!1)},b.on("keydown",function(b){if(0!==O.matches.length&&-1!==r.indexOf(b.which)){var c=z(a,{$event:b});if(-1===O.activeIdx&&c||9===b.which&&b.shiftKey)return V(),void O.$digest();b.preventDefault();var d;switch(b.which){case 27:b.stopPropagation(),V(),a.$digest();break;case 38:O.activeIdx=(O.activeIdx>0?O.activeIdx:O.matches.length)-1,O.$digest(),d=T.find("li")[O.activeIdx],d.parentNode.scrollTop=d.offsetTop;break;case 40:O.activeIdx=(O.activeIdx+1)%O.matches.length,O.$digest(),d=T.find("li")[O.activeIdx],d.parentNode.scrollTop=d.offsetTop;break;default:c&&O.$apply(function(){angular.isNumber(O.debounceUpdate)||angular.isObject(O.debounceUpdate)?k(function(){O.select(O.activeIdx,b)},angular.isNumber(O.debounceUpdate)?O.debounceUpdate:O.debounceUpdate["default"]):O.select(O.activeIdx,b)})}}}),b.bind("focus",function(a){w=!0,0!==t||p.$viewValue||g(function(){Y(p.$viewValue,a)},0)}),b.bind("blur",function(a){B&&O.matches.length&&-1!==O.activeIdx&&!x&&(x=!0,O.$apply(function(){angular.isObject(O.debounceUpdate)&&angular.isNumber(O.debounceUpdate.blur)?k(function(){O.select(O.activeIdx,a)},O.debounceUpdate.blur):O.select(O.activeIdx,a)})),!v&&p.$error.editable&&(p.$setViewValue(),p.$setValidity("editable",!0),p.$setValidity("parse",!0),b.val("")),w=!1,x=!1});var ba=function(c){b[0]!==c.target&&3!==c.which&&0!==O.matches.length&&(V(),j.$$phase||a.$digest())};h.on("click",ba),a.$on("$destroy",function(){h.off("click",ba),(E||F)&&ca.remove(),E&&(angular.element(i).off("resize",n),h.find("body").off("scroll",n)),T.remove(),J&&R.remove()});var ca=d(T)(O);E?h.find("body").append(ca):F?angular.element(F).eq(0).append(ca):b.after(ca),this.init=function(b,c){p=b,q=c,O.debounceUpdate=p.$options&&e(p.$options.debounce)(a),p.$parsers.unshift(function(b){return w=!0,0===t||b&&b.length>=t?u>0?(aa(),_(b)):Y(b):(y(a,!1),aa(),V()),v?b:b?void p.$setValidity("editable",!1):(p.$setValidity("editable",!0),null)}),p.$formatters.push(function(b){var c,d,e={};return v||p.$setValidity("editable",!0),D?(e.$model=b,D(a,e)):(e[N.itemName]=b,c=N.viewMapper(a,e),e[N.itemName]=void 0,d=N.viewMapper(a,e),c!==d?c:b)})}}]).directive("uibTypeahead",function(){return{controller:"UibTypeaheadController",require:["ngModel","^?ngModelOptions","uibTypeahead"],link:function(a,b,c,d){d[2].init(d[0],d[1])}}}).directive("uibTypeaheadPopup",["$$debounce",function(a){return{scope:{matches:"=",query:"=",active:"=",position:"&",moveInProgress:"=",select:"&",assignIsOpen:"&",debounce:"&"},replace:!0,templateUrl:function(a,b){return b.popupTemplateUrl||"uib/template/typeahead/typeahead-popup.html"},link:function(b,c,d){b.templateUrl=d.templateUrl,b.isOpen=function(){var a=b.matches.length>0;return b.assignIsOpen({isOpen:a}),a},b.isActive=function(a){return b.active===a},b.selectActive=function(a){b.active=a},b.selectMatch=function(c,d){var e=b.debounce();angular.isNumber(e)||angular.isObject(e)?a(function(){b.select({activeIdx:c,evt:d})},angular.isNumber(e)?e:e["default"]):b.select({activeIdx:c,evt:d})}}}}]).directive("uibTypeaheadMatch",["$templateRequest","$compile","$parse",function(a,b,c){return{scope:{index:"=",match:"=",query:"="},link:function(d,e,f){var g=c(f.templateUrl)(d.$parent)||"uib/template/typeahead/typeahead-match.html";a(g).then(function(a){var c=angular.element(a.trim());e.replaceWith(c),b(c)(d)})}}}]).filter("uibTypeaheadHighlight",["$sce","$injector","$log",function(a,b,c){function d(a){return a.replace(/([.?*+^$[\]\\(){}|-])/g,"\\$1")}function e(a){return/<.*>/g.test(a)}var f;return f=b.has("$sanitize"),function(b,g){return!f&&e(b)&&c.warn("Unsafe use of typeahead please use ngSanitize"),b=g?(""+b).replace(new RegExp(d(g),"gi"),"<strong>$&</strong>"):b,f||(b=a.trustAsHtml(b)),b}}]),angular.module("uib/template/accordion/accordion-group.html",[]).run(["$templateCache",function(a){a.put("uib/template/accordion/accordion-group.html",'<div class="panel" ng-class="panelClass || \'panel-default\'">\n  <div role="tab" id="{{::headingId}}" aria-selected="{{isOpen}}" class="panel-heading" ng-keypress="toggleOpen($event)">\n    <h4 class="panel-title">\n      <a role="button" data-toggle="collapse" href aria-expanded="{{isOpen}}" aria-controls="{{::panelId}}" tabindex="0" class="accordion-toggle" ng-click="toggleOpen()" uib-accordion-transclude="heading"><span uib-accordion-header ng-class="{\'text-muted\': isDisabled}">{{heading}}</span></a>\n    </h4>\n  </div>\n  <div id="{{::panelId}}" aria-labelledby="{{::headingId}}" aria-hidden="{{!isOpen}}" role="tabpanel" class="panel-collapse collapse" uib-collapse="!isOpen">\n    <div class="panel-body" ng-transclude></div>\n  </div>\n</div>\n')}]),angular.module("uib/template/accordion/accordion.html",[]).run(["$templateCache",function(a){a.put("uib/template/accordion/accordion.html",'<div role="tablist" class="panel-group" ng-transclude></div>')}]),angular.module("uib/template/alert/alert.html",[]).run(["$templateCache",function(a){a.put("uib/template/alert/alert.html",'<div class="alert" ng-class="[\'alert-\' + (type || \'warning\'), closeable ? \'alert-dismissible\' : null]" role="alert">\n    <button ng-show="closeable" type="button" class="close" ng-click="close({$event: $event})">\n        <span aria-hidden="true">&times;</span>\n        <span class="sr-only">Close</span>\n    </button>\n    <div ng-transclude></div>\n</div>\n')}]),angular.module("uib/template/carousel/carousel.html",[]).run(["$templateCache",function(a){a.put("uib/template/carousel/carousel.html",'<div ng-mouseenter="pause()" ng-mouseleave="play()" class="carousel" ng-swipe-right="prev()" ng-swipe-left="next()">\n  <div class="carousel-inner" ng-transclude></div>\n  <a role="button" href class="left carousel-control" ng-click="prev()" ng-class="{ disabled: isPrevDisabled() }" ng-show="slides.length > 1">\n    <span aria-hidden="true" class="glyphicon glyphicon-chevron-left"></span>\n    <span class="sr-only">previous</span>\n  </a>\n  <a role="button" href class="right carousel-control" ng-click="next()" ng-class="{ disabled: isNextDisabled() }" ng-show="slides.length > 1">\n    <span aria-hidden="true" class="glyphicon glyphicon-chevron-right"></span>\n    <span class="sr-only">next</span>\n  </a>\n  <ol class="carousel-indicators" ng-show="slides.length > 1">\n    <li ng-repeat="slide in slides | orderBy:indexOfSlide track by $index" ng-class="{ active: isActive(slide) }" ng-click="select(slide)">\n      <span class="sr-only">slide {{ $index + 1 }} of {{ slides.length }}<span ng-if="isActive(slide)">, currently active</span></span>\n    </li>\n  </ol>\n</div>\n');
}]),angular.module("uib/template/carousel/slide.html",[]).run(["$templateCache",function(a){a.put("uib/template/carousel/slide.html",'<div ng-class="{\n    \'active\': active\n  }" class="item text-center" ng-transclude></div>\n')}]),angular.module("uib/template/datepicker/datepicker.html",[]).run(["$templateCache",function(a){a.put("uib/template/datepicker/datepicker.html",'<div class="uib-datepicker" ng-switch="datepickerMode" role="application" ng-keydown="keydown($event)">\n  <uib-daypicker ng-switch-when="day" tabindex="0"></uib-daypicker>\n  <uib-monthpicker ng-switch-when="month" tabindex="0"></uib-monthpicker>\n  <uib-yearpicker ng-switch-when="year" tabindex="0"></uib-yearpicker>\n</div>\n')}]),angular.module("uib/template/datepicker/day.html",[]).run(["$templateCache",function(a){a.put("uib/template/datepicker/day.html",'<table class="uib-daypicker" role="grid" aria-labelledby="{{::uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n  <thead>\n    <tr>\n      <th><button type="button" class="btn btn-default btn-sm pull-left uib-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n      <th colspan="{{::5 + showWeeks}}"><button id="{{::uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm uib-title" ng-click="toggleMode()" ng-disabled="datepickerMode === maxMode" tabindex="-1"><strong>{{title}}</strong></button></th>\n      <th><button type="button" class="btn btn-default btn-sm pull-right uib-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n    </tr>\n    <tr>\n      <th ng-if="showWeeks" class="text-center"></th>\n      <th ng-repeat="label in ::labels track by $index" class="text-center"><small aria-label="{{::label.full}}">{{::label.abbr}}</small></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr class="uib-weeks" ng-repeat="row in rows track by $index">\n      <td ng-if="showWeeks" class="text-center h6"><em>{{ weekNumbers[$index] }}</em></td>\n      <td ng-repeat="dt in row" class="uib-day text-center" role="gridcell"\n        id="{{::dt.uid}}"\n        ng-class="::dt.customClass">\n        <button type="button" class="btn btn-default btn-sm"\n          uib-is-class="\n            \'btn-info\' for selectedDt,\n            \'active\' for activeDt\n            on dt"\n          ng-click="select(dt.date)"\n          ng-disabled="::dt.disabled"\n          tabindex="-1"><span ng-class="::{\'text-muted\': dt.secondary, \'text-info\': dt.current}">{{::dt.label}}</span></button>\n      </td>\n    </tr>\n  </tbody>\n</table>\n')}]),angular.module("uib/template/datepicker/month.html",[]).run(["$templateCache",function(a){a.put("uib/template/datepicker/month.html",'<table class="uib-monthpicker" role="grid" aria-labelledby="{{::uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n  <thead>\n    <tr>\n      <th><button type="button" class="btn btn-default btn-sm pull-left uib-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n      <th><button id="{{::uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm uib-title" ng-click="toggleMode()" ng-disabled="datepickerMode === maxMode" tabindex="-1"><strong>{{title}}</strong></button></th>\n      <th><button type="button" class="btn btn-default btn-sm pull-right uib-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr class="uib-months" ng-repeat="row in rows track by $index">\n      <td ng-repeat="dt in row" class="uib-month text-center" role="gridcell"\n        id="{{::dt.uid}}"\n        ng-class="::dt.customClass">\n        <button type="button" class="btn btn-default"\n          uib-is-class="\n            \'btn-info\' for selectedDt,\n            \'active\' for activeDt\n            on dt"\n          ng-click="select(dt.date)"\n          ng-disabled="::dt.disabled"\n          tabindex="-1"><span ng-class="::{\'text-info\': dt.current}">{{::dt.label}}</span></button>\n      </td>\n    </tr>\n  </tbody>\n</table>\n')}]),angular.module("uib/template/datepicker/year.html",[]).run(["$templateCache",function(a){a.put("uib/template/datepicker/year.html",'<table class="uib-yearpicker" role="grid" aria-labelledby="{{::uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n  <thead>\n    <tr>\n      <th><button type="button" class="btn btn-default btn-sm pull-left uib-left" ng-click="move(-1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-left"></i></button></th>\n      <th colspan="{{::columns - 2}}"><button id="{{::uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm uib-title" ng-click="toggleMode()" ng-disabled="datepickerMode === maxMode" tabindex="-1"><strong>{{title}}</strong></button></th>\n      <th><button type="button" class="btn btn-default btn-sm pull-right uib-right" ng-click="move(1)" tabindex="-1"><i class="glyphicon glyphicon-chevron-right"></i></button></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr class="uib-years" ng-repeat="row in rows track by $index">\n      <td ng-repeat="dt in row" class="uib-year text-center" role="gridcell"\n        id="{{::dt.uid}}"\n        ng-class="::dt.customClass">\n        <button type="button" class="btn btn-default"\n          uib-is-class="\n            \'btn-info\' for selectedDt,\n            \'active\' for activeDt\n            on dt"\n          ng-click="select(dt.date)"\n          ng-disabled="::dt.disabled"\n          tabindex="-1"><span ng-class="::{\'text-info\': dt.current}">{{::dt.label}}</span></button>\n      </td>\n    </tr>\n  </tbody>\n</table>\n')}]),angular.module("uib/template/datepickerPopup/popup.html",[]).run(["$templateCache",function(a){a.put("uib/template/datepickerPopup/popup.html",'<div>\n  <ul class="uib-datepicker-popup dropdown-menu uib-position-measure" dropdown-nested ng-if="isOpen" ng-keydown="keydown($event)" ng-click="$event.stopPropagation()">\n    <li ng-transclude></li>\n    <li ng-if="showButtonBar" class="uib-button-bar">\n      <span class="btn-group pull-left">\n        <button type="button" class="btn btn-sm btn-info uib-datepicker-current" ng-click="select(\'today\', $event)" ng-disabled="isDisabled(\'today\')">{{ getText(\'current\') }}</button>\n        <button type="button" class="btn btn-sm btn-danger uib-clear" ng-click="select(null, $event)">{{ getText(\'clear\') }}</button>\n      </span>\n      <button type="button" class="btn btn-sm btn-success pull-right uib-close" ng-click="close($event)">{{ getText(\'close\') }}</button>\n    </li>\n  </ul>\n</div>\n')}]),angular.module("uib/template/modal/backdrop.html",[]).run(["$templateCache",function(a){a.put("uib/template/modal/backdrop.html",'<div class="modal-backdrop"\n     uib-modal-animation-class="fade"\n     modal-in-class="in"\n     ng-style="{\'z-index\': 1040 + (index && 1 || 0) + index*10}"\n></div>\n')}]),angular.module("uib/template/modal/window.html",[]).run(["$templateCache",function(a){a.put("uib/template/modal/window.html",'<div modal-render="{{$isRendered}}" tabindex="-1" role="dialog" class="modal"\n    uib-modal-animation-class="fade"\n    modal-in-class="in"\n    ng-style="{\'z-index\': 1050 + index*10, display: \'block\'}">\n    <div class="modal-dialog {{size ? \'modal-\' + size : \'\'}}"><div class="modal-content" uib-modal-transclude></div></div>\n</div>\n')}]),angular.module("uib/template/pager/pager.html",[]).run(["$templateCache",function(a){a.put("uib/template/pager/pager.html",'<ul class="pager">\n  <li ng-class="{disabled: noPrevious()||ngDisabled, previous: align}"><a href ng-click="selectPage(page - 1, $event)">{{::getText(\'previous\')}}</a></li>\n  <li ng-class="{disabled: noNext()||ngDisabled, next: align}"><a href ng-click="selectPage(page + 1, $event)">{{::getText(\'next\')}}</a></li>\n</ul>\n')}]),angular.module("uib/template/pagination/pagination.html",[]).run(["$templateCache",function(a){a.put("uib/template/pagination/pagination.html",'<ul class="pagination">\n  <li ng-if="::boundaryLinks" ng-class="{disabled: noPrevious()||ngDisabled}" class="pagination-first"><a href ng-click="selectPage(1, $event)">{{::getText(\'first\')}}</a></li>\n  <li ng-if="::directionLinks" ng-class="{disabled: noPrevious()||ngDisabled}" class="pagination-prev"><a href ng-click="selectPage(page - 1, $event)">{{::getText(\'previous\')}}</a></li>\n  <li ng-repeat="page in pages track by $index" ng-class="{active: page.active,disabled: ngDisabled&&!page.active}" class="pagination-page"><a href ng-click="selectPage(page.number, $event)">{{page.text}}</a></li>\n  <li ng-if="::directionLinks" ng-class="{disabled: noNext()||ngDisabled}" class="pagination-next"><a href ng-click="selectPage(page + 1, $event)">{{::getText(\'next\')}}</a></li>\n  <li ng-if="::boundaryLinks" ng-class="{disabled: noNext()||ngDisabled}" class="pagination-last"><a href ng-click="selectPage(totalPages, $event)">{{::getText(\'last\')}}</a></li>\n</ul>\n')}]),angular.module("uib/template/tooltip/tooltip-html-popup.html",[]).run(["$templateCache",function(a){a.put("uib/template/tooltip/tooltip-html-popup.html",'<div class="tooltip"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="tooltip-arrow"></div>\n  <div class="tooltip-inner" ng-bind-html="contentExp()"></div>\n</div>\n')}]),angular.module("uib/template/tooltip/tooltip-popup.html",[]).run(["$templateCache",function(a){a.put("uib/template/tooltip/tooltip-popup.html",'<div class="tooltip"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="tooltip-arrow"></div>\n  <div class="tooltip-inner" ng-bind="content"></div>\n</div>\n')}]),angular.module("uib/template/tooltip/tooltip-template-popup.html",[]).run(["$templateCache",function(a){a.put("uib/template/tooltip/tooltip-template-popup.html",'<div class="tooltip"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="tooltip-arrow"></div>\n  <div class="tooltip-inner"\n    uib-tooltip-template-transclude="contentExp()"\n    tooltip-template-transclude-scope="originScope()"></div>\n</div>\n')}]),angular.module("uib/template/popover/popover-html.html",[]).run(["$templateCache",function(a){a.put("uib/template/popover/popover-html.html",'<div class="popover"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="arrow"></div>\n\n  <div class="popover-inner">\n      <h3 class="popover-title" ng-bind="uibTitle" ng-if="uibTitle"></h3>\n      <div class="popover-content" ng-bind-html="contentExp()"></div>\n  </div>\n</div>\n')}]),angular.module("uib/template/popover/popover-template.html",[]).run(["$templateCache",function(a){a.put("uib/template/popover/popover-template.html",'<div class="popover"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="arrow"></div>\n\n  <div class="popover-inner">\n      <h3 class="popover-title" ng-bind="uibTitle" ng-if="uibTitle"></h3>\n      <div class="popover-content"\n        uib-tooltip-template-transclude="contentExp()"\n        tooltip-template-transclude-scope="originScope()"></div>\n  </div>\n</div>\n')}]),angular.module("uib/template/popover/popover.html",[]).run(["$templateCache",function(a){a.put("uib/template/popover/popover.html",'<div class="popover"\n  tooltip-animation-class="fade"\n  uib-tooltip-classes\n  ng-class="{ in: isOpen() }">\n  <div class="arrow"></div>\n\n  <div class="popover-inner">\n      <h3 class="popover-title" ng-bind="uibTitle" ng-if="uibTitle"></h3>\n      <div class="popover-content" ng-bind="content"></div>\n  </div>\n</div>\n')}]),angular.module("uib/template/progressbar/bar.html",[]).run(["$templateCache",function(a){a.put("uib/template/progressbar/bar.html",'<div class="progress-bar" ng-class="type && \'progress-bar-\' + type" role="progressbar" aria-valuenow="{{value}}" aria-valuemin="0" aria-valuemax="{{max}}" ng-style="{width: (percent < 100 ? percent : 100) + \'%\'}" aria-valuetext="{{percent | number:0}}%" aria-labelledby="{{::title}}" ng-transclude></div>\n')}]),angular.module("uib/template/progressbar/progress.html",[]).run(["$templateCache",function(a){a.put("uib/template/progressbar/progress.html",'<div class="progress" ng-transclude aria-labelledby="{{::title}}"></div>')}]),angular.module("uib/template/progressbar/progressbar.html",[]).run(["$templateCache",function(a){a.put("uib/template/progressbar/progressbar.html",'<div class="progress">\n  <div class="progress-bar" ng-class="type && \'progress-bar-\' + type" role="progressbar" aria-valuenow="{{value}}" aria-valuemin="0" aria-valuemax="{{max}}" ng-style="{width: (percent < 100 ? percent : 100) + \'%\'}" aria-valuetext="{{percent | number:0}}%" aria-labelledby="{{::title}}" ng-transclude></div>\n</div>\n')}]),angular.module("uib/template/rating/rating.html",[]).run(["$templateCache",function(a){a.put("uib/template/rating/rating.html",'<span ng-mouseleave="reset()" ng-keydown="onKeydown($event)" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="{{range.length}}" aria-valuenow="{{value}}" aria-valuetext="{{title}}">\n    <span ng-repeat-start="r in range track by $index" class="sr-only">({{ $index < value ? \'*\' : \' \' }})</span>\n    <i ng-repeat-end ng-mouseenter="enter($index + 1)" ng-click="rate($index + 1)" class="glyphicon" ng-class="$index < value && (r.stateOn || \'glyphicon-star\') || (r.stateOff || \'glyphicon-star-empty\')" ng-attr-title="{{r.title}}"></i>\n</span>\n')}]),angular.module("uib/template/tabs/tab.html",[]).run(["$templateCache",function(a){a.put("uib/template/tabs/tab.html",'<li ng-class="[{active: active, disabled: disabled}, classes]" class="uib-tab nav-item">\n  <a href ng-click="select($event)" class="nav-link" uib-tab-heading-transclude>{{heading}}</a>\n</li>\n')}]),angular.module("uib/template/tabs/tabset.html",[]).run(["$templateCache",function(a){a.put("uib/template/tabs/tabset.html",'<div>\n  <ul class="nav nav-{{tabset.type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n  <div class="tab-content">\n    <div class="tab-pane"\n         ng-repeat="tab in tabset.tabs"\n         ng-class="{active: tabset.active === tab.index}"\n         uib-tab-content-transclude="tab">\n    </div>\n  </div>\n</div>\n')}]),angular.module("uib/template/timepicker/timepicker.html",[]).run(["$templateCache",function(a){a.put("uib/template/timepicker/timepicker.html",'<table class="uib-timepicker">\n  <tbody>\n    <tr class="text-center" ng-show="::showSpinners">\n      <td class="uib-increment hours"><a ng-click="incrementHours()" ng-class="{disabled: noIncrementHours()}" class="btn btn-link" ng-disabled="noIncrementHours()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-up"></span></a></td>\n      <td>&nbsp;</td>\n      <td class="uib-increment minutes"><a ng-click="incrementMinutes()" ng-class="{disabled: noIncrementMinutes()}" class="btn btn-link" ng-disabled="noIncrementMinutes()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-up"></span></a></td>\n      <td ng-show="showSeconds">&nbsp;</td>\n      <td ng-show="showSeconds" class="uib-increment seconds"><a ng-click="incrementSeconds()" ng-class="{disabled: noIncrementSeconds()}" class="btn btn-link" ng-disabled="noIncrementSeconds()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-up"></span></a></td>\n      <td ng-show="showMeridian"></td>\n    </tr>\n    <tr>\n      <td class="form-group uib-time hours" ng-class="{\'has-error\': invalidHours}">\n        <input type="text" placeholder="HH" ng-model="hours" ng-change="updateHours()" class="form-control text-center" ng-readonly="::readonlyInput" maxlength="2" tabindex="{{::tabindex}}" ng-disabled="noIncrementHours()" ng-blur="blur()">\n      </td>\n      <td class="uib-separator">:</td>\n      <td class="form-group uib-time minutes" ng-class="{\'has-error\': invalidMinutes}">\n        <input type="text" placeholder="MM" ng-model="minutes" ng-change="updateMinutes()" class="form-control text-center" ng-readonly="::readonlyInput" maxlength="2" tabindex="{{::tabindex}}" ng-disabled="noIncrementMinutes()" ng-blur="blur()">\n      </td>\n      <td ng-show="showSeconds" class="uib-separator">:</td>\n      <td class="form-group uib-time seconds" ng-class="{\'has-error\': invalidSeconds}" ng-show="showSeconds">\n        <input type="text" placeholder="SS" ng-model="seconds" ng-change="updateSeconds()" class="form-control text-center" ng-readonly="readonlyInput" maxlength="2" tabindex="{{::tabindex}}" ng-disabled="noIncrementSeconds()" ng-blur="blur()">\n      </td>\n      <td ng-show="showMeridian" class="uib-time am-pm"><button type="button" ng-class="{disabled: noToggleMeridian()}" class="btn btn-default text-center" ng-click="toggleMeridian()" ng-disabled="noToggleMeridian()" tabindex="{{::tabindex}}">{{meridian}}</button></td>\n    </tr>\n    <tr class="text-center" ng-show="::showSpinners">\n      <td class="uib-decrement hours"><a ng-click="decrementHours()" ng-class="{disabled: noDecrementHours()}" class="btn btn-link" ng-disabled="noDecrementHours()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-down"></span></a></td>\n      <td>&nbsp;</td>\n      <td class="uib-decrement minutes"><a ng-click="decrementMinutes()" ng-class="{disabled: noDecrementMinutes()}" class="btn btn-link" ng-disabled="noDecrementMinutes()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-down"></span></a></td>\n      <td ng-show="showSeconds">&nbsp;</td>\n      <td ng-show="showSeconds" class="uib-decrement seconds"><a ng-click="decrementSeconds()" ng-class="{disabled: noDecrementSeconds()}" class="btn btn-link" ng-disabled="noDecrementSeconds()" tabindex="{{::tabindex}}"><span class="glyphicon glyphicon-chevron-down"></span></a></td>\n      <td ng-show="showMeridian"></td>\n    </tr>\n  </tbody>\n</table>\n')}]),angular.module("uib/template/typeahead/typeahead-match.html",[]).run(["$templateCache",function(a){a.put("uib/template/typeahead/typeahead-match.html",'<a href\n   tabindex="-1"\n   ng-bind-html="match.label | uibTypeaheadHighlight:query"\n   ng-attr-title="{{match.label}}"></a>\n')}]),angular.module("uib/template/typeahead/typeahead-popup.html",[]).run(["$templateCache",function(a){a.put("uib/template/typeahead/typeahead-popup.html",'<ul class="dropdown-menu" ng-show="isOpen() && !moveInProgress" ng-style="{top: position().top+\'px\', left: position().left+\'px\'}" role="listbox" aria-hidden="{{!isOpen()}}">\n    <li ng-repeat="match in matches track by $index" ng-class="{active: isActive($index) }" ng-mouseenter="selectActive($index)" ng-click="selectMatch($index, $event)" role="option" id="{{::match.id}}">\n        <div uib-typeahead-match index="$index" match="match" query="query" template-url="templateUrl"></div>\n    </li>\n</ul>\n')}]),angular.module("ui.bootstrap.carousel").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibCarouselCss&&angular.element(document).find("head").prepend('<style type="text/css">.ng-animate.item:not(.left):not(.right){-webkit-transition:0s ease-in-out left;transition:0s ease-in-out left}</style>'),angular.$$uibCarouselCss=!0}),angular.module("ui.bootstrap.datepicker").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibDatepickerCss&&angular.element(document).find("head").prepend('<style type="text/css">.uib-datepicker .uib-title{width:100%;}.uib-day button,.uib-month button,.uib-year button{min-width:100%;}.uib-left,.uib-right{width:100%}</style>'),angular.$$uibDatepickerCss=!0}),angular.module("ui.bootstrap.position").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibPositionCss&&angular.element(document).find("head").prepend('<style type="text/css">.uib-position-measure{display:block !important;visibility:hidden !important;position:absolute !important;top:-9999px !important;left:-9999px !important;}.uib-position-scrollbar-measure{position:absolute !important;top:-9999px !important;width:50px !important;height:50px !important;overflow:scroll !important;}.uib-position-body-scrollbar-measure{overflow:scroll !important;}</style>'),angular.$$uibPositionCss=!0}),angular.module("ui.bootstrap.datepickerPopup").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibDatepickerpopupCss&&angular.element(document).find("head").prepend('<style type="text/css">.uib-datepicker-popup.dropdown-menu{display:block;float:none;margin:0;}.uib-button-bar{padding:10px 9px 2px;}</style>'),angular.$$uibDatepickerpopupCss=!0}),angular.module("ui.bootstrap.tooltip").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibTooltipCss&&angular.element(document).find("head").prepend('<style type="text/css">[uib-tooltip-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-bottom > .tooltip-arrow,[uib-popover-popup].popover.top-left > .arrow,[uib-popover-popup].popover.top-right > .arrow,[uib-popover-popup].popover.bottom-left > .arrow,[uib-popover-popup].popover.bottom-right > .arrow,[uib-popover-popup].popover.left-top > .arrow,[uib-popover-popup].popover.left-bottom > .arrow,[uib-popover-popup].popover.right-top > .arrow,[uib-popover-popup].popover.right-bottom > .arrow,[uib-popover-html-popup].popover.top-left > .arrow,[uib-popover-html-popup].popover.top-right > .arrow,[uib-popover-html-popup].popover.bottom-left > .arrow,[uib-popover-html-popup].popover.bottom-right > .arrow,[uib-popover-html-popup].popover.left-top > .arrow,[uib-popover-html-popup].popover.left-bottom > .arrow,[uib-popover-html-popup].popover.right-top > .arrow,[uib-popover-html-popup].popover.right-bottom > .arrow,[uib-popover-template-popup].popover.top-left > .arrow,[uib-popover-template-popup].popover.top-right > .arrow,[uib-popover-template-popup].popover.bottom-left > .arrow,[uib-popover-template-popup].popover.bottom-right > .arrow,[uib-popover-template-popup].popover.left-top > .arrow,[uib-popover-template-popup].popover.left-bottom > .arrow,[uib-popover-template-popup].popover.right-top > .arrow,[uib-popover-template-popup].popover.right-bottom > .arrow{top:auto;bottom:auto;left:auto;right:auto;margin:0;}[uib-popover-popup].popover,[uib-popover-html-popup].popover,[uib-popover-template-popup].popover{display:block !important;}</style>'),angular.$$uibTooltipCss=!0}),angular.module("ui.bootstrap.timepicker").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibTimepickerCss&&angular.element(document).find("head").prepend('<style type="text/css">.uib-time input{width:50px;}</style>'),angular.$$uibTimepickerCss=!0}),angular.module("ui.bootstrap.typeahead").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibTypeaheadCss&&angular.element(document).find("head").prepend('<style type="text/css">[uib-typeahead-popup].dropdown-menu{display:block;}</style>'),angular.$$uibTypeaheadCss=!0});