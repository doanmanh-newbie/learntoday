import unittest

from app.utils.word_level import tier_for, tier_for_word


class TierForTests(unittest.TestCase):
    def test_cefr_tiers(self):
        c = {'a': 'A1', 'b': 'A2', 'c': 'B1', 'abandon': 'B2'}
        self.assertEqual([tier_for(w, c, set()) for w in 'abc'], [1, 1, 2])
        self.assertEqual(tier_for('abandon', c, set()), 3)

    def test_nawl_only_is_4_and_cefr_wins(self):
        self.assertEqual(tier_for('thesis', {}, {'thesis'}), 4)
        self.assertEqual(tier_for('abandon', {'abandon': 'B2'}, {'abandon'}), 3)

    def test_case_unknown_empty(self):
        self.assertEqual(tier_for('ABANDON', {'abandon': 'B2'}, set()), 3)
        self.assertEqual(tier_for('zzz', {'a': 'A1'}, set()), 1)
        self.assertEqual(tier_for('', {}, set()), 1)
        self.assertEqual(tier_for(None, {}, set()), 1)

    def test_tier_for_word_without_data_files(self):
        from app.utils import word_level
        word_level._DATA = None
        word_level._DIR = '/nonexistent-dir'
        try:
            self.assertEqual(tier_for_word('abandon'), 1)
        finally:
            word_level._DATA = None
            word_level._DIR = word_level.DEFAULT_DIR


class BackfillTests(unittest.TestCase):
    def test_idempotent_in_memory(self):
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts'))
        from sqlalchemy import Column, DateTime, Integer, String, create_engine
        from sqlalchemy.orm import declarative_base, sessionmaker
        from app.utils import word_level
        import backfill_difficulty as bf
        Base = declarative_base()

        class W(Base):
            __tablename__ = 'w'
            id = Column(Integer, primary_key=True)
            word = Column(String)
            difficulty = Column(Integer, default=1)
            deleted_at = Column(DateTime)

        eng = create_engine('sqlite://')
        Base.metadata.create_all(eng)
        s = sessionmaker(bind=eng)()
        s.add_all([W(word='abandon', difficulty=1), W(word='thesis', difficulty=3), W(word='x', difficulty=2)])
        s.commit()
        word_level._DATA = ({'abandon': 'B2'}, {'thesis'})
        try:
            first = bf.backfill(s, W)
            second = bf.backfill(s, W)
        finally:
            word_level._DATA = None
        self.assertEqual(first, second)
        self.assertEqual(dict(first), {3: 1, 4: 1, 1: 1})
        self.assertEqual({w.word: w.difficulty for w in s.query(W)}, {'abandon': 3, 'thesis': 4, 'x': 1})


if __name__ == '__main__':
    unittest.main()
