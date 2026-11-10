const assert=require('node:assert/strict'),C=require('./docs/coach.js'),E=require('./docs/engine.js'),Q=require('./docs/bank.js').questions,R=require('./docs/refund-store.js');
const now=Date.parse('2026-11-10T16:00:00+08:00'),copy=x=>JSON.parse(JSON.stringify(x)),key='test-progress';
function setup(){const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};const store=R.create({storage,engine:E,questions:Q,key});const state=E.fresh();state.sweet.hearts=50;state.sweet.rewards=Array.from({length:14},(_,i)=>({id:['praise','rest','wish'][i%3],at:now-100}));storage.setItem(key,JSON.stringify(state));return {map,storage,store,state};}
const x=setup(),old=copy(x.state);assert.deepEqual(C.refundPreview(x.state.sweet),{count:14,amount:155});
const refunded=x.store.claim(x.state,now);assert.equal(refunded.sweet.hearts,205);assert.equal(refunded.sweet.rewards.length,14);assert.equal(refunded.sweet.refund.amount,155);assert.equal(refunded.sweet.refund.count,14);
assert.deepEqual(refunded.stats,old.stats);assert.deepEqual(refunded.completed,old.completed);
assert.throws(()=>x.store.claim(old,now+1));assert.equal(JSON.parse(x.storage.getItem(key)).sweet.hearts,205);
const other=R.create({storage:x.storage,engine:E,questions:Q,key});assert.throws(()=>other.claim(old,now+2),'another tab with stale state cannot claim');
const imported=x.store.retain(E.validateState(old,Q));assert.equal(imported.sweet.refund.amount,155);assert.equal(imported.sweet.hearts,50,'old backup import never silently credits again');x.storage.setItem(key,JSON.stringify(imported));assert.throws(()=>other.claim(imported,now+3));
const cleared=x.store.retain(E.fresh());assert.equal(cleared.sweet.refund.amount,155);x.storage.setItem(key,JSON.stringify(cleared));assert.throws(()=>x.store.claim(cleared));
const y=setup();y.storage.setItem=(k,v)=>{if(k===key)throw Error('quota');y.map.set(k,v);};assert.throws(()=>y.store.claim(y.state,now));assert.equal(y.map.get(y.store.markerKey),undefined);assert.equal(y.state.sweet.hearts,50);
const z=setup();z.storage.setItem=(k,v)=>{if(k===z.store.markerKey)throw Error('quota');z.map.set(k,v);};assert.equal(z.store.claim(z.state,now).sweet.hearts,205);assert.ok(JSON.parse(z.map.get(key)).sweet.refund);assert.throws(()=>z.store.claim(z.state,now+4));
const empty=C.fresh();assert.throws(()=>C.refundOnce(empty,now));assert.equal(empty.refund,null);
const s=C.fresh();s.hearts=100;C.redeem(s,'tea',now-1);C.setRewardUsed(s,s.rewards[0].uid,true,now);const used=copy(s.rewards);assert.equal(C.refundOnce(s,now).amount,15);assert.deepEqual(s.rewards,used);assert.equal(s.hearts,100);C.redeem(s,'hug',now+1);assert.throws(()=>C.refundOnce(s,now+2));assert.equal(s.hearts,94);
assert.deepEqual(C.validate(copy(s),Q).refund,s.refund);assert.throws(()=>C.validate({...s,refund:{...s.refund,amount:-1}},Q));
const paid=C.validate({...C.fresh(),rewards:[{id:'tea',at:now,cost:9}]},Q);assert.equal(C.refundOnce(paid,now).amount,9,'refund uses cost at redemption');
console.log('PASS: exact legacy refund, single claim, stale tabs, old imports/reset, write failure atomicity, used cards preserved, cost snapshots and no future refunds.');
