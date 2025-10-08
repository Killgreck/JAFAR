"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const httpLogger_1 = require("./core/httpLogger");
const routes_1 = require("./modules/users/routes");
const routes_2 = require("./modules/bets/routes");
const routes_3 = require("./modules/wallet/routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use(httpLogger_1.httpLogger);
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.use('/api/users', routes_1.usersRouter);
    app.use('/api/bets', routes_2.betsRouter);
    app.use('/api/wallet', routes_3.walletRouter);
    app.use((_req, res) => {
        res.status(404).json({ message: 'Not Found' });
    });
    app.use((err, _req, res, _next) => {
        const status = err.status ?? 500;
        res.status(status).json({ message: err.message ?? 'Internal Server Error' });
    });
    return app;
}
