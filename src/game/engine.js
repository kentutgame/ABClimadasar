const activeGames = require('./state');
const kamus = require('../data/kamus.json');
const { startTurnTimer } = require('./handlers');
const { Markup } = require('telegraf'); 

// Fungsi pembuat jeda (delay) untuk animasi
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    game.answeredWords = []; 
    game.letterRoundCount = 1; 
    game.themeLetterCount = 1; 

    const currentPlayer = game.players[game.turnIndex];

    try {
        // ANIMASI FRAME 1: Mengacak
        const loadingMsg = await ctx.telegram.sendMessage(groupId, "🎲 *Mengacak Tema & Huruf...*", { parse_mode: 'Markdown' });
        game.lastQuestionMessageId = loadingMsg.message_id;

        await delay(1000); // Jeda 1 detik

        // CEK KEAMANAN 1: Batalin animasi kalau game keburu di-stop admin
        if (!activeGames.has(groupId) || activeGames.get(groupId).status !== 'PLAYING') return;

        // ANIMASI FRAME 2: Tema muncul
        await ctx.telegram.editMessageText(groupId, loadingMsg.message_id, undefined, `🎲 Tema Terpilih: *${game.currentTheme}*!\n🔤 Mengacak huruf...`, { parse_mode: 'Markdown' });

        await delay(1000); // Jeda 1 detik

        // CEK KEAMANAN 2: Batalin animasi kalau game keburu di-stop admin
        if (!activeGames.has(groupId) || activeGames.get(groupId).status !== 'PLAYING') return;

        // ANIMASI FRAME 3: Hasil Akhir + Tombol Skip
        const finalPesan = `Sebutkan *${game.currentTheme}* yang berawalan dari huruf *${game.currentLetter}*!\n\n(Putaran: ${game.letterRoundCount}/3)\n\nGiliran menjawab: [${currentPlayer.name}](tg://user?id=${currentPlayer.id})\n\n⏳ Waktu kamu 60 detik! *Reply* pesan ini dengan jawabanmu.`;

        const tombolSkip = Markup.inlineKeyboard([
            [Markup.button.callback('⏭️ Gua Skip', `skip_${groupId}`)]
        ]);

        await ctx.telegram.editMessageText(groupId, loadingMsg.message_id, undefined, finalPesan, { parse_mode: 'Markdown', ...tombolSkip });

        // Mulai timer setelah animasi selesai
        startTurnTimer(ctx, groupId);

    } catch (error) {
        console.error("Gagal menjalankan animasi pesan:", error);
        // Pastikan timer tidak berjalan kalau error / room sudah dihapus
        if (activeGames.has(groupId) && activeGames.get(groupId).status === 'PLAYING') {
            startTurnTimer(ctx, groupId); 
        }
    }
};

module.exports = { startGame };