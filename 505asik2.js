const axios = require('axios');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_CODE = 'bak4pl';
const PREFIX = '!';
const DELETE_TIMER = 300000;
const STATUS_UPDATE_INTERVAL = 300000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function updatePlayingStatus() {
  try {
    const apiUrl = `https://servers-frontend.fivem.net/api/servers/single/${SERVER_CODE}`;
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const currentPlayers = response.data.Data.players.length;
    const maxPlayers = response.data.Data.vars.sv_maxClients;
    const statusText = `IndoprideRP ${currentPlayers}/${maxPlayers} Players`;
    client.user.setActivity(statusText, {
      type: ActivityType.Playing
    });
    console.log(`[Status Update] Aktivitas diupdate: ${statusText}`);
  } catch (error) {
    console.error(`[Status Update] Gagal update status: ${error.message}`);
    client.user.setActivity('Server Offline?', {
      type: ActivityType.Watching
    });
  }
}

client.on('ready', () => {
  console.log(`🤖 Bot telah login sebagai ${client.user.tag}`);
  updatePlayingStatus();
  setInterval(updatePlayingStatus, STATUS_UPDATE_INTERVAL);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'cari2') {
    const userMessage = message;
    setTimeout(async () => {
      try {
        if (!userMessage.deleted) {
          await userMessage.delete();
          console.log(`[Auto-Delete] Pesan perintah dari ${userMessage.author.tag} dihapus.`);
        }
      } catch (err) {
        console.error('Gagal menghapus pesan perintah pengguna:', err.message);
      }
    }, 10000);


    const searchTerm = args.join(' ').toLowerCase();

    if (!searchTerm) {
      return message.reply('Harap masukkan nama pemain yang ingin dicari. Contoh: `!cari Player1`')
        .then(reply => {
          setTimeout(() => {
            reply.delete().catch(err => console.error('Gagal hapus pesan reply:', err));
          }, 10000);
        });
    }

    const loadingMessage = await message.reply('🔍 Sedang mengambil data server dan mencari pemain...');

    try {
      const apiUrl = `https://servers-frontend.fivem.net/api/servers/single/${SERVER_CODE}`;
      const response = await axios.get(apiUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const players = response.data.Data.players;
      const totalPemain = players.length;
      const hasilPencarian = players.filter(player =>
        player.name.toLowerCase().includes(searchTerm)
      );

      let codeBlockContent = '';
      codeBlockContent += `🟢 Player Aktif: ${totalPemain}   🔍 Player Ditemukan: ${hasilPencarian.length}\n\n`;
      codeBlockContent += 'List Player\n';
      codeBlockContent += 'ID   | Nama Player\n';
      codeBlockContent += '----------------------------------------\n';

      if (hasilPencarian.length > 0) {
        hasilPencarian.forEach(player => {
          const formattedId = player.id.toString().padEnd(4, ' ');
          codeBlockContent += `${formattedId} | ${player.name}\n`;
        });

        if (codeBlockContent.length > 1900) {
          codeBlockContent = codeBlockContent.substring(0, 1900) + '... (dan lainnya)\n';
        }
      } else {
        codeBlockContent += 'Pemain tidak ditemukan.\n';
      }

      const warningMessage = '⚠️ Pesan akan dihapus secara otomatis setelah 5 menit.';
      const finalMessageContent = `\`\`\`\n${codeBlockContent}\n\`\`\`\n${warningMessage}`;

    
      loadingMessage.edit({ content: finalMessageContent })
        .then(finalReply => {
          setTimeout(() => {
            finalReply.delete().catch(err => console.error('Gagal menghapus pesan bot:', err));
          }, DELETE_TIMER);
        });

    } catch (error) {
      console.error('Error di dalam perintah !cari:', error);
      loadingMessage.edit('❌ Terjadi error saat mengambil data dari API FiveM.')
        .then(errorReply => {
          setTimeout(() => {
            errorReply.delete().catch(err => console.error('Gagal menghapus pesan error:', err));
          }, 30000);
        });
    }
  }
});

if (!BOT_TOKEN) {
  console.error("Error: BOT_TOKEN tidak ditemukan. Pastikan Anda mengaturnya di Environment Variables.");
} else {
  client.login(BOT_TOKEN);
}