import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';

import { TELEGRAM_API_KEY, TELEGRAM_CHAT_ID, SLEEP_MINUTES, CHAT_SECRET } from './config';
import { STORE } from './store';

const bot = new Telegraf(TELEGRAM_API_KEY);
const baseFolder = __dirname;
const filesToPublish = path.join(baseFolder, 'files');
const filesPublished = path.join(baseFolder, 'published');

bot.command('login', (ctx) => {
  const [, token] = ctx.message.text.split(' ');

  if (token === CHAT_SECRET) {
    STORE.loggedInUsers.push(ctx.message.from.id);
  }
});

bot.on('message', (ctx) => {
  if (!STORE.loggedInUsers.includes(ctx.message.from.id)) {
  }

  console.log('data', ctx);
});

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
  bot.launch();
})();

(async () => {
  while (true) {
    const [file] = fs.readdirSync(filesToPublish, {
      withFileTypes: true,
    });

    if (file) {
      const { name } = path.parse(file.name);

      const regExpRes = new RegExp(/(.+?) \[(.+)\]/).exec(name);

      if (!regExpRes) {
        throw new Error('bad_filename');
      }

      const [, fileName, tagsString] = regExpRes;

      const tags = tagsString.split(',').map((s) => s.trim());

      await bot.telegram.sendDocument(
        TELEGRAM_CHAT_ID,
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

    await sleep(SLEEP_MINUTES * 60);
  }
})();
