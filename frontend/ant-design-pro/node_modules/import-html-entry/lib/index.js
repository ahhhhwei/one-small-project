"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = importHTML;
exports.execScripts = _execScripts;
exports.getExternalScripts = _getExternalScripts;
exports.getExternalStyleSheets = _getExternalStyleSheets;
exports.importEntry = importEntry;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _allSettledButCanBreak = require("./allSettledButCanBreak");
var _processTpl2 = _interopRequireWildcard(require("./process-tpl"));
var _utils = require("./utils");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var styleCache = {};
var scriptCache = {};
var embedHTMLCache = {};
if (!window.fetch) {
  throw new Error('[import-html-entry] Here is no "fetch" on the window env, you need to polyfill it');
}
var defaultFetch = window.fetch.bind(window);
function defaultGetTemplate(tpl) {
  return tpl;
}

/**
 * convert external css link to inline style for performance optimization
 * @param template
 * @param styles
 * @param opts
 * @return embedHTML
 */
function getEmbedHTML(template, styles) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var _opts$fetch = opts.fetch,
    fetch = _opts$fetch === void 0 ? defaultFetch : _opts$fetch;
  var embedHTML = template;
  return _getExternalStyleSheets(styles, fetch).then(function (styleSheets) {
    embedHTML = styleSheets.reduce(function (html, styleSheet) {
      var styleSrc = styleSheet.src;
      var styleSheetContent = styleSheet.value;
      html = html.replace((0, _processTpl2.genLinkReplaceSymbol)(styleSrc), isInlineCode(styleSrc) ? "".concat(styleSrc) : "<style>/* ".concat(styleSrc, " */").concat(styleSheetContent, "</style>"));
      return html;
    }, embedHTML);
    return embedHTML;
  });
}
var isInlineCode = function isInlineCode(code) {
  return code.startsWith('<');
};
function getExecutableScript(scriptSrc, scriptText) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var proxy = opts.proxy,
    strictGlobal = opts.strictGlobal,
    _opts$scopedGlobalVar = opts.scopedGlobalVariables,
    scopedGlobalVariables = _opts$scopedGlobalVar === void 0 ? [] : _opts$scopedGlobalVar;
  var sourceUrl = isInlineCode(scriptSrc) ? '' : "//# sourceURL=".concat(scriptSrc, "\n");

  // 将 scopedGlobalVariables 拼接成变量声明，用于缓存全局变量，避免每次使用时都走一遍代理
  var scopedGlobalVariableDefinition = scopedGlobalVariables.length ? "const {".concat(scopedGlobalVariables.join(','), "}=this;") : '';

  // 通过这种方式获取全局 window，因为 script 也是在全局作用域下运行的，所以我们通过 window.proxy 绑定时也必须确保绑定到全局 window 上
  // 否则在嵌套场景下， window.proxy 设置的是内层应用的 window，而代码其实是在全局作用域运行的，会导致闭包里的 window.proxy 取的是最外层的微应用的 proxy
  var globalWindow = (0, eval)('window');
  globalWindow.proxy = proxy;
  // TODO 通过 strictGlobal 方式切换 with 闭包，待 with 方式坑趟平后再合并
  return strictGlobal ? scopedGlobalVariableDefinition ? ";(function(){with(this){".concat(scopedGlobalVariableDefinition).concat(scriptText, "\n").concat(sourceUrl, "}}).bind(window.proxy)();") : ";(function(window, self, globalThis){with(window){;".concat(scriptText, "\n").concat(sourceUrl, "}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);") : ";(function(window, self, globalThis){;".concat(scriptText, "\n").concat(sourceUrl, "}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);");
}

// for prefetch
function _getExternalStyleSheets(styles) {
  var fetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultFetch;
  return (0, _allSettledButCanBreak.allSettledButCanBreak)(styles.map( /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(styleLink) {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            if (!isInlineCode(styleLink)) {
              _context.next = 4;
              break;
            }
            return _context.abrupt("return", (0, _utils.getInlineCode)(styleLink));
          case 4:
            return _context.abrupt("return", styleCache[styleLink] || (styleCache[styleLink] = fetch(styleLink).then(function (response) {
              if (response.status >= 400) {
                throw new Error("".concat(styleLink, " load failed with status ").concat(response.status));
              }
              return response.text();
            })["catch"](function (e) {
              try {
                if (e.message.indexOf(styleLink) === -1) {
                  e.message = "".concat(styleLink, " ").concat(e.message);
                }
              } catch (_) {
                // e.message 可能是 readonly，此时会触发异常
              }
              throw e;
            })));
          case 5:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }())).then(function (results) {
    return results.map(function (result, i) {
      if (result.status === 'fulfilled') {
        result.value = {
          src: styles[i],
          value: result.value
        };
      }
      return result;
    }).filter(function (result) {
      // 忽略失败的请求，避免异常下载阻塞后续资源加载
      if (result.status === 'rejected') {
        Promise.reject(result.reason);
      }
      return result.status === 'fulfilled';
    }).map(function (result) {
      return result.value;
    });
  });
}

