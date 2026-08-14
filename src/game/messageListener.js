const activeGames = require('./state');
const kamus = require('../data/kamus.json');
const { nextTurn } = require('./handlers');

const handleGameMessage = async (ctx) => {
    const groupId = ctx.chat.id;
    const game = activeGames.get(groupId);

    if (!game || game.status !== 'PLAYING') return;

    const replyTo = ctx.message.reply_to_message;
    if (!replyTo) return;

    if (replyTo.message_id !== game.lastQuestionMessageId) return;

    const currentPlayer = game.players[game.turnIndex];
    if (ctx.from.id !== currentPlayer.id) {
        return ctx.reply('Eits, bukan giliranmu! Tunggu gilirannya ya.', { reply_to_message_id: ctx.message.message_id });
    }

    const answer = ctx.message.text.trim().toLowerCase();
    const firstLetter = answer.charAt(0).toUpperCase();

    // 1. Validasi huruf depan
    if (firstLetter !== game.currentLetter) {
        return ctx.reply(`❌ *Salah!* Huruf depannya harus huruf *${game.currentLetter}*. Coba lagi!`, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
    }

    // 2. Validasi keberadaan kata di kamus.json berdasarkan tema
    const validWords = kamus[game.currentTheme] || [];
    const isExist = validWords.includes(answer);

    if (!isExist) {
        return ctx.reply(`❌ *Salah!* Kata "${answer}" tidak ada dalam daftar kamus tema *${game.currentTheme}* atau bukan kata yang valid.`, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
    }

    // 3. Validasi Anti-Duplikasi (Apakah kata ini sudah pernah dijawab sebelumnya?)
    if (game.answeredWords.includes(answer)) {
        return ctx.reply(`❌ *Kata sudah digunakan!* Kata "${answer}" sudah pernah dijawab sebelumnya di game ini. Cari kata lain yang berawalan huruf *${game.currentLetter}*!`, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
    }

    // --- JIKA JAWABAN BENAR ---
    clearTimeout(game.turnTimer);

    // Masukkan kata ke riwayat agar tidak bisa dipakai lagi
    game.answeredWords.push(answer);

    // Tambah skor player
    game.scores[currentPlayer.id] = (game.scores[currentPlayer.id] || 0) + 10;

    await ctx.reply(`✅ *BENAR!*\n[${currentPlayer.name}](tg://user?id=${currentPlayer.id}) berhasil menjawab *${ctx.message.text}* (+10 poin)! 🎉`, { parse_mode: 'Markdown' });

    // Lanjut ke giliran berikutnya
    await nextTurn(ctx, groupId, game);
};

module.exports = { handleGameMessage };