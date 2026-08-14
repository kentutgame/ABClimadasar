const activeGames = require('../game/state');
const { showLeaderboard } = require('../game/scoreboard');

const stopGameCommand = async (ctx) => {
    const groupId = ctx.chat.id;

    if (ctx.chat.type === 'private') {
        return ctx.reply('Command ini cuma bisa dipakai di dalam grup ya!');
    }

    const game = activeGames.get(groupId);
    
    if (!game) {
        return ctx.reply('Tidak ada game atau room yang sedang aktif di grup ini.');
    }

    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(groupId, userId);
    const isAdmin = member.status === 'administrator' || member.status === 'creator';

    if (!isAdmin) {
        return ctx.reply('Hanya admin grup yang bisa menghentikan paksa permainan!');
    }

    // Bersihkan semua timer aktif
    if (game.timer) clearTimeout(game.timer);
    if (game.turnTimer) clearTimeout(game.turnTimer);

    // Tampilkan rekap skor akhir sebelum room dihapus
    if (game.status === 'PLAYING') {
        await showLeaderboard(ctx, groupId, game, 'PERMAINAN DIHENTIKAN PAKSA');
    }

    // Hapus sesi game dari memori lokal (reset total)
    activeGames.delete(groupId);

    return ctx.reply('🛑 Semua sesi dan timer berhasil dibersihkan. Room ditutup.');
};

module.exports = stopGameCommand;