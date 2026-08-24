function score(t, words){t=t.toLowerCase();return words.reduce((s,w)=>s+(t.includes(w)?1:0),0)}
function advancedAnalyze(text){
 const rules=[['Fee Issue','Finance Office',['fee','challan','payment','dues','voucher','scholarship']],['Academic Issue','Academic Department',['class','teacher','exam','marks','course','attendance','result','assignment']],['Administration Issue','Administration Office',['office','admin','staff','document','certificate','transcript','registration']]];
 let best={cat:'Other',dept:'Student Affairs',score:0}; rules.forEach(r=>{let sc=score(text,r[2]); if(sc>best.score)best={cat:r[0],dept:r[1],score:sc}});
 let neg=score(text,['bad','angry','problem','delay','not','unfair','loss','failed','urgent','ignored','incomplete','harassment','unsafe']);
 let pos=score(text,['good','resolved','helpful','thanks','better','quick','happy','proper']);
 let toxic=score(text,['hate','abuse','threat','harassment','kill','fight','insult']);
 let fake=score(text,['rumor','i heard','maybe','everyone knows','always','never ever']);
 let sentiment=neg>pos?'Negative':pos>neg?'Positive':'Neutral';
 let priority=(sentiment==='Negative'&&(neg>=2||toxic>0||text.toLowerCase().includes('urgent')))?'High':(sentiment==='Positive'?'Low':'Medium');
 let expected=priority==='High'?'24-48 hours':priority==='Medium'?'3-5 working days':'5-7 working days';
 return {sentiment,detected_category:best.cat,recommended_department:best.dept,priority,ai_confidence:Math.min(98,70+Math.max(best.score,neg,pos)*6),expected_resolution_time:expected,ai_recommendation:`Route to ${best.dept}. Review evidence and respond within ${expected}.`,ai_emotion:toxic>0?'Anger':(sentiment==='Positive'?'Satisfaction':'Neutral'),toxicity_score:Math.min(100,toxic*25),fake_probability:Math.min(100,fake*20),ai_source:'Local Advanced NLP'};
}
module.exports={advancedAnalyze};
