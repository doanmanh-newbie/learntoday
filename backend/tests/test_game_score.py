import unicodedata
import unittest
from types import SimpleNamespace as W

from app.utils.game_score import (LIVES, MAX_ANSWERS, MIN_ANSWER_GAP_MS, RunError, max_score,
                                  points_for, score_run, tier_of)


def words(n=10):
    return {str(i): W(word=f'w{i}', meaning=f'lịch trình {i}', difficulty=1) for i in range(n)}


def ans(i, ok=True, d='en_vi', t=None):
    w = words()[str(i)]
    right = w.meaning if d == 'en_vi' else w.word
    return {'word_id': str(i), 'dir': d, 'choice': right if ok else 'zzz',
            't_ms': t if t is not None else (i + 1) * MIN_ANSWER_GAP_MS}


class GameScoreTest(unittest.TestCase):
    def test_points_for_tiers_and_streak_cap(self):
        self.assertEqual([points_for(1, 1), points_for(1, 2), points_for(1, 6), points_for(1, 50)], [10, 12, 20, 20])
        self.assertEqual([points_for(4, 1), points_for(4, 6)], [20, 30])

    def test_max_score_five_tier1_words_is_70(self):
        self.assertEqual(max_score([1] * 5), 70)
        self.assertEqual(max_score([4]), 20)

    def test_tier_of_clamps_and_defaults(self):
        self.assertEqual([tier_of(None), tier_of(0), tier_of(9), tier_of(3), tier_of('x')], [1, 1, 4, 3, 1])

    def test_score_run_marks_correct_by_direction(self):
        w = words()
        w['2'].difficulty = 4
        run = [ans(0), ans(1, d='vi_en'), ans(2, ok=False), ans(3)]
        self.assertEqual(score_run(run, w), {'score': 10 + 12 + 0 + 10, 'correct': 3, 'answered': 4})

    def test_score_run_unicode_and_case_insensitive(self):
        w = {'a': W(word='x', meaning='lịch trình', difficulty=1)}
        for c in ('LỊCH TRÌNH', unicodedata.normalize('NFD', 'lịch trình'), '  lịch   trình '):
            r = score_run([{'word_id': 'a', 'dir': 'en_vi', 'choice': c, 't_ms': 3000}], w)
            self.assertEqual(r['correct'], 1)

    def test_score_run_rejects(self):
        w = words()
        bad = {
            'unknown': [{**ans(0), 'word_id': 'nope'}],
            'dup': [ans(0), {**ans(0), 't_ms': 6000}],
            'not_increasing': [ans(0), ans(1, t=3000)],
            'gap': [ans(0), ans(1, t=ans(0)['t_ms'] + MIN_ANSWER_GAP_MS - 1)],
            'first_gap': [ans(0, t=MIN_ANSWER_GAP_MS - 1)],
            'dir': [{**ans(0), 'dir': 'x'}],
            'empty': [],
            'after_dead': [ans(i, ok=False) for i in range(LIVES + 1)],
        }
        for name, run in bad.items():
            with self.subTest(name), self.assertRaises(RunError) as cm:
                score_run(run, w)
            self.assertTrue(cm.exception.message)
        many = {str(i): W(word='a', meaning='b', difficulty=1) for i in range(MAX_ANSWERS + 1)}
        run = [{'word_id': str(i), 'dir': 'en_vi', 'choice': 'b', 't_ms': (i + 1) * MIN_ANSWER_GAP_MS}
               for i in range(MAX_ANSWERS + 1)]
        with self.assertRaises(RunError):
            score_run(run, many)

    def test_exactly_lives_wrong_is_ok(self):
        r = score_run([ans(i, ok=False) for i in range(LIVES)], words())
        self.assertEqual((r['score'], r['answered']), (0, LIVES))


if __name__ == '__main__':
    unittest.main()
