import { Vector3, world, TargetBlockHitAfterEvent, BlockComponent } from "@minecraft/server";

function targetBlockHandler(e: TargetBlockHitAfterEvent) {
  world.sendMessage("§7" + e.redstonePower.toString() + " Punkte erzielt.");
}

world.afterEvents.targetBlockHit.subscribe(targetBlockHandler);
