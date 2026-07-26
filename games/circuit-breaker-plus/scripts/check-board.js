import { BoardModel } from "../js/board.js";
import { findMatchGroups } from "../js/matches.js";

for (let index = 0; index < 250; index += 1) {
  const model = new BoardModel();
  model.generate();
  const groups = findMatchGroups(model.board);
  if (groups.length > 0) {
    throw new Error(`Generated board ${index} started with ${groups.length} match(es).`);
  }
  if (!model.hasPossibleMove()) {
    throw new Error(`Generated board ${index} had no possible moves.`);
  }
}

console.log("Board generation check passed.");
