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

    fetchedInfo.forEach(info => {
      const index = this.findExistingContactIndex(info, currentContacts)
      if (index >= 0) {
        currentContacts[index].sources[this.getSourceKey()] = info
        currentContacts[index].info = mergeContactInfo(_.values(currentContacts[index].sources))
        dirtyContactIndicies.push(index)
      } else if (this.sourceMode() === 'all') {
        const newIndex = this.findExistingContactIndex(info, newContacts)
        if (newIndex >= 0 && newContacts[newIndex].sources[this.getSourceKey()]) {
          newContacts[newIndex].sources[this.getSourceKey()] = mergeContactInfo([info, newContacts[newIndex].sources[this.getSourceKey()]])
          newContacts[newIndex].info = mergeContactInfo(_.values(newContacts[newIndex].sources))
        } else {
          const newContact = {
            info: {
              name: {
                prefix: null,
                firstName: null, 
                middleName: null,
                lastName: null,
                suffix: null,
              },
              photos: [],
              addresses: [],
              emails: [],
              phones: [],
              urls: [],
              jobs: []
            },
            sources: {},
            preferences: {}
          }
          newContact.sources[this.getSourceKey()] = info
          newContact.info = info
          newContacts.push(newContact)
        }
      }
    })

    currentContacts.forEach((contact, index) => {
      if (dirtyContactIndicies.indexOf(index) < 0) {
        const sources = _.keys(contact.sources)
        if (sources.length > 1 && sources.indexOf(this.getSourceKey()) >= 0) {
          delete currentContacts[index].sources[this.getSourceKey()]
          currentContacts[index].info = mergeContactInfo(_.values(currentContacts[index].sources))
          dirtyContactIndicies.push(index)
        }
      }
    })

    const finalNewContacts = newContacts.filter(contact => contact.info.emails.length > 0 || contact.info.phones.length > 0)
    const finalRemoveContacts = currentContacts.filter(contact => contact.info.emails.length === 0 && contact.info.phones.length === 0)
    const finalUpdateContacts = dirtyContactIndicies.map(index => currentContacts[index]).filter(contact => contact.info.emails.length > 0 || contact.info.phones.length > 0)

    console.log('Create: ' + finalNewContacts.length)
    console.log('Update: ' + finalUpdateContacts.length)
    console.log('Destroy: ' + finalRemoveContacts.length)

    await Promise.all(finalUpdateContacts.map(async contact => {
      await this.storageEngine.saveContact(contact)
    }))

    await Promise.all(finalRemoveContacts.map(async contact => {
      await this.storageEngine.removeContact(contact)
    }))

    await Promise.all(finalNewContacts.map(async contact => {
      await this.storageEngine.saveContact(contact)
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
        }) >= 0
      }) >= 0
      if (foundPhone) {
        return true 
      }

      return false
    })
  }

  
}

module.exports = Source
