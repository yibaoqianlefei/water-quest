/* Exam-facing categories reuse the audited teacher outlines without changing old question IDs. */
(function(root){
'use strict';
const data=root.WATER_DATA||(typeof require==='function'?require('./bank.js'):null);
const homework=root.WATER_HOMEWORK_DATA||(typeof require==='function'?require('./homework-data.js'):null);
const numericFacts=new Set(['c1-13','c7-09','c7-10']);
const types={fill:'填空题',boolean:'判断题',single:'单选题',multi:'多选题',short:'简答题',number:'计算题'};
const typeOf=q=>q.type==='definition'?'short':q.type==='number'&&numericFacts.has(q.id)?'fill':q.type;
for(const q of homework.questions.filter(q=>q.group==='assigned'&&q.type==='short')){
 const id='short-'+q.id;if(data.questions.some(item=>item.id===id))continue;
 data.questions.push({id,ch:q.ch,type:'short',prompt:q.prompt,answer:q.points.join('\n'),points:[...q.points],explanation:q.tip,topic:'教师简答 '+q.number,tag:'老师提纲 · 要点自评',difficulty:'理解',source:homework.sourceFile+' · PDF 第 '+q.sourcePages.join('、')+' 页；'+q.evidence,homeworkId:q.id});
}
data.sources.items.push('考试题型入口按填空、判断、单选、多选、简答、计算组织；简答复用已核对的 24 道老师提纲题，并包含 32 道名词解释复习题。题型与题量用于练习，不代表试卷分值分配。');
const api={types,typeOf,questions:data.questions};root.WATER_EXAM=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
