export function createLaneAssignment(attendees, laneCount, method = "SCR") {
  if (!Number.isInteger(laneCount) || laneCount < 2 || laneCount % 2 !== 0) {
    throw new Error("레인 수는 2 이상의 짝수여야 합니다.");
  }

  if (attendees.length === 0) return [];

  const normalized = applyFallbackAverage(attendees);
  const tableCount = laneCount / 2;
  const tableTargets = distributeCount(normalized.length, tableCount);
  const tables = tableTargets.map((target, index) => ({
    tableNo: index + 1,
    target,
    burden: 0,
    members: [],
  }));

  if (method === "RND") {
    const shuffled = shuffle(normalized);
    shuffled.forEach((member) => {
      const table = tables.find((item) => item.members.length < item.target);
      table.members.push(member);
    });
  } else {
    [...normalized]
      .sort((a, b) => a.avgScore - b.avgScore)
      .forEach((member) => {
        const candidates = tables.filter((table) => table.members.length < table.target);
        candidates.sort(
          (a, b) =>
            a.burden - b.burden ||
            b.target - a.target ||
            a.tableNo - b.tableNo
        );
        candidates[0].members.push(member);
        candidates[0].burden += Math.max(0, 300 - member.avgScore);
      });
  }

  return tables.flatMap((table) =>
    assignTableLanes(table, method).map((member) => ({
      user_id: member.id,
      table_no: table.tableNo,
      lane_no: member.laneNo,
      avg_score: member.avgScore,
      user: member,
    }))
  );
}

function assignTableLanes(table, method) {
  const firstLaneNo = table.tableNo * 2 - 1;
  const targets = distributeCount(table.members.length, 2);
  const lanes = targets.map((target, index) => ({
    laneNo: firstLaneNo + index,
    target,
    scoreTotal: 0,
    members: [],
  }));
  const members = method === "RND"
    ? shuffle(table.members)
    : [...table.members].sort((a, b) => b.avgScore - a.avgScore);

  members.forEach((member) => {
    const candidates = lanes.filter((lane) => lane.members.length < lane.target);
    candidates.sort(
      (a, b) =>
        a.scoreTotal - b.scoreTotal ||
        b.target - a.target ||
        a.laneNo - b.laneNo
    );
    candidates[0].members.push(member);
    candidates[0].scoreTotal += member.avgScore;
  });

  return lanes.flatMap((lane) =>
    lane.members.map((member) => ({ ...member, laneNo: lane.laneNo }))
  );
}

function applyFallbackAverage(attendees) {
  const known = attendees
    .map((item) => Number(item.avg_score))
    .filter((score) => Number.isFinite(score) && score > 0)
    .sort((a, b) => a - b);
  const fallback = known.length === 0
    ? 0
    : known.length % 2 === 1
      ? known[Math.floor(known.length / 2)]
      : (known[known.length / 2 - 1] + known[known.length / 2]) / 2;

  return attendees.map((item) => ({
    ...item,
    avgScore:
      Number.isFinite(Number(item.avg_score)) && Number(item.avg_score) > 0
        ? Number(item.avg_score)
        : fallback,
  }));
}

function distributeCount(total, bucketCount) {
  const base = Math.floor(total / bucketCount);
  const remainder = total % bucketCount;
  return Array.from(
    { length: bucketCount },
    (_, index) => base + (index < remainder ? 1 : 0)
  );
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
