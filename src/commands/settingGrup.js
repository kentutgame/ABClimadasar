const { Markup } = require('telegraf');

const settingGrupCommand = async (ctx) => {
    // Ambil data grup yang sudah difilter oleh middleware
    const groups = ctx.state.authGroups; 

    // Bikin tombol berdasarkan grup yang dia punya akses
    const buttons = groups.map(g => [
        Markup.button.callback(g.registered_groups.group_name, `setgrp_${g.group_id}`)
    ]);

    await ctx.reply('🎮 *Menu Akses Bermain*\n\nPilih grup untuk mengatur siapa yang boleh main mode `/mainABCcustom`:', { 
        parse_mode: 'Markdown', 
        ...Markup.inlineKeyboard(buttons) 
    });
};

module.exports = settingGrupCommand;