(function(root){
'use strict';
const shuffle=(a,rng=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\s，。,.、；;：:！!？?]/g,'').trim();
function validDefinition(q,r){return !!r&&typeof r.text==='string'&&r.text.trim().length>0&&r.text.length<=4000&&Array.isArray(r.points)&&r.points.length===q.points.length&&r.points.every(v=>typeof v==='boolean');}
function judge(q,response){
 if(q.type==='definition')return validDefinition(q,response)&&response.points.every(Boolean);
 if(q.type==='multi') return Array.isArray(response)&&response.length===q.answer.length&&new Set(response).size===response.length&&q.answer.every(x=>response.includes(x));
 if(q.type==='fill') return q.answer.some(x=>norm(x)===norm(response));
 if(q.type==='number'){
  const v=String(response).normalize('NFKC').trim();
  const match=v.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*?)$/);if(!match)return false;
  const unit=match[2].replace(/\s/g,'').toLowerCase(); const target=q.unit.normalize('NFKC').replace(/\s/g,'').toLowerCase();
  if(unit&&unit!==target)return false;
  return Number.isFinite(Number(match[1]))&&Math.abs(Number(match[1])-q.answer)<=q.tolerance+1e-8;
 }
 return response===q.answer;
}
function pick(questions,count=12,rng=Math.random){
 const selected=[];for(const type of shuffle([...new Set(questions.map(q=>q.type))],rng).slice(0,count)){const list=questions.filter(q=>q.type===type);if(list.length)selected.push(shuffle(list,rng)[0]);}
 const rest=shuffle(questions.filter(q=>!selected.includes(q)),rng);return shuffle([...selected,...rest].slice(0,count),rng);
}
const fresh=()=>({schema:1,completed:{},stats:{},wrong:[],starred:[],history:[],session:null});
function record(state,q,response){const correct=judge(q,response);const previous=state.stats[q.id]||{attempts:0,correct:0,misses:0};state.stats[q.id]={attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),misses:previous.misses+(correct?0:1),last:correct};state.wrong=state.wrong.filter(id=>id!==q.id);if(!correct)state.wrong.push(q.id);return correct;}
function finish(state,session){if(session.resultRecorded)return;const count=session.ids.length;const correct=Object.values(session.answers).filter(a=>a.correct).length;const score=Math.round(correct/count*100);const passed=correct/count>=0.8;const stars=score===100?3:score>=90?2:passed?1:0;const result={score,correct,count,passed,stars};session.result=result;session.done=true;session.resultRecorded=true;
if(session.mode==='stage'||session.mode==='boss'){const key=session.mode==='boss'?'boss':String(session.ch);const old=state.completed[key];if(!old||score>old.score)state.completed[key]={...result,date:new Date().toISOString()};}
state.history.unshift({title:session.title,mode:session.mode,...result,date:new Date().toISOString()});state.history=state.history.slice(0,60);return result;}
function unlocked(state,ch){return ch===1||!!state.completed[String(ch-1)]?.passed;}
function validateState(input,questions){
 const ids=new Set(questions.map(q=>q.id));const qmap=Object.fromEntries(questions.map(q=>[q.id,q]));
 const fail=()=>{throw new Error('备份结构不完整或与当前题库不匹配');};
 if(!input||input.schema!==1||!input.completed||!input.stats||!Array.isArray(input.wrong)||!Array.isArray(input.starred)||!Array.isArray(input.history))fail();
 const s=fresh();for(const k of ['wrong','starred']){if(input[k].some(id=>!ids.has(id)))fail();s[k]=[...new Set(input[k])];}
 for(const [id,v] of Object.entries(input.stats)){if(!ids.has(id)||!v||![v.attempts,v.correct,v.misses].every(n=>Number.isInteger(n)&&n>=0)||v.correct+v.misses!==v.attempts||typeof v.last!=='boolean')fail();s.stats[id]={attempts:v.attempts,correct:v.correct,misses:v.misses,last:v.last};}
 for(const [key,v] of Object.entries(input.completed)){if(!/^(?:[1-8]|boss)$/.test(key)||!v||!Number.isFinite(v.score)||v.score<0||v.score>100||typeof v.passed!=='boolean'||!Number.isInteger(v.stars)||v.stars<0||v.stars>3||v.passed!==(v.score>=80))fail();s.completed[key]={score:v.score,passed:v.passed,stars:v.stars,date:String(v.date||'')};}
 s.history=input.history.slice(0,60).map(v=>{if(!v||typeof v.title!=='string'||!Number.isFinite(v.score)||v.score<0||v.score>100||!Number.isInteger(v.count)||v.count<1||!Number.isInteger(v.correct)||v.correct<0||v.correct>v.count)fail();return {title:v.title.slice(0,100),mode:String(v.mode),score:v.score,count:v.count,correct:v.correct,passed:!!v.passed,stars:Number(v.stars)||0,date:String(v.date)};});
 if(input.session){const v=input.session;if(!Array.isArray(v.ids)||!v.ids.length||v.ids.length>questions.length||v.ids.some(id=>!ids.has(id))||new Set(v.ids).size!==v.ids.length||!v.orders||!v.answers||!Number.isInteger(v.cursor)||v.cursor<0||v.cursor>=v.ids.length||!['stage','boss','wrong','free','starred'].includes(v.mode))fail();
  for(const id of v.ids){const q=qmap[id];if(q.options){const o=v.orders[id];if(!Array.isArray(o)||o.length!==q.options.length||new Set(o).size!==o.length||o.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))fail();}}
  for(const [id,a] of Object.entries(v.answers)){if(!v.ids.includes(id)||!a||typeof a.correct!=='boolean'||(qmap[id].type==='definition'&&!validDefinition(qmap[id],a.response))||judge(qmap[id],a.response)!==a.correct)fail();}
  if(v.mode==='stage'&&(!Number.isInteger(v.ch)||v.ch<1||v.ch>8))fail();
  s.session={mode:v.mode,ch:v.ch,title:String(v.title).slice(0,100),ids:v.ids,orders:v.orders,cursor:v.cursor,answers:v.answers,done:!!v.done,resultRecorded:!!v.resultRecorded};
  if(v.definitionDraft){const d=v.definitionDraft,q=qmap[d.id];if(!q||q.type!=='definition'||d.id!==v.ids[v.cursor]||v.answers[d.id]||v.done||typeof d.text!=='string'||d.text.length>4000||typeof d.reviewing!=='boolean'||!Array.isArray(d.points)||d.points.length!==q.points.length||d.points.some(p=>typeof p!=='boolean')||(d.reviewing&&!d.text.trim())||(!d.reviewing&&d.points.some(Boolean)))fail();s.session.definitionDraft={id:d.id,text:d.text,reviewing:d.reviewing,points:[...d.points]};}
  if(v.done){if(Object.keys(v.answers).length!==v.ids.length)fail();s.session.resultRecorded=false;const dummy=fresh();finish(dummy,s.session);}
 }
 return s;
}
const api={shuffle,norm,judge,pick,fresh,record,finish,unlocked,validateState};root.WATER_ENGINE=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
