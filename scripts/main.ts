import { Vector3, world, TargetBlockHitAfterEvent } from "@minecraft/server";

function targetBlockHandler(e: TargetBlockHitAfterEvent) {
  let ppos: Vector3 = { x: 0, y: 0, z: 0 };
  switch (e.source.getBlockFromViewDirection()?.face.toString()) {
    case "North":
      ppos = { x: e.block.x, y: e.block.y - 1, z: e.block.z - 15 };
      break;
    case "South":
      ppos = { x: e.block.x, y: e.block.y - 1, z: e.block.z + 15 };
      break;
    case "West":
      ppos = { x: e.block.x - 15, y: e.block.y - 1, z: e.block.z };
      break;
    case "East":
      ppos = { x: e.block.x + 15, y: e.block.y - 1, z: e.block.z };
      break;
  }
  let players = e.dimension.getPlayers({
    location: ppos,
    closest: 1,
    maxDistance: 1,
  });
  world.sendMessage("§7" + players[0].nameTag + " hat " + e.redstonePower.toString() + " Punkte erzielt.");
}

world.afterEvents.targetBlockHit.subscribe(targetBlockHandler);
