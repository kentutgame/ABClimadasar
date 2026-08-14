const { Markup } = require('telegraf');

const settingCommand = async (ctx) => {
    const pesan = "⚙️ *Menu Setting Utama*\n\nSilakan pilih fitur yang ingin kamu atur:";
    
    // Membuat tombol di bawah pesan
    const tombol = Markup.inlineKeyboard([
        [Markup.button.callback('➕ Pendaftaran Grup ID (Menu A)', 'action_daftar_grup')],
        [Markup.button.callback('📋 List Grup Terdaftar (Menu B)', 'action_list_grup')]
    ]);

    await ctx.reply(pesan, { parse_mode: 'Markdown', ...tombol });
};

module.exports = settingCommand;