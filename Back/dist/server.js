"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const app_1 = require("./app");
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
async function startServer() {
    const app = (0, app_1.createApp)();
    const port = environment_1.environment.port;
    await (0, database_1.connectToDatabase)();
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
    const shutdown = async () => {
        console.log('Shutting down server...');
        server.close(() => {
            console.log('HTTP server closed.');
        });
        await (0, database_1.disconnectFromDatabase)();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
