// Hình minh họa nhanh bằng emoji cho từ cụ thể (không cần mạng, hiện tức thì).
const RAW = `
apple 🍎|banana 🍌|orange 🍊|lemon 🍋|grape 🍇|strawberry 🍓|watermelon 🍉|peach 🍑|pear 🍐|cherry 🍒|pineapple 🍍|mango 🥭|coconut 🥥|fruit 🍎|vegetable 🥦|carrot 🥕|potato 🥔|tomato 🍅|onion 🧅|garlic 🧄|corn 🌽|pepper 🌶️|mushroom 🍄|salad 🥗|bread 🍞|cheese 🧀|egg 🥚|milk 🥛|butter 🧈|rice 🍚|noodle 🍜|soup 🍲|pizza 🍕|burger 🍔|sandwich 🥪|cake 🍰|cookie 🍪|chocolate 🍫|candy 🍬|ice 🧊|coffee ☕|tea 🍵|water 💧|juice 🧃|beer 🍺|wine 🍷|meat 🥩|chicken 🍗|fish 🐟|shrimp 🦐|salt 🧂|sugar 🍬|oil 🛢️|honey 🍯|breakfast 🍳|lunch 🍱|dinner 🍽️|meal 🍽️|ingredient 🧂|recipe 📖|cook 🍳|bake 🍞|kitchen 🍳|restaurant 🍽️|menu 📋|knife 🔪|fork 🍴|spoon 🥄|plate 🍽️|cup 🥤|bottle 🍼
dog 🐶|cat 🐱|bird 🐦|horse 🐴|cow 🐮|pig 🐷|sheep 🐑|rabbit 🐰|mouse 🐭|lion 🦁|tiger 🐯|elephant 🐘|monkey 🐒|bear 🐻|snake 🐍|duck 🦆|frog 🐸|butterfly 🦋|bee 🐝|spider 🕷️|turtle 🐢|whale 🐋|dolphin 🐬|shark 🦈|animal 🐾|tree 🌳|flower 🌸|rose 🌹|grass 🌱|leaf 🍃|forest 🌲|mountain ⛰️|river 🏞️|lake 🏞️|sea 🌊|ocean 🌊|beach 🏖️|island 🏝️|desert 🏜️|garden 🌷|farm 🚜|
sun ☀️|moon 🌙|star ⭐|cloud ☁️|rain 🌧️|snow ❄️|wind 💨|storm ⛈️|thunder ⚡|lightning ⚡|rainbow 🌈|fire 🔥|earth 🌍|weather 🌤️|temperature 🌡️|summer ☀️|winter ❄️|spring 🌸|autumn 🍂|umbrella ☂️
house 🏠|home 🏠|room 🚪|door 🚪|window 🪟|bed 🛏️|bedroom 🛏️|bathroom 🛁|chair 🪑|table 🍽️|sofa 🛋️|lamp 💡|key 🔑|clock 🕒|mirror 🪞|stairs 🪜|roof 🏠|wall 🧱|floor 🧹|garden 🌷|building 🏢|apartment 🏢|school 🏫|hospital 🏥|bank 🏦|hotel 🏨|shop 🛍️|store 🏬|market 🛒|library 📚|church ⛪|castle 🏰|bridge 🌉|street 🛣️|road 🛣️|city 🏙️|village 🏘️
car 🚗|bus 🚌|train 🚆|plane ✈️|airport 🛫|bike 🚲|bicycle 🚲|motorbike 🏍️|boat 🚤|ship 🚢|taxi 🚕|truck 🚚|ticket 🎫|passport 🛂|luggage 🧳|map 🗺️|traffic 🚦|station 🚉|travel 🧳|trip 🧳|journey 🧳|petrol ⛽|
book 📖|pen 🖊️|pencil ✏️|paper 📄|notebook 📓|desk 🪑|teacher 🧑‍🏫|student 🎓|classroom 🏫|homework 📝|exam 📝|test 📝|library 📚|dictionary 📖|letter ✉️|email 📧|phone 📱|telephone ☎️|computer 💻|laptop 💻|keyboard ⌨️|screen 🖥️|camera 📷|photo 📸|video 🎬|music 🎵|song 🎶|film 🎬|movie 🎬|internet 🌐|website 🌐|message 💬|printer 🖨️|battery 🔋
doctor 🧑‍⚕️|nurse 👩‍⚕️|medicine 💊|pill 💊|health 💪|pain 🤕|sick 🤒|fever 🤒|dentist 🦷|tooth 🦷|blood 🩸|heart ❤️|brain 🧠|eye 👁️|ear 👂|nose 👃|mouth 👄|hand ✋|foot 🦶|leg 🦵|arm 💪|head 🗣️|face 🙂|hair 💇|body 🧍|
baby 👶|child 🧒|man 👨|woman 👩|boy 👦|girl 👧|mother 👩|father 👨|brother 👦|sister 👧|grandmother 👵|grandfather 👴|family 👪|friend 🤝|husband 🤵|wife 👰|
shirt 👕|dress 👗|shoes 👟|shoe 👟|hat 🧢|coat 🧥|jacket 🧥|pants 👖|jeans 👖|sock 🧦|glasses 👓|bag 👜|watch ⌚|ring 💍|clothes 👚|
money 💰|coin 🪙|price 🏷️|sale 🏷️|gift 🎁|credit 💳|bill 🧾|salary 💵|office 🏢|manager 👔|meeting 🤝|report 📊|project 📁|company 🏢|business 💼|job 💼|interview 🎤|contract 📄|calendar 📅|deadline ⏰|
ball ⚽|football ⚽|basketball 🏀|tennis 🎾|game 🎮|sport 🏅|swim 🏊|run 🏃|walk 🚶|sleep 😴|eat 🍴|drink 🥤|read 📖|write ✍️|sing 🎤|dance 💃|laugh 😂|cry 😢|smile 😊|love ❤️|angry 😠|happy 😊|sad 😢|tired 🥱|hungry 🍽️|afraid 😨|scared 😨|excited 🤩|bored 😐|surprised 😮|shy 🙈|kiss 💋|hug 🤗|
fire 🔥|gold 🥇|silver 🥈|flag 🚩|world 🌍|country 🏳️|time ⏰|hour ⏰|minute ⏱️|night 🌙|morning 🌅|day 📅|week 📆|month 📆|year 🎆|
`;
const MAP = {};
for (const part of RAW.split(/[|\n]/)) {
  const m = part.trim().match(/^([a-z' -]+?)\s+(\S+)$/i);
  if (m) MAP[m[1].toLowerCase()] = m[2];
}

/** Emoji minh họa cho từ (thử cả dạng số nhiều / -ing / -ed đơn giản); null nếu không có. */
export function emojiFor(word) {
  const w = String(word || '').trim().toLowerCase();
  if (!w) return null;
  if (MAP[w]) return MAP[w];
  const stems = [w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''), w.replace(/ing$/, ''), w.replace(/ed$/, '')];
  for (const s of stems) if (s !== w && MAP[s]) return MAP[s];
  return null;
}

export const EMOJI_COUNT = Object.keys(MAP).length;
