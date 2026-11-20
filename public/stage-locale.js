/* English authored catalog for all 137 official Linked by Light stages.
   Index mapping reflects shared/stages + v20/v21/v23 order.
   No gameplay definitions, authoritative physics or protocol are modified. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameStageLocale=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const WORLDS=Object.freeze([
  'Bright Valley','Twilight Forest','Moonlit Harbor','High Clouds',
  'Constellation Garden','Crystal Rift','Radiant City','River of Heaven',
  'Clock Tower','Far Horizon','Heart of the Constellation'
 ]);
 const MISSIONS=Object.freeze([
  'Together','Through the Wall','First Bridge','Stronger Together',
  'Shared Signal','Hold the Bridge','Double Glow','The Right Choice','Final Connection'
 ]);
 const OBJECTIVES=Object.freeze([
  'Stand on both plates simultaneously to open the gate.',
  'Spark breaks the wall; Echo activates the crystal.',
  'Echo charges the crystal before the bridge. Cross it together.',
  'Spark destroys the barrier. Activate both plates.',
  'Activate the crystal and both pressure plates at the same time.',
  'Spark holds the plate while Echo crosses the bridge and charges the crystal.',
  'Echo charges two crystals. Cross the bridge together.',
  'Break the wall, activate the crystal and stand on both plates.',
  'Activate every mechanism together and enter the portal.'
 ]);
 const FIRST_TITLES=Object.freeze([
  'First Contact','Bridge of Trust','One Rhythm','Bright Valley · Stronger Together',
  'Bright Valley · Shared Signal','Bright Valley · Hold the Bridge',
  'Bright Valley · Double Glow','Bright Valley · The Right Choice',
  'Bright Valley · Final Connection'
 ]);
 const FIRST_OBJECTIVES=Object.freeze([
  'Spark stands on the orange plate; Echo on the blue. Hold them simultaneously.',
  'Spark breaks the wall and holds the amber plate; Echo crosses the bridge and charges the crystal.',
  'Jump the short gap, then stand on both color-matched plates at the same time.',
  'Spark breaks the wall, then Spark touches the amber flower and Echo the blue one.',
  'Echo charges the crystal; then both jump through the glowing flight ring.',
  'Spark holds the amber plate to secure the bridge. Board the sail together: Spark steers and Echo boosts.',
  'Echo charges the crystal; then both use abilities at the separate rhythm signals.',
  'Spark breaks the wall, Echo charges the crystal; then stand on both colored plates.',
  'Echo charges the crystal, both hold the plates, then alternate ability attacks against the guardian.'
 ]);
 const EXTRA=Object.freeze([
  ['The Mystery of the Hundredth Light','Discover all eleven secrets and defeat the Last Shadow.'],
  ['The First Knot','Activate the Thread while standing close together, then each stand on your glowing seal.'],
  ['Bridge of Two Reflections','Spark switches dimensions at the first seal; Echo activates the second seal.'],
  ['Crystal Memory','Spark freezes the clock; Echo touches the time echo within the next three seconds.'],
  ['Guardian of the Facets','Activate the Thread while close together, take your glowing seals, then defeat the guardian together.'],
  ['A Second Toward You','Spark freezes the clock; Echo touches the time echo within the next three seconds.'],
  ['The Impossible Machine','Spark switches dimensions at the first seal; Echo activates the second seal.'],
  ['A Moment Suspended','Connect with the Thread, activate both dimensional seals and finish the time knot.'],
  ['Keeper of Seconds','Spark freezes the clock; Echo touches the time echo within three seconds, then defeat the guardian together.'],
  ['Warm Light','Activate the Thread while standing close together, then each take your glowing seal.'],
  ['A Step Through Shadow','Spark switches dimensions at the first seal; Echo activates the second seal.'],
  ['The Last Thread','Connect with the Thread, activate both dimensional seals and complete the time knot.'],
  ['The Broken Heart','Connect with the Thread, activate both dimensional seals, complete the time knot and defeat the guardian together.'],
  ['Bridge of Footprints','Spark leaves a trail of light while moving. Echo crosses four temporary platforms.'],
  ['Mail Between Worlds','Spark passes the orb at the altar. Echo receives it and carries it to the exit.'],
  ['Two Perspectives','Spark sees the sequence of symbols; Echo activates them in the correct order.'],
  ['Lantern in the Fog','Spark lights the lantern while Echo crosses the hidden bridge. Turn it off to calm the guard.'],
  ['Changing Shapes','Take new forms and collect two light keys: bird and fox.'],
  ['Weather in Our Hands','Spark directs the wind, Echo summons rain. Fill the sky vessel together.'],
  ['Fragile Cargo','Move the heavy crystal together to the third marker.'],
  ['The Living Tree','Grow six branches of the giant tree, taking turns.'],
  ['A Maze for Two','Echo controls the maze mechanism; Spark reaches three checkpoints.'],
  ['Trading Roles','First Spark crosses while Echo activates. Then swap your responsibilities.'],
  ['Two Gravities','Spark reverses gravity, Echo holds the field. Touch both sky seals.'],
  ['Mirror Beam','Spark aims the beam of light, Echo adjusts the mirrors. Activate three prisms.'],
  ['Great and Small','Spark grows into a giant, Echo passes through a narrow gap. Open both seals.'],
  ['Pendulum of Light','Hold the pendulum steady together and secure both sky anchors in turn.'],
  ['Living Shadows','Spark’s shadow becomes Echo’s platforms. Cross the gap while staying close.'],
  ['Two Faces of the World','Alternate between the geometries of two worlds and activate both pillars.'],
  ['Underwater River','Spark controls the current; Echo steers the raft and collects three river pearls.'],
  ['Magnetic Poles','Attract and repel the shared crystal to deliver it to the solar receiver.'],
  ['Rhythm of the Constellations','Solve the rhythm puzzle: repeat four patterns in turn without rushing.'],
  ['Route Machine','Build a path of four segments: one player operates the bridge while the other crosses.'],
  ['Guardian of Crystals','Echo distracts the spider while Spark destroys its seals.'],
  ['Clock Dragon','Slow the dragon’s time, then land four precise strikes together.'],
  ['Mirror Doubles','Lure the reflections into a trap four times.'],
  ['Sleeping Titan','Climb the seals and awaken four sources of light.'],
  ['Eye of Two Worlds','Each player sees only part of its defenses; coordinate four attacks.']
 ]);
 const SIGNATURES=Object.freeze({
  flowers:{label:'Light Flowers',tip:'Activate light flowers with the matching hero: Spark for orange, Echo for blue.'},
  forest:{label:'Twilight Forest',tip:'Echo uses a pulse near glowing seeds to wake the plants and open the route.'},
  tide:{label:'Moonlit Tides',tip:'Reach each moon lantern with the matching hero while the tide is bright.'},
  wind:{label:'High Winds',tip:'Use air currents to reach the sky feathers.'},
  constellation:{label:'Constellations',tip:'Echo activates the stars in numbered order. A wrong star resets the sequence.'},
  prism:{label:'Prisms',tip:'Spark charges amber prisms with a dash; Echo charges blue prisms with a pulse.'},
  city:{label:'Radiant City',tip:'Power the city generators using the ability of the matching hero.'},
  river:{label:'Sky River',tip:'Stand together at paired river anchors to hold both signals.'},
  clock:{label:'Clock Tower',tip:'Echo starts the clock with a pulse; both heroes must cross the timed door.'},
  relay:{label:'Distant Relay',tip:'One hero maintains the far signal while the other answers at the paired beacon.'},
  heart:{label:'Constellation Heart',tip:'Charge your personal cores with abilities. Shared cores require both heroes nearby.'}
 });
 const REALITIES=Object.freeze({
  mirror:{label:'Two Worlds',tip:'Activate both world seals so that the two realities join.'},
  chronicle:{label:'Past and Future',tip:'Open the past, then let Echo activate the future before the timer ends.'},
  gravity:{label:'Anti-gravity',tip:'Use the gravity shift to reach the core; both heroes must touch it.'}
 });
 function has(index){return Number.isInteger(index)&&index>=0&&index<=136;}
 function title(index,fallback){
  if(!has(index))return fallback;
  if(index<9)return FIRST_TITLES[index];
  if(index<99)return WORLDS[Math.floor(index/9)]+' · '+MISSIONS[index%9];
  return EXTRA[index-99][0];
 }
 function objective(index,fallback){
  if(!has(index))return fallback;
  if(index<9)return FIRST_OBJECTIVES[index];
  if(index<99)return OBJECTIVES[index%9];
  return EXTRA[index-99][1];
 }
 function hint(index,fallback){
  if(!has(index))return fallback;
  if(index===0)return 'Both plates work only while you stand on them together.';
  if(index===1)return 'Spark dashes into the cracked wall; Echo pulses next to the crystal.';
  if(index===2)return 'Jump near the edge of the first short gap. The next light bridge is stable; then hold both plates together.';
  if(index===3)return 'Spark dashes through the wall; find one matching light flower for each hero.';
  if(index===4)return 'Echo charges the crystal; jump through the flight ring when it glows.';
  if(index===5)return 'Spark holds the amber plate until the bridge latches. Echo pulses the sail while Spark steers.';
  if(index===6)return 'Echo charges the crystal. Both trigger their rhythm signals within a short shared window.';
  if(index===7)return 'Dash wall, pulse crystal, then activate both plates at once.';
  if(index===8)return 'Charge the crystal, hold both plates and alternate Spark/Echo attacks near the guardian.';
  return objective(index,fallback);
 }
 function world(index){
  if(!has(index))return '';
  if(index<99)return WORLDS[Math.floor(index/9)];
  if(index===99)return 'Secret Light';
  if(index<112)return 'Intertwined Worlds';
  if(index<122)return 'Toward Each Other';
  return 'Physics of Light';
 }
 return Object.freeze({WORLDS,MISSIONS,OBJECTIVES,FIRST_TITLES,FIRST_OBJECTIVES,EXTRA,
  SIGNATURES,REALITIES,has,title,objective,hint,world});
});
