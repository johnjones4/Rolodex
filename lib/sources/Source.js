const uuidv1 = require('uuid/v1')
const _ = require('lodash')

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

  isValid () {
    return false
  }

  async fetch () {
    return Promise.reject(new Error('Not implemented'))
  }

  async execute () {
    console.log('Syncing')
    const fetchedContacts = await this.fetch()
    const currentContacts = await this.storageEngine.getContacts()
    const dirtyContactIndicies = []
    const saveContacts = []
    const newContacts = []

    fetchedContacts.forEach(contact => {
      const index = this.findExistingContactIndex(contact, currentContacts)
      if (index >= 0) {
        dirtyContactIndicies.push(index)
        const oldContact = JSON.stringify(currentContacts[index])
        const updatedContact = this.mergeContacts(currentContacts[index], contact)
        if (oldContact !== JSON.stringify(updatedContact)) {
          saveContacts.push(updatedContact)
        }
      } else {
        const newIndex = this.findExistingContactIndex(contact, newContacts)
        if (newIndex >= 0) {
          saveContacts[newIndex] = this.mergeContacts(newContacts[newIndex], contact)
        } else {
          saveContacts.push(contact)
          newContacts.push(contact)
        }
      }
    })

    const contactsNotUpdated = currentContacts.filter((contact, index) => {
      return contact.sources.length === 1 && contact.sources[0] === this.getSourceKey() && dirtyContactIndicies.indexOf(index) < 0;
    })

    await Promise.all(saveContacts.map(async contact => {
      await this.storageEngine.saveContact(contact)
    }))

    await Promise.all(contactsNotUpdated.map(async contact => {
      await this.storageEngine.removeContact(contact)
    }))

    console.log('Done Syncing')
  }

  findExistingContactIndex (contact, contacts) {
    return contacts.findIndex(_contact => {
      const foundEmail = _contact.info.emails.findIndex(row => {
        return contact.info.emails.findIndex(_row => {
          return row.value === _row.value
        }) >= 0
      }) >= 0
      if (foundEmail) {
        return true
      }

      const foundPhone = _contact.info.phones.findIndex(row => {
        return contact.info.phones.findIndex(_row => {
          return row.value === _row.value
        }) >= 0 && _contact.info.name.firstName === contact.info.name.firstName && _contact.info.name.lastName === contact.info.name.lastName
      }) >= 0
      if (foundPhone) {
        return true 
      }

      return false
    })
  }

  mergeContacts (contact1, contact2) {
    return {
      id: contact1.id || contact2.id,
      info: {
        name: {
          prefix: contact1.info.name.prefix || contact2.info.name.prefix,
          firstName: contact1.info.name.firstName || contact2.info.name.firstName,
          middleName: contact1.info.name.middleName || contact2.info.name.middleName,
          lastName: contact1.info.name.lastName || contact2.info.name.lastName,
          suffix: contact1.info.name.suffix || contact2.info.name.suffix,
        },
        photos: _.uniq(contact1.info.photos.concat(contact2.info.photos)),
        addresses: _.uniq(contact1.info.addresses.concat(contact2.info.addresses)),
        emails: _.uniqBy(contact1.info.emails.concat(contact2.info.emails), ({value}) => value),
        phones: _.uniqBy(contact1.info.phones.concat(contact2.info.phones), ({value}) => value),
        urls: _.uniqBy(contact1.info.urls.concat(contact2.info.urls), ({value}) => value),
        jobs: _.uniqBy(contact1.info.jobs.concat(contact2.info.jobs), ({organization}) => organization),
      },
      sources: _.uniq(contact1.sources.concat(contact2.sources)),
      preferences: Object.assign({}, contact1.preferences, contact2.preferences)
    }
  }
}

module.exports = Source
