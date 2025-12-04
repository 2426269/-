const fs = require('fs');
const path = require('path');

const targetDir = 'E:\\偶像大师\\闪耀色彩图片资源\\角色卡面';

// 角色名日文到罗马音映射
const characterMap = {
  櫻木真乃: 'Sakuragi.Mano',
  風野灯織: 'Kazano.Hiori',
  八宮めぐる: 'Hachimiya.Meguru',
  月岡恋鐘: 'Tsukioka.Kogane',
  田中摩美々: 'Tanaka.Mamimi',
  白瀬咲耶: 'Shirase.Sakuya',
  三峰結華: 'Mitsumine.Yuika',
  幽谷霧子: 'Yukoku.Kiriko',
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

// 卡片主题日文到罗马音映射（按照出现频率整理）
const themeMap = {
  // UR卡
  絵空靴: 'Ezoragutsu',
  誘爆ハートビート: 'Yubaku.Heartbeat',
  アマテラス: 'Amaterasu',

  // SSR卡主题（按角色分组）
  // 樱木真乃
  ほわっとスマイル: 'Howatto.Smile',
  はじけてスマイル: 'Hajikete.Smile',
  ソラを跳ねね: 'Sora.wo.Hanene',
  'ひとつ、はたたく': 'Hitotsu.Hatataku',
  きみと巡り行く: 'Kimi.to.Meguri.Yuku',

  // 风野灯织
  柔らかな微笑み: 'Yawarakana.Hohoemi',
  淡雪の戯れ: 'Awayuki.no.Tawamure',
  清閑に息をひそめて: 'Seikan.ni.Iki.wo.Hisomete',
  黒百合前で待ち合わせ: 'Kuroyuri.Mae.de.Machiawase',
  洸: 'Ko',
  キミと今旅立つ: 'Kimi.to.Ima.Tabidatsu',

  // 八宫惠
  金色の元気いっぱいガール: 'Kiniro.no.Genki.Ippai.Girl',
  シュカのまにまに: 'Shuka.no.Manimani',
  日々を紡ぐインヴェルノ: 'Hibi.wo.Tsumugu.Inverno',
  たまゆらフレーミング: 'Tamayura.Framing',
  こころレイヤリング: 'Kokoro.Layering',

  // 月冈恋钟
  ばりうまかブルース: 'Bariuma.Blues',
  風吹く丘にはよ来んね: 'Kaze.Fuku.Oka.ni.Hayo.Kinne',
  うちのリボンは恋結び: 'Uchi.no.Ribbon.wa.Koimusubi',
  'あなたと、月の満ちる頃': 'Anata.to.Tsuki.no.Michiru.Koro',
  よか匂いのする陽気やけん: 'Yoka.Nioi.no.Suru.Yoki.Yaken',
  純雪エモーショナル: 'Junsetsu.Emotional',

  // 田中摩美美
  トリッキーナイト: 'Tricky.Night',
  '魔的・アンチテーゼ': 'Mateki.Antithese',
  '真・TRAVELER': 'Shin.TRAVELER',
  'アバウト・ナイト・ライト': 'About.Night.Light',
  'リバーシブル・トースト': 'Reversible.Toast',
  まみみスイッチ: 'Mamimi.Switch',

  // 白濑咲耶
  紺碧のボーダーライン: 'Konpeki.no.Borderline',
  幸福のリズム: 'Kofuku.no.Rhythm',
  乙女と交わすTrick: 'Otome.to.Kawasu.Trick',
  渦と淵: 'Uzu.to.Fuchi',
  私をときめかせて: 'Watashi.wo.Tokimekasete',
  落ちる音がする: 'Ochiru.Oto.ga.Suru',

  // 三峰结华
  'お試し/みつゴコロ': 'Otameshi.Mitsu.Gokoro',
  それなら目をつぶりましょう: 'Sorenara.Me.wo.Tsuburimasho',
  雨に祝福: 'Ame.ni.Shukufuku',
  '♡コメディ': 'Heart.Comedy',
  'kaleidoscope-pinball': 'Kaleidoscope.Pinball',
  'ノー・ライフ': 'No.Life',

  // 幽谷雾子
  '霧・音・燦・燦': 'Kiri.Oto.San.San',
  '夕・音・鳴・鳴': 'Yu.Oto.Mei.Mei',
  '菜・菜・輪・舞': 'Na.Na.Rin.Bu',
  かぜかんむりのこどもたち: 'Kaze.Kanmuri.no.Kodomotachi',
  '窓・送・巡・歌': 'So.So.Jun.Ka',
  '白・架・祝・幻': 'Haku.Ka.Shuku.Gen',

  // 小宫果穗
  第2形態アーマードタイプ: 'Dai2.Keitai.Armored.Type',
  '新装備・バブルバスター！': 'Shinshobi.Bubble.Buster',
  潮騒のシーショア: 'Shiosai.no.Seashore',
  'フルスロットルエイジ！': 'Full.Throttle.Age',
  'スノードーム・シンドローム': 'Snow.Dome.Syndrome',
  '両手にLUCK！': 'Ryote.ni.LUCK',

  // 园田智代子
  'ちょこ色×きらきらロマン': 'Choco.Iro.Kirakira.Roman',
  'あそ→と♡ちよこれいと': 'Aso.to.Heart.Chiyokoreito',
  "You're My Dream": 'Youre.My.Dream',
  '砂糖づけ・ビターエンド': 'Satoduke.Bitter.End',
  うつくしいあした: 'Utsukushii.Ashita',
  'Kn☆cking.Kn☆cking.': 'Knocking.Knocking',

  // 西城树里
  ラムネ色の覚悟: 'Ramune.Iro.no.Kakugo',
  曲がり角のランウェイ: 'Magarikado.no.Runway',
  秋陽のスケッチ: 'Akihi.no.Sketch',
  'I・OWE・U': 'I.OWE.U',
  '花染む街で、君と': 'Hanasomeru.Machi.de.Kimi.to',

  // 杜野凛世
  杜野凛世の印象派: 'Morino.Rinze.no.Inshoha',
  凛世花伝: 'Rinze.Kaden',
  水色感情: 'Mizuiro.Kanjo',
  'ロー・ポジション': 'Low.Position',
  硝子少女: 'Garasu.Shojo',
  片恋はあと: 'Katakoi.wa.Ato',

  // 有栖川夏叶
  アルティメットマーメイド: 'Ultimate.Mermaid',
  メイドインナツハ: 'Made.in.Natsuha',
  '♡AKQJ10': 'Heart.AKQJ10',
  Fall: 'Fall',
  'Birdy Buddy': 'Birdy.Buddy',

  // 大崎甘奈
  スタンバイオッケー: 'Standby.OK',
  ゆらゆらアクアリウム: 'Yurayura.Aquarium',
  '叶えて☆ゴールドフィッシュ': 'Kanaete.Goldfish',
  longing: 'Longing',
  すれちがいシアター: 'Surechigai.Theater',

  // 大崎甜花
  '事務所。静寂。大輪の華': 'Jimusho.Seijaku.Dairin.no.Hana',
  'I♡DOLL': 'I.Heart.DOLL',
  'BON・BON・DAY！': 'BON.BON.DAY',
  'バス・タイムの気分で': 'Bath.Time.no.Kibun.de',
  '甜der Dream Show': 'Ten.der.Dream.Show',

  // 桑山千雪
  'マイ・ピュア・ロマンス': 'My.Pure.Romance',
  'シークレット・ヒロイン': 'Secret.Heroine',
  'はるかぜまち、1番地': 'Harukaze.Machi.1.Banchi',
  つよがりのためのララバイ: 'Tsuyogari.no.Tame.no.Lullaby',
  '剥がされて、虚ろ': 'Hagasarete.Utsuro',

  // 芹泽朝日
  'ジャンプ！スタッグ！！！': 'Jump.Stag',
  不機嫌なテーマパーク: 'Fukigen.na.Theme.Park',
  光は光へ: 'Hikari.wa.Hikari.e',
  'ムーンライト・ガーデン': 'Moonlight.Garden',

  // 黛冬优子
  'オ♡フ♡レ♡コ': 'O.Heart.Fu.Heart.Re.Heart.Ko',
  'starring F': 'Starring.F',
  'ノンセンス・プロンプ': 'Nonsense.Prompt',
  'ア・冬優子イズム': 'A.Fuyuko.Ism',

  // 和泉爱依
  'ちょっとあげる～': 'Chotto.Ageru',
  'メイ・ビー': 'May.Be',
  今のうちは走らない: 'Ima.no.Uchi.wa.Hashiranai',
  うちと幸せ: 'Uchi.to.Shiawase',
  'あたし・マスト': 'Atashi.Must',

  // 浅倉透
  '10個、光': '10ko.Hikari',
  夜はなにいろ: 'Yoru.wa.Nani.Iro',
  雪あたりの季節: 'Yuki.Atari.no.Kisetsu',

  // 樋口円香
  カラカラカラ: 'Karakara.Kara',
  オイサラバエル: 'Oisaraba.Eru',
  'フリークス・アリー': 'Freaks.Alley',

  // 福丸小糸
  ポシェットの中には: 'Pochette.no.Naka.niwa',
  てのひらの答え: 'Tenohira.no.Kotae',
  なつやすみ学校: 'Natsuyasumi.Gakko',
  恋をあげて: 'Koi.wo.Agete',

  // 市川雏菜
  'HAPPY-!NG': 'HAPPY.NG',
  '♡LOG': 'Heart.LOG',
  'S!GNATURE': 'SIGNATURE',
  'Keep→it up♡': 'Keep.it.up.Heart',

  // 七草にちか
  '♡まっしろはムウサギ♡': 'Heart.Masshiro.wa.Muusagi.Heart',
  夜よこノ窓は塗らないデ: 'Yoru.yoko.no.Mado.wa.Nuranainde',
  '伝えて niiid U': 'Tsutaete.niiid.U',
  '受けトルの sun Q': 'Uketoru.no.sun.Q',

  // 绯田美琴
  ROUNDLY: 'ROUNDLY',
  CHILLY: 'CHILLY',

  // 斑鸠卢卡
  'broken shout': 'Broken.Shout',

  // 铃木羽那
  'Eyes On You': 'Eyes.On.You',

  // 郁田晴树
  Hopeland: 'Hopeland',

  // SR卡
  ぐうぜんBOOKS: 'Guzen.BOOKS',
  花結びゆくゆく: 'Hana.Musubi.Yukuyuku',
  手作りの心遣い: 'Tezukuri.no.Kokorozukai',
  落下予測地点: 'Rakka.Yosoku.Chiten',
  小さな夜のトロイメライ: 'Chiisana.Yoru.no.Traumerei',
  チエルアルコは流星の: 'Cielarco.wa.Ryusei.no',
  ばってん長崎恋岬: 'Batten.Nagasaki.Koimisaki',
  'ビ～♡バップ海岸': 'Bee.Heart.Bop.Kaigan',
  裏腹あまのじゃく: 'Urahara.Amanojaku',
  そのまみみ無気力につき: 'Sonomamimi.Mukiryoku.nitsuki',
  秘めやかファンサービス: 'Himeyaka.Fan.Service',
  真紅一輪: 'Shinku.Ichirin',
  カラフルメタモルフォーゼ: 'Colorful.Metamorphose',
  '雨色、上機嫌': 'Ameiro.Jokigen',
  '包・帯・組・曲': 'Ho.Tai.Kumi.Kyoku',
  '伝・伝・心・音': 'Den.Den.Shin.On',
  '白・白・白・祈': 'Haku.Haku.Haku.Inori',
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
  '気になる！？染めちゃう！？': 'Ki.ni.naru.Somechau',
  'おかえり、ギター': 'Okaeri.Guitar',
  カラメル: 'Caramel',
  'Makeup♡Box': 'Makeup.Heart.Box',
  泣けよ洗濯機: 'Nakeyo.Sentakuki',
  MANNEQUIN: 'MANNEQUIN',
  'Blind Driver': 'Blind.Driver',
  優You: 'Yu.You',
  漂白花火: 'Hyohaku.Hanabi',
  白いツバサ: 'Shiroi.Tsubasa',
};

console.log('====================================================');
console.log('🔄 角色卡面重命名为罗马音');
console.log('====================================================');
console.log(`目标文件夹: ${targetDir}`);
console.log('====================================================');
console.log('');

// 获取所有文件
const files = fs.readdirSync(targetDir);
console.log(`📁 找到 ${files.length} 个文件`);
console.log('');

let renamedCount = 0;
let errorCount = 0;

files.forEach(file => {
  const fullPath = path.join(targetDir, file);
  const ext = path.extname(file);
  const nameWithoutExt = path.basename(file, ext);

  // 检查是否是觉醒版 (+)
  const isAwakened = nameWithoutExt.endsWith('+');
  const cleanName = isAwakened ? nameWithoutExt.slice(0, -1) : nameWithoutExt;

  // 拆分主题和角色名
  const parts = cleanName.split(' ');
  if (parts.length < 2) {
    console.log(`⚠️ 跳过（格式不对）: ${file}`);
    errorCount++;
    return;
  }

  const theme = parts.slice(0, -1).join(' '); // 主题可能有空格
  const character = parts[parts.length - 1]; // 最后一个是角色名

  // 查找映射
  const themeRoman = themeMap[theme];
  const characterRoman = characterMap[character];

  if (!themeRoman || !characterRoman) {
    console.log(`❌ 映射未找到: 主题="${theme}" 角色="${character}"`);
    errorCount++;
    return;
  }

  // 生成新文件名
  const awakenedSuffix = isAwakened ? '+' : '';
  const newName = `${themeRoman}_${characterRoman}${awakenedSuffix}${ext.toLowerCase()}`;
  const newPath = path.join(targetDir, newName);

  // 重命名
  try {
    fs.renameSync(fullPath, newPath);
    console.log(`✅ ${file} → ${newName}`);
    renamedCount++;
  } catch (err) {
    console.log(`❌ 重命名失败: ${file}`);
    console.log(`   错误: ${err.message}`);
    errorCount++;
  }
});

console.log('');
console.log('====================================================');
console.log('📊 统计信息');
console.log('====================================================');
console.log(`  ✅ 成功重命名: ${renamedCount} 个文件`);
console.log(`  ❌ 失败/跳过: ${errorCount} 个文件`);
console.log('');
console.log('✅ 完成！');

