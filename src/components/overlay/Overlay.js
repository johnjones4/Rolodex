import React from 'react'
import './overlay.css'

class Overlay extends React.Component {
  // constructor (props) {
  //   super(props)
  // }

  render () {
    return (
      <div className='overlay-wrap'>
        <div className='overlay'>
          <button className='overlay-close' onClick={() => this.props.onClose()}>&times;</button>
          <div className='overlay-content'>
            { this.props.children }
          </div>
        </div>
      </div>
    )
  }
}

export default Overlay
