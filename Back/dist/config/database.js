"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
mongoose_1.default.set('strictQuery', false);
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;
async function connectWithRetry(attempt = 1) {
    try {
        await mongoose_1.default.connect(environment_1.environment.mongodbUri);
        console.log('Connected to MongoDB');
    }
    catch (error) {
        if (attempt >= MAX_RETRIES) {
            console.error('Exceeded maximum retries connecting to MongoDB');
            throw error;
        }
        console.warn(`MongoDB connection failed (attempt ${attempt}). Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        await connectWithRetry(attempt + 1);
    }
}
async function connectToDatabase() {
    await connectWithRetry();
    mongoose_1.default.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
    });
    mongoose_1.default.connection.on('error', (err) => {
        console.error('MongoDB connection error', err);
    });
    return mongoose_1.default;
}
async function disconnectFromDatabase() {
    await mongoose_1.default.disconnect();
    console.log('Disconnected from MongoDB');
}
