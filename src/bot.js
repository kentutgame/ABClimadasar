const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config/env');
const { checkGroupRegistered } = require('./services/dbService');

// --- IMPOR MIDDLEWARE ---
const isOwner = require('./middlewares/isOwner');
const isAuthGroup = require('./middlewares/isAuthGroup');

// --- IMPOR COMMANDS ---
const settingCommand = require('./commands/setting');
const daftarGrupCommand = require('./commands/daftarGrup');
const settingGrupCommand = require('./commands/settingGrup');
const abcLimaDasarCommand = require('./commands/abcLimaDasar');

const mulaiSekarangCommand = require('./commands/mulaiSekarang');
const { handleGameMessage } = require('./game/messageListener');
const tambahWaktuCommand = require('./commands/tambahWaktu');
const stopGameCommand = require('./commands/stopGame');

// --- IMPOR ACTIONS ---
const { listGrupAction, detailGrupAction } = require('./actions/groupMenu');
const toggleAdminAction = require('./actions/toggleAdmin');
const { detailSetGrupAction, togglePlayCustomAction } = require('./actions/settingGrupMenu');
const { joinGameAction, skipTurnAction } = require('./actions/gameActions');

const bot = new Telegraf(BOT_TOKEN);


// ================= COMMANDS =================
// Command khusus Owner
bot.command('setting', isOwner, settingCommand);
bot.command('daftargrup', isOwner, daftarGrupCommand);

// Command khusus Admin Grup yang diberi izin (Menu C)
bot.command('settinggrup', isAuthGroup, settingGrupCommand);

// Daftarkan command buka game
bot.command('ABClimadasar', abcLimaDasarCommand);

bot.command('mulaisekarangjuga', mulaiSekarangCommand);

// Command tambah waktu oleh admin
bot.command('tambahwaktu', tambahWaktuCommand);

// Command untuk menghentikan paksa game yang sedang berjalan
bot.command('stopgame', stopGameCommand);


// Command untuk cek ping/latensi
bot.command('ping', (ctx) => {
    const start = Date.now();
    ctx.reply('🏓 Sedang mengecek ping...').then((sentMessage) => {
        const end = Date.now();
        const ping = end - start;
        ctx.telegram.editMessageText(
            ctx.chat.id, 
            sentMessage.message_id, 
            undefined, 
            `🏓 *Pong!*\nLatensi Vercel ↔️ Telegram: *${ping}ms*`,
            { parse_mode: 'Markdown' }
        );
    });
});

// Listener untuk menangkap teks jawaban di grup (harus di bawah sebelum bot.launch)
bot.on('text', handleGameMessage);

// Daftarkan aksi tombol ikut main
bot.action(/^join_abc_(.+)$/, joinGameAction);
// ================= ACTIONS (TOMBOL) =================
// Aksi Menu A (Pendaftaran)
bot.action('action_daftar_grup', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Untuk mendaftarkan grup baru, silakan ketik perintah berikut:\n\n`/daftargrup <ID_GRUP>`\n\nContoh: `/daftargrup -100987654321`', { parse_mode: 'Markdown' });
});
// Daftarkan aksi tombol skip
bot.action(/^skip_(.+)$/, skipTurnAction);

// Aksi Menu B (List Grup & Ceklis Admin)
bot.action('action_list_grup', listGrupAction);
bot.action(/^grp_(.+)$/, detailGrupAction);
bot.action(/^adm_(.+)_(.+)$/, toggleAdminAction);

// Aksi Menu C (Delegasi Izin Main Custom)
bot.action(/^setgrp_(.+)$/, detailSetGrupAction);
bot.action(/^play_(.+)_(.+)$/, togglePlayCustomAction);


// ================= EVENTS =================
// Event ketika status bot berubah di sebuah grup
bot.on('my_chat_member', async (ctx) => {
    const chatMember = ctx.update.my_chat_member;
    
    // Mengecek apakah bot baru saja menjadi 'member' atau 'administrator'
    if (chatMember.new_chat_member.status === 'member' || chatMember.new_chat_member.status === 'administrator') {
        const groupId = chatMember.chat.id;
        
        // Panggil fungsi cek database
        const isRegistered = await checkGroupRegistered(groupId);
        
        if (!isRegistered) {
            // Cuma ngasih peringatan
            await ctx.reply('eits izin dulu ke yang punya @arikamukunaon');
            console.log(`[WARNING] Bot dimasukkan ke grup tidak terdaftar (ID: ${groupId})`);
        } else {
            // Logika jika grup valid
            await ctx.reply('Halo semua! Bot siap dimainkan.');
            console.log(`[ALLOWED] Bot masuk ke grup terdaftar (ID: ${groupId})`);
        }
    }
});


// ================= ERROR HANDLING & LAUNCH =================
// Menyalakan bot secara lokal
// if (process.env.NODE_ENV !== 'production') {
//     bot.launch().then(() => console.log('🚀 Bot sedang berjalan secara lokal... Silakan uji coba!'));
// }

// // Mencegah error crash yang tidak terduga
// bot.catch((err, ctx) => {
//     console.error(`Error pada ${ctx.updateType}:`, err);
// });

// // Mematikan bot dengan aman jika terminal ditutup
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

// module.exports = bot;

// ================= ERROR HANDLING & LAUNCH =================
// Menyalakan bot secara lokal HANYA jika bukan di Vercel/Production
if (process.env.NODE_ENV !== 'production') {
    bot.launch().then(() => console.log('🚀 Bot sedang berjalan secara lokal... Silakan uji coba!'));
}

// Mencegah error crash yang tidak terduga
bot.catch((err, ctx) => {
    console.error(`Error pada ${ctx.updateType}:`, err);
});

// Mematikan bot dengan aman jika terminal ditutup (untuk lokal)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// WAJIB ADA: Mengekspor bot agar bisa dibaca oleh Vercel Webhook
module.exports = bot;