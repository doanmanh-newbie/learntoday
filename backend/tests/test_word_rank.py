from app.utils.word_rank import popularity_key, sort_by_popularity, builtin_ranks


def test_common_before_rare_and_unknown_by_length():
    words = ['ingredient', 'house', 'the', 'zebra', 'ox']
    out = sort_by_popularity(words)
    assert out.index('the') < out.index('house') < out.index('ingredient')
    assert out.index('ox') < out.index('zebra')


def test_real_freq_rank_wins():
    ranks = builtin_ranks()
    assert popularity_key('zebra', 5, ranks) < popularity_key('the', None, ranks)


def test_builtin_list_loads():
    assert len(builtin_ranks()) > 400
