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
