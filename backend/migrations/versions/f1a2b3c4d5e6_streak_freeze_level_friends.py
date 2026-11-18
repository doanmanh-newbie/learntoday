"""streak freeze, ngày test trình độ, bảng bạn bè

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-11-13 10:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('streak_freezes', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('level_tested_at', sa.DateTime(), nullable=True))
    op.create_table(
        'friendships',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('friend_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('user_id', 'friend_id', name='uq_friendship_pair'),
    )
    op.create_index('ix_friendships_user_id', 'friendships', ['user_id'])


def downgrade():
    op.drop_index('ix_friendships_user_id', table_name='friendships')
    op.drop_table('friendships')
    op.drop_column('users', 'level_tested_at')
    op.drop_column('users', 'streak_freezes')
