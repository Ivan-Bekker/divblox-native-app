#!/usr/bin/env node
const { exec } = require('child_process');
const readline = require('node:readline/promises');
const fs = require('fs');

// Check if npx is installed
exec('command -v npx', async (error) => {
    if (error) {
        console.error("npx not available. Please install to continue.");
        process.exit(1);
    }
    const readLineInterface = readline.createInterface(process.stdin, process.stdout);

    const appName = await readLineInterface.question("What is your app name ?");
    const displayName = await readLineInterface.question("What is your app display name ?");
    const serverUrl = await readLineInterface.question("What is your server url ?");
    let bundleId = await readLineInterface.question("Wat is your app bundle Id ? Optional");

    if (bundleId.length < 1) {
        bundleId = `com.${appName}.app`;
    }

    const appDir = `./${appName}`;

    if (fs.existsSync(appDir)) {
        console.error(`The directory ${appName} already exists. To export to this directory, first remove it`);
        process.exit(1);
    }

    console.log("Cloning expo template");

    // Clone the template repository
    exec(`git clone https://github.com/Stratusolve-Inscape-Solutions/grip-native.git ${appName}`, (error) => {
        if (error) {
            console.error("Error cloning the template repository:", error.message);
            process.exit(1);
        }

        console.log("Updating app parameters...");

        const fileName = `${appName}/app.json`;

        // Define a function for search and replace
        const replaceAppParameters = (searchString, replaceValue, filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const updatedContent = content.replace(new RegExp(searchString, 'g'), replaceValue);
            fs.writeFileSync(filePath, updatedContent, 'utf8');
        };

        replaceAppParameters("{SERVER_URL}", serverUrl, fileName);
        replaceAppParameters("{NAME}", displayName, fileName);
        replaceAppParameters("{BUNDLE_ID}", bundleId, fileName);
        process.exit(0);
    });
});