'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./e2e',timeout:45000,retries:1,workers:1,
 use:{baseURL:'http://127.0.0.1:43998',trace:'retain-on-failure',actionTimeout:15000},
 projects:[{name:'Chromium',use:{browserName:'chromium'}},{name:'WebKit',use:{browserName:'webkit'}}],
 webServer:{command:'node server.js',url:'http://127.0.0.1:43998/health',reuseExistingServer:false,
  // Multiple Chromium/WebKit E2E cases retain finished rooms until TTL cleanup.
  // Increase only the isolated CI server capacity; Render production stays at five.
  timeout:30000,env:{PORT:'43998',BETA_MAX_ROOMS:'16',SAVE_DIR:'',
  SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
  LL_V27_ARCHIVE:'0',LL_REQUIRE_DURABLE_STORAGE:'0'}}
});
