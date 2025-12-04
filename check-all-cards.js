/**
 * 全面检查所有卡面文件是否存在
 */

const fs = require('fs');
const path = require('path');

// 卡面目录
const CARD_DIR = 'E:\\偶像大师\\闪耀色彩图片资源-压缩版\\角色卡面';

// 角色罗马音映射
const CHARACTER_TO_ROMAN = {
  櫻木真乃: 'Sakuragi.Mano',
  風野灯織: 'Kazano.Hiori',
  八宮めぐる: 'Hachimiya.Meguru',
  月岡恋鐘: 'Tsukioka.Kogane',
  田中摩美々: 'Tanaka.Mamimi',
  白瀬咲耶: 'Shirase.Sakuya',
  三峰結華: 'Mitsumine.Yuika',
  幽谷霧子: 'Yuukoku.Kiriko',
  小宮果穂: 'Komiya.Kaho',
  園田智代子: 'Sonoda.Chiyoko',
  西城樹里: 'Saijo.Juri',
  杜野凛世: 'Morino.Rinze',
  有栖川夏葉: 'Arisugawa.Natsuha',
  大崎甘奈: 'Osaki.Amana',
  大崎甜花: 'Osaki.Tenka',
  桑山千雪: 'Kuwayama.Chiyuki',
  芹沢あさひ: 'Serizawa.Asahi',
  黛冬優子: 'Mayuzumi.Fuyuko',
  和泉愛依: 'Izumi.Mei',
  浅倉透: 'Asakura.Toru',
  樋口円香: 'Higuchi.Madoka',
  福丸小糸: 'Fukumaru.Koito',
  市川雛菜: 'Ichikawa.Hinana',
  七草にちか: 'Nanakusa.Nichika',
  緋田美琴: 'Hida.Mikoto',
  斑鳩ルカ: 'Ikaruga.Luca',
  鈴木羽那: 'Suzuki.Hana',
  郁田はるき: 'Ikuta.Haruki',
};

