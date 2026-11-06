(function(root){
'use strict';
const DAY=86400000,ZONE=8*3600000,DEFAULT_EXAM='2026-11-11T12:00';
const rewards=[
 {id:'praise',cost:5,title:'小小夸夸卡',icon:'♡',message:'今天认真复习的你，又向目标靠近了一点。每一道弄懂的题，都值得给自己一个赞。'},
 {id:'rest',cost:10,title:'甜蜜休息卡',icon:'☕',message:'给自己 5 分钟小休息：喝点水，伸个懒腰。休息好，再回来和小水滴一起闯关。'},
 {id:'wish',cost:20,title:'考后心愿卡',icon:'✦',message:'考完以后，和对方商量一件你们都喜欢的小事。把这个甜蜜心愿留给努力后的自己。'}
];
const dayKey=(now=Date.now())=>new Date(now+ZONE).toISOString().slice(0,10);
function examTime(local){if(typeof local!=='string'||!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error('请填写完整的考试日期和时间');const time=Date.parse(local+':00+08:00');if(!Number.isFinite(time)||new Date(time+ZONE).toISOString().slice(0,16)!==local)throw Error('考试日期或时间无效');return time;}
const emptyDay=date=>({date,seen:[],credited:[],repaired:[],streak:0,streakBonus:false,goalBonus:false});
const fresh=(now=Date.now())=>({version:1,exam:DEFAULT_EXAM,hearts:0,day:emptyDay(dayKey(now)),debt:{},rewards:[],receipt:null});
function today(s,now=Date.now()){const key=dayKey(now);if(s.day.date!==key)s.day=emptyDay(key);return s.day;}
function record(s,id,correct,now=Date.now()){
 const d=today(s,now),before=s.hearts,notes=[];if(!d.seen.includes(id))d.seen.push(id);
 if(correct){
  if(!d.credited.includes(id)){d.credited.push(id);s.hearts++;d.streak++;notes.push('今天首次答对这题，+1 颗心心');}else notes.push('这题今天已获答对奖励，继续巩固也很棒');
  if(s.debt[id]){delete s.debt[id];if(!d.repaired.includes(id)){d.repaired.push(id);s.hearts++;notes.push('错题修复成功，额外 +1 颗心心');}}
  if(d.streak>=3&&!d.streakBonus){d.streakBonus=true;s.hearts+=2;notes.push('三连对达成，额外 +2 颗心心');}
 }else{d.streak=0;s.hearts=Math.max(0,s.hearts-1);s.debt[id]={reviewed:false,note:'',date:dayKey(now)};notes.push(before>0?'小惩戒：扣 1 颗心心，先写一句易错提醒':'心心最低为 0；这题先写一句易错提醒');}
 if(d.seen.length>=12&&!d.goalBonus){d.goalBonus=true;s.hearts+=3;notes.push('今日 12 题目标完成，额外 +3 颗心心');}
 s.receipt={id,delta:s.hearts-before,text:notes.join('；'),at:now};return s.receipt;
}
function review(s,id,note){if(!s.debt[id])return;const value=String(note).trim();if(value.replace(/\s/g,'').length<6||value.length>300)throw Error('请用至少 6 个字写下易错点，最多 300 字');s.debt[id].note=value;s.debt[id].reviewed=true;}
const needsReview=(s,id)=>!!s.debt[id]&&!s.debt[id].reviewed;
function redeem(s,id,now=Date.now()){const reward=rewards.find(r=>r.id===id);if(!reward)throw Error('未找到奖励卡');if(s.hearts<reward.cost)throw Error('心心还不够，再学几道就更接近啦');s.hearts-=reward.cost;s.rewards.unshift({id,at:now});s.rewards=s.rewards.slice(0,20);return reward;}
function countdown(s,now=Date.now()){const diff=examTime(s.exam)-now;if(diff<=0)return {arrived:true,days:0,hours:0,minutes:0};const minutes=Math.ceil(diff/60000);return {arrived:false,days:Math.floor(minutes/1440),hours:Math.floor(minutes%1440/60),minutes:minutes%60};}
function plan(s,now=Date.now()){
 const end=Date.parse(s.exam.slice(0,10)+'T00:00:00+08:00'),todayKey=dayKey(now);
 const entries=[
  ['管材器材 + 建筑给水','先看精简版第 1—2 页，再练第 1—2 章；记清阀门、水封与给水方式。',1],
  ['建筑消防 + 排水中水','复习精简版第 3—4 页；梳理消火栓、自动喷水、通气和中水。',3],
  ['生活热水 + 高层建筑','复习精简版第 5—6 页；对照第一/第二循环、竖向分区等易混概念。',5],
  ['水景泳池 + 公式计算','复习精简版第 7—8 页；手算用水量、流量和水头，检查单位。',7],
  ['混合自测 + 错题回访','做一轮混合题；再看精简版第 9—10 页，口述名词解释，修复错题。',0],
  ['考前轻回顾','只回看公式、数字、名词解释和易错提醒；提前准备文具，按考试安排出发。',0]
 ];
 return entries.map((entry,index)=>{const date=dayKey(end-(5-index)*DAY);return {date,title:entry[0],detail:entry[1],chapter:entry[2],today:date===todayKey,past:date<todayKey};});
}
function validate(input,questions,now=Date.now()){
 if(input===undefined||input===null)return fresh(now);const fail=()=>{throw Error('甜蜜奖励记录不完整，请检查备份文件');};
 const ids=new Set(questions.map(q=>q.id)),validInt=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
 if(!input||input.version!==1||!validInt(input.hearts)||!input.day||!input.debt||Array.isArray(input.debt)||!Array.isArray(input.rewards))fail();
 examTime(input.exam);const s=fresh(now);s.exam=input.exam;s.hearts=input.hearts;
 const d=input.day;if(!/^20\d{2}-\d{2}-\d{2}$/.test(d.date)||!validInt(d.streak)||typeof d.streakBonus!=='boolean'||typeof d.goalBonus!=='boolean')fail();
 for(const key of ['seen','credited','repaired'])if(!Array.isArray(d[key])||d[key].some(id=>!ids.has(id)))fail();
 s.day={date:d.date,seen:[...new Set(d.seen)],credited:[...new Set(d.credited)],repaired:[...new Set(d.repaired)],streak:d.streak,streakBonus:d.streakBonus,goalBonus:d.goalBonus};
 for(const [id,v] of Object.entries(input.debt)){if(!ids.has(id)||!v||typeof v.reviewed!=='boolean'||typeof v.note!=='string'||v.note.length>300||(v.reviewed&&v.note.replace(/\s/g,'').length<6)||typeof v.date!=='string')fail();s.debt[id]={reviewed:v.reviewed,note:v.note,date:v.date.slice(0,10)};}
 s.rewards=input.rewards.slice(0,20).map(r=>{if(!r||!rewards.some(x=>x.id===r.id)||!Number.isFinite(r.at))fail();return {id:r.id,at:r.at};});
 if(input.receipt){const r=input.receipt;if(!ids.has(r.id)||!Number.isFinite(r.delta)||typeof r.text!=='string'||r.text.length>600||!Number.isFinite(r.at))fail();s.receipt={id:r.id,delta:r.delta,text:r.text,at:r.at};}
 today(s,now);return s;
}
const api={DEFAULT_EXAM,rewards,dayKey,examTime,fresh,today,record,review,needsReview,redeem,countdown,plan,validate};root.SWEET_COACH=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
