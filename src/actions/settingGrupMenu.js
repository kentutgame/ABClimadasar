const { Markup } = require('telegraf');
const { getAdminsAccess, togglePlayCustom } = require('../services/dbService');

// Aksi ketika grup dipilih dari menu /settinggrup
const detailSetGrupAction = async (ctx) => {
    const groupId = ctx.match[1];
    
    try {
        const admins = await ctx.telegram.getChatAdministrators(groupId);
        const dbAdmins = await getAdminsAccess(groupId);
        
        const buttons = admins
            .filter(a => !a.user.is_bot)
            .map(a => {
                // Cek apakah orang ini boleh main custom
                const hasAccess = dbAdmins.find(db => db.user_id.toString() === a.user.id.toString() && db.can_play_custom);
                const mark = hasAccess ? '✅ ' : '';
                
                // Format tombol: play_idgrup_iduser
                return [Markup.button.callback(`${mark}${a.user.first_name}`, `play_${groupId}_${a.user.id}`)];
            });
        
        await ctx.editMessageText('🎮 *Daftar Akses Bermain*\nKlik nama untuk memberi/mencabut akses mode `/mainABCcustom`:', { 
            parse_mode: 'Markdown', 
            ...Markup.inlineKeyboard(buttons) 
        });
    } catch (error) {
        await ctx.answerCbQuery('Gagal mengambil data dari Telegram.', { show_alert: true });
    }
};

// Aksi ketika nama ditekan (Toggle ceklis)
const togglePlayCustomAction = async (ctx) => {
    const groupId = ctx.match[1];
    const userId = ctx.match[2];
    
    try {
        const member = await ctx.telegram.getChatMember(groupId, userId);
        const userName = member.user.first_name;

        await togglePlayCustom(groupId, userId, userName);
        
        // Refresh tampilan tombol
        const admins = await ctx.telegram.getChatAdministrators(groupId);
        const dbAdmins = await getAdminsAccess(groupId);
        
        const buttons = admins
            .filter(a => !a.user.is_bot)
            .map(a => {
                const hasAccess = dbAdmins.find(db => db.user_id.toString() === a.user.id.toString() && db.can_play_custom);
                const mark = hasAccess ? '✅ ' : '';
                return [Markup.button.callback(`${mark}${a.user.first_name}`, `play_${groupId}_${a.user.id}`)];
            });
        
        await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
        await ctx.answerCbQuery('Akses bermain diperbarui!');
    } catch (error) {
        await ctx.answerCbQuery('Terjadi kesalahan!', { show_alert: true });
    }
};

module.exports = { detailSetGrupAction, togglePlayCustomAction };