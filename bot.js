const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const TOKEN = '7999176354:AAHp3TYgoOWKwkc_SetxlgICKnes8Wsx5IU';
const bot = new TelegramBot(TOKEN, { polling: true });

const FOOTER = `
━━━━━━━━━━━━━━
💖 Developed by *Salim Ahmad*
━━━━━━━━━━━━━━
`;

const ADMIN_INFO = `
⇩↞⎯⎯⎯⎯  𝐎𝐰𝐧𝐞𝐫 𝐈𝐧𝐟𝐨 ⎯⎯⎯⎯ ↠⇩
👤 *Name*        : ꜱᴀʟɪᴍ ᴀʜᴍᴀᴅ  
♀️ *Gender*     : ᴍᴀʟᴇ  
📆 *Age*        : 18+  
👩‍❤️‍👨 *Relation*   : ɪɴ ᴄᴏᴍᴘʟɪᴄᴀᴛᴇᴅ  
☪️ *Religion*   : ɪꜱʟᴀᴍ  
🏫 *Education*  : ᴍᴇʜᴇʀᴘᴜʀ ᴛᴇᴄʜ & ᴄᴏʟʟᴇɢᴇ  
🏡 *Address*    : ᴍᴇʜᴇʀᴘᴜʀ, ʙᴀɴɢʟᴀᴅᴇꜱʜ  

⇩↞⎯⎯⎯⎯  𝐒𝐨𝐜𝐢𝐚𝐥𝐬 ⎯⎯⎯⎯ ↠⇩
【ꚠ】 *TikTok*   : [Click Here](https://www.tiktok.com/@salim_bhai9x)  
📞 *Telegram*  : [Click Here](https://t.me/+33Srlf8jLsZlYjA1)  
ⓕ *Facebook*  : [Click Here](https://www.facebook.com/profile.php?id=61581281800062)  

${FOOTER}
`;

bot.setMyCommands([
  { command: 'start', description: 'Start bot' },
  { command: 'help', description: 'How to use' },
  { command: 'status', description: 'Bot status' },
  { command: 'format', description: 'Supported formats' },
  { command: 'admin', description: 'Admin info' },
]);

// --- Replies ---
bot.onText(/\/start/i, msg => {
  bot.sendMessage(msg.chat.id,
`👋 *Welcome!*
Send any video link to download in multiple formats & audio.

Commands:
/help
/status
/format
/admin

${FOOTER}`, { parse_mode:"Markdown" });
});

bot.onText(/\/help/i, msg => {
  bot.sendMessage(msg.chat.id,
`📖 *How To Use*
1. Send video link
2. Choose quality
3. Download video/audio

Supported:
✔ TikTok
✔ YouTube
✔ Instagram
✔ Twitter

${FOOTER}`, { parse_mode:"Markdown" });
});

bot.onText(/\/status/i, msg => {
  bot.sendMessage(msg.chat.id,
`🟢 *Bot Status*: Online

${FOOTER}`, { parse_mode:"Markdown" });
});

bot.onText(/\/format/i, msg => {
  bot.sendMessage(msg.chat.id,
`🎞 *Formats Supported*
• Video: 4K / 2K / 1080p / 720p
• Audio: MP3

${FOOTER}`, { parse_mode:"Markdown" });
});

bot.onText(/\/admin/i, msg => {
  bot.sendMessage(msg.chat.id, ADMIN_INFO, { parse_mode:"Markdown" });
});

// --- Video Downloader with Inline Buttons ---
bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if(!text || text.startsWith('/')) return;
  if(!text.startsWith('http')) return;

  const startTime = Date.now();
  bot.sendChatAction(chatId, 'upload_video');

  // Get video info
  bot.sendMessage(chatId,
`🔎 Fetching video info...
Please wait...
${FOOTER}`, { parse_mode:"Markdown" });

  exec(`yt-dlp -F "${text}"`, (err, info) => {
    let buttons = [];
    if(!err && info){
      const lines = info.split("\n");
      let sizes = {};
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if(parts[0] && parts[1]){
          const res = parts[2] || '';
          const size = parts.slice(-1)[0];
          if(res.includes("2160")) sizes['4K']=size;
          if(res.includes("1440")) sizes['2K']=size;
          if(res.includes("1080")) sizes['1080p']=size;
          if(res.includes("720")) sizes['720p']=size;
        }
      });
      buttons = [
        [{ text:`4K (${sizes['4K']||'N/A'})`, callback_data:'4k' }],
        [{ text:`2K (${sizes['2K']||'N/A'})`, callback_data:'2k' }],
        [{ text:`1080p (${sizes['1080p']||'N/A'})`, callback_data:'1080' }],
        [{ text:`720p (${sizes['720p']||'N/A'})`, callback_data:'720' }],
        [{ text:`Audio MP3`, callback_data:'mp3' }]
      ];
    } else {
      buttons = [[{ text:"Best Available", callback_data:'best' }],[{ text:"Audio MP3", callback_data:'mp3' }]];
    }

    bot.sendMessage(chatId, `🎯 Select Quality / Audio\n${FOOTER}`, {
      reply_markup: { inline_keyboard: buttons },
      parse_mode:"Markdown"
    });

    bot.once('callback_query', query => {
      const choice = query.data;
      let cmd = '';
      let ext = 'mp4';
      if(choice==='mp3'){
        cmd = `yt-dlp -x --audio-format mp3 -o "%(title)s.%(ext)s" "${text}"`;
        ext='mp3';
      } else {
        let f='';
        if(choice==='4k') f='bestvideo[height<=2160]+bestaudio/best';
        if(choice==='2k') f='bestvideo[height<=1440]+bestaudio/best';
        if(choice==='1080') f='bestvideo[height<=1080]+bestaudio/best';
        if(choice==='720') f='bestvideo[height<=720]+bestaudio/best';
        if(choice==='best') f='bestvideo+bestaudio/best';
        cmd = `yt-dlp -f "${f}" -o "%(title)s.%(ext)s" "${text}"`;
      }

      bot.editMessageText(`⏳ Downloading ${choice}...\n${FOOTER}`, { chat_id:chatId, message_id:query.message.message_id, parse_mode:"Markdown" });

      exec(cmd, (e)=>{
        if(e){
          bot.sendMessage(chatId, `❌ Download Failed\n${FOOTER}`, { parse_mode:"Markdown" });
          return;
        }

        exec(`ls *.${ext}`, async (er, files)=>{
          const file = files.split("\n")[0];
          const seconds = ((Date.now()-startTime)/1000).toFixed(1);

          if(ext==='mp3'){
            await bot.sendAudio(chatId, file, { caption:`✅ Audio Downloaded\n⏱ Time: ${seconds} sec\n${FOOTER}`, parse_mode:"Markdown" });
          } else {
            await bot.sendDocument(chatId, file, { caption:`✅ Downloaded (${choice})\n⏱ Time: ${seconds} sec\n${FOOTER}`, parse_mode:"Markdown" });
          }

          exec(`rm "${file}"`);
        });
      });
    });
  });
});

console.log('🤖 Full-featured Telegram Video Downloader Bot Running...');
