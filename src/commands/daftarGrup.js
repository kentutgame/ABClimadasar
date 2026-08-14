const supabase = require('../config/supabase');

const daftarGrupCommand = async (ctx) => {
    // Mengambil ID grup dari teks perintah
    const text = ctx.message.text;
    const args = text.split(' ');
    
    if (args.length < 2) {
        return ctx.reply('Format salah! Gunakan: `/daftargrup <ID_GRUP>`', { parse_mode: 'Markdown' });
    }
    
    const groupId = args[1];

    try {
        // Mencoba mendapatkan informasi chat langsung dari API Telegram
        const chatInfo = await ctx.telegram.getChat(groupId);
        
        // Mengecek status bot di dalam grup tersebut
        const botMember = await ctx.telegram.getChatMember(groupId, ctx.botInfo.id);
        
        // Memastikan bot ada di grup dan berstatus admin
        if (botMember.status !== 'administrator') {
            return ctx.reply('masukin bot dulu ke grup anjir (dan pastikan bot jadi admin ya!)');
        }

        // Jika bot adalah admin di grup itu, simpan ke Supabase
        const { error } = await supabase
            .from('registered_groups')
            .insert([
                { group_id: groupId, group_name: chatInfo.title }
            ]);

        if (error) {
            // Error 23505 adalah kode untuk data unik (grup sudah ada di database)
            if (error.code === '23505') {
                return ctx.reply(`Grup *${chatInfo.title}* sudah terdaftar sebelumnya!`, { parse_mode: 'Markdown' });
            }
            console.error(error);
            return ctx.reply('Terjadi kesalahan saat menyimpan ke database.');
        }

        return ctx.reply(`Sukses! Grup *${chatInfo.title}* berhasil terdaftar.`, { parse_mode: 'Markdown' });

    } catch (error) {
        // Jika Telegram API error (biasanya karena bot belum pernah dimasukkan ke grup itu sama sekali)
        return ctx.reply('masukin bot dulu ke grup anjir');
    }
};

module.exports = daftarGrupCommand;