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
