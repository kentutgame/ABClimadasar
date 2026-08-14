const { Markup } = require('telegraf');
const { getRegisteredGroups, getAdminsAccess } = require('../services/dbService');

// Aksi ketika tombol "List Grup Terdaftar" ditekan
const listGrupAction = async (ctx) => {
    await ctx.answerCbQuery(); // Menghilangkan loading
    const groups = await getRegisteredGroups();
    
    if (groups.length === 0) {
        return ctx.editMessageText('Belum ada grup yang terdaftar.');
    }

    // Membuat tombol untuk masing-masing grup (Data disisipkan: grp_idgrup)
    const buttons = groups.map(g => [Markup.button.callback(g.group_name, `grp_${g.group_id}`)]);
    await ctx.editMessageText('📋 *List Grup Terdaftar*\n\nPilih grup untuk mengatur akses admin:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
};

// Aksi ketika salah satu nama grup ditekan
const detailGrupAction = async (ctx) => {
    const groupId = ctx.match[1]; // Mengambil ID Grup dari tombol
    try {
        // Tarik data admin dari Telegram API dan dari Supabase
        const admins = await ctx.telegram.getChatAdministrators(groupId);
        const dbAdmins = await getAdminsAccess(groupId);
        
        const buttons = admins
            .filter(a => !a.user.is_bot) // Jangan tampilkan bot di list
            .map(a => {
                // Cek apakah admin ini punya akses di database
                const hasAccess = dbAdmins.find(db => db.user_id.toString() === a.user.id.toString() && db.can_manage_settinggrup);
                const mark = hasAccess ? '✅ ' : '';
                
                // Format tombol: adm_idgrup_iduser
                return [Markup.button.callback(`${mark}${a.user.first_name}`, `adm_${groupId}_${a.user.id}`)];
            });
        
        buttons.push([Markup.button.callback('⬅️ Kembali', 'action_list_grup')]);
        
        await ctx.editMessageText('👤 *Daftar Admin Grup*\nKlik nama untuk memberi/mencabut akses /settinggrup:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
        await ctx.answerCbQuery('Gagal mengambil data admin (Pastikan bot masih jadi admin di grup itu).', { show_alert: true });
    }
};

module.exports = { listGrupAction, detailGrupAction };