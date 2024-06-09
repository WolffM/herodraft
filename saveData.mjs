import fs from 'node:fs/promises';
let isSaving = false;
let isLoading = false;

export async function saveGameDataFields(filename, attributes) {
    if (isSaving) {
        console.log('loadGameData.Save is in progress...')
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    }
    if (isLoading) {
        console.log('loadGameData.Load is in progress...')
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    }

    isSaving = true;

    try {
        const filePath = 'genassets/savedgames/' + filename;
        let existingData = {};

        try {
            const existingJson = await fs.readFile(filePath); 
            existingData = JSON.parse(existingJson);
        } catch (err) {
            // File might not exist yet
        }

        // Update multiple attributes
        for (const attributeName in attributes) {
            existingData[attributeName] = attributes[attributeName];
        }

        const jsonString = JSON.stringify(existingData);
        await fs.writeFile(filePath, jsonString); 
    } catch (err) {
        console.error("saveGameDataFields.Error saving game data:", err);
    } finally {
        isSaving = false;
    }
}

export async function loadGameData(type, filename) {
    while (isSaving) { 
        console.log('loadGameData.Save is in progress...')
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    }

    isLoading = true;

    try {
        
        const filePath = 'genassets/' + type + '/' + filename;
        const jsonString = await fs.readFile(filePath);
        const gameData = JSON.parse(jsonString);
        return gameData;
    } catch (err) {
        console.error("loadGameData.Error loading game data:", err);
        return null; // Or provide a default starting game state
    } finally {
        isLoading = false;
    }
}

export async function saveGameData(gameData, filename) {
    const jsonString = JSON.stringify(gameData);

    try {
        await fs.mkdir('genassets/savedgames', { recursive: true });

        const filePath = 'genassets/savedgames/' + filename;
        await fs.writeFile(filePath, jsonString);
    } catch (err) {
        console.error("saveGameData.Error saving game data:", err);
    }
}