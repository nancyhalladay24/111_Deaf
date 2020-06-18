"use strict";

var Application = React.createClass({
  getInitialState: function() {
    return {
      searchText: this.props.initialSearchText,
      results: this.props.initialResults,
      maxResults: this.props.initialMaxResults
    };
  },

  render: function() {
    return (
      <div>
        <SearchForm searchText={this.state.searchText}
                    handleSearchTextChange={this.handleSearchTextChange} />
        {this.resultsList()}
        <BackLink />
      </div>
    );
  },

  resultsList: function() {
    if (this.state.results) {
      return (
        <ResultsList practices={this.state.results}
                     pageSize={20}
                     loadMoreResults={this.loadMoreResults}
                     loadMoreHref={this.loadMoreHref()} />
      );
    }
  },

  handleSearchTextChange: function(newSearchText) {
    this.updateResults(newSearchText, 20);
  },

  loadMoreResults: function() {
    this.updateResults(this.state.searchText, this.state.maxResults + 20);
  },

  loadMoreHref: function() {
    // TODO handle this in a less hacky way:
    // it'll give a false positive when the total number of results is
    // coincidentally the same as the max number of results.
    if (this.state.maxResults === this.state.results.length) {
      var searchText = this.state.searchText.replace(" ", "+", "g"),
          maxResults = this.state.maxResults + 20;

      return "?search=" + searchText + "&max=" + maxResults + "#result-" + this.state.maxResults;
    }
  },

  updateResults: function(searchText, maxResults) {
    this.setState({
      searchText: searchText,
      maxResults: maxResults
    });

    if (searchText.length > 0) {
      search(searchText, maxResults).then(function(practices) {
        this.setState({
          results: practices
        });
      }.bind(this));
    } else {
      this.setState({
        results: null
      });
    }
  }
});

var SearchForm = React.createClass({
  render: function() {

    return (
      <form name="gp-search" id="gp-search" method="get" className="gp-finder-search">
        <div className="block-container">
          <h1>
            <label htmlFor="search">
              Find your current GP practice
            </label>
          </h1>
          <div className="clearfix">
            <input type="text" name="search" id="search" className="form-control" autoComplete="off"
                   value={this.props.searchText}
                   onChange={this.onChange} />
                 <span className="button">Search</span>
          </div>
        </div>
      </form>
    );
  },

  onChange: function(event) {
    this.props.handleSearchTextChange(event.target.value);
  }
});

var BackLink = React.createClass({
  render: function() {

    return (
      <div className="form-group -controls">
        <a href="current-gp" className="button-back">Back</a>
      </div>
    );
  },

  onChange: function(event) {
    this.props.handleSearchTextChange(event.target.value);
  }
});


var ResultsList = React.createClass({
  render: function() {
    return (
      <div className="block-container">
        <form name="gp-results" id="gp-results" method="post">
          {this.results()}
          {this.footer()}
        </form>
      </div>
    );
  },

  results: function() {
    if (this.props.practices.length > 0) {
      var results = this.props.practices.map(function(practice, index) {
        return <PracticeResult index={index} key={practice.code} practice={practice} />;
      });

      return (
        <div className="gp-finder-results" aria-live="polite">
          {results}
        </div>
      );
    }
  },

  footer: function() {
    return (
      <ResultsFooter numberOfResults={this.props.practices.length}
                     loadMoreResults={this.props.loadMoreResults}
                     loadMoreHref={this.props.loadMoreHref} />
    );
  }
});

var PracticeResult = React.createClass({
  render: function() {
    var practitioners = this.props.practice.practitioners.map(function(practitioner, index) {
          var key = this.props.practice.code + "-practitioner-" + index;
          return (
            <p className="person" key={key}>
              <img src="/images/person-placeholder.svg" width="45" height="45" alt="" />
              { " Dr. " }
              <span dangerouslySetInnerHTML={this.highlightText(practitioner.value, practitioner.matches)} />
            </p>
          );
        }.bind(this)),
        href = "/practice/" + this.props.practice.code,
        id = "result-" + this.props.index,
        className = (this.props.index % 20 === 0) ? "result start-of-page" : "result";

    if (this.props.practice.score.distance) {
      var distance = (
        <p className="distance">{this.props.practice.score.distance} miles away</p>
      );
    }

    return (
      <div className={className} id={id} tabIndex="0">
        <h2 className="result-title" dangerouslySetInnerHTML={this.highlightText(this.props.practice.name.value, this.props.practice.name.matches)} />
        <p className="address" dangerouslySetInnerHTML={this.highlightText(this.props.practice.address.value, this.props.practice.address.matches)} />
        {distance}
        {practitioners}
      </div>
    );
  },

  highlightText: function(text, matches) {
    var startIndices = {},
        endIndices = {},
        output = [];

    matches.forEach(function(startEndPair) {
      startIndices[startEndPair[0]] = true;
      endIndices[startEndPair[1]] = true;
    });

    for(var i = 0 ; i < text.length + 1 ; i++) {
      if(startIndices[i]){
        output += '<strong>';
      }
      if(endIndices[i - 1]){
        output += '</strong>';
      }
      if(!!text[i]) {
        output += text[i];
      }
    }
    return {__html: output};
  }

});


var ResultsFooter = React.createClass({
  render: function() {
    if (this.props.numberOfResults === 0) {
      return <NoResults />;
    }
    else if (this.props.loadMoreHref) {
      return <EndOfPage loadMoreHref={this.props.loadMoreHref}
                        loadMoreResults={this.props.loadMoreResults} />;
    }
    else {
      return <EndOfResults />;
    }
  }
});


var EndOfPage = React.createClass({
  render: function() {
    return (
      <div className="gp-finder-foot">
        <p>
          <a href={this.props.loadMoreHref} onClick={this.onClick}>Show more GP practices.</a>
        </p>
        <p>
          Or try searching again. You can search using:
        </p>
        <ul>
          <li>practice name</li>
          <li>practice address</li>
          <li>postcode</li>
          <li>doctor’s name</li>
        </ul>
        <p>
          <a href="#search">Search again</a>
        </p>
      </div>
    );
  },

  onClick: function(event) {
    event.preventDefault();
    event.stopPropagation();

    this.props.loadMoreResults();

    return false;
  }
});


var EndOfResults = React.createClass({
  render: function() {
    return (
      <div className="gp-finder-foot">
        <p>
          You can search using:
        </p>
        <ul>
          <li>practice name</li>
          <li>practice address</li>
          <li>postcode</li>
          <li>doctor’s name</li>
        </ul>
        <p>
          <a href="#search">Search again</a>
        </p>
      </div>
    );
  }
});


var NoResults = React.createClass({
  render: function() {
    return (
      <div className="gp-finder-no-results">
        <p>
          Sorry, no practices have been found. <a href="#search">Try searching again.</a>
        </p>
        <p>
          You can search using:
        </p>
        <ul>
          <li>practice name</li>
          <li>practice address</li>
          <li>postcode</li>
          <li>doctor’s name</li>
        </ul>
      </div>
    );
  }
});

ReactDOM.render(
  <Application />,
  document.getElementById('content')
);
