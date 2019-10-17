import React from 'react'
import './contactDetail.css'
import { Name } from '../../util'
const { shell, ipcRenderer } = window.require('electron')

const ContactDetailItem = ({key, type, keyName, valueName, keyValue, valueValue, children}) => {
  if (!children && (!valueValue || valueValue === '')) {
    return null;
  }
  return (
    <div className={ 'contact-' + type } key={key}>
      { keyValue && keyValue !== '' && (<span className={ 'contact-type contact-' + type + '-' + keyName }>{ keyValue }:</span>) }
      { children || (<span className={ 'contact-value contact-' + type + '-' + valueName }>{ valueValue }</span>) }
    </div>
  )
}

class ContactDetail extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      notes: props.contact && props.contact.preferences.notes ? props.contact.preferences.notes : ''
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps, nextState) {
    if ((nextProps.contact && this.props.contact && nextProps.contact.id !== this.props.contact.id) || (nextProps.contact && !this.props.contact)) {
      this.setState({
        notes: nextProps.contact && nextProps.contact.preferences.notes ? nextProps.contact.preferences.notes : ''
      })
    }
  }

  saveNotes () {
    const contact = Object.assign({}, this.props.contact, {
      preferences: Object.assign({}, this.props.contact.preferences, {
        notes: this.state.notes
      })
    })
    ipcRenderer.send('put-contact', { contact })
  }

  openURL (event) {
    event.preventDefault()
    shell.openExternal(event.target.href)
    return false
  }

  render () {
    return !this.props.contact ? (<div className='contact-detail' />) : (
      <div className='contact-detail'>
        <div className='contact-detail-inner'>
          { this.props.contact.info.photos.length > 0 && (<img src={this.props.contact.info.photos[0]} className='contact-image' />) }

          <div className='contact-name'><Name contact={this.props.contact} /></div>
          
          { this.props.contact.info.jobs.length > 0 && ( <div className='contact-section contact-jobsinfo'>
            <div className='contact-section-label'>Job Info</div>
            { this.props.contact.info.jobs.map((job, i) => (<ContactDetailItem key={i} type='jobinfo' keyName='title' valueName='organization' keyValue={job.title} valueValue={job.organization} />)) }
          </div>) }

          { this.props.contact.info.emails.length > 0 && ( <div className='contact-section contact-emails'>
            <div className='contact-section-label'>Email</div>
            { this.props.contact.info.emails.filter(email => !!email.value).map((email, i) => (
              <ContactDetailItem key={i} type='email' keyName='type' valueName='value' keyValue={email.type}>
                <a className='contact-value contact-email-value' onClick={(event) => this.openURL(event)} href={ 'mailto:' + email.value }>{ email.value }</a>
              </ContactDetailItem>
            )) }
          </div>) }

          { this.props.contact.info.phones.length > 0 && ( <div className='contact-section contact-phones'>
            <div className='contact-section-label'>Phone</div>
            { this.props.contact.info.phones.map((phone, i) => (<ContactDetailItem key={i} type='phone' keyName='type' valueName='value' keyValue={phone.type} valueValue={phone.value} />)) }
          </div>) }

          { this.props.contact.info.urls.length > 0 && ( <div className='contact-section contact-urls'>
            <div className='contact-section-label'>URLs</div>
            { this.props.contact.info.urls.map((url, i) => {
              return (
                <div className='contact-url' key={i}>
                  { url.type && url.type !== '' ? (<a onClick={(event) => this.openURL(event)} className='contact-url' href={url.value} title={url.value}>{ url.type }</a>) : (<a onClick={(event) => this.openURL(event)} className='contact-url' href={url.value}>{ url.value }</a>) }
                </div>
              )
            }) }
            </div>
          ) }

          <div>
            <div className='contact-section-label'>Notes</div>
            <textarea className='notes' value={this.state.notes} onChange={event => this.setState({notes: event.target.value})}></textarea>
            { (this.props.contact.preferences.notes ? this.props.contact.preferences.notes !== this.state.notes : this.state.notes !== '' ) && (<button className='button' onClick={() => this.saveNotes()}>Save</button>)}
          </div>
        </div>
      </div>
    )
  }
}

export default ContactDetail
