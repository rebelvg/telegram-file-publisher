import * as fs from 'fs';

interface IStore {
  loggedInUsers: number[];
}

export let STORE: IStore = {
  loggedInUsers: [],
};

(() => {
  try {
    const storeFile = JSON.parse(fs.readFileSync('./store-data.json', { encoding: 'utf-8' }));

    STORE = {
      ...STORE,
      ...storeFile,
    };
  } catch (error) {}

  setInterval(() => {
    fs.writeFileSync('./store-data.json', JSON.stringify(STORE));
  }, 1000);
})();