// for prefetch
function _getExternalScripts(scripts) {
  var fetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultFetch;
  var entry = arguments.length > 2 ? arguments[2] : undefined;
  var fetchScript = function fetchScript(scriptUrl, opts) {
    return scriptCache[scriptUrl] || (scriptCache[scriptUrl] = fetch(scriptUrl, opts).then(function (response) {
      // usually browser treats 4xx and 5xx response of script loading as an error and will fire a script error event
      // https://stackoverflow.com/questions/5625420/what-http-headers-responses-trigger-the-onerror-handler-on-a-script-tag/5625603
      if (response.status >= 400) {
        throw new Error("".concat(scriptUrl, " load failed with status ").concat(response.status));
      }
      return response.text();
    })["catch"](function (e) {
      try {
        if (e.message.indexOf(scriptUrl) === -1) {
          e.message = "".concat(scriptUrl, " ").concat(e.message);
        }
      } catch (_) {
        // e.message 可能是 readonly，此时会触发异常
      }
      throw e;
    }));
  };

  // entry js 下载失败应该直接 break
  var shouldBreakWhileError = function shouldBreakWhileError(i) {
    return scripts[i] === entry;
  };
  return (0, _allSettledButCanBreak.allSettledButCanBreak)(scripts.map( /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(script) {
      var src, async, crossOrigin, fetchOpts;
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            if (!(typeof script === 'string')) {
              _context2.next = 8;
              break;
            }
            if (!isInlineCode(script)) {
              _context2.next = 5;
              break;
            }
            return _context2.abrupt("return", (0, _utils.getInlineCode)(script));
          case 5:
            return _context2.abrupt("return", fetchScript(script));
          case 6:
            _context2.next = 13;
            break;
          case 8:
            // use idle time to load async script
            src = script.src, async = script.async, crossOrigin = script.crossOrigin;
            fetchOpts = crossOrigin ? {
              credentials: 'include'
            } : {};
            if (!async) {
              _context2.next = 12;
              break;
            }
            return _context2.abrupt("return", {
              src: src,
              async: true,
              content: new Promise(function (resolve, reject) {
                return (0, _utils.requestIdleCallback)(function () {
                  return fetchScript(src, fetchOpts).then(resolve, reject);
                });
              })
            });
          case 12:
            return _context2.abrupt("return", fetchScript(src, fetchOpts));
          case 13:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }()), shouldBreakWhileError).then(function (results) {
    return results.map(function (result, i) {
      if (result.status === 'fulfilled') {
        result.value = {
          src: scripts[i],
          value: result.value
        };
      }
      return result;
    }).filter(function (result) {
      // 忽略失败的请求，避免异常下载阻塞后续资源加载
      if (result.status === 'rejected') {
        Promise.reject(result.reason);
      }
      return result.status === 'fulfilled';
    }).map(function (result) {
      return result.value;
    });
  });
}
function throwNonBlockingError(error, msg) {
  setTimeout(function () {
    console.error(msg);
    throw error;
  });
}
var supportsUserTiming = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.clearMarks === 'function' && typeof performance.measure === 'function' && typeof performance.clearMeasures === 'function';

/**
 * FIXME to consistent with browser behavior, we should only provide callback way to invoke success and error event
 * @param entry
 * @param scripts
 * @param proxy
 * @param opts
 * @returns {Promise<unknown>}
 */
