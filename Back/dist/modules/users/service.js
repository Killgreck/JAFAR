"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
const model_1 = require("./model");
async function listUsers() {
    return model_1.UserModel.find().exec();
}
async function getUserById(id) {
    return model_1.UserModel.findById(id).exec();
}
async function createUser(data) {
    const created = await model_1.UserModel.create(data);
    return created;
}
