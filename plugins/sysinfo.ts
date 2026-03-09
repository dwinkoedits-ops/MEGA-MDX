import type { BotContext } from '../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export default {
    command: 'sysinfo',
    aliases: ['system', 'serverstats', 'serverinfo'],
    category: 'owner',
    description: 'Show detailed server system information',
    usage: '${prefix}sysinfo',
    ownerOnly: true,

    async handler(sock: any, message: any, args: any[], context: BotContext) {
        const { chatId, channelInfo } = context;

        try {
            const [memOut, diskOut, uptimeOut] = await Promise.all([
                execAsync('free -h').then(r => r.stdout.trim()),
                execAsync('df -h /').then(r => r.stdout.trim()),
                execAsync('uptime -p').then(r => r.stdout.trim()),
            ]);

            // Memory
            const memLines = memOut.split('\n');
            const memVals = memLines[1]?.split(/\s+/) || [];
            const memTotal = memVals[1] || 'N/A';
            const memUsed = memVals[2] || 'N/A';
            const memFree = memVals[3] || 'N/A';

            // Disk
            const diskLines = diskOut.split('\n');
            const diskVals = diskLines[1]?.split(/\s+/) || [];
            const diskTotal = diskVals[1] || 'N/A';
            const diskUsed = diskVals[2] || 'N/A';
            const diskFree = diskVals[3] || 'N/A';
            const diskPct = diskVals[4] || 'N/A';

            // CPU
            const cpus = os.cpus();
            const cpuModel = cpus[0]?.model?.trim() || 'Unknown';
            const cpuCores = cpus.length;
            const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(', ');

            // Platform
            const platform = os.platform();
            const arch = os.arch();
            const nodeVer = process.version;
            const hostname = os.hostname();

            const text =
`╔══════════════════════════════╗
║     🖥️  *SERVER STATS*        ║
╚══════════════════════════════╝

🏠 *Host:* ${hostname}
🐧 *OS:* ${platform} (${arch})
⏱️ *Uptime:* ${uptimeOut}
🟢 *Node.js:* ${nodeVer}

━━━━━━ 🧠 CPU ━━━━━━
🔧 *Model:* ${cpuModel}
⚙️ *Cores:* ${cpuCores}
📊 *Load Avg:* ${loadAvg}

━━━━━━ 💾 Memory ━━━━━━
📦 *Total:* ${memTotal}
🔴 *Used:* ${memUsed}
🟢 *Free:* ${memFree}

━━━━━━ 💿 Disk (/) ━━━━━━
📦 *Total:* ${diskTotal}
🔴 *Used:* ${diskUsed} (${diskPct})
🟢 *Free:* ${diskFree}`;

            await sock.sendMessage(chatId, {
                text,
                ...channelInfo
            }, { quoted: message });

        } catch (error: any) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to get system info: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
