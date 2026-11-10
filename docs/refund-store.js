(function(root){
'use strict';
// A separate marker survives ordinary progress reset and imports of older backups.
// The progress write is the atomic commit: it contains both balance and receipt.
function create({storage,engine,questions,key}){
 const C=root.SWEET_COACH,markerKey=key+'-refund-once-v1';
 function readMarker(){const raw=storage.getItem(markerKey);return raw?C.validateRefund(JSON.parse(raw)):null;}
 function saved(){const raw=storage.getItem(key);return raw?engine.validateState(JSON.parse(raw),questions):null;}
 function retain(state){const receipt=readMarker()||C.validateRefund(saved()?.sweet.refund)||C.validateRefund(state.sweet.refund);if(receipt){storage.setItem(markerKey,JSON.stringify(receipt));state.sweet.refund=receipt;C.cancelRefundedRewards(state.sweet);}return state;}
 function claim(current,now=Date.now()){
  const next=retain(saved()||engine.validateState(JSON.parse(JSON.stringify(current)),questions));
  const receipt=C.refundOnce(next.sweet,now);
  storage.setItem(key,JSON.stringify(next));
  // A failed secondary write cannot invalidate an already committed credit.
  try{storage.setItem(markerKey,JSON.stringify(receipt));}catch(e){}
  return next;
 }
 return {retain,claim,markerKey};
}
const api={create};root.WATER_REFUND_STORE=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
