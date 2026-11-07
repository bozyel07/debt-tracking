(function(){
const api=window.DT_API,L=window.DT_LOGIC,S=window.DT_STORE,CUR=['TRY','USD','EUR'],SYM={TRY:'₺',USD:'$',EUR:'€'};
const ICON=(window.DT_ICON||'icons/icon-192.png');
const st={lang:S.get('dt_lang')||((navigator.language||'').toLowerCase().startsWith('tr')?'tr':'en'),warn:+(S.get('dt_warn')||7),view:'home',q:'',me:null,data:null,rep:{kind:'monthly',at:L.today()},authMode:'login',msg:''};
const t=(k,v)=>{let s=(DT_I18N[st.lang]||{})[k]??DT_I18N.en[k]??k;if(v){for(const a in v)s=s.replace('{'+a+'}',v[a]);s=s.replace('(s)',v.n==1?'':'s');}return s;};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const loc=()=>st.lang==='tr'?'tr-TR':'en-GB';
const money=(n,c)=>new Intl.NumberFormat(loc(),{style:'currency',currency:c,currencyDisplay:'narrowSymbol',minimumFractionDigits:2}).format(n);
const fdate=s=>s?s.split('-').reverse().join('.'):'';
const mon=s=>L.parse(s).toLocaleDateString(loc(),{month:'short'});
const bankName=n=>n==='Others'?t('Others'):n;
const can={add:()=>['admin','user'].includes(st.me.role),pay:()=>['admin','user'].includes(st.me.role),edit:()=>st.me.role==='admin'};
const $=q=>document.querySelector(q);
const svg=p=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',checks:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 11h7M6 14h4M17 14h1"/>',loans:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h3M14 14h2"/>',paid:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',reports:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',plus:'<path d="M12 5v14M5 12h14"/>',left:'<path d="M15 6l-6 6 6 6"/>',right:'<path d="M9 6l6 6-6 6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',xl:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13l5 5M14 13l-5 5"/>'};

/* ---------- derived data ---------- */
const pd=r=>L.payDay(r.due_date);
const movedNote=r=>pd(r)!==r.due_date?t('movedFrom',{d:fdate(r.due_date),w:L.parse(r.due_date).toLocaleDateString(loc(),{weekday:'long'})}):'';
const openChecks=()=>st.data.checks.filter(c=>!c.paid_on).sort((a,b)=>pd(a).localeCompare(pd(b)));
const openLoans=()=>st.data.loans.filter(l=>l.remaining>0).sort((a,b)=>pd(a).localeCompare(pd(b)));
function totals(){const r={};CUR.forEach(c=>r[c]={check:0,loan:0});openChecks().forEach(c=>r[c.currency].check+=+c.amount);openLoans().forEach(l=>r[l.currency].loan+=l.amount*l.remaining);return r;}
const amounts=(o)=>{const a=CUR.filter(c=>Math.abs(o[c])>0.004).map(c=>money(o[c],c));return a;};
const urgency=d=>{const n=L.diff(d,L.today());return{n,near:n<=st.warn,late:n<0};};
const whenText=d=>{const{n}=urgency(d);return n<0?t('overdue',{n:-n}):n===0?t('today'):n===1?t('tomorrow'):t('daysLeft',{n});};
const paidList=()=>{const lo=Object.fromEntries(st.data.loans.map(l=>[l.id,l]));
  const a=st.data.checks.filter(c=>c.paid_on).map(c=>({kind:'check',id:c.id,rec:c,paid_on:c.paid_on,due_date:c.due_date,amount:+c.amount,currency:c.currency}));
  const b=st.data.payments.filter(p=>lo[p.loan_id]).map(p=>({kind:'loan',id:p.id,rec:lo[p.loan_id],paid_on:p.paid_on,due_date:p.due_date,amount:+p.amount,currency:lo[p.loan_id].currency}));
  return[...a,...b].sort((x,y)=>y.paid_on.localeCompare(x.paid_on));};
const checkTitle=c=>c.payee||c.check_no;
const loanTitle=l=>t(l.loan_type==='other'?'other':l.loan_type);

/* ---------- rendering ---------- */
function rowCheck(c){const u=urgency(pd(c)),dt=L.parse(pd(c)),mv=movedNote(c);
  return `<div class="row${u.near?' near':''}" data-row="check:${c.id}"><div class="cal is-check"><b>${dt.getDate()}</b><span>${esc(mon(pd(c)))}</span></div>
  <div class="mid" data-act="open" data-k="check" data-id="${c.id}" role="button" tabindex="0"><strong>${esc(checkTitle(c))}</strong><small>${t('check')} ${esc(c.check_no)} · ${esc(bankName(c.bank))}</small><small class="when">${esc(whenText(pd(c)))}</small>${mv?`<small>${esc(mv)}</small>`:''}</div>
  <div class="end"><span class="amt">${money(c.amount,c.currency)}</span>${can.pay()?`<button class="pay" data-act="pay" data-k="check" data-id="${c.id}">${t('payBtn')}</button>`:''}</div></div>`;}
function rowLoan(l){const u=urgency(pd(l)),dt=L.parse(pd(l)),mv=movedNote(l);
  return `<div class="row${u.near?' near':''}" data-row="loan:${l.id}"><div class="cal is-loan"><b>${dt.getDate()}</b><span>${esc(mon(pd(l)))}</span></div>
  <div class="mid" data-act="open" data-k="loan" data-id="${l.id}" role="button" tabindex="0"><strong>${esc(loanTitle(l))}</strong><small>${esc(bankName(l.bank))} · ${t('installmentsLeft',{n:l.remaining})}</small><small class="when">${esc(whenText(pd(l)))}</small>${mv?`<small>${esc(mv)}</small>`:''}</div>
  <div class="end"><span class="amt">${money(l.amount,l.currency)}</span>${can.pay()?`<button class="pay" data-act="pay" data-k="loan" data-id="${l.id}">${t('payBtn')}</button>`:''}</div></div>`;}
function rowPaid(p){const dt=L.parse(p.paid_on),r=p.rec;
  return `<div class="row"><div class="cal ${p.kind==='check'?'is-check':'is-loan'}"><b>${dt.getDate()}</b><span>${esc(mon(p.paid_on))}</span></div>
  <div class="mid" data-act="openpaid" data-k="${p.kind}" data-id="${p.id}" role="button" tabindex="0"><strong>${esc(p.kind==='check'?checkTitle(r):loanTitle(r))}</strong><small>${p.kind==='check'?t('check')+' '+esc(r.check_no):t('loan')} · ${esc(bankName(r.bank))}</small></div>
  <div class="end"><span class="amt">${money(p.amount,p.currency)}</span></div></div>`;}
const match=(o,extra)=>{const q=st.q.trim().toLocaleLowerCase('tr');if(!q)return true;return[o.check_no,o.payee,o.bank,o.given_bank,o.note,bankName(o.bank),extra].join(' ').toLocaleLowerCase('tr').includes(q);};
function hero(){const T=totals();const tot={},chk={},ln={};CUR.forEach(c=>{tot[c]=T[c].check+T[c].loan;chk[c]=T[c].check;ln[c]=T[c].loan;});
  const a=amounts(tot),line=o=>amounts(o).join('<br>')||'—';
  const dates=[...openChecks().map(pd),...openLoans().map(pd)];
  const late=dates.filter(d=>urgency(d).late).length,soon=dates.filter(d=>{const u=urgency(d);return u.near&&!u.late;}).length;
  const al=[soon?t('dueSoonCount',{n:soon,d:st.warn}):'',late?t('overdueCount',{n:late}):''].filter(Boolean).join(' · ');
  return `<section class="hero" aria-label="${t('totalDebt')}"><div><h2>${t('totalDebt')}</h2><div class="big">${a.length?a.map(x=>`<b>${x}</b>`).join(''):`<b>${t('noDebt')}</b>`}</div></div>
  <div class="split"><div><h3>${t('checkDebt')}</h3><p>${line(chk)}</p></div><div><h3>${t('loanDebt')}</h3><p>${line(ln)}</p></div></div>${al?`<div class="alert">${esc(al)}</div>`:''}</section>`;}
const addBtn=(k,l)=>can.add()?`<button class="fab" data-act="new" data-k="${k}">${svg(IC.plus)}${t(l)}</button>`:'';
function vHome(){const it=[...openChecks().map(c=>({d:pd(c),h:rowCheck(c)})),...openLoans().map(l=>({d:pd(l),h:rowLoan(l)}))].sort((a,b)=>a.d.localeCompare(b.d));
  return hero()+(can.add()?`<div class="addrow">${addBtn('check','addCheck')}${addBtn('loan','addLoan')}</div>`:'')+`<div class="sec"><h2>${t('upcoming')}</h2></div>`+(it.length?`<div class="list">${it.slice(0,30).map(x=>x.h).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyUp')}</div></div>`);}
function sumLine(list,f){const o={};CUR.forEach(c=>o[c]=0);list.forEach(x=>o[x.currency]+=f(x));return amounts(o).join(' · ');}
function vChecks(){const a=openChecks().filter(c=>match(c));
  return `<div class="sec"><h2>${t('checks')}</h2><span class="sum">${sumLine(openChecks(),c=>+c.amount)}</span></div>${addBtn('check','addCheck')}<input id="q" class="search" type="search" value="${esc(st.q)}" placeholder="${t('search')}" aria-label="${t('search')}">`+(a.length?`<div class="list">${a.map(rowCheck).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyChecks')}</div></div>`);}
function vLoans(){const a=openLoans().filter(l=>match(l,loanTitle(l)));
  return `<div class="sec"><h2>${t('loans')}</h2><span class="sum">${sumLine(openLoans(),l=>l.amount*l.remaining)}</span></div>${addBtn('loan','addLoan')}<input id="q" class="search" type="search" value="${esc(st.q)}" placeholder="${t('search')}" aria-label="${t('search')}">`+(a.length?`<div class="list">${a.map(rowLoan).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyLoans')}</div></div>`);}
function vPaid(){const a=paidList().filter(p=>match(p.rec,p.kind==='loan'?loanTitle(p.rec):''));
  return `<div class="sec"><h2>${t('paid')}</h2><span class="sum">${sumLine(paidList(),p=>p.amount)}</span></div><input id="q" class="search" type="search" value="${esc(st.q)}" placeholder="${t('search')}" aria-label="${t('search')}">`+(a.length?`<div class="list">${a.map(rowPaid).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyPaid')}</div></div>`);}
function range(){const{kind,at}=st.rep,d=L.parse(at);
  if(kind==='daily')return{from:at,to:at,label:fdate(at)};
  if(kind==='weekly'){const m=L.addDays(at,-((d.getDay()+6)%7)),s=L.addDays(m,6);return{from:m,to:s,label:fdate(m)+' – '+fdate(s)};}
  const from=L.iso(new Date(d.getFullYear(),d.getMonth(),1)),to=L.iso(new Date(d.getFullYear(),d.getMonth()+1,0));
  const lab=d.toLocaleDateString(loc(),{month:'long',year:'numeric'});return{from,to,label:lab.charAt(0).toLocaleUpperCase(loc())+lab.slice(1)};}
function moveRep(n){const{kind,at}=st.rep,d=L.parse(at);st.rep.at=kind==='daily'?L.addDays(at,n):kind==='weekly'?L.addDays(at,7*n):L.iso(new Date(d.getFullYear(),d.getMonth()+n,1));}
function repData(){const{from,to}=range(),inR=d=>d>=from&&d<=to;
  const due=[...openChecks().filter(c=>inR(pd(c))).map(c=>({kind:'check',date:pd(c),orig:c.due_date,amount:+c.amount,currency:c.currency,rec:c})),
    ...openLoans().flatMap(l=>L.installments(l).filter(i=>inR(i.date)).map(i=>({kind:'loan',date:i.date,orig:i.orig,amount:+l.amount,currency:l.currency,rec:l})))].sort((a,b)=>a.date.localeCompare(b.date));
  const paid=paidList().filter(p=>inR(p.paid_on));return{due,paid};}
function split(list){const z=()=>Object.fromEntries(CUR.map(c=>[c,0]));const o={check:z(),loan:z(),all:z(),n:{check:0,loan:0}};
  list.forEach(x=>{o[x.kind][x.currency]+=x.amount;o.all[x.currency]+=x.amount;o.n[x.kind]++;});o.cur=CUR.filter(c=>Math.abs(o.all[c])>0.004);return o;}
function breakdown(h,list){const o=split(list),cur=o.cur.length?o.cur:['TRY'];const cell=(v,c)=>v>0.004?money(v,c):'—';
  const row=(lab,k,n,cls='')=>`<tr class="${cls}"><th scope="row">${lab}${n!=null?` <span>(${n})</span>`:''}</th>${cur.map(c=>`<td>${cell(o[k][c],c)}</td>`).join('')}</tr>`;
  return `<section class="bd"><h3>${h}</h3><div class="bd-scroll"><table><thead><tr><th></th>${cur.map(c=>`<th>${c==='TRY'?'TL':c}</th>`).join('')}</tr></thead><tbody>
  ${row(t('checks'),'check',o.n.check,'is-check')}${row(t('loans'),'loan',o.n.loan,'is-loan')}${row(t('total'),'all',null,'tot')}</tbody></table></div></section>`;}
function vReports(){const r=range(),{due,paid}=repData();
  const rowR=(x,paidRow)=>{const d=paidRow?x.paid_on:x.date,u=urgency(d),dt=L.parse(d),near=!paidRow&&u.near,r=x.rec,mv=!paidRow&&x.orig&&x.orig!==x.date?t('movedFrom',{d:fdate(x.orig),w:L.parse(x.orig).toLocaleDateString(loc(),{weekday:'long'})}):'';
    return `<div class="row${near?' near':''}"><div class="cal ${x.kind==='check'?'is-check':'is-loan'}"><b>${dt.getDate()}</b><span>${esc(mon(d))}</span></div><div class="mid"><strong>${esc(x.kind==='check'?checkTitle(r):loanTitle(r))}</strong><small>${x.kind==='check'?t('check')+' '+esc(r.check_no):t('loan')} · ${esc(bankName(r.bank))}</small>${mv?`<small>${esc(mv)}</small>`:''}</div><div class="end"><span class="amt">${money(x.amount,x.currency)}</span></div></div>`;};
  return `<div class="sec"><h2>${t('reports')}</h2></div><div class="seg" role="group">${['daily','weekly','monthly'].map(k=>`<button data-act="repkind" data-k="${k}" aria-pressed="${st.rep.kind===k}">${t(k)}</button>`).join('')}</div>
  <div class="nav"><button class="iconbtn" data-act="repmove" data-n="-1" aria-label="‹">${svg(IC.left)}</button><b>${esc(r.label)}</b><button class="iconbtn" data-act="repmove" data-n="1" aria-label="›">${svg(IC.right)}</button></div>
  ${breakdown(t('dueInPeriod'),due)}${breakdown(t('paidInPeriod'),paid)}
  <div class="sec"><h2>${t('dueInPeriod')}</h2></div>${due.length?`<div class="list">${due.map(x=>rowR(x,false)).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyReport')}</div></div>`}
  <div class="sec"><h2>${t('paidInPeriod')}</h2></div>${paid.length?`<div class="list">${paid.map(x=>rowR(x,true)).join('')}</div>`:`<div class="list"><div class="empty">${t('emptyReport')}</div></div>`}
  <button class="btn block" data-act="xlreport">${t('exportReport')}</button>`;}
function renderApp(){const V={home:vHome,checks:vChecks,loans:vLoans,paid:vPaid,reports:vReports}[st.view]();
  const nav=[['home',IC.home],['checks',IC.checks],['loans',IC.loans],['paid',IC.paid],['reports',IC.reports]];
  const a=document.activeElement&&document.activeElement.id==='q'?document.activeElement.selectionStart:null;
  $('#app').innerHTML=`<div class="wrap"><div class="top"><img src="${ICON}" alt=""><h1>${t('appName')}</h1><button class="langbtn" data-act="lang" aria-label="${t('language')}">${st.lang==='tr'?'EN':'TR'}</button><button class="iconbtn" data-act="xlall" aria-label="${t('exportExcel')}" title="${t('exportExcel')}">${svg(IC.xl)}</button><button class="iconbtn" data-act="settings" aria-label="${t('settings')}">${svg(IC.gear)}</button></div>${api.demo?`<div class="banner">${t('demoBanner')} · ${t('role_'+st.me.role)}</div>`:''}${V}</div>
  <nav class="tabs"><div>${nav.map(([k,i])=>`<button data-act="nav" data-k="${k}" ${st.view===k?'aria-current="page"':''}>${svg(i)}<span>${t(k)}</span></button>`).join('')}</div></nav>`;
  document.documentElement.lang=st.lang;
  if(a!==null){const q=$('#q');if(q){q.focus();try{q.setSelectionRange(a,a)}catch(e){}}}
}
function renderAuth(){const demo=api.demo;
  $('#app').innerHTML=`<div class="auth"><div class="card"><img src="${ICON}" alt=""><h1>${t('appName')}</h1>${demo?`<p>${t('demoText')}</p>${['admin','user','observer'].map(r=>`<button class="btn block ${r==='admin'?'':'ghost'}" data-act="demo" data-k="${r}">${t('role_'+r)}</button>`).join('')}<p class="hint">${t('roleHelp')}</p>`:
  `<form id="authf" class="card" style="padding:0;gap:10px"><label class="f">${t('email')}<input id="au-email" type="email" autocomplete="username" required></label><label class="f">${t('password')}<input id="au-pass" type="password" autocomplete="${st.authMode==='login'?'current-password':'new-password'}" minlength="6" required></label>${st.msg?`<p class="err">${esc(st.msg)}</p>`:''}<button class="btn block" type="submit">${t(st.authMode==='login'?'login':'signup')}</button></form><button class="link" data-act="authswap">${t(st.authMode==='login'?'toSignup':'toLogin')}</button>${st.authMode==='signup'?`<p class="hint">${t('loginHint')}</p>`:''}`}
  <button class="link" data-act="lang">${st.lang==='tr'?'English':'Türkçe'}</button></div></div>`;document.documentElement.lang=st.lang;}
function renderPending(){$('#app').innerHTML=`<div class="auth"><div class="card"><img src="${ICON}" alt=""><h1>${t('pendingTitle')}</h1><p>${t('pendingText')}</p><p>${esc(st.me.email)}</p><button class="btn block" data-act="recheck">${t('checkAgain')}</button><button class="link" data-act="signout">${t('signOut')}</button></div></div>`;}
function render(){if(!st.me)return renderAuth();if(st.me.role==='pending')return renderPending();if(st.data)renderApp();}

/* ---------- helpers ---------- */
let toastT;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2600);}
function errMsg(e){const m=e&&e.message;const k={net:'errNet',perm:'errPerm',login:'errLogin',exists:'errExists',short:'errShort',stale:'errStale',quota:'errQuota'}[m];return k?t(k):t('errGeneric',{m});}
async function refresh(){try{st.data=await api.load();render();}catch(e){if(e.message==='login'){st.me=null;render();}else toast(errMsg(e));}}
async function run(fn,okMsg){try{await fn();closeSheet();await refresh();if(okMsg)toast(okMsg);return true;}catch(e){if(e.message==='stale'){closeSheet();await refresh();}toast(errMsg(e));return false;}}
function sheet(html){$('#sheet-root').innerHTML=`<div class="overlay" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;document.body.style.overflow='hidden';}
function closeSheet(){$('#sheet-root').innerHTML='';document.body.style.overflow='';}
const head=h=>`<header><h2>${h}</h2><button class="iconbtn" data-act="close" aria-label="${t('close')}">${svg(IC.x)}</button></header>`;
function confirmSheet(msg,fn,danger){sheet(`<h2>${esc(msg)}</h2><div class="actions"><button class="btn ghost" data-act="close">${t('no')}</button><button class="btn" id="yes" ${danger?'style="background:var(--danger);color:#fff"':''}>${t('yes')}</button></div>`);$('#yes').onclick=fn;}
function parseAmount(s){s=String(s).replace(/[\s₺$€]/g,'');if(!s)return NaN;const c=s.lastIndexOf(','),d=s.lastIndexOf('.');
  if(c>=0&&d>=0)s=c>d?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(c>=0)s=s.replace(/\./g,'').replace(',','.');else if(st.lang==='tr'&&/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
  return /^\d*\.?\d*$/.test(s)?Math.round(parseFloat(s)*100)/100:NaN;}
const fmtInput=n=>n==null?'':(st.lang==='tr'?String(n).replace('.',','):String(n));
const bankOpts=(sel,blank)=>{const list=[...st.data.banks].sort((a,b)=>(a.sort-b.sort));const names=list.map(b=>b.name);if(sel&&!names.includes(sel))list.unshift({name:sel});
  return `<option value="">${blank?'—':''}</option>`+list.map(b=>`<option value="${esc(b.name)}" ${b.name===sel?'selected':''}>${esc(bankName(b.name))}</option>`).join('');};
const curSeg=sel=>`<div class="seg" role="group" aria-label="${t('currency')}" id="cur" data-v="${sel}">${CUR.map(c=>`<button type="button" data-act="cur" data-k="${c}" aria-pressed="${c===sel}">${SYM[c]} ${c==='TRY'?'TL':c}</button>`).join('')}</div>`;
const fld=(id,lab,inner,cls='')=>`<label class="f ${cls}" id="w-${id}">${lab}${inner}</label>`;
function checkForm(c){const n=!c;c=c||{currency:'TRY',due_date:'',check_no:'',bank:'',payee:'',given_bank:'',note:''};
  sheet(head(t(n?'addCheck':'editCheck'))+`<form id="frm" novalidate class="sheet" style="padding:0;max-height:none;overflow:visible;border-radius:0">
  ${fld('due_date',t('checkDay')+' *',`<input id="due_date" type="date" value="${c.due_date}">`)}
  ${fld('amount',t('checkAmount')+' *',`<input id="amount" inputmode="decimal" autocomplete="off" value="${esc(fmtInput(c.amount))}">`)}${curSeg(c.currency)}
  ${fld('check_no',t('checkNo')+' *',`<input id="check_no" autocomplete="off" value="${esc(c.check_no)}">`)}
  ${fld('bank',t('checkBank')+' *',`<select id="bank">${bankOpts(c.bank)}</select>`)}
  ${fld('payee',t('payee')+' *',`<input id="payee" autocomplete="off" value="${esc(c.payee)}">`)}
  ${fld('given_bank',t('givenBank'),`<select id="given_bank">${bankOpts(c.given_bank,true)}</select>`)}
  ${fld('note',t('note'),`<textarea id="note" rows="2">${esc(c.note)}</textarea>`)}
  <p class="err" id="ferr" hidden></p><button class="btn block" type="submit">${t('save')}</button></form>`);
  $('#frm').onsubmit=e=>{e.preventDefault();const v=read(['due_date','check_no','bank','payee','given_bank','note'],['due_date','check_no','bank','payee']);if(!v)return;
    run(()=>n?api.addCheck(v):api.updateCheck(c.id,v),t('saved'));};}
function loanForm(l){const n=!l;l=l||{currency:'TRY',due_date:'',loan_type:'vehicle',remaining:'',bank:'',note:''};
  sheet(head(t(n?'addLoan':'editLoan'))+`<form id="frm" novalidate class="sheet" style="padding:0;max-height:none;overflow:visible;border-radius:0">
  ${fld('due_date',t('loanDay')+' *',`<input id="due_date" type="date" value="${l.due_date}">`)}
  ${fld('amount',t('loanAmount')+' *',`<input id="amount" inputmode="decimal" autocomplete="off" value="${esc(fmtInput(l.amount))}">`)}${curSeg(l.currency)}
  ${fld('loan_type',t('loanType')+' *',`<select id="loan_type">${['vehicle','machine','commercial','other'].map(k=>`<option value="${k}" ${k===l.loan_type?'selected':''}>${t(k)}</option>`).join('')}</select>`)}
  ${fld('remaining',t('remaining')+' *',`<input id="remaining" inputmode="numeric" pattern="[0-9]*" value="${l.remaining}">`)}
  <p class="hint" id="ltotal"></p>
  ${fld('bank',t('payBank')+' *',`<select id="bank">${bankOpts(l.bank)}</select>`)}
  ${fld('note',t('note'),`<textarea id="note" rows="2">${esc(l.note)}</textarea>`)}
  <p class="err" id="ferr" hidden></p><button class="btn block" type="submit">${t('save')}</button></form>`);
  const upd=()=>{const a=parseAmount($('#amount').value),r=parseInt($('#remaining').value,10);$('#ltotal').textContent=a>0&&r>0?`${t('totalRemaining')}: ${money(a*r,$('#cur').dataset.v)}`:'';};
  $('#amount').oninput=upd;$('#remaining').oninput=upd;$('#cur').addEventListener('click',()=>setTimeout(upd));upd();
  $('#frm').onsubmit=e=>{e.preventDefault();const v=read(['due_date','loan_type','bank','note'],['due_date','bank']);if(!v)return;
    const r=parseInt($('#remaining').value,10);if(!(r>=1)){$('#w-remaining').classList.add('bad');return ferr(t('errRemaining'));}v.remaining=r;
    run(()=>n?api.addLoan(v):api.updateLoan(l.id,v),t('saved'));};}
function ferr(m){const e=$('#ferr');e.textContent=m;e.hidden=false;}
function read(fields,req){const v={};let bad=false;document.querySelectorAll('.bad').forEach(x=>x.classList.remove('bad'));
  for(const f of fields){v[f]=$('#'+f).value.trim();if(req.includes(f)&&!v[f]){$('#w-'+f).classList.add('bad');bad=true;}}
  const a=parseAmount($('#amount').value);if(!(a>0)){$('#w-amount').classList.add('bad');ferr(t(bad?'errRequired':'errAmount'));return null;}
  if(bad){ferr(t('errRequired'));return null;}v.amount=a;v.currency=$('#cur').dataset.v;return v;}
function detail(kind,id,paidEntry){const r=kind==='check'?st.data.checks.find(c=>c.id===id):st.data.loans.find(l=>l.id===id);if(!r)return;
  const rows=kind==='check'?[[t('checkDay'),fdate(pd(r))+(movedNote(r)?' ('+movedNote(r)+')':'')],[t('checkAmount'),money(r.amount,r.currency)],[t('checkNo'),r.check_no],[t('checkBank'),bankName(r.bank)],[t('payee'),r.payee],[t('givenBank'),bankName(r.given_bank)||'—'],[t('note'),r.note||'—']]
   :[[t('loanDay'),fdate(pd(r))+(movedNote(r)?' ('+movedNote(r)+')':'')],[t('loanAmount'),money(r.amount,r.currency)],[t('loanType'),loanTitle(r)],[t('remaining'),r.remaining],[t('totalRemaining'),money(r.amount*r.remaining,r.currency)],[t('payBank'),bankName(r.bank)],[t('note'),r.note||'—']];
  if(paidEntry)rows.unshift([t('paidOn'),fdate(paidEntry.paid_on)]);
  const isPaid=kind==='check'?!!r.paid_on:!!paidEntry;
  let b='';if(!isPaid&&can.pay())b+=`<button class="btn" data-act="pay" data-k="${kind}" data-id="${id}">${t('markPaid')}</button>`;
  if(can.edit()){if(isPaid)b+=`<button class="btn ghost" data-act="undo" data-k="${kind}" data-id="${paidEntry?paidEntry.id:id}">${t('undoPaid')}</button>`;
    b+=`<button class="btn ghost" data-act="edit" data-k="${kind}" data-id="${id}">${t('edit')}</button><button class="btn danger" data-act="del" data-k="${kind}" data-id="${id}">${t('delete')}</button>`;}
  sheet(head(kind==='check'?checkTitle(r):loanTitle(r))+`<dl class="det">${rows.map(([a,c])=>`<dt>${esc(a)}</dt><dd>${esc(c)}</dd>`).join('')}</dl>${b?`<div class="actions">${b}</div>`:''}`);}
async function settings(){const adm=can.edit();let users=[];if(adm&&!api.demo){try{users=await api.listUsers();}catch(e){}}
  const banks=[...st.data.banks].sort((a,b)=>a.sort-b.sort);
  sheet(head(t('settings'))+`<label class="f">${t('language')}<select id="s-lang"><option value="en" ${st.lang==='en'?'selected':''}>English</option><option value="tr" ${st.lang==='tr'?'selected':''}>Türkçe</option></select></label>
  <label class="f">${t('warnDays')}<select id="s-warn">${[3,5,7,10,14,30].map(n=>`<option value="${n}" ${n===st.warn?'selected':''}>${n} ${t('days')}</option>`).join('')}</select></label>
  <button class="btn ghost block" data-act="xlall">${t('exportExcel')}</button>
  <h3>${t('banksAdmin')}</h3>${adm?`<form id="bankf" class="two" style="grid-template-columns:1fr auto;align-items:end"><label class="f">${t('addBank')}<input id="b-name" autocomplete="off" placeholder="${t('bankName')}"></label><button class="btn" type="submit">${t('add')}</button></form>`:`<p class="hint">${t('adminOnly')}</p>`}
  <div class="list">${banks.map(b=>`<div class="item"><span>${esc(bankName(b.name))}</span>${adm&&!b.is_other?`<button class="iconbtn" style="width:32px;height:32px" data-act="delbank" data-id="${b.id}" aria-label="${t('delete')} ${esc(b.name)}">${svg(IC.x)}</button>`:''}</div>`).join('')}</div>
  ${adm&&!api.demo?`<h3>${t('users')}</h3><p class="hint">${t('roleHelp')}</p><div class="list">${users.map(u=>`<div class="item"><span>${esc(u.email)}</span><select data-user="${u.id}" aria-label="${t('role')}" ${u.owner?'disabled':''}>${['admin','user','observer','pending'].map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${t('role_'+r)}</option>`).join('')}</select></div>`).join('')}</div>`:''}
  <h3>${t('account')}</h3><p class="hint">${esc(st.me.email)} · ${t('role_'+st.me.role)}</p>
  ${api.demo?`<button class="btn ghost block" data-act="resetdemo">${t('resetDemo')}</button>`:''}<button class="btn danger block" data-act="signout">${t('signOut')}</button>`);
  $('#s-lang').onchange=e=>{st.lang=e.target.value;S.set('dt_lang',st.lang);render();settings();};
  $('#s-warn').onchange=e=>{st.warn=+e.target.value;S.set('dt_warn',st.warn);render();};
  const bf=$('#bankf');if(bf)bf.onsubmit=async e=>{e.preventDefault();const n=$('#b-name').value.trim();if(!n)return;try{await api.addBank(n);await refresh();settings();toast(t('bankAdded'));}catch(x){toast(errMsg(x));}};
  document.querySelectorAll('[data-user]').forEach(s=>s.onchange=async()=>{try{await api.setRole(s.dataset.user,s.value);toast(t('saved'));}catch(x){toast(errMsg(x));settings();}});}

/* ---------- Excel ---------- */
const H=a=>a.map(v=>({v,s:1}));
const cellD=(d,red)=>({v:d,date:true,s:red?6:3});const cellM=(n,red)=>({v:n,s:red?5:2});const cellT=(s,red)=>({v:s==null?'':String(s),s:red?4:0});
const symN=c=>c==='TRY'?'TL':c;
function sheetsAll(){const T=totals();
  const sum=[H([t('currency'),t('checkDebt'),t('loanDebt'),t('totalDebt')]),...CUR.map(c=>[symN(c),{v:T[c].check,s:2},{v:T[c].loan,s:2},{v:T[c].check+T[c].loan,s:8}])];
  const ch=[H([t('checkDay'),t('checkAmount'),t('currency'),t('checkNo'),t('checkBank'),t('payee'),t('givenBank'),t('note')]),...openChecks().map(c=>{const r=urgency(pd(c)).near;return[cellD(pd(c),r),cellM(+c.amount,r),symN(c.currency),c.check_no,bankName(c.bank),c.payee,bankName(c.given_bank),c.note];})];
  const lo=[H([t('loanDay'),t('loanAmount'),t('currency'),t('loanType'),t('remaining'),t('totalRemaining'),t('payBank'),t('note')]),...openLoans().map(l=>{const r=urgency(pd(l)).near;return[cellD(pd(l),r),cellM(+l.amount,r),symN(l.currency),loanTitle(l),{v:l.remaining,s:7},cellM(l.amount*l.remaining,r),bankName(l.bank),l.note];})];
  const pa=[H([t('paidOn'),t('dueDate'),t('kind'),t('amount'),t('currency'),t('bank'),t('checkNo'),t('payee'),t('loanType'),t('note')]),...paidList().map(p=>{const r=p.rec;return[cellD(p.paid_on),cellD(p.due_date),p.kind==='check'?t('check'):t('loan'),cellM(p.amount),symN(p.currency),bankName(r.bank),r.check_no||'',r.payee||'',p.kind==='loan'?loanTitle(r):'',r.note];})];
  return[{name:t('sheetSummary'),rows:sum,widths:[12,20,24,20],freeze:1},{name:t('sheetChecks'),rows:ch,widths:[14,16,8,14,18,26,18,30],freeze:1},{name:t('sheetLoans'),rows:lo,widths:[14,16,8,18,12,18,18,30],freeze:1},{name:t('sheetPaid'),rows:pa,widths:[13,13,16,16,8,18,14,26,18,30],freeze:1}];}
function sheetsReport(){const r=range(),{due,paid}=repData();
  const sumRows=(h,list)=>{const o=split(list);return[[{v:h,s:7}],H([t('kind'),t('count'),...CUR.map(symN)]),[t('checks'),o.n.check,...CUR.map(c=>({v:o.check[c],s:2}))],[t('loans'),o.n.loan,...CUR.map(c=>({v:o.loan[c],s:2}))],[{v:t('total'),s:7},o.n.check+o.n.loan,...CUR.map(c=>({v:o.all[c],s:8}))],[]];};
  const summary={name:t('sheetSummary'),rows:[[{v:t('period')+': '+r.label,s:7}],[],...sumRows(t('dueInPeriod'),due),...sumRows(t('paidInPeriod'),paid)],widths:[22,10,18,18,18]};const head=d=>[t(d),t('kind'),t('amount'),t('currency'),t('bank'),t('checkNo'),t('payee'),t('loanType')];
  const line=(x,d)=>{const q=x.rec;return[cellD(d),x.kind==='check'?t('check'):t('loan'),cellM(x.amount),symN(x.currency),bankName(q.bank),q.check_no||'',q.payee||'',x.kind==='loan'?loanTitle(q):''];};
  return[summary,{name:t('dueInPeriod'),rows:[[{v:t('period')+': '+r.label,s:7}],H(head('dueDate')),...due.map(x=>line(x,x.date))],widths:[14,16,16,8,18,14,26,18],freeze:2},{name:t('paidInPeriod'),rows:[[{v:t('period')+': '+r.label,s:7}],H(head('paidOn')),...paid.map(x=>line(x,x.paid_on))],widths:[14,16,16,8,18,14,26,18],freeze:2}];}
async function saveXlsx(sheets,name){if(window.DT_PREVIEW){toast(st.lang==='tr'?'Excel, bu önizlemede değil, kurulu uygulamada çalışır.':'Excel export works in the installed app, not in this preview.');return;}const blob=DT_XLSX.build(sheets);window.DT_LAST_XLSX=blob;
  if(window.DebtAndroid){const b=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));window.DebtAndroid.saveFile(name,btoa(s));toast(t('exported'));return;}
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent);const f=typeof File==='function'?new File([blob],name,{type:blob.type}):null;
  if(ios&&f&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:name});return;}catch(e){if(e.name==='AbortError')return;}}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);toast(t('exported'));}

/* ---------- events ---------- */
document.addEventListener('click',async ev=>{const el=ev.target.closest('[data-act]');if(!el)return;const{act,k,id}=el.dataset;
  if(act==='scrim'){if(ev.target===el)closeSheet();return;}
  const A={
   nav(){st.view=k;st.q='';scrollTo(0,0);render();},
   lang(){st.lang=st.lang==='tr'?'en':'tr';S.set('dt_lang',st.lang);render();},
   close:closeSheet,settings,
   xlall(){return saveXlsx(sheetsAll(),`Debt-Tracking-${L.today()}.xlsx`);},
   xlreport(){return saveXlsx(sheetsReport(),`Debt-Tracking-${t('reports')}-${st.rep.kind}-${range().from}.xlsx`);},
   new(){k==='check'?checkForm():loanForm();},
   cur(){const w=$('#cur');w.dataset.v=k;w.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===k));},
   open(){detail(k,id);},
   openpaid(){const p=paidList().find(x=>x.kind===k&&x.id===id);if(p)detail(k,p.rec.id,p);},
   pay(){confirmSheet(t(k==='check'?'confirmPayCheck':'confirmPayLoan'),()=>run(()=>k==='check'?api.payCheck(id):api.payLoan(id,st.data.loans.find(l=>l.id===id)),t('movedPaid')));},
   undo(){confirmSheet(t('confirmUndo'),()=>run(()=>{if(k==='check')return api.undoCheck(id);const p=st.data.payments.find(x=>x.id===id);return api.undoLoanPayment(id,p,st.data.loans.find(l=>l.id===p.loan_id));},t('movedBack')));},
   edit(){k==='check'?checkForm(st.data.checks.find(c=>c.id===id)):loanForm(st.data.loans.find(c=>c.id===id));},
   del(){confirmSheet(t(k==='check'?'confirmDelete':'confirmDeleteLoan'),()=>run(()=>k==='check'?api.deleteCheck(id):api.deleteLoan(id,st.data.payments.filter(p=>p.loan_id===id).map(p=>p.id)),t('deleted')),true);},
   async delbank(){try{await api.deleteBank(id);await refresh();settings();}catch(x){toast(errMsg(x));}},
   repkind(){st.rep.kind=k;render();},
   repmove(){moveRep(+el.dataset.n);render();},
   async demo(){st.me=await api.demoSignIn(k);await refresh();},
   async resetdemo(){api.reset();closeSheet();await refresh();},
   authswap(){st.authMode=st.authMode==='login'?'signup':'login';st.msg='';render();},
   async signout(){await api.signOut();st.me=null;st.data=null;st.view='home';closeSheet();render();},
   async recheck(){await boot();}
  };
  if(A[act])await A[act]();
});
document.addEventListener('input',e=>{const w=e.target.closest('label.bad');if(w){w.classList.remove('bad');const f=$('#ferr');if(f)f.hidden=true;}if(e.target.id==='q'){st.q=e.target.value;render();}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[role=button]'))e.target.click();if(e.key==='Escape')closeSheet();});
document.addEventListener('submit',async e=>{if(e.target.id!=='authf')return;e.preventDefault();const em=$('#au-email').value.trim(),pw=$('#au-pass').value;st.msg='';
  try{const me=st.authMode==='login'?await api.signIn(em,pw):await api.signUp(em,pw);if(!me){st.authMode='login';st.msg=t('confirmEmail');render();return;}st.me=me;if(me.role!=='pending')await refresh();else render();}catch(x){st.msg=errMsg(x);render();}});
window.dtBack=function(){if($('#sheet-root').innerHTML){closeSheet();return true;}if(st.me&&st.view!=='home'){st.view='home';render();return true;}return false;};
async function boot(){try{st.me=await api.restore();}catch(e){st.me=null;toast(errMsg(e));}if(st.me&&st.me.role!=='pending')await refresh();else render();}
setInterval(()=>{if(st.me&&st.me.role!=='pending'&&!api.demo&&document.visibilityState==='visible'&&!$('#sheet-root').innerHTML&&document.activeElement.id!=='q')refresh();},300000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&st.me&&st.me.role!=='pending'&&!api.demo&&!$('#sheet-root').innerHTML)refresh();});
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.DT_NO_SW)navigator.serviceWorker.register('sw.js').catch(()=>{});
window.DT_APP={st,parseAmount,refresh};
boot();
})();
