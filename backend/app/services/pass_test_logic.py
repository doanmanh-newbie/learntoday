"""STT 16 - Nội dung + chấm bài kiểm tra Pass. Thuần Python (không đụng database) để dễ kiểm thử."""


# 4 bài đọc hiểu (200-300 từ, trình độ khoảng B1-B2) xoay vòng theo mốc: mốc 50, 100, 150, 200 dùng bài khác nhau, mốc 250 quay lại bài đầu.
# Mỗi câu hỏi có: question, options (4 lựa chọn), correct_index, evidence (đoạn nguyên văn trong bài làm căn cứ - có test kiểm tra)
# và explanation (giải thích ngắn bằng tiếng Việt, chỉ hiện SAU khi nộp bài). Vị trí đáp án đúng được rải đều 0-3.
PASSAGES = [
    {
        'title': 'Why We Need Sleep',
        'paragraphs': [
            'Most adults need between seven and nine hours of sleep each night, yet many people sleep much less. Scientists once '
            'believed that the brain simply switches off during sleep. Today we know the opposite is true. While we rest, the brain '
            'is busy sorting the information we collected during the day. It keeps what seems important and quietly throws away what '
            'does not. This is one reason why students who sleep well after studying often remember more than students who stay up '
            'all night.',
            'Sleep also protects the body. During deep sleep, the heart rate slows down and the body repairs small injuries. People who '
            'regularly sleep fewer than six hours are more likely to catch colds, gain weight, and feel anxious. Lack of sleep also '
            'slows reaction time. In one famous experiment, volunteers who had been awake for eighteen hours drove as badly as people '
            'who had been drinking alcohol.',
            'Experts offer several simple tips for better sleep. Go to bed and wake up at the same time every day, even at weekends. '
            'Keep the bedroom dark, cool, and quiet. Avoid coffee in the afternoon, because caffeine can stay in the body for up to '
            'eight hours. Finally, put your phone away at least thirty minutes before bed, since the bright screen tells the brain '
            'that it is still daytime.',
            'Sleep is not a waste of time. It is one of the most useful things we do for our health, our memory, and our mood.',
        ],
        'questions': [
            {'question': 'What is the main idea of the passage?',
             'options': ['Sleep is important for the brain and the body', 'Students should study all night to remember more', 'Caffeine is the most dangerous drug for adults', 'Phones are the main cause of most illnesses'],
             'correct_index': 0, 'evidence': 'Sleep is not a waste of time.',
             'explanation': 'Cả bài nói về lợi ích của giấc ngủ đối với trí nhớ, cơ thể và tâm trạng; câu kết khẳng định ngủ không phải là lãng phí thời gian.'},
            {'question': 'According to the passage, what does the brain do while we sleep?',
             'options': ['It switches off completely until morning', 'It sorts the information from the day', 'It forgets everything we learned that day', 'It stops repairing the body at night'],
             'correct_index': 1, 'evidence': 'the brain is busy sorting the information we collected during the day',
             'explanation': 'Đoạn 1: khi ngủ, não bận sắp xếp thông tin thu thập trong ngày (trái với quan niệm cũ rằng não "tắt").'},
            {'question': 'How long can caffeine stay in the body?',
             'options': ['Up to eighteen hours', 'About thirty minutes', 'Exactly one day', 'Up to eight hours'],
             'correct_index': 3, 'evidence': 'caffeine can stay in the body for up to eight hours',
             'explanation': 'Đoạn 3: caffeine có thể ở trong cơ thể tới tám giờ, nên nên tránh cà phê vào buổi chiều. "Mười tám giờ" là thời gian các tình nguyện viên thức trong thí nghiệm.'},
            {'question': 'Why does the writer mention the driving experiment?',
             'options': ['To prove that driving at night improves your sleep', 'To advise people to drive less when they are tired', 'To show that tiredness can be as dangerous as alcohol', 'To explain how caffeine changes the way we drive'],
             'correct_index': 2, 'evidence': 'drove as badly as people who had been drinking alcohol',
             'explanation': 'Người thức 18 giờ lái xe tệ như người đã uống rượu: tác giả dùng ví dụ này để cho thấy thiếu ngủ nguy hiểm thế nào.'},
            {'question': 'In the passage, the word "anxious" is closest in meaning to:',
             'options': ['sleepy', 'worried', 'hungry', 'proud'],
             'correct_index': 1, 'evidence': 'gain weight, and feel anxious',
             'explanation': '"Anxious" nghĩa là lo lắng, bồn chồn, gần nhất với "worried".'},
        ],
    },
    {
        'title': 'Bicycles in the City',
        'paragraphs': [
            'In the 1960s many cities made a simple decision: cars came first. Wide roads were built, and cyclists were told to take '
            'care of themselves. The result was heavy traffic, noisy streets, and dirty air. Today, a growing number of cities are '
            'changing direction.',
            'Copenhagen is often described as the best example. Nearly half of its residents ride a bicycle to work or school every '
            'day. The city has built about four hundred kilometres of separate bike lanes, so cyclists do not have to share the road '
            'with cars. Traffic lights are timed to suit bicycles, which means a rider moving at a normal speed can pass through many '
            'green lights in a row.',
            'The benefits go beyond fewer cars. Cycling is cheap, because a bicycle costs much less than a car and needs no petrol. It '
            'keeps people fit, so the city spends less on health care. Shops also report that cyclists visit more often than drivers, '
            'even though they buy less each time.',
            'Of course, there are challenges. In hot or rainy weather, fewer people ride. Hills make cycling difficult in some places, '
            'and thieves steal thousands of bicycles every year. Some cities have answered these problems with electric bikes, covered '
            'parking, and cheap rental schemes.',
            'Planners agree on one lesson: people will only cycle when it feels safe. Painting a line on the road is not enough. Real '
            'change needs protected lanes, clear rules, and the patience to wait for habits to change.',
        ],
        'questions': [
            {'question': 'What is the passage mainly about?',
             'options': ['Why cars are still better than bicycles in cities', 'How the bicycle was invented and developed over time', 'How to repair a bicycle at home without tools', 'How some cities are making cycling easier and safer'],
             'correct_index': 3, 'evidence': 'a growing number of cities are changing direction',
             'explanation': 'Bài nêu ví dụ Copenhagen, lợi ích của xe đạp và cách các thành phố giải quyết khó khăn để khuyến khích đi xe đạp.'},
            {'question': 'Why do cyclists in Copenhagen not have to share the road with cars?',
             'options': ['The city has built separate bike lanes', 'Cars are not allowed anywhere in the city', 'Cyclists are only allowed to ride at night', 'There are very few cars in Copenhagen'],
             'correct_index': 0, 'evidence': 'separate bike lanes, so cyclists do not have to share the road with cars',
             'explanation': 'Đoạn 2: thành phố đã xây khoảng 400 km làn đường riêng cho xe đạp.'},
            {'question': 'According to the passage, which statement about shops is true?',
             'options': ['Drivers visit shops far more often than cyclists do', 'Cyclists never buy anything when they visit a shop', 'Cyclists come more often but spend less each time', 'Shops prefer to be located far from bike lanes'],
             'correct_index': 2, 'evidence': 'cyclists visit more often than drivers, even though they buy less each time',
             'explanation': 'Đoạn 3: người đi xe đạp ghé cửa hàng thường xuyên hơn nhưng mỗi lần mua ít hơn.'},
            {'question': 'What does the writer suggest about painting a line on the road for cyclists?',
             'options': ['It is the cheapest solution and works well', 'It does not make cycling feel safe enough', 'It is illegal in most cities', 'It is only needed in hot weather'],
             'correct_index': 1, 'evidence': 'Painting a line on the road is not enough.',
             'explanation': 'Đoạn cuối: chỉ sơn một vạch trên đường là chưa đủ; cần làn đường được bảo vệ, luật rõ ràng và thời gian để thói quen thay đổi.'},
            {'question': 'In the passage, the word "challenges" is closest in meaning to:',
             'options': ['problems', 'rewards', 'prices', 'rules'],
             'correct_index': 0, 'evidence': 'Of course, there are challenges.',
             'explanation': '"Challenges" ở đây là những khó khăn (thời tiết, đồi dốc, trộm xe), gần nhất với "problems".'},
        ],
    },
    {
        'title': 'The Journey of Coffee',
        'paragraphs': [
            'Coffee is now one of the most traded products in the world, but its story began with a goat. According to a popular legend, '
            'a farmer in Ethiopia noticed that his goats became unusually lively after eating the red berries of a certain bush. He '
            'tried the berries himself and felt full of energy. Whether or not the story is true, historians agree that coffee was '
            'first grown in East Africa.',
            'By the fifteenth century, coffee had crossed the sea to Yemen, where people drank it at night to stay awake during '
            'religious ceremonies. Soon coffee houses opened in cities across the Middle East. They became popular places to listen to '
            'music, play chess, and discuss the news, and some people called them "schools of the wise".',
            'Coffee reached Europe in the seventeenth century. At first, some church leaders worried about the strange black drink, but '
            'after trying it, the Pope is said to have approved. Coffee houses in London charged only a penny for a cup, so almost anyone '
            'could afford to go in, and they were nicknamed "penny universities". Many business deals were made there, and one famous '
            'insurance company began in a coffee house.',
            'Today, coffee is grown in more than seventy countries near the equator. Growing it takes great care. Each tree produces only '
            'about half a kilogram of beans a year, and most berries are still picked by hand. This is why many farmers ask for fair prices, '
            'and why more shoppers now check where their coffee comes from.',
        ],
        'questions': [
            {'question': 'What is the passage mainly about?',
             'options': ['How to make the perfect cup of coffee at home', 'Why goats are so important to coffee farmers', 'How coffee spread around the world over time', 'The best countries for growing the finest coffee'],
             'correct_index': 2, 'evidence': 'coffee was first grown in East Africa',
             'explanation': 'Bài kể hành trình của cà phê: từ Đông Phi, sang Yemen, Trung Đông, châu Âu rồi nhiều quốc gia trồng cà phê ngày nay.'},
            {'question': 'According to the legend, how did the farmer discover coffee?',
             'options': ['A traveller from Yemen gave him some roasted beans', 'He watched a monk drinking it during a ceremony', 'He found it being served in a busy coffee house', 'His goats became lively after eating the berries'],
             'correct_index': 3, 'evidence': 'his goats became unusually lively after eating the red berries',
             'explanation': 'Đoạn 1: những con dê trở nên rất hoạt bát sau khi ăn quả đỏ của cây cà phê, người nông dân thử ăn và thấy tràn đầy năng lượng.'},
            {'question': 'Why were London coffee houses nicknamed "penny universities"?',
             'options': ['Students had to pay a penny to attend lessons', 'Entry was cheap: a cup cost only a penny', 'They were owned by famous English universities', 'They sold only coins and books to students'],
             'correct_index': 1, 'evidence': 'charged only a penny for a cup, so almost anyone could afford to go in',
             'explanation': 'Đoạn 3: một tách chỉ giá một penny nên hầu như ai cũng vào được; vì thế quán được gọi là "đại học một penny".'},
            {'question': 'Why do many coffee farmers ask for fair prices?',
             'options': ['Each tree gives little and growing it takes care', 'Coffee is no longer popular with shoppers in Europe', 'Coffee trees can only be grown in one country', 'They want to sell their goats instead of beans'],
             'correct_index': 0, 'evidence': 'Each tree produces only about half a kilogram of beans a year',
             'explanation': 'Đoạn cuối: trồng cà phê rất công phu, mỗi cây chỉ cho khoảng nửa ký hạt mỗi năm và phần lớn quả vẫn hái bằng tay.'},
            {'question': 'In the passage, the word "lively" is closest in meaning to:',
             'options': ['very tired', 'dangerous', 'full of energy', 'quiet'],
             'correct_index': 2, 'evidence': 'goats became unusually lively',
             'explanation': '"Lively" nghĩa là sôi nổi, đầy sức sống, gần nhất với "full of energy" (câu sau nói người nông dân cũng thấy "full of energy").'},
        ],
    },
    {
        'title': 'Learning a Language as an Adult',
        'paragraphs': [
            'Many people believe that only children can learn a new language well. It is true that young children often speak with a '
            'more natural accent. However, research shows that adults have several advantages that children do not.',
            'First, adults understand how language works. They already know what a verb is, and they can compare new grammar with the '
            'rules of their own language. Second, adults can choose what to learn. A nurse can study words for hospitals, and an '
            'engineer can focus on technical vocabulary, so every hour of study is useful. Third, adults are better at planning. They '
            'can set goals, build a routine, and use tools such as spaced repetition to review words just before they forget them.',
            'Of course, adults also face difficulties. They have less free time, and they often feel embarrassed about making mistakes. '
            'Many give up after a few weeks because they expect fast results. Teachers advise learners to practise a little every day '
            'instead of studying for many hours once a week. Twenty minutes a day is better than a long lesson on Sunday.',
            'Speaking is the skill that most adults avoid, yet it is the fastest way to improve. Talking with a partner, joining a club, '
            'or recording your own voice all help you notice mistakes. Remember that every fluent speaker was once a beginner who was '
            'brave enough to try.',
        ],
        'questions': [
            {'question': "What is the writer's main point?",
             'options': ['Children always learn languages faster than any adult', 'Adults can learn well and have their own advantages', 'Speaking is the least important language skill', 'Teachers should give longer lessons every week'],
             'correct_index': 1, 'evidence': 'adults have several advantages that children do not',
             'explanation': 'Tác giả phản bác quan niệm "chỉ trẻ em mới học tốt" bằng cách nêu các lợi thế của người lớn.'},
            {'question': 'Which advantage of adults is NOT mentioned in the passage?',
             'options': ['They can choose useful vocabulary', 'They understand how grammar works', 'They have more free time than children', 'They are better at planning their study'],
             'correct_index': 2, 'evidence': 'They have less free time',
             'explanation': 'Bài nói người lớn có ÍT thời gian rảnh hơn (đó là khó khăn), nên "nhiều thời gian rảnh hơn" không phải lợi thế được nêu.'},
            {'question': 'What do teachers advise learners to do?',
             'options': ['Practise a little every day', 'Study for many hours once a week', 'Avoid speaking until they are fluent', 'Learn only grammar'],
             'correct_index': 0, 'evidence': 'Teachers advise learners to practise a little every day',
             'explanation': 'Đoạn 3: nên luyện một chút mỗi ngày (20 phút/ngày tốt hơn một buổi dài vào Chủ nhật).'},
            {'question': 'Why do many adults give up after a few weeks?',
             'options': ['The lessons are too cheap', 'They already speak fluently', 'Their teachers are too strict', 'They expect fast results'],
             'correct_index': 3, 'evidence': 'Many give up after a few weeks because they expect fast results.',
             'explanation': 'Đoạn 3: nhiều người bỏ cuộc sau vài tuần vì kỳ vọng thấy kết quả nhanh.'},
            {'question': 'In the passage, the word "embarrassed" is closest in meaning to:',
             'options': ['uncomfortable and shy', 'very angry', 'completely sure', 'extremely tired'],
             'correct_index': 0, 'evidence': 'they often feel embarrassed about making mistakes',
             'explanation': '"Embarrassed" nghĩa là ngượng, bối rối, gần nhất với "uncomfortable and shy".'},
        ],
    },
]


