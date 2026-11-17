# app/routes/game.py - game flappy từ vựng: server chấm điểm từ nhật ký trả lời + bảng xếp hạng (tuần / mọi thời đại)
import uuid
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Word, UserWord, Folder, FolderWord
from app.models.game_runs import GameRun
from app.models.learning_logs import VN_TZ
from app.utils.game_score import score_run, RunError, max_score, tier_of
from app.utils.leaderboard import week_start_utc, rank
from app.utils.middleware import token_required

bp = Blueprint('game', __name__, url_prefix='/api/game/flappy')
GAME = 'flappy'
MAX_RUNS_PER_DAY = 30
TOP_N = 50


def _bad(msg, code=400):
    return jsonify({'message': msg}), code


def _validate(body):
    """Trả thông báo lỗi (tiếng Việt) nếu payload sai hình dạng, ngược lại None."""
    if not isinstance(body, dict):
        return 'Dữ liệu gửi lên không hợp lệ.'
    answers = body.get('answers')
    if not isinstance(answers, list) or not answers:
        return 'Chưa có câu trả lời nào.'
    for a in answers:
        if not isinstance(a, dict):
            return 'Câu trả lời không hợp lệ.'
        if not all(isinstance(a.get(k), str) for k in ('word_id', 'dir', 'choice')):
            return 'Câu trả lời không hợp lệ.'
        t = a.get('t_ms')
        if not isinstance(t, int) or isinstance(t, bool):
            return 'Thời gian trả lời không hợp lệ.'
    fid = body.get('folder_id')
    if fid is not None and not isinstance(fid, str):
        return 'Thư mục không hợp lệ.'
    return None


def _board(period):
    """Mỗi người một hàng với ván điểm cao nhất, đã xếp hạng (cùng điểm cùng hạng)."""
    f = [GameRun.game == GAME]
    if period == 'week':
        f.append(GameRun.created_at >= week_start_utc(datetime.now(VN_TZ)))
    best = db.session.query(GameRun.user_id.label('uid'), db.func.max(GameRun.score).label('s')).filter(*f).group_by(GameRun.user_id).subquery()
    q = (db.session.query(User.id, User.username, GameRun.score, db.func.max(GameRun.correct))
         .join(best, db.and_(GameRun.user_id == best.c.uid, GameRun.score == best.c.s))
         .join(User, User.id == GameRun.user_id).filter(*f)
         .group_by(User.id, User.username, GameRun.score))
    # shortcut: xếp hạng toàn bộ người chơi trong Python, đổi sang cửa sổ SQL khi hàng chục nghìn người chơi
    return rank([{'id': i, 'username': n, 'points': s, 'correct': c} for i, n, s, c in q.all()])


@bp.route('/runs', methods=['POST'])
@token_required
def submit_run():
    body = request.get_json(silent=True)
    err = _validate(body)
    if err:
        return _bad(err)
    uid, answers, folder_id = request.user_id, body['answers'], body.get('folder_id')

    day_start = (datetime.now(VN_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
                 .astimezone(timezone.utc).replace(tzinfo=None))
    if GameRun.query.filter(GameRun.user_id == uid, GameRun.game == GAME, GameRun.created_at >= day_start).count() >= MAX_RUNS_PER_DAY:
        return _bad(f'Hôm nay bạn đã chơi tối đa {MAX_RUNS_PER_DAY} ván. Mai quay lại nhé!', 429)

    in_folder = set()
    if folder_id is not None:
        folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
        if folder is None:
            return _bad('Không tìm thấy thư mục.', 404)
        if folder.type != 'system' and folder.user_id != uid:
            return _bad('Bạn không có quyền dùng thư mục này.', 403)
        in_folder = {w for (w,) in db.session.query(FolderWord.word_id).filter(FolderWord.folder_id == folder_id)}
    ids = {a['word_id'] for a in answers}
    learned = {w for (w,) in db.session.query(UserWord.word_id).filter(
        UserWord.user_id == uid, UserWord.level >= 1, UserWord.word_id.in_(ids))}
    # từ rỗng word/meaning bị loại để lựa chọn rỗng không thể "đúng"
    words = {w.id: w for w in Word.query.filter(Word.id.in_(ids), Word.deleted_at == None).all()  # noqa: E711
             if (w.id in learned or w.id in in_folder) and (w.word or '').strip() and (w.meaning or '').strip()}
    try:
        res = score_run(answers, words)
    except RunError as e:
        return _bad(e.message)

    db.session.add(GameRun(id=str(uuid.uuid4()), user_id=uid, game=GAME, score=res['score'], answered=res['answered'],
                           correct=res['correct'], duration_ms=answers[-1]['t_ms'], folder_id=folder_id))
    db.session.commit()
    mine = lambda p: next((r['rank'] for r in _board(p) if r['id'] == uid), None)  # noqa: E731
    return jsonify({**res, 'max_score': max_score([tier_of(words[a['word_id']].difficulty) for a in answers]),
                    'rank_week': mine('week'), 'rank_all': mine('all')}), 201


@bp.route('/leaderboard', methods=['GET'])
@token_required
def leaderboard():
    period = request.args.get('period', 'week')
    if period not in ('week', 'all'):
        return _bad('Khoảng thời gian không hợp lệ.')
    board = _board(period)
    rows = [{'rank': r['rank'], 'username': r['username'], 'score': r['points'], 'correct': r['correct'],
             'is_me': r['id'] == request.user_id} for r in board[:TOP_N]]
    me = next(({'rank': r['rank'], 'score': r['points']} for r in board if r['id'] == request.user_id), None)
    return jsonify({'period': period, 'rows': rows, 'me': me}), 200
