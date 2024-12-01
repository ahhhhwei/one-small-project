const sharedElements = {};

/**
 * Memorize a JSXElement.
 */
export default function createJSXMemo(el, uid) {
  return sharedElements.hasOwnProperty(uid)
    ? sharedElements[uid]
    : sharedElements[uid] = typeof el === 'function' ? el() : el;
}
