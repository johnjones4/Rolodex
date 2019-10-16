const Source = require('./Source')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const people = google.people('v1')
const consts = require('../consts')

class GoogleContactsSource extends Source {
  constructor (storageEngine, config) {
    super(storageEngine, config)
    this.oauthClient = new OAuth2(
      consts.googleParams.clientId,
      consts.googleParams.clientSecret
    )
    this.applyOAuthCredentials()
  }

  applyOAuthCredentials () {
    // console.log(this.config.authParams)
    if (this.isValid()) {
      this.oauthClient.credentials = {
        access_token: this.config.authParams.access_token,
        refresh_token: this.config.authParams.refresh_token,
        expiry_date: this.config.authParams.expiry_date
      }
    }
  }

  isValid () {
    return this.config.authParams && this.config.authParams.access_token
  }

  async refreshToken () {
    const now = new Date().getTime() / 1000
    if (this.config.authParams.expiry_date < now) {
      return Promise.resolve()
    }
    this.config.authParams = (await this.oauthClient.refreshAccessToken()).credentials
    this.applyOAuthCredentials()
    this.setRequiresConfigResave()
  }

  async fetch () {
    await this.refreshToken()
    const response = await people.people.connections.list({
      pageSize: 2000,
      personFields: [
        'addresses',
        'emailAddresses',
        'names',
        'organizations',
        'phoneNumbers',
        'photos',
        'urls',
        'memberships'
      ].join(','),
      resourceName: 'people/me',
      auth: this.oauthClient
    })
    return response.data.connections.map(contact => {
      return {
        sources: [
          this.getSourceKey()
        ],
        info: {
          name: {
            prefix: contact.names && contact.names.length > 0 && contact.names[0].honorificPrefix !== '' ? contact.names[0].honorificPrefix : null,
            firstName: contact.names && contact.names.length > 0 && contact.names[0].givenName !== '' ? contact.names[0].givenName : null, 
            middleName: contact.names && contact.names.length > 0 && contact.names[0].middleName !== '' ? contact.names[0].middleName : null,
            lastName: contact.names && contact.names.length > 0 && contact.names[0].familyName !== '' ? contact.names[0].familyName : null,
            suffix: contact.names && contact.names.length > 0 && contact.names[0].honorificSuffix !== '' ? contact.names[0].honorificSuffix : null,
          },
          photos: contact.photos ? contact.photos.map(photo => photo.url) : [],
          addresses: contact.addresses ? contact.addresses.map(address => address.formattedValue) : [],
          emails: contact.emailAddresses ? contact.emailAddresses.map(emailAddress => {
            return {
              type: emailAddress.formattedType,
              value: emailAddress.value
            }
          }) : [],
          phones: contact.phoneNumbers ? contact.phoneNumbers.map(phoneNumber => {
            return {
              type: phoneNumber.formattedType,
              value: phoneNumber.value
            }
          }) : [],
          urls: contact.urls ? contact.urls.map(url => {
            return {
              type: url.formattedType,
              value: url.value
            }
          }) : [],
          jobs: contact.organizations ? contact.organizations.map(organization => {
            return {
              organization: organization.name,
              title: organization.title || null
            }
          }) : []
        }
      }
    })
  }
}

module.exports = GoogleContactsSource
