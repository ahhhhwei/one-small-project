"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.depsEqual = void 0;
var _reactFastCompare = _interopRequireDefault(require("react-fast-compare"));
var depsEqual = function depsEqual(aDeps, bDeps) {
  if (aDeps === void 0) {
    aDeps = [];
  }
  if (bDeps === void 0) {
    bDeps = [];
  }
  return (0, _reactFastCompare["default"])(aDeps, bDeps);
};
exports.depsEqual = depsEqual;