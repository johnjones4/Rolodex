const Source = require('./Source')
const parse = require('csv-parse')

class LinkedInContactsSource extends Source {
  sourceMode () {
    return 'update'
  }

  isValid () {
    return this.config.fileData && this.config.fileData !== ''
  }

  async fetch () {
    const parsed = await new Promise((resolve, reject) => {
      parse(this.config.fileData, {
        columns: true
      }, (err, output) => {
        if (err) {
          return reject(err)
        }
        resolve(output)
      })
    })

    return parsed.map(contact => {
      return {
        name: {
          prefix: null,
          firstName: contact['First Name'], 
          middleName: null,
          lastName: contact['Last Name'],
          suffix: null,
        },
        photos: [],
        addresses: [],
        emails: contact['Email Address'] !== '' ? [
          {
            key: null,
            value: contact['Email Address']
          }
        ] : [],
        phones: [],
        urls: [],
        jobs: contact['Company'] !== '' ? [
          {
            organization: contact['Company'],
            title: contact['Position']
          }
        ] : []
      }
    })
  }
}

module.exports = LinkedInContactsSource
