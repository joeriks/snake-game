/**
 * Seeded Random Number Generator
 * Uses a simple LCG (Linear Congruential Generator)
 * Same seed = same sequence of random numbers
 */

export class SeededRandom {
    constructor(seed = 12345) {
        this.seed = seed;
        this.current = seed;
    }

    /**
     * Reset to initial seed
     */
    reset() {
        this.current = this.seed;
    }

    /**
     * Set a new seed
     */
    setSeed(seed) {
        this.seed = seed;
        this.current = seed;
    }

    /**
     * Generate next random number between 0 and 1
     */
    next() {
        // LCG parameters (same as MINSTD)
        const a = 48271;
        const m = 2147483647;
        this.current = (a * this.current) % m;
        return this.current / m;
    }

    /**
     * Random float between min and max
     */
    float(min = 0, max = 1) {
        return min + this.next() * (max - min);
    }

    /**
     * Random integer between min and max (inclusive)
     */
    int(min, max) {
        return Math.floor(this.float(min, max + 1));
    }

    /**
     * Random boolean with given probability
     */
    bool(probability = 0.5) {
        return this.next() < probability;
    }

    /**
     * Pick random item from array
     */
    pick(array) {
        return array[this.int(0, array.length - 1)];
    }

    /**
     * Shuffle array (returns new array)
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

// Default world seed - can be changed
export const WORLD_SEED = 42069;
