const $=id=>document.getElementById(id);
const key='ce-daily-v5', keyBid='ce-bid-v1', keyPlan='ce-plan-v1';
const todayISO=()=> new Date().toISOString().slice(0,10);
const loadAll=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}};
const saveAll=db=>localStorage.setItem(key,JSON.stringify(db));
const getEntry=d=>loadAll()[d];
const saveEntry=e=>{const db=loadAll(); db[e.date]=e; saveAll(db)};
const delEntry=d=>{const db=loadAll(); delete db[d]; saveAll(db)};
const loadBid=()=>{try{return JSON.parse(localStorage.getItem(keyBid)||'[]')}catch(e){return []}};
const saveBid=list=>localStorage.setItem(keyBid,JSON.stringify(list||[]));
const monthKey=d=>d.slice(0,7);
const listEntries=m=>{const arr=Object.values(loadAll()).sort((a,b)=>a.date.localeCompare(b.date)); return m?arr.filter(x=>monthKey(x.date)===m):arr};
function escapeHtml(s){return (s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\'':'&#39;'}[c]))}
const num=n=>{const v=parseFloat(n); return isFinite(v)?v:0};

const colTemplates={'tbl-work':['text','text','number','number','number','text'],'tbl-mat':['text','text','number','number','number','text'],'tbl-lab-eq':['text','number','number','text','number','number']};
function rowToData(tr){return [...tr.querySelectorAll('input')].map(i=>i.value)}
function dataToRow(tid,vals=[]){const tr=document.createElement('tr'); const types=colTemplates[tid];
  types.forEach((tp,idx)=>{const td=document.createElement('td'); const ip=document.createElement('input'); ip.type=(tp==='number'?'number':'text'); ip.value=vals[idx]||''; ip.style.width='100%'; ip.dataset.col=idx; td.appendChild(ip); tr.appendChild(td)});
  const td=document.createElement('td'); const del=document.createElement('button'); del.textContent='刪'; del.className='iconbtn'; del.addEventListener('click',()=> tr.remove()); td.appendChild(del); tr.appendChild(td);
  if(tid==='tbl-work'){ tr.addEventListener('input',e=>{ const col=(e.target.dataset||{}).col; if(col==3||col==0){ autoFillCumulativeForRow(tr); calcActualPct(); } }) }
  return tr}
function setTable(tid, rows){const tb=$("#"+tid+" tbody"); tb.innerHTML=''; (rows||[]).forEach(r=> tb.appendChild(dataToRow(tid,r)) )}
function readTable(tid){return [...document.querySelectorAll("#"+tid+" tbody tr")].map(rowToData)}
document.querySelectorAll('[data-add-row]').forEach(btn=>{btn.addEventListener('click',()=>{const tid=btn.getAttribute('data-add-row'); $("#"+tid+" tbody").appendChild(dataToRow(tid))})})

function parseCSV(text){
  const lines = text.replace(/\r\n?/g, "\n").trim().split("\n");
  const headers = lines[0].split(",").map(s=>s.trim());
  return lines.slice(1).filter(Boolean).map(line=>{
    const cols = line.split(",").map(s=>s.trim());
    const obj = {}; headers.forEach((h,i)=> obj[h] = cols[i] ?? "");
    return obj;
  });
}
function renderBidSelect(){ const list=loadBid(); const sel=$('bid-select'); sel.innerHTML='';
  list.forEach((it,i)=>{const opt=document.createElement('option'); opt.value=i; opt.textContent=`${it.item||it["施工項目"]}（${it.unit||it["單位"]} / 契約 ${it.qty||it["契約數量"]}）`; sel.appendChild(opt)});
  $('bid-count').textContent=`共 ${list.length} 項`;
}
$('bidFile').addEventListener('change',(e)=>{
  const f=e.target.files?.[0]; if(!f) return; const reader=new FileReader();
  reader.onload=(ev)=>{ let text=ev.target.result||""; let arr=[];
    try{ const maybe=JSON.parse(text); if(Array.isArray(maybe)) arr=maybe; else if(maybe&&Array.isArray(maybe.items)) arr=maybe.items; }catch{ arr=parseCSV(text) }
    arr = arr.map(x=>({ item:x["施工項目"]??x["item"]??x[Object.keys(x)[0]]??"", unit:x["單位"]??x["unit"]??x[Object.keys(x)[1]]??"", qty:x["契約數量"]??x["qty"]??x[Object.keys(x)[2]]??""}))
             .filter(x=>x.item&&x.unit&&(x.qty!==undefined&&x.qty!==""));
    saveBid(arr); renderBidSelect(); alert(`✅ 標單匯入完成：${arr.length} 項`);
  };
  reader.readAsText(f,'utf-8');
});
$('btn-add-bid').addEventListener('click',()=>{const idx=parseInt($('bid-select').value||"-1"); const list=loadBid(); const it=list[idx]; if(!it){alert('請先匯入並選擇工項'); return;}
  const tr=dataToRow('tbl-work',[it.item,it.unit,it.qty,'','','']); $('#tbl-work tbody').appendChild(tr);
});

