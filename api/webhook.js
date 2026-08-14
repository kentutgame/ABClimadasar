const bot = require('../src/bot');

module.exports = async (req, res) => {
    try {
        // Menerima update dari Telegram dan meneruskannya ke bot
        await bot.handleUpdate(req.body, res);
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Terjadi kesalahan sistem!');
    }
};