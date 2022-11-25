const sio = io()

sio.on('update', ()=>{
    generateTable()
})

function safeText(text){
    text = text.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    return text
}

function isValid(form){

    isInvalid = false
    Array.from(document.getElementById(form).elements).forEach(el=>{

        if (('required' in el.attributes) && (el.value == '')){
            console.log('invalid field')
            isInvalid = true
        } else{
            console.log('valid field')
        }
    })
    console.log('form is invalid: ', isInvalid)
    if (isInvalid == false){
        return true
    } else{
        return false
    }
}

function generateTable(){
    fetch('/api/posts', {method:'get'})
    .then((r)=>{return r.json()})
    .then((d)=>{
        document.getElementById("postCounter").innerHTML = `${d['posts'].length} feladat`
    
    //clear table
    document.getElementById('tbody').innerHTML = ''

    posts = d['posts']
    for (e = 0; e < posts.length; e++){

        if(localStorage.role=='admin' || (localStorage.id == posts[e].author[0] && localStorage.role=='editor') ){
            ticon = `<i onclick="openDelPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-trash-can"></i>`
            eicon = `<i onclick="openEditPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-pen"></i>`
        } else {
            ticon = ""
            eicon = ""
        }

        if(localStorage.showOld == 'true' && posts[e].hatarido_kod < Date.now()/1000){
            console.log('régi')
            document.getElementById('tbody').innerHTML = document.getElementById('tbody').innerHTML +
            `
            <tr class="tr">
            <td><p>${posts[e].id}</p></td>
            <td><p>${safeText(posts[e].leiras)}</p></td>
            <td><p>${posts[e].hatarido}</p></td>
            <td><p><i onclick="openPostPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-magnifying-glass"></i></p></td>
            <td class="role">${ticon}</td>
            <td class="role">${eicon}</td>
            </tr>
            `
        } else if(posts[e].hatarido_kod > Date.now()/1000){
            console.log('új')
            document.getElementById('tbody').innerHTML = document.getElementById('tbody').innerHTML +
            `
            <tr class="tr">
            <td><p>${posts[e].id}</p></td>
            <td><p>${safeText(posts[e].leiras)}</p></td>
            <td><p>${posts[e].hatarido}</p></td>
            <td><p><i onclick="openPostPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-magnifying-glass"></i></p></td>
            <td class="role">${ticon}</td>
            <td class="role">${eicon}</td>
            </tr>
            `

        }

        

    }
    
    trs = document.getElementsByClassName('tr')
   
    
    for(i=0;i<trs.length;i++){
        trs[i].addEventListener('mousemove', (e) =>{
            x = e.clientX - e.target.closest('.tr').getBoundingClientRect().left
            y = e.clientY - e.target.closest('.tr').getBoundingClientRect().top
            
            root = document.querySelector(':root')
            root.style.setProperty('--mx', x+'px')
            root.style.setProperty('--my', y+'px')
        })
    }
    
    })

}
generateTable()

function changeVisibility(e){
    if (e.checked == true){
        localStorage.showOld = 'true'
    } else if (e.checked == false){
        localStorage.showOld = 'false'
    }
    generateTable()  
}

function updateVisinilityButton(){
    if (localStorage.showOld == 'true'){
        document.getElementById('visibility').checked = true
    } else{
        document.getElementById('visibility').checked = false
    }
}
updateVisinilityButton()

function theme(){
    let tables = document.getElementsByClassName('table')
    let root = document.querySelector(':root')
    
    console.log('theme')
    cs = getComputedStyle(root)
    if(localStorage.theme == 'light'){
        Array.prototype.forEach.call(tables, (e)=>{
            e.classList.add('table-dark')
        })
        root.style.setProperty('--bg-active', cs.getPropertyValue('--dark'))
        root.style.setProperty('--fg-active', cs.getPropertyValue('--darker'))
        root.style.setProperty('--text-active', 'rgb(255,255,255)')
        root.style.setProperty('--glow', 'rgba(255,255,255,0.2)')
    } else{
        Array.prototype.forEach.call(tables, (e)=>{
            e.classList.remove('table-dark')
        })
        root.style.setProperty('--bg-active', cs.getPropertyValue('--light'))
        root.style.setProperty('--fg-active', cs.getPropertyValue('--lighter'))
        root.style.setProperty('--text-active', 'rgb(0,0,0)')
        root.style.setProperty('--glow', 'rgba(180,180,180,0.45)')
    }
    
}

