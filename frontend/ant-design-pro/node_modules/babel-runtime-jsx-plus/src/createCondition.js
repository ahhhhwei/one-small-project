/**
 * Create condition helper.
 * Structure:
 *   <div1 x-if={a} />
 *   <div2 x-elseif={b} />
 *   <div3 x-else />
 *   =>
 *   [
 *     [
 *       () => a,
 *       () => <div1 />
 *     ],
 *     [
 *       () => b,
 *       () => <div1 />
 *     ],
 *     [
 *       () => true,
 *       () => <div1 />
 *     ]
 *   ]
 * @param conditions
 * @return {null}
 */
export default function createCondition(conditions) {
  if (Array.isArray(conditions)) {
    for (let i = 0, l = conditions.length; i < l; i++) {
      const [getCondition, getRender] = conditions[i];
      if (getCondition()) return getRender();
    }
  }
  return null;
}
