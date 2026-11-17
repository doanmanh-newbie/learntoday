"""game_runs: ván game flappy đã chấm điểm phía server

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-11-17 10:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'b8c9d0e1f2a3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'game_runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('game', sa.String(20), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('answered', sa.Integer(), nullable=False),
        sa.Column('correct', sa.Integer(), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('folder_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_game_runs_game_created', 'game_runs', ['game', 'created_at'])
    op.create_index('idx_game_runs_user_created', 'game_runs', ['user_id', 'created_at'])


def downgrade():
    op.drop_index('idx_game_runs_user_created', table_name='game_runs')
    op.drop_index('idx_game_runs_game_created', table_name='game_runs')
    op.drop_table('game_runs')
