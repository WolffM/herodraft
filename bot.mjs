import { saveGameData, saveGameDataFields, loadGameData } from './saveData.mjs';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { combineImagesForCombat, combineImagesForDraft, shuffleArray, delay } from './helper.mjs';

dotenv.config();
const TOKEN = process.env.DISCORD_TOKEN;o
let gameInProgress, challengerStarterChosen, opponentStarterChosen;
let skipDraft = true;
let changeInProgress = false;
let interactionsReceived = 0;
let draftRound = 1;
let challengerTeamName, opponentTeamName, currentPlayerId, otherPlayerId, otherPlayerName, currentPlayerName, challengerId, challengerName, opponentId, opponentName = '';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (gameInProgress) {
        if (message.content.startsWith('!resign') || message.content.startsWith('!ff')) {
            await handleResignation(message);
        }
        else {
            await message.author.reply({ content: 'A game is inprogress!', ephemeral: true });
        }
        return;
    } else if (message.content.startsWith('!herodraft3')) {
        await startHerodraft(message, 3);
    } else if (message.content.startsWith('!herodraft5')) {
        await startHerodraft(message, 5);
    } else if (message.content.startsWith('!herodraft0')) {
        await startHerodraft(message, 0);
    } else if (message.content.startsWith('!roll')) {
        await calculateRollResult(message.content.slice(5), message); // slice to remove '!roll'
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    else if (interaction.customId === 'herodraft_start') {

    } else if (interaction.customId.startsWith('draft_')) {
        const [, choice] = interaction.customId.split('_'); // Extract filename
        if (interaction.user.id !== currentPlayerId) {
            await interaction.reply({ content: `It's not your turn!`, ephemeral: true });
            return
        }

        const heroData = JSON.parse(fs.readFileSync('./assets/hero_data.json'));
        console.log(`interactionCreate.${currentPlayerName} chooses`, choice)
        const selectedHero = heroData.heroes.find(hero => hero.name === choice);

        if (!selectedHero) {
            console.error('Could not find matching hero!');
            return;
        }

        changeInProgress = true;
        let gameData = await loadGameData('savedgames', gameFilename);
        currentPlayerTeam = currentPlayerName + 'Team';
        gameData[currentPlayerTeam].push(selectedHero)

        console.log('interactionCreate.draft.saveGameData')
        await saveGameDataFields(gameFilename, {
            [currentPlayerTeam]: gameData[currentPlayerTeam]
        });

        const components = interaction.message.components;
        const newEmbed = new EmbedBuilder(); // Create new embed using existing data
        newEmbed.setTitle(`${otherPlayerName}'s draft pick`);

        if (interactionsReceived < 2) {
            const buttonToRemove = components[0].components.find(button => button.data.custom_id === interaction.customId);
            if (buttonToRemove) {
                const buttonIndex = components[0].components.indexOf(buttonToRemove);
                components[0].components.splice(buttonIndex, 1);
                await interaction.update({ embeds: [newEmbed], components: components })
            } else {
                console.error("interactionCreate.Couldn't find matching button to remove");
            }
        } else {
            const embed = new EmbedBuilder()
                .setTitle(`(draft round #${draftRound})`)
            draftRound++
            await interaction.update({ embeds: [embed], components: [] })
            console.log('interactionCreate.ending interaction')
        }
    }

    else if (interaction.customId.startsWith('startselect_')) {
        const [, playerId, heroName] = interaction.customId.split('_'); // Extract filename
        console.log(`interactionCreate.startSelect.playerId + heroName + interactionid : ${playerId} + ${heroName} + ${interaction.user.id}`)
        if (interaction.user.id !== playerId) {
            await interaction.reply({ content: `That's not your team!`, ephemeral: true });
            return
        }

        changeInProgress = true;
        if (playerId == challengerId) {
            challengerStarterChosen = heroName;
        } else {
            opponentStarterChosen = heroName;
        }
        interactionsReceived++
        console.log('interactionCreate.startSelect.recieved interaction');
        interaction.update({ content: 'Choice registered!', components: [], ephemeral: true });
    }

    else if (interaction.customId.startsWith('switchselect_')) {
        const [, playerId, heroName, gameFilename] = interaction.customId.split('_'); // Extract filename
        console.log(`interactionCreate.switchselect.playerId + heroName + interactionid : ${playerId} + ${heroName} + ${interaction.user.id}`)

        if (playerId === 'dead') {
            await interaction.reply({ content: `You can't switch into defeated heroes!`, ephemeral: true });
            return
        }
        else if (playerId === 'active') {
            await interaction.reply({ content: `That hero is already active!`, ephemeral: true });
            return
        }
        else if (interaction.user.id !== playerId) {
            await interaction.reply({ content: `That's not your team!`, ephemeral: true });
            return
        }
        changeInProgress = true;
        console.log('interactionCreate.switchselect.loadGameData')
        let gameData = await loadGameData('savedgames', gameFilename);
        if (playerId == challengerId) {
            await updateActiveHero(gameData, gameFilename, heroName, true); 
        } else {
            await updateActiveHero(gameData, gameFilename, heroName, false);
        }
        interaction.update({ content: 'Choice registered!', components: [], ephemeral: true });
    }

    else if (interaction.customId === 'herodraft_accept') {
        const opponent = interaction.user;
        const channel = interaction.channel
        let challenger = null;
        
        // Fetch recent messages to find the challenge
        const messages = await interaction.channel.messages.fetch({ limit: 10 }); // Adjust limit if needed
        const challengeMessage = messages.find(msg => msg.content.startsWith('!herodraft'));
        const draftSize = challengeMessage.toString().split('!herodraft')[1]

        if (challengeMessage) {
            challenger = challengeMessage.author;
        } else {
            // Handle case where no challenge message is found 
            await interaction.reply({ content: 'Could not find the original challenge message.', ephemeral: true });
            return;
        }

        if (challenger.id === opponent.id) { // Check if IDs match 
            await interaction.reply({ content: 'You cannot battle yourself!', ephemeral: true });
            return;
        }

        changeInProgress = true;

        // Create and send the game start embed
        const embed = new EmbedBuilder()
            .setTitle('Draft Starting!')
            .setDescription(`${challenger.username} vs ${opponent.username}`);

        // Modify response to remove button and send embed
        await interaction.update({ embed: embed, components: [] });

        let gameCounter = 1;
        let gameFilename = '';
        const now = new Date();
        const dateString = now.toISOString().substring(0, 10); // YYYY-MM-DD format
        do {
            gameFilename = `${dateString}-${gameCounter}-${challenger.username}-vs-${opponent.username}.json`;
            if (fs.existsSync(`genassets/savedgames/${gameFilename}`)) {
                gameCounter++;
            } else {
                break; // Found a unique filename
            }
        } while (true);

        console.log('interactionCreate.herodraft_accept.gameFilename', gameFilename)

        challengerId = challenger.id;
        challengerName = challenger.username;
        opponentId = opponent.id;
        opponentName = opponent.username;

        challengerTeamName = challengerName + 'Team'
        opponentTeamName = opponentName + 'Team'

        if (Math.random() < 0.5) {
            currentPlayerId = challenger.id;
            currentPlayerName = challenger.username;
            otherPlayerId = opponent.id;
            otherPlayerName = opponent.username;
            await channel.send(`${challenger.username.toString()} won the coin toss and goes first!`);
        } else {
            currentPlayerId = opponent.id;
            currentPlayerName = opponent.username
            otherPlayerId = challenger.id;
            otherPlayerName = challenger.username;
            await channel.send(`${opponent.username.toString()} won the coin toss and goes first!`);
        }

        // Initialize game data
        const gameData = {
            activeChallengerHero: {},
            activeOpponentHero: {},
            [challengerTeamName]: [],
            [opponentTeamName]: [],
            challengerEnergy: 3,
            opponentEnergy: 3,
            channelId: channel.id,
        };

        // Save initial game state
        await saveGameData(gameData, gameFilename);

        // Start the game
        await heroDraft(channel, parseInt(draftSize), gameFilename);
    }

    else if (interaction.customId.startsWith('herodraft_')) {
        const [, actionType, gameFilename] = interaction.customId.split('_'); // Extract filename

        console.log('interactionCreate.herodraft.loadingGameData')
        let gameData = await loadGameData('savedgames', gameFilename);

        if (!gameData) {
            await interaction.reply({ content: "Could not load game data.", ephemeral: true });
            return;
        }
        console.log('interactionCreate.herodraft.actionType', actionType)
        if (interaction.user.id !== currentPlayerId) {
            await interaction.reply({ content: `It's not your turn!`, ephemeral: true });
            return
        }

        changeInProgress = true;
        // **** ATTACK HANDLER ****
        if (actionType === 'attack') {
            let activeChallengerHero = gameData.activeChallengerHero
            let activeOpponentHero = gameData.activeOpponentHero
            let damageDealt = 0;
            let currentHeroName = '';

            if (currentPlayerId === challengerId) {
                activeOpponentHero.currentHealth -= 100
                if(activeOpponentHero.currentHealth <= 0 ){
                    activeOpponentHero.isAlive = false;   
                }
                damageDealt = activeChallengerHero.damage
                currentHeroName = activeChallengerHero.name
                console.log('interactionCreate.attack.saveGameData')
                await saveGameDataFields(gameFilename, {
                    activeOpponentHero: activeOpponentHero
                });
                console.log('interactionCreate.attack.reducing opponent Health')
            } else {
                activeChallengerHero.currentHealth -= 100
                if(activeChallengerHero.currentHealth <= 0 ){
                    activeChallengerHero.isAlive = false;   
                }
                damageDealt = activeOpponentHero.damage
                currentHeroName = activeOpponentHero.name
                console.log('interactionCreate.attack.saveGameData')
                await saveGameDataFields(gameFilename, {
                    activeChallengerHero: activeChallengerHero
                });
                console.log('interactionCreate.attack.reducing challenger Health')
            }
            await interaction.update({ components: [] })
            
            await interaction.followUp(`${currentHeroName} attacked and dealt ${damageDealt} damage!`);
        }
        // **** SWITCH HANDLER ****
        else if (actionType === 'switch') {
            await interaction.update({ components: [] })
            handleHeroSwitch(gameData, currentPlayerName, currentPlayerId, gameFilename, interaction, false)
        }
        // **** ABILITY HANDLER ****
        else if (actionType === 'ability') {
            console.log('interactionCreate.ability.not implemented')
        }
        changeInProgress = false;
        return
    }
    changeInProgress = false;
});

