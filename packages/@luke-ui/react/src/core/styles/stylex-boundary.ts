/**
 * Comment the package build writes between the Vanilla Extract stylesheet and the StyleX rules
 * appended after it. Tests that assert the Vanilla Extract cascade-layer contract split on this,
 * because StyleX's unlayered output would otherwise read as a contract violation.
 *
 * Temporary: #536 brings StyleX under the layer contract and removes the need for a boundary.
 */
export const stylexBoundary = '/* stylex */';
