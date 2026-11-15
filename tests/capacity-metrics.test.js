'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createBenchmarkMetrics,quantile}=require('../benchmark-metrics');
test('capacity instrumentation is disabled when secret is absent',()=>{
 const old=process.env.LL_BENCH_TOKEN;delete process.env.LL_BENCH_TOKEN;
 try{
  const b=createBenchmarkMetrics();assert.equal(b.enabled,false);
  assert.equal(b.respond({url:'/__bench',socket:{remoteAddress:'127.0.0.1'},headers:{}},{},new Map()),false);
 }finally{if(old===undefined)delete process.env.LL_BENCH_TOKEN;else process.env.LL_BENCH_TOKEN=old;}
});
test('capacity instrumentation denies remote and unauthenticated access',()=>{
 const old=process.env.LL_BENCH_TOKEN;process.env.LL_BENCH_TOKEN='a'.repeat(64);
 try{
  const b=createBenchmarkMetrics();assert.equal(b.enabled,true);
  const reply=()=>({status:0,body:'',writeHead(n){this.status=n;},end(s){this.body=s;}});
  let res=reply();
  assert.equal(b.respond({url:'/__bench',socket:{remoteAddress:'203.0.113.12'},headers:{'x-bench-token':'a'.repeat(64)}},res,new Map()),true);
  assert.equal(res.status,404);
  res=reply();
  b.respond({url:'/__bench',socket:{remoteAddress:'127.0.0.1'},headers:{'x-bench-token':'invalid'}},res,new Map());
  assert.equal(res.status,404);
  res=reply();
  b.respond({url:'/__bench?reset=1',socket:{remoteAddress:'127.0.0.1'},headers:{'x-bench-token':'a'.repeat(64)}},res,new Map());
  assert.equal(res.status,200);
  assert.equal(JSON.parse(res.body).rooms,0);
 }finally{if(old===undefined)delete process.env.LL_BENCH_TOKEN;else process.env.LL_BENCH_TOKEN=old;}
});
test('report quantiles are correctly ordered',()=>{
 assert.equal(quantile([3,1,2,4],.95),4);
 assert.equal(quantile([],.95),0);
});
