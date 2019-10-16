const GoogleContactsSource = require('./sources/GoogleContactsSource')
const ExchangeContactsSource = require('./sources/ExchangeContactsSource')

class Sync {
  constructor (storageEngine) {
    this.storageEngine = storageEngine
  }

  async sync () {
    const sources = await this.storageEngine.getSetting('sources')
    for (let i = 0; i < sources.info.length; i++) {
      const sourceInfo = sources.info[i]
      const source = this.sourceFactory(sourceInfo)
      if (source) {
        await source.execute()
        if (source.requiresConfigResave) {
          const info = sources.info.map((_sourceInfo, j) => {
            if (i !== j) {
              return _sourceInfo
            }
            return source.config
          })
          await this.storageEngine.putSettings({
            sources: info
          })
        }
      }
    }
  }

  sourceFactory (config) {
    switch (config.type) {
      case 'google':
        return new GoogleContactsSource(this.storageEngine, config)
      case 'exchange':
        return new ExchangeContactsSource(this.storageEngine, config)
      default:
        return null
    }
  }
}

module.exports = Sync
