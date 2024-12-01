/**
 * Slot replacer implementation.
 */
export default function (props) {
  const { $slots, name, ...others } = props;
  const getEl = $slots ? $slots[name] : null;
  return typeof getEl === 'function' ? getEl(others) : null;
}
