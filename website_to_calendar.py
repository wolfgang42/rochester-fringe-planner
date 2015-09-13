import re, datetime, json
import bs4, requests, pytz, icalendar

import requests_cache
requests_cache.install_cache('request_cache')

time_match = re.compile('^9\/([0-9][0-9]) at ([0-9]?[0-9]):([0-9][0-9])([ap])m$')
h4_time_match = re.compile('^September ([0-9][0-9])(th|rd|st|nd) at ([0-9]?[0-9]):([0-9][0-9])([ap])m$')
TZ_EST = pytz.timezone("America/New_York")
length_match = re.compile('^([0-9]+) minutes$')

eventNames = {}

shows = []
for page in range(1,52+1):
	r = requests.get('http://rochesterfringe.com/shows/page/'+str(page))
	r.raise_for_status()
	soup = bs4.BeautifulSoup(r.text, 'html.parser')
	for show_soup in soup.select('#shows .show'):
		show = {}
		header = show_soup.find('h2').find('a')
		show['name'] = header.get_text()
		show['link'] = header['href']
		show['description'] = show_soup.find(class_="details").find('p').get_text()
		
		if show['name'] not in eventNames:
			details = {}
			for detail in show_soup.select('.details ul.facts li'):
				details[detail.find('strong').get_text()] = detail.find('span')

			m = length_match.match(details['Show Length:'].get_text())
			if not m: raise Exception("Bad length!")
			show['length'] = int(m.group(1))
			show['times'] = []
			show['venue'] = details['Venue:'].get_text()
			show['genre'] = details['Genre:'].get_text()
			show['ages'] = details['Ages:'].get_text()
			if 'Ticket Price:' in details:
				price = details['Ticket Price:'].get_text()
				if price.strip() == 'Free':
					show['price'] = 0
				else:
					show['price'] = float(price.replace('$',''))
			# TODO multiple prices e.g. BIODANCE
			shows.append(show)
			eventNames[show['name']] = show
		
		m = h4_time_match.match(show_soup.find('h4').get_text())
		if not m: raise Exception("Bad time!")
		day = int(m.group(1))
		hour = int(m.group(3))
		if m.group(5)=='p' and hour != 12:
			hour += 12
		minute = int(m.group(4))
		eventNames[show['name']]['times'].append(datetime.datetime(2015, 9, day, hour, minute, 0, 0, TZ_EST))

def json_serial(obj):
	if isinstance(obj, datetime.datetime):
		return obj.isoformat()
	raise TypeError ("Type not serializable")

with open('fringe.json', 'w') as f:
	json.dump(eventNames, f, indent=4, default=json_serial)

cal = icalendar.Calendar()
cal.add('prodid', '-//Rochester Fringe Finder//fringefinder.linestarve.com//')
cal.add('version', '2.0')
i = 0
for show in shows:
	for time in show['times']:
		i+=1
		event = icalendar.Event()
		event['uid'] = str(i)+'@linestarve.com'
		event.add('summary', show['name'])
		event.add('description', show['description'])
		event.add('dtstart', time)
		event.add('dtend',   time+datetime.timedelta(minutes = show['length']))
		cal.add_component(event)

with open('fringe.ics', 'wb') as f:
	f.write(cal.to_ical())
