const { Markup } = require('telegraf');
const { toggleAdmin, getAdminsAccess } = require('../services/dbService');

const toggleAdminAction = async (ctx) => {
    const groupId = ctx.match[1];
    const userId = ctx.match[2];
    
    try {
        // Ambil nama user untuk disimpan ke database
        const member = await ctx.telegram.getChatMember(groupId, userId);
        const userName = member.user.first_name;

        // Proses perubahan (Toggle) di Supabase
        await toggleAdmin(groupId, userId, userName);
        
        // --- Refresh tampilan tombol secara real-time ---
        const admins = await ctx.telegram.getChatAdministrators(groupId);
        const dbAdmins = await getAdminsAccess(groupId);
        
        const buttons = admins
            .filter(a => !a.user.is_bot)
            .map(a => {
                const hasAccess = dbAdmins.find(db => db.user_id.toString() === a.user.id.toString() && db.can_manage_settinggrup);
                const mark = hasAccess ? '✅ ' : '';
                return [Markup.button.callback(`${mark}${a.user.first_name}`, `adm_${groupId}_${a.user.id}`)];
            });
        
        buttons.push([Markup.button.callback('⬅️ Kembali', 'action_list_grup')]);
        
        await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
        await ctx.answerCbQuery('Akses diperbarui!');
    } catch (error) {
        console.error(error);
        await ctx.answerCbQuery('Terjadi kesalahan saat memproses data!', { show_alert: true });
    }
};

module.exports = toggleAdminAction;