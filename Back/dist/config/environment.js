"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function parsePort(rawPort) {
    const port = Number(rawPort ?? '3000');
    if (Number.isNaN(port) || port <= 0) {
        throw new Error('Environment variable PORT must be a positive number');
    }
    return port;
}
function parseMongoUri(uri) {
    if (!uri) {
        throw new Error('Environment variable MONGODB_URI is required');
    }
    return uri;
}
function parseAppEnv(env) {
    const value = (env ?? 'development').toLowerCase();
    if (value === 'development' || value === 'production' || value === 'test') {
        return value;
    }
    throw new Error('Environment variable APP_ENV must be development, production, or test');
}
exports.environment = {
    port: parsePort(process.env.PORT),
    mongodbUri: parseMongoUri(process.env.MONGODB_URI),
    appEnv: parseAppEnv(process.env.APP_ENV),
};
