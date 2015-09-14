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
	self.length = show.length;
	self.description = show.description;
	
	self.scheduled = ko.observableArray();
	self.addToSchedule = function(datetime) {
		self.scheduled.push(datetime);
		self.tentative(false); // Fix a time
	}
	self.removeFromSchedule = function(datetime) {
		self.scheduled.remove(datetime);
	}
	self.inSchedule = function(item) {
		return self.scheduled.indexOf(item) != -1;
	}
	
	self.tentative = ko.observable(false);
	self.makeTentative = function() {self.tentative(true);}
	self.unmakeTentative = function() {self.tentative(false);}
	self.tentativeVisible = ko.pureComputed(function() {
		if (self.tentative()) return false; // Don't show button if already clicked
		if (self.times.length == 1) return false; // Only one possible time anyway
		if (self.scheduled().length > 0) return false; // One has already been scheduled
		return true;
	});
	
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

$(document).ready(function() {
	ko.applyBindings(viewModel)
	
	var calendar = $('#calendar').fullCalendar({
		header: {
			left: 'title',
			center: 'prev,next today',
			right: 'agendaWeek,agendaDay',
		},
		height: 'auto',
		defaultView: 'agendaWeek',
		events: []
	})
	
	ko.computed(function() {
		var events = [];
		showViews.forEach(function(show) {
			show.times.forEach(function(time) {
				if (!show.tentative() && !show.inSchedule(time)) return;
				events.push({
					title: show.name,
					start: time,
					end: moment(time).add(show.length, 'minutes'),
					color: show.tentative()?'grey':'darkblue'
				})
			})
		})
		calendar.fullCalendar('removeEvents')
		calendar.fullCalendar('addEventSource', events)
	});
})


