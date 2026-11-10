'use strict';
// DEMOSTRACIÓN: la contraseña es visible en el código fuente.
// Esta pantalla NO es autenticación segura para datos de alumnos reales.
const DEMO_PASSWORD = 'admin1234';
const STORAGE_KEY = 'aulaEstrella.alumnos.v1';
const SESSION_KEY = 'aulaEstrella.sesion.v1';
const DEFAULT_STUDENTS = [
  {id:'demo-1',name:'Lucía Martínez',stars:5},
  {id:'demo-2',name:'Daniel López',stars:3},
  {id:'demo-3',name:'Sara Fernández',stars:7},
  {id:'demo-4',name:'Hugo García',stars:2},
  {id:'demo-5',name:'Elena Ruiz',stars:0}
];
const byId = (id) => document.getElementById(id);
const loginScreen=byId('loginScreen'),appScreen=byId('appScreen'),loginForm=byId('loginForm'),passwordInput=byId('passwordInput');
const studentList=byId('studentList'),studentDialog=byId('studentDialog'),studentForm=byId('studentForm');
const studentName=byId('studentName'),studentError=byId('studentError'),searchInput=byId('searchInput');
let students=loadStudents();
let toastTimer;
function loadStudents(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw===null)return DEFAULT_STUDENTS.map(s=>({...s}));
    const data=JSON.parse(raw);
    if(!Array.isArray(data))throw Error('Datos inválidos');
    return data.filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string')
      .map(s=>({id:s.id,name:s.name.slice(0,60),stars:Number.isSafeInteger(s.stars)&&s.stars>=0?s.stars:0}));
  }catch(error){console.warn(error);return DEFAULT_STUDENTS.map(s=>({...s}));}
}
function saveStudents(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(students));}
  catch(error){console.warn(error);toast('No se pudieron guardar los datos en este navegador.');}
}
function setSession(active){
  try{if(active)sessionStorage.setItem(SESSION_KEY,'1');else sessionStorage.removeItem(SESSION_KEY);}
  catch(error){console.warn(error);}
}
function isSessionActive(){
  try{return sessionStorage.getItem(SESSION_KEY)==='1';}
  catch{return false;}
}
function showApp(active){
  loginScreen.hidden=active;
  appScreen.hidden=!active;
  byId('loginError').textContent='';
  passwordInput.value='';
  if(active){render();}else{passwordInput.focus();}
}
function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');}
function toast(message){
  const el=byId('toast');
  el.textContent=message;el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('visible'),2400);
}
function text(tag,cls,value){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  el.textContent=value;
  return el;
}
function action(label,sign,cls,onClick){
  const btn=text('button','action '+cls,sign);
  btn.type='button';btn.title=label;btn.setAttribute('aria-label',label);
  btn.addEventListener('click',onClick);
  return btn;
}
function updateStars(id,delta){
  const student=students.find(s=>s.id===id);
  if(!student)return;
  if(delta<0&&student.stars===0)return;
  if(delta>0&&student.stars>=Number.MAX_SAFE_INTEGER)return;
  student.stars=Math.max(0,student.stars+delta);
  saveStudents();render();
  toast((delta>0?'Positivo añadido a ':'Positivo retirado de ')+student.name+'.');
}
function removeStudent(id){
  const student=students.find(s=>s.id===id);
  if(!student)return;
  if(!confirm('¿Seguro que quieres eliminar a '+student.name+'? Esta acción no se puede deshacer.'))return;
  students=students.filter(s=>s.id!==id);
  saveStudents();render();toast(student.name+' eliminado de la lista.');
}
function renderStudent(student,index){
  const row=document.createElement('article');
  row.className='student-row';
  const ident=text('div','ident','');
  const initials=student.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
  ident.append(text('div','avatar c'+(index%5),initials));
  const nameBox=document.createElement('div');
  nameBox.style.minWidth='0';
  const nameEl=text('div','name',student.name);nameEl.title=student.name;
  nameBox.append(nameEl,text('div','subtext','Alumno de clase'));
  ident.append(nameBox);
  const stars=document.createElement('div');stars.className='stars';
  stars.append(text('span','star','★'),text('strong','',String(student.stars)),text('span','label',student.stars===1?'positivo':'positivos'));
  const actions=text('div','actions','');
  actions.append(
    action('Quitar un positivo a '+student.name,'−','minus',()=>updateStars(student.id,-1)),
    action('Añadir un positivo a '+student.name,'+','plus',()=>updateStars(student.id,1)),
    action('Eliminar a '+student.name,'×','delete',()=>removeStudent(student.id))
  );
  actions.firstElementChild.disabled=student.stars===0;
  row.append(ident,stars,actions);
  return row;
}
function render(){
  const total=students.reduce((sum,s)=>sum+s.stars,0);
  byId('totalStudents').textContent=String(students.length);
  byId('totalStars').textContent=String(total);
  byId('studentsWithStars').textContent=String(students.filter(s=>s.stars>0).length);
  const term=normalize(searchInput.value.trim());
  const visible=students.filter(s=>normalize(s.name).includes(term));
  byId('studentCount').textContent=visible.length+' '+(visible.length===1?'alumno':'alumnos');
  studentList.replaceChildren();
  const fragment=document.createDocumentFragment();
  visible.forEach((s,i)=>fragment.append(renderStudent(s,i)));
  studentList.append(fragment);
  byId('emptyState').hidden=visible.length!==0;
}
function openDialog(){
  studentError.textContent='';studentForm.reset();
  if(typeof studentDialog.showModal==='function')studentDialog.showModal();
  else studentDialog.setAttribute('open','');
  studentName.focus();
}
function closeDialog(){
  if(typeof studentDialog.close==='function')studentDialog.close();
  else studentDialog.removeAttribute('open');
}
loginForm.addEventListener('submit',(event)=>{
  event.preventDefault();
  if(passwordInput.value!==DEMO_PASSWORD){
    byId('loginError').textContent='Contraseña incorrecta. Inténtalo de nuevo.';
    passwordInput.select();return;
  }
  setSession(true);showApp(true);
});
byId('togglePassword').addEventListener('click',()=>{
  passwordInput.type=passwordInput.type==='password'?'text':'password';
});
byId('logoutButton').addEventListener('click',()=>{setSession(false);showApp(false);});
byId('newStudentButton').addEventListener('click',openDialog);
byId('closeDialog').addEventListener('click',closeDialog);
byId('cancelDialog').addEventListener('click',closeDialog);
studentDialog.addEventListener('click',(event)=>{if(event.target===studentDialog)closeDialog();});
studentForm.addEventListener('submit',(event)=>{
  event.preventDefault();
  const name=studentName.value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>60){studentError.textContent='Escribe un nombre válido (2–60 caracteres).';return;}
  if(students.some(s=>normalize(s.name)===normalize(name))){
    studentError.textContent='Ese alumno ya está en la lista.';return;
  }
  const id=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():'student-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  students.push({id,name,stars:0});
  saveStudents();closeDialog();searchInput.value='';render();
  toast(name+' añadido correctamente.');
});
searchInput.addEventListener('input',render);
showApp(isSessionActive());
