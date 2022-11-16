import os
import shutil
from io import BytesIO
from urllib import response
import flask
import hashlib
from sqlalchemy import or_, desc
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta, datetime
from flask import Flask, flash, jsonify, redirect, url_for, render_template, send_from_directory, request, Response, session, send_file, abort
import time
from random import randint
import json
import flask_admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.menu import MenuLink
import random

filePath = os.path.realpath(__file__)
filePath = filePath.replace('\\server.py', '')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'KutyaFasz123'
app.config['UPLOAD_FOLDER'] = './static/uploads'
app.permanent_session_lifetime = timedelta(days=1)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///restapi.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False

db = SQLAlchemy(app)
admin = flask_admin.Admin(app, name='API')

#databases
class Posts(db.Model):
    id = db.Column(db.Integer, primary_key=True, unique=True, autoincrement=True)
    leiras = db.Column(db.String, nullable=False)
    hatarido = db.Column(db.Date, nullable=False)
    hatarido_kod = db.Column(db.Integer, nullable=False)
    
    file = db.Column(db.String)
    file_mimetype = db.Column(db.String)

    def __repr__(self):
        return f'Post: {self.id}'

@app.before_request
def tokenGenerator():

    if 'token' not in session.keys():
        session['token'] = f'{randint(1000,9999)}-{randint(1000,9999)}'


@app.route('/favicon.ico')
def favicon():
    return send_file(f'{filePath}\\static\\assets\\favicon.ico')

#api
@app.route('/api')
def api():
    return jsonify({'status': 200, 'version': 1})

@app.route('/api/session')
def apiSession():
    return jsonify({'token': f'{session["token"]}'})

@app.route('/api/session/reset')
def apiSessionReset():
    session.clear()
    return redirect('/api/session')


@app.route('/api/posts/upload', methods=['POST', 'GET']) #post
def apiPostsUpload():
    if request.method == 'POST':
        leiras = request.form['leiras']
        hatarido = datetime.strptime(request.form['hatarido'], '%Y-%m-%d')
        hatarido_kod = hatarido.timestamp()+89580 #23:59

        file = request.files['file']
        file_name = file.filename
        file_mimetype = file.mimetype
        
        if len(file_name) == 0:
            file = None
            file_name = None
            file_mimetype = None

    postToSave = Posts(leiras = leiras, hatarido = hatarido, hatarido_kod = hatarido_kod, file=file_name, file_mimetype=file_mimetype)
    db.session.add(postToSave)
    db.session.commit()
    post = Posts.query.order_by(desc(Posts.id)).first()
    
    if file != None:
        try:
            os.mkdir(f"{filePath}\\static\\uploads\\{post.id}")
        except:
            pass
        try:
            with open(f"{filePath}\\static\\uploads\\{post.id}\\{post.file}", 'wb') as f:
                f.write(file.read())
        except:
            pass
    
    return redirect('/')

@app.route('/api/posts') #get
def apiPosts():
    postsDict = {'status':0, 'posts': []}
    postsQuery = Posts.query.order_by(desc(Posts.hatarido_kod)).all()
    for post in postsQuery:
        postsDict['posts'].append(dict(id=post.id, leiras=post.leiras, hatarido=str(post.hatarido), hatarido_kod=post.hatarido_kod, file=post.file, file_mimetype=post.file_mimetype))
    postsDict['status'] = 200
    return jsonify(postsDict)

@app.route('/api/posts/<id>') #get
def apiPostsId(id):
    postsDict = {'status':0, 'post': {}}
    post = Posts.query.filter(Posts.id==id).order_by(desc(Posts.hatarido_kod)).first()
    postsDict['post'] = (dict(id=post.id, leiras=post.leiras, hatarido=str(post.hatarido), hatarido_kod=post.hatarido_kod, file=post.file, file_mimetype=post.file_mimetype))
    postsDict['status'] = 200
    return jsonify(postsDict)

@app.route('/api/posts/<id>/file') #get
def appRouteIdFile(id):
    post = Posts.query.filter(Posts.id==id).first()
    if post.file!=None and post.file != '': 
        return send_file(f'{filePath}\\static\\uploads\\{id}\\{post.file}', mimetype=post.file_mimetype)
    else:
        return Response(response=json.dumps(dict(status=204)), status=204, mimetype='application/json')

@app.route('/api/posts/<id>/delete', methods=['GET', 'DELETE']) #delete
def apiPostsIdDelete(id):
    if request.method.lower() != 'delete':
        return Response(response=json.dumps(dict(status=405)), status=405, mimetype='application/json')
    else:
        db.session.delete(Posts.query.filter(Posts.id==id).first())
        db.session.commit()
        try:
            shutil.rmtree(f'{filePath}\\static\\uploads\\{id}')
        except:
            pass
        return Response(response=json.dumps(dict(status=200)), status=200, mimetype='application/json')

@app.route('/api/posts/edit', methods=['GET', 'POST'])
def apiPostsEdit():
        
    leiras = request.form['eleiras']
    hatarido = datetime.strptime(request.form['ehatarido'], '%Y-%m-%d')
    hatarido_kod = hatarido.timestamp()+89580 #23:59
    
    id = request.form['eid']
    file = request.files['efile']
    file_name = file.filename
    file_mimetype = file.mimetype

    try:
        deleteFile = request.form['deleteFile']
    except:
        deleteFile = 'off'
    
    if len(file_name) == 0 or deleteFile == 'on':
        file = None
        file_name = None
        file_mimetype = None
    if deleteFile == 'on':
        try:
            shutil.rmtree(f'{filePath}\\static\\uploads\\{id}')
        except:
            pass
    
    post = Posts.query.filter(Posts.id == id).first()
    print(post)
    post.leiras = leiras
    post.hatarido = hatarido
    post.hatarido_kod = hatarido_kod
    post.file = file_name
    post.file_mimetype = file_mimetype
    db.session.commit()
    
    print(leiras,hatarido,file,deleteFile, id)

    return redirect('/')


#pages
@app.route('/')
def index():
    return render_template('index.html')

@app.context_processor
def handle_context():
    return dict(session=session)


if __name__ == '__main__':
    db.create_all()
    app.run(host='0.0.0.0', port=6969, debug=True)