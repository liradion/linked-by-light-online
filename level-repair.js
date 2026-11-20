'use strict';
// Opt-in migration only for canonical first-act tutorial levels. Never remap
// custom creator content, progressed advanced worlds or protocol/checkpoint fields.
const {stages}=require('./shared/stages');
function normalizeIntroLevel(game){
 if(!game||![0,1,2].includes(game.stage)||game.customChallenge===true||!game.level)return false;
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
 // The old hidden flower task must never be restored as a blocking gate.
 canonical.signature.tutorialOnly=true;
 canonical.signature.nodes=[];
 canonical.signature.platforms=[];
 canonical.signature.done=true;
 game.level=canonical;
 return true;
}
module.exports={normalizeIntroLevel};