export function swapPlayers() {
    const tempPlayerId = currentPlayerId;
    const tempPlayerName = currentPlayerName;
    currentPlayerId = otherPlayerId;
    otherPlayerId = tempPlayerId;
    currentPlayerName = otherPlayerName;
    otherPlayerName = tempPlayerName;
}

async function handleHeroSwitch(gameData, playerName, playerId, gameFilename, interaction, forceSwitch = true) {
    let activeHeroName = '';
    let channel = forceSwitch ? client.channels.cache.get(gameData.channelId) : '';

    if (playerId === challengerId) {
        activeHeroName = gameData.activeChallengerHero.name;
    } else {
        activeHeroName = gameData.activeOpponentHero.name;
    }

    const switchSelection = forceSwitch ? await channel.send({
        content: `${playerName}'s switch selection...`,
        components: [
            createHeroSelectionButtons(gameData, playerName, playerId, gameFilename, true, activeHeroName)
        ],
    }) : await interaction.channel.send({
        content: `${playerName}'s switch selection...`,
        components: [
            createHeroSelectionButtons(gameData, playerName, playerId, gameFilename, true, activeHeroName)
        ],
    });

    console.log('handleHeroSwitch.awaitingSelectionSelect')
    const switchSelectionInteraction = await switchSelection.awaitMessageComponent({ filter: i => i.user.id === playerId && i.customId.startsWith('switchselect'), time: 600000 });
    console.log('handleHeroSwitch.completed switch');
    
    if(!forceSwitch){
        await interaction.followUp(`${playerName.toString()} switched out their active hero!`);
    }
}

