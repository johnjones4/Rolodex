const StorageEngine = require('./StorageEngine')
const { Database } = require('sqlite3')
const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')

class SQLiteStorageEngine extends StorageEngine {
  constructor (filePath, encKey) {
    super()
    this.filePath = filePath
    this.encKey = encKey
  }

  static async defaultFactory (directory, encKey) {
    await fs.ensureDir(directory)
    const filePath = path.join(directory, 'rolodex.sqlite')
    const engine = new SQLiteStorageEngine(filePath, encKey)
    await engine.initializeStorageEngine()
    return engine
  }

  async initializeStorageEngine() {
    await new Promise((resolve, reject) => {
      this.db = new Database(this.filePath, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })

    await this.dbExec('CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, info TEXT NOT NULL, preferences TEXT NOT NULL, sources TEXT NOT NULL, created NUMERIC NOT NULL, updated NUMERIC NOT NULL)', [])

    await this.dbExec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, version INTEGER NOT NULL, info TEXT NOT NULL, created NUMERIC NOT NULL, updated NUMERIC NOT NULL)', [])
  }

  async dbExec (stmt, params) {
    return new Promise((resolve, reject) => {
      this.db.run(stmt, params, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  async dbAll (stmt, params) {
    return new Promise((resolve, reject) => {
      this.db.all(stmt, params, (err, info) => {
        if (err) {
          return reject(err)
        }
        resolve(info)
      })
    })
  }

  async dbGet (stmt, params) {
    return new Promise((resolve, reject) => {
      this.db.get(stmt, params, (err, info) => {
        if (err) {
          return reject(err)
        }
        resolve(info)
      })
    })
  }

  encode (info) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encKey)
    let crypted = cipher.update(JSON.stringify(info), 'utf8', 'base64')
    crypted += cipher.final('base64')
    return crypted
  }

  decode (data) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encKey)
    let dec = decipher.update(data, 'base64', 'utf8')
    dec += decipher.final('utf8');
    return JSON.parse(dec)
  }

  decodeContact (contact) {
    return Object.assign({}, contact, {
      info: this.decode(contact.info),
      preferences: this.decode(contact.preferences),
      sources: this.decode(contact.sources)
    })
  }

  async getContacts () {
    const contactsEncrypted = await this.dbAll('SELECT * FROM contacts')
    
    const contacts = contactsEncrypted.map(contact => this.decodeContact(contact))

    return contacts
  }

  async getContact (contactId) {
    const contactEncrypted = await this.dbGet('SELECT * FROM contacts WHERE id = ?', [contactId])
    return this.decodeContact(contactEncrypted)
  }

  async saveContact (contact) {
    const info = this.encode(contact.info || {})
    const preferences = this.encode(contact.preferences || {})
    const sources = this.encode(contact.sources || {})
    const now = new Date().getTime()
    if (!contact.id) {
      await this.dbExec('INSERT INTO contacts (version, info, preferences, sources, created, updated) VALUES (?, ?, ?, ?, ?, ?)', [1, info, preferences, sources, now, now])
    } else {
      await this.dbExec('UPDATE contacts SET info = ?, preferences = ?, sources = ?, updated = ? WHERE id = ?', [info, preferences, sources, now, contact.id])
    }
  }

  async removeContact (contact) {
    if (!contact.id) {
      return Promise.reject(new Error('Contact has no ID'))
    }
    await this.dbExec('DELETE FROM contacts WHERE id = ?', [contact.id])
  }

  async getSettings () {
    const settingsEncrypted = await this.dbAll('SELECT * FROM settings', [])
    const settingsMap = {}
    settingsEncrypted.forEach(setting => {
      settingsMap[setting.key] = this.decode(setting.info)
    })
    return settingsMap
  }

  async getSetting (key) {
    const settingEncrypted = await this.dbGet('SELECT * FROM settings WHERE key = ?', [key])
    if (!settingEncrypted) {
      return null
    }
    return Object.assign({}, settingEncrypted, {
      info: this.decode(settingEncrypted.info)
    })
  }

  async putSettings (settings) {
    const now = new Date().getTime()
    const settingsArray = []
    for (let key in settings) {
      settingsArray.push({
        key,
        info: settings[key]
      })
    }
    await Promise.all(settingsArray.map(async setting => {
      const info = this.encode(setting.info)
      const settingsExists = !(!(await this.dbGet('SELECT * FROM settings WHERE key = ?', [setting.key]) ))
      if (!settingsExists) {
        await this.dbExec('INSERT INTO settings (key, version, info, created, updated) VALUES (?, ?, ?, ?, ?)', [setting.key, 1, info, now, now])
      } else {
        await this.dbExec('UPDATE settings SET info = ?, updated = ? WHERE key = ?', [info, now, setting.key])
      }
    }))
  }
}

module.exports = SQLiteStorageEngine
