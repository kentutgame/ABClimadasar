const activeGames = require('./state');
const kamus = require('../data/kamus.json');
const { Markup } = require('telegraf'); 

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    game.turnIndex++;
    
    // Penanda apakah kita perlu menyalakan animasi acak atau tidak
    let isThemeOrLetterChanged = false;

    if (game.turnIndex >= game.players.length) {
        game.turnIndex = 0;
        game.letterRoundCount++; 

        if (game.letterRoundCount > 3) {
            isThemeOrLetterChanged = true; // Huruf habis, wajib animasi acak
            game.letterRoundCount = 1;
            game.themeLetterCount++; 

            if (game.themeLetterCount > 3 || game.availableLetters.length === 0) {
                const themes = Object.keys(kamus);
                let newTheme = game.currentTheme;
                while(newTheme === game.currentTheme && themes.length > 1) {
                    newTheme = themes[Math.floor(Math.random() * themes.length)];
                }
                game.currentTheme = newTheme;

                const kataTersedia = kamus[game.currentTheme];
                const hurufTersedia = [...new Set(kataTersedia.map(kata => kata.charAt(0).toUpperCase()))];
                game.availableLetters = shuffleArray(hurufTersedia);
                game.themeLetterCount = 1;
            }

            game.currentLetter = game.availableLetters.pop();
        }
    }

    const currentPlayer = game.players[game.turnIndex];

    try {
        let messageIdToEdit;

        // JIKA HURUF/TEMA GANTI: Mainkan Animasi Slot Machine
        if (isThemeOrLetterChanged) {
            const loadingMsg = await ctx.telegram.sendMessage(groupId, "🎲 *Mengacak Tema & Huruf Baru...*", { parse_mode: 'Markdown' });
            messageIdToEdit = loadingMsg.message_id;
            game.lastQuestionMessageId = messageIdToEdit;

            await delay(1000); 
            if (!activeGames.has(groupId) || activeGames.get(groupId).status !== 'PLAYING') return;

            await ctx.telegram.editMessageText(groupId, messageIdToEdit, undefined, `🎲 Tema Terpilih: *${game.currentTheme}*!\n🔤 Mengacak huruf...`, { parse_mode: 'Markdown' });

            await delay(1000); 
            if (!activeGames.has(groupId) || activeGames.get(groupId).status !== 'PLAYING') return;
        }

        // Teks awalan berbeda tergantung ada animasi atau tidak
        const headerText = isThemeOrLetterChanged ? "" : "🔄 *Giliran Berpindah!*\n\n";
        const finalPesan = `${headerText}Sebutkan *${game.currentTheme}* yang berawalan dari huruf *${game.currentLetter}*!\n\n(Putaran: ${game.letterRoundCount}/3)\n\nGiliran menjawab: [${currentPlayer.name}](tg://user?id=${currentPlayer.id})\n\n⏳ Waktu kamu 60 detik! *Reply* pesan ini dengan jawabanmu.`;

        const tombolSkip = Markup.inlineKeyboard([
            [Markup.button.callback('⏭️ Gua Skip', `skip_${groupId}`)]
        ]);

        // Kalau tadi pakai animasi, kita edit pesannya. Kalau tidak, kirim pesan baru.
        if (isThemeOrLetterChanged) {
            await ctx.telegram.editMessageText(groupId, messageIdToEdit, undefined, finalPesan, { parse_mode: 'Markdown', ...tombolSkip });
        } else {
            const sentMsg = await ctx.telegram.sendMessage(groupId, finalPesan, { parse_mode: 'Markdown', ...tombolSkip });
            game.lastQuestionMessageId = sentMsg.message_id;
        }

        startTurnTimer(ctx, groupId);

    } catch (error) {
        console.error("Gagal menjalankan animasi pesan:", error);
        if (activeGames.has(groupId) && activeGames.get(groupId).status === 'PLAYING') {
            startTurnTimer(ctx, groupId); 
        }
    }
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

module.exports = { nextTurn, startTurnTimer };