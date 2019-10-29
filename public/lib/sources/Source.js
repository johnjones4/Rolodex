const uuidv1 = require('uuid/v1')
const _ = require('lodash')
const { mergeContactInfo } = require('../util')

class Source {
  constructor (storageEngine, config) {
    this.storageEngine = storageEngine
    this.config = config
    this.requiresConfigResave = false
  }

  setRequiresConfigResave () {
    this.requiresConfigResave = true
  }

  getSourceKey () {
    if (!this.config.uuid) {
      this.config.uuid = uuidv1()
      this.setRequiresConfigResave()
    }
    return this.config.uuid
  }

  sourceMode () {
    return 'all'
  }

  isValid () {
    return false
  }

  async fetch () {
    return Promise.reject(new Error('Not implemented'))
  }

  async execute () {
    console.log('Syncing')
    const fetchedInfo = await this.fetch()
    const currentContacts = await this.storageEngine.getContacts()
    const dirtyContactIndicies = []
    const newContacts = []
    const removeContacts = []

    fetchedInfo.forEach(info => {
      const index = this.findExistingContactIndex(info, currentContacts)
      if (index >= 0) {
        dirtyContactIndicies.push(index)
        currentContacts[index].sources[this.getSourceKey()] = info
      } else if (this.sourceMode() === 'all') {
        const newIndex = this.findExistingContactIndex(info, newContacts)
        if (newIndex >= 0 && newContacts[newIndex].sources[this.getSourceKey()]) {
          newContacts[newIndex].sources[this.getSourceKey()] = mergeContactInfo([info, newContacts[newIndex].sources[this.getSourceKey()]])
        } else {
          const newContact = {
            info: {},
            sources: {},
            preferences: {}
          }
          newContact[this.getSourceKey()] = info
          newContacts.push(newContact)
        }
      }
    })

    currentContacts.forEach((contact, index) => {
      if (dirtyContactIndicies.indexOf(index) < 0) {
        const sources = _.keys(contact.sources)
        if (sources.length === 1 && sources[0] === this.getSourceKey()) {
          delete currentContacts[index].sources[this.getSourceKey()]
          dirtyContactIndicies.push(index)
        }
        if (_.keys(currentContacts[index].sources).length === 0) {
          removeContacts.push(contact)
        }
      }
    })

    await Promise.all(dirtyContactIndicies.map(async index => {
      await this.storageEngine.saveContact(currentContacts[index])
    }))

    await Promise.all(removeContacts.map(async contact => {
      await this.storageEngine.removeContact(contact)
    }))

    console.log('Done Syncing')
  }

  findExistingContactIndex (info, contacts) {
    return contacts.findIndex(_contact => {
      const foundEmail = _contact.info.emails.findIndex(row => {
        return info.emails.findIndex(_row => {
          return row.value === _row.value
        }) >= 0
      }) >= 0
      if (foundEmail) {
        return true
      }

      const foundPhone = _contact.info.phones.findIndex(row => {
        return info.phones.findIndex(_row => {
          return row.value === _row.value
        }) >= 0 && _contact.info.name.firstName === info.name.firstName && _contact.info.name.lastName === info.name.lastName
      }) >= 0
      if (foundPhone) {
        return true 
      }

      return false
    })
  }

  
}

module.exports = Source
