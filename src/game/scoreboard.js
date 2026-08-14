const activeGames = require('./state');

const showLeaderboard = async (ctx, groupId, game, reasonTitle) => {
    // Urutkan skor dari yang paling tinggi ke rendah
    const sortedScores = Object.entries(game.scores || {})
        .sort((a, b) => b[1] - a[1]);

    let leaderboardText = `🏁 *${reasonTitle}*\n\n🏆 *LEADERBOARD AKHIR SKOR* 🏆\n`;

    if (sortedScores.length === 0) {
        leaderboardText += "\nBelum ada peserta yang berhasil mencetak poin.";
    } else {
        // Cocokkan ID dengan nama asli player di room
        sortedScores.forEach(([userId, score], index) => {
            const player = game.players.find(p => p.id.toString() === userId.toString());
            const playerName = player ? player.name : "Unknown Player";
            
            let medal = "";
            if (index === 0) medal = "🥇 ";
            else if (index === 1) medal = "🥈 ";
            else if (index === 2) medal = "🥉 ";
            else medal = `${index + 1}. `;

            leaderboardText += `\n${medal}${playerName} — *${score} Poin*`;
        });
    }

    leaderboardText += `\n\n_Poin telah direset. Terima kasih sudah bermain!_`;

    await ctx.telegram.sendMessage(groupId, leaderboardText, { parse_mode: 'Markdown' });
};

module.exports = { showLeaderboard };