# hazifeladat-restapi

Depencies:
- flask
- flask-sqlalchemy
- gevent
- gevent-websocket
- flask-socketio

Rename /app_config/app_config template.py to app_config.py

Create a [github oauth app](https://github.com/settings/developers) and set the client_id and client_secret inside teh app_config.py, or the github oauth login wont work

If you have ssl certificates, add it to the app_config.py, set use_ssl to True, and set the port to 443 if necessary

The setup is now done. Run server.py to deploy the app.
