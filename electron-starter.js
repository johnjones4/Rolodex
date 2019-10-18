const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const SQLiteStorageEngine = require('./lib/storage/SQLiteStorageEngine')
const ElectronGoogleOAuth2 = require('@getstation/electron-google-oauth2').default
const consts = require('./lib/consts')
const Sync = require('./lib/Sync')

let mainWindow
let storageEngine

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Rolodex',
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL('http://localhost:3000')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

const initStorage = async () => {
  storageEngine = await SQLiteStorageEngine.defaultFactory('test')
}

app.on('ready', async () => {
  await initStorage()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

ipcMain.on('get-contacts', async event => {
  if (storageEngine) {
    try {
      const contacts = await storageEngine.getContacts()
      event.reply('contacts', {contacts})
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('get-contact', async (event, arg) => {
  if (storageEngine) {
    try {
      const contact = await storageEngine.getContact(arg.contactId)
      event.reply('contact', {contact})
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('put-contact', async (event, arg) => {
  if (storageEngine) {
    try {
      await storageEngine.saveContact(arg.contact)
      const contact = await storageEngine.getContact(arg.contact.id)
      event.reply('contact', {contact})
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('get-settings', async event => {
  if (storageEngine) {
    try {
      const settings = await storageEngine.getSettings()
      event.reply('settings', {settings})
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('put-settings', async (event, arg) => {
  if (storageEngine) {
    try {
      await storageEngine.putSettings(arg.settings)
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('get-setting', async (event, {key}) => {
  if (storageEngine) {
    try {
      const setting = await storageEngine.getSetting(key)
      event.reply('setting', setting)
    } catch (error) {
      event.reply('error', error.message)
      console.error(error)
    }
  }
})

ipcMain.on('authorize-google', async (event, arg) => {
  try {
    const myApiOauth = new ElectronGoogleOAuth2(
      consts.googleParams.clientId,
      consts.googleParams.clientSecret,
      [
        'https://www.googleapis.com/auth/contacts',
        'https://www.googleapis.com/auth/plus.login'
      ]
    );

    const tokenInfo = await myApiOauth.openAuthWindowAndGetTokens()
    console.log(tokenInfo)
    event.reply('authorized-google', {
      index: arg.index,
      tokenInfo
    })
  } catch (error) {
    event.reply('error', error.message)
    console.error(error)
  }
})

ipcMain.on('sync', async (event) => {
  try {
    if (storageEngine) {
      const sync = new Sync(storageEngine)
      await sync.sync()
      const contacts = await storageEngine.getContacts()
      event.reply('contacts', {contacts})
      console.log('done')
    }
  } catch (error) {
    event.reply('error', error.message)
    console.error(error)
  }
})
