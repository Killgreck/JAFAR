"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetsController = void 0;
const service_1 = require("./service");
class BetsController {
    async list(req, res, next) {
        try {
            const bets = await (0, service_1.listBets)();
            res.json(bets);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const bet = await (0, service_1.getBetById)(req.params.id);
            if (!bet) {
                res.status(404).json({ message: 'Bet not found' });
                return;
            }
            res.json(bet);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { creator, opponent, description, amount } = req.body;
            if (!creator || !description || typeof amount !== 'number') {
                res.status(400).json({ message: 'creator, description and amount are required' });
                return;
            }
            const created = await (0, service_1.createBet)({
                creator,
                opponent,
                description,
                amount,
            });
            res.status(201).json(created);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BetsController = BetsController;
