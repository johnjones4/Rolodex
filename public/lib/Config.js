const path = require('path')
const fs = require('fs-extra')

class Config {
  constructor () {
    this.path = Config.getDefaultPath()
    this.config = {
      storageDir: Config.getDefaultStorageDir()
    }
  }

  async readConfig () {
    if (await fs.pathExists(this.path)) {
      this.config = await fs.readJSON(this.path)
    }
  }

  async writeConfig () {
    await fs.writeJSON(this.path, this.config)
  }

  getStorageDir () {
    return this.config.storageDir
  }

  async setStorageDir (storageDir) {
    this.config.storageDir = storageDir
    await this.writeConfig()
  }

  static getDefaultPath () {
    const dir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
    return path.join(dir, '.rolodex.json')
  }

  static getDefaultStorageDir () {
    const dir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
    return path.join(dir, 'Rolodex')
  }
}

module.exports = Config
