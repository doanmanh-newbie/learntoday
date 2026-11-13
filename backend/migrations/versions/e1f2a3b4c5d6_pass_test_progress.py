"""user_milestones: đồng hồ 15 phút + lưu tiến độ bài kiểm tra Pass

Revision ID: e1f2a3b4c5d6
Revises: c9d8e7f6a5b4
Create Date: 2026-11-09 09:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'e1f2a3b4c5d6'
down_revision = 'c9d8e7f6a5b4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user_milestones', sa.Column('started_at', sa.DateTime(), nullable=True))
    op.add_column('user_milestones', sa.Column('time_spent_seconds', sa.Integer(), server_default='0', nullable=False))
    op.add_column('user_milestones', sa.Column('session_started_at', sa.DateTime(), nullable=True))
    op.add_column('user_milestones', sa.Column('last_activity_at', sa.DateTime(), nullable=True))
    op.add_column('user_milestones', sa.Column('saved_answers', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('user_milestones', 'saved_answers')
    op.drop_column('user_milestones', 'last_activity_at')
    op.drop_column('user_milestones', 'session_started_at')
    op.drop_column('user_milestones', 'time_spent_seconds')
    op.drop_column('user_milestones', 'started_at')
