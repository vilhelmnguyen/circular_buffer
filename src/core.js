/**
 * CircularBuffer — a fixed-capacity ring buffer.
 *
 * When the buffer is at capacity, writing a new item drops the oldest item
 * and stores the new one at its slot. Reads via read() remove from the front
 * in FIFO order. toArray() gives a non-mutating snapshot of the current
 * contents, oldest first.
 *
 * Design note: We store one slot per capacity slot (no off-by-one sentinel),
 * because the brief says the buffer HOLDS capacity items. Tracking fullness
 * via an isFull flag avoids the classic "wasted slot" trade-off while keeping
 * write/read O(1). An alternative is to let head==tail mean "empty or full"
 * and waste one slot; we avoid that so callers get exactly `capacity` items
 * before eviction begins.
 */
export class CircularBuffer {
  #capacity;
  #buf;
  #head; // index of the oldest item (next to read)
  #tail; // index where the next write lands
  #count;

  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('capacity must be a positive integer');
    }
    this.#capacity = capacity;
    this.#buf = new Array(capacity);
    this.#head = 0;
    this.#tail = 0;
    this.#count = 0;
  }

  get capacity() {
    return this.#capacity;
  }

  get size() {
    return this.#count;
  }

  get isFull() {
    return this.#count === this.#capacity;
  }

  get isEmpty() {
    return this.#count === 0;
  }

  write(item) {
    if (this.#count === this.#capacity) {
      // At capacity: the tail slot currently holds the newest item. Overwrite
      // the oldest by advancing head into the oldest slot, then write there.
      // Concretely: drop the oldest (advance head), then write at the freed slot.
      // After advancing head, head points at the slot that was oldest; we write
      // the new item there, and tail follows because the buffer stays full.
      this.#buf[this.#tail] = item;
      this.#tail = (this.#tail + 1) % this.#capacity;
      this.#head = this.#tail; // head follows: oldest is now what tail points at
      return item;
    }
    this.#buf[this.#tail] = item;
    this.#tail = (this.#tail + 1) % this.#capacity;
    this.#count += 1;
    return item;
  }

  read() {
    if (this.#count === 0) {
      throw new RangeError('buffer is empty');
    }
    const item = this.#buf[this.#head];
    // Allow GC of the slot; important if items are large or hold resources.
    this.#buf[this.#head] = undefined;
    this.#head = (this.#head + 1) % this.#capacity;
    this.#count -= 1;
    return item;
  }

  peek() {
    if (this.#count === 0) {
      throw new RangeError('buffer is empty');
    }
    return this.#buf[this.#head];
  }

  clear() {
    for (let i = 0; i < this.#capacity; i++) {
      this.#buf[i] = undefined;
    }
    this.#head = 0;
    this.#tail = 0;
    this.#count = 0;
  }

  toArray() {
    const out = new Array(this.#count);
    for (let i = 0; i < this.#count; i++) {
      out[i] = this.#buf[(this.#head + i) % this.#capacity];
    }
    return out;
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.#count; i++) {
      yield this.#buf[(this.#head + i) % this.#capacity];
    }
  }
}
