import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';

import { script } from './config';

const bot = new Telegraf(script.telegramApiKey);
const chatId = script.telegramChatId;
const baseFolder = __dirname;
const filesToPublish = path.join(baseFolder, 'files');
const filesPublished = path.join(baseFolder, 'published');

if (!fs.existsSync(filesToPublish)) {
  fs.mkdirSync(filesToPublish);
}

if (!fs.existsSync(filesPublished)) {
  fs.mkdirSync(filesPublished);
}

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

process.on('unhandledRejection', (error) => {
  throw error;
});

(async () => {
  bot.on('channel_chat_created', (data) => {
    console.log('channel_chat_created', data.chat.id);
  });

  bot.launch();
})();

(async () => {
  while (true) {
    const [file] = fs.readdirSync(filesToPublish, {
      withFileTypes: true,
    });

    if (file) {
      const { name } = path.parse(file.name);

      const regExpRes = new RegExp(/(\S+) \[(.+)\]/).exec(name);

      if (!regExpRes) {
        throw new Error('bad_filename');
      }

      const [, fileName, tagsString] = regExpRes;

      const tags = tagsString.split(',').map((s) => s.trim());

      await bot.telegram.sendDocument(
        chatId,
        {
          source: fs.readFileSync(path.join(filesToPublish, file.name)),
          filename: fileName,
        },
        {
          caption: tags.map((s) => `#${s}`).join(' '),
        }
      );

      console.log('published_file', file.name);

      await fs.renameSync(path.join(filesToPublish, file.name), path.join(filesPublished, file.name));

      console.log('moved_file', file.name);
    }

    console.log('waiting_next_file');

    await sleep(script.sleepMinutes * 60);
  }
})();