async function startHerodraft(message, draftSize) {
    // Create the button 
    const button = new ButtonBuilder()
        .setLabel('Accept Challenge')
        .setStyle(ButtonStyle.Success)
        .setCustomId('herodraft_accept');

    // Create the Action Row
    const view = new ActionRowBuilder()
        .addComponents(button);

    const challengeMsg = await message.channel.send({
        content: `${message.author.toString()} has issued a Hero Draft challenge!`,
        components: [view]
    });
}


async function handleResignation(message) {
    gameInProgress = false
    await channel.send(`${message.author()} has resigned!`);
}

async function heroDraft(channel, draftSize, gameFilename) {
    const heroData = JSON.parse(fs.readFileSync('./assets/hero_data.json'));
    const imagePromises = [];
    let draftPool = [...heroData.heroes];

    shuffleArray(draftPool); // Shuffle the hero pool

    console.log('heroDraft.draftsize:', draftSize)

    if (!skipDraft) {

        await channel.send(`The draft between ${challengerName} and ${opponentName} begins!`);

        for (let i = 0; i < draftSize * 3; i += 3) { // Loop for each draft set
            const hero1 = draftPool[i];
            const hero2 = draftPool[i + 1];
            const hero3 = draftPool[i + 2];

            const hero1Path = './assets/' + hero1.name + 'Combat.png'
            const hero2Path = './assets/' + hero2.name + 'Combat.png'
            const hero3Path = './assets/' + hero3.name + 'Combat.png'
            console.log(`heroDraft.building: './genassets/images/draft/' + ${hero1.name} + '+' + ${hero2.name} + '+' + ${hero3.name} + 'Draft.png'`)
            const outputImagePath = './genassets/images/draft/' + hero1.name + '+' + hero2.name + '+' + hero3.name + 'Draft.png';
            const imagePromise = combineImagesForDraft(hero1Path, hero2Path, hero3Path, outputImagePath)
            imagePromises.push(imagePromise);
        }

        for (const imagePromise of imagePromises) {
            const firstGeneratedImage = await imagePromise;
            if (firstGeneratedImage) break; // Got the image
        }

        for (let j = 0; j < draftSize * 3; j += 3) {
            const hero1 = draftPool[j];
            const hero2 = draftPool[j + 1];
            const hero3 = draftPool[j + 2];
            const draftImagePath = './genassets/images/draft/' + hero1.name + '+' + hero2.name + '+' + hero3.name + 'Draft.png';

            const embed = new EmbedBuilder()
                .setTitle(`${currentPlayerName}'s draft pick`)
                .setImage('attachment://' + draftImagePath);

            // Setup buttons using hero names (You'll need the images)
            const view = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder().setLabel(hero1.name).setStyle(ButtonStyle.Success).setCustomId(`draft_${hero1.name}_${gameFilename}`),
                    new ButtonBuilder().setLabel(hero2.name).setStyle(ButtonStyle.Success).setCustomId(`draft_${hero2.name}_${gameFilename}`),
                    new ButtonBuilder().setLabel(hero3.name).setStyle(ButtonStyle.Success).setCustomId(`draft_${hero3.name}_${gameFilename}`)
                ]);

            const message = await channel.send({
                embeds: [embed],
                files: [
                    new AttachmentBuilder(fs.readFileSync(draftImagePath), { name: draftImagePath })
                ],
                components: [view]
            });

            interactionsReceived = 0;
            while (interactionsReceived < 2) {
                const filter = (i) => i.customId.startsWith('draft_') && currentPlayerId == i.user.id;
                const buttonInteraction = await message.awaitMessageComponent({ filter, time: 600000 /* Timeout */ })
                    .catch(error => {
                        console.error('heroDraft.Draft timeout or error:', error);
                        return null;
                    });

                if (!buttonInteraction) continue; // Timeout or error

                swapPlayers()
                console.log('heroDraft.interactionsReceived')
                interactionsReceived++;
            }
            swapPlayers()
        }
    } else {
        const challengerTeam = [];
        const opponentTeam = [];

        for (let i = 0; i < draftSize * 2; i++) {
            const hero = draftPool.pop(); // Remove the last hero from draftPool
            if (i < draftSize) {
                challengerTeam.push(hero);
            } else {
                opponentTeam.push(hero);
            }
        }

        console.log('heroDraft.saveGameData')
        await saveGameDataFields(gameFilename, {
            [challengerTeamName]: challengerTeam,
            [opponentTeamName]: opponentTeam
        });
    }

    console.log('heroDraft.loadGameData')
    let gameData = await loadGameData('savedgames', gameFilename);
    console.log('heroDraft.opponentId', opponentId)
    console.log('heroDraft.opponentName', opponentName)
    console.log('heroDraft.challengerId', challengerId)
    console.log('heroDraft.challengerName', challengerName)


    const challengerSelection = await channel.send({
        content: `${challengerName}'s starting hero selection...`,
        components: [
            createHeroSelectionButtons(gameData, challengerName, challengerId, gameFilename)
        ],
    });

    const opponentSelection = await channel.send({
        content: `${opponentName}'s starting hero selection...`,
        components: [
            createHeroSelectionButtons(gameData, opponentName, opponentId, gameFilename)
        ],
    });

    const [challengerButtonInteraction, opponentButtonInteraction] = await Promise.all([
        challengerSelection.awaitMessageComponent({ filter: i => i.user.id === challengerId && i.customId.startsWith('startselect_'), time: 600000 }),
        opponentSelection.awaitMessageComponent({ filter: i => i.user.id === opponentId && i.customId.startsWith('startselect_'), time: 600000 })
    ]);

    if (opponentStarterChosen && challengerStarterChosen) {
        const challengerHero = gameData[challengerTeamName].find(hero => hero.name === challengerStarterChosen);
        const opponentHero = gameData[opponentTeamName].find(hero => hero.name === opponentStarterChosen);

        gameData[challengerTeamName] = gameData[challengerTeamName].filter(hero => hero.name !== challengerStarterChosen);
        gameData[opponentTeamName] = gameData[opponentTeamName].filter(hero => hero.name !== opponentStarterChosen);

        // Save the updated game data (no changes needed here)
        console.log('heroDraft.saveGameData')
        await saveGameDataFields(gameFilename, {
            activeChallengerHero: challengerHero,
            activeOpponentHero: opponentHero,
            [challengerTeamName]: gameData[challengerTeamName],
            [opponentTeamName]: gameData[opponentTeamName]
        });

    } else {
        console.log(`heroDraft.failed to get both hero's ):`)
    }

    heroGame(channel, gameFilename)
}

