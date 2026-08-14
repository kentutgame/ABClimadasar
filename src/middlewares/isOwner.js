const { OWNER_ID } = require('../config/env');

const isOwner = (ctx, next) => {
    // Mengecek apakah ID pengirim pesan sama dengan OWNER_ID di .env
    if (ctx.from && ctx.from.id.toString() === OWNER_ID.toString()) {
        return next(); // Lanjut ke proses selanjutnya (tampilkan menu)
    }
    
    // Kalau yang ketik bukan Owner, bot akan diam saja (mengabaikan)
    return; 
};

module.exports = isOwner;