def get_passage_for_milestone(milestone: int):
    """Bài đọc hiểu cho mốc `milestone` (50, 100, 150...). Xoay vòng 4 bài nên các mốc liên tiếp không trùng bài.
    Trả về dict có passage (các đoạn cách nhau bằng dòng trống), questions kèm đáp án và giải thích (GỬI CHO CLIENT
    phải qua public_test()), time_limit_minutes."""
    data = PASSAGES[(max(int(milestone), 50) // 50 - 1) % len(PASSAGES)]
    return {
        'title': data['title'],
        'passage': '\n\n'.join(data['paragraphs']),
        'questions': [{'id': f'q{i}', **q} for i, q in enumerate(data['questions'], 1)],
        'time_limit_minutes': 15,
    }


# Các trường CHỈ được gửi cho client SAU KHI nộp bài (đáp án + giải thích). Trước đây GET trả luôn cả hai nên
# ai mở DevTools cũng thấy đáp án.
_ANSWER_FIELDS = ('correct_index', 'explanation', 'evidence')


def public_test(test_data: dict) -> dict:
    """Bản dành cho client lúc làm bài: không có đáp án đúng và không có giải thích."""
    return {
        **{k: v for k, v in test_data.items() if k != 'questions'},
        'questions': [{k: v for k, v in q.items() if k not in _ANSWER_FIELDS} for q in test_data['questions']],
    }


def grade_test(test_data: dict, answers):
    """Chấm bài ở server. `answers` = {question_id: chỉ_số_đáp_án}. Giá trị sai kiểu/ngoài phạm vi tính là sai
    (bool không được coi là số: True == 1 trong Python). Trả (số_câu_đúng, kết_quả_từng_câu)."""
    answers = answers if isinstance(answers, dict) else {}
    correct, results = 0, []
    for q in test_data['questions']:
        picked = answers.get(q['id'])
        valid = type(picked) is int and 0 <= picked < len(q['options'])
        is_correct = valid and picked == q['correct_index']
        correct += is_correct
        results.append({
            'question_id': q['id'],
            'correct': bool(is_correct),
            'correct_index': q['correct_index'],
            'explanation': q['explanation'],
        })
    return correct, results
