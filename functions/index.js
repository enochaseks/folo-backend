"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
require('dotenv').config();
var functions = require('firebase-functions');
var admin = require('firebase-admin');
var _require = require('openai'),
  OpenAI = _require.OpenAI;

// Initialize Firebase Admin
admin.initializeApp();

// Initialize OpenAI with API key from environment variables
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || functions.config().openai.key
});

// Business Intelligence
exports.analyzeBusinessSetup = functions.https.onCall(/*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(data, context) {
    var businessName, category, location, targetMarket;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          businessName = data.businessName, category = data.category, location = data.location, targetMarket = data.targetMarket; // Basic validation and recommendations
          return _context.abrupt("return", {
            success: true,
            recommendations: {
              nameValidation: validateBusinessName(businessName),
              categorySuggestions: suggestCategories(category),
              locationOptimization: optimizeLocation(location),
              marketAnalysis: analyzeMarket(targetMarket)
            }
          });
        case 5:
          _context.prev = 5;
          _context.t0 = _context["catch"](0);
          console.error('Business analysis error:', _context.t0);
          throw new functions.https.HttpsError('internal', _context.t0.message);
        case 9:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 5]]);
  }));
  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

// Service Management
exports.manageService = functions.https.onCall(/*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(data, context) {
    var services, location, userPreferences;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          services = data.services, location = data.location, userPreferences = data.userPreferences;
          return _context2.abrupt("return", {
            success: true,
            recommendations: optimizeServices(services, location, userPreferences),
            quality: predictServiceQuality(services),
            optimization: optimizeServiceDelivery(services)
          });
        case 5:
          _context2.prev = 5;
          _context2.t0 = _context2["catch"](0);
          console.error('Service management error:', _context2.t0);
          throw new functions.https.HttpsError('internal', _context2.t0.message);
        case 9:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 5]]);
  }));
  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

// Smart Search
exports.smartSearch = functions.https.onCall(/*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(data, context) {
    var query, filters, embedding, servicesRef, servicesQuery, services, searchResults;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          query = data.query, filters = data.filters; // Use OpenAI for semantic search
          _context3.next = 4;
          return openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: query
          });
        case 4:
          embedding = _context3.sent;
          // Get services from Firestore
          servicesRef = admin.firestore().collection('services');
          servicesQuery = servicesRef; // Apply filters
          if (filters) {
            if (filters.category) {
              servicesQuery = servicesQuery.where('category', '==', filters.category);
            }
            if (filters.maxPrice) {
              servicesQuery = servicesQuery.where('price', '<=', filters.maxPrice);
            }
          }
          _context3.next = 10;
          return servicesQuery.get();
        case 10:
          services = _context3.sent;
          searchResults = []; // Calculate similarity and rank results
          services.forEach(function (doc) {
            var service = doc.data();
            var similarity = calculateCosineSimilarity(embedding.data[0].embedding, service.embedding || []);
            if (similarity > 0.7) {
              // Threshold for relevance
              searchResults.push(_objectSpread(_objectSpread({}, service), {}, {
                score: similarity
              }));
            }
          });

          // Sort by relevance
          searchResults.sort(function (a, b) {
            return b.score - a.score;
          });
          return _context3.abrupt("return", {
            success: true,
            results: searchResults
          });
        case 17:
          _context3.prev = 17;
          _context3.t0 = _context3["catch"](0);
          console.error('Smart search error:', _context3.t0);
          throw new functions.https.HttpsError('internal', _context3.t0.message);
        case 21:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 17]]);
  }));
  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

// Customer Support
exports.handleCustomerSupport = functions.https.onCall(/*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(data, context) {
    var _context$auth, message, supportContext, _data$history, history, userId, userContext, _userData$recentServi, userDoc, userData, response, sentiment;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          message = data.message, supportContext = data.supportContext, _data$history = data.history, history = _data$history === void 0 ? [] : _data$history; // Get user data for context
          userId = (_context$auth = context.auth) === null || _context$auth === void 0 ? void 0 : _context$auth.uid;
          userContext = '';
          if (!userId) {
            _context4.next = 10;
            break;
          }
          _context4.next = 7;
          return admin.firestore().collection('users').doc(userId).get();
        case 7:
          userDoc = _context4.sent;
          userData = userDoc.data();
          userContext = "User Info: ".concat(userData.name, ", Account Type: ").concat(userData.accountType, ", \n        Recent Services: ").concat((_userData$recentServi = userData.recentServices) === null || _userData$recentServi === void 0 ? void 0 : _userData$recentServi.join(', '));
        case 10:
          _context4.next = 12;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "You are a helpful customer support assistant for Folo App. \n            Context about the user: ".concat(userContext, "\n            Support Context: ").concat(supportContext || 'General inquiry')
            }].concat(_toConsumableArray(history.map(function (msg) {
              return {
                role: msg.role,
                content: msg.content
              };
            })), [{
              role: "user",
              content: message
            }]),
            temperature: 0.7,
            max_tokens: 500
          });
        case 12:
          response = _context4.sent;
          _context4.next = 15;
          return analyzeSentiment(message);
        case 15:
          sentiment = _context4.sent;
          if (!userId) {
            _context4.next = 19;
            break;
          }
          _context4.next = 19;
          return admin.firestore().collection('support_conversations').add({
            userId: userId,
            message: message,
            response: response.choices[0].message.content,
            sentiment: sentiment,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        case 19:
          return _context4.abrupt("return", {
            success: true,
            response: response.choices[0].message.content,
            sentiment: sentiment
          });
        case 22:
          _context4.prev = 22;
          _context4.t0 = _context4["catch"](0);
          console.error('Customer support error:', _context4.t0);
          throw new functions.https.HttpsError('internal', _context4.t0.message);
        case 26:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 22]]);
  }));
  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());

// Marketing Analytics
exports.analyzeMarketing = functions.https.onCall(/*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(data, context) {
    var campaignData, userData, metrics, response;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          campaignData = data.campaignData, userData = data.userData, metrics = data.metrics; // Use OpenAI for marketing analysis
          _context5.next = 4;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "You are a marketing analytics assistant. Analyze the campaign data and provide insights."
            }, {
              role: "user",
              content: "Campaign Data: ".concat(JSON.stringify(campaignData), ", User Data: ").concat(JSON.stringify(userData), ", Metrics: ").concat(JSON.stringify(metrics))
            }],
            temperature: 0.3
          });
        case 4:
          response = _context5.sent;
          _context5.t0 = response.choices[0].message.content;
          _context5.next = 8;
          return predictCampaignPerformance(campaignData);
        case 8:
          _context5.t1 = _context5.sent;
          _context5.t2 = [];
          return _context5.abrupt("return", {
            success: true,
            analysis: _context5.t0,
            predictions: _context5.t1,
            recommendations: _context5.t2
          });
        case 13:
          _context5.prev = 13;
          _context5.t3 = _context5["catch"](0);
          console.error('Marketing analysis error:', _context5.t3);
          throw new functions.https.HttpsError('internal', _context5.t3.message);
        case 17:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 13]]);
  }));
  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());

// Security Analysis
exports.analyzeSecurity = functions.https.onCall(/*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(data, context) {
    var activity, patterns, securityContext, response, analysis;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          activity = data.activity, patterns = data.patterns, securityContext = data.context; // Use OpenAI for security analysis
          _context6.next = 4;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "You are a security analysis assistant. Analyze the activity patterns and identify potential threats."
            }, {
              role: "user",
              content: "Activity: ".concat(JSON.stringify(activity), ", Patterns: ").concat(JSON.stringify(patterns), ", Context: ").concat(securityContext)
            }],
            temperature: 0.2
          });
        case 4:
          response = _context6.sent;
          analysis = response.choices[0].message.content;
          return _context6.abrupt("return", {
            success: true,
            threats: [],
            recommendations: [],
            analysis: analysis
          });
        case 9:
          _context6.prev = 9;
          _context6.t0 = _context6["catch"](0);
          console.error('Security analysis error:', _context6.t0);
          throw new functions.https.HttpsError('internal', _context6.t0.message);
        case 13:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 9]]);
  }));
  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());

// Content Management
exports.manageContent = functions.https.onCall(/*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(data, context) {
    var content, type, contentContext, analysis;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          content = data.content, type = data.type, contentContext = data.context; // Use OpenAI for content management
          _context7.next = 4;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "Analyze and optimize content."
            }, {
              role: "user",
              content: "Content: ".concat(content, ", Type: ").concat(type, ", Context: ").concat(contentContext)
            }]
          });
        case 4:
          analysis = _context7.sent;
          _context7.t0 = analysis.choices[0].message.content;
          _context7.next = 8;
          return optimizeContent(content, type);
        case 8:
          _context7.t1 = _context7.sent;
          _context7.next = 11;
          return generateContentSuggestions(content, type);
        case 11:
          _context7.t2 = _context7.sent;
          return _context7.abrupt("return", {
            success: true,
            analysis: _context7.t0,
            optimization: _context7.t1,
            suggestions: _context7.t2
          });
        case 15:
          _context7.prev = 15;
          _context7.t3 = _context7["catch"](0);
          console.error('Content management error:', _context7.t3);
          throw new functions.https.HttpsError('internal', _context7.t3.message);
        case 19:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 15]]);
  }));
  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());

// Analytics and Reporting
exports.generateAnalytics = functions.https.onCall(/*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(data, context) {
    var analyticsData, metrics, timeframe, response;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          analyticsData = data.data, metrics = data.metrics, timeframe = data.timeframe; // Use OpenAI for analytics
          _context8.next = 4;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "You are an analytics assistant. Generate insights from the provided data."
            }, {
              role: "user",
              content: "Data: ".concat(JSON.stringify(analyticsData), ", Metrics: ").concat(JSON.stringify(metrics), ", Timeframe: ").concat(timeframe)
            }],
            temperature: 0.3
          });
        case 4:
          response = _context8.sent;
          return _context8.abrupt("return", {
            success: true,
            analysis: response.choices[0].message.content,
            predictions: [],
            insights: []
          });
        case 8:
          _context8.prev = 8;
          _context8.t0 = _context8["catch"](0);
          console.error('Analytics generation error:', _context8.t0);
          throw new functions.https.HttpsError('internal', _context8.t0.message);
        case 12:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 8]]);
  }));
  return function (_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}());

// Helper functions
function validateBusinessName(name) {
  return {
    isValid: name.length > 0,
    suggestions: []
  };
}
function suggestCategories(category) {
  return {
    current: category,
    alternatives: []
  };
}
function optimizeLocation(location) {
  return {
    current: location,
    suggestions: []
  };
}
function analyzeMarket(targetMarket) {
  return {
    analysis: "Basic market analysis",
    recommendations: []
  };
}
function optimizeServices(services, location, preferences) {
  return {
    current: services,
    suggestions: []
  };
}
function predictServiceQuality(services) {
  return {
    score: 0.8,
    factors: []
  };
}
function optimizeServiceDelivery(services) {
  return {
    current: services,
    optimizations: []
  };
}
function calculateCosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;
  var dotProduct = vec1.reduce(function (acc, val, i) {
    return acc + val * vec2[i];
  }, 0);
  var mag1 = Math.sqrt(vec1.reduce(function (acc, val) {
    return acc + val * val;
  }, 0));
  var mag2 = Math.sqrt(vec2.reduce(function (acc, val) {
    return acc + val * val;
  }, 0));
  return dotProduct / (mag1 * mag2);
}
function analyzeSentiment(_x17) {
  return _analyzeSentiment.apply(this, arguments);
}
function _analyzeSentiment() {
  _analyzeSentiment = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(text) {
    var response;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "Analyze the sentiment of the following text and return ONLY one word: positive, negative, or neutral."
            }, {
              role: "user",
              content: text
            }],
            temperature: 0,
            max_tokens: 10
          });
        case 2:
          response = _context9.sent;
          return _context9.abrupt("return", response.choices[0].message.content.toLowerCase().trim());
        case 4:
        case "end":
          return _context9.stop();
      }
    }, _callee9);
  }));
  return _analyzeSentiment.apply(this, arguments);
}
function predictCampaignPerformance(_x18) {
  return _predictCampaignPerformance.apply(this, arguments);
}
function _predictCampaignPerformance() {
  _predictCampaignPerformance = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(campaignData) {
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          return _context10.abrupt("return", {
            performance: "Good",
            projectedROI: 1.5,
            suggestedImprovements: []
          });
        case 1:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return _predictCampaignPerformance.apply(this, arguments);
}
function optimizeContent(_x19, _x20) {
  return _optimizeContent.apply(this, arguments);
}
function _optimizeContent() {
  _optimizeContent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(content, type) {
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
        case "end":
          return _context11.stop();
      }
    }, _callee11);
  }));
  return _optimizeContent.apply(this, arguments);
}
function generateContentSuggestions(_x21, _x22) {
  return _generateContentSuggestions.apply(this, arguments);
}
function _generateContentSuggestions() {
  _generateContentSuggestions = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(content, type) {
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
        case "end":
          return _context12.stop();
      }
    }, _callee12);
  }));
  return _generateContentSuggestions.apply(this, arguments);
}