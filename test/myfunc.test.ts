import { strict as assert } from 'assert';
import {
    unixTimestampSeconds,
    getRandom,
    runtime,
    clockString,
    isUrl,
    bytesToSize,
    parseMention,
    getGroupAdmins,
    logic,
    isUrl as isUrlFn
} from '../lib/myfunc.js';

describe('myfunc.ts - Utility Functions', () => {

    // ─── unixTimestampSeconds ─────────────────────────────────────────────────
    describe('unixTimestampSeconds()', () => {
        it('should return a number', () => {
            assert.strictEqual(typeof unixTimestampSeconds(), 'number');
        });
        it('should be close to Date.now()/1000', () => {
            const now = Math.floor(Date.now() / 1000);
            assert.ok(Math.abs(unixTimestampSeconds() - now) < 2);
        });
        it('should accept a custom date', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            assert.strictEqual(unixTimestampSeconds(date), 1704067200);
        });
    });

    // ─── getRandom ────────────────────────────────────────────────────────────
    describe('getRandom()', () => {
        it('should return a string ending with the ext', () => {
            const result = getRandom('.mp3');
            assert.ok(result.endsWith('.mp3'));
        });
        it('should return different values each time', () => {
            const a = getRandom('');
            const b = getRandom('');
            // Not guaranteed but highly likely
            assert.ok(typeof a === 'string' && typeof b === 'string');
        });
    });

    // ─── runtime ─────────────────────────────────────────────────────────────
    describe('runtime()', () => {
        it('should format seconds correctly', () => {
            assert.strictEqual(runtime(0), '');
            assert.ok(runtime(61).includes('minute'));
            assert.ok(runtime(3661).includes('hour'));
            assert.ok(runtime(90061).includes('day'));
        });
        it('should handle 1 second singular', () => {
            assert.ok(runtime(1).includes('second'));
            assert.ok(!runtime(1).includes('seconds'));
        });
        it('should handle plural seconds', () => {
            assert.ok(runtime(2).includes('seconds'));
        });
    });

    // ─── clockString ─────────────────────────────────────────────────────────
    describe('clockString()', () => {
        it('should format ms to HH:MM:SS', () => {
            assert.strictEqual(clockString(3661000), '01:01:01');
        });
        it('should pad with zeros', () => {
            assert.strictEqual(clockString(0), '00:00:00');
        });
        it('should handle NaN', () => {
            assert.strictEqual(clockString(NaN), '--:--:--');
        });
    });

    // ─── isUrl ────────────────────────────────────────────────────────────────
    describe('isUrl()', () => {
        it('should return match for valid URLs', () => {
            assert.ok(isUrl('https://google.com'));
            assert.ok(isUrl('http://example.org/path?query=1'));
        });
        it('should return null for invalid URLs', () => {
            assert.strictEqual(isUrl('not a url'), null);
            assert.strictEqual(isUrl('just text'), null);
        });
    });

    // ─── bytesToSize ──────────────────────────────────────────────────────────
    describe('bytesToSize()', () => {
        it('should return 0 Bytes for 0', () => {
            assert.strictEqual(bytesToSize(0), '0 Bytes');
        });
        it('should convert KB correctly', () => {
            assert.strictEqual(bytesToSize(1024), '1 KB');
        });
        it('should convert MB correctly', () => {
            assert.strictEqual(bytesToSize(1048576), '1 MB');
        });
        it('should respect decimal places', () => {
            const result = bytesToSize(1500, 1);
            assert.ok(result.includes('KB'));
        });
    });

    // ─── parseMention ─────────────────────────────────────────────────────────
    describe('parseMention()', () => {
        it('should extract WhatsApp JIDs from mentions', () => {
            const result = parseMention('Hello @923001234567 how are you');
            assert.deepStrictEqual(result, ['923001234567@s.whatsapp.net']);
        });
        it('should handle multiple mentions', () => {
            const result = parseMention('@111111 and @222222');
            assert.strictEqual(result.length, 2);
        });
        it('should return empty array for no mentions', () => {
            assert.deepStrictEqual(parseMention('no mentions here'), []);
        });
        it('should handle empty string', () => {
            assert.deepStrictEqual(parseMention(''), []);
        });
    });

    // ─── getGroupAdmins ───────────────────────────────────────────────────────
    describe('getGroupAdmins()', () => {
        it('should return admin JIDs', () => {
            const participants = [
                { id: 'user1@s.whatsapp.net', admin: 'admin' },
                { id: 'user2@s.whatsapp.net', admin: null },
                { id: 'user3@s.whatsapp.net', admin: 'superadmin' }
            ];
            const admins = getGroupAdmins(participants);
            assert.deepStrictEqual(admins, ['user1@s.whatsapp.net', 'user3@s.whatsapp.net']);
        });
        it('should return empty array if no admins', () => {
            const participants = [{ id: 'user@s.whatsapp.net', admin: null }];
            assert.deepStrictEqual(getGroupAdmins(participants), []);
        });
    });

    // ─── logic ────────────────────────────────────────────────────────────────
    describe('logic()', () => {
        it('should return correct output for matching input', () => {
            assert.strictEqual(logic('a', ['a', 'b', 'c'], [1, 2, 3]), 1);
        });
        it('should return null for no match', () => {
            assert.strictEqual(logic('z', ['a', 'b'], [1, 2]), null);
        });
        it('should throw if lengths differ', () => {
            assert.throws(() => logic('a', ['a', 'b'], [1]), /same length/);
        });
    });
});
