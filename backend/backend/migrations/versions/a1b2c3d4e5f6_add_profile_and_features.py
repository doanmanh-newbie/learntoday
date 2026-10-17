"""add last_goal_date, tts_voice, badges, search_history, user_milestones

Revision ID: a1b2c3d4e5f6
Revises: 3070f14623ed
Create Date: 2026-08-12 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '3070f14623ed'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('last_goal_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('tts_voice', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('badges', sa.Text(), nullable=True))

    op.create_table('search_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('query', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('user_milestones',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('milestone', sa.Integer(), nullable=False),
        sa.Column('reached_at', sa.DateTime(), nullable=False),
        sa.Column('test_available_at', sa.DateTime(), nullable=False),
        sa.Column('tested_at', sa.DateTime(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'milestone', name='uq_user_milestone')
    )


def downgrade():
    op.drop_table('user_milestones')
    op.drop_table('search_history')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('badges')
        batch_op.drop_column('tts_voice')
        batch_op.drop_column('last_goal_date')
