import Jimp from 'jimp';
import fs from 'fs';
import { saveGameDataFields } from './saveData.mjs';

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)); 
  }

export async function combineImagesForCombat(imagePath1, imagePath2, outputImagePath) {
    try {
        const [image1, image2, backgroundImage] = await Promise.all([
            Jimp.read(imagePath1),
            Jimp.read(imagePath2),
            Jimp.read('./assets/blank.png')
        ]);

        // Create a NEW image based on the background
        const combinedImage = backgroundImage.clone(); 

        // Composite onto the new image
        combinedImage.composite(image2, 50, 0);
        combinedImage.composite(image1, 1871, 0);

        // Save the new image
        await combinedImage.writeAsync(outputImagePath); 

        console.log('combineImagesForCombat.Images combined successfully!');
    } catch (error) {
        console.error('Error combining images:', error);
    }
}

export async function combineImagesForDraft(imagePath1, imagePath2, imagePath3, outputImagePath) {
    try {
        const [image1, image2, image3, backgroundImage] = await Promise.all([
            Jimp.read(imagePath1),
            Jimp.read(imagePath2),
            Jimp.read(imagePath3),
            Jimp.read('./assets/blankForDraft.png')
        ]);

        // Create a NEW image based on the background
        const combinedImage = backgroundImage.clone(); 

        // Composite onto the new image
        combinedImage.composite(image1, 0, 0);
        combinedImage.composite(image2, 1489, 0);
        combinedImage.composite(image3, 2978, 0);

        // Save the new image
        await combinedImage.writeAsync(outputImagePath); 

        console.log('combineImagesForCombat.Images combined successfully!');
    } catch (error) {
        console.error('Error combining images:', error);
    }
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const heroes = [
    {
        name: "Kitsune",
        currentHealth: 90,
        maxhealth: 90,
        damage: 20,
        metaTag: "Disruptor",
        abilityName: "Charm",
        energyCost: 4,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Dwarf",
        currentHealth: 100,
        maxHealth: 100,
        damage: 15,
        metaTag: "Momentum",
        abilityName: "Rage",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Ancestor",
        currentHealth: 100,
        maxHealth: 100,
        damage: 25,
        metaTag: "Specialist",
        abilityName: "Soulbond",
        energyCost: 1,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Angel",
        currentHealth: 90,
        maxHealth: 90,
        damage: 20,
        metaTag: "Support",
        abilityName: "Desperate Prayer",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Sorcerer",
        currentHealth: 90,
        maxHealth: 90,
        damage: 25,
        metaTag: "Cleave",
        abilityName: "Flame Nova",
        energyCost: 5,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Trapper",
        currentHealth: 90,
        maxHealth: 90,
        damage: 25,
        metaTag: "Cleave",
        abilityName: "Caltrops",
        energyCost: 2,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Venomancer",
        currentHealth: 90,
        maxHealth: 90,
        damage: 25,
        metaTag: "Cleave",
        abilityName: "Anthrax",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Witch",
        currentHealth: 100,
        maxHealth: 100,
        damage: 20,
        metaTag: "Disruptor",
        abilityName: "Curse",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Visebot",
        currentHealth: 100,
        maxHealth: 100,
        damage: 20,
        metaTag: "Disruptor",
        abilityName: "Rocket Grab",
        energyCost: 5,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Samurai",
        currentHealth: 100,
        maxHealth: 100,
        damage: 15,
        metaTag: "Momentum",
        abilityName: "Double Slash",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Vampire",
        currentHealth: 100,
        maxHealth: 100,
        damage: 15,
        metaTag: "Momentum",
        abilityName: "Blood is Power",
        energyCost: 1,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Captain",
        currentHealth: 90,
        maxHealth: 90,
        damage: 20,
        metaTag: "Support",
        abilityName: "Battlecry",
        energyCost: 3,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Ritualist",
        currentHealth: 90,
        maxHealth: 90,
        damage: 20,
        metaTag: "Support",
        abilityName: "Revive",
        energyCost: 6,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Ogre",
        currentHealth: 150,
        maxHealth: 150,
        damage: 30,
        metaTag: "Specialist",
        abilityName: "N/A",
        energyCost: 0,
        activeEffects: [], // Start with an empty array
        isAlive: true
    },    {
        name: "Assassin",
        currentHealth: 100,
        maxHealth: 100,
        damage: 25,
        metaTag: "Specialist",
        abilityName: "Snipe",
        energyCost: 2,
        activeEffects: [], // Start with an empty array
        isAlive: true
    }
];

export function createHeroDataFile() {
    // Prepare the data structure
    const heroData = {
        heroes: heroes
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(heroData, null, 2);  // Indent for readability

    // Write the JSON to a file
    fs.writeFile('./assets/hero_data.json', jsonString, (err) => {
        if (err) {
            console.error('Error writing hero data:', err);
        } else {
            console.log('Hero data saved to hero_data.json');
        }
    });
}

