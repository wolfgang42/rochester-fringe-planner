var ko = require('knockout')

var shows = require('json-loader!./fringe.json')

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
	self.link = show.link;
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
	
	self.toJSON = function() {
		if (self.scheduled().length == 0) {
			return self.tentative();
		} else {
			return self.scheduled();
		}
	}
	self.fromJSON = function(value) {
		if (typeof value == "boolean") {
			self.tentative(value);
			self.scheduled([]);
		} else {
			self.tentative(false);
			self.scheduled(value);
		}
	}
}

var viewModel = {
	shows: showViews,
	genres: Object.keys(genres),
	venues: Object.keys(venues),
	selectedGenres: selectedGenres,
	selectedVenues: selectedVenues,
}

$(document).ready(function() {
	document.getElementById('events').innerHTML = require('raw-loader!./events.html')
	document.getElementById('events-times').innerHTML = require('raw-loader!./times.html')
	document.getElementById('schedule').innerHTML = ''
	
	ko.applyBindings(viewModel)
	
	var calendar = $('#schedule').fullCalendar({
		header: {
			left: 'title',
			center: 'prev,next today',
			right: 'agendaWeek,agendaDay',
		},
		allDaySlot: false,
		minTime: '10:00:00', // TODO calculate
		height: 'auto',
		defaultView: 'agendaWeek',
		events: [],
		eventRender: function(event, element) {
			var qtip_content = document.createElement('span')
			qtip_content.innerHTML = '<div data-bind="text:description"></div><div><a data-bind="attr:{href:link}" target="_blank">More information</a></div><div><strong>Venue:</strong> <span data-bind="text:venue"></div>'+require('raw-loader!./times.html')
			ko.applyBindings(event._show, qtip_content)
			element.qtip({
				content: {
					title: event.title,
					text: $(qtip_content),
				},
				position: {
					my: 'bottom left',
					at: 'top left',
					viewport: $(window),
				},
				style: {
					classes: 'qtip-bootstrap',
				},
				hide: {
					delay: 100,
					fixed: true,
				},
			})
		},
	})
	
	// I can't figure out why, but fullcalendar insists that this tab be active
	// in order to render into it. We therefore deactivate it right after load
	// to prevent it from showing up.
	calendar.removeClass('active')
	$('#tabbar a').click(function (e) {
		e.preventDefault()
		$(this).tab('show')
		calendar.fullCalendar('rerenderEvents')
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
					color: show.tentative()?'grey':'darkblue',
					_show: show,
					_time: time,
				})
			})
		})
		calendar.fullCalendar('removeEvents')
		calendar.fullCalendar('addEventSource', events)
	});
})

var store = require('./store')
window.store=store;
if (store.enabled) { // TODO warning message?
	// Read in data at startup
	if (store.get('fringe2017')) {
		var data = store.get('fringe2017');
		showViews.forEach(function(show) {
			if (typeof data[show.name] == 'undefined') return
			show.fromJSON(data[show.name])
		});
	}
	// Save data on changes
	ko.computed(function() {
		var json = {}
		showViews.forEach(function(show) {
			json[show.name] = show.toJSON()
		})
		store.set('fringe2017', json)
	});
}
