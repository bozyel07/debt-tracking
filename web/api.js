// Data layer: DemoApi keeps data in this browser, FireApi talks to Firebase.
(function(){
  const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
  window.DT_STORE=store;
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const logic={
    iso,today:()=>iso(new Date()),
    parse:s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);},
    addDays(s,n){const d=logic.parse(s);d.setDate(d.getDate()+n);return iso(d);},
    nextDue(s,day){const d=logic.parse(s);const y=d.getFullYear(),m=d.getMonth()+1;const last=new Date(y,m+1,0).getDate();return iso(new Date(y,m,Math.min(day,last)));},
    diff(a,b){return Math.round((logic.parse(a)-logic.parse(b))/864e5);},
    // A payment day on Saturday or Sunday is paid on the next Monday.
    payDay(s){if(!s)return s;const w=logic.parse(s).getDay();return w===6?logic.addDays(s,2):w===0?logic.addDays(s,1):s;},
    installments(l){const out=[];let dt=l.due_date;for(let i=0;i<l.remaining;i++){out.push({date:logic.payDay(dt),orig:dt,n:i+1,loan:l});dt=logic.nextDue(dt,l.pay_day||logic.parse(l.due_date).getDate());}return out;}
  };
  window.DT_LOGIC=logic;
  const uid=()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);

  const DEFAULT_BANKS=['Akbank','Ziraat Bank','Halkbank','Yapı Kredi','Denizbank','İş Bankası','TEB','Garanti','Ziraat Katılım','QNB'];
  function seed(){
    const t=logic.today(),a=n=>logic.addDays(t,n);
    const c=(d,amt,cur,no,bank,payee,gb,note,paid)=>({id:uid(),due_date:a(d),amount:amt,currency:cur,check_no:no,bank,payee,given_bank:gb,note,paid_on:paid==null?null:a(paid),created_at:new Date().toISOString()});
    const l=(d,amt,cur,ty,rem,bank,note)=>({id:uid(),due_date:a(d),amount:amt,currency:cur,loan_type:ty,remaining:rem,bank,note,pay_day:logic.parse(a(d)).getDate(),pay_seq:0,created_at:new Date().toISOString()});
    const loans=[{...l(18,42750,'TRY','vat',10,'Sample Vergi Dairesi','Örnek: KDV yapılandırma'),section:'tax'},l(3,48500,'TRY','vehicle',14,'Garanti','Örnek: çekici kredisi'),l(12,2150,'USD','machine',9,'Akbank','Sample: excavator'),l(21,126000,'TRY','commercial',6,'İş Bankası',''),l(26,1800,'EUR','vehicle',4,'QNB','')];
    return{banks:[...DEFAULT_BANKS.map((n,i)=>({id:'b'+i,name:n,is_other:false,sort:(i+1)*10})),{id:'bo',name:'Others',is_other:true,sort:9999}],
      checks:[c(-1,18000,'TRY','0048213','Akbank','Yılmaz Nakliyat','Ziraat Bank','Örnek kayıt'),c(2,65000,'TRY','0048214','Akbank','Demir Lastik','Garanti','Lastik alımı'),c(6,4200,'USD','7731902','Yapı Kredi','Kaya Otomotiv','TEB',''),c(16,92500,'TRY','1120456','Halkbank','Özkan Petrol','QNB','Yakıt'),c(33,3100,'EUR','5510377','Denizbank','Arslan Yedek Parça','Akbank',''),c(-20,27500,'TRY','0048190','Akbank','Çelik Tamir','Halkbank','',-20)],
      loans,payments:[{id:uid(),loan_id:loans[1].id,due_date:a(-27),paid_on:a(-27),amount:48500}],users:[]};
  }

  class DemoApi{
    constructor(){this.demo=true;const s=store.get('dt_demo');try{this.db=s?JSON.parse(s):seed();}catch(e){this.db=seed();}this.session=null;const r=store.get('dt_demo_role');if(r)this.session={id:'demo',email:'demo@debt.tracking',role:r};}
    persist(){store.set('dt_demo',JSON.stringify(this.db));}
    async restore(){return this.session;}
    async demoSignIn(role){store.set('dt_demo_role',role);return this.session={id:'demo',email:'demo@debt.tracking',role};}
    async signOut(){store.del('dt_demo_role');this.session=null;}
    reset(){this.db=seed();this.persist();}
    async load(){this.persist();return JSON.parse(JSON.stringify(this.db));}
    need(...r){if(!r.includes(this.session.role))throw new Error('perm');}
    async addCheck(v){this.need('admin','user');this.db.checks.push({...v,id:uid(),paid_on:null});this.persist();}
    async addLoan(v){this.need('admin','user');this.db.loans.push({...v,id:uid(),pay_day:logic.parse(v.due_date).getDate()});this.persist();}
    async updateCheck(id,v){this.need('admin');Object.assign(this.db.checks.find(c=>c.id===id),v);this.persist();}
    async updateLoan(id,v){this.need('admin');const l=this.db.loans.find(c=>c.id===id);if(v.due_date!==l.due_date)v={...v,pay_day:logic.parse(v.due_date).getDate()};Object.assign(l,v);this.persist();}
    async deleteCheck(id){this.need('admin');this.db.checks=this.db.checks.filter(c=>c.id!==id);this.persist();}
    async deleteLoan(id){this.need('admin');this.db.loans=this.db.loans.filter(c=>c.id!==id);this.db.payments=this.db.payments.filter(p=>p.loan_id!==id);this.persist();}
    async payCheck(id){this.need('admin','user');this.db.checks.find(c=>c.id===id).paid_on=logic.today();this.persist();}
    async payLoan(id){this.need('admin','user');const l=this.db.loans.find(c=>c.id===id);if(l.remaining<1)return;this.db.payments.push({id:uid(),loan_id:id,due_date:l.due_date,paid_on:logic.today(),amount:l.amount});l.remaining--;if(l.remaining>0)l.due_date=logic.nextDue(l.due_date,l.pay_day);this.persist();}
    async undoCheck(id){this.need('admin');this.db.checks.find(c=>c.id===id).paid_on=null;this.persist();}
    async undoLoanPayment(id){this.need('admin');const p=this.db.payments.find(x=>x.id===id),l=this.db.loans.find(c=>c.id===p.loan_id);l.remaining++;if(p.due_date<l.due_date)l.due_date=p.due_date;this.db.payments=this.db.payments.filter(x=>x.id!==id);this.persist();}
    async addBank(name){this.need('admin');if(this.db.banks.some(b=>b.name.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr')))return;this.db.banks.push({id:uid(),name,is_other:false,sort:500});this.persist();}
    async deleteBank(id){this.need('admin');this.db.banks=this.db.banks.filter(b=>b.id!==id||b.is_other);this.persist();}
    async listUsers(){return[{id:'demo',email:'demo@debt.tracking',role:this.session.role}];}
    async setRole(){}
  }

  const toVal=v=>v===null||v===undefined?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):{stringValue:String(v)};
  const fromVal=v=>'stringValue'in v?v.stringValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'booleanValue'in v?v.booleanValue:'timestampValue'in v?v.timestampValue:null;
  const toFields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,toVal(v)]));

  // Firebase sign-in and Firestore through their web APIs, so the app needs no outside code.
  class FireApi{
    constructor(key,project){this.key=key;this.demo=false;this.session=null;this.root=`projects/${project}/databases/(default)/documents`;this.base='https://firestore.googleapis.com/v1/'+this.root;this.times={};}
    get tok(){try{return JSON.parse(store.get('dt_auth')||'null')}catch(e){return null}}
    set tok(v){v?store.set('dt_auth',JSON.stringify(v)):store.del('dt_auth');}
    async raw(url,opt={}){
      let r;try{r=await fetch(url,opt);}catch(e){throw new Error('net');}
      const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
      if(r.ok)return j;
      const er=(j&&(j.error||j[0]&&j[0].error))||{},m=String(er.message||r.status),st=er.status||'';
      if(/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD|TOKEN_EXPIRED|INVALID_REFRESH_TOKEN/.test(m))throw new Error('login');
      if(/EMAIL_EXISTS/.test(m))throw new Error('exists');
      if(/WEAK_PASSWORD/.test(m))throw new Error('short');
      if(st==='PERMISSION_DENIED')throw new Error('perm');
      if(st==='FAILED_PRECONDITION'||st==='ABORTED')throw new Error('stale');
      if(st==='RESOURCE_EXHAUSTED')throw new Error('quota');
      if(r.status===404){const e=new Error('notfound');throw e;}
      throw new Error(m);
    }
    keep(j){this.tok={id:j.idToken,refresh:j.refreshToken,uid:j.localId,email:j.email,exp:Date.now()+(+j.expiresIn||3600)*1000};}
    identity(fn,body){return this.raw(`https://identitytoolkit.googleapis.com/v1/accounts:${fn}?key=${this.key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
    async auth(){
      const t=this.tok;if(!t)throw new Error('login');
      if(t.exp-Date.now()<60000){const j=await this.raw(`https://securetoken.googleapis.com/v1/token?key=${this.key}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(t.refresh)});
        this.tok={...t,id:j.id_token,refresh:j.refresh_token,exp:Date.now()+(+j.expires_in||3600)*1000};}
      return{Authorization:'Bearer '+this.tok.id,'Content-Type':'application/json'};
    }
    name(path){return `${this.root}/${path}`;}
    async getDoc(path){try{return await this.raw(`${this.base}/${path}`,{headers:await this.auth()});}catch(e){if(e.message==='notfound')return null;throw e;}}
    decode(d){const o={id:d.name.split('/').pop()};for(const k in d.fields||{})o[k]=fromVal(d.fields[k]);this.times[o.id]=d.updateTime;return o;}
    async list(col){const out=[];let tk='';do{const j=await this.raw(`${this.base}/${col}?pageSize=300${tk?'&pageToken='+encodeURIComponent(tk):''}`,{headers:await this.auth()});(j.documents||[]).forEach(d=>out.push(this.decode(d)));tk=j.nextPageToken||'';}while(tk);return out;}
    set(path,o,pre){return{update:{name:this.name(path),fields:toFields(o)},...(pre?{currentDocument:pre}:{})};}
    patch(path,o,pre){return{...this.set(path,o,pre),updateMask:{fieldPaths:Object.keys(o)}};}
    del(path){return{delete:this.name(path)};}
    bump(){return{transform:{document:this.name('meta/version'),fieldTransforms:[{fieldPath:'v',setToServerValue:'REQUEST_TIME'}]}};}
    async commit(writes,noBump){try{return await this.raw(`${this.base}:commit`,{method:'POST',headers:await this.auth(),body:JSON.stringify({writes:noBump?writes:[...writes,this.bump()]})});}catch(e){if(e.message==='stale')store.del('dt_cache_'+this.tok.uid);throw e;}}
    fresh(id){return this.times[id]?{updateTime:this.times[id]}:{exists:true};}
    async me(){const t=this.tok;let u=await this.getDoc('users/'+t.uid);
      if(!u){await this.commit([this.set('users/'+t.uid,{email:t.email,role:'pending'},{exists:false})],true);u=await this.getDoc('users/'+t.uid);}
      const p=this.decode(u);return this.session={id:t.uid,email:t.email,role:p.role||'pending'};}
    async restore(){if(!this.tok)return null;try{return await this.me();}catch(e){if(e.message==='net')throw e;this.tok=null;return null;}}
    async signIn(email,password){this.keep(await this.identity('signInWithPassword',{email,password,returnSecureToken:true}));return this.me();}
    async signUp(email,password){this.keep(await this.identity('signUp',{email,password,returnSecureToken:true}));const t=this.tok;
      try{await this.commit([this.set('meta/setup',{owner:t.uid},{exists:false}),this.set('users/'+t.uid,{email:t.email,role:'admin'},{exists:false})],true);}catch(e){if(e.message==='net')throw e;}
      return this.me();}
    async signOut(){const t=this.tok;if(t)store.del('dt_cache_'+t.uid);this.tok=null;this.session=null;}
    async load(){const key='dt_cache_'+this.tok.uid;const verDoc=await this.getDoc('meta/version'),v=verDoc?verDoc.updateTime:null;
      if(v){try{const c=JSON.parse(store.get(key)||'null');if(c&&c.v===v){this.times=c.times;return c.data;}}catch(e){}}
      let[banks,checks,loans,payments]=await Promise.all(['banks','checks','loans','loan_payments'].map(c=>this.list(c)));
      if(!banks.length&&this.session.role==='admin'){banks=[...DEFAULT_BANKS.map((n,i)=>({id:'b'+(i+1),name:n,is_other:false,sort:(i+1)*10})),{id:'others',name:'Others',is_other:true,sort:9999}];await this.commit(banks.map(({id,...b})=>this.set('banks/'+id,b)));}
      banks.sort((a,b)=>a.sort-b.sort||a.name.localeCompare(b.name));
      const data={banks,checks,loans,payments};store.set(key,JSON.stringify({v,times:this.times,data}));return data;}
    addCheck(v){return this.commit([this.set('checks/'+uid(),{...v,paid_on:null,created_by:this.session.id,created_at:new Date().toISOString()},{exists:false})]);}
    addLoan(v){return this.commit([this.set('loans/'+uid(),{...v,pay_day:logic.parse(v.due_date).getDate(),pay_seq:0,created_by:this.session.id,created_at:new Date().toISOString()},{exists:false})]);}
    updateCheck(id,v){return this.commit([this.patch('checks/'+id,v,this.fresh(id))]);}
    updateLoan(id,v){return this.commit([this.patch('loans/'+id,{...v,pay_day:logic.parse(v.due_date).getDate()},this.fresh(id))]);}
    deleteCheck(id){return this.commit([this.del('checks/'+id)]);}
    async deleteLoan(id,payIds=[]){return this.commit([this.del('loans/'+id),...payIds.map(p=>this.del('loan_payments/'+p))]);}
    payCheck(id){return this.commit([this.patch('checks/'+id,{paid_on:logic.today()},this.fresh(id))]);}
    payLoan(id,l){if(l.remaining<1)return;const seq=(l.pay_seq||0)+1;return this.commit([
      this.set(`loan_payments/${id}_${seq}`,{loan_id:id,due_date:l.due_date,paid_on:logic.today(),amount:l.amount,created_by:this.session.id},{exists:false}),
      this.patch('loans/'+id,{remaining:l.remaining-1,pay_seq:seq,due_date:l.remaining>1?logic.nextDue(l.due_date,l.pay_day):l.due_date},this.fresh(id))]);}
    undoCheck(id){return this.commit([this.patch('checks/'+id,{paid_on:null},this.fresh(id))]);}
    undoLoanPayment(id,p,l){return this.commit([this.patch('loans/'+l.id,{remaining:l.remaining+1,due_date:p.due_date<l.due_date?p.due_date:l.due_date},this.fresh(l.id)),this.del('loan_payments/'+id)]);}
    addBank(name){return this.commit([this.set('banks/'+uid(),{name,is_other:false,sort:500})]);}
    deleteBank(id){return this.commit([this.del('banks/'+id)]);}
    async listUsers(){const[u,s]=await Promise.all([this.list('users'),this.getDoc('meta/setup')]);const o=s?this.decode(s).owner:null;return u.map(x=>({...x,owner:x.id===o}));}
    setRole(id,role){return this.commit([this.patch('users/'+id,{role})],true);}
  }
  const c=window.DT_CONFIG||{};
  window.DT_API=c.firebaseApiKey&&c.firebaseProjectId?new FireApi(c.firebaseApiKey,c.firebaseProjectId):new DemoApi();
})();
