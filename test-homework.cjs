const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const D=require('./docs/homework-data.js'),H=require('./docs/homework.js');
const C=require('./docs/coach.js'),E=require('./docs/engine.js'),bank=require('./docs/bank.js');
const questions=D.questions,assigned=questions.filter(q=>q.group==='assigned'),classroom=questions.filter(q=>q.group==='classroom');
assert.equal(questions.length,36);assert.equal(assigned.length,26);assert.equal(classroom.length,10);
assert.equal(new Set(questions.map(q=>q.id)).size,36);
assert.deepEqual(assigned.map(q=>Number(q.number)),Array.from({length:26},(_,i)=>i+1));
assert.equal(classroom.filter(q=>q.type==='boolean').length,3);
assert.equal(classroom.filter(q=>q.type==='single').length,7);
assert.equal(classroom.filter(q=>q.number==='52').length,1);
assert.equal(D.notice.start,'2026-11-11T12:20');assert.equal(C.DEFAULT_EXAM,D.notice.start);
for(const q of questions){
 assert.ok(q.prompt&&q.tip&&q.answerSource);
 assert.ok(q.points.length>=2&&q.points.every(p=>typeof p==='string'&&p.length>0));
 assert.ok(Number.isInteger(q.ch)&&q.ch>=1&&q.ch<=7);
 assert.ok(q.sourcePages.length&&q.sourcePages.every(p=>Number.isInteger(p)&&p>=1&&p<=11));
 assert.ok(Number.isInteger(q.complete)&&q.complete>=1&&q.complete<=34);
 if(q.options)assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);
}
const s=H.fresh();
assert.deepEqual(H.summary(s),{new:36,review:0,mastered:0});
assert.throws(()=>H.mark(s,'hw01','mastered'));
H.entry(s,'hw01').text='金属、塑料、复合管';
H.reveal(s,'hw01');H.mark(s,'hw01','mastered');
assert.equal(H.entry(s,'hw01').text,'金属、塑料、复合管');
assert.throws(()=>H.reveal(s,'class49'));
H.entry(s,'class49').choice=1;H.reveal(s,'class49');
assert.equal(s.answers.class49.status,'review');
H.entry(s,'class55').choice=1;H.reveal(s,'class55');
assert.equal(s.answers.class55.status,'mastered');
assert.deepEqual(H.summary(s),{new:33,review:1,mastered:2});
assert.deepEqual(H.validate(JSON.parse(JSON.stringify(s))),s);
assert.deepEqual(H.validate(undefined),H.fresh());
for(const bad of [null,[],{version:2,answers:{}},{version:1,answers:[]},
 {version:1,answers:{hw01:{text:'x'.repeat(4001),choice:null,revealed:false,status:'new'}}},
 {version:1,answers:{hw01:{text:'',choice:null,revealed:false,status:'mastered'}}},
 {version:1,answers:{class49:{text:'',choice:null,revealed:true,status:'review'}}},
 {version:1,answers:{class49:{text:'',choice:4,revealed:false,status:'new'}}},
 {version:1,answers:{hw01:{text:'',choice:0,revealed:false,status:'new'}}},
 {version:1,answers:{missing:{text:'',choice:null,revealed:false,status:'new'}}},
 JSON.parse('{"version":1,"answers":{"__proto__":{"text":"","choice":null,"revealed":false,"status":"new"}}}')
])assert.throws(()=>H.validate(bad));

// Old progress gains an empty homework collection, retaining the configured exam and quiz result.
const old=E.fresh();delete old.homework;old.sweet.exam='2026-11-11T12:00';
const q=bank.questions.find(q=>q.type==='single');E.record(old,q,q.answer);
const migrated=E.validateState(old,bank.questions);
assert.deepEqual(migrated.homework,H.fresh());assert.equal(migrated.sweet.exam,old.sweet.exam);
assert.deepEqual(migrated.stats,old.stats);assert.deepEqual(migrated.sweet,old.sweet);
migrated.homework=s;
const restored=E.validateState(JSON.parse(JSON.stringify(migrated)),bank.questions);
assert.deepEqual(restored,migrated);assert.deepEqual(restored.sweet,old.sweet);

const helpers={title:(a,b,c)=>`<h1>${b}</h1><p>${c}</p>`,materialLink:(id,p,label)=>`<a href="#read/${id}/${p}">${label}</a>`,chapters:bank.chapters};
let saves=0,renders=0;
const context={state:restored,save:()=>saves++,render:()=>renders++,goto:()=>{},toast:()=>{}};
assert.equal(H.route('#homework'),true);assert.equal(H.hash(),'#homework');
assert.equal(H.route('#homework/missing'),false);
assert.equal(H.matches(restored.homework).length,26);
assert.ok(H.view(restored,helpers).includes('将倒计时同步为 12:20'));
H.action('hw-exam',undefined,context);assert.equal(restored.sweet.exam,D.notice.start);assert.equal(saves,1);
assert.ok(!H.view(restored,helpers).includes('将倒计时同步为 12:20'));
assert.equal(H.action('nav','bank',context),false);
H.action('hw-group','classroom',context);assert.equal(H.matches(restored.homework).length,10);
H.change({target:{id:'hw-status',value:'review'}},context.render);
assert.deepEqual(H.matches(restored.homework).map(q=>q.id),['class49']);
H.action('hw-open','class49',context);assert.equal(H.hash(),'#homework/class49');
let html=H.view(restored,helpers);assert.ok(html.includes('参考答案：A'));assert.ok(html.includes('href="#read/complete/29"'));
H.action('hw-list',undefined,context);H.action('hw-group','assigned',context);
H.change({target:{id:'hw-chapter',value:'5'}},context.render);
assert.deepEqual(H.matches(restored.homework).map(q=>q.number),['18','19','20']);
H.action('hw-open','hw18',context);H.action('hw-step','1',context);assert.equal(H.hash(),'#homework/hw19');
assert.equal(H.route('#homework/hw01'),true);
H.input({target:{id:'hw-draft',value:'<img src=x onerror=alert(1)>'}},restored,context.save,bank.chapters);
html=H.view(restored,helpers);assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html.includes('<img src=x'));
assert.equal(H.validate(restored.homework).answers.hw01.text,'<img src=x onerror=alert(1)>');
// Script dependency order and all new site assets are usable without a build step.
const index=fs.readFileSync(path.join(__dirname,'docs/index.html'),'utf8');
const scripts=[...index.matchAll(/<script src="([^?"]+)/g)].map(m=>m[1]);
for(const file of scripts)assert.ok(fs.existsSync(path.join(__dirname,'docs',file)));
assert.ok(scripts.indexOf('homework-data.js')<scripts.indexOf('homework.js'));
assert.ok(scripts.indexOf('homework.js')<scripts.indexOf('engine.js'));
assert.ok(scripts.indexOf('engine.js')<scripts.indexOf('app.js'));
console.log('PASS: 36 sourced homework questions; answer checks, self-assessment, filters, routes, legacy migration, backup, safe drafts and exam sync.');
