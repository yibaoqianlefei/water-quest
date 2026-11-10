(function(root){
'use strict';
const DAY=86400000,ZONE=8*3600000,DEFAULT_EXAM='2026-11-11T12:20';
const rewards=[
 {id:'praise',cost:5,title:'小小夸夸卡',icon:'♡',message:'今天认真复习的你，又向目标靠近了一点。每一道弄懂的题，都值得给自己一个赞。'},
 {id:'rest',cost:10,title:'甜蜜休息卡',icon:'☕',message:'给自己 5 分钟小休息：喝点水，伸个懒腰。休息好，再回来和小水滴一起闯关。'},
 {id:'wish',cost:20,title:'考后心愿卡',icon:'✦',message:'考完以后，和对方商量一件你们都喜欢的小事。把这个甜蜜心愿留给努力后的自己。'},
 {id:'hug',cost:6,title:'充电抱抱券',icon:'🫂',category:'日常陪伴',time:'1 分钟',budget:'不花钱',message:'放下手里的事，给彼此一个安心的拥抱。异地时也可以换成一句语音鼓励。'},
 {id:'walk',cost:12,title:'牵手散步券',icon:'🌷',category:'日常陪伴',time:'15 分钟',budget:'不花钱',message:'一起在校园或附近走一小圈，分享今天的一件小事。考前短暂放松，回来继续复习。'},
 {id:'tea',cost:15,title:'奶茶宠爱券',icon:'🧋',category:'甜甜投喂',time:'课间或考后',budget:'建议 20 元内',message:'一杯你喜欢的奶茶、咖啡或热饮，口味由你选。先一起定预算，再由约定的一方安排。'},
 {id:'snack',cost:12,title:'甜品补给券',icon:'🍰',category:'甜甜投喂',time:'课间或考后',budget:'建议 15 元内',message:'挑一份小点心，给认真学习的自己补充好心情。可以一起分享，也可以留作考后的小奖励。'},
 {id:'massage',cost:15,title:'肩颈放松券',icon:'🌿',category:'日常陪伴',time:'5 分钟',budget:'不花钱',message:'双方愿意时，轻轻揉揉肩膀，放松久坐的疲惫。力度由接受的一方决定，不舒服就停。'},
 {id:'movie',cost:25,title:'电影你来选券',icon:'🎬',category:'考后约会',time:'考后一个晚上',budget:'在家看也很好',message:'考完挑一部你想看的电影，一起留出完整的观影时间。准备一点零食，手机暂时放一边。'},
 {id:'letter',cost:18,title:'专属小情书券',icon:'💌',category:'心意与惊喜',time:'约好一个日子',budget:'不花钱',message:'写下最近欣赏对方的三件具体小事，再加一句想说的话。手写、文字或语音都可以。'},
 {id:'breakfast',cost:20,title:'爱心早餐券',icon:'🥪',category:'甜甜投喂',time:'约好的早晨',budget:'建议 20 元内',message:'约好一个不用赶时间的早晨，准备一份对方喜欢的早餐。自己做或顺路带都算心意。'},
 {id:'date',cost:35,title:'惊喜约会券',icon:'🎡',category:'考后约会',time:'考后半天',budget:'先商量预算',message:'一起定好时间与预算，由一方安排路线，另一方带着期待出发。公园野餐、校园拍照、城市散步都可以。'}
];
const rewardMeta={praise:['心意与惊喜','随时','不花钱'],rest:['日常陪伴','5 分钟','不花钱'],wish:['考后约会','考后商量','先商量预算']};
for(const r of rewards){if(rewardMeta[r.id])[r.category,r.time,r.budget]=rewardMeta[r.id];}
const dayKey=(now=Date.now())=>new Date(now+ZONE).toISOString().slice(0,10);
function examTime(local){if(typeof local!=='string'||!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error('请填写完整的考试日期和时间');const time=Date.parse(local+':00+08:00');if(!Number.isFinite(time)||new Date(time+ZONE).toISOString().slice(0,16)!==local)throw Error('考试日期或时间无效');return time;}
const emptyDay=date=>({date,seen:[],credited:[],repaired:[],streak:0,streakBonus:false,goalBonus:false});
const fresh=(now=Date.now())=>({version:1,exam:DEFAULT_EXAM,hearts:0,day:emptyDay(dayKey(now)),debt:{},rewards:[],receipt:null,refund:null});
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
function redeem(s,id,now=Date.now()){const reward=rewards.find(r=>r.id===id);if(!reward)throw Error('未找到奖励卡');if(s.hearts<reward.cost)throw Error('心心还不够，再学几道就更接近啦');if(s.rewards.length>=10000)throw Error('卡包已达 10000 张，请先导出备份');let seq=0,uid;do{uid='coupon-'+now+'-'+seq++;}while(s.rewards.some(r=>r.uid===uid));s.hearts-=reward.cost;s.rewards.unshift({id,at:now,uid,usedAt:null,cost:reward.cost});return reward;}
function setRewardUsed(s,uid,used,now=Date.now()){const r=s.rewards.find(r=>r.uid===uid);if(!r)throw Error('未找到这张奖励卡');if(typeof used!=='boolean'||!Number.isFinite(now)||now<0)throw Error('奖励状态无效');if(used&&r.usedAt==null)r.usedAt=Math.max(now,r.at);if(!used)r.usedAt=null;return r;}
function validateRefund(r){if(r==null)return null;if(r.version!==1||!Number.isSafeInteger(r.amount)||r.amount<1||r.amount>1000000||!Number.isInteger(r.count)||r.count<1||r.count>10000||!Number.isFinite(r.at)||r.at<0||r.at>8640000000000000)throw Error('积分返还记录无效');return {version:1,amount:r.amount,count:r.count,at:r.at};}
function refundPreview(s){return {count:s.rewards.length,amount:s.rewards.reduce((n,r)=>n+(r.cost??rewards.find(x=>x.id===r.id).cost),0)};}
function refundOnce(s,now=Date.now()){if(s.refund)throw Error('这次积分返还已领取，仅限一次');const p=refundPreview(s);if(!p.amount)throw Error('暂无可返还的兑换积分');if(s.hearts+p.amount>1000000)throw Error('积分余额已达上限，暂时无法返还');const receipt=validateRefund({version:1,...p,at:now});s.hearts+=receipt.amount;s.refund=receipt;return receipt;}
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
 examTime(input.exam);const s=fresh(now);s.exam=input.exam;s.hearts=input.hearts;s.refund=validateRefund(input.refund);
 const d=input.day;if(!/^20\d{2}-\d{2}-\d{2}$/.test(d.date)||!validInt(d.streak)||typeof d.streakBonus!=='boolean'||typeof d.goalBonus!=='boolean')fail();
 for(const key of ['seen','credited','repaired'])if(!Array.isArray(d[key])||d[key].some(id=>!ids.has(id)))fail();
 s.day={date:d.date,seen:[...new Set(d.seen)],credited:[...new Set(d.credited)],repaired:[...new Set(d.repaired)],streak:d.streak,streakBonus:d.streakBonus,goalBonus:d.goalBonus};
 for(const [id,v] of Object.entries(input.debt)){if(!ids.has(id)||!v||typeof v.reviewed!=='boolean'||typeof v.note!=='string'||v.note.length>300||(v.reviewed&&v.note.replace(/\s/g,'').length<6)||typeof v.date!=='string')fail();s.debt[id]={reviewed:v.reviewed,note:v.note,date:v.date.slice(0,10)};}
 if(input.rewards.length>10000)fail();const uids=new Set();
 s.rewards=input.rewards.map((r,i)=>{if(!r||!rewards.some(x=>x.id===r.id)||!Number.isFinite(r.at)||r.at<0||r.at>8640000000000000)fail();const uid=r.uid===undefined?'legacy-'+i+'-'+r.at:r.uid;if(typeof uid!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(uid)||uids.has(uid))fail();uids.add(uid);const usedAt=r.usedAt??null;if(usedAt!==null&&(!Number.isFinite(usedAt)||usedAt<r.at||usedAt>8640000000000000))fail();const cost=r.cost??rewards.find(x=>x.id===r.id).cost;if(!Number.isSafeInteger(cost)||cost<1||cost>1000000)fail();return {id:r.id,at:r.at,uid,usedAt,cost};});
 if(input.receipt){const r=input.receipt;if(!ids.has(r.id)||!Number.isFinite(r.delta)||typeof r.text!=='string'||r.text.length>600||!Number.isFinite(r.at))fail();s.receipt={id:r.id,delta:r.delta,text:r.text,at:r.at};}
 today(s,now);return s;
}
const api={DEFAULT_EXAM,rewards,dayKey,examTime,fresh,today,record,review,needsReview,redeem,setRewardUsed,validateRefund,refundPreview,refundOnce,countdown,plan,validate};root.SWEET_COACH=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
