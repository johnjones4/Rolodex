import React from 'react'
import './contactDetail.css'
import { Name } from '../../util'
const { shell } = window.require('electron')

class ContactDetail extends React.Component {
  openURL (event) {
    event.preventDefault()
    shell.openExternal(event.target.href)
    return false
  }

  render () {
    return !this.props.contact ? (<div className='contact-detail' />) : (
      <div className='contact-detail'>
        { this.props.contact.info.photos.length > 0 && (<img src={this.props.contact.info.photos[0]} className='contact-image' />) }

        <div className='contact-name'><Name contact={this.props.contact} /></div>
        
        { this.props.contact.info.jobs.length > 0 && ( <div className='contact-section contact-jobsinfo'>
          <div className='contact-section-label'>Job Info</div>
          { this.props.contact.info.jobs.map((job, i) => {
            return (
              <div className='contact-jobinfo' key={i}>
                <span className='contact-type contact-jobinfo-title'>{ job.title }:</span>
                <span className='contact-value contact-jobinfo-organization'>{ job.organization }</span> 
              </div>
            )
          }) }
        </div>) }

        { this.props.contact.info.emails.length > 0 && ( <div className='contact-section contact-emails'>
          <div className='contact-section-label'>Email</div>
          { this.props.contact.info.emails.map((email, i) => {
            return (
              <div className='contact-email' key={i}>
                <span className='contact-type contact-email-type'>{ email.type }:</span>
                <a className='contact-value contact-email-value' onClick={(event) => this.openURL(event)} href={ 'mailto:' + email.value }>{ email.value }</a> 
              </div>
            )
          }) }
        </div>) }

        { this.props.contact.info.phones.length > 0 && ( <div className='contact-section contact-phones'>
          <div className='contact-section-label'>Phone</div>
          { this.props.contact.info.phones.map((phone, i) => {
            return (
              <div className='contact-phone' key={i}>
                <span className='contact-type contact-phone-type'>{ phone.type }:</span>
                <span className='contact-value contact-value contact-phone-value'>{ phone.value }</span> 
              </div>
            )
          }) }
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
        </div>) }
      </div>
    )
  }
}

export default ContactDetail
