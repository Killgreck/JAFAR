"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBets = listBets;
exports.getBetById = getBetById;
exports.createBet = createBet;
const model_1 = require("./model");
async function listBets() {
    return model_1.BetModel.find().exec();
}
async function getBetById(id) {
    return model_1.BetModel.findById(id).exec();
}
async function createBet(data) {
    const created = await model_1.BetModel.create(data);
    return created;
}
