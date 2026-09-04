(function(root){
  'use strict';
  const clock=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Hobart',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function local(now=new Date()){
    const p=Object.fromEntries(clock.formatToParts(now).map(x=>[x.type,x.value]));
    return {date:`${p.year}-${p.month}-${p.day}`,minutes:Number(p.hour)*60+Number(p.minute)};
  }
  function dates(now=new Date()){
    const today=local(now).date,result=[];
    for(let i=0;i<60;i++){
      const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);
      const value=d.toISOString().slice(0,10);
      if(d.getUTCDay()!==1 && (i!==0 || local(now).minutes<19*60+45))result.push(value);
    }
    return result;
  }
  function times(date,now=new Date()){
    if(!dates(now).includes(date))return [];
    const current=local(now),result=[];
    for(let m=540;m<1200;m+=15){
      if(date===current.date&&m<=current.minutes)continue;
      result.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
    }
    return result;
  }
  const api={local,dates,times,valid:(date,time,now=new Date())=>times(date,now).includes(time)};
  if(typeof module!=='undefined')module.exports=api;
  else root.southBookingAvailability=api;
})(typeof window!=='undefined'?window:globalThis);
