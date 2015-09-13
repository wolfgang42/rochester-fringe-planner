var ko = require('knockout')

var shows = require('json!./fringe.json')

var genres = {};
var venues = {};
var showViews = [];
Object.keys(shows).forEach(function(showName){
	var show = shows[showName];
	showViews.push(new ShowViewModel(show))
	genres[show.genre] = true;
	venues[show.venue] = true;
})

var selectedGenres = ko.observableArray(Object.keys(genres));
var selectedVenues = ko.observableArray(Object.keys(venues));
var schedule = ko.observableArray();

function ShowViewModel(show) {
	var self = this;
	
	self.name = show.name;
	self.genre = show.genre;
	self.venue = show.venue;
	self.times = show.times;
	self.description = show.description;
	
	self.scheduled = ko.observableArray();
	self.addToSchedule = function(datetime) {
		self.scheduled.push(datetime);
	}
	self.removeFromSchedule = function(datetime) {
		self.scheduled.remove(datetime);
	}
	self.inSchedule = function(item) {
		return self.scheduled.indexOf(item) == -1;
	}
	
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
