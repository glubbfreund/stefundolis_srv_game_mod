import { world, TargetBlockHitAfterEvent } from "@minecraft/server";

function targetBlockHandler(e: TargetBlockHitAfterEvent) {
  let players = e.dimension.getPlayers({
    location: { x: e.block.x, y: e.block.y - 1, z: e.block.z - 15 },
    closest: 1,
    maxDistance: 1,
  });
  world.sendMessage("§7" + players[0].nameTag + " hat " + e.redstonePower.toString() + " Punkte erzielt.");
}

world.afterEvents.targetBlockHit.subscribe(targetBlockHandler);
