// src/index.ts - Entry point (exception to index.ts rule for entry points)
import { createOperator } from "./operator";
import { loadConfig } from "./config";

const main = async (): Promise<void> => {
    const config = loadConfig();
    const operator = createOperator({ config });
    await operator.start();
};

main().catch((error) => {
    console.error("Failed to start operator:", error);
    process.exit(1);
});
