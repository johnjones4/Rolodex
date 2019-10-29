const _ = require('lodash')

exports.mergeContactInfo = (infos) => {
  return {
    name: {
      prefix: pickOneNameProp(infos, 'prefix'),
      firstName: pickOneNameProp(infos, 'firstName'),
      middleName: pickOneNameProp(infos, 'middleName'),
      lastName: pickOneNameProp(infos, 'lastName'),
      suffix: pickOneNameProp(infos, 'suffix'),
    },
    photos: _.uniq(mergeInfoArrays(infos, 'photos')),
    addresses: _.uniq(mergeInfoArrays(infos, 'addresses')),
    emails: _.uniqBy(mergeInfoArrays(infos, 'emails'), ({value}) => value),
    phones: _.uniqBy(mergeInfoArrays(infos, 'phones'), ({value}) => value),
    urls: _.uniqBy(mergeInfoArrays(infos, 'urls'), ({value}) => value),
    jobs: _.uniqBy(mergeInfoArrays(infos, 'jobs'), ({organization}) => organization),
  }
}

const pickOneNameProp = (infos, nameProp) => {
  for (let i = 0; i < infos.length; i++) {
    if (infos[i].name[nameProp]) {
      return infos[i].name[nameProp]
    }
  }
  return null
}

const mergeInfoArrays = (infos, prop) => {
  let outArray = []
  infos.forEach(info => outArray = outArray.concat(info[prop]))
  return outArray
}
