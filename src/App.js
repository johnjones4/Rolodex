import React from 'react'
import Contacts from './components/contacts/Contacts'
import ContactDetail from './components/contactDetail/ContactDetail'
import Settings from './components/settings/Settings'
import elasticlunr from 'elasticlunr'
import SearchBar from './components/searchBar/SearchBar'
import './app.css'
import { makeSearchObject } from './util'
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
      searchResults: null,
      showingSettings: false,
      activeContact: null,
      themeSource: null,
      theme: null
    }
    ipcRenderer.on('contacts', (event, { contacts }) => {
      contacts.sort((a, b) => {
        if (a.info.name.firstName < b.info.name.firstName) {
          return -1
        } else if (a.info.name.firstName > b.info.name.firstName) {
          return 1
        } else {
          return 0
        }
      })

      this.index = elasticlunr(function () {
        this.addField('notes')
        this.addField('name')
        this.setRef('id')
      })
      contacts.forEach((contact, i) => this.index.addDoc(makeSearchObject(contact)))
      
      this.setState({contacts})
    })
    ipcRenderer.on('contact', (event, { contact }) => {
      const updates = {}
      if (contact.id === this.state.activeContact.id) {
        this.index.updateDoc(makeSearchObject(contact))
        updates.activeContact = contact
      }
      updates.contacts = this.state.contacts.map(_contact => _contact.id === contact.id ? contact : _contact)
      this.setState(updates)
    })
    ipcRenderer.on('setting', (event, args) => {
      if (args && args.info) {
        this.setActiveTheme(args.info.theme, args.info.isInternalTheme)
      } else {
        this.setActiveTheme('standard', true)
      }
    })
  }

  componentDidMount () {
    this.fetchContacts()
    this.setupAppMenu()
    ipcRenderer.send('get-setting', {key: 'theme'})
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

  doSearch (term) {
    if (term.trim() === '') {
      this.setState({searchResults: null})
    } else {
      const searchResults = this.index.search(term, {}).map(({ ref }) => {
        return this.state.contacts.find(({id}) => id+'' === ref)
      })
      this.setState({searchResults})
    }
  }

  render () {
    return this.state.themeSource && (this.state.contacts || this.state.searchResults) ? (
      <div>
        <style type='text/css'>{ this.state.themeSource }</style>
        <div className={ ['app-main', this.state.activeContact ? 'active-contact' : null].join(' ') }>
          <div className='sidebar'>
            <SearchBar onSearchTermChange={term => this.doSearch(term)} />
            <Contacts contacts={this.state.searchResults || this.state.contacts} onContactSelected={(contact) => this.setState({ activeContact: contact })} activeContact={this.state.activeContact} />
          </div>
          <ContactDetail contact={this.state.activeContact} />
        </div>
        { this.state.showingSettings && (<Settings onClose={() => this.setState({ showingSettings: false })} />) }
      </div>
    ) : null
  }
}

export default App
