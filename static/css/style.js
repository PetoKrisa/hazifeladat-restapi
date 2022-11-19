function safeText(text){
    text = text.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    return text
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


        if(localStorage.showOld == 'true' && posts[e].hatarido_kod < Date.now()/1000){
            console.log('régi')
            document.getElementById('tbody').innerHTML = document.getElementById('tbody').innerHTML +
            `
            <tr class="tr">
            <td><p>${posts[e].id}</p></td>
            <td><p>${safeText(posts[e].leiras)}</p></td>
            <td><p>${posts[e].hatarido}</p></td>
            <td><p><i onclick="openPostPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-magnifying-glass"></i></p></td>
            <td class="role"><i onclick="openDelPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-trash-can"></i></td>
            <td class="role"><i onclick="openEditPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-pen"></i></td>
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
            <td class="role"><i onclick="openDelPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-trash-can"></i></td>
            <td class="role"><i onclick="openEditPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-pen"></i></td>
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
    fetch('/api/posts/upload', {method: 'post', body: uploadForm, headers: {'auth': localStorage.token}})
    closeUploadPopup()
    generateTable()
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
    closeDelPopup()
    generateTable()
    generateTable()
    generateTable()
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
    const editForm = new FormData(document.getElementById("editForm"))
    fetch('/api/posts/edit', {method: 'post', body: editForm, headers: {'auth': localStorage.token}})
    closeEditPopup()
    generateTable()
}

function openPostPopup(e){
    fetch(`/api/posts/${e.dataset.id}`)
    .then(d=>d.json())
    .then((r)=>{
        document.getElementById('pleiras').innerHTML = safeText(r['post']['leiras'])
        document.getElementById('phatarido').innerText = r['post']['hatarido']
        pfileok = document.getElementById('pfileok')
        pfileok.innerHTML = ""
        for (let i = 0; i < r['post']['files'].length; i++){
            pfileok.innerHTML = pfileok.innerHTML +
            `
            <li data-id="${r['post']['id']}" class="list-group-item">
                ${r['post']['files'][i]}
                
                <i onclick="delFile(this)" data-id="${r['post']['id']}" data-file="${r['post']['files'][i]}" class="role float-end fa-sharp fa-solid fa-trash"></i>
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
    pfileok = document.getElementById('pfileok')
    pfileok.removeChild(e.closest('li'))
    fetch(`/api/posts/${e.dataset.id}/file/${e.dataset.file}/delete`, {method: 'delete', headers: {'auth': localStorage.token}})

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

            closeLoginPopup()
            isLoggedIn()
        }
    })
}

function logout(){
    localStorage.login = 'false'
    localStorage.token = null
    localStorage.role = null
    isLoggedIn()
}