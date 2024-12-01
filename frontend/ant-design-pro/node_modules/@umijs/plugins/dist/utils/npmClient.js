var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/npmClient.ts
var npmClient_exports = {};
__export(npmClient_exports, {
  isFlattedNodeModulesDir: () => isFlattedNodeModulesDir
});
module.exports = __toCommonJS(npmClient_exports);
var import_plugin_utils = require("umi/plugin-utils");
var FLATTED_NPM_CLIENT = [
  import_plugin_utils.NpmClientEnum.npm,
  import_plugin_utils.NpmClientEnum.yarn
];
var isFlattedNodeModulesDir = (api) => {
  var _a;
  let currentNpmClient = api.appData.npmClient;
  const tnpmCompatMode = api.appData.npmClient === import_plugin_utils.NpmClientEnum.tnpm && ((_a = api.pkg.tnpm) == null ? void 0 : _a.mode);
  if (tnpmCompatMode) {
    if (FLATTED_NPM_CLIENT.includes(api.pkg.tnpm.mode)) {
      return true;
    }
  }
  const isFlattedDir = FLATTED_NPM_CLIENT.includes(currentNpmClient);
  return isFlattedDir;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isFlattedNodeModulesDir
});
