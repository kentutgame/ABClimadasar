const activeGames = require('../game/state');
const { startGame } = require('../game/engine');

const mulaiSekarangCommand = async (ctx) => {
    const groupId = ctx.chat.id;

    if (ctx.chat.type === 'private') return;

    const game = activeGames.get(groupId);
    
    if (!game) {
        return ctx.reply('Belum ada room permainan yang dibuka.');
    }

    if (game.status === 'PLAYING') {
        return ctx.reply('Game sudah berjalan!');
    }

    // Mengecek apakah yang mengetik adalah Admin Grup atau bot Owner
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(groupId, userId);
    const isAdmin = member.status === 'administrator' || member.status === 'creator';

    if (!isAdmin) {
        return ctx.reply('Cuma admin grup yang bisa mempercepat mulai game!');
    }

    if (game.players.length < 2) {
        return ctx.reply('Minimal harus ada 2 peserta untuk memulai game!');
    }

    // Hentikan timer pendaftaran 60 detik bawaan /ABClimadasar
    clearTimeout(game.timer);

    // Langsung tembak ke fungsi game engine
    await startGame(ctx, groupId);
};

module.exports = mulaiSekarangCommand;