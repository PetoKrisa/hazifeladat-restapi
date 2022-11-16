function generateTable(){
    fetch('/api/posts', {method:'get'})
    .then((r)=>{return r.json()})
    .then((d)=>{
        document.getElementById("postCounter").innerHTML = `${d['posts'].length} feladat`
    
    //clear table
    document.getElementById('tbody').innerHTML = ''

    posts = d['posts']
    for (e = 0; e < posts.length; e++){
        if (posts[e].file != null){
            dlIcon = `<i onclick="download(this)" title="${posts[e].file}" data-id="${posts[e].id}" class="fa-solid fa-download"></i>`
        } else{
            dlIcon = '<i onclick="alert(\'Nincsen File Csatolva!\')" data-id="${posts[e].id}" class="text-muted fa-solid"></i>'
        }

        if(localStorage.showOld == 'true' && posts[e].hatarido_kod < Date.now()/1000){
            console.log('régi')
            document.getElementById('tbody').innerHTML = document.getElementById('tbody').innerHTML +
            `
            <tr class="tr">
            <td><p>${posts[e].id}</p></td>
            <td><p>${posts[e].leiras}</p></td>
            <td><p>${posts[e].hatarido}</p></td>
            <td><p>${dlIcon}</p></td>
            <td><i onclick="openDelPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-trash-can"></i></td>
            <td><i onclick="openEditPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-pen"></i></td>
            </tr>
            `
        } else if(posts[e].hatarido_kod > Date.now()/1000){
            console.log('csak új')
            document.getElementById('tbody').innerHTML = document.getElementById('tbody').innerHTML +
            `
            <tr class="tr">
            <td><p>${posts[e].id}</p></td>
            <td><p>${posts[e].leiras}</p></td>
            <td><p>${posts[e].hatarido}</p></td>
            <td><p>${dlIcon}</p></td>
            <td><i onclick="openDelPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-trash-can"></i></td>
            <td><i onclick="openEditPopup(this)" data-id="${posts[e].id}" class="fa-solid fa-pen"></i></td>
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

function openUploadPopup(){
    document.getElementById("uploadPopup").showModal()
}
function closeUploadPopup(){
    document.getElementById("uploadPopup").close()
}

function theme(){
    let tables = document.getElementsByClassName('table')
    let root = document.querySelector(':root')
   
    if(localStorage.theme == 'light'){
        Array.prototype.forEach.call(tables, (e)=>{
            e.classList.add('table-dark')
        })
        root.style.setProperty('--bg-active', getComputedStyle(root).getPropertyValue('--dark'))
        root.style.setProperty('--text-active', 'rgb(255,255,255)')
        root.style.setProperty('--glow', 'rgba(255,255,255,0.2)')
    } else{
        Array.prototype.forEach.call(tables, (e)=>{
            e.classList.remove('table-dark')
        })
        root.style.setProperty('--bg-active', getComputedStyle(root).getPropertyValue('--light'))
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

function download(e){
    window.open(`/api/posts/${e.dataset.id}/file`, '_blank')
}

function openDelPopup(e){
    document.getElementById('deletePopup').showModal()
    document.getElementById('delBtn').dataset.id = e.dataset.id
}
function closeDelPopup(){
    document.getElementById('deletePopup').close()
}

function del(e){
    fetch(`/api/posts/${e.dataset.id}/delete`, {method: 'delete'})
    closeDelPopup()
    generateTable()
    generateTable()
    generateTable()
}

function openEditPopup(e){
    fetch(`/api/posts/${e.dataset.id}`)
    .then(d=>d.json())
    .then((r)=>{
        document.getElementById('eleiras').innerHTML = r['post']['leiras']
        document.getElementById('ehatarido').value = r['post']['hatarido']
        document.getElementById('eid').value = r['post']['id']
        document.getElementById('editFileP').innerText = r['post']['file']

        })
    document.getElementById('editPopup').showModal()
    document.getElementById('editBtn').dataset.id = e.dataset.id
}

function closeEditPopup(){
    document.getElementById('editPopup').close()
}


