const Source = require('./Source')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const people = google.people('v1')
const consts = require('../consts')
const ews = require('ews-javascript-api')
const EWSFactory = require('../EWSFactory')
const _ = require('lodash')

class ExchangeContactsSource extends Source {
  // constructor (storageEngine, config) {
  //   super(storageEngine, config)
    
  // }

  isValid () {
    return this.config.username !== '' && this.config.password !== '' && this.config.server !== ''
  }

  async fetch () {
    const exch = new EWSFactory().initInstance(this.config)
    const view = new ews.ItemView()

    const { items } = await exch.FindItems(ews.WellKnownFolderName.Contacts, view)

    return items
      .filter(record => !(!record.propertyBag.properties.objects.Id))
      .map(record => {
        const props = record.propertyBag.properties.objects
        return {
          name: {
            prefix: props.CompleteName.Title !== '' ? props.CompleteName.Title : null,
            firstName: props.CompleteName.GivenName !== '' ? props.CompleteName.GivenName : null,
            middleName: props.CompleteName.MiddleName !== '' ? props.CompleteName.MiddleName : null,
            lastName: props.CompleteName.Surname !== '' ? props.CompleteName.Surname : null,
            suffix: props.CompleteName.Suffix !== '' ? props.CompleteName.Suffix : null,
          },
          photos: [],
          addresses: props.PhysicalAddresses ? _.values(props.PhysicalAddresses.entries.objects).map(entry => {
            const loc = []
            if (entry.propertyBag.items.objects.City) {
              loc.push(entry.propertyBag.items.objects.City)
            }
            if (entry.propertyBag.items.objects.State) {
              loc.push(entry.propertyBag.items.objects.State)
            }
            if (entry.propertyBag.items.objects.CountryOrRegion) {
              loc.push(entry.propertyBag.items.objects.CountryOrRegion)
            }
            return loc.join(', ')
          }) : [],
          emails: props.EmailAddresses ? _.values(props.EmailAddresses.entries.objects).map(emailAddress => {
            return {
              type: emailAddress.name,
              value: emailAddress.address
            }
          }) : [],
          phones: props.PhoneNumbers ? _.values(props.PhoneNumbers.entries.objects).map(phoneNumber => {
            return {
              type: phoneNumber.Key,
              value: phoneNumber.phoneNumber
            }
          }) : [],
          urls: [],
          jobs: (props.CompanyName || props.JobTitle) ? [
            {
              organization: props.CompanyName || null,
              title: props.JobTitle || null
            }
          ] : []
        }
      })
  }
}

module.exports = ExchangeContactsSource
