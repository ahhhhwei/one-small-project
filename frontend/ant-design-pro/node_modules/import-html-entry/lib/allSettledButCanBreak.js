"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.allSettledButCanBreak = allSettledButCanBreak;
function allSettledButCanBreak(promises, shouldBreakWhileError) {
  return Promise.all(promises.map(function (promise, i) {
    return promise.then(function (value) {
      return {
        status: 'fulfilled',
        value: value
      };
    })["catch"](function (reason) {
      if (shouldBreakWhileError !== null && shouldBreakWhileError !== void 0 && shouldBreakWhileError(i)) {
        throw reason;
      }
      return {
        status: 'rejected',
        reason: reason
      };
    });
  }));
  ;
}