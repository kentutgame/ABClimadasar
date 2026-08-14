const supabase = require('../config/supabase');

const checkGroupRegistered = async (groupId) => {
    const { data, error } = await supabase
        .from('registered_groups')
        .select('*')
        .eq('group_id', groupId)
        .single();
    
    // Abaikan error PGRST116 (artinya data memang tidak ditemukan/grup belum terdaftar)
    if (error && error.code !== 'PGRST116') { 
        console.error('Error saat cek database grup:', error.message);
    }
    
    return data; // Akan menghasilkan 'null' jika grup tidak terdaftar
};

module.exports = {
    checkGroupRegistered
};

// Mengambil semua grup yang sudah terdaftar
const getRegisteredGroups = async () => {
    const { data, error } = await supabase.from('registered_groups').select('*');
    if (error) console.error('Error fetch groups:', error);
    return data || [];
};

// Mengambil data admin yang punya akses di grup tertentu
const getAdminsAccess = async (groupId) => {
    const { data, error } = await supabase
        .from('group_admins_access')
        .select('*')
        .eq('group_id', groupId);
    if (error) console.error('Error fetch admins:', error);
    return data || [];
};

// Memberi / mencabut akses admin (Toggle)
const toggleAdmin = async (groupId, userId, userName) => {
    // Cek apakah admin sudah ada di database
    const { data: existing } = await supabase
        .from('group_admins_access')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

    if (!existing) {
        // Jika belum ada, masukkan data baru dengan akses = TRUE
        await supabase.from('group_admins_access').insert([{
            group_id: groupId,
            user_id: userId,
            user_name: userName,
            can_manage_settinggrup: true
        }]);
    } else {
        // Jika sudah ada, balikkan statusnya (misal: dari TRUE ke FALSE)
        await supabase.from('group_admins_access')
            .update({ can_manage_settinggrup: !existing.can_manage_settinggrup })
            .eq('id', existing.id);
    }
};

// Jangan lupa export fungsi-fungsi barunya
module.exports = {
    checkGroupRegistered,
    getRegisteredGroups,
    getAdminsAccess,
    toggleAdmin
};

// Mengambil grup di mana user ini memiliki akses /settinggrup (Join tabel)
const getAuthorizedGroups = async (userId) => {
    const { data, error } = await supabase
        .from('group_admins_access')
        .select(`group_id, registered_groups ( group_name )`)
        .eq('user_id', userId)
        .eq('can_manage_settinggrup', true);
    
    if (error) console.error('Error fetch auth groups:', error);
    return data || [];
};

// Memberi / mencabut akses main mode custom (Toggle)
const togglePlayCustom = async (groupId, userId, userName) => {
    const { data: existing } = await supabase
        .from('group_admins_access')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

    if (!existing) {
        await supabase.from('group_admins_access').insert([{
            group_id: groupId,
            user_id: userId,
            user_name: userName,
            can_play_custom: true
        }]);
    } else {
        await supabase.from('group_admins_access')
            .update({ can_play_custom: !existing.can_play_custom })
            .eq('id', existing.id);
    }
};

// Pastikan kamu menambahkan fungsi baru ini ke dalam exports
module.exports = {
    checkGroupRegistered,
    getRegisteredGroups,
    getAdminsAccess,
    toggleAdmin,
    getAuthorizedGroups, // BARU
    togglePlayCustom     // BARU
};