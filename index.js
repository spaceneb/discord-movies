const config = require('./config.json')

const OMDBAPI = require('omdb-api-pt');
const omdb = new OMDBAPI({apiKey:config.omdb});

const imdb = require('imdb-light');

const TorrentSearchApi = require('torrent-search-api');
TorrentSearchApi.enableProvider('ThePirateBay');
TorrentSearchApi.enableProvider('1337x');
TorrentSearchApi.enableProvider('KickassTorrents');
TorrentSearchApi.enableProvider('TorrentProject');

const { Client, MessageEmbed } = require('discord.js');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
    new SlashCommandBuilder()
    .setName('movie')
    .setDescription('Search For Movie')
    .addStringOption(option =>
		option.setName('movie')
			.setDescription('The Movie Title')
			.setRequired(true))
]
.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(config.discord);

const client = new Client({ intents: [] });

rest.put(Routes.applicationCommands(config.clientid), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

rest.put(Routes.applicationGuildCommands(config.clientid, config.guildid), { body: commands })
	.then(() => console.log('Successfully registered guild commands.'))
	.catch(console.error);

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	const { commandName } = interaction;
    if (interaction.isCommand() && commandName === "movie") {
        interaction.deferReply();
        omdb.bySearch({
            search: interaction.options.getString('movie'),
            type: 'movie'
        }).then((search) => {
            search = search.Search;
            if (search.length > 0) {
                movie = search[0]
                interaction.editReply({ embeds: [getMovieData(movie)]});
            } else {
                interaction.editReply('No results found');
            }
        }).catch((e) => {
            console.error(e);
        });
    }
});

function getMovieData(movie) {
    var embed;
    try {
        imdb.fetch(movie.imdbID, (details) => {
            TorrentSearchApi.search(details.Title, 'Movies', 4).then((torrents) => {
                embed = new MessageEmbed()
                    .setColor('#EB459E')
                    .setTitle(details.Title)
                    .setURL(new URL('https://www.imdb.com/title/' + movie.imdbID))
                    .setDescription(details.Plot)
                    .addFields(
                        {
                            name: 'Rating | Votes',
                            value: details.Rating + ' | ' + details.Votes
                        },
                        {
                            name: 'Director',
                            value: details.Director,
                            inline: true
                        },
                        {
                            name: 'Genres',
                            value: details.Genres,
                            inline: true
                        },
                    )
                    .setImage(movie.Poster);  
            });
        });
    } catch(e) {
        console.error(e);
        embed = getMovieData(movie);
    }
    return embed;
}

client.login(config.discord);