// 主题罗马音映射
const THEME_TO_ROMAN = {
  // SSR
  絵空靴: 'Ezoragutsu',
  誘爆ハートビート: 'Yubaku.Heartbeat',
  アマテラス: 'Amaterasu',
  'CHÉRI☆': 'CHERI',
  雨に祝福: 'Ame.ni.Shukufuku',
  'Knock.the.Future': 'Knock.The.Future',
  'Dream☆Line': 'Dream.Line',
  'One-Side Love': 'One.Side.Love',
  甘奈とカンパイ: 'Amana.to.Kanpai',
  雨色好気分: 'Ameiro.Jokigen',
  'Brand New Field': 'Brand.New.Field',
  朝焼けは黄金色: 'Asayake.wa.Koganeiro',
  うぇるかむ冬優子: 'Welcome.Fuyuko',
  ライオンハート調: 'Lion.Heart.Chou',
  SHADOW.CHASER: 'SHADOW.CHASER',
  Nonfiction: 'Nonfiction',
  'TIntMe！': 'TIntMe',
  瞳の中のシリウス: 'Hitomi.no.Naka.no.Sirius',
  ソラを跳ねね: 'Sora.wo.Hanene',
  ひとつ、はたたく: 'Hitotsu.Hatataku',
  柔らかな微笑み: 'Yawarakana.Hohoemi',
  洸: 'Kou',
  'S☆ILLUMINうぇーぶ！': 'S.ILLUMINwave',
  巡る季節: 'Meguru.Kisetsu',
  '泣いたっていいじゃない？': 'Naita.tte.Ii.janai',
  '魔的・アンチテーゼ': 'Mateki.Antithese',
  'アバウト・ナイト・ライト': 'About.Night.Light',
  'Walk☆This☆Way': 'Walk.This.Way',
  'イツモ・ココカラ': 'Itsumo.Coco.Kara',
  'Catch☆UP!': 'Catch.UP',
  'お試し/みつゴコロ': 'Otameshi.Mitsu.Gokoro',
  'Swing☆リンク': 'Swing.Link',
  COLORFUL.BOX: 'COLORFUL.BOX',
  'Clover&Happiness': 'Clover.And.Happiness',
  '両手にLUCK！': 'Ryote.ni.LUCK',
  'まじめ、ときどき': 'Majime.Tokidoki',
  '甜花たん・オン・ステージ': 'Tenka.tan.On.Stage',
  '好き、のその先': 'Suki.no.Sono.Saki',
  'Growin\'Flora': 'Growin.Flora',
  'Spread the wings!!': 'Spread.the.Wings',
  あさひ、のぼる: 'Asahi.Noboru',
  'あそ→と♡ちよこれいと': 'Asoto.Chiyokoreito',
  '砂糖づけ・ビターエンド': 'Satouduke.Bitter.End',
  'Kn☆cking.Kn☆cking.': 'Knocking.Knocking',
  'Birdy Buddy': 'Birdy.Buddy',
  ダイスキ×じゃない: 'Daisuki.janai',
  longing: 'longing',
  透明なプロローグ: 'Toumei.na.Prologue',
  天塵: 'Tenjin',
  'Eyes On You': 'Eyes.On.You',
  ライトニングスピア: 'Lightning.Spear',
  'オイサラバエル': 'Oisarabael',
  'まじかる☆きゃりこ': 'Magical.Kyariko',
  てのひらの答え: 'Tenohira.no.Kotae',
  なつやすみ学校: 'Natsuyasumi.Gakko',
  恋をあげて: 'Koi.wo.Agete',
  Bloomy!: 'Bloomy',
  'エレクトリック・ガール': 'Electric.Girl',
  'Etoile&Etoile': 'Etoile.And.Etoile',
  'はつらつっ！まっち!': 'Hatsuratsu.Match',
  'ヒカリ、導ク': 'Hikari.Michibiku',
  光、荊棘の如く: 'Hikari.Ibara.no.Gotoku',
  'S!GNATURE': 'S.GNATURE',
  '♡まっしろはムウサギ♡': 'Mawashiro.wa.Muusagi',
  '伝えて niiid U': 'Tsutaete.niiid.U',
  '受けトルの sun Q': 'Uketoru.no.sun.Q',
  さすらいエトランゼ: 'Sasurai.Etranger',
  'ブルーレイジング': 'Blue.Raging',
  アイディール: 'Ideal',
  'スパ→トあんさー': 'Sparto.Answer',
  'バックステージ☆バックステージ': 'Backstage.Backstage',
  'Shine in Grail': 'Shine.in.Grail',

  // SR
  'マメ丸と一緒！': 'Mamemaru.to.Issho',
  'キャッチ・ザ・フォール！': 'Catch.The.Fall',
  純真チョコレート: 'Junshin.Chocolate',
  バッドガールの羽ばたき: 'Bad.Girl.no.Habataki',
  オフデーゲーム: 'Off.Day.Game',
  想ひいろは: 'Omoi.Iroha',
  微熱風鈴: 'Binetsu.Furin',
  ストイックトレーニング: 'Stoic.Training',
  鳥籠をひらいて: 'Torikago.wo.Hiraite',
  '似合うかな？': 'Niau.kana',
  '甜花ちゃんといっしょ☆': 'Tenka.chan.to.Issho',
  秘密のだらだらタイム: 'Himitsu.no.Daradara.Time',
  氷上バンビーナ: 'Hyojo.Bambina',
  お日様染めのマリーナ: 'Ohisama.Zome.no.Marina',
  マイフェイバリット: 'My.Favorite',
  一夏一刻物語: 'Ikka.Ikkoku.Monogatari',
  さかさま世界: 'Sakasama.Sekai',
  'ザ・冬優子イズム': 'The.Fuyuko.Ism',
  'A・冬優子イズム': 'A.Fuyuko.Ism',
  '気になる！？染めちゃう！？': 'Ki.ni.naru.Somechau',
  'おかえり、ギター': 'Okaeri.Guitar',
  カラメル: 'Caramel',
  'Makeup♡Box': 'Makeup.Heart.Box',
  泣けよ洗濯機: 'Nakeyo.Sentakuki',
  MANNEQUIN: 'MANNEQUIN',
  'Blind Driver': 'Blind.Driver',
  優You: 'YuYou',
  漂白花火: 'Hyohaku.Hanabi',

  // R
  白いツバサ: 'Shiroi.Tsubasa',
};

/**
 * 将卡名转换为文件名
 */
