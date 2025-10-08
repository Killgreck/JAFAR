"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const service_1 = require("./service");
class UsersController {
    async list(req, res, next) {
        try {
            const users = await (0, service_1.listUsers)();
            res.json(users);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const user = await (0, service_1.getUserById)(req.params.id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { email, username, password } = req.body;
            if (!email || !username || !password) {
                res.status(400).json({ message: 'email, username and password are required' });
                return;
            }
            const created = await (0, service_1.createUser)({
                email,
                username,
                passwordHash: password,
            });
            res.status(201).json(created);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UsersController = UsersController;
