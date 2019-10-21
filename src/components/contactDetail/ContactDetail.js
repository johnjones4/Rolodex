import React from 'react'
import './contactDetail.css'
import { Name, MONTHS, FREQUENCY } from '../../util'
const { shell, ipcRenderer } = window.require('electron')

const ContactDetailItem = ({type, keyName, valueName, keyValue, valueValue, children}) => {
  if (!children && (!valueValue || valueValue === '')) {
    return null;
  }
  return (
    <div className={ 'contact-' + type }>
      { keyValue && keyValue !== '' && (<span className={ 'contact-type contact-' + type + '-' + keyName }>{ keyValue }:</span>) }
      { children || (<span className={ 'contact-value contact-' + type + '-' + valueName }>{ valueValue }</span>) }
    </div>
  )
}

class ContactDetail extends React.Component {
  constructor (props) {
    super(props)
    this.state = this.makeFreshState()
  }

  UNSAFE_componentWillReceiveProps (nextProps, nextState) {
    if ((nextProps.contact && this.props.contact && nextProps.contact.id !== this.props.contact.id) || (nextProps.contact && !this.props.contact)) {
      this.setState(this.makeFreshState())
    }
  }

  makeFreshState (contact) {
    return Object.assign({
      notes: contact && contact.preferences.notes ? contact.preferences.notes : '',
    }, this.makeFreshNewLogItem())
  }

  makeFreshNewLogItem () {
    const now = new Date()
    return {
      newLogItemYear: now.getFullYear(),
      newLogItemMonth: now.getMonth(),
      newLogItemDate: now.getDate(),
      newLogItemNote: ''
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

  commitNewLogItem () {
    const log = (this.props.contact.preferences.log || []).map(({note, date}) => {
      return {
        note,
        date: new Date(Date.parse(date))
      }
    })
    log.push({
      note: this.state.newLogItemNote,
      date: new Date(this.state.newLogItemYear, this.state.newLogItemMonth, this.state.newLogItemDate)
    })
    log.sort((a, b) => {
      return b.date.getTime() - a.date.getTime()
    })
    const contact = Object.assign({}, this.props.contact, {
      preferences: Object.assign({}, this.props.contact.preferences, {
        log
      })
    })
    ipcRenderer.send('put-contact', { contact })
    this.setState(this.makeFreshNewLogItem())
  }

  updatePreferredContactFrequency (freq) {
    const contact = Object.assign({}, this.props.contact, {
      preferences: Object.assign({}, this.props.contact.preferences, {
        contactFrequency: freq
      })
    })
    ipcRenderer.send('put-contact', { contact })
  }

  openURL (event) {
    event.preventDefault()
    shell.openExternal(event.target.href)
    return false
  }

  renderContactInfo () {
    return (
      <div>
        { this.props.contact.info.photos.length > 0 && (<img src={this.props.contact.info.photos[0]} className='contact-image' alt='Profile' />) }

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
      </div>
    )
  }

  renderNotes () {
    return (
      <div className='contact-section'>
        <div className='contact-section-label'>Notes</div>
        <textarea className='notes' value={this.state.notes} onChange={event => this.setState({notes: event.target.value})}></textarea>
        { (this.props.contact.preferences.notes ? this.props.contact.preferences.notes !== this.state.notes : this.state.notes !== '' ) && (<button className='button' onClick={() => this.saveNotes()}>Save</button>)}
      </div>
    )
  }

  renderUpdateFrequencyChooser () {
    return (
      <div className='contact-section'>
        <div className='contact-section-label'>Preferred Contact Frequency</div>
        <select className='contact-preferred-contact-frequency' value={this.props.contact.preferences.contactFrequency || ''} onChange={event => this.updatePreferredContactFrequency(event.target.selectedIndex === 0 ? null : FREQUENCY[event.target.selectedIndex - 1])}>
          <option>None</option>
          { FREQUENCY.map((freq, i) => (<option key={i}>{freq}</option>)) }
        </select>
      </div>
    )
  }

  renderLog () {
    const now = new Date()
    const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
    return (
      <div className='contact-section'>
        <div className='contact-section-label'>Log</div>
        <div className='contact-log-new'>
          <div className='contact-log-new-field'>
            <select value={MONTHS[this.state.newLogItemMonth]} onChange={event => this.setState({newLogItemMonth: event.target.selectedIndex})}>
              { MONTHS.map((month, i) => (<option key={i}>{month}</option>)) }
            </select>
          </div>
          <div className='contact-log-new-field'>
            <select value={this.state.newLogItemDate} onChange={event => this.setState({newLogItemDate: event.target.selectedIndex+1})}>
              { [...Array(31).keys()].map(d => (<option key={d}>{d}</option>)) }
            </select>
          </div>
          <div className='contact-log-new-field'>
            <select value={this.state.newLogItemYear} onChange={event => this.setState({newLogItemYear: years[event.target.selectedIndex]})}>
              { years.map((y, i) => (<option key={i}>{y}</option>)) }
            </select>
          </div>

          <div className='contact-log-new-field contact-log-new-field-text'>
            <input type='text' placeholder='Log detail' value={this.state.newLogItemNote} onChange={event => this.setState({newLogItemNote: event.target.value})} />
          </div>

          <div className='contact-log-new-field'>
            <button className='button' onClick={() => this.commitNewLogItem()}>Log</button>
          </div>
        </div>
        { this.props.contact.preferences.log && (
          <div className='contact-log item-list'>
            { this.props.contact.preferences.log.map((log, i) => (
              <div className='item-list-row' key={i}>
                <span className='contact-log-item-note'>{ log.note }</span>
                <span className='contact-log-item-date'>{ new Date(Date.parse(log.date)).toLocaleDateString() }</span>
              </div>
            )) }
          </div>
        ) }
      </div>
    )
  }

  render () {
    return !this.props.contact ? (<div className='contact-detail' />) : (
      <div className='contact-detail'>
        <div className='contact-detail-inner'>
          { this.renderContactInfo() }
          { this.renderNotes() }
          { this.renderUpdateFrequencyChooser() }
          { this.renderLog() }
        </div>
      </div>
    )
  }
}

export default ContactDetail
