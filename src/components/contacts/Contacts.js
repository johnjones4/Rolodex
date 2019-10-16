import React from 'react'
import './contacts.css'
import { Name } from '../../util'

class Contacts extends React.Component {
  render () {
    return (
      <div className='contacts-list item-list'>
        {
          this.props.contacts.map((contact, i) => {
            return (
              <button className={ ['contacts-list-row', 'item-list-row', 'item-list-row-selectable', this.props.activeContact && this.props.activeContact.id === contact.id ? 'item-list-row-selected' : ''].join(' ') } key={i} onClick={() => this.props.onContactSelected(contact)}>
                { contact.info.photos.length > 0 ? (<img src={contact.info.photos[0]} className='contacts-list-image' />) : (<div className='contacts-list-image contacts-list-image-placeholder' />) }
                <span className='contacts-list-name'>
                  <Name contact={contact} />
                </span>
              </button>
            )
          })
        }
      </div>
    )
  }
}

export default Contacts
