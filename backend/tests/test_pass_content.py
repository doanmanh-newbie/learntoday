"""Chất lượng nội dung bài kiểm tra Pass (thuần Python): độ dài, cấu trúc, đáp án rải đều, xoay vòng theo mốc."""
import collections
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import pass_test_logic as ptl  # noqa: E402


def text_of(p):
    return ' '.join(p['paragraphs'])


class PassContent(unittest.TestCase):
    def test_each_passage_is_200_to_300_words_as_the_spec_requires(self):
        for p in ptl.PASSAGES:
            words = len(text_of(p).split())
            self.assertTrue(200 <= words <= 300, f"{p['title']}: {words} từ")

    def test_at_least_four_distinct_passages(self):
        self.assertGreaterEqual(len(ptl.PASSAGES), 4)
        self.assertEqual(len({p['title'] for p in ptl.PASSAGES}), len(ptl.PASSAGES))
        self.assertEqual(len({text_of(p) for p in ptl.PASSAGES}), len(ptl.PASSAGES))

    def test_every_passage_has_five_well_formed_questions(self):
        for p in ptl.PASSAGES:
            self.assertEqual(len(p['questions']), 5, p['title'])
            for q in p['questions']:
                ctx = f"{p['title']}: {q['question']}"
                self.assertEqual(len(q['options']), 4, ctx)
                self.assertEqual(len({o.strip().lower() for o in q['options']}), 4, ctx)         # không có 2 lựa chọn giống nhau
                self.assertIn(q['correct_index'], range(4), ctx)
                self.assertGreaterEqual(len(q['explanation']), 20, ctx)
                self.assertTrue(q['question'].strip().endswith(('?', ':')), ctx)

    def test_evidence_is_quoted_from_the_passage_so_each_answer_can_be_checked(self):
        for p in ptl.PASSAGES:
            for q in p['questions']:
                self.assertIn(q['evidence'], text_of(p), f"{p['title']}: {q['question']}")

    def test_correct_answers_are_spread_over_all_four_positions(self):
        counts = collections.Counter(q['correct_index'] for p in ptl.PASSAGES for q in p['questions'])
        self.assertEqual(sorted(counts), [0, 1, 2, 3])
        self.assertGreaterEqual(min(counts.values()), 3)
        for p in ptl.PASSAGES:                                       # và không bài nào có tất cả đáp án cùng một vị trí
            self.assertGreaterEqual(len({q['correct_index'] for q in p['questions']}), 3, p['title'])

    def test_the_correct_option_is_never_the_longest_in_every_question(self):
        """Mẹo "chọn đáp án dài nhất" không được luôn đúng."""
        longer = [q for p in ptl.PASSAGES for q in p['questions'] if max(len(o) for o in q['options']) >= 15]   # bỏ câu từ vựng (đáp án 1 từ)
        longest = sum(1 for q in longer if max(range(4), key=lambda i: len(q['options'][i])) == q['correct_index'])
        self.assertLessEqual(longest, 8, f'đáp án đúng là lựa chọn dài nhất ở {longest}/{len(longer)} câu')

    def test_milestones_rotate_through_the_passages(self):
        titles = [ptl.get_passage_for_milestone(m)['title'] for m in (50, 100, 150, 200, 250, 300)]
        self.assertEqual(len(set(titles[:4])), 4)                    # 4 mốc đầu: 4 bài khác nhau
        self.assertEqual(titles[4], titles[0])                       # rồi quay vòng
        self.assertEqual(titles[5], titles[1])
        self.assertNotEqual(titles[0], titles[1])

    def test_unexpected_milestone_values_still_work(self):
        for m in (0, 1, 49, 51, 75, 10_000):
            data = ptl.get_passage_for_milestone(m)
            self.assertEqual(len(data['questions']), 5)

    def test_payload_shape(self):
        data = ptl.get_passage_for_milestone(100)
        self.assertEqual(data['time_limit_minutes'], 15)
        self.assertEqual([q['id'] for q in data['questions']], ['q1', 'q2', 'q3', 'q4', 'q5'])
        self.assertEqual(data['passage'].count('\n\n'), len(ptl.PASSAGES[1]['paragraphs']) - 1)
        self.assertTrue(data['title'])

    def test_no_question_depends_on_the_milestone_number(self):
        """Câu hỏi cũ "bài này mừng mốc nào?" không kiểm tra tiếng Anh. Nội dung phải giống nhau dù mốc nào, miễn cùng bài."""
        a, b = ptl.get_passage_for_milestone(50), ptl.get_passage_for_milestone(250)
        self.assertEqual(a, b)
        for p in ptl.PASSAGES:
            for q in p['questions']:
                self.assertNotRegex(q['question'].lower(), r'milestone|\b\d+ words\b')

    def test_client_copy_never_contains_answer_fields(self):
        for m in (50, 100, 150, 200):
            text = repr(ptl.public_test(ptl.get_passage_for_milestone(m)))
            for secret in ('correct_index', 'explanation', 'evidence'):
                self.assertNotIn(secret, text)

    def test_grading_every_passage(self):
        for m in (50, 100, 150, 200):
            data = ptl.get_passage_for_milestone(m)
            right = {q['id']: q['correct_index'] for q in data['questions']}
            self.assertEqual(ptl.grade_test(data, right)[0], 5)
            wrong = {k: (v + 1) % 4 for k, v in right.items()}
            self.assertEqual(ptl.grade_test(data, wrong)[0], 0)


if __name__ == '__main__':
    unittest.main()
