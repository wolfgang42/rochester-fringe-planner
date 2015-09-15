# Developing
You'll need to set up a Python virtualenv to fetch the data from the website:
```bash
virtualenv venv2
source venv2/bin/activate
pip install -r requirements.txt
```

Now you can generate the `fringe.json` file:
```bash
python website_to_calendar.py
```

And set up the NPM dependencies:
```bash
npm install
```

Now you can run `webpack-dev-server` (assuming you already have it installed; if not `npm -g webpack-dev-server` first) and go to http://localhost:8080.