function _execScripts(entry, scripts) {
  var proxy = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window;
  var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _opts$fetch2 = opts.fetch,
    fetch = _opts$fetch2 === void 0 ? defaultFetch : _opts$fetch2,
    _opts$strictGlobal = opts.strictGlobal,
    strictGlobal = _opts$strictGlobal === void 0 ? false : _opts$strictGlobal,
    success = opts.success,
    _opts$error = opts.error,
    error = _opts$error === void 0 ? function () {} : _opts$error,
    _opts$beforeExec = opts.beforeExec,
    beforeExec = _opts$beforeExec === void 0 ? function () {} : _opts$beforeExec,
    _opts$afterExec = opts.afterExec,
    afterExec = _opts$afterExec === void 0 ? function () {} : _opts$afterExec,
    _opts$scopedGlobalVar2 = opts.scopedGlobalVariables,
    scopedGlobalVariables = _opts$scopedGlobalVar2 === void 0 ? [] : _opts$scopedGlobalVar2;
  return _getExternalScripts(scripts, fetch, entry).then(function (scriptsText) {
    var geval = function geval(scriptSrc, inlineScript) {
      var rawCode = beforeExec(inlineScript, scriptSrc) || inlineScript;
      var code = getExecutableScript(scriptSrc, rawCode, {
        proxy: proxy,
        strictGlobal: strictGlobal,
        scopedGlobalVariables: scopedGlobalVariables
      });
      (0, _utils.evalCode)(scriptSrc, code);
      afterExec(inlineScript, scriptSrc);
    };
    function exec(scriptSrc, inlineScript, resolve) {
      var markName = "Evaluating script ".concat(scriptSrc);
      var measureName = "Evaluating Time Consuming: ".concat(scriptSrc);
      if (process.env.NODE_ENV === 'development' && supportsUserTiming) {
        performance.mark(markName);
      }
      if (scriptSrc === entry) {
        (0, _utils.noteGlobalProps)(strictGlobal ? proxy : window);
        try {
          geval(scriptSrc, inlineScript);
          var exports = proxy[(0, _utils.getGlobalProp)(strictGlobal ? proxy : window)] || {};
          resolve(exports);
        } catch (e) {
          // entry error must be thrown to make the promise settled
          console.error("[import-html-entry]: error occurs while executing entry script ".concat(scriptSrc));
          throw e;
        }
      } else {
        if (typeof inlineScript === 'string') {
          try {
            if (scriptSrc !== null && scriptSrc !== void 0 && scriptSrc.src) {
              geval(scriptSrc.src, inlineScript);
            } else {
              geval(scriptSrc, inlineScript);
            }
          } catch (e) {
            // consistent with browser behavior, any independent script evaluation error should not block the others
            throwNonBlockingError(e, "[import-html-entry]: error occurs while executing normal script ".concat(scriptSrc));
          }
        } else {
          // external script marked with async
          inlineScript.async && (inlineScript === null || inlineScript === void 0 ? void 0 : inlineScript.content.then(function (downloadedScriptText) {
            return geval(inlineScript.src, downloadedScriptText);
          })["catch"](function (e) {
            throwNonBlockingError(e, "[import-html-entry]: error occurs while executing async script ".concat(inlineScript.src));
          }));
        }
      }
      if (process.env.NODE_ENV === 'development' && supportsUserTiming) {
        performance.measure(measureName, markName);
        performance.clearMarks(markName);
        performance.clearMeasures(measureName);
      }
    }
    function schedule(i, resolvePromise) {
      if (i < scriptsText.length) {
        var script = scriptsText[i];
        var scriptSrc = script.src;
        var inlineScript = script.value;
        exec(scriptSrc, inlineScript, resolvePromise);
        // resolve the promise while the last script executed and entry not provided
        if (!entry && i === scriptsText.length - 1) {
          resolvePromise();
        } else {
          schedule(i + 1, resolvePromise);
        }
      }
    }
    return new Promise(function (resolve) {
      return schedule(0, success || resolve);
    });
  })["catch"](function (e) {
    error();
    throw e;
  });
}
function importHTML(url) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var fetch = defaultFetch;
  var autoDecodeResponse = false;
  var getPublicPath = _utils.defaultGetPublicPath;
  var getTemplate = defaultGetTemplate;
  var postProcessTemplate = opts.postProcessTemplate;

  // compatible with the legacy importHTML api
  if (typeof opts === 'function') {
    fetch = opts;
  } else {
    // fetch option is availble
    if (opts.fetch) {
      // fetch is a funciton
      if (typeof opts.fetch === 'function') {
        fetch = opts.fetch;
      } else {
        // configuration
        fetch = opts.fetch.fn || defaultFetch;
        autoDecodeResponse = !!opts.fetch.autoDecodeResponse;
      }
    }
    getPublicPath = opts.getPublicPath || opts.getDomain || _utils.defaultGetPublicPath;
    getTemplate = opts.getTemplate || defaultGetTemplate;
  }
  return embedHTMLCache[url] || (embedHTMLCache[url] = fetch(url).then(function (response) {
    return (0, _utils.readResAsString)(response, autoDecodeResponse);
  }).then(function (html) {
    var assetPublicPath = getPublicPath(url);
    var _processTpl = (0, _processTpl2["default"])(getTemplate(html), assetPublicPath, postProcessTemplate),
      template = _processTpl.template,
      scripts = _processTpl.scripts,
      entry = _processTpl.entry,
      styles = _processTpl.styles;
    return getEmbedHTML(template, styles, {
      fetch: fetch
    }).then(function (embedHTML) {
      return {
        template: embedHTML,
        assetPublicPath: assetPublicPath,
        getExternalScripts: function getExternalScripts() {
          return _getExternalScripts(scripts, fetch);
        },
        getExternalStyleSheets: function getExternalStyleSheets() {
          return _getExternalStyleSheets(styles, fetch);
        },
        execScripts: function execScripts(proxy, strictGlobal) {
          var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
          if (!scripts.length) {
            return Promise.resolve();
          }
          return _execScripts(entry, scripts, proxy, _objectSpread({
            fetch: fetch,
            strictGlobal: strictGlobal
          }, opts));
        }
      };
    });
  }));
}
function importEntry(entry) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _opts$fetch3 = opts.fetch,
    fetch = _opts$fetch3 === void 0 ? defaultFetch : _opts$fetch3,
    _opts$getTemplate = opts.getTemplate,
    getTemplate = _opts$getTemplate === void 0 ? defaultGetTemplate : _opts$getTemplate,
    postProcessTemplate = opts.postProcessTemplate;
  var getPublicPath = opts.getPublicPath || opts.getDomain || _utils.defaultGetPublicPath;
  if (!entry) {
    throw new SyntaxError('entry should not be empty!');
  }

  // html entry
  if (typeof entry === 'string') {
    return importHTML(entry, {
      fetch: fetch,
      getPublicPath: getPublicPath,
      getTemplate: getTemplate,
      postProcessTemplate: postProcessTemplate
    });
  }

  // config entry
  if (Array.isArray(entry.scripts) || Array.isArray(entry.styles)) {
    var _entry$scripts = entry.scripts,
      scripts = _entry$scripts === void 0 ? [] : _entry$scripts,
      _entry$styles = entry.styles,
      styles = _entry$styles === void 0 ? [] : _entry$styles,
      _entry$html = entry.html,
      html = _entry$html === void 0 ? '' : _entry$html;
    var getHTMLWithStylePlaceholder = function getHTMLWithStylePlaceholder(tpl) {
      return styles.reduceRight(function (html, styleSrc) {
        return "".concat((0, _processTpl2.genLinkReplaceSymbol)(styleSrc)).concat(html);
      }, tpl);
    };
    var getHTMLWithScriptPlaceholder = function getHTMLWithScriptPlaceholder(tpl) {
      return scripts.reduce(function (html, scriptSrc) {
        return "".concat(html).concat((0, _processTpl2.genScriptReplaceSymbol)(scriptSrc));
      }, tpl);
    };
    return getEmbedHTML(getTemplate(getHTMLWithScriptPlaceholder(getHTMLWithStylePlaceholder(html))), styles, {
      fetch: fetch
    }).then(function (embedHTML) {
      return {
        template: embedHTML,
        assetPublicPath: getPublicPath(entry),
        getExternalScripts: function getExternalScripts() {
          return _getExternalScripts(scripts, fetch);
        },
        getExternalStyleSheets: function getExternalStyleSheets() {
          return _getExternalStyleSheets(styles, fetch);
        },
        execScripts: function execScripts(proxy, strictGlobal) {
          var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
          if (!scripts.length) {
            return Promise.resolve();
          }
          return _execScripts(scripts[scripts.length - 1], scripts, proxy, _objectSpread({
            fetch: fetch,
            strictGlobal: strictGlobal
          }, opts));
        }
      };
    });
  } else {
    throw new SyntaxError('entry scripts or styles should be array!');
  }
}