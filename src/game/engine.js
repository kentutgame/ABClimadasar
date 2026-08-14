const activeGames = require('./state');
const kamus = require('../data/kamus.json');
const { startTurnTimer } = require('./handlers');

// Fungsi pembantu untuk mengacak array
const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const startGame = async (ctx, groupId) => {
    const game = activeGames.get(groupId);
    if (!game || game.status !== 'LOBBY') return;

    game.status = 'PLAYING';

    // 1. Pilih tema acak
    const themes = Object.keys(kamus);
    game.currentTheme = themes[Math.floor(Math.random() * themes.length)];

    // 2. Ambil semua huruf awal yang tersedia di tema ini, lalu acak
    const kataTersedia = kamus[game.currentTheme];
    const hurufTersedia = [...new Set(kataTersedia.map(kata => kata.charAt(0).toUpperCase()))];
    game.availableLetters = shuffleArray(hurufTersedia);

    // Ambil huruf pertama untuk dimainkan
    game.currentLetter = game.availableLetters.pop();

    // 3. Inisruktur Siklus & Anti-Duplikasi
    game.turnIndex = 0; 
    game.scores = {}; 
    game.answeredWords = []; // Menyimpan kata yang sudah ditebak agar tidak bisa dipakai lagi
    game.letterRoundCount = 1; // Hitungan putaran untuk 1 huruf (max 3 putaran)
    game.themeLetterCount = 1; // Hitungan total huruf untuk 1 tema (max 3 huruf)

    const currentPlayer = game.players[game.turnIndex];

    const pesan = `🚀 *Game Dimulai!*\n\nTema: *${game.currentTheme}*\nHuruf Depan: *${game.currentLetter}* *(Huruf ke-1 dari 3)*\nPutaran Huruf ke: *1 dari 3*\n\nGiliran menjawab: [${currentPlayer.name}](tg://user?id=${currentPlayer.id})\n\n⏳ Waktu kamu 60 detik!\nSilakan *Reply* (balas) pesan ini dengan jawabanmu!`;

    const sentMessage = await ctx.telegram.sendMessage(groupId, pesan, { parse_mode: 'Markdown' });
    game.lastQuestionMessageId = sentMessage.message_id;

    startTurnTimer(ctx, groupId);
};

module.exports = { startGame };