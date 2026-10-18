// 独立教学示例：同一个房间列表查询范围内的完整快照。
// revision 必须由服务端在此范围内单调递增；不是本机时间戳。
export function createRoomStore(scope) {
  if (typeof scope !== 'string' || !scope) throw new TypeError('invalid scope');
  let revision = -1;
  let rooms = [];
  return {
    apply(snapshot) {
      if (!snapshot || snapshot.scope !== scope) return false;
      if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0)
        throw new TypeError('invalid revision');
      if (snapshot.revision <= revision) return false;
      if (!Array.isArray(snapshot.rooms)) throw new TypeError('invalid rooms');
      const ids = new Set();
      const next = snapshot.rooms.map(r => {
        if (!r || typeof r.id !== 'string' || !r.id || ids.has(r.id))
          throw new TypeError('invalid or duplicate room id');
        if (typeof r.game !== 'string' || !r.game.trim() ||
            !Number.isSafeInteger(r.capacity) || r.capacity < 1 ||
            !Number.isSafeInteger(r.players) || r.players < 0 || r.players > r.capacity)
          throw new TypeError('invalid room');
        ids.add(r.id);
        return { id:r.id, game:r.game, players:r.players, capacity:r.capacity };
      });
      // 所有记录验证完才替换，坏数据不会留下半次更新。
      rooms = next;
      revision = snapshot.revision;
      return true;
    },
    read() { return { scope, revision, rooms: rooms.map(r => ({...r})) }; }
  };
}
