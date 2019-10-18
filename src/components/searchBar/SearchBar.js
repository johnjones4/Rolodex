import React from 'react'
import './searchBar.css'

class SearchBar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTerm: ''
    }
  }

  updateSearchTerm (value) {
    this.setState({
      searchTerm: value
    })
    this.props.onSearchTermChange(value)
  }

  render () {
    return (
      <div className='search-bar'>
        <div className='search-bar-inner'>
          <input type='text' className='search-bar-field' name='search' placeholder='Search' value={this.state.searchTerm} onChange={(event) => this.updateSearchTerm(event.target.value)} />
        </div>
      </div>
    )
  }
}

export default SearchBar
