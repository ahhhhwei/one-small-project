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

// src/react-query.ts
var react_query_exports = {};
__export(react_query_exports, {
  default: () => react_query_default
});
module.exports = __toCommonJS(react_query_exports);
var import_utils = require("@umijs/utils");
var import_path = require("path");
var import_npmClient = require("./utils/npmClient");
var import_resolveProjectDep = require("./utils/resolveProjectDep");
var import_withTmpPath = require("./utils/withTmpPath");
var reactQueryInfo;
var REACT_QUERY_DEP_NAME = "@tanstack/react-query";
var REACT_QUERY_DEVTOOLS_DEP_NAME = "@tanstack/react-query-devtools";
var REACT_QUERY_CORE_DEP_NAME = "@tanstack/query-core";
var getReactQueryPkgInfo = (api) => {
  if (reactQueryInfo) {
    return reactQueryInfo;
  }
  let pkgPath;
  let devtoolsPkgPath;
  let corePath;
  const defaultPkgPath = (0, import_utils.winPath)(
    (0, import_path.dirname)(require.resolve(`${REACT_QUERY_DEP_NAME}/package.json`))
  );
  const defaultDevtoolPkgPath = (0, import_utils.winPath)(
    (0, import_path.dirname)(require.resolve(`${REACT_QUERY_DEVTOOLS_DEP_NAME}/package.json`))
  );
  try {
    const localQueryPath = (0, import_resolveProjectDep.resolveProjectDep)({
      pkg: api.pkg,
      cwd: api.cwd,
      dep: REACT_QUERY_DEP_NAME
    });
    pkgPath = localQueryPath ? (0, import_utils.winPath)(localQueryPath) : defaultPkgPath;
  } catch (e) {
    throw new Error(
      `[reactQuery] package '${REACT_QUERY_DEP_NAME}' resolve failed, ${e.message}`
    );
  }
  try {
    corePath = (0, import_utils.winPath)(
      (0, import_path.dirname)(
        require.resolve(`${REACT_QUERY_CORE_DEP_NAME}/package.json`, {
          paths: [pkgPath]
        })
      )
    );
  } catch {
  }
  try {
    const localDevtoolsPkgPath = (0, import_resolveProjectDep.resolveProjectDep)({
      pkg: api.pkg,
      cwd: api.cwd,
      dep: REACT_QUERY_DEVTOOLS_DEP_NAME
    });
    devtoolsPkgPath = localDevtoolsPkgPath ? (0, import_utils.winPath)(localDevtoolsPkgPath) : defaultDevtoolPkgPath;
  } catch (e) {
    throw new Error(
      `[reactQuery] package '${REACT_QUERY_DEVTOOLS_DEP_NAME}' resolve failed, ${e.message}`
    );
  }
  const pkg = require((0, import_path.join)(pkgPath, "package.json"));
  const devtoolsPkg = require((0, import_path.join)(devtoolsPkgPath, "package.json"));
  const pkgVersion = pkg.version;
  const devtoolsVersion = devtoolsPkg.version;
  const useV4 = pkgVersion.startsWith("4");
  const useV4Devtools = devtoolsVersion.startsWith("4");
  const useV5 = pkgVersion.startsWith("5");
  const useV5Devtools = devtoolsVersion.startsWith("5");
  const canUseDevtools = useV4 && useV4Devtools || useV5 && useV5Devtools;
  reactQueryInfo = {
    pkgPath,
    devtoolsPkgPath,
    defaultPkgPath,
    defaultDevtoolPkgPath,
    pkgVersion,
    canUseDevtools,
    useV4,
    useV5,
    corePath
  };
  return reactQueryInfo;
};
var react_query_default = (api) => {
  api.describe({
    key: "reactQuery",
    config: {
      schema({ zod }) {
        return zod.object({
          devtool: zod.union([zod.record(zod.any()), zod.boolean()]),
          queryClient: zod.union([zod.record(zod.any()), zod.boolean()])
        }).deepPartial();
      }
    },
    enableBy: api.EnableBy.config
  });
  api.onStart(() => {
    getReactQueryPkgInfo(api);
    const { pkgPath, defaultPkgPath, pkgVersion } = reactQueryInfo;
    if (pkgPath !== defaultPkgPath && !process.env.IS_UMI_BUILD_WORKER) {
      api.logger.info(`[reactQuery] use local package, version: ${pkgVersion}`);
    }
  });
  api.addRuntimePlugin(() => {
    return [(0, import_withTmpPath.withTmpPath)({ api, path: "runtime.tsx" })];
  });
  api.addRuntimePluginKey(() => {
    return ["reactQuery"];
  });
  api.modifyConfig((memo) => {
    const { pkgPath, devtoolsPkgPath, canUseDevtools } = getReactQueryPkgInfo(api);
    memo.alias[REACT_QUERY_DEP_NAME] = pkgPath;
    if (canUseDevtools) {
      memo.alias[REACT_QUERY_DEVTOOLS_DEP_NAME] = devtoolsPkgPath;
    }
    return memo;
  });
  api.onGenerateFiles(() => {
    var _a;
    const { pkgPath, devtoolsPkgPath, canUseDevtools, useV4, useV5 } = getReactQueryPkgInfo(api);
    const enableDevTools = api.config.reactQuery.devtool !== false && canUseDevtools;
    const enableQueryClient = api.config.reactQuery.queryClient !== false;
    const reactQueryRuntimeCode = ((_a = api.appData.appJS) == null ? void 0 : _a.exports.includes(
      "reactQuery"
    )) ? `import { reactQuery as reactQueryConfig } from '@/app';` : `const reactQueryConfig = {};`;
    api.writeTmpFile({
      path: "runtime.tsx",
      content: enableQueryClient ? `
import React from 'react';
import {
  ${useV4 ? "defaultContext," : ""}
  QueryClient,
  QueryClientProvider
} from '${pkgPath}';
${enableDevTools ? `import { ReactQueryDevtools } from '${devtoolsPkgPath}';` : ""}
${reactQueryRuntimeCode}
const client = new QueryClient(reactQueryConfig.queryClient || {});
export function rootContainer(container) {
  return (
    <QueryClientProvider
      client={client}
      ${useV4 ? "context={defaultContext}" : ""}
    >
      {container}
      ${enableDevTools ? `<ReactQueryDevtools
  ${useV4 ? "context={defaultContext}" : ""}
  initialIsOpen={false}
  {...(reactQueryConfig.devtool || {})}
/>` : ""}
    </QueryClientProvider>
  );
}
      ` : "export {}"
    });
    const exportMembers = [
      // from @tanstack/query-core
      "QueryClient",
      "QueryCache",
      "MutationCache",
      "QueryObserver",
      "InfiniteQueryObserver",
      "QueriesObserver",
      "MutationObserver",
      // from @tanstack/react-query
      "useQuery",
      "useQueries",
      "useInfiniteQuery",
      "useMutation",
      "useIsFetching",
      "useIsMutating",
      ...useV5 ? [
        "useMutationState",
        "useSuspenseQuery",
        "useSuspenseInfiniteQuery",
        "useSuspenseQueries",
        "queryOptions",
        "infiniteQueryOptions"
      ] : [],
      "QueryClientProvider",
      "useQueryClient",
      "QueryErrorResetBoundary",
      "useQueryErrorResetBoundary",
      "useIsRestoring",
      "IsRestoringProvider"
    ].filter(Boolean);
    api.writeTmpFile({
      path: "index.tsx",
      content: `
export {
  ${exportMembers.join(",\n  ")}
} from '${pkgPath}';
      `
    });
    const exportTypes = [
      // from @tanstack/query-core
      "Query",
      "QueryState",
      "Mutation",
      // from @tanstack/react-query
      "QueriesResults",
      "QueriesOptions",
      "QueryErrorResetBoundaryProps",
      "QueryClientProviderProps",
      useV4 && "ContextOptions as QueryContextOptions,",
      "UseQueryOptions",
      "UseBaseQueryOptions",
      "UseQueryResult",
      "UseBaseQueryResult",
      "UseInfiniteQueryOptions",
      "UseMutationResult",
      "UseMutateFunction",
      "UseMutateAsyncFunction",
      "UseBaseMutationResult"
    ].filter(Boolean);
    api.writeTmpFile({
      path: "types.d.ts",
      content: `
export type {
  ${exportTypes.join(",\n  ")}
} from '${pkgPath}';
      `
    });
    api.writeTmpFile({
      path: "types.d.ts",
      content: enableQueryClient ? `
import React from 'react';
import { QueryClientConfig } from '${pkgPath}';
${enableDevTools ? `
import { ReactQueryDevtools } from '${devtoolsPkgPath}';
` : ""}

export type RuntimeReactQueryType = {
  ${enableDevTools ? `
  devtool?: React.ComponentProps<typeof ReactQueryDevtools>
` : ""}
  queryClient?: QueryClientConfig
}` : "export type RuntimeReactQueryType = {}"
    });
  });
  const isFlattedDepsDir = (0, import_npmClient.isFlattedNodeModulesDir)(api);
  if (!isFlattedDepsDir) {
    api.modifyTSConfig((config) => {
      const { corePath, useV5 } = getReactQueryPkgInfo(api);
      if (useV5 && (corePath == null ? void 0 : corePath.length)) {
        import_utils.lodash.set(
          config,
          `compilerOptions.paths["${REACT_QUERY_CORE_DEP_NAME}"]`,
          [corePath]
        );
      }
      return config;
    });
  }
};
