const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'docs','sound.js'),'utf8');
function setup({stored=null,unsupported=false,deferred=false,rejectResume=false,blockedStorage=false}={}){
 const stats={contexts:[],oscillators:[],saved:null},listeners={},windowListeners={};
 const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
 class AudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.destination={};stats.contexts.push(this);}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
  createOscillator(){const osc={frequency:parameter(),connect(){},disconnect(){},start(){this.started=true;},stop(at){if(at===undefined){this.stopped=true;this.onended?.();}}};stats.oscillators.push(osc);return osc;}
  resume(){if(rejectResume)return Promise.reject(Error('not allowed'));if(deferred)return new Promise(resolve=>{this.release=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
  suspend(){this.state='suspended';return Promise.resolve();}
 }
 const document={hidden:false,getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(event,fn){(listeners[event]??=[]).push(fn);}};
 const window={AudioContext:unsupported?undefined:AudioContext,addEventListener(event,fn){windowListeners[event]=fn;}};
 const localStorage={getItem(){if(blockedStorage)throw Error('denied');return stored;},setItem(key,value){if(blockedStorage)throw Error('denied');stats.saved=JSON.parse(value);}};
 const sandbox={window,document,localStorage,performance:{now:()=>1000}};
 vm.runInNewContext(source,sandbox);
 return {api:window.WATER_SOUND,document,stats,listeners,windowListeners};
}
(async()=>{
 let s=setup();assert.equal(s.stats.contexts.length,0,'No audio context on page load');assert.equal(await s.api.play('correct'),false,'Silent by default');
 await s.api.toggle();assert.equal(s.stats.saved.enabled,true);assert.ok(s.stats.oscillators.length>0,'Opt-in previews a cue');
 const start=s.stats.oscillators.length;
 assert.equal(await s.api.play('correct'),true);assert.ok(s.stats.oscillators.length>start);
 s.api.toggle();assert.ok(s.stats.oscillators.every(o=>o.stopped),'Mute immediately stops scheduled cues');assert.equal(await s.api.play('reward'),false);
 s=setup({stored:JSON.stringify({enabled:true,volume:35})});assert.equal(s.stats.contexts.length,0,'Restored preference must not autoplay');
 for(const cue of ['correct','incorrect','complete','reward','review'])assert.equal(await s.api.play(cue),true);
 assert.equal(await s.api.play('unknown'),false);
 s.api.setVolume(200);assert.equal(s.stats.saved.volume,100);s.api.setVolume(-5);assert.equal(s.stats.saved.volume,0);assert.equal(await s.api.play('complete'),false);
 s.api.setVolume(40);s.document.hidden=true;s.listeners.visibilitychange[0]();assert.ok(s.stats.oscillators.every(o=>o.stopped));assert.equal(await s.api.play('correct'),false,'Hidden tabs stay silent');
 s.document.hidden=false;assert.equal(await s.api.play('correct'),true);
 s.windowListeners.storage({key:'water-quest-sound-v1',newValue:JSON.stringify({enabled:false,volume:20})});assert.equal(await s.api.play('reward'),false,'Mute synchronizes across tabs');
 s=setup({stored:JSON.stringify({enabled:true,volume:35}),deferred:true});const pending=s.api.play('complete');s.api.toggle();s.stats.contexts[0].release();assert.equal(await pending,false);assert.equal(s.stats.oscillators.length,0,'Pending resume cannot sound after mute');
 s=setup({stored:JSON.stringify({enabled:true,volume:35}),rejectResume:true});assert.equal(await s.api.play('correct'),false,'Blocked audio cannot break the game');
 s=setup({unsupported:true});s.api.toggle();assert.equal(await s.api.play('tap'),false);assert.equal(s.stats.contexts.length,0);
 s=setup({blockedStorage:true});await s.api.toggle();assert.equal(await s.api.play('correct'),true,'Storage denial does not break sound controls');
 console.log('PASS: silent startup, opt-in cues, persistent settings, immediate mute, volume bounds, hidden tabs, cross-tab mute, canceled resume and unavailable audio/storage.');
})().catch(error=>{console.error(error);process.exitCode=1;});
