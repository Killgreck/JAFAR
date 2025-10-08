"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const service_1 = require("./service");
class WalletController {
    async getByUser(req, res, next) {
        try {
            const wallet = await (0, service_1.getWalletByUser)(req.params.userId);
            if (!wallet) {
                res.status(404).json({ message: 'Wallet not found' });
                return;
            }
            res.json(wallet);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { user, balance } = req.body;
            if (!user) {
                res.status(400).json({ message: 'user is required' });
                return;
            }
            const wallet = await (0, service_1.createWallet)({ user, balance });
            res.status(201).json(wallet);
        }
        catch (error) {
            next(error);
        }
    }
    async updateBalance(req, res, next) {
        try {
            const { balance } = req.body;
            if (typeof balance !== 'number') {
                res.status(400).json({ message: 'balance must be a number' });
                return;
            }
            const wallet = await (0, service_1.updateWalletBalance)(req.params.userId, balance);
            if (!wallet) {
                res.status(404).json({ message: 'Wallet not found' });
                return;
            }
            res.json(wallet);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WalletController = WalletController;
