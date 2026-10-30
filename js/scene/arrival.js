// Where the visitor appears when arriving from another world (D14, and the laws L16 and L17 of
// docs/ROADMAP.md section 8).
//
// Pure, and shared on purpose: the scene builder places the camera with it and the validator
// proves the placement legal with it, so the two cannot disagree about the geometry — the same
// reason the schema has one home for the format.
//
// The point is in front of the door — on the side its front looks at, which is the side the room is
// on (D77: the works sit inside the ring of doors, and a door faces the centre) — and away from the
// box by more than half its depth plus a margin. That is what stops a step forward, right after
// arriving, from crossing the plane and throwing the visitor back (the chain crossing the law L16
// exists for), and it is also what makes turning around a single step back through the door.

// Metres added to half the depth of the box: the visitor's eye has to be outside the box on the
// first frame, or the arrival itself counts as a crossing.
export const ARRIVAL_MARGIN = 0.5;

// The place and the direction of the arrival of one door. `door` is the data of a portal
// (position, rotation, box).
//
// The place is *in front of* the plane — on the side the door's front looks at, which is where the
// room is — and away from the box by more than half its depth plus a margin. The direction is the
// door's own yaw turned by half a turn: the visitor comes out facing away from the door and into the
// room, which is what the window showed them before they crossed it.
export function arrivalPoint(door, eyeHeight) {
  const depth = Array.isArray(door.box) && typeof door.box[2] === 'number' ? door.box[2] : 1;
  const distance = depth / 2 + ARRIVAL_MARGIN;
  const yaw = Array.isArray(door.rotation) ? door.rotation[1] || 0 : 0;
  const radians = (yaw * Math.PI) / 180;
  const position = Array.isArray(door.position) ? door.position : [0, 0, 0];
  return {
    position: [
      position[0] + Math.sin(radians) * distance,
      typeof eyeHeight === 'number' ? eyeHeight : position[1] || 1.6,
      position[2] + Math.cos(radians) * distance
    ],
    rotation: [0, yaw + 180, 0]
  };
}
