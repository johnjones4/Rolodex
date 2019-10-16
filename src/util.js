export const Name = ({ contact }) => {
  return [
    contact.info.name.prefix,
    contact.info.name.firstName,
    contact.info.name.middleName,
    contact.info.name.lastName,
    contact.info.name.suffix
  ].filter(s => s && s !== '').join(' ')
}
