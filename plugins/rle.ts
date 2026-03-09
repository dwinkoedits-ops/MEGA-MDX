import { getBin } from '../lib/compile.js';
import type { BotContext } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);

export default {
    command: 'rle',
    aliases: ['compress', 'decompress', 'rlecompress'],
    category: 'utility',
    description: 'Compress or decompress text using Run-Length Encoding (C++ powered)',
    usage: '${prefix}rle compress <text>\n${prefix}rle decompress <encoded>',

    async handler(sock: any, message: any, args: any[], context: BotContext) {
        const { chatId, channelInfo } = context;

        if (args.length < 2) {
            return await sock.sendMessage(chatId, {
                text: `🗜️ *RLE Compressor*\n\n` +
                      `*Compress text:*\n` +
                      `\`.rle compress AAABBBCCDDDDEEEE\`\n\n` +
                      `*Decompress:*\n` +
                      `\`.rle decompress <encoded>\`\n\n` +
                      `ℹ️ RLE works best on text with repeated characters.\n` +
                      `Powered by C++ for high performance.`,
                ...channelInfo
            }, { quoted: message });
        }

        const mode = args[0].toLowerCase();
        if (mode !== 'compress' && mode !== 'decompress') {
            return await sock.sendMessage(chatId, {
                text: `❌ Unknown mode: *${mode}*\nUse \`compress\` or \`decompress\``,
                ...channelInfo
            }, { quoted: message });
        }

        const input = args.slice(1).join(' ').trim();
        if (!input) {
            return await sock.sendMessage(chatId, {
                text: `❌ No input provided.`,
                ...channelInfo
            }, { quoted: message });
        }

        try {
            const bin = getBin('rle');
            const safeInput = input.replace(/"/g, '\\"');
            const { stdout, stderr } = await execAsync(
                `"${bin}" ${mode} text "${safeInput}"`,
                { timeout: 15000 }
            );

            const result = stdout.trim();

            if (!result) {
                return await sock.sendMessage(chatId, {
                    text: `❌ ${stderr?.trim() || 'No output produced'}`,
                    ...channelInfo
                }, { quoted: message });
            }

            // Parse stats from stderr if compressing
            let statsLine = '';
            if (mode === 'compress' && stderr) {
                const match = stderr.match(/STATS\|original=(\d+)\|compressed=(\d+)\|ratio=(-?\d+)%/);
                if (match) {
                    const orig = parseInt(match[1]);
                    const comp = parseInt(match[2]);
                    const ratio = parseInt(match[3]);
                    const saved = orig - comp;
                    statsLine = `\n\n📊 *Stats:*\n` +
                                `• Original: ${orig} bytes\n` +
                                `• Compressed: ${comp} bytes\n` +
                                `• ${ratio >= 0 ? `Saved: ${saved} bytes (${ratio}%)` : `Grew by: ${Math.abs(saved)} bytes (RLE inefficient for this input)`}`;
                }
            }

            const resultPreview = result.length > 400 ? result.substring(0, 400) + '\n...(truncated)' : result;

            await sock.sendMessage(chatId, {
                text: `🗜️ *RLE ${mode === 'compress' ? 'Compressor' : 'Decompressor'}*\n\n` +
                      `📥 *Input:* \`${input.length > 60 ? input.substring(0, 60) + '...' : input}\`\n\n` +
                      `📤 *Result:*\n\`\`\`\n${resultPreview}\n\`\`\`` +
                      statsLine,
                ...channelInfo
            }, { quoted: message });

        } catch (error: any) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
