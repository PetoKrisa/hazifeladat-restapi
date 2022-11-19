import os
import shutil
from io import BytesIO
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
from uuid import uuid4

filePath = os.path.realpath(__file__)
filePath = filePath.replace('\\server.py', '')

def auth(_auth, _roles):
    user = Users.query.filter(Users.token == _auth).all()
    if len(user) < 1:
        return Response(response=json.dumps(dict(status=401)), status=401, mimetype='application/json')
    elif user[0].role not in _roles:
        return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    else:
        return None

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
    users_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'Post: {self.id}'
    
class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True, unique=True, autoincrement=True)
    token = db.Column(db.String, unique=True, nullable=False)
    username = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.String)
    posts = db.relationship('Posts', backref='users')

    def __repr__(self):
        return f'Post: {self.id}'

roles = {1: 'user', 2: 'editor', 3: 'admin'}

admin.add_view(ModelView(Posts, db.session))
admin.add_view(ModelView(Users, db.session))
admin.add_link(MenuLink(name='Site', url='/'))

@app.before_request
def underAttackMode():
    #return Response(response="418 -  I'm a teapot", status=418)
    return


@app.route('/favicon.ico')
def favicon():
    return send_file(f'{filePath}\\static\\assets\\favicon.ico')

#api
@app.route('/api')
def api():
    return jsonify({'status': 200, 'version': 1})

@app.route('/api/docs')
def apiDocs():
    return render_template('apidoc.html')

#api users
@app.route('/api/users/add') #get
def apiUsersAdd():
    try:
        if not session['admin']:
            return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    except:
        return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    try:
        username = request.args['user']
        password = request.args['pass']
        role = request.args['role']
        
        if role not in roles.values():
            return Response(response=json.dumps(dict(status=406)), status=406, mimetype='application/json')
    except:
        return Response(response=json.dumps(dict(status=406)), status=406, mimetype='application/json')
    
    hashPassword = hashlib.sha256(password.encode()).hexdigest()
    token = str(uuid4())
    db.session.add(Users(username=username, password=hashPassword, token=token, role=role))
    db.session.commit()
    return Response(response=json.dumps(dict(status=200)), status=200, mimetype='application/json')

@app.route('/api/users/login', methods=['GET', 'POST']) #post
def apiSessionLogin():
    if request.method.lower() != 'post':
        return Response(response=json.dumps(dict(status=405)), status=405, mimetype='application/json')
    else:
        username = request.form['username']
        password = request.form['password']
        hashPassword = hashlib.sha256(password.encode()).hexdigest()
        
        user = Users.query.filter(Users.password == hashPassword, Users.username == username).first()

        if user.role == 'admin':
            session['admin'] = True
        
        try:
            return Response(response=json.dumps(dict(token=user.token, role=user.role, username=user.username, id=user.id, status=200)), status=200, mimetype='application/json')
        except:
            return Response(response=json.dumps(dict(status=404)), status=404, mimetype='application/json')

@app.route('/api/posts/upload', methods=['POST', 'GET']) #post
def apiPostsUpload():

    error = auth(request.headers['auth'], ['admin', 'editor'])
    if error != None:
        return error
    
    
    if request.method == 'POST':
        leiras = request.form['leiras']
        hatarido = datetime.strptime(request.form['hatarido'], '%Y-%m-%d')
        hatarido_kod = hatarido.timestamp()+89580 #23:59

        file = request.files['file']
        files = request.files.getlist('file')
        
        if len(files) == 0:
            file = None
            files = None
            
    user = Users.query.filter(Users.token == request.headers['auth']).first()
    postToSave = Posts(leiras = leiras, hatarido = hatarido, hatarido_kod = hatarido_kod, users_id=user.id)
    db.session.add(postToSave)
    db.session.commit()
    post = Posts.query.order_by(desc(Posts.id)).first()
    
    if file != None:
        try:
            os.mkdir(f"{filePath}\\static\\uploads\\{post.id}")
            post.file = (f"{filePath}\\static\\uploads\\{post.id}")
        except:
            pass
        for save in files:
            try: #ha nem működik nem működik
                with open(f"{filePath}\\static\\uploads\\{post.id}\\{save.filename.replace(' ', '_')}", 'wb') as f:
                    f.write(save.read())
            except:
                pass
    db.session.commit()
            
    
    return redirect('/')

@app.route('/api/posts') #get
def apiPosts():
    postsDict = {'status':0, 'posts': []}
    postsQuery = Posts.query.order_by(desc(Posts.hatarido_kod)).all()
    for post in postsQuery:
        user = Users.query.filter(Users.id == post.users_id).first()
        try:
            files = os.listdir(f"{filePath}\\static\\uploads\\{post.id}")
            postsDict['posts'].append(dict(id=post.id, leiras=post.leiras, hatarido=str(post.hatarido), hatarido_kod=post.hatarido_kod, files=files, author=[user.id, user.username]))
        except FileNotFoundError:
            pass
            
    postsDict['status'] = 200
    return jsonify(postsDict)