function cardNameToFileName(fullCardName) {
  const match = fullCardName.match(/【(.+)】(.+)/);
  if (!match) {
    console.error(`❌ 无法解析卡名: ${fullCardName}`);
    return null;
  }

  const [, theme, character] = match;
  const themeRoman = THEME_TO_ROMAN[theme];
  const characterRoman = CHARACTER_TO_ROMAN[character];

  if (!themeRoman || !characterRoman) {
    console.error(`❌ 找不到罗马音映射: 主题="${theme}" 角色="${character}"`);
    return null;
  }

  return `${themeRoman}_${characterRoman}`;
}

/**
 * 检查文件是否存在
 */
function checkFileExists(fileName) {
  const webpPath = path.join(CARD_DIR, `${fileName}.webp`);
  const webpPlusPath = path.join(CARD_DIR, `${fileName}+.webp`);

  return {
    normal: fs.existsSync(webpPath),
    awakened: fs.existsSync(webpPlusPath),
  };
}

// 从 real-cards.ts 导入卡片数据（简化版，手动列出）
const ALL_CARDS = [
  // 这里需要你提供完整的卡片列表，格式：
  // { name: '【絵空靴】杜野凛世', rarity: 'UR' },
  // 由于太多，让我从文件中读取
];

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始检查所有卡面文件...\n');

  // 读取压缩版目录中的所有文件
  const existingFiles = fs.readdirSync(CARD_DIR).filter(f => f.endsWith('.webp'));
  console.log(`📁 压缩版目录中共有 ${existingFiles.length} 个文件\n`);

  // 读取 real-cards.ts 文件内容
  const realCardsPath = 'E:\\偶像大师\\tavern_helper_template\\src\\偶像大师闪耀色彩-gacha\\data\\real-cards.ts';
  const content = fs.readFileSync(realCardsPath, 'utf-8');

  // 提取所有卡名（简单的正则匹配）
  const cardNameRegex = /name:\s*'([^']+)'/g;
  const allCardNames = [];
  let match;
  while ((match = cardNameRegex.exec(content)) !== null) {
    allCardNames.push(match[1]);
  }

  console.log(`📊 real-cards.ts 中共有 ${allCardNames.length} 张卡\n`);

  // 检查每张卡
  const missingCards = {
    UR: [],
    SSR: [],
    SR: [],
    R: [],
  };

  const errorCards = []; // 无法转换文件名的卡

  for (const cardName of allCardNames) {
    const fileName = cardNameToFileName(cardName);

    if (!fileName) {
      errorCards.push(cardName);
      continue;
    }

    const exists = checkFileExists(fileName);

    if (!exists.normal) {
      // 确定稀有度
      let rarity = 'R';
      if (content.includes(`name: '${cardName}', characterName: '`) && content.includes(`rarity: 'UR'`)) {
        rarity = 'UR';
      } else if (content.includes(`name: '${cardName}', characterName: '`) && content.includes(`rarity: 'SSR'`)) {
        rarity = 'SSR';
      } else if (content.includes(`name: '${cardName}', characterName: '`) && content.includes(`rarity: 'SR'`)) {
        rarity = 'SR';
      }

      missingCards[rarity].push(cardName);
      console.log(`❌ [${rarity}] ${cardName} → ${fileName}.webp (不存在)`);
    }
  }

  // 输出汇总
  console.log('\n' + '='.repeat(80));
  console.log('📊 检查结果汇总\n');

  console.log(`✅ 正常的卡: ${allCardNames.length - Object.values(missingCards).flat().length - errorCards.length} 张`);
  console.log(`❌ 缺失的卡: ${Object.values(missingCards).flat().length} 张`);
  console.log(`⚠️  无法转换的卡: ${errorCards.length} 张\n`);

  if (Object.values(missingCards).flat().length > 0) {
    console.log('📝 缺失的卡片列表（按稀有度分类）:\n');

    for (const [rarity, cards] of Object.entries(missingCards)) {
      if (cards.length > 0) {
        console.log(`${rarity} (${cards.length}张):`);
        cards.forEach(card => console.log(`  '${card}',`));
        console.log('');
      }
    }
  }

  if (errorCards.length > 0) {
    console.log('⚠️  无法转换文件名的卡片:\n');
    errorCards.forEach(card => console.log(`  '${card}',`));
  }

  console.log('\n💡 请将缺失的卡片添加到 available-cards.ts 的 UNAVAILABLE_CARDS 列表中');
}

main().catch(console.error);