function setForm(entry){
  $('f-date').value=entry?.date||new Date().toISOString().slice(0,10);
  $('f-w-am').value=entry?.wAm||'晴'; $('f-w-pm').value=entry?.wPm||'晴';
  $('f-project').value=entry?.project||''; $('f-contractor').value=entry?.contractor||'';
  $('f-start').value=entry?.start||''; $('f-end').value=entry?.end||''; $('f-ext').value=entry?.ext||0;
  $('f-pct-plan').value=entry?.pctPlan||''; $('f-pct-actual').value=entry?.pctActual||'';
  setTable('tbl-work', entry?.work||[]); setTable('tbl-mat', entry?.mat||[]); setTable('tbl-lab-eq', entry?.labEq||[]);
  $('s5_1_yes').checked=entry?.s5_1_yes||false; $('s5_1_no').checked=entry?.s5_1_no||false;
  $('s5_2_yes').checked=entry?.s5_2_yes||false; $('s5_2_no').checked=entry?.s5_2_no||false; $('s5_2_nonew').checked=entry?.s5_2_nonew||false;
  $('s5_3_yes').checked=entry?.s5_3_yes||false; $('s5_3_no').checked=entry?.s5_3_no||false;
  $('sec5_other').value=entry?.sec5_other||''; $('sec6').value=entry?.sec6||''; $('sec7').value=entry?.sec7||''; $('sec8').value=entry?.sec8||'';
  renderBidSelect(); computeDurations(); autoFillAllCumulative(); calcActualPct();
}
function readForm(){return {date:$('f-date').value, wAm:$('f-w-am').value, wPm:$('f-w-pm').value, project:$('f-project').value, contractor:$('f-contractor').value,
  start:$('f-start').value, end:$('f-end').value, ext:parseFloat($('f-ext').value||0), pctPlan:$('f-pct-plan').value, pctActual:$('f-pct-actual').value,
  work:readTable('tbl-work'), mat:readTable('tbl-mat'), labEq:readTable('tbl-lab-eq'), s5_1_yes:$('s5_1_yes').checked, s5_1_no:$('s5_1_no').checked,
  s5_2_yes:$('s5_2_yes').checked, s5_2_no:$('s5_2_no').checked, s5_2_nonew:$('s5_2_nonew').checked, s5_3_yes:$('s5_3_yes').checked, s5_3_no:$('s5_3_no').checked,
  sec5_other:$('sec5_other').value, sec6:$('sec6').value, sec7:$('sec7').value, sec8:$('sec8').value}}

function addDays(dateStr, days){const d=new Date(dateStr); d.setDate(d.getDate()+days); return d}
function daysInclusive(start, end){ if(!start||!end) return 0; const s=new Date(start); const e=new Date(end); const ms= e - s; if(ms<0) return 0; return Math.floor(ms/86400000)+1 }
function computeDurations(){ const s=$('f-start').value, e=$('f-end').value, ext=parseFloat($('f-ext').value||0); if(!s||!e){$('f-days-elapse').value=''; $('f-days-left').value=''; return}
  const total=daysInclusive(s, addDays(e, ext).toISOString().slice(0,10)); const elapse=daysInclusive(s, $('f-date').value); const left=Math.max(total - elapse, 0);
  if(!$('f-days-approved').value){$('f-days-approved').value=total} $('f-days-elapse').value=elapse; $('f-days-left').value=left; }
;['f-date','f-start','f-end','f-ext'].forEach(id=> $(id)?.addEventListener('change',()=>{ computeDurations(); autoFillAllCumulative(); calcActualPct()}))

