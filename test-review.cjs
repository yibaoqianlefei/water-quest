const assert=require('node:assert/strict');
require('./docs/coach.js');require('./docs/homework-data.js');require('./docs/homework.js');require('./docs/bank.js');
const E=require('./docs/engine.js'),Q=require('./docs/exam-data.js').questions;
const clone=x=>JSON.parse(JSON.stringify(x));
const s=E.fresh();
assert.deepEqual(E.reviewQuestions(s,Q,1),[]);
for(const q of Q.filter(q=>q.ch===1))E.record(s,q,E.isWritten(q)?{text:q.answer,points:q.points.map(()=>true)}:q.type==='fill'?q.answer[0]:q.answer);
assert.equal(E.canReview(s,1),false,'mastery alone does not mean a stage was passed');
s.completed['1']={passed:false,score:75,stars:0};
assert.deepEqual(E.reviewQuestions(s,Q,1),[]);
const counts=[26,25,25,27,25,25,25,22];
for(let ch=1;ch<=8;ch++){
 s.completed[ch]={passed:true,score:83,stars:1,date:'2026-11-09'};
 const list=E.reviewQuestions(s,Q,ch);
 assert.equal(list.length,counts[ch-1]);
 assert.deepEqual(list.map(q=>q.id),Q.filter(q=>q.ch===ch).map(q=>q.id));
 assert.ok(list.some(q=>q.type==='definition'));
}
for(const ch of [0,9,'1',null,1.5])assert.deepEqual(E.reviewQuestions(s,Q,ch),[]);
const list=E.reviewQuestions(s,Q,1);
const session={mode:'review',ch:1,title:'第一关全部题目',ids:list.map(q=>q.id),orders:Object.fromEntries(list.filter(q=>q.options).map(q=>[q.id,q.options.map((_,i)=>i)])),cursor:0,answers:{},done:false,resultRecorded:false};
s.session=session;
assert.deepEqual(E.validateState(clone(s),Q).session,session);
const written=list.find(q=>E.isWritten(q));session.cursor=session.ids.indexOf(written.id);
session.definitionDraft={id:written.id,text:'复习草稿',reviewing:false,points:written.points.map(()=>false)};
assert.deepEqual(E.validateState(clone(s),Q).session.definitionDraft,session.definitionDraft);
delete session.definitionDraft;
const foreign=Q.find(q=>q.ch===2&&!q.options);
const bad=clone(s);bad.session.ids.push(foreign.id);assert.throws(()=>E.validateState(bad,Q));
const locked=clone(s);delete locked.completed['1'];assert.throws(()=>E.validateState(locked,Q));
const before=clone(s.completed);
for(const q of list){const response=E.isWritten(q)?{text:q.answer,points:q.points.map(()=>true)}:q.type==='fill'?q.answer[0]:q.answer;session.answers[q.id]={response,correct:E.record(s,q,response)};}
E.finish(s,session);
assert.equal(session.result.count,26);assert.equal(session.result.score,100);
assert.deepEqual(s.completed,before,'review never overwrites stage stars or best scores');
assert.equal(s.history[0].mode,'review');assert.equal(E.validateState(clone(s),Q).session.result.count,26);
const n=s.history.length;E.finish(s,session);assert.equal(s.history.length,n);
console.log('PASS: all 200 chapter questions, passed-stage gating, review backups/drafts, invalid chapter rejection and preserved stage scores.');
