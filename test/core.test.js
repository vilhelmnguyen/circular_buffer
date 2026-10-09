import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CircularBuffer } from '../src/index.js';

test('constructing with non-positive capacity throws', () => {
  assert.throws(() => new CircularBuffer(0), RangeError);
  assert.throws(() => new CircularBuffer(-1), RangeError);
});

test('non-integer capacity throws', () => {
  assert.throws(() => new CircularBuffer(3.5), RangeError);
});

test('fresh buffer reports capacity, size, empty, full', () => {
  const b = new CircularBuffer(3);
  assert.equal(b.capacity, 3);
  assert.equal(b.size, 0);
  assert.equal(b.isEmpty, true);
  assert.equal(b.isFull, false);
});

test('write then read yields FIFO order under capacity', () => {
  const b = new CircularBuffer(3);
  b.write('a');
  b.write('b');
  b.write('c');
  assert.equal(b.size, 3);
  assert.equal(b.isFull, true);
  assert.equal(b.read(), 'a');
  assert.equal(b.read(), 'b');
  assert.equal(b.read(), 'c');
  assert.equal(b.size, 0);
  assert.equal(b.isEmpty, true);
});

test('writing at capacity drops the oldest item', () => {
  const b = new CircularBuffer(3);
  b.write('a');
  b.write('b');
  b.write('c');
  b.write('d'); // should drop 'a'
  assert.equal(b.size, 3);
  assert.deepEqual(b.toArray(), ['b', 'c', 'd']);
  assert.equal(b.read(), 'b');
  assert.equal(b.read(), 'c');
  assert.equal(b.read(), 'd');
});

test('multiple overwrites wrap around correctly', () => {
  const b = new CircularBuffer(2);
  b.write(1); // [1]
  b.write(2); // [1,2]
  b.write(3); // drop 1 -> [2,3]
  b.write(4); // drop 2 -> [3,4]
  b.write(5); // drop 3 -> [4,5]
  assert.deepEqual(b.toArray(), [4, 5]);
});

test('read on empty buffer throws', () => {
  const b = new CircularBuffer(2);
  assert.throws(() => b.read(), RangeError);
});

test('peek returns front without removing', () => {
  const b = new CircularBuffer(2);
  b.write('x');
  b.write('y');
  assert.equal(b.peek(), 'x');
  assert.equal(b.size, 2);
  assert.equal(b.peek(), 'x');
});

test('peek on empty buffer throws', () => {
  const b = new CircularBuffer(2);
  assert.throws(() => b.peek(), RangeError);
});

test('clear resets buffer to empty and keeps capacity', () => {
  const b = new CircularBuffer(3);
  b.write('a');
  b.write('b');
  b.clear();
  assert.equal(b.size, 0);
  assert.equal(b.isEmpty, true);
  assert.equal(b.capacity, 3);
  // After clear, writes should behave like a fresh buffer.
  b.write('z');
  assert.equal(b.read(), 'z');
});

test('interleaved read and write stays ordered', () => {
  const b = new CircularBuffer(3);
  b.write('a');
  b.write('b');
  assert.equal(b.read(), 'a');
  b.write('c');
  b.write('d'); // full now: [b,c,d]
  assert.deepEqual(b.toArray(), ['b', 'c', 'd']);
  assert.equal(b.read(), 'b');
  assert.equal(b.read(), 'c');
  assert.equal(b.read(), 'd');
});

test('toArray does not mutate the buffer', () => {
  const b = new CircularBuffer(3);
  b.write(1);
  b.write(2);
  const snap = b.toArray();
  snap.push(999);
  assert.deepEqual(b.toArray(), [1, 2]);
});

test('iterator yields oldest-first and is non-mutating', () => {
  const b = new CircularBuffer(3);
  b.write(1);
  b.write(2);
  b.write(3);
  const collected = [];
  for (const v of b) collected.push(v);
  assert.deepEqual(collected, [1, 2, 3]);
  assert.equal(b.size, 3);
});

test('write returns the written item', () => {
  const b = new CircularBuffer(2);
  assert.equal(b.write('hi'), 'hi');
});

test('storing undefined explicitly is preserved until evicted', () => {
  // This documents that undefined is a legitimate value, not a sentinel.
  const b = new CircularBuffer(3);
  b.write(undefined);
  b.write('x');
  assert.equal(b.size, 2);
  assert.equal(b.read(), undefined);
  assert.equal(b.read(), 'x');
});
