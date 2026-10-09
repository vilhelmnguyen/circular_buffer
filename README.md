# CircularBuffer

A small, dependency-free ring buffer for JavaScript (ESM). Fixed capacity; writing past capacity drops the oldest item.

## Usage

```js
import { CircularBuffer } from './src/index.js';

const buf = new CircularBuffer(3);
buf.write('a');
buf.write('b');
buf.write('c');
buf.write('d'); // 'a' is dropped, contents are now ['b','c','d']

buf.read();   // 'b'
buf.peek();   // 'c' (does not remove)
buf.toArray(); // ['c','d']
buf.clear();   // empties the buffer, capacity unchanged
```

## Exports

- `CircularBuffer` — the class, from `src/index.js`.

### Methods and accessors

- `new CircularBuffer(capacity)` — `capacity` must be a positive integer; throws `RangeError` otherwise.
- `buf.capacity` — fixed size set at construction.
- `buf.size` — current number of items.
- `buf.isFull` / `buf.isEmpty` — booleans.
- `buf.write(item)` — appends; if full, overwrites the oldest item. Returns the written item.
- `buf.read()` — removes and returns the oldest item; throws `RangeError` if empty.
- `buf.peek()` — returns the oldest item without removing it; throws `RangeError` if empty.
- `buf.clear()` — empties the buffer; capacity unchanged.
- `buf.toArray()` — returns a snapshot array, oldest first. Does not mutate the buffer.
- `for (const item of buf)` — iterates oldest first; non-mutating.

## Why

For streaming or bounded-queue workloads where you want the most recent N items and would rather silently drop history than block or allocate unbounded arrays. The trade-off: bounded memory, but data loss once full — by design.

## The awkward edge

`undefined` is a legitimate stored value, not a sentinel for "empty slot." If you need a sentinel to mean "no value," pick one your callers will never write (`null`, a Symbol, or a wrapper object) and check for it yourself. Slots freed by `read()` or `clear()` are set to `undefined` internally to avoid retaining references, which means you cannot distinguish an unset slot from a slot holding `undefined` — but you should never observe an unset slot through the public API anyway.
