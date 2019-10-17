import React from 'react'


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
        <input type='text' className='search-bar-field' name='search' value={this.state.searchTerm} onChange={(event) => this.updateSearchTerm(event.target.value)} />
      </div>
    )
  }
}

export default SearchBar