async function updateActiveHero(gameData, gameFilename, heroName, isChallenger) {
    const teamName = isChallenger ? challengerTeamName : opponentTeamName;
    const activeHeroProperty = isChallenger ? 'activeChallengerHero' : 'activeOpponentHero';
    console.log('updateActiveHero.Start')

    // Bench current active hero
    gameData[teamName].push(gameData[activeHeroProperty]);

    // Get new active hero
    const updatedActiveHero = gameData[teamName].find(hero => hero.name === heroName);

    // Remove new active hero from bench
    gameData[teamName] = gameData[teamName].filter(hero => hero.name !== heroName); 

    // Save updated game data
    console.log('updateActiveHero.saveGameData')
    await saveGameDataFields(gameFilename, {
        [activeHeroProperty]: updatedActiveHero,
        [teamName]: gameData[teamName]
    });
    
}
async function heroGame(channel, gameFilename) {
    await channel.send(`The game between ${challengerName} and ${opponentName} begins!`);
    const energyBarLength = 10;
    let turnCount = 1;

    while (true) {
        while(changeInProgress){
            console.log('Change in progress...')
            await delay(1000)
        }
        turnCount++
        swapPlayers()

        console.log('interactionCreate.heroGame.loadGameData')
        let gameData = await loadGameData('savedgames', gameFilename);

        let activeChallengerHero = gameData.activeChallengerHero;
        let activeOpponentHero = gameData.activeOpponentHero;
        const { challengerEnergy, opponentEnergy, channelId } = gameData;

        if (activeChallengerHero.currentHealth <= 0) {
            await channel.send(`${activeChallengerHero.name} has been defeated...`);
            if (!(gameData[challengerTeamName].find(hero => hero.isAlive === true))) {
                console.log('heroGame.ChallengerDefeated.EndGame')
                await channel.send(`${challengerName} has lost!`);
                gameInProgress = false
                break;
            } else {
                console.log('heroGame.ChallengerDefeated.StartHeroSwitch')
                await handleHeroSwitch(gameData, challengerName, challengerId, gameFilename, null)
                turnCount--
                continue
            }
        }
        if (activeOpponentHero.currentHealth <= 0) {
            await channel.send(`${activeOpponentHero.name} has been defeated...`);
            if (!(gameData[opponentTeamName].find(hero => hero.isAlive === true))) {
                console.log('heroGame.OpponentDefeated.EndGame')
                await channel.send(`${opponentName} has lost!`);
                gameInProgress = false;
                break;
            } else {
                console.log('heroGame.OpponentDefeated.StartHeroSwitch')
                await handleHeroSwitch(gameData, opponentName, opponentId, gameFilename, null)
                turnCount--
                continue
            }
        }

        const challengerCombatImagePath = './assets/' + activeChallengerHero.name + 'Combat.png'
        const opponentCombatImagePath = './assets/' + activeOpponentHero.name + 'Combat.png'
        const outputCombatImagePath = './genassets/images/combat/' + activeChallengerHero.name + '_vs_' + activeOpponentHero.name + 'Combat.png'
        const challengerEnergyBar = " [" + "⚡️".repeat(challengerEnergy) + "-".repeat(energyBarLength - challengerEnergy) + "] ";
        const opponentEnergyBar = " [" + "⚡️".repeat(opponentEnergy) + "-".repeat(energyBarLength - opponentEnergy) + "] ";

        if (!fs.existsSync(outputCombatImagePath)) {
            await combineImagesForCombat(opponentCombatImagePath, challengerCombatImagePath, outputCombatImagePath)
        }

        const outputImage = fs.readFileSync(outputCombatImagePath);

        const TitleEmbed = new EmbedBuilder().setTitle(`${currentPlayerName}'s Turn`)
        await channel.send({ embeds: [TitleEmbed] })

        const embed = new EmbedBuilder()
            .addFields(
                { name: activeChallengerHero.name, value: `${activeChallengerHero.currentHealth} HP`, inline: true },
                { name: '\u200b', value: '\u200b ', inline: true }, // Add an empty field for spacing
                { name: activeOpponentHero.name, value: `${activeOpponentHero.currentHealth} HP`, inline: true },
                { name: challengerName, value: challengerEnergyBar, inline: true },
                { name: '\u200b', value: '\u200b ', inline: true }, // Add an empty field for spacing
                { name: opponentName, value: opponentEnergyBar, inline: true },
            )
            //.setThumbnail('attachment://' + challengerCombatImagePath) // Challenger on left
            //.setImage('attachment://' + opponentCombatImagePath);   // Opponent on right
            .setImage('attachment://' + outputCombatImagePath)
            .setTitle(`Turn ${turnCount} \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B`);

        const attackButton = new ButtonBuilder()
            .setLabel('Attack')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`herodraft_attack_${gameFilename}`);

        const abilityButton = new ButtonBuilder()
            .setLabel('Ability')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`herodraft_ability_${gameFilename}`);

        const switchButton = new ButtonBuilder()
            .setLabel('Switch')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`herodraft_switch_${gameFilename}`);

        const view = new ActionRowBuilder()
            .addComponents(attackButton, abilityButton, switchButton);

        await channel.send({
            embeds: [embed],
            files: [
                //new AttachmentBuilder(challengerImage, { name:  }),
                new AttachmentBuilder(outputImage, { name: outputCombatImagePath })
            ],
            components: [view]
        });

        // Wait for interaction
        try {
            const filter = (m) => {
                if (m.author.username.includes('checkmage-bot') &&
                    m.channelId.includes(channelId) &&
                    !m.content.includes('switch selection...')) {
                    return true;
                }
            }
            await channel.awaitMessages({ filter, max: 1, time: 600_0000, errors: ['time'] })

        } catch (error) {
            if (error.name === 'TimeoutError') {
                await channel.send(`${currentPlayerName} took too long to decide!`);
            } else {
                console.error("heroGame.Error waiting for interaction:", error);
            }
        }
    }
}