function cumulativeUpTo(date,item){ const db=loadAll(); let sum=0; for(const d of Object.keys(db)){ if(d>date) continue; const rows=db[d].work||[]; rows.forEach(r=>{ if((r[0]||'')===item){ sum += parseFloat(r[3]||0) } }) } return sum }
function autoFillCumulativeForRow(tr){ const item=tr.querySelector('input[data-col="0"]').value; if(!item) return; const today=$('f-date').value; const todayQty= parseFloat(tr.querySelector('input[data-col="3"]').value||0); const before= cumulativeUpTo(today, item) - todayQty; const cum = before + todayQty; tr.querySelector('input[data-col="4"]').value = String(cum) }
function autoFillAllCumulative(){ document.querySelectorAll('#tbl-work tbody tr').forEach(autoFillCumulativeForRow) }
function calcActualPct(){ let sumContract=0, sumCum=0; document.querySelectorAll('#tbl-work tbody tr').forEach(tr=>{ const c=parseFloat(tr.querySelector('input[data-col="2"]').value||0); const cum=parseFloat(tr.querySelector('input[data-col="4"]').value||0); if(c>0){ sumContract+=c; sumCum+=Math.min(cum,c) } }); const pct = sumContract>0 ? (sumCum/sumContract*100) : 0; $('f-pct-actual').value = pct.toFixed(2); }

function renderList(){const m=$('month-filter').value||''; const arr=listEntries(m); $('list-count').textContent=`（${arr.length} 筆）`; const tb=$('list-body'); tb.innerHTML=''; 
  for(const it of arr){const tr=document.createElement('tr'); tr.className='list-row'; tr.innerHTML=`
    <td>${it.date}</td><td>${escapeHtml(it.project||'')}</td><td>${escapeHtml(it.wAm||'')}/${escapeHtml(it.wPm||'')}</td>
    <td><button class="btn" data-act="edit" data-date="${it.date}">編輯</button>
        <button class="btn" data-act="copy" data-date="${it.date}">複製到今日</button>
        <button class="btn" data-act="del" data-date="${it.date}">刪除</button></td>`; tb.appendChild(tr)}
}
document.addEventListener('click',(e)=>{const b=e.target.closest('button'); if(!b) return; const d=b.dataset.date; const act=b.dataset.act; const data=getEntry(d);
  if(act==='edit'&&data){setForm(data); window.scrollTo({top:0,behavior:'smooth'})}
  if(act==='copy'&&data){const t=todayISO(); setForm({...data,date:t})}
  if(act==='del'){ if(confirm(`確定刪除 ${d} 的記錄？`)){delEntry(d); renderList()} }})
$('btn-del-month').addEventListener('click',()=>{const m=$('month-filter').value; if(!m) return alert('請先選擇月份'); const arr=listEntries(m); if(arr.length===0) return alert('本月無資料'); if(confirm(`確定刪除 ${m} 的 ${arr.length} 筆記錄？`)){const db=loadAll(); arr.forEach(it=>delete db[it.date]); saveAll(db); renderList()}})

