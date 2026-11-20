'use strict';
// Opt-in migration only for canonical first-act tutorial levels. Never remap
// custom creator content, progressed advanced worlds or protocol/checkpoint fields.
const {stages}=require('./shared/stages');
function normalizeIntroLevel(game){
 if(!game||!Number.isInteger(game.stage)||game.stage<0||game.stage>8||game.customChallenge===true||!game.level)return false;
 const previous=game.level,canonical=structuredClone(stages[game.stage]);
 // Structural geometry and the tutorial skip are always canonical after v30.
 // Preserve earned puzzle progress, collectibles and the authoritative room.
 for(const flag of ['gateOpen','bridgeLatched','padLatched'])
  canonical[flag]=previous[flag]===true;
 for(let i=0;i<canonical.pads.length;i++)
  canonical.pads[i].pressed=previous.pads?.[i]?.pressed===true;
 for(let i=0;i<canonical.walls.length;i++)
  canonical.walls[i].broken=previous.walls?.[i]?.broken===true;
 for(let i=0;i<canonical.crystals.length;i++)
  canonical.crystals[i].on=previous.crystals?.[i]?.on===true;
 // The first three tutorial levels and the newly curated fifth through ninth
 // levels have no hidden flower obligations. Stage four introduces one per role.
 if(game.stage!==3){
  canonical.signature.tutorialOnly=true;
  canonical.signature.nodes=[];
  canonical.signature.platforms=[];
  canonical.signature.done=true;
 }else{
  for(const flower of canonical.signature.nodes){
   flower.active=previous.signature?.done===true||
     previous.signature?.nodes?.some(n=>n.active===true&&n.role===flower.role)===true;
  }
  canonical.signature.done=previous.signature?.done===true||
    canonical.signature.nodes.every(n=>n.active);
 }
 game.level=canonical;
 return true;
}
module.exports={normalizeIntroLevel};