function setTheme(){
    document.body.classList.add('transition')
    if(localStorage.theme != 'light'){
        localStorage.theme = 'light'
        theme()
    }
    else{
        localStorage.theme = 'dark'
        theme()
    }
    setTimeout(()=>{document.body.classList.remove('transition')}, 200)
    
}
//load theme on startup
theme()


function openUploadPopup(){
    document.getElementById("uploadPopup").showModal()
}
function closeUploadPopup(){
    document.getElementById("uploadPopup").close()
}
function upload(){

    const uploadForm = new FormData(document.getElementById("uploadForm"))
    //fetch('/api/posts/upload', {method: 'post', body: uploadForm, headers: {'auth': localStorage.token}})

    
    if (!isValid('uploadForm')){
        return
    }

    const request = new XMLHttpRequest()
    uploadProgress = document.getElementById('uploadProgress')

    fileSelector = document.getElementById("file").files
    contentLength = 0
    for(let i = 0; i < fileSelector.length;i++){
        contentLength = contentLength + fileSelector[i].size
    }
    contentLength = contentLength

    request.open('POST', '/api/posts/upload')
    request.setRequestHeader('auth', localStorage.token)
    request.addEventListener('loadstart', (e)=>{
        uploadProgress.classList.remove('visually-hidden')
        uploadProgress.value = 0
    })
    request.addEventListener('load', ()=>{
        uploadProgress.classList.add('visually-hidden')
        closeUploadPopup()
        generateTable()
    }) 
    request.upload.addEventListener('progress', (e)=>{
        console.log(Math.floor((e.loaded/contentLength)*100), e.loaded, contentLength)
        uploadProgress.value = Math.floor((e.loaded/contentLength)*100)
    })
    request.send(uploadForm)
        
}

function openDelPopup(e){
    document.getElementById('deletePopup').showModal()
    document.getElementById('delBtn').dataset.id = e.dataset.id
}
function closeDelPopup(){
    document.getElementById('deletePopup').close()
}

function del(e){
    fetch(`/api/posts/${e.dataset.id}/delete`, {method: 'delete', headers: {'auth': localStorage.token}})
    .then(d=>{
        closeDelPopup()
        generateTable()
    })
}

function openEditPopup(e){
    fetch(`/api/posts/${e.dataset.id}`)
    .then(d=>d.json())
    .then((r)=>{
        document.getElementById('eleiras').innerHTML = safeText(r['post']['leiras'])
        document.getElementById('ehatarido').value = r['post']['hatarido']
        document.getElementById('eid').value = r['post']['id']

        })
    document.getElementById('editPopup').showModal()
    document.getElementById('editBtn').dataset.id = e.dataset.id
}

function closeEditPopup(){
    document.getElementById('editPopup').close()
}

function edit(){
    console.log(document.getElementById('eid').value)
    const editForm = new FormData(document.getElementById("editForm"))
    const request = new XMLHttpRequest()
    
    if (!isValid('editForm')){
        return
    }

    editProgress = document.getElementById('editProgress')

    fileSelector = document.getElementById("efile").files
    contentLength = 0
    for(let i = 0; i < fileSelector.length;i++){
        contentLength = contentLength + fileSelector[i].size
    }
    contentLength = contentLength

    request.open('POST', '/api/posts/edit')
    request.setRequestHeader('auth', localStorage.token)
    request.addEventListener('loadstart', (e)=>{
        editProgress.classList.remove('visually-hidden')
        editProgress.value = 0
    })
    request.addEventListener('load', ()=>{
        editProgress.classList.add('visually-hidden')
        closeEditPopup()
        generateTable()
    }) 
    request.upload.addEventListener('progress', (e)=>{
        console.log(Math.floor((e.loaded/contentLength)*100), e.loaded, contentLength)
        editProgress.value = Math.floor((e.loaded/contentLength)*100)
    })
    request.send(editForm)
}

