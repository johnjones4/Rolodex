import React from 'react'
import './contacts.css'
import { Name, contactRequiresOutreach } from '../../util'

class Contacts extends React.Component {

  renderContactRow (contact, i) {
    return (
      <button className={ ['contacts-list-row', 'item-list-row', 'item-list-row-selectable', this.props.activeContact && this.props.activeContact.id === contact.id ? 'item-list-row-selected' : ''].join(' ') } key={i} onClick={() => this.props.onContactSelected(contact)}>
        { contact.info.photos.length > 0 ? (<img src={contact.info.photos[0]} className='contacts-list-image' alt='Profile' />) : (<div className='contacts-list-image contacts-list-image-placeholder' />) }
        <div className='contacts-list-name'>
          <Name contact={contact} />
        </div>
        <div className='contacts-list-alerts'>
          { contactRequiresOutreach(contact) && (<span className='contacts-list-alert contacts-list-alert-outreach'>Outreach Required</span>) }
        </div>
      </button>
    )
  }

  render () {
    return (
      <div className='contacts-list item-list'>
        <div className='item-list-inner'>
          {
            this.props.contacts.map((contact, i) => this.renderContactRow(contact, i))
          }
        </div>
      </div>
    )
  }
}

export default Contacts