@app.route('/api/posts/<id>') #get
def apiPostsId(id):
    postsDict = {'status':0, 'post': {}}
    files = os.listdir(f"{filePath}\\static\\uploads\\{id}")
    post = Posts.query.filter(Posts.id==id).order_by(desc(Posts.hatarido_kod)).first()
    user = Users.query.filter(Users.id == post.users_id).first()
    postsDict['post'] = (dict(id=post.id, leiras=post.leiras, hatarido=str(post.hatarido), hatarido_kod=post.hatarido_kod, files=files, author=[user.id, user.username]))
    postsDict['status'] = 200
    return jsonify(postsDict)

@app.route('/api/posts/<id>/file/<fileName>') #get
def appRouteIdFile(id, fileName):
    post = Posts.query.filter(Posts.id==id).first()
    try:
        return send_file(f'{filePath}\\static\\uploads\\{id}\\{fileName}')
    except:
        return Response(response=json.dumps(dict(status=204)), status=204, mimetype='application/json')

@app.route('/api/posts/<id>/file/<fileName>/delete', methods=['get', 'delete']) #delete
def apiPostsIdFileFilenameDelete(id, fileName):
    
    error = auth(request.headers['auth'], ['admin', 'editor'])
    if error != None:
        return error
    user = Users.query.filter(Users.token == request.headers['auth']).first()
    post = Posts.query.filter(Posts.id == id).first()
    if user.role != 'admin':
        if user.id != post.users_id:
            print(user.role != 'admin', user.id != id)
            return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    
    if request.method.lower() != 'delete':
        return Response(response=json.dumps(dict(status=405)), status=405, mimetype='application/json')
    else:
        os.remove(f'{filePath}\\static\\uploads\\{id}\\{fileName}')
        return Response(response=json.dumps(dict(status=200)), status=200, mimetype='application/json')

@app.route('/api/posts/<id>/delete', methods=['GET', 'DELETE']) #delete
def apiPostsIdDelete(id):
    error = auth(request.headers['auth'], ['admin', 'editor'])
    if error != None:
        return error
    user = Users.query.filter(Users.token == request.headers['auth']).first()
    post = Posts.query.filter(Posts.id == id).first()
    if user.role != 'admin':
        if user.id != post.users_id:
            print(user.role != 'admin', user.id != id)
            return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    
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

@app.route('/api/posts/edit', methods=['GET', 'POST']) #post
def apiPostsEdit():
    error = auth(request.headers['auth'], ['admin', 'editor'])
    if error != None:
        return error
    
    id = request.form['eid']
    user = Users.query.filter(Users.token == request.headers['auth']).first()
    post = Posts.query.filter(Posts.id == id).first()
    if user.role != 'admin':
        if user.id != post.users_id:
            print(user.role != 'admin', user.id != id)
            return Response(response=json.dumps(dict(status=403)), status=403, mimetype='application/json')
    
    if request.method.lower() != 'post':
        return Response(response=json.dumps(dict(status=405)), status=405, mimetype='application/json')
    else:
        leiras = request.form['eleiras']
        hatarido = datetime.strptime(request.form['ehatarido'], '%Y-%m-%d')
        hatarido_kod = hatarido.timestamp()+89580 #23:59
        

        files = request.files.getlist('efile')
            
        if len(files) == 0:
            files = None

        try:
            deleteFile = request.form['deleteFile']
        except:
            deleteFile = 'off'
            
        if deleteFile == 'on':
            try:
                shutil.rmtree(f'{filePath}\\static\\uploads\\{id}')
            except:
                pass
            
        if len(files) != 0:
            try:
                os.mkdir(f"{filePath}\\static\\uploads\\{id}")
            except:
                pass
            
            for save in files:
                try:
                    with open(f"{filePath}\\static\\uploads\\{id}\\{save.filename.replace(' ', '_')}", 'wb') as f:
                        f.write(save.read())
                except:
                    pass

        
        post = Posts.query.filter(Posts.id == id).first()
        
        post.leiras = leiras
        post.hatarido = hatarido
        post.hatarido_kod = hatarido_kod
        if deleteFile=='on':
            post.file = None
        elif len(files) != 0:
            post.file = f"{filePath}\\static\\uploads\\{id}"
        
        db.session.commit()
    return redirect('/')



#pages
@app.route('/')
def index():
    return render_template('index.html')

@app.context_processor
def handle_context():
    return dict(session=session)

with app.app_context():
    if __name__ == '__main__':
        db.create_all()
        app.run(host='0.0.0.0', port=6969, debug=True)