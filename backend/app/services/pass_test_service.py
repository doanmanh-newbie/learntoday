"""STT 16 - Kiểm tra Pass: tạo mốc khi đạt 50, 100, 150... từ."""
from datetime import datetime, timedelta
import uuid

from app import db
from app.models import UserMilestone

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
        db.session.commit()

    return milestones_created


def get_passage_for_milestone(milestone: int):
    """Bài đọc hiểu mẫu cho bài kiểm tra Pass."""
    return {
        'passage': (
            f'Reaching {milestone} words is a significant achievement in language learning. '
            'Consistent daily practice helps move vocabulary from short-term to long-term memory. '
            'Reading regularly exposes you to words in context, which strengthens comprehension. '
            'Review sessions using spaced repetition ensure that learned words are not forgotten. '
            'Setting realistic goals and tracking progress keeps motivation high over time.'
        ),
        'questions': [
            {
                'id': 'q1',
                'question': 'What helps move vocabulary to long-term memory?',
                'options': ['Consistent daily practice', 'Skipping reviews', 'Learning once only', 'Avoiding reading'],
                'correct_index': 0,
                'explanation': 'Daily practice reinforces memory over time.',
            },
            {
                'id': 'q2',
                'question': 'What does reading regularly provide?',
                'options': ['Words in isolation', 'Words in context', 'No benefit', 'Only grammar'],
                'correct_index': 1,
                'explanation': 'Context helps understand word usage.',
            },
            {
                'id': 'q3',
                'question': 'What is spaced repetition used for?',
                'options': ['Forgetting words', 'Ensuring words are not forgotten', 'Speed reading', 'Translation'],
                'correct_index': 1,
                'explanation': 'SRS schedules reviews before you forget.',
            },
            {
                'id': 'q4',
                'question': 'What keeps motivation high?',
                'options': ['No goals', 'Random study', 'Setting goals and tracking progress', 'Avoiding tests'],
                'correct_index': 2,
                'explanation': 'Goals and progress tracking boost motivation.',
            },
            {
                'id': 'q5',
                'question': 'What milestone does this test celebrate?',
                'options': [str(milestone - 50), str(milestone), str(milestone + 50), '1000'],
                'correct_index': 1,
                'explanation': f'This test is for the {milestone}-word milestone.',
            },
        ],
        'time_limit_minutes': 15,
    }
