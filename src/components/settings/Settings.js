import React from 'react'
import Overlay from '../overlay/Overlay'
import './settings.css'
const { ipcRenderer } = window.require('electron')

class Settings extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      settings: {
        sources: []
      }
    }

    this.settingsHandler = (event, arg) => {
      this.setState({
        settings: Object.assign({}, this.state.settings, arg.settings)
      })
    }

    this.googleAuthorizedHandler = (event, arg) => {
      console.log(arg)
      this.updateSourceFields(arg.index, {
        authParams: arg.tokenInfo
      })
    }
  }

  saveAndClose () {
    ipcRenderer.send('put-settings', { settings: this.state.settings })
    this.props.onClose()
  }

  componentWillMount () {
    ipcRenderer.on('settings', this.settingsHandler)
    ipcRenderer.on('authorized-google', this.googleAuthorizedHandler)
  }

  componentDidMount () {
    this.fetchSettings()
  }

  componentWillUnmount () {
    ipcRenderer.removeListener('settings', this.settingsHandler)
    ipcRenderer.removeListener('authorized-google', this.googleAuthorizedHandler)
  }

  async fetchSettings () {
    ipcRenderer.send('get-settings')
  }

  addSource (type) {
    const source = {
      type
    }
    // eslint-disable-next-line default-case
    switch (source.type) {
      case 'google':
        source.authParams = {}
        break
      case 'exchange':
        source.server = ''
        source.username = ''
        source.password = ''
        break
      case 'linkedin':
        source.fileData = null
        source.mode = 'update'
        break
    }
    const settings = Object.assign({}, this.state.settings, {
      sources: (this.state.settings.sources || []).concat([source])
    })
    this.setState({settings})
  }

  removeSource (index) {
    const settings = Object.assign({}, this.state.settings, {
      sources: this.state.settings.sources.filter((_, i) => i !== index)
    })
    this.setState({settings})
  }

  updateSourceFields (index, keyValues) {
    const settings = Object.assign({}, this.state.settings, {
      sources: this.state.settings.sources.map((source, i) => {
        if (i !== index) {
          return source
        }
        return Object.assign({}, source, keyValues)
      })
    })
    this.setState({settings})
  }

  updateSourceField (index, key, value) {
    const keyVals = {}
    keyVals[key] = value
    this.updateSourceFields(index, keyVals)
  }

  updateFile (index, key, file) {
    const fileReader = new FileReader()
    fileReader.onloadend = () => this.updateSourceField(index, key, fileReader.result)
    fileReader.readAsText(file)
  }

  renderForm (label, type, name, value, onChange) {
    return (
      <div className='form-field'>
        <label htmlFor={name}>{ label }</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} />
      </div>
    )
  }

  renderGoogleSourceMenu (source, index) {
    const isValidAuthorization = source.authParams && source.authParams.access_token
    return (
      <div>
        <div className='settings-sources-source-name'>Google Contacts</div>
        <div className='form-field'>
          {
            isValidAuthorization ? 
              ( <button className='button button-delete' onClick={() => this.updateSourceField(index, 'authParams', {})}>De-Authorize</button> )
              : ( <button className='button' onClick={() => ipcRenderer.send('authorize-google', { index })}>Authorize</button> ) 
          }
        </div>
      </div>
    )
  }

  renderExchangeSourceMenu (source, index) {
    return (
      <div>
        <div className='settings-sources-source-name'>Google Contacts</div>
        { this.renderForm('Server URL', 'text', 'exchange-server-url-' + index, source.server, (event) => this.updateSourceField(index, 'server', event.target.value)) }
        { this.renderForm('Username', 'text', 'exchange-server-username-' + index, source.username, (event) => this.updateSourceField(index, 'username', event.target.value)) }
        { this.renderForm('Password', 'password', 'exchange-server-password-' + index, source.password, (event) => this.updateSourceField(index, 'password', event.target.value)) }
      </div>
    )
  }

  renderLinkedInSourceMenu (source, index) {
    const modes = [
      {
        value: 'all',
        label: 'Import All'
      },
      {
        value: 'update',
        label: 'Updated Existing Contacts'
      }
    ]
    return (
      <div>
        <div className='settings-sources-source-name'>LinkedIn</div>
        <div className='form-field'>
          <label>LinkedIn Export File</label>
          <input type='file' name={'linkedin-data' + index} onChange={event => this.updateFile(index, 'fileData', event.target.files[0])} />
        </div>
        <div className='form-field'>
          <label>Import Mode</label>
          <div>
            {
              modes.map((mode, i) => (
                <label className='checkbox-label' key={i}>
                  <input type='radio' name={'linkedin-mode-' + index} value={mode.value} checked={source.mode === mode.value} onChange={(event) => event.target.checked && this.updateSourceField(index, 'mode', mode.value)} />
                  { mode.label }
                </label>
              ))
            }
          </div>
        </div>
      </div>
    )
  }

  renderSourceMenu (source, index) {
    switch (source.type) {
      case 'google':
        return this.renderGoogleSourceMenu(source, index)
      case 'exchange':
        return this.renderExchangeSourceMenu(source, index)
      case 'linkedin':
          return this.renderLinkedInSourceMenu(source, index)
      default:
        return null
    }
  }

  renderSourcesMenu () {
    return (
      <Overlay onClose={this.props.onClose}>
        <div className='settings-sources'>
          <div className='settings-section'>Sources</div>
          <div className='settings-sources-add'>
            <button className='button' onClick={() => this.addSource('google')}>+ Google Contacts</button>
            <button className='button' onClick={() => this.addSource('exchange')}>+ Exchange</button>
            <button className='button' onClick={() => this.addSource('linkedin')}>+ LinkedIn</button>
          </div>
          <div className='settings-sources-list'>
            {
              this.state.settings.sources.map((source, i) => {
                return (
                  <div className='settings-sources-source' key={i}>
                    <div className='settings-sources-source-info'>
                      { this.renderSourceMenu(source, i) }
                    </div>
                    <button className='button button-delete settings-source-remove' onClick={() => this.removeSource(i)}>Remove</button>
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className='settings-controls'>
          <button className='button settings-cancel' onClick={() => this.props.onClose()}>Cancel</button>
          <button className='button settings-save' onClick={() => this.saveAndClose()}>Save</button>
        </div>
      </Overlay>
    )
  }

  render () {
    return (
      <div className='settings'>
        { this.renderSourcesMenu() }
      </div>
    )
  }
}

export default Settings
