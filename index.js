var Discord = require('discord.js');

var fs = require('fs');
var path = require('path');
var filePath = path.join(__dirname, 'tokens.json');

fs.readFile(filePath, {encoding: 'utf-8'}, function (err, data) {
  if (!err) {
    var botsToGenerate = JSON.parse(data);
    for (var botName in botsToGenerate) {
      var botdata = fs.readFileSync(path.join(__dirname, 'bots', botName + '.json'), {encoding: 'utf-8'});
      createBot(botsToGenerate[botName], JSON.parse(botdata));
    }
  } else {
    console.log(err);
    process.exit(1);
  }
});

function calculateTimeToType (sentence, speed) {
  return sentence.split('\\s+').length * (60 / speed) * 1000;
}

function createBot (token, botInfo) {
  var bot = new Discord.Client({autoReconnect: true});
  bot.login(token);
  botInfo.currentRandom = 0;
  bot.on('ready', function (event) {
    console.log('Logged in as %s - %s\n', bot.user.username, bot.user.id);
  });

  bot.on('message', function (message) {
    if (message.author.id !== bot.user.id) {
      var messageResponses = botInfo.responses.filter(function (ele) {
        return ele.responseTrigger !== '' && message.content.includes(ele.responseTrigger);
      });
      if (messageResponses[0]) {
        setTimeout(function () {
          message.channel.startTyping();
          if (message.author.bot === messageResponses[0].respondsToBot) {
            setTimeout(function (message, response) {
              message.channel.send(response.responseText);
              message.channel.stopTyping();
            }, calculateTimeToType(messageResponses[0].responseText, botInfo.typingSpeedWPM), message, messageResponses[0]);
          }
        }, botInfo.timeToRespondSeconds * 1000);
      }
    }
  });

  setTimeout(postXdRandom, botInfo.coolDownTimeSeconds * 1000, bot, botInfo);

  function postXdRandom (bot, botInfo) {
    var channelToPostIn = bot.channels.find('name', 'general');
    if (channelToPostIn) {
      var generalResponses = botInfo.responses.filter(function (ele) {
        return ele.responseTrigger === '';
      });
      if (generalResponses.length !== 0) {
        channelToPostIn.startTyping();
        setTimeout(function () {
          channelToPostIn.send(generalResponses[botInfo.currentRandom++].responseText);
          botInfo.currentRandom++;
          if (botInfo.currentRandom >= generalResponses.length) {
            botInfo.currentRandom = 0;
          }
          // I want to get off Mr Bones wild ride
          setTimeout(postXdRandom, botInfo.coolDownTimeSeconds * 1000, bot, botInfo);
        }, calculateTimeToType(generalResponses[botInfo.currentRandom].responseText, botInfo.typingSpeedWPM));
      }
    }
  }
}

/*
var bot = new Discord.Client({autoReconnect: true});

bot.login(process.env.TOKEN);

bot.on('ready', function (event) {
  console.log('Logged in as %s - %s\n', bot.user.username, bot.user.id);
});

bot.on('message', function (message) {
  console.log(message.author.username + ' - ' + message.author.id + ' - ' + message.channel.id + ' - ' + message.content);
  if (!message.author.bot) {
    message.channel.send('I too enjoy crypto!');
  }
});
*/
