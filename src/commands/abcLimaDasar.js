const { Markup } = require('telegraf');
const activeGames = require('../game/state');
const { startGame } = require('../game/engine'); // Impor engine baru

const abcLimaDasarCommand = async (ctx) => {
    const groupId = ctx.chat.id;

    if (ctx.chat.type === 'private') {
        return ctx.reply('Command ini cuma bisa dipakai di dalam grup ya!');
    }

    if (activeGames.has(groupId)) {
        return ctx.reply('Eits, masih ada game yang sedang berjalan atau nunggu pemain di grup ini!');
    }

    const gameState = {
        status: 'LOBBY', 
        players: [],     
        timer: null,
        messageId: null
    };
    activeGames.set(groupId, gameState);

    const pesan = "🎮 *Permainan ABC 5 Dasar Dimulai!*\n\nAyo siapa aja yang mau ikut main? Klik tombol di bawah!\n\n⏳ *Waktu kumpul: 60 detik*\n\n*Peserta (0):*\n- Belum ada";

    const tombol = Markup.inlineKeyboard([
        [Markup.button.callback('☝️ Ikut Main', `join_abc_${groupId}`)]
    ]);

    const sentMessage = await ctx.reply(pesan, { parse_mode: 'Markdown', ...tombol });
    gameState.messageId = sentMessage.message_id;

    // Set timer otomatis mulai 60 detik
    gameState.timer = setTimeout(async () => {
        const game = activeGames.get(groupId);
        if (!game || game.status !== 'LOBBY') return;

        if (game.players.length < 2) {
            activeGames.delete(groupId);
            return ctx.telegram.sendMessage(groupId, 'Yah, waktu habis! Permainan dibatalkan karena pesertanya kurang dari 2 orang 😔');
        }

        // Panggil fungsi engine untuk memulai
        await startGame(ctx, groupId);
    }, 60000);
};

module.exports = abcLimaDasarCommand;