#!/usr/bin/env node
/** Native-shell smoke: genuine PiG, genuine selected extensions, no paid model. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readJSON, verifyBundle } from "./installation.mjs";

const bundle = path.resolve(process.argv[2] || "dist/shell/bundle");
const reportFile = path.join(path.dirname(bundle), "smoke-report.json");
const report = { schema: 1, startedAt: new Date().toISOString(), checks: [],
  scope: "Real compiled PiG and pinned JS extensions, synthetic model service; no real user approval or external CLI credentials.",
  limits: ["Terminal UI modal interactions require manual testing.", "An RPC command listing does not prove external agent execution or real broker exchange.", "No live provider tokens are used."] };
async function check(name, action) {
  const started = Date.now();
  try { const result = await action(); report.checks.push({ name, status: "passed", ms: Date.now()-started, result });console.log("PASS",name); }
  catch(e){report.checks.push({name,status:"failed",ms:Date.now()-started,error:e.message});throw e;}
}
async function command(file, args, opts={}) {
  const p=spawn(file,args,{cwd:opts.cwd,env:{...process.env,...opts.env},stdio:["ignore","pipe","pipe"]});
  let out="",err="";p.stdout.on("data",x=>out+=x);p.stderr.on("data",x=>err+=x);
  const timeout=setTimeout(()=>p.kill("SIGKILL"),opts.timeoutMs||120000);
  try {
    const code=await new Promise((resolve,reject)=>{p.on("error",reject);p.on("close",resolve);});
    assert.equal(code,0,file+" failed: "+err.slice(-6000));
    return out;
  } finally {clearTimeout(timeout);}
}
async function requestRpc(bin,env,work) {
  const child=spawn(bin,["rpc","--home",env.PIG_AGENT_HOME,"--cwd",work,"--provider","study","--model","probe","--thinking","off"],
    {env:{...process.env,...env},cwd:work,stdio:["pipe","pipe","pipe"]});
  let buffer="",stderr="",settled=false;
  child.stderr.on("data",x=>stderr=(stderr+x).slice(-8000));
  const response=new Promise((resolve,reject)=>{
    child.on("error",reject);
    child.on("close",code=>{if(!settled)reject(new Error("RPC exited "+code+": "+stderr));});
    child.stdout.on("data",bytes=>{
      buffer+=bytes.toString();
      while(buffer.includes("\n")){
        const at=buffer.indexOf("\n");
        const line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);
        if(!line) continue;
        let value;try{value=JSON.parse(line);}catch{continue;}
        if(value.type==="response" && String(value.id)==="smoke-commands"){
          settled=true;resolve(value);return;
        }
      }
    });
  });
  const timeout=setTimeout(()=>child.kill("SIGKILL"),60000);
  child.stdin.write(JSON.stringify({id:"smoke-commands",type:"get_commands"})+"\n");
  try {return await response;} finally {
    clearTimeout(timeout);child.kill("SIGTERM");setTimeout(()=>child.kill("SIGKILL"),1000).unref();
  }
}
let temp,server;
try {
  const release=await verifyBundle(bundle);
  report.release={id:release.id,version:release.version,buildId:release.buildId,source:release.source,extensions:release.extensions};
  temp=await fs.mkdtemp(path.join(os.tmpdir(),"pig-shell-smoke "));
  const home=path.join(temp,"reference home");
  const broker=path.join(temp,"broker");
  const work=path.join(temp,"project");
  await fs.mkdir(work);
  const env={PIG_AGENT_HOME:home,PI_COMMS_BROKER_DIR:broker,PIG_OFFLINE:"1",PI_OFFLINE:"1"};
  const cli=path.join(bundle,release.id);
  await check("relocated install and stable command",async()=>{
    await command(cli,["install","--home",home],{cwd:work,env,timeoutMs:240000});
    const stable=path.join(home,"bin",release.id);
    const info=JSON.parse(await command(stable,["info"],{env,cwd:work}));
    assert.equal(info.buildId,release.buildId);
    const doctor=JSON.parse(await command(stable,["doctor"],{env,cwd:work,timeoutMs:60000}));
    assert.equal(doctor.verdict,"installed");
    assert.deepEqual(doctor.extensions.map(x=>x.name),["bro","external","comms"]);
    return {homeCount:1,extensions:doctor.extensions.map(x=>x.version)};
  });
  const stable=path.join(home,"bin",release.id);
  await check("full packaged extension assets",async()=>{
    for(const ext of release.extensions){
      const root=path.join(home,".agent/current/app/extensions",ext.id);
      await fs.access(path.join(root,ext.entry));
      for(const skill of ext.skills) await fs.access(path.join(root,skill));
      await fs.access(path.join(root,"package.json"));
      await fs.access(path.join(root,"LICENSE"));
    }
    await fs.access(path.join(home,".agent/current/app/role/skills/shell-orientation/SKILL.md"));
    return {extensions:release.extensions.length,roleSkills:release.roleSkills.length};
  });
  server=createServer(async(req,res)=>{
    for await (const _ of req) {}
    res.writeHead(200,{"Content-Type":"text/event-stream"});
    const id="smoke",model="probe";
    const chunk=(delta,reason)=>"data: "+JSON.stringify({id,object:"chat.completion.chunk",model,choices:[{index:0,delta,finish_reason:reason}]})+"\n\n";
    res.write(chunk({role:"assistant",content:"SHELL_NATIVE_REPLY"},null));
    res.write(chunk({},"stop"));
    res.end("data: [DONE]\n\n");
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const port=server.address().port;
  await fs.mkdir(path.join(home,".pi"),{recursive:true});
  await fs.writeFile(path.join(home,".pi/models.json"),JSON.stringify({providers:{study:{
    api:"openai-completions",baseUrl:"http://127.0.0.1:"+port+"/v1",apiKey:"fixture-only",
    models:[{id:"probe",name:"Fixture",reasoning:false,input:["text"],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:128000,maxTokens:4096}]
  }}}));
  await check("real PiG with pi-bro, pi-flow-external and pi-comms extension registration",async()=>{
    const value=await requestRpc(stable,env,work);
    assert.equal(value.success,true,JSON.stringify(value).slice(0,1000));
    const commands=value.data?.commands || value.commands || [];
    const names=commands.map(c=>c.name);
    for(const expected of ["bro","external","comms"]) assert.ok(names.some(n=>n===expected||n.startsWith(expected+" ")),
      "Missing "+expected+" commands; observed "+names.join(", "));
    return {commandCount:commands.length,matched:["bro","external","comms"]};
  });
  await check("two print sessions do not overwrite each other",async()=>{
    for(const marker of ["FIRST","SECOND"]){
      const text=await command(stable,["print",marker,"--home",home,"--cwd",work,
        "--provider","study","--model","probe","--thinking","off"],
        {env,cwd:work,timeoutMs:90000});
      assert.match(text,/SHELL_NATIVE_REPLY/);
    }
    const files=(await fs.readdir(path.join(home,"sessions"))).filter(x=>x.endsWith(".jsonl"));
    assert.ok(files.length>=2,"Separate print runs should create separate native transcripts");
    return {separateSessions:files.length};
  });
  report.status="passed";
} catch(e) {
  report.status="failed";report.error=e.stack||e.message;console.error(e);
  process.exitCode=1;
} finally {
  if(server) await new Promise(resolve=>server.close(resolve));
  report.finishedAt=new Date().toISOString();
  await fs.writeFile(reportFile,JSON.stringify(report,null,2)+"\n");
  if(temp) await fs.rm(temp,{recursive:true,force:true});
}
