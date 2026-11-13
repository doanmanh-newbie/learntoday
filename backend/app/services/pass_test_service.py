"""STT 16 - Kiểm tra Pass: tạo mốc khi đạt 50, 100, 150... từ."""
from datetime import datetime, timedelta
import uuid

from app import db
from app.models import UserMilestone
from app.services.pass_test_logic import get_passage_for_milestone, grade_test, public_test  # noqa: F401  (giữ đường import cũ)

MILESTONE_STEP = 50
TEST_WAIT_HOURS = 24


def check_and_create_milestones(user_id: str, total_words: int):
    """Tạo milestone mới nếu user vượt mốc 50 từ."""
    milestones_created = []
    current_milestone = (total_words // MILESTONE_STEP) * MILESTONE_STEP

    if current_milestone < MILESTONE_STEP:
        return milestones_created

    for milestone in range(MILESTONE_STEP, current_milestone + 1, MILESTONE_STEP):
        existing = UserMilestone.query.filter_by(
            user_id=user_id,
            milestone=milestone
        ).first()
        if existing:
            continue

        record = UserMilestone(
            id=str(uuid.uuid4()),
            user_id=user_id,
            milestone=milestone,
            reached_at=datetime.utcnow(),
            test_available_at=datetime.utcnow() + timedelta(hours=TEST_WAIT_HOURS),
        )
        db.session.add(record)
        milestones_created.append(milestone)

    if milestones_created:
        db.session.flush()       # KHÔNG commit ở đây: caller commit cả transaction 1 lần (nguyên tử)

    return milestones_created
