import re, datetime, json
import bs4, requests, pytz, icalendar

import requests_cache
requests_cache.install_cache('request_cache')

time_match = re.compile('^9\/([0-9][0-9]) at ([0-9]?[0-9]):([0-9][0-9])([ap])m$')
h4_time_match = re.compile('^September ([0-9][0-9])(th|rd|st|nd) at ([0-9]?[0-9]):([0-9][0-9])([ap])m$')
TZ_EST = pytz.timezone("US/Eastern")
length_match = re.compile('^([0-9]+) Minutes$')

eventNames = {}
for page in range(1,28+1):
	r = requests.get('http://rochesterfringe.com/tickets-and-shows/page/'+str(page))
	r.raise_for_status()
	soup = bs4.BeautifulSoup(r.text, 'html.parser')
	for show_soup in soup.select('#primary .main .show'):
		show = {}
		header = show_soup.find('h2').find('a')
		show['name'] = header.get_text()
		show['link'] = header['href']
		show['description'] = ''
		for p in show_soup.find(class_='row').select('div:nth-of-type(2) > p'):
			if not p.has_attr('class'):
				show['description'] += p.get_text()+'\n'
		
		if show['name'] not in eventNames:
			details = {}
			for detail in show_soup.select('ul.details li'):
				details[detail.find('strong').get_text()] = detail.contents[-1].strip() # Text not in <strong>

			m = length_match.match(details['Length:'])
			if not m: raise Exception("Bad length!")
			show['length'] = int(m.group(1))
			show['times'] = []
			show['venue'] = details['Venue:']
			show['genre'] = details['Genre:']
			show['tickets'] = details['Tickets:']
			# if 'Ticket Price:' in details:
			# 	price = details['Ticket Price:']
			# 	if price.strip() == 'Free':
			# 		show['price'] = 0
			# 	else:
			# 		show['price'] = float(price.replace('$',''))
			# # TODO multiple prices e.g. BIODANCE
			eventNames[show['name']] = show
		
		m = h4_time_match.match(show_soup.select('.lead.extra')[0].get_text().strip())
		if not m: raise Exception("Bad time!")
		day = int(m.group(1))
		hour = int(m.group(3))
		if m.group(5)=='p' and hour != 12:
			hour += 12
		minute = int(m.group(4))
		eventNames[show['name']]['times'].append(TZ_EST.localize(datetime.datetime(2015, 9, day, hour, minute, 0, 0)))

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
for event in eventNames:
	show = eventNames[event]
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
