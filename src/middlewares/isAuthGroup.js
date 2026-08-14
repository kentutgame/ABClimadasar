const { getAuthorizedGroups } = require('../services/dbService');

const isAuthGroup = async (ctx, next) => {
    const userId = ctx.from.id;
    // Cari apakah orang ini punya akses minimal di 1 grup
    const authGroups = await getAuthorizedGroups(userId);

    if (authGroups.length > 0) {
        // Simpan data grupnya agar bisa langsung dipakai untuk membuat tombol
        ctx.state.authGroups = authGroups; 
        return next();
    }
    
    // Kalau dia bukan admin yang diberi izin, bot akan diam saja
    return;
};

module.exports = isAuthGroup;