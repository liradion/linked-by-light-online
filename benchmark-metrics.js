'use strict';
// Available only when an explicit long random token is configured by the
// local load-test runner. Disabled completely in ordinary/Render production.
const {performance,monitorEventLoopDelay}=require('node:perf_hooks');
function quantile(values,p){
 if(!values.length)return 0;
 const sorted=values.slice().sort((a,b)=>a-b);
 return Number(sorted[Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1)].toFixed(3));
}
function createBenchmarkMetrics(){
 const token=process.env.LL_BENCH_TOKEN||'';
 const enabled=token.length>=24;
 if(!enabled)return {enabled:false,observeTick(){},snapshotSkipped(){},respond(){return false;}};
 const lag=monitorEventLoopDelay({resolution:20});lag.enable();
 let cpu,started,tickLast=0,loopWork=[],tickGap=[],skipped=0,frames=0;
 const reset=()=>{
  started=performance.now();cpu=process.cpuUsage();
  tickLast=0;loopWork=[];tickGap=[];skipped=0;frames=0;lag.reset();
 };
 reset();
 const authorized=req=>{
  const addr=req.socket.remoteAddress;
  return (addr==='127.0.0.1'||addr==='::1'||addr==='::ffff:127.0.0.1')
   &&req.headers['x-bench-token']===token;
 };
 function observeTick(start,end,sent){
  if(tickLast)tickGap.push(start-tickLast);
  tickLast=start;loopWork.push(end-start);frames+=sent;
  if(loopWork.length>8000)loopWork.shift();
  if(tickGap.length>8000)tickGap.shift();
 }
 function report(roomMap){
  const elapsedMs=Math.max(1,performance.now()-started),c=process.cpuUsage(cpu),mem=process.memoryUsage();
  let activePlayers=0,activeSpectators=0,playingRooms=0;
  for(const r of roomMap.values()){
   const online=r.seats?.filter(s=>s?.online).length||0;
   activePlayers+=online;activeSpectators+=r.spectators?.size||0;
   if(online===2&&r.game?.phase==='playing')playingRooms++;
  }
  return {
   elapsedSec:Number((elapsedMs/1000).toFixed(2)),
   cpuCorePct:Number((((c.user+c.system)/1000)/elapsedMs*100).toFixed(1)),
   rssMB:Number((mem.rss/1048576).toFixed(2)),
   heapUsedMB:Number((mem.heapUsed/1048576).toFixed(2)),
   eventLoopDelayP95Ms:Number((lag.percentile(95)/1e6).toFixed(2)),
   eventLoopDelayP99Ms:Number((lag.percentile(99)/1e6).toFixed(2)),
   tickGapP95Ms:quantile(tickGap,.95),
   tickWorkP95Ms:quantile(loopWork,.95),
   tickWorkP99Ms:quantile(loopWork,.99),
   broadcastFrames:frames,skippedSnapshots:skipped,
   rooms:roomMap.size,playingRooms,activePlayers,activeSpectators
  };
 }
 function respond(req,res,rooms){
  if(!new URL(req.url,'http://localhost').pathname.startsWith('/__bench'))return false;
  if(!authorized(req)){res.writeHead(404);res.end('Not found');return true;}
  const query=new URL(req.url,'http://localhost').searchParams;
  if(query.get('reset')==='1')reset();
  const result=report(rooms);
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(result));return true;
 }
 return {enabled,observeTick,snapshotSkipped(){skipped++},respond};
}
module.exports={createBenchmarkMetrics,quantile};
