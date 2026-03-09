import type { BotContext } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export default {
    command: 'dna',
    aliases: ['dnaencode', 'dnadecode'],
    category: 'utility',
    description: 'Encode any text to DNA sequence (ATCG) or decode it back',
    usage: '${prefix}dna encode <text>\n${prefix}dna decode <DNA sequence>',

    async handler(sock: any, message: any, args: any[], context: BotContext) {
        const { chatId, channelInfo } = context;

        // Get text from reply or args
        const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';

        if (!args.length && !quotedText) {
            return await sock.sendMessage(chatId, {
                text: `🧬 *DNA Encoder / Decoder*\n\n` +
                      `*Encode text → DNA:*\n` +
                      `\`.dna encode Hello World\`\n\n` +
                      `*Decode DNA → text:*\n` +
                      `\`.dna decode ATCGATCG...\`\n\n` +
                      `💡 You can also reply to any message with \`.dna encode\` or \`.dna decode\`\n\n` +
                      `ℹ️ Each character becomes 4 DNA bases (A, T, C, G)`,
                ...channelInfo
            }, { quoted: message });
        }

        const mode = args[0]?.toLowerCase();
        if (mode !== 'encode' && mode !== 'decode') {
            return await sock.sendMessage(chatId, {
                text: `❌ Unknown mode: *${mode || '?'}*\nUse \`encode\` or \`decode\``,
                ...channelInfo
            }, { quoted: message });
        }

        // Input: rest of args OR quoted message text
        const input = args.slice(1).join(' ').trim() || quotedText;
        if (!input) {
            return await sock.sendMessage(chatId, {
                text: `❌ No text provided. Reply to a message or add text after the command.`,
                ...channelInfo
            }, { quoted: message });
        }

        // Check binary exists
        const binPath = path.join(process.cwd(), 'lib', 'bin', 'dna');
        if (!fs.existsSync(binPath)) {
            return await sock.sendMessage(chatId, {
                text: `❌ DNA binary not compiled. Run \`.crun\` first or check if g++ is available on this server.`,
                ...channelInfo
            }, { quoted: message });
        }

        if (mode === 'decode' && !/^[ATCGatcg\s]+$/.test(input)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid DNA sequence. Only A, T, C, G characters allowed.`,
                ...channelInfo
            }, { quoted: message });
        }

        try {
            const safeInput = input.replace(/"/g, '\\"');
            const { stdout, stderr } = await execAsync(
                `"${binPath}" ${mode} "${safeInput}"`,
                { timeout: 15000 }
            );

            if (stderr && !stdout) {
                return await sock.sendMessage(chatId, {
                    text: `❌ ${stderr.trim()}`,
                    ...channelInfo
                }, { quoted: message });
            }

            const result = stdout.trim();
            const inputLen = mode === 'decode' ? input.replace(/\s/g, '').length : input.length;

            // If result is long, send as document
            if (result.length > 800) {
                const tmpFile = path.join(process.cwd(), 'temp', `dna_${Date.now()}.txt`);
                fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
                fs.writeFileSync(tmpFile, result);

                await sock.sendMessage(chatId, {
                    document: fs.readFileSync(tmpFile),
                    mimetype: 'text/plain',
                    fileName: `dna_${mode}d_${Date.now()}.txt`,
                    caption: `🧬 *DNA ${mode === 'encode' ? 'Encoded' : 'Decoded'}*\n\n` +
                             `📥 Input: ${inputLen} ${mode === 'decode' ? 'bases' : 'chars'}\n` +
                             `📤 Output: ${result.length} ${mode === 'encode' ? 'bases' : 'chars'}\n\n` +
                             `_Result is too long, sent as file_`,
                    ...channelInfo
                }, { quoted: message });

                fs.unlinkSync(tmpFile);
            } else {
                await sock.sendMessage(chatId, {
                    text: `🧬 *DNA ${mode === 'encode' ? 'Encoder' : 'Decoder'}*\n\n` +
                          `📥 *Input length:* ${inputLen} ${mode === 'decode' ? 'bases' : 'chars'}\n` +
                          `📤 *Output length:* ${result.length} ${mode === 'encode' ? 'bases' : 'chars'}\n\n` +
                          `📤 *Result:*\n\`\`\`\n${result}\n\`\`\``,
                    ...channelInfo
                }, { quoted: message });
            }

        } catch (error: any) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
