import {
  Vector3,
  world,
  TargetBlockHitAfterEvent,
  EntityHitBlockAfterEvent,
  Player,
  DisplaySlotId,
  ScoreboardObjective,
  ObjectiveSortOrder,
} from "@minecraft/server";

let match = false;
let roundPoints = 0;
let lastPoints = 0;
let prevPoints = 0;
let roundCounter = 1;
let matchPlayers: Player[] = [];

function float2int(value: number) {
  return value | 0;
}

function sendTitleToPlayer(player: Player, titleMsg: string, subtitleMsg: string) {
  player.onScreenDisplay.setTitle(titleMsg, {
    stayDuration: 5,
    fadeInDuration: 50,
    fadeOutDuration: 50,
    subtitle: subtitleMsg,
  });
}

function initMatch() {
  match = true;

  let scoreObjective = world.scoreboard.getObjective("dartgame");
  if (!scoreObjective) {
    scoreObjective = world.scoreboard.addObjective("dartgame", "Dart Match");
  }
  world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
    objective: scoreObjective,
    sortOrder: ObjectiveSortOrder.Ascending,
  });
  matchPlayers.forEach((player) => {
    player.runCommand("scoreboard players set @s dartgame 101");
  });
}

function unloadMatch() {
  roundCounter = 1;
  roundPoints = 0;
  lastPoints = 0;
  match = false;
  world.scoreboard.removeObjective("dartgame");
}

function entityHitBlockHandler(e: EntityHitBlockAfterEvent) {
  if (!e.hitBlock.permutation.matches("minecraft:target") || e.damagingEntity.typeId != "minecraft:player") return;

  let initiatedPlayer = e.damagingEntity as Player;
  matchPlayers = e.hitBlock.dimension.getPlayers({
    location: initiatedPlayer.location,
    closest: 3,
    maxDistance: 20,
  });

  let matchPlayersString = "§r";
  let counter = 0;
  matchPlayers.forEach((player) => {
    if (counter != 0) matchPlayersString += "§o vs §r";
    matchPlayersString += player.nameTag;
    counter++;
  });

  if (!match) {
    sendTitleToPlayer(e.damagingEntity as Player, "§2Match gestartet", matchPlayersString);
    initMatch();
  } else {
    sendTitleToPlayer(e.damagingEntity as Player, "§4Match abgebrochen", "");
    unloadMatch();
  }
}

function targetBlockHandler(e: TargetBlockHitAfterEvent) {
  let ppos: Vector3 = { x: 0, y: 0, z: 0 };
  switch (e.source.getBlockFromViewDirection()?.face.toString()) {
    case "North":
      ppos = { x: e.block.x, y: e.block.y - 1, z: e.block.z - 14 };
      break;
    case "South":
      ppos = { x: e.block.x, y: e.block.y - 1, z: e.block.z + 14 };
      break;
    case "West":
      ppos = { x: e.block.x - 14, y: e.block.y - 1, z: e.block.z };
      break;
    case "East":
      ppos = { x: e.block.x + 14, y: e.block.y - 1, z: e.block.z };
      break;
  }
  let players = e.dimension.getPlayers({
    location: ppos,
    closest: 1,
    maxDistance: 1,
  });

  let player0Identity = players[0].scoreboardIdentity;
  if (!player0Identity) return;

  let scoredPoint = float2int(e.redstonePower / 2);
  lastPoints = scoredPoint;

  matchPlayers.forEach((player) => {
    player.sendMessage("§7" + player0Identity?.displayName + " wirft " + scoredPoint.toString() + " Punkte.");
  });

  if (!match) return;

  let gameObjective = world.scoreboard.getObjective("dartgame");
  let currentScore = gameObjective?.getScore(player0Identity);

  if (!currentScore) return;
  if (roundCounter === 1) prevPoints = currentScore;
  roundPoints += scoredPoint;
  gameObjective?.setScore(player0Identity, currentScore - scoredPoint);

  if (currentScore - scoredPoint < 0) {
    matchPlayers.forEach((player) => {
      sendTitleToPlayer(
        player,
        "§7überworfen!",
        "§7" + player0Identity?.displayName + " wirft §4" + roundPoints.toString() + "§7 Punkte in dieser Runde"
      );
    });
    gameObjective?.setScore(player0Identity, prevPoints);
    roundCounter = 1;
    roundPoints = 0;
  } else if (currentScore - scoredPoint == 0) {
    matchPlayers.forEach((player) => {
      world.playSound("random.levelup", e.block.location);
      sendTitleToPlayer(player, "§2Match beendet", "§2" + player0Identity?.displayName + " §7hat das Match gewonnen!");
    });
    unloadMatch();
    return;
  } else if (roundCounter == 3) {
    let color = "§2";
    if (roundPoints === 21) {
      color = "§r";
      world.playSound("block.bell.hit", e.block.location);
      world.playSound("ambient.weather.thunder", e.block.location);
    }
    matchPlayers.forEach((player) => {
      sendTitleToPlayer(
        player,
        "§7Nächster Spieler!",
        "§7" + player0Identity?.displayName + " wirft §2" + roundPoints.toString() + "§7 Punkte in dieser Runde"
      );
    });
    roundPoints = 0;
    roundCounter = 1;
  } else {
    roundCounter++;
  }
}

world.afterEvents.targetBlockHit.subscribe(targetBlockHandler);
world.afterEvents.entityHitBlock.subscribe(entityHitBlockHandler);
