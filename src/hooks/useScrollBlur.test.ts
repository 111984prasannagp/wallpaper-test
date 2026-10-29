import test from 'node:test';
import assert from 'node:assert';
import { calculateScrollBlur } from './useScrollBlur';

test('calculateScrollBlur returns 0 for stationary or microscopic scroll velocities', () => {
  assert.strictEqual(calculateScrollBlur(0), 0);
  assert.strictEqual(calculateScrollBlur(1.0), 0);
  assert.strictEqual(calculateScrollBlur(-1.2), 0);
});

test('calculateScrollBlur scales smoothly with velocity up to maxBlur clamp', () => {
  const blurSmall = calculateScrollBlur(12, 3.5);
  const blurMedium = calculateScrollBlur(35, 3.5);
  const blurFast = calculateScrollBlur(70, 3.5);
  const blurHyper = calculateScrollBlur(200, 3.5);

  assert.ok(blurSmall > 0, 'Small velocity should produce blur > 0');
  assert.ok(blurMedium > blurSmall, 'Medium velocity blur should exceed small blur');
  assert.ok(blurFast > blurMedium, 'Fast velocity blur should exceed medium blur');
  assert.strictEqual(blurHyper, 3.5, 'Hyper velocity must clamp to maxBlur');
});

test('calculateScrollBlur handles symmetric upward and downward velocities identically', () => {
  const blurDown = calculateScrollBlur(40, 4.0);
  const blurUp = calculateScrollBlur(-40, 4.0);

  assert.strictEqual(blurDown, blurUp, 'Scroll blur must be directionally symmetric');
});
