#!/usr/bin/env node
/**
 * Real installed PiG RPC processes + real pi-comms broker + synthetic model.
 * CANCEL a forwarded first-contact dialog. Never synthesize human approval.
 * This does NOT qualify live TUI approval or completed peer work.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { verifyBundle } from './installation.mjs';

const bundle = path.resolve(process.argv[2] || 'dist/shell/bundle');
const output = path.join(path.dirname(bundle), 'comms-rpc-report.json');
const report = { status: 'running', scope: 'Installed PiG x2, separate homes, shared broker, synthetic model, cancelled RPC consent only' };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, ms = 60000) {
  const untilAt = Date.now() + ms;
  while (!check()) {
    if (Date.now() >= untilAt) throw Error('Timed out: ' + label);
    await delay(20);
  }
}
function startRpc(bin, home, broker, cwd, model) {
  const child = spawn(bin, ['rpc','--home',home,'--cwd',cwd,'--provider','study','--model',model,'--thinking','off'], {
    cwd, env: { ...process.env, PI_COMMS_BROKER_DIR: broker, PIG_OFFLINE: '1', PI_OFFLINE: '1' },
    stdio: ['pipe','pipe','pipe']
  });
  const events = [], waits = new Map();
  let buffer = '', stderr = '', exited = false, confirms = 0;
  child.stderr.on('data', x => stderr = (stderr + x).slice(-8000));
  child.on('error', err => { stderr += String(err); });
  child.on('exit', () => {
    exited = true;
    for (const p of waits.values()) p.reject(Error('RPC exited: ' + stderr));
    waits.clear();
  });
  function write(obj) { child.stdin.write(JSON.stringify(obj) + '\n'); }
  child.stdout.on('data', bytes => {
    buffer += bytes.toString();
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n'), line = buffer.slice(0,end).trim();
      buffer = buffer.slice(end+1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      if (msg.type === 'response' && waits.has(msg.id)) {
        const p = waits.get(msg.id); waits.delete(msg.id); p.resolve(msg);
      } else {
        events.push(msg);
        if (msg.type === 'extension_ui_request' && msg.method === 'confirm') {
          confirms++;
          // Test refuses contact. No human Allow is made or fabricated.
          write({type:'extension_ui_response',id:msg.id,cancelled:true});
        }
      }
    }
  });
  async function request(command) {
    const id = randomUUID();
    let timer;
    try {
      const result = new Promise((resolve,reject) => waits.set(id,{resolve,reject}));
      write({...command,id});
      return await Promise.race([result,new Promise((_,reject) => {
        timer=setTimeout(() => reject(Error('RPC timeout ' + command.type + ' ' + stderr)),30000);
      })]);
    } finally { clearTimeout(timer); }
  }
  async function prompt(message) {
    const start=events.length;
    const ack=await request({type:'prompt',message});
    assert.equal(ack.success,true,JSON.stringify(ack));
    assert.equal(ack.data?.disposition,'started');
    await until(() => events.slice(start).some(x => x.type === 'agent_settled'),'settled ' + message);
    return events.slice(start);
  }
  async function close() {
    if (exited) return;
    child.stdin.end();
    await until(() => exited,'RPC shutdown',10000).catch(() => {});
    if (!exited) child.kill('SIGTERM');
    await delay(100);
    if (!exited) child.kill('SIGKILL');
  }
  return { request, prompt, close, events, get confirms(){return confirms;} };
}
function tool(events, name) {
  const e=events.find(x => x.type==='tool_execution_end' && x.toolName===name);
  assert.ok(e, 'No actual ' + name + ': ' + JSON.stringify(events.filter(x=>x.type==='tool_execution_end')));
  return e.result?.details ?? e.result?.structuredContent ?? e.result;
}
let tmp, provider;
const peers=[];
try {
  const release=await verifyBundle(bundle);
  const comms=release.extensions.find(x=>x.id==='comms');
  assert.equal(comms?.version,'0.2.0');
  tmp=await fs.mkdtemp(path.join(os.tmpdir(),'pig-comms-rpc '));
  const cwd=path.join(tmp,'project'), broker=path.join(tmp,'broker');
  const homes=[path.join(tmp,'a'),path.join(tmp,'b')];
  await fs.mkdir(cwd);
  const cli=path.join(bundle,release.id);
  for (const home of homes) execFileSync(cli,['install','--home',home], {
    cwd,env:{...process.env,PI_COMMS_BROKER_DIR:broker,PIG_OFFLINE:'1',PI_OFFLINE:'1'},timeout:120000
  });
  const seenModels=new Set();
  provider=createServer(async(req,res)=>{
    try {
      const blocks=[]; for await (const x of req) blocks.push(x);
      const body=JSON.parse(Buffer.concat(blocks).toString('utf8'));
      seenModels.add(body.model);
      const msgs=body.messages||[], index=msgs.findLastIndex(x=>x.role==='user');
      const u=msgs[index], txt=typeof u?.content==='string'?u.content:JSON.stringify(u?.content||'');
      const already=msgs.slice(index+1).some(x=>x.role==='tool');
      const wanted=txt.includes('TEST_PEERS')?'comms_peers':'comms_message';
      const id=txt.match(/TEST_CANCEL\s+([0-9a-f-]{36})/i)?.[1];
      if(wanted==='comms_message') assert.ok(id,'Exact target missing');
      const args=wanted==='comms_peers'?{}:{to:id,subject:'Approval test',text:'DO NOT DELIVER',workRef:'NO-AUTO-GRANT'};
      const names=(body.tools||[]).map(x=>x.function?.name||x.name);
      assert.ok(names.includes(wanted),'Missing tool ' + wanted);
      const frame=(delta,reason)=>'data: '+JSON.stringify({id:'smoke',object:'chat.completion.chunk',model:body.model||'probe-a',choices:[{index:0,delta,finish_reason:reason}]})+'\n\n';
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      if(!already){
        res.write(frame({role:'assistant',tool_calls:[{index:0,id:'call-smoke',type:'function',function:{name:wanted,arguments:JSON.stringify(args)}}]},null));
        res.write(frame({},'tool_calls'));
      }else{
        res.write(frame({role:'assistant',content:'PROBE_COMPLETE'},null));
        res.write(frame({},'stop'));
      }
      res.end('data: [DONE]\n\n');
    }catch(err){
      console.error(err);
      if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{message:String(err)}}));
    }
  });
  await new Promise((resolve,reject)=>{
    provider.once('error',reject);
    provider.listen(0,'127.0.0.1',resolve);
  });
  const port=provider.address().port;
  for(let i=0;i<2;i++){
    const dir=path.join(homes[i],'.pi');
    await fs.mkdir(dir,{recursive:true});
    const model='probe-'+(i?'b':'a');
    await fs.writeFile(path.join(dir,'models.json'),JSON.stringify({providers:{study:{
      api:'openai-completions',baseUrl:'http://127.0.0.1:'+port+'/v1',
      apiKey:'synthetic-only',models:[{id:model,name:model,reasoning:false,input:['text'],
      cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:128000,maxTokens:4096}]
    }}}));
  }
  for(let i=0;i<2;i++)peers.push(startRpc(path.join(homes[i],'bin',release.id),homes[i],broker,cwd,'probe-'+(i?'b':'a')));
  const a=peers[0],b=peers[1];
  const stateA=await a.request({type:'get_state'}),stateB=await b.request({type:'get_state'});
  assert.equal(stateA.success,true);assert.equal(stateB.success,true);
  const aId=stateA.data?.sessionId,bId=stateB.data?.sessionId;
  assert.match(aId,/^[0-9a-f-]{36}$/);assert.match(bId,/^[0-9a-f-]{36}$/);
  assert.notEqual(aId,bId);
  assert.equal(stateA.data?.model?.id,'probe-a');
  assert.equal(stateB.data?.model?.id,'probe-b');
  let found;
  for(let i=0;i<5;i++){
    const listed=tool(await a.prompt('TEST_PEERS'),'comms_peers');
    assert.equal(listed.ok,true,JSON.stringify(listed));
    found=listed.data?.items?.find(x=>x.id===bId);
    if(found)break;
    await delay(250);
  }
  assert.ok(found,'Second native session missing from shared broker roster');
  assert.equal(found.approved,false,'Shared broker cannot grant contact approval');
  const back=tool(await b.prompt('TEST_PEERS'),'comms_peers');
  assert.ok(back.data?.items?.some(x=>x.id===aId),'Reverse discovery failed');
  const receiverRuns=b.events.filter(x=>x.type==='agent_start').length;
  const attempt=tool(await a.prompt('TEST_CANCEL '+bId),'comms_message');
  assert.equal(attempt.ok,false,'Cancelled first contact must not send');
  const code=String(attempt.error?.code||'');
  assert.match(code,/CONTACT_(NOT_APPROVED|CANCELLED|APPROVAL_REQUIRED)/,JSON.stringify(attempt));
  assert.ok(a.confirms>0||code==='CONTACT_APPROVAL_REQUIRED','RPC must forward consent or require it');
  assert.equal(b.events.filter(x=>x.type==='agent_start').length,receiverRuns,'Cancelled contact woke peer');
  const post=tool(await a.prompt('TEST_PEERS'),'comms_peers');
  assert.equal(post.data?.items?.find(x=>x.id===bId)?.approved,false);
  assert.deepEqual(new Set(['probe-a','probe-b']),seenModels);
  report.status='passed';
  report.version=release.buildId;
  report.comms={version:comms.version,sourceCommit:comms.sourceCommit};
  report.checks={differentHomes:true,sameBroker:true,distinctNativeIds:true,
    distinctModelLabels:true,peerDiscovery:true,approved:false,
    rpcConfirmForwarded:a.confirms>0,contactError:code,receiverWakeAfterRefusal:false};
  console.log('PASS installed PiG RPC pair: real broker, exact peers, declined contact, no unapproved send');
}catch(e){
  report.status='failed';report.error=String(e.stack||e);
  console.error(e);process.exitCode=1;
}finally{
  await Promise.all(peers.map(x=>x.close().catch(()=>{})));
  if(provider)await new Promise(resolve=>provider.close(resolve));
  if(tmp){
    try{const pid=Number(await fs.readFile(path.join(tmp,'broker','broker.pid'),'utf8'));if(pid>0)process.kill(pid,'SIGTERM');}catch{}
    await delay(150);
    await fs.rm(tmp,{recursive:true,force:true});
  }
  await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
}
