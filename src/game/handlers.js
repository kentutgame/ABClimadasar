const activeGames = require('./state');
const kamus = require('../data/kamus.json');

// Fungsi pembantu untuk mengacak array
const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const nextTurn = async (ctx, groupId, game) => {
    if (game.turnTimer) clearTimeout(game.turnTimer);

    // Pindah ke player selanjutnya
    game.turnIndex++;

    // Jika sudah melewati jumlah player, artinya 1 putaran penuh selesai
    if (game.turnIndex >= game.players.length) {
        game.turnIndex = 0;
        game.letterRoundCount++; // Tambah hitungan putaran huruf ini (Max 3 putaran)

        // ATURAN 2: Jika 1 huruf sudah mencapai 3 putaran, ganti HURUF baru
        if (game.letterRoundCount > 3) {
            game.letterRoundCount = 1;
            game.themeLetterCount++; // Tambah hitungan huruf dalam tema ini (Max 3 huruf)

            // ATURAN 2: Jika sudah 3 huruf dalam tema ini, ganti TEMA BARU
            if (game.themeLetterCount > 3 || game.availableLetters.length === 0) {
                const themes = Object.keys(kamus);
                // Pilih tema baru yang berbeda dari sebelumnya jika memungkinkan
                let newTheme = game.currentTheme;
                while(newTheme === game.currentTheme && themes.length > 1) {
                    newTheme = themes[Math.floor(Math.random() * themes.length)];
                }
                game.currentTheme = newTheme;

                // Reset huruf untuk tema baru
                const kataTersedia = kamus[game.currentTheme];
                const hurufTersedia = [...new Set(kataTersedia.map(kata => kata.charAt(0).toUpperCase()))];
                game.availableLetters = shuffleArray(hurufTersedia);
                game.themeLetterCount = 1;

                await ctx.telegram.sendMessage(groupId, `🔄 *TEMA BERGANTI!*\nTema baru sekarang adalah: *${game.currentTheme}*`, { parse_mode: 'Markdown' });
            }

            // Ambil huruf berikutnya
            game.currentLetter = game.availableLetters.pop();
            await ctx.telegram.sendMessage(groupId, `🔤 *HURUF BERGANTI!*\nHuruf depan sekarang adalah: *${game.currentLetter}* *(Huruf ke-${game.themeLetterCount} dari 3)*`, { parse_mode: 'Markdown' });
        }
    }

    const currentPlayer = game.players[game.turnIndex];

    const pesan = `🔄 *Giliran Berpindah!*\n\nTema: *${game.currentTheme}*\nHuruf Depan: *${game.currentLetter}* | Putaran: *${game.letterRoundCount}/3*\n\nGiliran menjawab: [${currentPlayer.name}](tg://user?id=${currentPlayer.id})\n\n⏳ Waktu kamu 60 detik! *Reply* pesan ini dengan jawabanmu.`;

    const sentMessage = await ctx.telegram.sendMessage(groupId, pesan, { parse_mode: 'Markdown' });
    game.lastQuestionMessageId = sentMessage.message_id;

    startTurnTimer(ctx, groupId);
};

const startTurnTimer = (ctx, groupId) => {
    const game = activeGames.get(groupId);
    if (!game) return;

    game.turnTimer = setTimeout(async () => {
        const currentGame = activeGames.get(groupId);
        if (!currentGame || currentGame.status !== 'PLAYING') return;

        const currentP = currentGame.players[currentGame.turnIndex];
        await ctx.telegram.sendMessage(groupId, `⏰ *Waktu habis!*\n[${currentP.name}](tg://user?id=${currentP.id}) gagal menjawab tepat waktu.`, { parse_mode: 'Markdown' });

        await nextTurn(ctx, groupId, currentGame);
    }, 60000); 
};

module.exports = { nextTrain: nextTurn, nextTurn, startTurnTimer };