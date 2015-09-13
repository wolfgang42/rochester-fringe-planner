var ko = require('knockout')

var shows = require('json!./fringe.json')

var genres = {};
var venues = {};
var showViews = [];
Object.keys(shows).forEach(function(showName){
	var show = shows[showName];console.log(showName, show)
	showViews.push(new ShowViewModel(show))
	genres[show.genre] = true;
	venues[show.venue] = true;
})

var selectedGenres = ko.observableArray(Object.keys(genres));
var selectedVenues = ko.observableArray(Object.keys(venues));

function ShowViewModel(show) {
	var self = this;
	
	self.name = show.name;
	self.genre = show.genre;
	self.venue = show.venue;
	
	self.visible = ko.pureComputed(function() {
		if (selectedGenres.indexOf(self.genre) == -1) return false;
		if (selectedVenues.indexOf(self.venue) == -1) return false;
		return true;
	});
}

var viewModel = {
	shows: showViews,
	genres: Object.keys(genres),
	venues: Object.keys(venues),
	selectedGenres: selectedGenres,
	selectedVenues: selectedVenues,
}

ko.applyBindings(viewModel)

ko.computed(function(){
	console.log('sG', viewModel.selectedGenres())
	console.log('sV', viewModel.selectedVenues())
})
