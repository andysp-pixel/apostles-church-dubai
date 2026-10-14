(function(global){
  'use strict';
  const services={sunday:{day:0,start:20,end:23,label:'Sunday gathering',byday:'SU'},thursday:{day:4,start:20,end:23,label:'Thursday gathering',byday:'TH'},saturday:{day:6,start:3,end:6,label:'Saturday gathering',byday:'SA'}};
  function next(key,now=new Date()){
    const s=services[key];if(!s)return null;
    const local=new Date(now.getTime()+4*3600000);const delta=(s.day-local.getUTCDay()+7)%7;
    let start=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()+delta,s.start-4,0,0));
    if(start.getTime()<=now.getTime())start=new Date(start.getTime()+7*86400000);
    return{key,...s,start,endDate:new Date(start.getTime()+(s.end-s.start)*3600000)};
  }
  function earliest(now=new Date()){return Object.keys(services).map(k=>next(k,now)).sort((a,b)=>a.start-b.start)[0];}
  function stamp(date){const d=new Date(date.getTime()+4*3600000);return d.toISOString().replace(/[-:]/g,'').slice(0,15);}
  function calendar(key,now=new Date()){
    const s=next(key,now);if(!s)return'';
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Apostles Church Dubai//Weekly Gatherings//EN','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:Asia/Dubai','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0400','TZOFFSETTO:+0400','TZNAME:GST','END:STANDARD','END:VTIMEZONE','BEGIN:VEVENT','UID:'+key+'-gathering@apostles-church-dubai','DTSTAMP:'+now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART;TZID=Asia/Dubai:'+stamp(s.start),'DTEND;TZID=Asia/Dubai:'+stamp(s.endDate),'RRULE:FREQ=WEEKLY;BYDAY='+s.byday,'SUMMARY:Apostles Church of Christ Dubai - '+s.label,'DESCRIPTION:Weekly church gathering. All times are Dubai time (GST).','LOCATION:Hall 601\\, 6th Floor\\, Bank Melliran Building\\, Al Mankhool\\, Bur Dubai','END:VEVENT','END:VCALENDAR',''].join('\r\n');
  }
  global.ChurchSchedule={services,next,earliest,calendar};
})(window);
