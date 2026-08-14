const activeGames = require('../game/state');
const { startTurnTimer } = require('../game/handlers');

const tambahWaktuCommand = async (ctx) => {
    const groupId = ctx.chat.id;
    if (ctx.chat.type === 'private') return;

    const game = activeGames.get(groupId);
    if (!game || game.status !== 'PLAYING') {
        return ctx.reply('Tidak ada game yang sedang berjalan.');
    }

    // Cek admin
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(groupId, userId);
    const isAdmin = member.status === 'administrator' || member.status === 'creator';

    if (!isAdmin) {
        return ctx.reply('Hanya admin grup yang bisa menambah waktu!');
    }

    // Hentikan timer lama, lalu ulur waktunya
    clearTimeout(game.turnTimer);

    // Tambah durasi (misal kita buat interval baru atau langsung set ulang timer dengan sisa/tambahan waktu)
    // Untuk simpelnya, kita reset timer aktif dengan tambahan durasi 30 detik (30000 ms)
    const currentPlayer = game.players[game.turnIndex];
    await ctx.reply(`⏱️ *Waktu ditambahkan 30 detik oleh Admin!*\nSilakan lanjut menjawab, [${currentPlayer.name}](tg://user?id=${currentPlayer.id})`, { parse_mode: 'Markdown' });

    // Nyalakan ulang timer dengan durasi 30 detik dari sekarang
    game.turnTimer = setTimeout(async () => {
        const currentGame = activeGames.get(groupId);
        if (!currentGame || currentGame.status !== 'PLAYING') return;

        await ctx.telegram.sendMessage(groupId, `⏰ *Waktu habis setelah penambahan waktu!*\n[${currentPlayer.name}](tg://user?id=${currentPlayer.id}) gagal menjawab.`, { parse_mode: 'Markdown' });
        
        const { nextTurn } = require('../game/handlers');
        await nextTurn(ctx, groupId, currentGame);
    }, 30000);
};

module.exports = tambahWaktuCommand;