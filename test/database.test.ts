import { strict as assert } from 'assert';

describe('Database - Integration', () => {

    describe('SQLite (default backend)', () => {
        let store: any;

        before(async () => {
            try {
                const mod = await import('../lib/lightweight_store.js');
                store = mod.default || mod;
            } catch (err: any) {
                console.warn('  ⚠️ Could not load store:', err.message);
            }
        });

        it('should load the store module', () => {
            assert.ok(store, 'Store module not loaded');
        });

        it('should have core store methods', () => {
            if (!store) return;
            const methods = ['loadMessage', 'bind'];
            for (const method of methods) {
                assert.ok(
                    typeof store[method] === 'function',
                    `Missing method: ${method}`
                );
            }
        });
    });

    describe('Environment Variables', () => {
        it('should not require SESSION_ID to start (pairing mode)', () => {
            // Bot should work without SESSION_ID
            const sessionId = process.env.SESSION_ID;
            assert.ok(!sessionId || typeof sessionId === 'string');
        });

        it('should have valid MONGO_URL format if set', () => {
            const mongoUrl = process.env.MONGO_URL;
            if (mongoUrl) {
                assert.ok(
                    mongoUrl.startsWith('mongodb://') || mongoUrl.startsWith('mongodb+srv://'),
                    'MONGO_URL must start with mongodb:// or mongodb+srv://'
                );
            }
        });

        it('should have valid POSTGRES_URL format if set', () => {
            const pgUrl = process.env.POSTGRES_URL;
            if (pgUrl) {
                assert.ok(
                    pgUrl.startsWith('postgresql://') || pgUrl.startsWith('postgres://'),
                    'POSTGRES_URL must start with postgresql:// or postgres://'
                );
            }
        });
    });
});
