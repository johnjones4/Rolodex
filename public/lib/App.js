const { app, BrowserWindow, ipcMain } = require('electron')
const SQLiteStorageEngine = require('./storage/SQLiteStorageEngine')
const ElectronGoogleOAuth2 = require('@getstation/electron-google-oauth2').default
const consts = require('./consts')
const Sync = require('./Sync')
const Config = require('./Config')
const path = require('path')
const isDev = require('electron-is-dev')

class App {
  constructor () {
    this.storageEngine = null
    this.mainWindow = null
    this.config = new Config()
    this.setupAppListeners()
    this.setupIpcMainListeners()
  }

  createWindow () {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: 'Rolodex',
      webPreferences: {
        nodeIntegration: true
      }
    })
    
    const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../index.html')}`
  
    this.mainWindow.loadURL(startUrl)
  
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  setupAppListeners () {
    app.on('ready', async () => {
      await this.config.readConfig()
      this.createWindow()
    })
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })
    
    app.on('activate', () => {
      if (this.mainWindow === null) this.createWindow()
    })
    
    ipcMain.on('get-contacts', async event => {
      if (this.storageEngine) {
        try {
          const contacts = await this.storageEngine.getContacts()
          event.reply('contacts', {contacts})
        } catch (error) {
          event.reply('error', error.message)
          console.error(error)
        }
      }
    })
  }

  setupIpcMainListeners () {
    ipcMain.on('get-storage-dir', async (event, arg) => {
      event.returnValue = this.config.getStorageDir()
    })

    ipcMain.on('storage-is-ready', async (event, arg) => {
      event.returnValue = this.storageEngine !== null
    })

    ipcMain.on('set-storage', async (event, {directory, key}) => {
      try {
        if (directory !== this.config.getStorageDir()) {
          await this.config.setStorageDir(directory)
        }
        this.storageEngine = await SQLiteStorageEngine.defaultFactory(directory, key)
        event.reply('storage-ready')
      } catch (error) {
        event.reply('error', error.message)
        console.error(error)
      }
    })

    ipcMain.on('get-contact', async (event, arg) => {
      if (this.storageEngine) {
        try {
          const contact = await this.storageEngine.getContact(arg.contactId)
          event.reply('contact', {contact})
        } catch (error) {
          event.reply('error', error.message)
          console.error(error)
        }
      }
    })
    
    ipcMain.on('put-contact', async (event, arg) => {
      if (this.storageEngine) {
        try {
          await this.storageEngine.saveContact(arg.contact)
          const contact = await this.storageEngine.getContact(arg.contact.id)
          event.reply('contact', {contact})
        } catch (error) {
          event.reply('error', error.message)
          console.error(error)
        }
      }
    })
    
    ipcMain.on('get-settings', async event => {
      if (this.storageEngine) {
        try {
          const settings = await this.storageEngine.getSettings()
          event.reply('settings', {settings})
        } catch (error) {
          event.reply('error', error.message)
          console.error(error)
        }
      }
    })
    
    ipcMain.on('put-settings', async (event, arg) => {
      if (this.storageEngine) {
        try {
          await this.storageEngine.putSettings(arg.settings)
        } catch (error) {
          event.reply('error', error.message)
          console.error(error)
        }
      }
    })
    
    ipcMain.on('get-setting', async (event, {key}) => {
      if (this.storageEngine) {
        try {
          const setting = await this.storageEngine.getSetting(key)
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
        if (this.storageEngine) {
          const sync = new Sync(this.storageEngine)
          await sync.sync()
          const contacts = await this.storageEngine.getContacts()
          event.reply('contacts', {contacts})
          console.log('done')
        }
      } catch (error) {
        event.reply('error', error.message)
        console.error(error)
      }
    })    
  }
}

module.exports = App
