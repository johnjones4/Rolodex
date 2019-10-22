class StorageEngine {
  async initializeStorageEngine() {
    return Promise.reject(new Error('Not implemented!'))
  }

  async getContacts () {
    return Promise.reject(new Error('Not implemented!'))
  }

  async getContact (contactId) {
    return Promise.reject(new Error('Not implemented!'))
  }

  async saveContact (contact) {
    return Promise.reject(new Error('Not implemented!'))
  }

  async removeContact (contact) {
    return Promise.reject(new Error('Not implemented!'))
  }

  async getSettings () {
    return Promise.reject(new Error('Not implemented!'))
  }

  async getSetting (key) {
    return Promise.reject(new Error('Not implemented!'))
  }

  async putSettings (settings) {
    return Promise.reject(new Error('Not implemented!'))
  }
}

module.exports = StorageEngine
