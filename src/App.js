import React from 'react'
import Contacts from './components/contacts/Contacts'
import ContactDetail from './components/contactDetail/ContactDetail'
import Settings from './components/settings/Settings'
import './app.css'
import './theme.css'
const { remote, ipcRenderer } = window.require('electron')
const { Menu } = remote

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      contacts: [],
      showingSettings: false,
      activeContact: null
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
  }

  componentWillMount () {
    this.setupAppMenu()
  }

  componentDidMount () {
    this.fetchContacts()
  }

  fetchContacts () {
    ipcRenderer.send('get-contacts')
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
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
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
    return (
      <div>
        <div className={ ['app-main', this.state.activeContact ? 'active-contact' : null].join(' ') }>
          <Contacts contacts={this.state.contacts} onContactSelected={(contact) => this.setState({ activeContact: contact })} activeContact={this.state.activeContact} />
          <ContactDetail contact={this.state.activeContact} />
        </div>
        { this.state.showingSettings && (<Settings onClose={() => this.setState({ showingSettings: false })} />) }
      </div>
    )
  }
}

export default App
