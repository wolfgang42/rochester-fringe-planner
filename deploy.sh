#!/bin/bash
set -e

source venv2/bin/activate
python2 ./website_to_calendar.py
node_modules/.bin/webpack
scp bundle.js index.html loading-bar.gif linestarve.com:/srv/http-static/rochesterfringe.linestarve.com/
