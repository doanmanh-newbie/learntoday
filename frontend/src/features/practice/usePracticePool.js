import { useEffect, useState } from 'react';
import { historyApi } from '../../api/client';
import { toUiWord } from '../../api/adapters';
import { usableWords } from './practiceLogic';

/** Nạp các từ người dùng đã học (tối đa 100) để làm tài liệu luyện tập. */
export default function usePracticePool() {
  const [state, setState] = useState({ loading: true, error: '', words: [] });
  useEffect(() => {
    let alive = true;
    historyApi.words(1, 100)
      .then((res) => alive && setState({ loading: false, error: '', words: usableWords((res.words || []).map(toUiWord)) }))
      .catch((e) => alive && setState({ loading: false, error: e?.message || 'Không tải được danh sách từ.', words: [] }));
    return () => { alive = false; };
  }, []);
  return state;
}