function createHeroSelectionButtons(gameData, playerName, playerId, gameFilename, isSwitch = false, activeHeroName = '') {
    const teamData = gameData[playerName + 'Team']
    const customIdLabel = isSwitch ? 'switchselect' : 'startselect';

    let buttons = teamData
        .filter(hero => !isSwitch || (!hero.name.includes(activeHeroName) && hero.isAlive === true))
        .map(hero =>
            new ButtonBuilder()
                .setLabel(hero.name)
                .setStyle(ButtonStyle.Success)
                .setCustomId(`${customIdLabel}_${playerId}_${hero.name}_${gameFilename}`)
        );

    if (isSwitch) {
        const deadHeroes = teamData
            .filter(hero => (hero.isAlive === false))
            .map(hero =>
                new ButtonBuilder()
                    .setLabel(hero.name)
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId(`${customIdLabel}_dead_${playerId}_${hero.name}_${gameFilename}`)
            );

        const activeHero = teamData
            .filter(hero => (hero.name.includes(activeHeroName) && hero.isAlive === true))
            .map(hero =>
                new ButtonBuilder()
                    .setLabel(hero.name)
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`${customIdLabel}_active_${playerId}_${hero.name}_${gameFilename}`)
            );

        if (activeHero.length > 0) {
            buttons.push(...activeHero);
        }
        if (deadHeroes.length > 0) {
            buttons.push(...deadHeroes);
        }
    }

    return new ActionRowBuilder().addComponents(buttons);
}

