export const mergeName = (contact) => {
  return [
    contact.info.name.prefix,
    contact.info.name.firstName,
    contact.info.name.middleName,
    contact.info.name.lastName,
    contact.info.name.suffix
  ].filter(s => s && s !== '').join(' ')
}

export const Name = ({ contact }) => mergeName(contact)

export const makeSearchObject = (contact) => {
  return {
    id: contact.id,
    notes: contact.preferences.notes || '',
    name: mergeName(contact)
  }
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const FREQUENCY = [
  'Weekly',
  'Monthly',
  'Quarterly'
]

export const frequenciesToMilliseconds = {
  'Weekly': 1000 * 60 * 60 * 24 * 7,
  'Monthly': 1000 * 60 * 60 * 24 * 30,
  'Quarterly': 1000 * 60 * 60 * 24 * 31 * 3
} 

export const inflateContactObject = contact => {
  return Object.assign({}, contact, {
    preferences: Object.assign({}, contact.preferences, {
      log: (contact.preferences.log || []).map(({note, date}) => {
        return {
          note,
          date: new Date(Date.parse(date))
        }
      })
    })
  })
}

export const contactRequiresOutreach = contact => contact.preferences.contactFrequency > 0 && (contact.preferences.log.length === 0 || (contact.preferences.log[0].date.getTime() + contact.preferences.contactFrequency <= new Date().getTime()))

export const sortedContacts = contacts => {
  const _contacts = contacts.slice(0)
  const idsRequiringOutreach = _contacts.filter(contact => contactRequiresOutreach(contact)).map(contact => contact.id)
  _contacts.sort((a, b) => {
    const aRequiresOutreach = idsRequiringOutreach.indexOf(a.id) >= 0
    const bRequiresOutreach = idsRequiringOutreach.indexOf(b.id) >= 0
    if (aRequiresOutreach && !bRequiresOutreach) {
      return -1
    } else if (!aRequiresOutreach && bRequiresOutreach) {
      return 1
    } else if (a.info.name.firstName < b.info.name.firstName) {
      return -1
    } else if (a.info.name.firstName > b.info.name.firstName) {
      return 1
    } else {
      return 0
    }
  })
  return _contacts
}
