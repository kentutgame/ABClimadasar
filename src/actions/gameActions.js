const { Markup } = require('telegraf');
const activeGames = require('../game/state');

const joinGameAction = async (ctx) => {
    // Ambil ID grup dari data di balik tombol (regex)
    const groupId = Number(ctx.match[1]); 
    const user = ctx.from;
    
    const game = activeGames.get(groupId);
    
    // Validasi apakah game masih ada dan masih buka pendaftaran
    if (!game || game.status !== 'LOBBY') {
        return ctx.answerCbQuery('Waktu pendaftaran sudah habis atau game sudah tidak ada!', { show_alert: true });
    }

    // Cegah player join 2 kali
    const isJoined = game.players.find(p => p.id === user.id);
    if (isJoined) {
        return ctx.answerCbQuery('Kamu udah daftar, sabar!', { show_alert: true });
    }

    // Masukkan player ke dalam list
    game.players.push({ id: user.id, name: user.first_name });

    // Update teks pesan di grup
    let playerList = game.players.map((p, index) => `${index + 1}. ${p.name}`).join('\n');
    const pesanBaru = `🎮 *Permainan ABC 5 Dasar Dimulai!*\n\nAyo siapa aja yang mau ikut main? Klik tombol di bawah!\n\n⏳ *Waktu kumpul: 60 detik*\n\n*Peserta (${game.players.length}):*\n${playerList}`;

    const tombol = Markup.inlineKeyboard([
        [Markup.button.callback('☝️ Ikut Main', `join_abc_${groupId}`)]
    ]);

    try {
        await ctx.editMessageText(pesanBaru, { parse_mode: 'Markdown', ...tombol });
        await ctx.answerCbQuery('Berhasil ikut main!');
    } catch (error) {
        await ctx.answerCbQuery('Berhasil daftar (Pesan grup gagal update, tapi namamu sudah masuk)');
    }
};

const skipTurnAction = async (ctx) => {
    const groupId = Number(ctx.match[1]);
    const game = activeGames.get(groupId);

    if (!game || game.status !== 'PLAYING') {
        return ctx.answerCbQuery('Game sudah tidak aktif!', { show_alert: true });
    }

    const currentPlayer = game.players[game.turnIndex];

    // Validasi: Hanya orang yang sedang giliran yang boleh menekan tombol skip
    if (ctx.from.id !== currentPlayer.id) {
        return ctx.answerCbQuery('Eits, bukan giliranmu buat nge-skip!', { show_alert: true });
    }

    // Hentikan timer pemain saat ini
    clearTimeout(game.turnTimer);

    // Hilangkan loading di tombol
    await ctx.answerCbQuery('Kamu melewati giliranmu!');
    
    // Beri tahu grup kalau dia nyerah
    await ctx.telegram.sendMessage(groupId, `⏭️ [${currentPlayer.name}](tg://user?id=${currentPlayer.id}) menyerah dan melewati gilirannya!`, { parse_mode: 'Markdown' });

    // Panggil nextTurn untuk melempar giliran ke pemain selanjutnya
    const { nextTurn } = require('../game/handlers');
    await nextTurn(ctx, groupId, game);
};

// Tambahkan skipTurnAction di export module
module.exports = { joinGameAction, skipTurnAction };