async function calculateRollResult(rollString, message) {
    const dicePattern = /(\d+d\d+)(?:\s*(\+|-)\s*(\d+d\d+|\d+))?/g;

    let longMess = false;
    const rolls = [];
    let total = 0;
    let difficulty = 1;
    let maxroll = 0;

    // Find all dice patterns using the regular expression
    let match;
    while ((match = dicePattern.exec(rollString)) !== null) {
        const [_, numDiceStr, operator, modifierStr] = match; // Destructure the match results
        const numDice = parseInt(numDiceStr.split('d')[0]);
        const dieType = parseInt(numDiceStr.split('d')[1]);

        difficulty *= numDice * dieType;
        maxroll += numDice * dieType;

        if (numDice > 1) {
            longMess = true;
        }

        // Generate individual die rolls
        const roll = [];
        for (let i = 0; i < numDice; i++) {
            roll.push(Math.floor(Math.random() * dieType) + 1);
        }
        rolls.push(roll);
        total += roll.reduce((sum, val) => sum + val, 0); // Calculate the sum of the roll

        // Process Modifier (if present)
        if (operator) {
            if (operator === '+' && modifierStr.match(/^\d+$/)) { // Check for flat number modifier
                maxroll += parseInt(modifierStr);
                total += parseInt(modifierStr);
            } else if (modifierStr.match(/\d+d\d+/)) {      // Check for another dice roll modifier
                const [modNumDiceStr, modDieTypeStr] = modifierStr.split('d');
                const modNumDice = parseInt(modNumDiceStr);
                const modDieType = parseInt(modDieTypeStr);

                difficulty *= modNumDice * modDieType;
                maxroll += modNumDice * modDieType;

                const modRoll = [];
                for (let i = 0; i < modNumDice; i++) {
                    modRoll.push(Math.floor(Math.random() * modDieType) + 1);
                }
                rolls.push(modRoll);

                if (operator === '+') {
                    total += modRoll.reduce((sum, val) => sum + val, 0);
                } else {
                    total -= modRoll.reduce((sum, val) => sum + val, 0);
                }
            }
        }
    }

    // Construct Output Message
    let output = `${message.author.toString()} rolled `;

    if (longMess) {
        output += `(${rolls.flat().join(', ')}) `; // Flatten the 'rolls' array
    }
    output += `Total: ${total}!`;

    // Critical Success/Failure
    if (difficulty >= 20) {
        if (total === maxroll) {
            output += " CRITICAL SUCCESS!";
        } else if (total === rolls.length) { // Note the slight change here
            output += " Critical Failure...";
        }
    }

    await message.channel.send(output);
}

if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("No Discord bot token provided.");
}