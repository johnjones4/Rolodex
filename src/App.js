import React from 'react'
import Contacts from './components/contacts/Contacts'
import ContactDetail from './components/contactDetail/ContactDetail'
import Settings from './components/settings/Settings'
import './app.css'
const { remote, ipcRenderer } = window.require('electron')
const { Menu, dialog } = remote

const defaultThemes = [
  {
    label: 'Standard',
    name: 'standard'
  },
  {
    label: 'Dark',
    name: 'dark'
  },
  {
    label: 'Retro',
    name: 'retro'
  },
  {
    label: 'Terminal',
    name: 'terminal'
  }
]

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      contacts: null,
      showingSettings: false,
      activeContact: null,
      themeSource: null,
      theme: null
    }
    ipcRenderer.on('contacts', (event, { contacts }) => {
      contacts.sort((a, b) => {
        if (a.info.name.lastName < b.info.name.lastName) {
          return -1
        } else if (a.info.name.lastName > b.info.name.lastName) {
          return 1
        } else {
          return 0
        }
      })
      this.setState({contacts})
    })
    ipcRenderer.on('setting', (event, args) => {
      if (args && args.info) {
        this.setActiveTheme(args.info.theme, args.info.isInternalTheme)
      } else {
        this.setActiveTheme('standard', true)
      }
    })
  }

  componentWillMount () {
    this.setupAppMenu()
    ipcRenderer.send('get-setting', {key: 'theme'})
  }

  componentDidMount () {
    this.fetchContacts()
  }

  fetchContacts () {
    ipcRenderer.send('get-contacts')
  }

  async setActiveTheme (theme, isInternalTheme) {
    if (isInternalTheme) {
      this.setState({
        theme
      })
      const themeSource = await (await fetch(`./themes/${theme}.css`)).text()
      this.setState({
        themeSource
      })
      this.setupAppMenu()
    }
  }

  setAndSaveActiveTheme (theme, isInternalTheme) {
    const settings = {
      'theme': {
        theme,
        isInternalTheme
      }
    }
    ipcRenderer.send('put-settings', {settings})
    this.setActiveTheme(theme, isInternalTheme)
  }

  setupAppMenu () {
    const menu = Menu.buildFromTemplate([
      { role: 'appMenu' },
      {
        label: 'File',
        submenu: [
          {
            label: 'Sync',
            click: () => {
              ipcRenderer.send('sync')
            }
          },
          {
            label: 'Settings',
            click: () => {
              this.setState({ showingSettings: true })
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { role: 'toggledevtools' },
          { type: 'separator' },  
          { role: 'togglefullscreen' },
          {
            label: 'Theme',
            submenu: defaultThemes.map(theme => {
              return {
                label: theme.label,
                type: 'checkbox',
                checked: this.state.theme === theme.name,
                click: () => {
                  this.setAndSaveActiveTheme(theme.name, true)
                }
              }
            }).concat([
              { type: 'separator' },
              {
                label: 'Load Theme',
                click: () => {
                  // this.setTheme(theme.name, true)
                  //TODO  
                }
              }
            ])
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [
            { role: 'close' }
          ])
        ]
      },
    ])
    Menu.setApplicationMenu(menu)
  }

  render () {
    return this.state.themeSource && this.state.contacts ? (
      <div>
        <style type='text/css'>{ this.state.themeSource }</style>
        <div className={ ['app-main', this.state.activeContact ? 'active-contact' : null].join(' ') }>
          <Contacts contacts={this.state.contacts} onContactSelected={(contact) => this.setState({ activeContact: contact })} activeContact={this.state.activeContact} />
          <ContactDetail contact={this.state.activeContact} />
        </div>
        { this.state.showingSettings && (<Settings onClose={() => this.setState({ showingSettings: false })} />) }
      </div>
    ) : null
  }
}

export default App