$('btn-export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(loadAll(),null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`施工日誌_${todayISO()}.json`; a.click(); URL.revokeObjectURL(url)})
$('importFile').addEventListener('change',async(e)=>{const f=e.target.files?.[0]; if(!f) return; const reader=new FileReader(); reader.onload=(ev)=>{ try{const data=JSON.parse(ev.target.result||'{}'); const db=loadAll(); Object.assign(db,data); saveAll(db); alert('匯入完成'); renderList()}catch(err){alert('匯入失敗：'+err.message)} }; reader.readAsText(f,'utf-8')})

function box(v){return v?'☑':'□'}
function buildPrintMonth(month){
  const arr=listEntries(month); if(arr.length===0){alert('本月沒有資料可列印'); return}
  const root=$('print-root'); root.innerHTML='';
  arr.forEach(it=>{
    const page=document.createElement('section'); page.className='print-page';
    page.innerHTML=`<div class="sheet">
      <h2>公共工程施工日誌（附表四）</h2>
      <table class="tbl">
        <tr><th style="width:110px">本日天氣</th><td>上午：${escapeHtml(it.wAm||'')}　下午：${escapeHtml(it.wPm||'')}</td><th style="width:110px">填表日期</th><td style="width:200px">${it.date}</td></tr>
        <tr><th>工程名稱</th><td>${escapeHtml(it.project||'')}</td><th>承攬廠商名稱</th><td>${escapeHtml(it.contractor||'')}</td></tr>
        <tr><th>開工 / 完工日期</th><td>${escapeHtml(it.start||'')} ／ ${escapeHtml(it.end||'')}</td><th>預定 / 實際進度(%)</th><td>${escapeHtml(it.pctPlan||'')} ／ ${escapeHtml(it.pctActual||'')}</td></tr>
      </table>
      <table class="tbl">
        <tr><th colspan="6">一、依施工計畫書執行按圖施工概況（含約定之重要施工項目及完成數量等）：</th></tr>
        <tr><th>施工項目</th><th>單位</th><th>契約數量</th><th>本日完成數量</th><th>累計完成數量</th><th>備註</th></tr>
        ${(it.work||[]).map(r=>`<tr>${r.slice(0,6).map(c=>`<td>${escapeHtml(c||'')}</td>`).join('')}</tr>`).join('')}
      </table>
      <table class="tbl">
        <tr><th colspan="6">二、工地材料管理概況（含約定之重要材料使用狀況及數量等）：</th></tr>
        <tr><th>材料名稱</th><th>單位</th><th>契約數量</th><th>本日使用數量</th><th>累計使用數量</th><th>備註</th></tr>
        ${(it.mat||[]).map(r=>`<tr>${r.slice(0,6).map(c=>`<td>${escapeHtml(c||'')}</td>`).join('')}</tr>`).join('')}
      </table>
      <table class="tbl">
        <tr><th colspan="6">三、工地人員及機具管理（含約定之出工人數及機具使用情形及數量）：</th></tr>
        <tr><th>工別</th><th>本日人數</th><th>累計人數</th><th>機具名稱</th><th>本日使用數量</th><th>累計使用數量</th></tr>
        ${(it.labEq||[]).map(r=>`<tr>${r.slice(0,6).map(c=>`<td>${escapeHtml(c||'')}</td>`).join('')}</tr>`).join('')}
      </table>
      <table class="tbl">
        <tr><th>四、本日施工項目是否有須依「營造業專業工程特定施工項目應置之技術士種類、比率或人數標準表」規定應設置技術士之專業工程：□有 □無（此項如勾選”有”，則應填寫後附「公共工程施工日誌之技術士簽章表」）</th></tr>
        <tr><td>${it.tech_yes?'☑':'□'}有　${it.tech_no?'☑':'□'}無</td></tr>
      </table>
      <table class="tbl">
        <tr><th>五、工地職業安全衛生事項之督導、公共環境與安全之維護及其他工地行政事務：</th></tr>
        <tr><td>
          （一）施工前檢查事項：<br>
          &emsp;1. 實施勤前教育（含工地預防災變及危害告知）： ${(it.s5_1_yes?'☑':'□')}有　${(it.s5_1_no?'☑':'□')}無<br>
          &emsp;2. 確認新進勞工是否投保勞工保險（或其他商業保險）資料及安全衛生教育訓練紀錄： ${(it.s5_2_yes?'☑':'□')}有　${(it.s5_2_no?'☑':'□')}無　${(it.s5_2_nonew?'☑':'□')}未新進勞工<br>
          &emsp;3. 檢查勞工個人防護具： ${(it.s5_3_yes?'☑':'□')}有　${(it.s5_3_no?'☑':'□')}無<br>
          （二）其他事項：<br>
          ${escapeHtml(it.sec5_other||'').replace(/\n/g,'<br>')}
        </td></tr>
      </table>
      <table class="tbl"><tr><th>六、施工取樣試驗紀錄：</th></tr><tr><td>${escapeHtml(it.sec6||'').replace(/\n/g,'<br>')}</td></tr></table>
      <table class="tbl"><tr><th>七、通知協力廠商辦理事項：</th></tr><tr><td>${escapeHtml(it.sec7||'').replace(/\n/g,'<br>')}</td></tr></table>
      <table class="tbl"><tr><th>八、重要事項記錄：</th></tr><tr><td>${escapeHtml(it.sec8||'').replace(/\n/g,'<br>')}</td></tr></table>
      <div class="sign1"><div>簽章：【工地主任】（註3）：</div></div>
    </div>`;
    root.appendChild(page);
  });
  root.style.display='block'; window.print(); setTimeout(()=>{root.style.display='none'; root.innerHTML=''},100);
}

(function init(){ $('f-date').value=todayISO(); $('month-filter').value=todayISO().slice(0,7);
  const exist=getEntry(todayISO()); setForm(exist?exist:{date:todayISO()}); renderList(); })();
$('btn-new').addEventListener('click',()=> setForm({date:todayISO()}))
$('btn-save').addEventListener('click',()=>{autoFillAllCumulative(); calcActualPct(); computeDurations(); const data=readForm(); saveEntry(data); renderList(); alert('已儲存！')})
$('btn-list').addEventListener('click',()=> renderList())
$('btn-print').addEventListener('click',()=>{const m=$('month-filter').value||todayISO().slice(0,7); buildPrintMonth(m)})
$('f-date').addEventListener('change',(e)=>{const d=e.target.value; const exists=getEntry(d); setForm(exists?exists:{date:d})})
