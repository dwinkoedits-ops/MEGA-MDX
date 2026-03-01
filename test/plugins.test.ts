import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = path.join(__dirname, '../dist/plugins');

describe('Plugin Loading - Integration', () => {

    let pluginFiles: string[] = [];

    before(() => {
        assert.ok(fs.existsSync(PLUGINS_DIR), `dist/plugins not found - run npm run build first`);
        pluginFiles = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
        assert.ok(pluginFiles.length > 0, 'No plugins found in dist/plugins');
        console.log(`\n  Found ${pluginFiles.length} plugins to test`);
    });

    it('should have plugins directory', () => {
        assert.ok(fs.existsSync(PLUGINS_DIR));
    });

    it('should have more than 100 plugins', () => {
        assert.ok(pluginFiles.length > 100, `Only ${pluginFiles.length} plugins found`);
    });

    describe('Plugin Structure Validation', () => {
        // Test a sample of plugins for correct structure
        const SAMPLE_SIZE = 20;

        it(`should load ${SAMPLE_SIZE} sample plugins without errors`, async () => {
            const sample = pluginFiles.slice(0, SAMPLE_SIZE);
            const errors: string[] = [];

            for (const file of sample) {
                try {
                    const mod = await import(path.join(PLUGINS_DIR, file));
                    const plugin = mod.default;

                    if (!plugin) {
                        errors.push(`${file}: no default export`);
                        continue;
                    }
                    if (!plugin.command && !plugin.on) {
                        errors.push(`${file}: missing command or on property`);
                    }
                    if (plugin.handler && typeof plugin.handler !== 'function') {
                        errors.push(`${file}: handler is not a function`);
                    }
                } catch (err: any) {
                    errors.push(`${file}: ${err.message}`);
                }
            }

            if (errors.length > 0) {
                console.log('\n  Plugin errors:');
                errors.forEach(e => console.log(`    ❌ ${e}`));
            }

            assert.strictEqual(errors.length, 0, `${errors.length} plugins failed:\n${errors.join('\n')}`);
        });

        it('all plugins should have a command or aliases field', async () => {
            const missing: string[] = [];
            for (const file of pluginFiles) {
                try {
                    const mod = await import(path.join(PLUGINS_DIR, file));
                    const plugin = mod.default;
                    if (plugin && !plugin.command && !plugin.on && !plugin.aliases) {
                        missing.push(file);
                    }
                } catch { /* ignore load errors, tested above */ }
            }
            assert.strictEqual(missing.length, 0, `Plugins missing command: ${missing.join(', ')}`);
        });
    });
});