function openPostPopup(e){
    fetch(`/api/posts/${e.dataset.id}`)
    .then(d=>d.json())
    .then((r)=>{
        document.getElementById('pleiras').innerHTML = safeText(r['post']['leiras'])
        document.getElementById('phatarido').innerHTML = `${r['post']['hatarido']}&nbsp;&#x2022;&nbsp;${r['post']['author'][1]}`
        pfileok = document.getElementById('pfileok')
        pfileok.innerHTML = ""

        for (let i = 0; i < r['post']['files'].length; i++){
            if (localStorage.role=='admin' || (localStorage.id == r['post']['author'][0] && localStorage.role=='editor')){
                ticon = `<i onclick="delFile(this)" data-id="${r['post']['id']}" data-file="${r['post']['files'][i]}" class="role float-end fa-sharp fa-solid fa-trash"></i>`
            } else{
                ticon = ""
            }
            pfileok.innerHTML = pfileok.innerHTML +
            `
            <li data-id="${r['post']['id']}" class="list-group-item">
                ${r['post']['files'][i]}
                
                ${ticon}
                <p class="float-end" >&nbsp; </p>
                <i onclick="openFile(this)" data-id="${r['post']['id']}" data-file="${r['post']['files'][i]}" class="float-end fa-solid fa-download"></i>
                </li>
            
            `
        }
    })
    document.getElementById('postPopup').showModal()
    document.getElementById('postPopup').dataset.id = e.dataset.id
}

function closePostPopup(){
    document.getElementById('postPopup').close()
}

function delFile(e){
    fetch(`/api/posts/${e.dataset.id}/file/${e.dataset.file}/delete`, {method: 'delete', headers: {'auth': localStorage.token}})
    .then(r=>r.json())
    .then(d=>{
        if (d['status'] == 200){
            pfileok = document.getElementById('pfileok')
            pfileok.removeChild(e.closest('li'))
        }
    })

}   

function openFile(e){
    window.open(`/api/posts/${e.dataset.id}/file/${e.dataset.file}`, '_blank')
}

function isLoggedIn(){
    let root = document.querySelector(':root')
    cs = getComputedStyle(root)
    if (localStorage.getItem('login')=='true'){
        document.getElementById('login-btn').classList.add('visually-hidden')

        document.getElementById('logout-btn').classList.remove('visually-hidden')
        document.getElementById('user').classList.remove('visually-hidden')

        document.getElementById('user').innerHTML = `&nbsp;&#x2022;&nbsp;${localStorage.username}`

        if (localStorage.role == 'editor' || localStorage.role == 'admin' ){
            root.style.setProperty('--show', 'inline-block')
            root.style.setProperty('--show-td', 'table-cell')
        }
    } else{
        document.getElementById('logout-btn').classList.add('visually-hidden')
        document.getElementById('user').classList.add('visually-hidden')

        document.getElementById('login-btn').classList.remove('visually-hidden')

        document.getElementById('user').innerHTML = ''

        root.style.setProperty('--show', 'none')
        root.style.setProperty('--show-td', 'none')

    }
}

function openLoginPopup(){
    document.getElementById('loginPopup').showModal()
}
function closeLoginPopup(){
    document.getElementById('loginPopup').close()
}

function login(){
    const loginForm = new FormData(document.getElementById("loginForm"))

    fetch('/api/users/login', {body: loginForm, method: 'post'})
    .then(r=>r.json())
    .then(d=>{
        if(d['status']==404){
            document.getElementById("login-alert").classList.remove("visually-hidden")
        } else{
            document.getElementById("login-alert").classList.add("visually-hidden")

            localStorage.login = 'true'
            localStorage.token = d['token']
            localStorage.role = d['role']
            localStorage.username = d['username']
            localStorage.id = d['id']

            closeLoginPopup()
            isLoggedIn()
            generateTable()
        }
    })
}

function manageOauth(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.get('oauth_github') != undefined){
        fetch(`https://petokrisa.hu/api/users/oauth2/github/login?code=${urlParams.get('oauth_github')}`)
        .then(d=>d.json())
        .then(r=>{
            localStorage.login = 'true'
            localStorage.token = r['token']
            localStorage.role = r['role']
            localStorage.username = r['username']
            localStorage.id = r['id']

            closeLoginPopup()
            isLoggedIn()
            generateTable()
            window.history.replaceState({}, document.title, "/");

        })
    }
}

function loginGithub(){
    window.location = ('https://github.com/login/oauth/authorize?client_id=6389747b48199e71b803&scope=read:user')
}

function logout(){
    localStorage.login = 'false'
    localStorage.token = null
    localStorage.role = null
    isLoggedIn()
}