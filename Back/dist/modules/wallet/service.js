"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletByUser = getWalletByUser;
exports.createWallet = createWallet;
exports.updateWalletBalance = updateWalletBalance;
const model_1 = require("./model");
async function getWalletByUser(userId) {
    return model_1.WalletModel.findOne({ user: userId }).exec();
}
async function createWallet(data) {
    const existing = await model_1.WalletModel.findOne({ user: data.user }).exec();
    if (existing) {
        return existing;
    }
    const created = await model_1.WalletModel.create({
        user: data.user,
        balance: data.balance ?? 0,
    });
    return created;
}
async function updateWalletBalance(userId, amount) {
    const wallet = await model_1.WalletModel.findOneAndUpdate({ user: userId }, { $set: { balance: amount } }, { new: true }).exec();
    return wallet;
}
