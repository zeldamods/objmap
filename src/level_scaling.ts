// source: aoc2::rankUpEnemy (0x7100D6F0FC Switch 1.5.0)
const RANKUP_MAP: { [actorName: string]: string } = Object.freeze({
  Enemy_Assassin_Junior: 'Enemy_Assassin_Middle',
  Enemy_Assassin_Middle: 'Enemy_Assassin_Senior',
  Enemy_Assassin_Shooter_Junior: 'Enemy_Assassin_Shooter_Azito_Junior',

  Enemy_Bokoblin_Junior: 'Enemy_Bokoblin_Middle',
  Enemy_Bokoblin_Middle: 'Enemy_Bokoblin_Senior',
  Enemy_Bokoblin_Senior: 'Enemy_Bokoblin_Dark',
  Enemy_Bokoblin_Dark: 'Enemy_Bokoblin_Gold',
  Enemy_Bokoblin_Guard_Junior: 'Enemy_Bokoblin_Guard_Middle',
  Enemy_Bokoblin_Guard_Junior_Ambush: 'Enemy_Bokoblin_Guard_Middle_Ambush',
  Enemy_Bokoblin_Guard_Junior_TreeHouseTop: 'Enemy_Bokoblin_Guard_Middle_TreeHouseTop',

  Enemy_Chuchu_Electric_Junior: 'Enemy_Chuchu_Electric_Middle',
  Enemy_Chuchu_Electric_Middle: 'Enemy_Chuchu_Electric_Senior',
  Enemy_Chuchu_Fire_Junior: 'Enemy_Chuchu_Fire_Middle',
  Enemy_Chuchu_Fire_Middle: 'Enemy_Chuchu_Fire_Senior',
  Enemy_Chuchu_Ice_Junior: 'Enemy_Chuchu_Ice_Middle',
  Enemy_Chuchu_Ice_Middle: 'Enemy_Chuchu_Ice_Senior',
  Enemy_Chuchu_Junior: 'Enemy_Chuchu_Middle',
  Enemy_Chuchu_Middle: 'Enemy_Chuchu_Senior',

  Enemy_Giant_Junior: 'Enemy_Giant_Middle',
  Enemy_Giant_Middle: 'Enemy_Giant_Senior',

  Enemy_Golem_Junior: 'Enemy_Golem_Middle',
  Enemy_Golem_Middle: 'Enemy_Golem_Senior',

  Enemy_Guardian_Mini_Baby: 'Enemy_Guardian_Mini_Junior',
  Enemy_Guardian_Mini_Junior: 'Enemy_Guardian_Mini_Middle',
  Enemy_Guardian_Mini_Middle: 'Enemy_Guardian_Mini_Senior',
  Enemy_Guardian_Mini_Junior_DetachLineBeam: 'Enemy_Guardian_Mini_Middle_DetachLineBeam',

  Enemy_Lizalfos_Junior: 'Enemy_Lizalfos_Middle',
  Enemy_Lizalfos_Middle: 'Enemy_Lizalfos_Senior',
  Enemy_Lizalfos_Senior: 'Enemy_Lizalfos_Dark',
  Enemy_Lizalfos_Dark: 'Enemy_Lizalfos_Gold',
  Enemy_Lizalfos_Guard_Junior: 'Enemy_Lizalfos_Guard_Middle',
  Enemy_Lizalfos_Guard_Junior_LongVisibility: 'Enemy_Lizalfos_Guard_Middle_LongVisibility',
  Enemy_Lizalfos_Junior_Guard_Ambush: 'Enemy_Lizalfos_Middle_Guard_Ambush',

  Enemy_Lynel_Junior: 'Enemy_Lynel_Middle',
  Enemy_Lynel_Middle: 'Enemy_Lynel_Senior',
  Enemy_Lynel_Senior: 'Enemy_Lynel_Dark',
  Enemy_Lynel_Dark: 'Enemy_Lynel_Gold',

  Enemy_Moriblin_Junior: 'Enemy_Moriblin_Middle',
  Enemy_Moriblin_Middle: 'Enemy_Moriblin_Senior',
  Enemy_Moriblin_Senior: 'Enemy_Moriblin_Dark',
  Enemy_Moriblin_Dark: 'Enemy_Moriblin_Gold',

  Enemy_Wizzrobe_Electric: 'Enemy_Wizzrobe_Electric_Senior',
  Enemy_Wizzrobe_Fire: 'Enemy_Wizzrobe_Fire_Senior',
  Enemy_Wizzrobe_Ice: 'Enemy_Wizzrobe_Ice_Senior',
});

export function rankUpEnemyForHardMode(actorName: string): string {
  return RANKUP_MAP[actorName] || actorName;
}
